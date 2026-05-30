import { apiClient } from '@/core/api/apiClient'
import { extractApiArray, extractApiData } from '@/core/api/extractApiData'
import { useAuthStore } from '@/core/store/authStore'
import type {
  ActualizarUsuarioDTO,
  CrearUsuarioDTO,
  RolPersonalDropdown,
  RolUsuario,
  RolUsuarioForm,
  Usuario,
} from '@/modules/usuarios/domain/usuario.types'

function normalizeRole(role: string): RolUsuario {
  return role.toUpperCase() as RolUsuario
}

function toFormRole(role: RolUsuario): RolUsuarioForm {
  return role.toLowerCase() as RolUsuarioForm
}

function normalizeUsuario(raw: unknown): Usuario {
  const r = raw as Record<string, unknown>
  const firstName = r['firstName'] != null ? String(r['firstName']) : undefined
  const lastName = r['lastName'] != null ? String(r['lastName']) : undefined
  const builtName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const roleRaw = String(r['role'] ?? 'OPERARIO')

  return {
    id: String(r['id'] ?? r['sub'] ?? ''),
    name:
      r['name'] != null
        ? String(r['name'])
        : r['label'] != null
          ? String(r['label'])
          : builtName || undefined,
    firstName,
    lastName,
    email: r['email'] != null ? String(r['email']) : '',
    role: normalizeRole(roleRaw),
    isActive: r['isActive'] === undefined ? true : Boolean(r['isActive']),
  }
}

function onlyActive(usuarios: Usuario[]): Usuario[] {
  return usuarios.filter((u) => u.isActive)
}

export const usuarioService = {
  /**
   * GET /auth/users?role={role} — Admin, Manager
   */
  async obtenerUsuarios(role?: string): Promise<Usuario[]> {
    if (!role) {
      const roles: RolUsuarioForm[] = ['admin', 'manager', 'inspector', 'operario']
      const results = await Promise.allSettled(
        roles.map((r) =>
          apiClient
            .get('/auth/users', { params: { role: r } })
            .then((res) =>
              extractApiArray(res.data).map(normalizeUsuario),
            ),
        ),
      )
      return onlyActive(
        results.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])),
      )
    }

    try {
      const response = await apiClient.get('/auth/users', {
        params: { role: role.toLowerCase() },
      })
      return onlyActive(extractApiArray(response.data).map(normalizeUsuario))
    } catch {
      return []
    }
  },

  /**
   * GET /auth/users/options?role=operario|inspector — Admin, Manager (dropdown)
   */
  async obtenerOpcionesUsuarios(role: RolPersonalDropdown): Promise<Usuario[]> {
    try {
      const response = await apiClient.get('/auth/users/options', {
        params: { role },
      })
      return extractApiArray(response.data).map(normalizeUsuario)
    } catch {
      return []
    }
  },

  /**
   * GET /auth/users/operarios — Admin, Manager
   */
  async obtenerOperarios(): Promise<Usuario[]> {
    try {
      const response = await apiClient.get('/auth/users/operarios')
      return onlyActive(extractApiArray(response.data).map(normalizeUsuario))
    } catch {
      return []
    }
  },

  /**
   * GET /auth/users/inspectors — Admin, Manager
   */
  async obtenerInspectores(): Promise<Usuario[]> {
    try {
      const response = await apiClient.get('/auth/users/inspectors')
      return onlyActive(extractApiArray(response.data).map(normalizeUsuario))
    } catch {
      return []
    }
  },

  /**
   * Personal para asignar en recepción (operator_id).
   * - Recepción usa operarios.
   * - Si /auth/users/options falla, hace fallback a /auth/users/operarios.
   */
  async obtenerPersonalAsignable(
    role: 'OPERARIO' | 'INSPECTOR',
    userRole?: string,
  ): Promise<Usuario[]> {
    const r = userRole?.toUpperCase()
    if (r === 'OPERARIO' || r === 'INSPECTOR') {
      const activeUser = useAuthStore.getState().user
      if (activeUser) {
        return [
          {
            id: String(activeUser.id),
            name: activeUser.name,
            email: '',
            role: activeUser.role as RolUsuario,
            isActive: true,
          },
        ]
      }
      return []
    }

    if (role === 'OPERARIO') {
      const opciones = await this.obtenerOpcionesUsuarios('operario')
      if (opciones.length > 0) return opciones

      return this.obtenerOperarios()
    }
    const opciones = await this.obtenerOpcionesUsuarios('inspector')
    if (opciones.length > 0) return opciones

    return this.obtenerInspectores()
  },

  async cambiarRol(id: string, payload: { role: RolUsuario }): Promise<void> {
    await apiClient.patch(`/auth/users/${id}`, {
      role: toFormRole(payload.role),
    })
  },

  async cambiarEstado(id: string, isActive: boolean): Promise<void> {
    if (!isActive) {
      await apiClient.patch(`/auth/users/${id}/inactivate`)
      return
    }
    await apiClient.patch(`/auth/users/${id}`, { isActive: true })
  },

  /**
   * POST /auth/admin/personnel/register — Admin, Manager
   */
  async crearUsuario(payload: CrearUsuarioDTO): Promise<void> {
    await apiClient.post('/auth/admin/personnel/register', payload)
  },

  async obtenerUsuarioPorId(id: string): Promise<Usuario> {
    const response = await apiClient.get(`/auth/users/${id}`)
    const raw = extractApiData(response.data)
    return normalizeUsuario(raw)
  },

  async buscarUsuarios(q: string): Promise<Usuario[]> {
    const response = await apiClient.get('/auth/users/search', { params: { q } })
    return onlyActive(extractApiArray(response.data).map(normalizeUsuario))
  },

  async actualizarUsuario(
    id: string,
    payload: ActualizarUsuarioDTO,
  ): Promise<void> {
    await apiClient.patch(`/auth/users/${id}`, payload)
  },

  async eliminarUsuario(id: string): Promise<void> {
    await apiClient.delete(`/auth/users/${id}`)
  },

  /**
   * PATCH /auth/admin/personnel/{id}/reset-password
   */
  async restablecerPassword(userId: string, newPassword: string): Promise<void> {
    await apiClient.patch(`/auth/admin/personnel/${userId}/reset-password`, {
      newPassword,
    })
  },

  /**
   * GET /auth/identification-types — Admin, Manager
   */
  async obtenerTiposIdentificacion(): Promise<{ code: string; name: string }[]> {
    try {
      const response = await apiClient.get('/auth/identification-types')
      const data = extractApiArray(response.data)
      return data.map((item) => {
        const r = item as Record<string, unknown>
        return {
          code: String(r['code'] ?? r['id'] ?? ''),
          name: String(r['name'] ?? r['nombre'] ?? r['code'] ?? ''),
        }
      })
    } catch {
      return []
    }
  },

  /** @deprecated usar obtenerPersonalAsignable */
  async obtenerUsuariosAsignables(role: string): Promise<Usuario[]> {
    const r = role.toUpperCase()
    if (r !== 'OPERARIO' && r !== 'INSPECTOR') return []
    return this.obtenerPersonalAsignable(r)
  },
}
