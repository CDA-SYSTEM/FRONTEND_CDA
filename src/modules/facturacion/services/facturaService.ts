import { apiClient } from '@/core/api/apiClient'
import type {
  Factura,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  Status,
} from '../domain/factura.types'

export interface GetInvoicesParams {
  invoice_number?: string
  statusId?: string
  inspection_id?: string
  includeDeleted?: string
  page?: number
  size?: number
}

export interface InvoicesResponse {
  data: Factura[]
  total: number
  page: number
  size: number
  totalPages: number
}

export const facturaService = {
  /**
   * Crea una nueva factura.
   */
  async crearFactura(payload: CreateInvoiceDTO): Promise<Factura> {
    const response = await apiClient.post<{ data: Factura }>('/api/v1/invoices', payload)
    return response.data?.data || response.data
  },

  /**
   * Lista facturas con filtros y paginación opcionales.
   */
  async listarFacturas(params?: GetInvoicesParams): Promise<InvoicesResponse> {
    const response = await apiClient.get<{ data: InvoicesResponse }>('/api/v1/invoices', {
      params,
    })
    const base = response.data?.data || response.data
    return {
      data: base.data || [],
      total: base.total ?? 0,
      page: base.page ?? 1,
      size: base.size ?? 10,
      totalPages: base.totalPages ?? 1,
    }
  },

  /**
   * Obtiene una factura por ID.
   */
  async obtenerFacturaPorId(id: string): Promise<Factura> {
    const response = await apiClient.get<{ data: Factura }>(`/api/v1/invoices/${id}`)
    return response.data?.data || response.data
  },

  /**
   * Actualiza una factura.
   */
  async actualizarFactura(id: string, payload: UpdateInvoiceDTO): Promise<Factura> {
    const response = await apiClient.patch<{ data: Factura }>(`/api/v1/invoices/${id}`, payload)
    return response.data?.data || response.data
  },

  /**
   * Elimina lógicamente una factura (solo admin).
   */
  async eliminarFactura(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/invoices/${id}`)
  },

  /**
   * Obtiene todos los estados disponibles.
   */
  async listarStatuses(): Promise<Status[]> {
    const response = await apiClient.get<{ data: Status[] }>('/api/v1/statuses')
    return response.data?.data || response.data || []
  },

  /**
   * Genera factura automáticamente para una inspección existente.
   */
  async generarFacturaDeInspeccion(inspectionId: string): Promise<Factura> {
    const response = await apiClient.post<{ data: Factura }>(
      `/api/v1/inspections/${inspectionId}/generate-invoice`
    )
    return response.data?.data || response.data
  },
}
