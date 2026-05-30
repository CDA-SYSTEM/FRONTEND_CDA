import { apiClient } from '@/core/api/apiClient'
import { extractApiData, extractApiArray } from '@/core/api/extractApiData'
import type { AuthUser, LoginFormData } from '@/modules/auth/domain/auth.types'

interface LoginResponse {
  token: string | null
  refreshToken: string | null
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

  if (!resolvedRole) return null

  const id = payload['sub'] ?? payload['id'] ?? payload['userId'] ?? null
  const name = String(
    payload['name'] ?? payload['preferred_username'] ?? payload['email'] ?? '',
  )

  return {
    id: id != null ? String(id) : name,
    name,
    role: resolvedRole.toUpperCase() as AuthUser['role'],
  }
}

function mapMeToAuthUser(raw: Record<string, unknown>): AuthUser {
  const firstName = raw['firstName'] != null ? String(raw['firstName']) : ''
  const lastName = raw['lastName'] != null ? String(raw['lastName']) : ''
  const name =
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    String(raw['email'] ?? '')

  return {
    id: String(raw['id']),
    name,
    role: String(raw['role']).toUpperCase() as AuthUser['role'],
  }
}

function unwrapTokens(body: Record<string, unknown>): {
  accessToken: string | null
  refreshToken: string | null
} {
  const inner =
    body['data'] && typeof body['data'] === 'object'
      ? (body['data'] as Record<string, unknown>)
      : body

  return {
    accessToken:
      (inner['accessToken'] as string) ||
      (inner['access_token'] as string) ||
      (inner['token'] as string) ||
      null,
    refreshToken:
      (inner['refreshToken'] as string) ||
      (inner['refresh_token'] as string) ||
      null,
  }
}

export const authService = {
  /**
   * POST /auth/login — respuesta: { data: { accessToken, refreshToken } }
   * El perfil se obtiene con GET /auth/me.
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      const body = response.data as Record<string, unknown>
      const { accessToken, refreshToken } = unwrapTokens(body)

      let user: AuthUser | null = null
      if (accessToken) {
        user = await this.getMe(accessToken)
      }
      if (!user && accessToken) {
        user = extractUserFromToken(accessToken)
      }

      return { token: accessToken, refreshToken, user }
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
   * GET /auth/me — perfil del usuario autenticado (cualquier rol).
   */
  async getMe(accessToken?: string): Promise<AuthUser | null> {
    try {
      const response = await apiClient.get('/auth/me', {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      })
      const data = extractApiData<Record<string, unknown>>(response.data)
      if (!data || typeof data !== 'object') return null
      return mapMeToAuthUser(data)
    } catch {
      return null
    }
  },

  async logout(refreshToken?: string | null): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {
        refreshToken: refreshToken ?? '',
      })
    } catch {
      // logout local siempre procede
    }
  },

  /**
   * POST /auth/refresh
   */
  async refresh(refreshToken: string): Promise<{
    accessToken: string | null
    refreshToken: string | null
  }> {
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken })
      const body = response.data as Record<string, unknown>
      return unwrapTokens(body)
    } catch {
      return { accessToken: null, refreshToken: null }
    }
  },

  /**
   * POST /auth/validate-token — { data: { valid, roles, userId } }
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/validate-token', { token })
      const data = extractApiData<{ valid?: boolean }>(response.data)
      return Boolean(data?.valid)
    } catch {
      return false
    }
  },

  /**
   * PATCH /auth/change-password
   */
  async cambiarPassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.patch('/auth/change-password', {
      oldPassword,
      newPassword,
    })
  },

  /**
   * GET /auth/roles
   */
  async obtenerRoles(): Promise<{ code: string; name: string }[]> {
    const response = await apiClient.get('/auth/roles')
    const raw = extractApiArray(response.data)
    return raw.map((r) => {
      const obj = r as Record<string, unknown>
      return {
        code: String(obj.code ?? obj.id ?? ''),
        name: String(obj.scope ?? obj.code ?? ''),
      }
    })
  },
}
