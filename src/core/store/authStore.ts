import { create } from 'zustand'
import type {
  AuthUser,
  LoginFormData,
  UserRole,
} from '@/modules/auth/domain/auth.types'

// Lazy import para romper la circular: authStore → apiClient → authStore
const getAuthService = () =>
  import('@/modules/auth/services/authService').then((m) => m.authService)

const TOKEN_KEY = 'cda_auth_token'
const REFRESH_KEY = 'cda_auth_refresh'
const USER_KEY = 'cda_auth_user'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  requireReauth: boolean
  setRequireReauth: (v: boolean) => void
  login: (token: string, user: AuthUser, refreshToken?: string) => void
  loginWithCredentials: (credentials: LoginFormData) => Promise<void>
  loginAsDemo: (role?: UserRole) => void
  logout: () => Promise<void>
  clearError: () => void
}

// ── Helpers de almacenamiento ─────────────────────────────────────────────────

const storage = {
  getItem: (key: string) =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(key)
  },
}

const getStoredToken = () => storage.getItem(TOKEN_KEY)
const getStoredRefresh = () => storage.getItem(REFRESH_KEY)

const getStoredUser = (): AuthUser | null => {
  const raw = storage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    storage.removeItem(USER_KEY)
    return null
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => {
  const token = getStoredToken()
  const refreshToken = getStoredRefresh()
  const user = getStoredUser()

  return {
    token,
    refreshToken,
    user,
    isAuthenticated: Boolean(token),
    isLoading: false,
    error: null,
    requireReauth: false,
    setRequireReauth: (v: boolean) => set({ requireReauth: v }),

    login: (newToken, newUser, newRefresh) => {
      storage.setItem(TOKEN_KEY, newToken)
      storage.setItem(USER_KEY, JSON.stringify(newUser))
      if (newRefresh) storage.setItem(REFRESH_KEY, newRefresh)
      set({
        token: newToken,
        refreshToken: newRefresh ?? null,
        user: newUser,
        isAuthenticated: true,
        error: null,
      })
    },

    loginWithCredentials: async (credentials: LoginFormData) => {
      set({ isLoading: true, error: null })
      try {
        const svc = await getAuthService()
        const response = await svc.login(credentials)

        if (!response.token) {
          throw new Error('El servidor no devolvió un token de acceso.')
        }
        if (!response.user) {
          throw new Error(
            'No se pudo determinar el rol del usuario. Contacte al administrador.',
          )
        }

        storage.setItem(TOKEN_KEY, response.token)
        storage.setItem(USER_KEY, JSON.stringify(response.user))
        if (response.refreshToken) {
          storage.setItem(REFRESH_KEY, response.refreshToken)
        }

        set({
          token: response.token,
          refreshToken: response.refreshToken,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido'
        set({ isLoading: false, error: errorMessage })
        throw err
      }
    },

    loginAsDemo: (role: UserRole = 'OPERARIO') => {
      const demoUser: AuthUser = {
        id: 'demo-user',
        name: 'Usuario Demo CDA',
        role,
      }
      const demoToken = 'demo-token-web'
      storage.setItem(TOKEN_KEY, demoToken)
      storage.setItem(USER_KEY, JSON.stringify(demoUser))
      set({
        token: demoToken,
        refreshToken: null,
        user: demoUser,
        isAuthenticated: true,
        error: null,
      })
    },

    logout: async () => {
      try {
        const svc = await getAuthService()
        // Enviar el refreshToken al backend para invalidar la sesión en servidor
        const rt = getStoredRefresh()
        await svc.logout(rt)
      } catch {
        // Ignorar errores de red — el logout local siempre procede
      }
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(REFRESH_KEY)
      storage.removeItem(USER_KEY)
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        requireReauth: false,
        error: null,
      })
    },

    clearError: () => {
      set({ error: null })
    },
  }
})
