import { apiClient } from '@/core/api/apiClient'
import type { Vehiculo } from '@/modules/recepcion/domain/recepcion.types'

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
