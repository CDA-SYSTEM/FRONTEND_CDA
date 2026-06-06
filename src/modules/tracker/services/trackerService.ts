import { apiClient } from '@/core/api/apiClient'
import type {
  TrackerCliente,
  TrackerVehiculo,
  TrackerPlanilla,
  TrackerStats,
  TrackerDashboardData,
} from '@/modules/tracker/domain/tracker.types'

function extractItem<T>(responseData: unknown): T {
  const body = responseData as Record<string, any>
  if (body && body.data && typeof body.data === 'object') {
    return body.data as T
  }
  return body as T
}

export const trackerService = {
  async obtenerDashboard(): Promise<TrackerDashboardData> {
    const res = await apiClient.get('/api/v1/tracker/dashboard')
    return extractItem<TrackerDashboardData>(res.data)
  },

  async obtenerStats(): Promise<TrackerStats> {
    const res = await apiClient.get('/api/v1/tracker/stats')
    return extractItem<TrackerStats>(res.data)
  },

  async obtenerClientes(): Promise<TrackerCliente[]> {
    const res = await apiClient.get('/api/v1/tracker/clientes')
    return extractItem<TrackerCliente[]>(res.data)
  },

  async obtenerClientePorId(id: string | number): Promise<TrackerCliente> {
    const res = await apiClient.get(`/api/v1/tracker/clientes/${id}`)
    return extractItem<TrackerCliente>(res.data)
  },

  async obtenerVehiculosPorCliente(clienteId: string | number): Promise<TrackerVehiculo[]> {
    const res = await apiClient.get(`/api/v1/tracker/clientes/${clienteId}/vehiculos`)
    return extractItem<TrackerVehiculo[]>(res.data)
  },

  async obtenerVehiculos(): Promise<TrackerVehiculo[]> {
    const res = await apiClient.get('/api/v1/tracker/vehiculos')
    return extractItem<TrackerVehiculo[]>(res.data)
  },

  async obtenerVehiculoPorPlaca(placa: string): Promise<TrackerVehiculo> {
    const res = await apiClient.get(`/api/v1/tracker/vehiculos/${encodeURIComponent(placa)}`)
    return extractItem<TrackerVehiculo>(res.data)
  },

  async obtenerPlanillasPorVehiculo(placa: string): Promise<TrackerPlanilla[]> {
    const res = await apiClient.get(`/api/v1/tracker/vehiculos/${encodeURIComponent(placa)}/planillas`)
    return extractItem<TrackerPlanilla[]>(res.data)
  },

  async obtenerPlanillas(): Promise<TrackerPlanilla[]> {
    const res = await apiClient.get('/api/v1/tracker/planillas')
    return extractItem<TrackerPlanilla[]>(res.data)
  },

  async obtenerPlanillaPorId(planillaId: string): Promise<any> {
    const res = await apiClient.get(`/api/v1/tracker/planillas/${planillaId}`)
    return extractItem<any>(res.data)
  },
}
