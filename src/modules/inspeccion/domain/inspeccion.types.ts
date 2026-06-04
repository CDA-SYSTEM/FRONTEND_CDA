export type InspectionResult = 'APROBADO' | 'REPROBADO' | 'SIN_RESULTADO'

export interface ChecklistItem {
  id?: string
  descripcion?: string
  aprobado?: boolean
  [key: string]: unknown
}

export interface AxleData {
  index?: number
  axle_type?: string
  [key: string]: unknown
}

export interface TireData {
  position?: string
  code?: string
  tire_pressure?: number
  [key: string]: unknown
}

export interface InspectionSummary {
  id: string
  inspection_number?: string
  vehicle_id?: string
  client_id?: string
  operator_id?: string
  responsible_id?: string
  revision_type?: string
  mileage?: number
  createdAt?: string
  updatedAt?: string
  date?: string
  inspection_date?: string
  observations?: string
  observations_text?: string
  operator?: {
    id?: string
    firstName?: string
    lastName?: string
    name?: string
  }
  result?: InspectionResult
}

export interface InspectionDetail extends InspectionSummary {
  customer_type?: string
  tinted_windows?: string
  armored_vehicle?: string
  brake_fluid_sight_glass?: string
  checklist?: Record<string, unknown>
  axles?: AxleData[]
  tires?: TireData[]
  photo_url?: string
  signature_url?: string
  vehicle_type?: string
  client?: {
    id?: string
    nombre?: string
    apellido?: string
    identity?: string
    celular?: string
    email?: string
    documentType?: {
      id?: number
      type?: string
    }
  }
  vehicle?: {
    id?: string | number
    placa?: string
    marca?: string | { id?: number; nombre?: string }
    linea?: string | { id?: number; nombre?: string }
    modelo?: string
    tipoVehiculo?: { id?: number; nombre?: string }
    tipoCombustible?: { id?: number; nombre?: string }
    tipoServicio?: { id?: number; nombre?: string }
  }
  operator_data?: {
    id?: string
    firstName?: string
    lastName?: string
    name?: string
  }
}

