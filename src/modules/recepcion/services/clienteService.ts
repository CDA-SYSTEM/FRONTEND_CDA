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
    const response = await apiClient.get<DocumentType[]>('/api/v1/document-types')
    return Array.isArray(response.data) ? response.data : []
  },

  /**
   * Obtiene el catálogo de tipos de persona desde el backend.
   * Para HU-005 solo se usa "Natural" (personTypeId correspondiente).
   */
  async obtenerTiposPersona(): Promise<PersonType[]> {
    const response = await apiClient.get<PersonType[]>('/api/v1/person-types')
    return Array.isArray(response.data) ? response.data : []
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
}
