import { apiClient } from '@/core/api/apiClient'
import { extractApiData } from '@/core/api/extractApiData'
import type {
  ChecklistStats,
  ClientStats,
  InspectionStats,
  InvoiceStats,
  StorageStats,
  TrackerStats,
  VehicleStats,
} from '@/modules/admin/domain/admin.types'

export const adminService = {
  async getClientStats(): Promise<ClientStats> {
    const res = await apiClient.get('/api/v1/clients/stats')
    return extractApiData<ClientStats>(res.data)
  },

  async getVehicleStats(): Promise<VehicleStats> {
    const res = await apiClient.get('/api/v1/vehiculo/stats')
    return extractApiData<VehicleStats>(res.data)
  },

  async getInspectionStats(): Promise<InspectionStats> {
    const res = await apiClient.get('/api/v1/stats/inspections')
    return extractApiData<InspectionStats>(res.data)
  },

  async getInvoiceStats(): Promise<InvoiceStats> {
    const res = await apiClient.get('/api/v1/stats/invoices')
    return extractApiData<InvoiceStats>(res.data)
  },

  async getStorageStats(): Promise<StorageStats> {
    const res = await apiClient.get('/api/v1/storage/stats')
    return extractApiData<StorageStats>(res.data)
  },

  async getChecklistStats(): Promise<ChecklistStats> {
    const res = await apiClient.get('/api/v1/checklist/inspections/stats')
    return extractApiData<ChecklistStats>(res.data)
  },

  async getTrackerStats(): Promise<TrackerStats> {
    const res = await apiClient.get('/api/v1/tracker/stats')
    return extractApiData<TrackerStats>(res.data)
  },
}
