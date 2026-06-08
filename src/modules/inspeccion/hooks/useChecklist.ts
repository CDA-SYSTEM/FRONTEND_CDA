import { useCallback, useEffect, useRef, useState } from 'react'
import { checklistService } from '@/modules/inspeccion/services/checklistService'
import { compressImage, revokePreviewUrls } from '@/shared/utils/imageCompression'
import { offlineStorage } from '@/core/services/offlineStorage'
import { usuarioService } from '@/modules/usuarios/services/usuarioService'
import type { Usuario } from '@/modules/usuarios/domain/usuario.types'
import type {
  ChecklistInspection,
  ChecklistTemplate,
  InspectionItemPhoto,
  InspectionItemResponse,
  InspectionResult,
  ItemResponse,
  VehicleType,
} from '@/modules/inspeccion/domain/checklist.types'

export type EstadoChecklist =
  | 'cargando'
  | 'error'
  | 'plantilla_sin_asignar'
  | 'listo'
  | 'enviando'
  | 'exito'
  | 'error_envio'

export function useChecklist(inspectionId: string, vehicleTypeFromUrl?: VehicleType | null) {
  const [estado, setEstado] = useState<EstadoChecklist>('cargando')
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null)
  const [checklistInspection, setChecklistInspection] = useState<ChecklistInspection | null>(null)
  const [responses, setResponses] = useState<Map<string, InspectionItemResponse>>(new Map())
  const [itemPhotos, setItemPhotos] = useState<Map<string, InspectionItemPhoto[]>>(new Map())
  const [observaciones, setObservaciones] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(vehicleTypeFromUrl ?? null)
  const [plate, setPlate] = useState('')
  const [vehicleId, setVehicleId] = useState<number>(0)
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null)
  const [inspectores, setInspectores] = useState<Usuario[]>([])
  const [inspectorId, setInspectorId] = useState<string>('')
  const [cargandoInspectores, setCargandoInspectores] = useState(false)
  const itemPhotosRef = useRef(itemPhotos)
  const inspectionKey = checklistInspection?.id || inspectionId

  const responsesFromChecklist = useCallback((detalle: ChecklistInspection) => {
    const next = new Map<string, InspectionItemResponse>()
    for (const response of detalle.responses || []) {
      const key = `${response.section_code}:${response.subsection_code}:${response.item_code}`
      next.set(key, response)
    }
    return next
  }, [])

  useEffect(() => {
    itemPhotosRef.current = itemPhotos
  }, [itemPhotos])

  useEffect(() => {
    let mounted = true

    async function inicializar() {
      setEstado('cargando')
      try {
        const detalle = await checklistService.obtenerInspeccion(inspectionId)
        if (!mounted || !detalle) {
          if (mounted) { setEstado('error'); setErrorMensaje('No se encontró la inspección') }
          return
        }

        const plateStr = detalle.plate || ''
        const vId = detalle.vehicle_id || 0
        const tipo: VehicleType = vehicleTypeFromUrl || detalle.vehicle_type || 'LIVIANO'

        setChecklistInspection(detalle)
        setPlate(plateStr)
        setVehicleId(vId)
        setVehicleType(tipo)
        setResponses(responsesFromChecklist(detalle))
        setInspectorId(detalle.inspector_id || '')

        // Cargar inspectores
        setCargandoInspectores(true)
        try {
          const list = await usuarioService.obtenerPersonalAsignable('inspector')
          if (mounted) {
            setInspectores(list)
          }
        } catch (e) {
          console.error('Error cargando inspectores en useChecklist:', e)
        } finally {
          if (mounted) setCargandoInspectores(false)
        }

        if (detalle.template_snapshot) {
          setTemplate(detalle.template_snapshot)
          setEstado('listo')
          return
        }

        const plantilla = await checklistService.obtenerPlantillaActiva(tipo)
        if (!mounted) return

        if (!plantilla) {
          setEstado('plantilla_sin_asignar')
          setErrorMensaje(`No hay una plantilla activa para vehículos tipo ${tipo}`)
          return
        }

        setTemplate(plantilla)

        setEstado('listo')
      } catch (err) {
        if (!mounted) return
        setEstado('error')
        setErrorMensaje(
          err && typeof err === 'object' && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : 'Error al cargar el checklist',
        )
      }
    }

    inicializar()

    /* HU-037: Restaurar datos offline guardados para esta inspección */
    ;(async () => {
      try {
        const savedInspection = await offlineStorage.obtenerMetadata(`inspection:${inspectionId}`)
        if (savedInspection === inspectionId) {
          const savedResponses = await offlineStorage.obtenerRespuestas()
          if (savedResponses.size > 0) setResponses(savedResponses)
          const savedFotos = await offlineStorage.obtenerFotos()
          if (savedFotos.size > 0) setItemPhotos(savedFotos)
          const savedObs = await offlineStorage.obtenerMetadata(`observaciones:${inspectionId}`)
          if (savedObs) setObservaciones(savedObs)
        }
      } catch {
        // Silencioso
      }
    })()

    return () => {
      mounted = false
      itemPhotosRef.current.forEach((photos) => revokePreviewUrls(photos.map((p) => p.previewUrl)))
    }
  }, [inspectionId, responsesFromChecklist])

  /* HU-037: Persistir respuestas y observaciones automáticamente */
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current)
    persistTimeoutRef.current = setTimeout(() => {
      offlineStorage.guardarMetadata(`inspection:${inspectionId}`, inspectionId)
      offlineStorage.guardarRespuestas(Array.from(responses.entries()))
      offlineStorage.guardarMetadata(`observaciones:${inspectionId}`, observaciones)
    }, 500)
    return () => { if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current) }
  }, [responses, observaciones, inspectionId])

  const responderItem = useCallback((
    section_code: string,
    subsection_code: string,
    item_code: string,
    response: ItemResponse,
  ) => {
    setResponses((prev) => {
      const next = new Map(prev)
      const key = `${section_code}:${subsection_code}:${item_code}`
      const existing = next.get(key)

      // Toggle de selección: si llega vacío o la misma respuesta previa, se desmarca.
      if (!String(response).trim() || existing?.response === response) {
        next.delete(key)
        return next
      }

      next.set(key, {
        section_code,
        subsection_code,
        item_code,
        response,
        defect_type: existing?.defect_type,
        observation: existing?.observation,
      })
      return next
    })
  }, [])

  const agregarObservacion = useCallback((
    section_code: string,
    subsection_code: string,
    item_code: string,
    observation: string,
  ) => {
    setResponses((prev) => {
      const next = new Map(prev)
      const key = `${section_code}:${subsection_code}:${item_code}`
      const existing = next.get(key)
      next.set(key, {
        section_code,
        subsection_code,
        item_code,
        response: existing?.response || 'CUMPLE',
        defect_type: existing?.defect_type,
        observation,
      })
      return next
    })
  }, [])

  const agregarFoto = useCallback(async (
    section_code: string,
    subsection_code: string,
    item_code: string,
    file: File,
  ) => {
    const key = `${section_code}:${subsection_code}:${item_code}`

    const compressedBlob = await compressImage(file)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const previewUrl = URL.createObjectURL(compressedBlob)

    const photo: InspectionItemPhoto = { id, compressedBlob, previewUrl }

    setItemPhotos((prev) => {
      const next = new Map(prev)
      const existing = next.get(key) || []
      next.set(key, [...existing, photo])
      return next
    })

    /* HU-037: Persistir blob en IndexedDB */
    await offlineStorage.guardarFoto(key, id, compressedBlob)
  }, [])

  const eliminarFoto = useCallback((
    section_code: string,
    subsection_code: string,
    item_code: string,
    photoId: string,
  ) => {
    const key = `${section_code}:${subsection_code}:${item_code}`
    setItemPhotos((prev) => {
      const next = new Map(prev)
      const photos = (next.get(key) || []).filter((p) => {
        if (p.id === photoId) URL.revokeObjectURL(p.previewUrl)
        return p.id !== photoId
      })
      if (photos.length > 0) next.set(key, photos)
      else next.delete(key)
      return next
    })
    /* HU-037: Eliminar blob de IndexedDB */
    offlineStorage.eliminarFoto(key, photoId)
  }, [])

  const obtenerFotosPorItem = useCallback((
    section_code: string,
    subsection_code: string,
    item_code: string,
  ): InspectionItemPhoto[] => {
    const key = `${section_code}:${subsection_code}:${item_code}`
    return itemPhotos.get(key) || []
  }, [itemPhotos])

  const itemsSinResponder = useCallback(() => {
    return 0
  }, [])

  const progresoActual = useCallback(() => {
    if (!template) return { respondidos: 0, total: 0 }
    const total = template.sections.reduce(
      (sum, s) => sum + s.subsections.reduce((sSum, ss) => sSum + ss.items.length, 0), 0
    )
    const respondidos = total - itemsSinResponder()
    return { respondidos, total }
  }, [template, itemsSinResponder])

  const obtenerRespuestasArray = useCallback((): InspectionItemResponse[] => {
    return Array.from(responses.entries()).map(([key, r]) => {
      const photos = itemPhotos.get(key)
      // Extraer URLs de fotos de forma segura (uploadedUrl puede venir como objeto del backend)
      const photoUrls = photos
        ?.map((p) => {
          const u = p.uploadedUrl || p.previewUrl
          return typeof u === 'string' && u.trim() ? u.trim() : null
        })
        .filter((u): u is string => u !== null)
      return {
        ...r,
        photos: photoUrls?.length ? photoUrls : undefined,
      }
    })
  }, [responses, itemPhotos])

  const construirPayloadInspeccion = useCallback(() => {
    if (!checklistInspection) return null
    const finalResponses: InspectionItemResponse[] = []

    if (template) {
      for (const section of template.sections) {
        for (const sub of section.subsections) {
          for (const item of sub.items) {
            const key = `${section.code || ''}:${sub.code || ''}:${item.code}`
            const existing = responses.get(key)
            if (existing) {
              finalResponses.push({
                section_code: String(existing.section_code ?? '').trim(),
                subsection_code: String(existing.subsection_code ?? '').trim(),
                item_code: String(existing.item_code ?? '').trim(),
                response: String(existing.response ?? 'CUMPLE'),
                defect_type: (existing as any).defect_type ?? undefined,
                observation: (existing as any).observation ?? undefined,
                photos: Array.isArray((existing as any).photos) ? (existing as any).photos : undefined,
              })
            }
          }
        }
      }
    } else {
      const rawResponses = obtenerRespuestasArray()
      finalResponses.push(...rawResponses.map((r) => ({
        section_code: String(r.section_code ?? '').trim(),
        subsection_code: String(r.subsection_code ?? '').trim(),
        item_code: String(r.item_code ?? '').trim(),
        response: String(r.response ?? 'CUMPLE'),
        defect_type: (r as any).defect_type ?? undefined,
        observation: (r as any).observation ?? undefined,
        photos: Array.isArray((r as any).photos) ? (r as any).photos : undefined,
      })))
    }

    const normalizedResponses = finalResponses.filter((r) => r.section_code && r.subsection_code && r.item_code)

    return {
      plate: checklistInspection.plate || plate,
      vehicle_id: checklistInspection.vehicle_id || vehicleId,
      client_id: checklistInspection.client_id,
      vehicle_type: checklistInspection.vehicle_type || (vehicleType || 'LIVIANO'),
      template_id: checklistInspection.template_id || checklistInspection.template_ref?.template_id || template?.id,
      inspection_datetime: checklistInspection.inspection_datetime,
      inspector_id: inspectorId || checklistInspection.inspector_id,
      responses: normalizedResponses,
      observations: observaciones,
    }
  }, [checklistInspection, template, responses, obtenerRespuestasArray, observaciones, plate, vehicleId, vehicleType, inspectorId])

  const guardar = useCallback(async () => {
    if (!checklistInspection) return false
    setEstado('enviando')

    /* HU-037: Persistir offline antes del intento de API */
    await offlineStorage.guardarMetadata(`inspection:${inspectionId}`, inspectionId)
    await offlineStorage.guardarRespuestas(Array.from(responses.entries()))
    await offlineStorage.guardarMetadata(`observaciones:${inspectionId}`, observaciones)

    const payload = construirPayloadInspeccion()
    if (!payload) return false

    try {
      const ok = await checklistService.guardarBorrador(inspectionKey, payload)
      if (ok) {
        setEstado('listo')
        return true
      }
      setEstado('error_envio')
      setErrorMensaje('Error al guardar el borrador')
      return false
    } catch (error) {
      setEstado('error_envio')
      setErrorMensaje(
        error && typeof error === 'object' && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : 'Error al guardar el borrador'
      )
      return false
    }
  }, [checklistInspection, inspectionKey, construirPayloadInspeccion, inspectionId, observaciones, responses])

  const cerrar = useCallback(async (resultado: InspectionResult) => {
    if (!checklistInspection) return false

    setEstado('enviando')

    /* HU-037: Persistir offline antes del intento de API */
    await offlineStorage.guardarMetadata(`inspection:${inspectionId}`, inspectionId)
    await offlineStorage.guardarRespuestas(Array.from(responses.entries()))
    await offlineStorage.guardarMetadata(`observaciones:${inspectionId}`, observaciones)

    const payload = construirPayloadInspeccion()
    if (!payload) return false

    try {
      const guardadoOk = await checklistService.guardarBorrador(inspectionKey, payload)
      if (!guardadoOk) {
        setEstado('error_envio')
        setErrorMensaje('Error al guardar antes de cerrar')
        return false
      }

      const cerradoOk = await checklistService.cerrarInspeccion(inspectionKey, resultado)
      if (cerradoOk) {
        /* HU-037: Limpiar datos offline tras cierre exitoso */
        await offlineStorage.limpiarTodo(inspectionId)
        setEstado('exito')
        return true
      }
      setEstado('error_envio')
      setErrorMensaje('Error al cerrar la inspección')
      return false
    } catch (error) {
      setEstado('error_envio')
      setErrorMensaje(
        error && typeof error === 'object' && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : 'Error al procesar la inspección',
      )
      return false
    }
  }, [checklistInspection, inspectionKey, observaciones, responses, inspectionId, construirPayloadInspeccion])

  return {
    estado,
    template,
    checklistInspection,
    responses,
    vehicleType,
    plate,
    vehicleId,
    observaciones,
    setObservaciones,
    errorMensaje,
    setErrorMensaje,
    progreso: progresoActual(),
    responderItem,
    agregarObservacion,
    agregarFoto,
    eliminarFoto,
    obtenerFotosPorItem,
    itemsSinResponder: itemsSinResponder(),
    guardar,
    cerrar,
    inspectorId,
    setInspectorId,
    inspectores,
    cargandoInspectores,
  }
}
