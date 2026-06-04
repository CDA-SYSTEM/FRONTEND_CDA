export interface InvoiceClient {
  document: string
  name: string
  address?: string
  phone?: string
  email?: string
}

export interface InvoiceItem {
  concept: string
  quantity: number
  unitPrice: number
  total?: number
}

export interface Factura {
  id: string
  invoice_number: string
  client: InvoiceClient
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  statusId: string
  inspection_id: string
  observations: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  statusName?: string // added by controller if resolved, or resolved on frontend
}

export interface CreateInvoiceDTO {
  client: InvoiceClient
  items: InvoiceItem[]
  statusId: string
  inspection_id: string
  observations?: string
}

export interface UpdateInvoiceDTO {
  client?: InvoiceClient
  items?: InvoiceItem[]
  statusId?: string
  inspection_id?: string
  observations?: string
}
