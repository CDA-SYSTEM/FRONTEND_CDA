import { apiClient } from '@/core/api/apiClient'
import type {
  ClientePersonaNatural,
  CrearClienteDTO,
  DocumentType,
  PersonType,
} from '@/modules/recepcion/domain/recepcion.types'

/**
 * Adaptador HTTP — módulo de recepción, clientes.
 *
 * Endpoints reales del backend (PostgreSQL):
 *   POST /api/v1/clients                → 201 Cliente creado
 *   GET  /api/v1/clients/:id            → Obtener cliente activo por ID
 *   GET  /api/v1/document-types         → Catálogo de tipos de documento
 *   GET  /api/v1/person-types           → Catálogo de tipos de persona
 *
 * Duplicados: el backend devuelve 409 cuando ya existe un cliente
 * con el mismo `identity` (número de documento).
 */
function extractArray(responseData: unknown): any[] {
  const body = responseData as Record<string, any>

  if (Array.isArray(responseData)) return responseData

  if (body?.data) {
    if (Array.isArray(body.data)) return body.data

    const inner = body.data.data
    if (inner) {
      if (Array.isArray(inner)) return inner
      if (typeof inner === 'object') {
        const arr = Object.values(inner).find((v) => Array.isArray(v))
        if (arr) return arr as any[]
      }
    }

    if (typeof body.data === 'object') {
      const arr = Object.values(body.data).find((v) => Array.isArray(v))
      if (arr) return arr as any[]
    }
  }

  return []
}

export const clienteService = {
  /**
   * Registra un nuevo cliente persona natural.
   * Lanza error 409 si el identity ya está registrado.
   */
  async crearCliente(payload: CrearClienteDTO): Promise<ClientePersonaNatural> {
    const response = await apiClient.post<ClientePersonaNatural>(
      '/api/v1/clients',
      payload,
    )
    return response.data
  },

  /**
   * Obtiene el catálogo de tipos de documento desde el backend.
   * Se usa para poblar el <select> y obtener el ID numérico correcto.
   */
  async obtenerTiposDocumento(): Promise<DocumentType[]> {
    const response = await apiClient.get('/api/v1/document-types')
    const items = extractArray(response.data)
    return items.map((item) => ({
      id: item.id,
      nombre: item.type || item.nombre || item.name || String(item.id),
      codigo: item.type || item.codigo || item.code,
    }))
  },

  /**
   * Obtiene el catálogo de tipos de persona desde el backend.
   * Para HU-005 solo se usa "Natural" (personTypeId correspondiente).
   */
  async obtenerTiposPersona(): Promise<PersonType[]> {
    const response = await apiClient.get('/api/v1/person-types')
    const items = extractArray(response.data)
    return items.map((item) => {
      let nombre = item.type || item.nombre || item.name || String(item.id)
      if (nombre.toLowerCase() === 'dueño') {
        nombre = 'Responsable'
      }
      return {
        id: item.id,
        nombre: nombre,
      }
    })
  },

  /**
   * Obtiene un cliente activo por ID.
   * Retorna null si no existe (404).
   */
  async obtenerClientePorId(
    id: number | string,
  ): Promise<ClientePersonaNatural | null> {
    try {
      const response = await apiClient.get<ClientePersonaNatural>(
        `/api/v1/clients/${id}`,
      )
      return response.data
    } catch (error: unknown) {
      const e = error as { response?: { status?: number } }
      if (e.response?.status === 404) return null
      throw error
    }
  },

  /**
   * Busca clientes por nombre, documento o placa (si el backend lo soporta).
   * Usa GET /api/v1/clients?search=...
   */
  async buscarClientes(query: string): Promise<ClientePersonaNatural[]> {
    if (!query || query.trim().length < 3) return []
    
    const response = await apiClient.get('/api/v1/clients', {
      params: { search: query.trim(), size: 50 },
    })
    
    return extractArray(response.data)
  },

  /**
   * Actualiza los datos de un cliente existente.
   * Usa PUT /api/v1/clients/:id
   */
  async actualizarCliente(
    id: number | string,
    payload: Partial<CrearClienteDTO>,
  ): Promise<ClientePersonaNatural> {
    const response = await apiClient.put<ClientePersonaNatural>(
      `/api/v1/clients/${id}`,
      payload,
    )
    return response.data
  },

  /**
   * Elimina un cliente de forma lógica (soft delete).
   * Usa DELETE /api/v1/clients/:id
   */
  async eliminarCliente(id: number | string): Promise<void> {
    await apiClient.delete(`/api/v1/clients/${id}`)
  },

  /**
   * Obtiene la lista completa de todos los clientes sin paginación.
   * Usa GET /api/v1/clients/all
   */
  async obtenerTodosLosClientes(): Promise<ClientePersonaNatural[]> {
    const response = await apiClient.get('/api/v1/clients/all')
    return extractArray(response.data)
  },

  /**
   * Obtiene un cliente por ID incluyendo los que tienen soft delete.
   * Usa GET /api/v1/clients/:id/full
   */
  async obtenerClienteCompletoPorId(
    id: number | string,
  ): Promise<ClientePersonaNatural | null> {
    try {
      const response = await apiClient.get<ClientePersonaNatural>(
        `/api/v1/clients/${id}/full`,
      )
      return response.data
    } catch (error: unknown) {
      const e = error as { response?: { status?: number } }
      if (e.response?.status === 404) return null
      throw error
    }
  },

  /**
   * Activa un cliente que ha sido eliminado lógicamente.
   * Usa PUT /api/v1/clients/:id/activate
   */
  async activarCliente(id: number | string): Promise<ClientePersonaNatural> {
    const response = await apiClient.put<ClientePersonaNatural>(
      `/api/v1/clients/${id}/activate`,
    )
    return response.data
  },
}
