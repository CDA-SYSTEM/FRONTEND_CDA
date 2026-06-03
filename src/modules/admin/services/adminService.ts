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

function unwrap<T>(responseData: unknown): T {
  const first = extractApiData<T>(responseData)
  const second = extractApiData<T>(first as Record<string, unknown>)
  return (second !== first ? second : first) as T
}

export const adminService = {
  async getClientStats(): Promise<ClientStats> {
    const res = await apiClient.get('/api/v1/clients/stats')
    return unwrap<ClientStats>(res.data)
  },

  async getVehicleStats(): Promise<VehicleStats> {
    const res = await apiClient.get('/api/v1/vehiculo/stats')
    return unwrap<VehicleStats>(res.data)
  },

  async getInspectionStats(): Promise<InspectionStats> {
    const res = await apiClient.get('/api/v1/stats/inspections')
    return unwrap<InspectionStats>(res.data)
  },

  async getInvoiceStats(): Promise<InvoiceStats> {
    const res = await apiClient.get('/api/v1/stats/invoices')
    return unwrap<InvoiceStats>(res.data)
  },

  async getStorageStats(): Promise<StorageStats> {
    const res = await apiClient.get('/api/v1/storage/stats')
    return unwrap<StorageStats>(res.data)
  },

  async getChecklistStats(): Promise<ChecklistStats> {
    const res = await apiClient.get('/api/v1/checklist/inspections/stats')
    return unwrap<ChecklistStats>(res.data)
  },

  async getTrackerStats(): Promise<TrackerStats> {
    const res = await apiClient.get('/api/v1/tracker/stats')
    return unwrap<TrackerStats>(res.data)
  },
}
