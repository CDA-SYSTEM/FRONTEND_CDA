export type VehicleType = 'MOTO' | 'LIVIANO' | 'PESADO'

/**
 * El backend acepta cualquier string como response (example: "APROBADO").
 * Según la NTC 5375, las opciones estándar son:
 * - "CUMPLE" (conforme, sin defectos)
 * - "DEFECTO_LEVE" (defecto tipo A)
 * - "DEFECTO_GRAVE" (defecto tipo B)
 * - "NO_APLICA"
 *
 * Usamos string para ser flexibles con lo que envíe/acepte el backend.
 */
export type ItemResponse = string
export type InspectionResult = 'APROBADO' | 'RECHAZADO'

export interface ResponseOption {
  value: string
  label: string
  icon: string
  color: string
  bg: string
  border: string
}

export interface ChecklistTemplate {
  id: string
  code: 'MOTOS' | 'LIVIANOS_PESADOS'
  name: string
  version?: number
  active?: boolean
  supported_vehicle_types: string[]
  sections: TemplateSection[]
  /** Si el backend envía opciones de respuesta en la plantilla, se usan estas */
  response_options?: ResponseOption[]
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

export interface InspectionItemPhoto {
  id: string
  compressedBlob: Blob
  previewUrl: string
  uploadedUrl?: string
  uploading?: boolean
}

export interface InspectionItemResponse {
  section_code: string
  subsection_code: string
  item_code: string
  response: ItemResponse
  defect_type?: 'A' | 'B'
  observation?: string
  photos?: string[]
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

export interface ChecklistInspectionSearchParams {
  page?: number
  page_size?: number
  plate?: string
  status?: string
  vehicle_id?: number
  start_date?: string
  end_date?: string
}

export interface ChecklistInspection {
  id: string
  inspection_number?: string
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
  template_snapshot?: ChecklistTemplate
  template_ref?: {
    template_id?: string
    code?: string
    version?: number
  }
  client?: unknown
  vehicle?: unknown
  inspector?: unknown
  labrado?: unknown
}

/* ── Labrado (medición de desgaste de llantas) ── */
/* Estructura del Swagger: axles → wheels → tires */
export interface TireMeasurement {
  tire_code: string
  outer_mm: number
  middle_mm: number
  inner_mm: number
}

export interface WheelMeasurement {
  wheel_code: string
  minimum_mm?: number
  tires: TireMeasurement[]
}

export interface AxleMeasurement {
  axle_code: string
  minimum_mm?: number
  wheels: WheelMeasurement[]
}

export interface CreateLabradoDTO {
  inspection_id: string
  axles: AxleMeasurement[]
}

export interface UpdateLabradoDTO {
  axles: AxleMeasurement[]
}

export interface LabradoRecord {
  id?: string
  inspection_id: string
  minimum_mm?: number
  measured_at?: string
  axles: AxleMeasurement[]
  created_at?: string
  updated_at?: string
}

export interface CreateLabradoInspectionDTO {
  inspection_id: string
  axles: AxleMeasurement[]
}
