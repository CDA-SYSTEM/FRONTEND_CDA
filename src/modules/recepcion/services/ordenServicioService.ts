import { apiClient } from '@/core/api/apiClient'
import type {
  CatalogoItem,
  CrearOrdenServicioDTO,
  OrdenServicioResponse,
} from '@/modules/recepcion/domain/ordenServicio.types'

export interface ArchivosAdjuntos {
  photo?: File | null
  signature?: File | Blob | null
}

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

function normalizarCatalogo(raw: unknown[]): CatalogoItem[] {
  return raw.map((item, i) => {
    if (item && typeof item === 'object' && 'id' in (item as Record<string, unknown>) && 'nombre' in (item as Record<string, unknown>)) {
      const obj = item as Record<string, unknown>
      return { id: String(obj.id), nombre: String(obj.nombre) }
    }
    return { id: String(item), nombre: String(item) }
  })
}

export const ordenServicioService = {
  async obtenerTiposRevision(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/revision-types')
    return normalizarCatalogo(extractArray(response.data) as unknown[])
  },

  async obtenerTiposCliente(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/customer-types')
    return normalizarCatalogo(extractArray(response.data) as unknown[])
  },

  async crearOrdenServicio(dto: CrearOrdenServicioDTO, adjuntos?: ArchivosAdjuntos): Promise<OrdenServicioResponse> {
    const payload: Record<string, unknown> = {
      mileage: dto.mileage,
      client_id: String(dto.client_id),
      vehicle_id: String(dto.vehicle_id),
      customer_type: dto.customer_type,
      revision_type: dto.revision_type,
    }
    if (dto.observations) payload.observations = dto.observations

    const formData = new FormData()
    formData.append('data', JSON.stringify(payload))

    if (adjuntos?.photo) {
      formData.append('photo', adjuntos.photo)
    } else {
      formData.append('photo', new Blob([''], { type: 'image/jpeg' }), 'placeholder.jpg')
    }

    if (adjuntos?.signature) {
      formData.append('signature', adjuntos.signature)
    }

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
