export interface TemplateType {
  code: string
  name: string
}

export interface TemplateVariable {
  tag: string
  name: string
  category: string
  description: string
}

export interface InvoiceTemplate {
  id: string
  name: string
  typeCode: string
  body: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateDto {
  name: string
  typeCode: string
  body: string
  isActive?: boolean
}
