export interface TrackerCliente {
  id: string
  documento: string
  nombres: string
  total_vehiculos?: number
}

export interface TrackerVehiculo {
  placa: string
  marca: string
  cliente_id: string
}

export interface TrackerPlanilla {
  id: string
  vehiculo_placa: string
}

export interface TrackerStats {
  total_clientes: number
  total_vehiculos: number
  total_planillas: number
  vehiculos_por_marca: { marca: string; total: number }[]
  planillas_por_fecha: { fecha: string | null; total: number }[]
  defectos_mas_comunes: { defecto: string; total: number }[]
}

export interface TrackerDashboardData {
  clientes: TrackerCliente[]
  vehiculos: TrackerVehiculo[]
  planillas: TrackerPlanilla[]
  stats: TrackerStats
}
