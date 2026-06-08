export interface CatalogoItem {
  id: number
  nombre: string
}

export interface VehiculoResponse {
  id: number | string
  placa: string
  marca?: CatalogoItem | string
  linea?: CatalogoItem | string
  clase?: CatalogoItem | string
  color?: CatalogoItem | string
  modelo?: string
  tipoVehiculo?: CatalogoItem | string
  tipoCombustible?: CatalogoItem | string
  tipoServicio?: CatalogoItem | string
  certificadoNo?: string
  clienteId?: string
  cilindraje?: string
  client?: {
    id: number | string
    nombre: string
    apellido: string
    identity: string
    celular?: string
    email?: string
    direccion?: string
  }
}

export interface CreateVehicleDto {
  clienteId: string
  placa: string
  marcaId: number
  lineaId: number
  claseId: number
  colorId: number
  tipoVehiculoId: number
  tipoCombustibleId: number
  tipoServicioId: number
  modelo: string
  certificadoNo: string
  cilindraje?: string
}
