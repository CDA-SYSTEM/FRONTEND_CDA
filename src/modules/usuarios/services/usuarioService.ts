import { apiClient } from '@/core/api/apiClient'
import type {
  ActualizarUsuarioDTO,
  CrearUsuarioDTO,
  RolUsuario,
  RolUsuarioForm,
  Usuario,
} from '@/modules/usuarios/domain/usuario.types'

// ── Helpers de normalización ──────────────────────────────────────────────────

function normalizeRole(role: string): RolUsuario {
  return role.toUpperCase() as RolUsuario
}

function toFormRole(role: RolUsuario): RolUsuarioForm {
  return role.toLowerCase() as RolUsuarioForm
}

/**
 * Normaliza la respuesta del backend al tipo Usuario del dominio.
 * Soporta respuesta plana y con envelope { data: [...] }.
 */
function normalizeUsuario(raw: unknown): Usuario {
  const r = raw as Record<string, unknown>
  return {
    id: String(r['id']),
    name: r['name'] != null ? String(r['name']) : undefined,
    firstName: r['firstName'] != null ? String(r['firstName']) : undefined,
    lastName: r['lastName'] != null ? String(r['lastName']) : undefined,
    email: String(r['email']),
    role: normalizeRole(String(r['role'])),
    isActive: Boolean(r['isActive']),
  }
}

/**
 * Extrae el array de usuarios manejando distintos formatos de respuesta.
 * Soporta: plano [...], envelope { data: [...] }, { items: [...] },
 *          { results: [...] }, { content: [...] }, { usuarios: [...] }
 */
function extractArray(responseData: unknown): unknown[] {
  if (Array.isArray(responseData)) return responseData as unknown[]
  const body = responseData as Record<string, unknown>
  for (const key of ['data', 'items', 'results', 'content', 'usuarios', 'users']) {
    const val = body[key]
    if (Array.isArray(val)) return val
  }
  return []
}

// ── Servicio de usuarios ──────────────────────────────────────────────────────

export const usuarioService = {
  /**
   * GET /auth/users?role=<rol>
   * El parámetro role es requerido por el backend.
   * Si no se pasa rol, se hace una petición por cada rol conocido y se fusionan.
   */
  async obtenerUsuarios(role?: string): Promise<Usuario[]> {
    if (role) {
      const response = await apiClient.get('/auth/users', {
        params: { role: role.toLowerCase() },
      })
      return extractArray(response.data).map(normalizeUsuario)
    }

    // Sin filtro: obtener todos los roles operativos en paralelo
    const roles: RolUsuario[] = [
      'ADMIN',
      'MANAGER',
      'RECEPCIONISTA',
      'INSPECTOR',
      'OPERARIO',
      'FACTURADOR',
    ]
    const results = await Promise.allSettled(
      roles.map((r) =>
        apiClient
          .get('/auth/users', { params: { role: r.toLowerCase() } })
          .then((res) => extractArray(res.data).map(normalizeUsuario)),
      ),
    )

    return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  },

  /**
   * PATCH /auth/users/:id  →  { role: 'inspector' }
   */
  async cambiarRol(id: string, payload: { role: RolUsuario }): Promise<void> {
    await apiClient.patch(`/auth/users/${id}`, {
      role: toFormRole(payload.role),
    })
  },

  /**
   * PATCH /auth/users/:id/inactivate  (desactivar)
   * PATCH /auth/users/:id             (activar con { isActive: true })
   */
  async cambiarEstado(id: string, isActive: boolean): Promise<void> {
    if (!isActive) {
      await apiClient.patch(`/auth/users/${id}/inactivate`)
      return
    }
    await apiClient.patch(`/auth/users/${id}`, { isActive: true })
  },

  /**
   * POST /auth/register
   * Campos: identificationType, identificationNumber, firstName, lastName,
   *         phoneNumber, email, password, role
   */
  async crearUsuario(payload: CrearUsuarioDTO): Promise<void> {
    await apiClient.post('/auth/register', payload)
  },

  /**
   * GET /auth/users/:id
   */
  async obtenerUsuarioPorId(id: string): Promise<Usuario> {
    const response = await apiClient.get(`/auth/users/${id}`)
    const body = response.data as Record<string, unknown>
    const raw = body['data'] ?? response.data
    return normalizeUsuario(raw)
  },

  /**
   * GET /auth/users/search?q=<termino>
   */
  async buscarUsuarios(q: string): Promise<Usuario[]> {
    const response = await apiClient.get('/auth/users/search', {
      params: { q },
    })
    return extractArray(response.data).map(normalizeUsuario)
  },

  /**
   * PATCH /auth/users/:id  →  payload parcial
   */
  async actualizarUsuario(
    id: string,
    payload: ActualizarUsuarioDTO,
  ): Promise<void> {
    await apiClient.patch(`/auth/users/${id}`, payload)
  },

  /**
   * DELETE /auth/users/:id
   */
  async eliminarUsuario(id: string): Promise<void> {
    await apiClient.delete(`/auth/users/${id}`)
  },

  /**
   * GET /auth/users/inspectors
   * Lista de inspectores para dropdown (ej. asignación de inspección).
   */
  async obtenerInspectores(): Promise<Usuario[]> {
    const response = await apiClient.get('/auth/users/inspectors')
    return extractArray(response.data).map(normalizeUsuario)
  },

  /**
   * GET /auth/users/operarios
   * Lista de operarios para dropdown.
   */
  async obtenerOperarios(): Promise<Usuario[]> {
    const response = await apiClient.get('/auth/users/operarios')
    return extractArray(response.data).map(normalizeUsuario)
  },
}
