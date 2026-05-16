import { apiClient } from '@/core/api/apiClient'
import type { AuthUser, LoginFormData } from '@/modules/auth/domain/auth.types'

// ── Tipos internos ────────────────────────────────────────────────────────────

interface LoginResponse {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
}

type JwtPayload = Record<string, unknown>

// ── Helpers JWT ───────────────────────────────────────────────────────────────

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

/**
 * Extrae AuthUser desde el payload del JWT.
 * El JWT del backend contiene: { sub, id, email, role, iat, exp }
 */
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

  if (!resolvedRole) return null

  const id = payload['sub'] ?? payload['id'] ?? payload['userId'] ?? null
  // El JWT del backend no tiene name; usar email como display name
  const name = String(
    payload['name'] ?? payload['preferred_username'] ?? payload['email'] ?? '',
  )

  return {
    id: id != null ? String(id) : name,
    name,
    role: resolvedRole.toUpperCase() as AuthUser['role'],
  }
}

// ── Servicio de autenticación ─────────────────────────────────────────────────

export const authService = {
  /**
   * POST /auth/login
   * Envelope de respuesta: { statusCode, message, data: { accessToken, refreshToken } }
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      const body = response.data as Record<string, unknown>

      // Soporta envelope { data: { accessToken } } y respuesta plana
      const inner =
        body['data'] && typeof body['data'] === 'object'
          ? (body['data'] as Record<string, unknown>)
          : body

      const token =
        (inner['accessToken'] as string) ||
        (inner['access_token'] as string) ||
        (inner['token'] as string) ||
        null

      const refreshToken =
        (inner['refreshToken'] as string) ||
        (inner['refresh_token'] as string) ||
        null

      let user: AuthUser | null = null
      if (inner['user']) user = inner['user'] as AuthUser
      else if (token) user = extractUserFromToken(token)

      return { token, refreshToken, user }
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

  /**
   * POST /auth/logout
   * El backend espera: { refreshToken: string }
   */
  async logout(refreshToken?: string | null): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {
        refreshToken: refreshToken ?? '',
      })
    } catch {
      // Ignorar errores — el logout local siempre procede
    }
  },

  /**
   * POST /auth/refresh
   * Renueva el accessToken usando el refreshToken.
   * Retorna el nuevo accessToken o null si falla.
   */
  async refresh(refreshToken: string): Promise<string | null> {
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken })
      const body = response.data as Record<string, unknown>
      const inner =
        body['data'] && typeof body['data'] === 'object'
          ? (body['data'] as Record<string, unknown>)
          : body
      return (inner['accessToken'] as string) || null
    } catch {
      return null
    }
  },

  /**
   * POST /auth/validate-token
   * Valida si el token JWT actual es válido en el servidor.
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await apiClient.post('/auth/validate-token', { token })
      return true
    } catch {
      return false
    }
  },
}
