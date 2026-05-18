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
  async obtenerPlantillaActiva(vehicleType: VehicleType): Promise<ChecklistTemplate | null> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/templates/active/${vehicleType}`)
      return extractItem<ChecklistTemplate>(response.data)
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
