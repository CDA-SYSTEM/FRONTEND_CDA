export interface CatalogoItem {
  id: number | string
  nombre: string
}

/**
 * Cuerpo JSON del campo `data` en POST /api/v1/inspections (multipart/form-data).
 * @see Swagger — Crear una inspección con imágenes
 */
export interface CrearOrdenServicioDTO {
  mileage: number
  client_id: string
  vehicle_id: string
  /** ID del personal operario asignado (GET /auth/users/operarios) */
  operator_id: string
  customer_type: string
  revision_type: string
  tinted_windows: string
  armored_vehicle: string
  brake_fluid_sight_glass: string
  checklist: { is_clean: boolean }
  axles: { index: number; axle_type: string }[]
  tires: { position: string; code: string; tire_pressure: number }[]
  observations?: string
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
