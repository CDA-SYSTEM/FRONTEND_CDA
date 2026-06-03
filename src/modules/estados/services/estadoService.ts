import { apiClient } from '@/core/api/apiClient'
import type {
  Estado,
  CrearEstadoDTO,
  ActualizarEstadoDTO,
  ListarEstadosQueryParams,
  ListarEstadosResponse,
} from '../domain/estado.types'

function extractItem<T>(responseData: unknown): T {
  const body = responseData as Record<string, unknown>
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const inner = body.data as Record<string, unknown>
    if (inner?.data && typeof inner.data === 'object' && !Array.isArray(inner.data)) return inner.data as T
    return body.data as T
  }
  return body as T
}

export const estadoService = {
  async listarEstados(params?: ListarEstadosQueryParams): Promise<ListarEstadosResponse> {
    const response = await apiClient.get('/api/v1/statuses', { params })
    const body = response.data as Record<string, unknown>
    
    // Si la respuesta envuelve la paginación dentro de data.data o data directamente
    let data: Estado[] = []
    let total = 0
    let page = 1
    let size = 10
    let totalPages = 1

    const dataObj = body?.data as Record<string, unknown> | undefined
    if (dataObj) {
      if (Array.isArray(dataObj.data)) {
        data = dataObj.data as Estado[]
        total = Number(dataObj.total ?? data.length)
        page = Number(dataObj.page ?? 1)
        size = Number(dataObj.size ?? 10)
        totalPages = Number(dataObj.totalPages ?? 1)
      } else if (Array.isArray(dataObj)) {
        data = dataObj as Estado[]
        total = data.length
      }
    } else if (Array.isArray(body)) {
      data = body as Estado[]
      total = data.length
    }

    return {
      data,
      total,
      page,
      size,
      totalPages,
    }
  },

  async obtenerEstadoPorId(id: string): Promise<Estado> {
    const response = await apiClient.get(`/api/v1/statuses/${id}`)
    return extractItem<Estado>(response.data)
  },

  async crearEstado(dto: CrearEstadoDTO): Promise<Estado> {
    const response = await apiClient.post('/api/v1/statuses', dto)
    return extractItem<Estado>(response.data)
  },

  async actualizarEstado(id: string, dto: ActualizarEstadoDTO): Promise<Estado> {
    const response = await apiClient.patch(`/api/v1/statuses/${id}`, dto)
    return extractItem<Estado>(response.data)
  },

  async eliminarEstado(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/statuses/${id}`)
  },
}
