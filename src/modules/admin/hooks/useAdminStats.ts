import { useQueries } from '@tanstack/react-query'
import { adminService } from '@/modules/admin/services/adminService'
import type { AdminDashboardData } from '@/modules/admin/domain/admin.types'

export function useAdminStats() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin', 'clients'],
        queryFn: adminService.getClientStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
      {
        queryKey: ['admin', 'vehicles'],
        queryFn: adminService.getVehicleStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
      {
        queryKey: ['admin', 'inspections'],
        queryFn: adminService.getInspectionStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
      {
        queryKey: ['admin', 'invoices'],
        queryFn: adminService.getInvoiceStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
      {
        queryKey: ['admin', 'storage'],
        queryFn: adminService.getStorageStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
      {
        queryKey: ['admin', 'checklist'],
        queryFn: adminService.getChecklistStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
      {
        queryKey: ['admin', 'tracker'],
        queryFn: adminService.getTrackerStats,
        staleTime: 1000 * 60 * 2,
        retry: 1,
      },
    ],
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)

  const data: AdminDashboardData = {
    clients: results[0].data,
    vehicles: results[1].data,
    inspections: results[2].data,
    invoices: results[3].data,
    storage: results[4].data,
    checklist: results[5].data,
    tracker: results[6].data,
  }

  return { data, isLoading, isError }
}
