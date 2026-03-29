import { create } from 'zustand'
import type { AuthUser, UserRole } from '@/modules/auth/types/auth.types'

const TOKEN_KEY = 'cda_auth_token'
const USER_KEY = 'cda_auth_user'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, user: AuthUser) => void
  loginAsDemo: (role?: UserRole) => void
  logout: () => void
}

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

export const useAuthStore = create<AuthState>((set) => {
  const token = getStoredToken()
  const user = getStoredUser()

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    login: (newToken, newUser) => {
      storage.setItem(TOKEN_KEY, newToken)
      storage.setItem(USER_KEY, JSON.stringify(newUser))
      set({ token: newToken, user: newUser, isAuthenticated: true })
    },
    loginAsDemo: (role = 'RECEPCIONISTA') => {
      const demoUser: AuthUser = {
        id: 'demo-user',
        name: 'Usuario Demo CDA',
        role,
      }

      const demoToken = 'demo-token-web'
      storage.setItem(TOKEN_KEY, demoToken)
      storage.setItem(USER_KEY, JSON.stringify(demoUser))

      set({ token: demoToken, user: demoUser, isAuthenticated: true })
    },
    logout: () => {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(USER_KEY)
      set({ token: null, user: null, isAuthenticated: false })
    },
  }
})
