import { apiClient } from '@/core/api/apiClient'
import type {
  CatalogoItem,
  CreateVehicleDto,
  VehiculoResponse,
} from '@/modules/vehiculo/domain/vehiculo.types'

function extractItem(responseData: unknown): any {
  const body = responseData as Record<string, any>
  if (body && body.data && typeof body.data === 'object' && body.data.data) return body.data.data
  if (body && body.data && typeof body.data === 'object') return body.data
  return body
}

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
  async crearVehiculo(payload: CreateVehicleDto): Promise<VehiculoResponse> {
    const response = await apiClient.post('/api/v1/vehiculo', payload)
    return extractItem(response.data) as VehiculoResponse
  },

  async obtenerVehiculoPorId(id: string): Promise<VehiculoResponse | null> {
    try {
      const response = await apiClient.get(`/api/v1/vehiculo/${id}`)
      return extractItem(response.data) as VehiculoResponse
    } catch {
      return null
    }
  },

  async listarVehiculos(page = 0, size = 20): Promise<VehiculoResponse[]> {
    const response = await apiClient.get('/api/v1/vehiculo', {
      params: { page, size },
    })
    return extractArray(response.data) as VehiculoResponse[]
  },

  // ── Catálogos ─────────────────────────────────────────────────────────────

  async listarMarcas(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/marca')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarClases(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/clase')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarLineas(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/linea')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarColores(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/color')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarTiposVehiculo(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/tipo-vehiculo')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarTiposCombustible(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/tipo-combustible')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarTiposServicio(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/tipo-servicio')
    return extractArray(response.data) as CatalogoItem[]
  },
}
