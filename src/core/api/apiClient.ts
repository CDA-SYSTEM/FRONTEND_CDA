import axios from 'axios'
import { useAuthStore } from '@/core/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  const apiKey = import.meta.env.VITE_API_KEY_FRONT

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }

  return config
})

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

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
        authStore.logout()
        isRefreshing = false
        return Promise.reject(error)
      }

      try {
        // Usamos axios directamente para no pasar por los interceptores y evitar loops
        const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        })

        const body = response.data
        const inner = body.data && typeof body.data === 'object' ? body.data : body
        const newAccessToken = inner.accessToken || inner.access_token || inner.token
        const newRefreshToken = inner.refreshToken || inner.refresh_token || refreshToken

        if (!newAccessToken) {
          throw new Error('No access token returned')
        }

        // Actualizamos el store (preservando el usuario actual)
        if (authStore.user) {
          authStore.login(newAccessToken, authStore.user, newRefreshToken)
        }

        processQueue(null, newAccessToken)
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err, null)
        authStore.logout()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
