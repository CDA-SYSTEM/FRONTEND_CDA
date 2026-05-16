export type EstadoFacturacion =
  | 'Listo para factura'
  | 'Pendiente evidencia'
  | 'Facturado'
  | 'Cancelado'

/**
 * Ítem en la cola de facturación.
 */
export interface ColaFacturacionItem {
  placa: string
  estado: EstadoFacturacion
}

/**
 * Factura emitida.
 */
export interface Factura {
  id: string
  placa: string
  monto: number
  fecha: string
  estado: EstadoFacturacion
}
