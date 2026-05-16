/**
 * Tarjeta de resumen para el panel principal del dashboard.
 */
export interface DashboardCard {
  titulo: string
  descripcion: string
  ruta: string
}

/**
 * Estadísticas generales del CDA.
 */
export interface DashboardStats {
  vehiculosHoy: number
  inspeccionesCompletadas: number
  facturasPendientes: number
}
