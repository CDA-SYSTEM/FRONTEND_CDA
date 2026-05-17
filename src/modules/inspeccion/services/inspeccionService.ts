import { apiClient } from '@/core/api/apiClient'
import type {
  InspectionDetail,
  InspectionSummary,
} from '@/modules/inspeccion/domain/inspeccion.types'

function extractArray(responseData: unknown): unknown[] {
  const body = responseData as Record<string, unknown>

  if (Array.isArray(responseData)) return responseData

  if (body?.data) {
    if (Array.isArray(body.data)) return body.data

    const inner = body.data as Record<string, unknown>
    if (inner?.data) {
      if (Array.isArray(inner.data)) return inner.data
      if (typeof inner.data === 'object') {
        const arr = Object.values(inner.data as Record<string, unknown>).find((v) => Array.isArray(v))
        if (arr) return arr as unknown[]
      }
    }

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

function sortCronologico(inspecciones: InspectionSummary[]): InspectionSummary[] {
  return [...inspecciones].sort((a, b) => {
    const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return fechaB - fechaA
  })
}

export const inspeccionService = {
  async listarPorVehiculo(
    placa: string,
    page = 0,
    size = 20,
  ): Promise<InspectionSummary[]> {
    try {
      const response = await apiClient.get('/api/v1/inspections', {
        params: { vehicle_id: placa, page, size },
      })
      return sortCronologico(extractArray(response.data) as InspectionSummary[])
    } catch (error) {
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : 'Error al consultar el historial'
      throw new Error(msg)
    }
  },

  async obtenerDetalle(id: string): Promise<InspectionDetail | null> {
    try {
      const response = await apiClient.get(`/api/v1/inspections/${id}`)
      return extractItem(response.data) as InspectionDetail
    } catch {
      return null
    }
  },
}
