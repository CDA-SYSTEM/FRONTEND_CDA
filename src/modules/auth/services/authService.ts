import { apiClient } from '@/core/api/apiClient'
import type { AuthUser, LoginFormData } from '@/modules/auth/domain/auth.types'

interface LoginResponse {
  token: string | null
  user: AuthUser | null
}

type JwtPayload = Record<string, unknown>

function safeJsonBase64Decode(str: string): JwtPayload | null {
  try {
    const s = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = s.length % 4
    const padded = pad === 0 ? s : s + '='.repeat(4 - pad)
    const decoded = atob(padded)
    return JSON.parse(decoded) as JwtPayload
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

  const rawRole = payload['role'] ?? payload['roles'] ?? null
  let resolvedRole: string | undefined
  if (Array.isArray(rawRole)) resolvedRole = String(rawRole[0])
  else if (typeof rawRole === 'string') resolvedRole = rawRole

  const id = payload['sub'] ?? payload['id'] ?? payload['userId'] ?? null
  const name = String(
    payload['name'] ?? payload['preferred_username'] ?? payload['email'] ?? '',
  )

  if (!resolvedRole) return null

  return {
    id: id != null ? String(id) : name,
    name,
    role: resolvedRole.toUpperCase() as AuthUser['role'],
  }
}

export const authService = {
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })
      const data = response.data as Record<string, unknown>
      const token =
        (data.token as string) ||
        (data.accessToken as string) ||
        (data.access_token as string) ||
        null
      let user: AuthUser | null = null
      if (data.user) user = data.user as AuthUser
      else if (token) user = extractUserFromToken(token)
      return { token, user }
    } catch (error: unknown) {
      const e = error as { response?: { status?: number }; message?: string }
      if (e.response?.status === 401 || e.response?.status === 400) {
        throw new Error(
          'Credenciales inválidas. Verifique su email y contraseña.',
        )
      }
      if (e.response?.status === 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.')
      }
      throw new Error(
        e.message || 'Error al iniciar sesión. Por favor, intente de nuevo.',
      )
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignorar errores
    }
  },
}
