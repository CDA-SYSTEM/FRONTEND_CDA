export interface ClientStats {
  totalClients: number
  activeClients: number
  inactiveClients: number
  clientsByDocumentType: { label: string; count: number }[]
  clientsByPersonType: { label: string; count: number }[]
}

export interface VehicleStats {
  totalVehicles: number
  byBrand: { label: string; count: number }[]
  byType: { label: string; count: number }[]
  byFuelType: { label: string; count: number }[]
  byServiceType: { label: string; count: number }[]
}

export interface StatusInfo {
  id: string
  code: string
  name: string
  color?: string
}

export interface ByStatusEntry {
  status: StatusInfo | null
  count: number
}

export interface InspectionStats {
  totalInspections: number
  todayInspections: number
  weekInspections: number
  monthInspections: number
  byStatus: ByStatusEntry[]
  byVehicleType: Record<string, number>
  byServiceType: Record<string, number>
}

export interface InvoiceStats {
  totalInvoices: number
  totalRevenue: number
  todayRevenue: number
  monthRevenue: number
  byStatus: ByStatusEntry[]
  revenueByMonth: Record<string, number>
}

export interface StorageStats {
  totalFiles: number
  activeFiles: number
  totalSizeBytes: number
  filesByMimetype: { mimetype: string; count: number }[]
  recentUploads: number
}

export interface ChecklistStats {
  total_inspections: number
  today_inspections: number
  month_inspections: number
  by_status: Record<string, number>
  by_result: Record<string, number>
  by_vehicle_type: Record<string, number>
  total_templates: number
  total_with_labrado: number
}

export interface TrackerStats {
  total_clientes: number
  total_vehiculos: number
  total_planillas: number
  vehiculos_por_marca: { marca: string; total: number }[]
  defectos_mas_comunes: { defecto?: string; total?: number }[]
  planillas_por_fecha: { fecha: string | null; total: number }[]
}

export interface AdminDashboardData {
  clients?: ClientStats
  vehicles?: VehicleStats
  inspections?: InspectionStats
  invoices?: InvoiceStats
  storage?: StorageStats
  checklist?: ChecklistStats
  tracker?: TrackerStats
}
