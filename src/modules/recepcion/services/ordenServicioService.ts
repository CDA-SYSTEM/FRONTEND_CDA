import { apiClient } from '@/core/api/apiClient'
import type {
  CatalogoItem,
  CrearOrdenServicioDTO,
  OrdenServicioResponse,
} from '@/modules/recepcion/domain/ordenServicio.types'

function extractArray(responseData: unknown): unknown[] {
  const body = responseData as Record<string, unknown>
  if (Array.isArray(responseData)) return responseData
  if (body?.data) {
    if (Array.isArray(body.data)) return body.data
    const inner = body.data as Record<string, unknown>
    if (inner?.data && Array.isArray(inner.data)) return inner.data
    if (typeof inner === 'object') {
      const arr = Object.values(inner).find((v) => Array.isArray(v))
      if (arr) return arr as unknown[]
    }
  }
  return []
}

function extractItem(responseData: unknown): unknown {
  const body = responseData as Record<string, unknown>
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const inner = body.data as Record<string, unknown>
    if (inner?.data && typeof inner.data === 'object' && !Array.isArray(inner.data)) return inner.data
    return body.data
  }
  return body
}

export const ordenServicioService = {
  async obtenerTiposRevision(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/revision-types')
    return extractArray(response.data) as CatalogoItem[]
  },

  async obtenerTiposCliente(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/customer-types')
    return extractArray(response.data) as CatalogoItem[]
  },

  async crearOrdenServicio(dto: CrearOrdenServicioDTO): Promise<OrdenServicioResponse> {
    const payload = {
      mileage: dto.mileage,
      client_id: String(dto.client_id),
      vehicle_id: String(dto.vehicle_id),
      customer_type: dto.customer_type,
      revision_type: dto.revision_type,
    }

    const formData = new FormData()
    formData.append('data', JSON.stringify(payload))
    formData.append('photo', new Blob([''], { type: 'image/jpeg' }), 'placeholder.jpg')

    const response = await apiClient.post('/api/v1/inspections', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return extractItem(response.data) as OrdenServicioResponse
  },

  async obtenerVehiculosCliente(clienteId: number | string): Promise<{ id: number | string; placa: string; marca?: string; linea?: string; modelo?: string }[]> {
    try {
      const response = await apiClient.get(`/api/v1/vehiculo/cliente/${clienteId}`)
      return extractArray(response.data).map((v) => {
        const raw = v as Record<string, unknown>
        return {
          id: raw.id as string,
          placa: raw.placa as string,
          marca: typeof raw.marca === 'object' ? (raw.marca as Record<string, unknown>)?.nombre || (raw.marca as Record<string, unknown>)?.name : raw.marca,
          linea: typeof raw.linea === 'object' ? (raw.linea as Record<string, unknown>)?.nombre || (raw.linea as Record<string, unknown>)?.name : raw.linea,
          modelo: raw.modelo as string,
        } as { id: number | string; placa: string; marca?: string; linea?: string; modelo?: string }
      })
    } catch {
      return []
    }
  },
}
