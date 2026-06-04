export interface Precio {
  id: string
  vehicleType: string // "LIVIANO", "MOTOCICLETA_2_TIEMPOS", "MOTOCICLETA_4_TIEMPOS", "PESADO"
  revisionType: string // "PREVENTIVA", "TECNICO_MECANICA"
  amount: number
  description: string
  isActive: boolean
  deletedAt: string | null
}

export interface CreatePrecioDTO {
  vehicleType: string
  revisionType: string
  amount: number
  description: string
  isActive?: boolean
}

export interface UpdatePrecioDTO {
  vehicleType?: string
  revisionType?: string
  amount?: number
  description?: string
  isActive?: boolean
}
