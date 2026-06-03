import { apiClient } from '@/core/api/apiClient'
import type { ChecklistTemplate } from '../domain/checklist.types'
import type { CrearChecklistTemplateDTO, ActualizarChecklistTemplateDTO } from '../domain/checklistTemplate.types'

function extractItem<T>(responseData: unknown): T {
  let current = responseData as any
  while (current && typeof current === 'object' && !Array.isArray(current)) {
    const body = current as Record<string, unknown>
    if (!('data' in body) || body.data == null) break
    if (Array.isArray(body.data)) return body.data as T
    current = body.data
  }
  return current as T
}

function extractArray<T>(responseData: unknown): T[] {
  const body = responseData as Record<string, unknown>
  if (Array.isArray(responseData)) return responseData as T[]
  if (body?.data) {
    if (Array.isArray(body.data)) return body.data as T[]
    const inner = body.data as Record<string, unknown>
    if (Array.isArray(inner?.items)) return inner.items as T[]
    if (inner?.data) {
      if (Array.isArray(inner.data)) return inner.data as T[]
      if (typeof inner.data === 'object') {
        const nested = inner.data as Record<string, unknown>
        if (Array.isArray(nested.items)) return nested.items as T[]
        if (Array.isArray(nested.data)) return nested.data as T[]
      }
    }
  }
  return []
}

export const checklistTemplateService = {
  async listarPlantillas(params?: { vehicle_type?: string }): Promise<ChecklistTemplate[]> {
    const response = await apiClient.get('/api/v1/checklist/templates', { params })
    return extractArray<ChecklistTemplate>(response.data)
  },

  async obtenerPlantillaPorId(id: string): Promise<ChecklistTemplate> {
    const response = await apiClient.get(`/api/v1/checklist/templates/${id}`)
    return extractItem<ChecklistTemplate>(response.data)
  },

  async crearPlantilla(dto: CrearChecklistTemplateDTO): Promise<ChecklistTemplate> {
    const response = await apiClient.post('/api/v1/checklist/templates', dto)
    return extractItem<ChecklistTemplate>(response.data)
  },

  async actualizarPlantilla(id: string, dto: ActualizarChecklistTemplateDTO): Promise<ChecklistTemplate> {
    const response = await apiClient.put(`/api/v1/checklist/templates/${id}`, dto)
    return extractItem<ChecklistTemplate>(response.data)
  },

  async eliminarPlantilla(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/checklist/templates/${id}`)
  },
}
