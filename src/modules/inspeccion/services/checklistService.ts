import { apiClient } from '@/core/api/apiClient'
import type {
  ChecklistInspection,
  ChecklistTemplate,
  CreateChecklistInspectionDTO,
  CreateLabradoInspectionDTO,
  ChecklistInspectionSearchParams,
  LabradoRecord,
  InspectionItemResponse,
  InspectionResult,
  UpdateLabradoDTO,
  VehicleType,
} from '@/modules/inspeccion/domain/checklist.types'

function extractItem<T>(responseData: unknown): T {
  let current = responseData as unknown
  while (current && typeof current === 'object' && !Array.isArray(current)) {
    const body = current as Record<string, unknown>
    if (!('data' in body) || body.data == null) break
    if (Array.isArray(body.data)) return body.data as T
    current = body.data
  }
  return current as T
}

function extractArray<T>(responseData: unknown): T[] {
  const body = responseData as Record<string, unknown>
  if (Array.isArray(responseData)) return responseData as T[]
  if (body?.data) {
    if (Array.isArray(body.data)) return body.data as T[]
    const inner = body.data as Record<string, unknown>
    if (Array.isArray(inner?.items)) return inner.items as T[]
    if (inner?.data) {
      if (Array.isArray(inner.data)) return inner.data as T[]
      if (typeof inner.data === 'object') {
        const nested = inner.data as Record<string, unknown>
        if (Array.isArray(nested.items)) return nested.items as T[]
        if (Array.isArray(nested.data)) return nested.data as T[]
      }
    }
  }
  return []
}

function extractFirstObject(responseData: unknown): Record<string, unknown> | null {
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return responseData as Record<string, unknown>
  }

  const array = extractArray<unknown>(responseData)
  const first = array.find((item) => item && typeof item === 'object' && !Array.isArray(item))
  return first ? (first as Record<string, unknown>) : null
}

function extractLabradoContainer(responseData: unknown): Record<string, unknown> | null {
  const queue: unknown[] = [responseData]

  while (queue.length > 0) {
    const current = queue.shift()

    if (!current) continue

    if (Array.isArray(current)) {
      queue.push(...current)
      continue
    }

    if (typeof current !== 'object') continue

    const body = current as Record<string, unknown>

    if (body.labrado && typeof body.labrado === 'object') {
      const labrado = body.labrado as Record<string, unknown>
      return {
        ...labrado,
        inspection_id: body.inspection_id ?? body.inspectionId ?? body.inspectionID,
        id: body.id ?? body._id,
        created_at: body.created_at ?? body.createdAt,
        updated_at: body.updated_at ?? body.updatedAt,
      }
    }

    if (body.axles && Array.isArray(body.axles)) {
      return body
    }

    if (body.data != null) {
      queue.push(body.data)
    }
  }

  return extractFirstObject(responseData)
}

function toStringId(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function toNumberId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function obtenerMensajeError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const anyError = error as Record<string, unknown>
    const response = anyError.response as Record<string, unknown> | undefined
    const data = response?.data as Record<string, unknown> | undefined
    const nestedError = data?.error as Record<string, unknown> | undefined
    
    const nestedMsg = typeof nestedError?.message === 'string' ? nestedError.message : undefined
    const topMsg = typeof data?.message === 'string' ? data.message : undefined
    const errorMsg = typeof anyError.message === 'string' ? anyError.message : undefined

    if (nestedMsg) return nestedMsg
    if (topMsg && topMsg !== 'Http Exception') return topMsg
    if (errorMsg) return errorMsg
    if (topMsg) return topMsg
  }
  return fallback
}

function normalizeTemplateSnapshot(raw: unknown): ChecklistTemplate | null {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const sections = Array.isArray(body.sections)
    ? body.sections.map((section) => {
        const sectionBody = (section && typeof section === 'object' ? section : {}) as Record<string, unknown>
        return {
          id: toStringId(sectionBody.id ?? sectionBody.code),
          code: typeof sectionBody.code === 'string' ? sectionBody.code : undefined,
          title: String(sectionBody.title ?? ''),
          order: toNumberId(sectionBody.order) ?? 0,
          subsections: Array.isArray(sectionBody.subsections)
            ? sectionBody.subsections.map((subsection) => {
                const subsectionBody = (subsection && typeof subsection === 'object' ? subsection : {}) as Record<string, unknown>
                return {
                  id: toStringId(subsectionBody.id ?? subsectionBody.code),
                  code: typeof subsectionBody.code === 'string' ? subsectionBody.code : undefined,
                  title: typeof subsectionBody.title === 'string' ? subsectionBody.title : undefined,
                  order: toNumberId(subsectionBody.order) ?? 0,
                  items: Array.isArray(subsectionBody.items)
                    ? subsectionBody.items.map((item) => {
                        const itemBody = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
                        return {
                          id: toStringId(itemBody.id ?? itemBody.code),
                          code: String(itemBody.code ?? ''),
                          description: String(itemBody.description ?? ''),
                          defect_type: String(itemBody.defect_type ?? 'A') as 'A' | 'B',
                          observation: typeof itemBody.observation === 'string' ? itemBody.observation : undefined,
                          order: toNumberId(itemBody.order) ?? 0,
                        }
                      })
                    : [],
                }
              })
            : [],
        }
      })
    : []

  if (sections.length === 0) return null

  return {
    id: toStringId(body.id ?? body.template_id ?? body.templateId),
    code: String(body.code ?? '' ) as ChecklistTemplate['code'],
    name: String(body.name ?? ''),
    version: toNumberId(body.version),
    active: typeof body.active === 'boolean' ? body.active : undefined,
    supported_vehicle_types: Array.isArray(body.supported_vehicle_types)
      ? body.supported_vehicle_types.map((item) => String(item))
      : [],
    sections,
    response_options: Array.isArray(body.response_options)
      ? (body.response_options as ChecklistTemplate['response_options'])
      : undefined,
  }
}

function normalizeChecklistInspection(raw: unknown): ChecklistInspection {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const vehicle = (body.vehicle && typeof body.vehicle === 'object' ? body.vehicle : {}) as Record<string, unknown>
  const id = toStringId(body.id ?? body.inspection_id ?? body.inspectionId ?? body._id)
  return {
    id,
    inspection_number: toStringId(body.inspection_number ?? body.inspectionNumber),
    plate: toStringId(body.plate ?? body.placa ?? vehicle.plate ?? vehicle.placa),
    vehicle_id: toNumberId(body.vehicle_id ?? body.vehicleId ?? vehicle.id) ?? 0,
    client_id: toNumberId(body.client_id ?? body.clientId ?? body.customer_id ?? body.customerId),
    vehicle_type: String(body.vehicle_type ?? body.vehicleType ?? vehicle.vehicle_type ?? vehicle.tipoVehiculo ?? 'LIVIANO') as ChecklistInspection['vehicle_type'],
    template_id: toStringId(body.template_id ?? body.templateId),
    inspection_datetime: toStringId(body.inspection_datetime ?? body.inspectionDatetime ?? body.created_at ?? body.createdAt),
    inspector_id: toStringId(body.inspector_id ?? body.inspectorId ?? body.operator_id ?? body.operatorId),
    status: toStringId(body.status),
    general_result: toStringId(body.general_result ?? body.generalResult),
    responses: Array.isArray(body.responses) ? (body.responses as ChecklistInspection['responses']) : undefined,
    observations: typeof body.observations === 'string' ? body.observations : undefined,
    created_at: toStringId(body.created_at ?? body.createdAt),
    updated_at: toStringId(body.updated_at ?? body.updatedAt),
    template_snapshot: normalizeTemplateSnapshot(body.template_snapshot ?? body.templateSnapshot) ?? undefined,
    template_ref: body.template_ref && typeof body.template_ref === 'object'
      ? {
          template_id: toStringId((body.template_ref as Record<string, unknown>).template_id ?? (body.template_ref as Record<string, unknown>).templateId),
          code: typeof (body.template_ref as Record<string, unknown>).code === 'string'
            ? String((body.template_ref as Record<string, unknown>).code)
            : undefined,
          version: toNumberId((body.template_ref as Record<string, unknown>).version),
        }
      : undefined,
    client: body.client,
    vehicle: body.vehicle,
    inspector: body.inspector,
    labrado: body.labrado,
  }
}

function normalizeLabradoRecord(raw: unknown): LabradoRecord {
  const body = extractLabradoContainer(raw) ?? {}
  const inspection = (body.inspection && typeof body.inspection === 'object' ? body.inspection : {}) as Record<string, unknown>
  return {
    id: toStringId(body.id ?? body._id),
    inspection_id: toStringId(body.inspection_id ?? body.inspectionId ?? body.inspectionID ?? inspection.id),
    minimum_mm: toNumberId(body.minimum_mm ?? body.minimumMm),
    measured_at: toStringId(body.measured_at ?? body.measuredAt),
    axles: Array.isArray(body.axles)
      ? (body.axles as LabradoRecord['axles'])
      : Array.isArray((body.labrado as Record<string, unknown> | undefined)?.axles)
        ? (((body.labrado as Record<string, unknown>).axles) as LabradoRecord['axles'])
        : [],
    created_at: toStringId(body.created_at ?? body.createdAt),
    updated_at: toStringId(body.updated_at ?? body.updatedAt),
  }
}

function normalizeInspectionList(responseData: unknown): ChecklistInspection[] {
  return extractArray<unknown>(responseData)
    .map((item) => normalizeChecklistInspection(item))
    .filter((item) => Boolean(item.id))
}

export const checklistService = {
  /**
   * HU-015 + HU-014: Obtiene la plantilla activa para el tipo de vehículo.
   * Primero intenta con los endpoints dedicados (/motos o /livianos-pesados),
   * luego como fallback usa el listado genérico con filtro.
   */
  async obtenerPlantillaActiva(vehicleType: VehicleType): Promise<ChecklistTemplate | null> {
    // 1) Intentar con el endpoint dedicado
    try {
      const dedicatedUrl = vehicleType === 'MOTO'
        ? '/api/v1/checklist/templates/motos'
        : '/api/v1/checklist/templates/livianos-pesados'

      const res = await apiClient.get(dedicatedUrl)
      const template = extractItem<ChecklistTemplate>(res.data)
      if (template?.sections) return template
    } catch {
      // Si el dedicado falla, continuar con el genérico
    }

    // 2) Fallback: listar todas y filtrar por vehicle_type
    try {
      const response = await apiClient.get('/api/v1/checklist/templates', {
        params: { vehicle_type: vehicleType },
      })
      const templates = extractArray<ChecklistTemplate>(response.data)
      const activa = templates.find((t) => t.active === true)
      return activa ?? templates[0] ?? null
    } catch {
      return null
    }
  },

  async crearInspeccion(dto: CreateChecklistInspectionDTO): Promise<ChecklistInspection | null> {
    try {
      const response = await apiClient.post('/api/v1/checklist/inspections', dto)
      return normalizeChecklistInspection(extractItem<unknown>(response.data))
    } catch {
      return null
    }
  },

  async listarInspecciones(params: ChecklistInspectionSearchParams = {}): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get('/api/v1/checklist/inspections/search', { params })
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async buscarInspeccionesPorPlaca(plate: string): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/inspections/by-plate/${encodeURIComponent(plate)}`)
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async buscarInspeccionesPorEstado(status: string): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/inspections/by-status/${encodeURIComponent(status)}`)
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async buscarInspeccionesPorVehiculo(vehicleId: string | number): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/inspections/by-vehicle/${encodeURIComponent(String(vehicleId))}`)
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async buscarInspeccionesPorFecha(start: string, end: string): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get('/api/v1/checklist/inspections/by-date', {
        params: { start, end },
      })
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async guardarBorrador(
    id: string,
    payload: {
      plate: string
      vehicle_id: number
      client_id?: number
      vehicle_type: VehicleType
      template_id?: string
      inspection_datetime?: string
      inspector_id?: string
      responses: InspectionItemResponse[]
      observations?: string
    },
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/in-progress`, {
        plate: payload.plate,
        vehicle_id: payload.vehicle_id,
        client_id: payload.client_id,
        vehicle_type: payload.vehicle_type,
        template_id: payload.template_id,
        inspection_datetime: payload.inspection_datetime,
        inspector_id: payload.inspector_id,
        responses: payload.responses,
        observations: payload.observations,
      })
      return true
    } catch {
      return false
    }
  },

  async marcarEnProgreso(
    id: string,
    responses: InspectionItemResponse[],
    observations?: string,
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/in-progress`, {
        responses,
        observations,
      })
      return true
    } catch {
      return false
    }
  },

  async cerrarInspeccion(
    id: string,
    generalResult: InspectionResult,
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/close`, {
        general_result: generalResult,
      })
      return true
    } catch (error) {
      throw new Error(obtenerMensajeError(error, 'No se pudo cerrar la inspección'))
    }
  },

  async obtenerInspeccion(id: string): Promise<ChecklistInspection | null> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/inspections/${id}`)
      return normalizeChecklistInspection(extractItem<unknown>(response.data))
    } catch {
      return null
    }
  },

  async crearLabrado(dto: CreateLabradoInspectionDTO): Promise<LabradoRecord | null> {
    try {
      const response = await apiClient.post('/api/v1/checklist/labrado', dto)
      return normalizeLabradoRecord(extractItem<unknown>(response.data))
    } catch {
      return null
    }
  },

  async obtenerLabradoPorInspeccion(inspectionId: string): Promise<LabradoRecord | null> {
    try {
      const response = await apiClient.get(`/api/v1/checklist/labrado/by-inspection/${inspectionId}`)
      return normalizeLabradoRecord(response.data)
    } catch {
      return null
    }
  },

  async actualizarLabradoPorInspeccion(inspectionId: string, dto: UpdateLabradoDTO): Promise<LabradoRecord | null> {
    try {
      const response = await apiClient.put(`/api/v1/checklist/labrado/by-inspection/${inspectionId}`, dto)
      return normalizeLabradoRecord(response.data)
    } catch {
      return null
    }
  },

  async subirFoto(blob: Blob): Promise<string | null> {
    try {
      // Temporary debug: log when uploading a photo
      try {
        // eslint-disable-next-line no-console
        console.debug('[checklistService] subirFoto called, size:', blob.size)
      } catch {}
      const formData = new FormData()
      formData.append('file', blob, `photo-${Date.now()}.jpg`)
      const response = await apiClient.post('/api/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const body = response.data as Record<string, unknown>
      const inner = (body?.data as Record<string, unknown>) || body

      // Extraer URL de archivo de forma segura — el backend puede devolverla como string o dentro de un objeto
      const raw = inner.url || inner.fileUrl || inner.id
      let photoUrl: string | null = null
      if (typeof raw === 'string' && raw.trim()) {
        photoUrl = raw.trim()
      }
      if (!photoUrl) return null
      return photoUrl.startsWith('http') ? photoUrl : `/api/v1/storage/files/${photoUrl}`
    } catch {
      return null
    }
  },

  async buscarInspecciones(params: {
    plate?: string
    vehicle_id?: number
    status?: string
    page?: number
    page_size?: number
  }): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get('/api/v1/checklist/inspections/search', { params })
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async obtenerTodasLasInspecciones(): Promise<ChecklistInspection[]> {
    try {
      const response = await apiClient.get('/api/v1/checklist/inspections')
      return normalizeInspectionList(response.data)
    } catch {
      return []
    }
  },

  async actualizarInspeccion(
    id: string,
    dto: Partial<CreateChecklistInspectionDTO> & { responses?: InspectionItemResponse[] },
  ): Promise<ChecklistInspection | null> {
    try {
      const response = await apiClient.put(`/api/v1/checklist/inspections/${id}`, dto)
      return normalizeChecklistInspection(extractItem<unknown>(response.data))
    } catch {
      return null
    }
  },

  async eliminarInspeccion(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/v1/checklist/inspections/${id}`)
      return true
    } catch {
      return false
    }
  },

  async guardarComoBorrador(
    id: string,
    payload: {
      plate: string
      vehicle_id: number
      client_id?: number
      vehicle_type: VehicleType
      template_id?: string
      inspection_datetime?: string
      inspector_id?: string
      responses: InspectionItemResponse[]
      observations?: string
    },
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/v1/checklist/inspections/${id}/draft`, {
        plate: payload.plate,
        vehicle_id: payload.vehicle_id,
        client_id: payload.client_id,
        vehicle_type: payload.vehicle_type,
        template_id: payload.template_id,
        inspection_datetime: payload.inspection_datetime,
        inspector_id: payload.inspector_id,
        responses: payload.responses,
        observations: payload.observations,
      })
      return true
    } catch {
      return false
    }
  },
}
