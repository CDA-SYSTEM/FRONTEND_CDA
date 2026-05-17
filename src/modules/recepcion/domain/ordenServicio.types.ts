export interface CatalogoItem {
  id: number | string
  nombre: string
}

export interface CrearOrdenServicioDTO {
  mileage: number
  client_id: string
  vehicle_id: string
  customer_type: string
  revision_type: string
  observations?: string
  operator_id?: string
  responsible_id?: string
  customer_id?: string
  tinted_windows?: string
  armored_vehicle?: string
  brake_fluid_sight_glass?: string
  axles?: { index: number; axle_type: string }[]
  tires?: { position: string; code: string; tire_pressure: number }[]
}

export interface OrdenServicioResponse {
  id: string
  inspection_number?: string
  createdAt?: string
  client_id?: string
  vehicle_id?: string
  result?: string
}

export interface ClienteConVehiculos {
  id: number | string
  nombre: string
  apellido: string
  identity: string
  celular: string
}
