import { apiClient } from '@/core/api/apiClient'
import type {
  Precio,
  CreatePrecioDTO,
  UpdatePrecioDTO,
} from '../domain/precio.types'

export interface GetPricesParams {
  vehicleType?: string
  revisionType?: string
}

export interface PricesResponse {
  data: Precio[]
  total: number
  page: number
  size: number
  totalPages: number
}

export const precioService = {
  /**
   * Crea un nuevo precio.
   */
  async crearPrecio(payload: CreatePrecioDTO): Promise<Precio> {
    const response = await apiClient.post<{ data: Precio }>('/api/v1/prices', payload)
    return response.data?.data || response.data
  },

  /**
   * Lista todos los precios con filtros opcionales.
   */
  async listarPrecios(params?: GetPricesParams): Promise<Precio[]> {
    const response = await apiClient.get<{ data: PricesResponse | Precio[] | any }>('/api/v1/prices', {
      params,
    })
    // El backend puede devolver una respuesta paginada o un array simple.
    // Manejemos ambos casos de manera robusta.
    const body = response.data?.data || response.data
    if (Array.isArray(body)) {
      return body
    }
    if (body && Array.isArray(body.data)) {
      return body.data
    }
    return []
  },

  /**
   * Obtiene un precio por ID.
   */
  async obtenerPrecioPorId(id: string): Promise<Precio> {
    const response = await apiClient.get<{ data: Precio }>(`/api/v1/prices/${id}`)
    return response.data?.data || response.data
  },

  /**
   * Actualiza un precio.
   */
  async actualizarPrecio(id: string, payload: UpdatePrecioDTO): Promise<Precio> {
    const response = await apiClient.patch<{ data: Precio }>(`/api/v1/prices/${id}`, payload)
    return response.data?.data || response.data
  },

  /**
   * Elimina un precio (soft delete).
   */
  async eliminarPrecio(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/prices/${id}`)
  },
}
