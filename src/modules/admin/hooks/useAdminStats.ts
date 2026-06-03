import { useQueries } from '@tanstack/react-query'
import { useCallback } from 'react'
import { adminService } from '@/modules/admin/services/adminService'
import type { AdminDashboardData, ChecklistStats, ClientStats, InspectionStats, InvoiceStats, StorageStats, TrackerStats, VehicleStats } from '@/modules/admin/domain/admin.types'

const QUERIES = [
  { key: 'clients', fn: adminService.getClientStats },
  { key: 'vehicles', fn: adminService.getVehicleStats },
  { key: 'inspections', fn: adminService.getInspectionStats },
  { key: 'invoices', fn: adminService.getInvoiceStats },
  { key: 'storage', fn: adminService.getStorageStats },
  { key: 'checklist', fn: adminService.getChecklistStats },
  { key: 'tracker', fn: adminService.getTrackerStats },
] as const

type ServiceKey = (typeof QUERIES)[number]['key']

export function useAdminStats() {
  const results = useQueries({
    queries: QUERIES.map((q) => ({
      queryKey: ['admin', q.key],
      queryFn: q.fn,
      staleTime: 1000 * 60 * 2,
      retry: 1,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)
  const isRefreshing = results.some((r) => r.isRefetching)

  const serviceState = Object.fromEntries(
    QUERIES.map((q, i) => [q.key, { isLoading: results[i].isLoading, isError: results[i].isError, isRefetching: results[i].isRefetching, error: results[i].error }]),
  ) as Record<ServiceKey, { isLoading: boolean; isError: boolean; isRefetching: boolean; error: Error | null }>

  const data: AdminDashboardData = {
    clients: results[0].data as ClientStats | undefined,
    vehicles: results[1].data as VehicleStats | undefined,
    inspections: results[2].data as InspectionStats | undefined,
    invoices: results[3].data as InvoiceStats | undefined,
    storage: results[4].data as StorageStats | undefined,
    checklist: results[5].data as ChecklistStats | undefined,
    tracker: results[6].data as TrackerStats | undefined,
  }

  const refetchAll = useCallback(() => {
    results.forEach((r) => r.refetch())
  }, [results])

  return { data, isLoading, isError, isRefreshing, serviceState, refetchAll }
}
