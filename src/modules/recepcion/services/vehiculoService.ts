import { apiClient } from '@/core/api/apiClient'
import type { Vehiculo } from '@/modules/recepcion/domain/recepcion.types'

/**
 * Extrae el array manejando tanto respuesta plana como envelope.
 */
function extractArray(responseData: unknown): any[] {
  const body = responseData as Record<string, any>
  if (body && body.data && body.data.data && Array.isArray(body.data.data)) return body.data.data
  if (body && body.data && Array.isArray(body.data)) return body.data
  if (Array.isArray(responseData)) return responseData
  return []
}

export const vehiculoService = {
  /**
   * Obtiene la lista de vehículos asociados a un cliente específico.
   * Endpoint: GET /api/v1/vehiculo/cliente/{clienteId}
   */
  async obtenerVehiculosCliente(clienteId: number | string): Promise<Vehiculo[]> {
    try {
      const response = await apiClient.get(`/api/v1/vehiculo/cliente/${clienteId}`)
      return extractArray(response.data)
    } catch (error) {
      console.error('Error obteniendo vehículos del cliente:', error)
      return []
    }
  },
}
