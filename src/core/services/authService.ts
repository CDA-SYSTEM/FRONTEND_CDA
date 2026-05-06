import { apiClient } from '@/core/api/apiClient'
import type { AuthUser, LoginFormData } from '@/modules/auth/types/auth.types'

interface LoginResponse {
  token: string
  user: AuthUser | null
}

function safeJsonBase64Decode(str: string) {
  try {
    // add padding if necessary
    const s = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = s.length % 4
    const padded = pad === 0 ? s : s + '='.repeat(4 - pad)
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function extractUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  const payload = safeJsonBase64Decode(parts[1])
  if (!payload) return null

  // Try common claim names for role and user info
  const role =
    payload.role || payload.roles || payload['role'] || payload['roles'] || null

  let resolvedRole: string | undefined
  if (Array.isArray(role)) resolvedRole = role[0]
  else if (typeof role === 'string') resolvedRole = role

  const id = payload.sub || payload.id || payload.userId || null
  const name = payload.name || payload.preferred_username || payload.email || ''

  if (!resolvedRole) return null

  return {
    id: id ?? String(name),
    name: String(name),
    role: String(resolvedRole).toUpperCase() as any,
  }
}

export const authService = {
  /**
   * Autentica el usuario contra el endpoint /auth/login
   * @param credentials - email y password del usuario
   * @returns token y datos del usuario
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      const data = response.data as any

      // Normalize token field (support accessToken / token / access_token)
      const token = data.token || data.accessToken || data.access_token || null

      // If backend returned explicit user, use it. Otherwise try to decode token.
      let user: AuthUser | null = null
      if (data.user) user = data.user
      else if (token) user = extractUserFromToken(token)

      return { token, user }
    } catch (error: any) {
      // Error genérico sin revelar si el usuario existe
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw new Error('Credenciales inválidas. Verifique su email y contraseña.')
      }

      if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.')
      }

      throw new Error(
        error.message || 'Error al iniciar sesión. Por favor, intente de nuevo.'
      )
    }
  },

  /**
   * Logout - simplemente se hace client-side borrando el token
   * (el backend puede invalidar sesión si es necesario)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (err) {
      // Ignorar errores; el logout debe limpiar el cliente incluso si el servidor falla
    }
  },
}
