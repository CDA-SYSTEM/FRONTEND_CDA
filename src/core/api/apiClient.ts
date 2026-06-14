import axios from 'axios'
import { API_BASE_URL, API_KEY_FRONT } from '@/core/api/apiConfig'
import { useAuthStore } from '@/core/store/authStore'
import { offlineStorage } from '@/core/services/offlineStorage'
import { useToastStore } from '@/core/store/toastStore'

const METODOS_MUTACION = ['post', 'patch', 'put', 'delete'] as const

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

/* ── Estado de conectividad ── */

export function estaOnline(): boolean {
  return navigator.onLine
}

type Listener = (online: boolean) => void
const listeners = new Set<Listener>()

export function suscribirConectividad(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function notificar(online: boolean) {
  listeners.forEach((fn) => fn(online))
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notificar(true))
  window.addEventListener('offline', () => notificar(false))
}

/* ── Sincronización ── */

let sincronizando = false
const sincronizarListeners = new Set<() => void>()

export function suscribirSincronizacion(fn: () => void): () => void {
  sincronizarListeners.add(fn)
  return () => { sincronizarListeners.delete(fn) }
}

export async function sincronizar(): Promise<void> {
  if (sincronizando || !navigator.onLine) return
  sincronizando = true
  try {
    const cola = await offlineStorage.obtenerCola()
    for (const item of cola) {
      try {
        const payload = item.payload && typeof item.payload === 'object'
          ? item.payload
          : {}
        await apiClient({
          method: item.method,
          url: item.endpoint,
          data: payload,
          headers: { 'Content-Type': 'application/json' },
        })
        if (item.id !== undefined) {
          await offlineStorage.eliminarDeCola(item.id)
        }
      } catch {
        // Si uno falla, detener la sincronización (probablemente aún offline o error del servidor)
        break
      }
    }
    sincronizarListeners.forEach((fn) => fn())
  } finally {
    sincronizando = false
  }
}

/* ── Interceptor de autenticación ── */

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  const apiKey = API_KEY_FRONT

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (apiKey) {
    config.headers['x-api-key'] = apiKey
    config.headers['X-API-Key'] = apiKey
  }

  return config
})


/* ── Refresh token queue ── */

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/* ── Interceptor de respuesta ── */

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // HU-037: Sin conexión — encolar mutación y responder como éxito local
    // EXCLUIR rutas de autenticación: el login nunca debe encolarse como offline
    const isAuthRoute = originalRequest?.url?.includes('/auth/')
    if (!error.response && originalRequest && !isAuthRoute) {
      const method = (originalRequest.method || '').toLowerCase()
      if (METODOS_MUTACION.includes(method as typeof METODOS_MUTACION[number])) {
        let payload: unknown = undefined
        if (originalRequest.data) {
          try {
            payload = typeof originalRequest.data === 'string'
              ? JSON.parse(originalRequest.data)
              : originalRequest.data
          } catch {
            payload = originalRequest.data
          }
        }
        await offlineStorage.encolar(
          originalRequest.url || '',
          method.toUpperCase() as 'POST' | 'PATCH' | 'PUT' | 'DELETE',
          payload,
        )
        return Promise.resolve({ data: { __offline: true } })
      }
    }


    // Evitar loop infinito si la ruta de refresh, login o logout devuelve 401
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/logout')
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const authStore = useAuthStore.getState()
      const refreshToken = authStore.refreshToken

      if (!refreshToken) {
        processQueue(error, null)
        try { await authStore.logout() } catch { /* ignore */ }
        isRefreshing = false
        if (!window.location.pathname.startsWith('/login')) {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.href = `/login?onreturn=${returnTo}`
        }
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: API_KEY_FRONT ? { 'X-API-Key': API_KEY_FRONT } : undefined,
          },
        )

        const body = response.data
        const inner = body.data && typeof body.data === 'object' ? body.data : body
        const newAccessToken = inner.accessToken || inner.access_token || inner.token
        const newRefreshToken = inner.refreshToken || inner.refresh_token || refreshToken

        if (!newAccessToken) {
          throw new Error('No access token returned')
        }

        const currentUser = authStore.user
        authStore.login(
          newAccessToken,
          currentUser ?? { id: '', name: '', role: 'operario' },
          newRefreshToken,
        )

        processQueue(null, newAccessToken)
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err, null)
        try { await authStore.logout() } catch { /* ignore */ }
        if (!window.location.pathname.startsWith('/login')) {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.href = `/login?onreturn=${returnTo}`
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status !== 401 && error.code !== 'ERR_CANCELED') {
      const data = error.response?.data
      let mensajeError = 'Ha ocurrido un error en el servidor.'

      if (data) {
        if (typeof data.message === 'string') {
          mensajeError = data.message
        } else if (Array.isArray(data.message)) {
          mensajeError = data.message.join(', ')
        } else if (data.error) {
          mensajeError = data.error
        }
      } else if (error.message) {
        mensajeError = error.message
      }

      useToastStore.getState().addToast(mensajeError, 'error')
    }

    return Promise.reject(error)
  },
)
