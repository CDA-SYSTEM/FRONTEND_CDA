import { apiClient } from '@/core/api/apiClient'
import type {
  ChecklistInspection,
  ChecklistTemplate,
  CloseChecklistInspectionDTO,
  CreateChecklistInspectionDTO,
  InspectionItemResponse,
  VehicleType,
} from '@/modules/inspeccion/domain/checklist.types'

function extractItem<T>(responseData: unknown): T {
  const body = responseData as Record<string, unknown>
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data as T
  }
  return body as T
}

function extractArray<T>(responseData: unknown): T[] {
  const body = responseData as Record<string, unknown>
  if (Array.isArray(responseData)) return responseData as T[]
  if (body?.data) {
    if (Array.isArray(body.data)) return body.data as T[]
    const inner = body.data as Record<string, unknown>
    if (inner?.data && Array.isArray(inner.data)) return inner.data as T[]
  }
  return []
}

export const checklistService = {
  /**
   * HU-015 + HU-014: Obtiene la plantilla activa para el tipo de vehículo.
   * Primero intenta con los endpoints dedicados (/motos o /livianos-pesados),
   * luego como fallback usa el listado genérico con filtro.
   */
  async obtenerPlantillaActiva(vehicleType: VehicleType): Promise<ChecklistTemplate | null> {
    // 1) Intentar con el endpoint dedicado
    try {
      const dedicatedUrl = vehicleType === 'MOTO'
        ? '/api/v1/checklist/templates/motos'
        : '/api/v1/checklist/templates/livianos-pesados'

      const res = await apiClient.get(dedicatedUrl)
      const template = extractItem<ChecklistTemplate>(res.data)
      if (template?.sections) return template
    } catch {
      // Si el dedicado falla, continuar con el genérico
    }

    // 2) Fallback: listar todas y filtrar por vehicle_type
    try {
      const response = await apiClient.get('/api/v1/checklist/templates', {
        params: { vehicle_type: vehicleType },
      })
      const templates = extractArray<ChecklistTemplate>(response.data)
      const activa = templates.find((t) => t.active === true)
      return activa ?? templates[0] ?? null
    } catch {
      return null
    }
  },

  async crearInspeccion(dto: CreateChecklistInspectionDTO): Promise<ChecklistInspection | null> {
    try {
      const response = await apiClient.post('/api/v1/checklist/inspections', dto)
      return extractItem<ChecklistInspection>(response.data)
    } catch {
      return null
    }
  },

  async guardarBorrador(
    id: string,
    responses: InspectionItemResponse[],
    observations?: string,
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/draft`, {
        responses,
        observations,
      })
      return true
    } catch {
      return false
    }
  },

  async marcarEnProgreso(
    id: string,
    responses: InspectionItemResponse[],
    observations?: string,
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/in-progress`, {
        responses,
        observations,
      })
      return true
    } catch {
      return false
    }
  },

  async cerrarInspeccion(
    id: string,
    dto: CloseChecklistInspectionDTO,
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/close`, dto)
      return true
    } catch {
      return false
    }
  },

  async obtenerInspeccion(id: string): Promise<ChecklistInspection | null> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/inspections/${id}`)
      return extractItem<ChecklistInspection>(response.data)
    } catch {
      return null
    }
  },

  async subirFoto(blob: Blob): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('file', blob, `photo-${Date.now()}.jpg`)
      const response = await apiClient.post('/api/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const body = response.data as Record<string, unknown>
      const inner = (body?.data as Record<string, unknown>) || body
      const photoUrl = (inner.url || inner.fileUrl || inner.id) as string | undefined
      if (photoUrl) return photoUrl.startsWith('http') ? photoUrl : `/api/v1/storage/files/${photoUrl}`
      return null
    } catch {
      return null
    }
  },

  async buscarInspecciones(params: {
    plate?: string
    vehicle_id?: number
    status?: string
    page?: number
    page_size?: number
  }): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get('/api/v1/checklist/inspections/search', { params })
      return extractArray<ChecklistInspection>(response.data)
    } catch {
      return []
    }
  },
}
