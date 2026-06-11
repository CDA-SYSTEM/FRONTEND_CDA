import { apiClient } from '@/core/api/apiClient'
import { extractApiData, extractApiArray } from '@/core/api/extractApiData'
import type { AuthUser, LoginFormData } from '@/modules/auth/domain/auth.types'

interface LoginResponse {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
}

type JwtPayload = Record<string, unknown>

function unwrapMaybeNestedRecord(value: unknown, depth = 0): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 5) return null

  const record = value as Record<string, unknown>
  if (
    'accessToken' in record ||
    'access_token' in record ||
    'refreshToken' in record ||
    'refresh_token' in record ||
    'token' in record ||
    'jwt' in record
  ) {
    return record
  }

  for (const nestedValue of Object.values(record)) {
    const nested = unwrapMaybeNestedRecord(nestedValue, depth + 1)
    if (nested) return nested
  }

  return record
}

function readStringFromCandidates(
  value: unknown,
  candidates: string[],
  depth = 0,
): string | null {
  if (!value || typeof value !== 'object' || depth > 4) return null

  const record = value as Record<string, unknown>
  for (const candidate of candidates) {
    const candidateValue = record[candidate]
    if (typeof candidateValue === 'string' && candidateValue.trim()) {
      return candidateValue
    }
  }

  for (const nestedValue of Object.values(record)) {
    const found = readStringFromCandidates(nestedValue, candidates, depth + 1)
    if (found) return found
  }

  return null
}

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
    role: resolvedRole.toLowerCase() as AuthUser['role'],
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
    role: String(raw['role']).toLowerCase() as AuthUser['role'],
  }
}

function unwrapTokens(body: Record<string, unknown>): {
  accessToken: string | null
  refreshToken: string | null
} {
  const inner = unwrapMaybeNestedRecord(body['data']) ?? body

  return {
    accessToken:
      readStringFromCandidates(inner, [
        'accessToken',
        'access_token',
        'token',
        'jwt',
      ]) ?? null,
    refreshToken:
      readStringFromCandidates(inner, [
        'refreshToken',
        'refresh_token',
        'refresh',
      ]) ?? null,
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

      if (!accessToken) {
        const keys = Object.keys(body).join(', ')
        const dataKeys = body['data'] && typeof body['data'] === 'object'
          ? Object.keys(body['data'] as object).join(', ')
          : 'N/A'
        throw new Error(
          `El servidor respondió pero sin token. Campos raíz: [${keys}]. Campos en data: [${dataKeys}]`
        )
      }

      let user: AuthUser | null = null
      if (accessToken) {
        user = await this.getMe(accessToken)
      }
      if (!user && accessToken) {
        user = extractUserFromToken(accessToken)
      }

      return { token: accessToken, refreshToken, user }
    } catch (error: unknown) {
      const e = error as { response?: { status?: number; data?: unknown }; message?: string; code?: string }
      if (!e.response) {
        // Error de red — no se pudo conectar al servidor
        throw new Error(
          `No se pudo conectar al servidor. Verifique su conexión a internet. (${e.message ?? e.code ?? 'Network Error'})`
        )
      }
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
  async cambiarPassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.patch('/auth/change-password', {
      currentPassword,
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
      const codeStr = String(obj.code ?? obj.id ?? '')
      return {
        code: codeStr,
        name: codeStr.toUpperCase(),
      }
    })
  },

  /**
   * POST /auth/oauth/google — respuesta: { data: { accessToken, refreshToken } }
   * Envia el id_token de Google y devuelve la sesión de usuario.
   */
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/oauth/google', {
        id_token: idToken,
      })

      const body = response.data as Record<string, unknown>
      const { accessToken, refreshToken } = unwrapTokens(body)

      if (!accessToken) {
        const keys = Object.keys(body).join(', ')
        const dataKeys = body['data'] && typeof body['data'] === 'object'
          ? Object.keys(body['data'] as object).join(', ')
          : 'N/A'
        throw new Error(
          `El servidor respondió pero sin token. Campos raíz: [${keys}]. Campos en data: [${dataKeys}]`
        )
      }

      let user: AuthUser | null = null
      if (accessToken) {
        user = await this.getMe(accessToken)
      }
      if (!user && accessToken) {
        user = extractUserFromToken(accessToken)
      }

      return { token: accessToken, refreshToken, user }
    } catch (error: unknown) {
      const e = error as { response?: { status?: number; data?: unknown }; message?: string; code?: string }
      if (!e.response) {
        throw new Error(
          `No se pudo conectar al servidor. Verifique su conexión a internet. (${e.message ?? e.code ?? 'Network Error'})`
        )
      }
      if (e.response?.status === 401 || e.response?.status === 400) {
        throw new Error(
          'Autenticación con Google fallida o token rechazado.',
        )
      }
      if (e.response?.status === 500) {
        throw new Error('Error del servidor al autenticar con Google.')
      }
      throw new Error(
        e.message || 'Error al iniciar sesión con Google.',
      )
    }
  },
}

