import { apiClient } from '@/core/api/apiClient'
import type {
  ActualizarUsuarioDTO,
  CrearUsuarioDTO,
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

export const usuarioService = {
  async obtenerUsuarios(role?: RolUsuario): Promise<Usuario[]> {
    const response = await apiClient.get('/auth/users', {
      params: role ? { role } : undefined,
    })
    const data = Array.isArray(response.data) ? response.data : []
    return data.map(normalizeUsuario)
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

  async crearUsuario(payload: CrearUsuarioDTO): Promise<void> {
    await apiClient.post('/auth/register', payload)
  },

  async obtenerUsuarioPorId(id: string): Promise<Usuario> {
    const response = await apiClient.get(`/auth/users/${id}`)
    return normalizeUsuario(response.data)
  },

  async buscarUsuarios(q: string): Promise<Usuario[]> {
    const response = await apiClient.get('/auth/users/search', {
      params: { q },
    })
    const data = Array.isArray(response.data) ? response.data : []
    return data.map(normalizeUsuario)
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
}
