export interface Estado {
  id: string
  code: string
  name: string
  description?: string
  color: string
  order?: number
  isActive?: boolean
  deletedAt?: string | null
}

export interface CrearEstadoDTO {
  code: string
  name: string
  description?: string
  color: string
  order?: number
}

export interface ActualizarEstadoDTO {
  code?: string
  name?: string
  description?: string
  color?: string
  order?: number
}

export interface ListarEstadosQueryParams {
  code?: string
  page?: number
  size?: number
}

export interface ListarEstadosResponse {
  data: Estado[]
  total: number
  page: number
  size: number
  totalPages: number
}
