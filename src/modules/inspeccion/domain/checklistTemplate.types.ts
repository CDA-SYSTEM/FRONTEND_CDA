import type { VehicleType } from './checklist.types'

export interface CrearChecklistTemplateDTO {
  code: 'MOTOS' | 'LIVIANOS_PESADOS'
  name: string
  version?: number
  active?: boolean
  supported_vehicle_types: VehicleType[]
  sections: any[]
}

export interface ActualizarChecklistTemplateDTO {
  code?: 'MOTOS' | 'LIVIANOS_PESADOS'
  name?: string
  version?: number
  active?: boolean
  supported_vehicle_types?: VehicleType[]
  sections?: any[]
}
