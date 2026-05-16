export type TipoVehiculo = 'moto' | 'liviano' | 'pesado'

export interface RecepcionFormData {
  cliente: string
  placa: string
  tipoVehiculo: TipoVehiculo | ''
}
