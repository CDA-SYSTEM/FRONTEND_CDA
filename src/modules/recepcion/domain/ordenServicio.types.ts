export interface CatalogoItem {
  id: number | string
  nombre: string
}

export interface CrearOrdenServicioDTO {
  mileage: number
  client_id: number
  vehicle_id: number
  customer_type: string
  revision_type: string
  observations?: string
  operator_id?: string | number
  responsible_id?: string | number
  customer_id?: number | string
  tinted_windows?: string
  armored_vehicle?: string
  brake_fluid_sight_glass?: string
  axles?: { index: number; axle_type: string }[]
  tires?: { position: string; code: string; tire_pressure: number }[]
  /** Placa del vehículo — el backend la incluye en el cuerpo de la inspección */
  plate?: string
  /** Checklist de limpieza del vehículo */
  checklist?: { is_clean?: boolean }
}

export interface OrdenServicioResponse {
  id: string
  inspection_number?: string
  createdAt?: string
  client_id?: number | string
  vehicle_id?: number | string
  plate?: string
  result?: string
}

export interface ClienteConVehiculos {
  id: number | string
  nombre: string
  apellido: string
  identity: string
  celular: string
  placa?: string
}
