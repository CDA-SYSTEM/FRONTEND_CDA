export type VehicleType = 'MOTO' | 'LIVIANO' | 'PESADO'
export type ItemResponse = 'Cumple' | 'No Cumple' | 'No Aplica'
export type InspectionResult = 'APROBADO' | 'RECHAZADO'

export interface ChecklistTemplate {
  id: string
  code: 'MOTOS' | 'LIVIANOS_PESADOS'
  name: string
  version?: number
  active?: boolean
  supported_vehicle_types: string[]
  sections: TemplateSection[]
}

export interface TemplateSection {
  id?: string
  code?: string
  title: string
  order: number
  subsections: TemplateSubsection[]
}

export interface TemplateSubsection {
  id?: string
  code?: string
  title?: string
  order: number
  items: TemplateItem[]
}

export interface TemplateItem {
  id?: string
  code: string
  description: string
  defect_type: 'A' | 'B'
  observation?: string
  order: number
}

export interface InspectionItemResponse {
  section_code: string
  subsection_code: string
  item_code: string
  response: ItemResponse
  defect_type?: 'A' | 'B'
  observation?: string
}

export interface CreateChecklistInspectionDTO {
  plate: string
  vehicle_id: number
  vehicle_type: VehicleType
  inspector_id: string
  client_id?: number
  template_id?: string
  inspection_datetime?: string
  observations?: string
}

export interface CloseChecklistInspectionDTO {
  general_result: InspectionResult
}

export interface ChecklistInspection {
  id: string
  plate: string
  vehicle_id: number
  client_id?: number
  vehicle_type: VehicleType
  template_id?: string
  inspection_datetime?: string
  inspector_id?: string
  status?: string
  general_result?: string
  responses?: InspectionItemResponse[]
  observations?: string
  created_at?: string
  updated_at?: string
}
