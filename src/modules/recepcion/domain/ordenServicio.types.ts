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
