import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { checklistService } from '@/modules/inspeccion/services/checklistService'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import { vehiculoService } from '@/modules/vehiculo/services/vehiculoService'
import type {
  ChecklistInspection,
  ChecklistTemplate,
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

function inferirVehicleType(tipoVehiculo: string): VehicleType {
  const t = tipoVehiculo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (t.includes('moto')) return 'MOTO'
  if (t.includes('pesad') || t.includes('pesado')) return 'PESADO'
  if (t.includes('livian') || t.includes('libian') || t.includes('liviano')) return 'LIVIANO'
  return 'LIVIANO'
}

export function useChecklist(inspectionId: string) {
  const user = useAuthStore((s) => s.user)

  const [estado, setEstado] = useState<EstadoChecklist>('cargando')
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null)
  const [checklistInspection, setChecklistInspection] = useState<ChecklistInspection | null>(null)
  const [responses, setResponses] = useState<Map<string, InspectionItemResponse>>(new Map())
  const [observaciones, setObservaciones] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null)
  const [plate, setPlate] = useState('')
  const [vehicleId, setVehicleId] = useState<number>(0)
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null)
  const createdRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function inicializar() {
      setEstado('cargando')
      try {
        const detalle = await inspeccionService.obtenerDetalle(inspectionId)
        if (!mounted || !detalle) {
          if (mounted) { setEstado('error'); setErrorMensaje('No se encontró la orden de inspección') }
          return
        }

        const vehicleIdStr = detalle.vehicle?.id || detalle.vehicle_id
        if (!vehicleIdStr) {
          if (mounted) { setEstado('error'); setErrorMensaje('La orden no tiene vehículo asociado') }
          return
        }

        const plateStr = detalle.vehicle?.placa || ''
        setPlate(plateStr)

        const vId = Number(vehicleIdStr)
        setVehicleId(vId)

        const vehiculo = await vehiculoService.obtenerVehiculoPorId(String(vId))
        if (!mounted) return

        let tipo: VehicleType = 'LIVIANO'
        if (vehiculo?.tipoVehiculo) {
          const raw = typeof vehiculo.tipoVehiculo === 'object'
            ? (vehiculo.tipoVehiculo as { nombre?: string }).nombre || ''
            : String(vehiculo.tipoVehiculo)
          tipo = inferirVehicleType(raw)
        }
        setVehicleType(tipo)

        const plantilla = await checklistService.obtenerPlantillaActiva(tipo)
        if (!mounted) return

        if (!plantilla) {
          setEstado('plantilla_sin_asignar')
          setErrorMensaje(`No hay una plantilla activa para vehículos tipo ${tipo}`)
          return
        }

        setTemplate(plantilla)

        if (!createdRef.current && user) {
          const creada = await checklistService.crearInspeccion({
            plate: plateStr,
            vehicle_id: vId,
            vehicle_type: tipo,
            inspector_id: user.id,
            template_id: plantilla.id,
          })
          if (!mounted) return
          if (creada) {
            createdRef.current = true
            setChecklistInspection(creada)
          } else {
            console.warn('[Checklist] No se pudo crear la inspección en el servicio checklist. El backend podría no estar disponible.')
          }
        }

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
    return () => { mounted = false }
  }, [inspectionId, user])

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

  const itemsSinResponder = useCallback(() => {
    if (!template) return 0
    let count = 0
    for (const section of template.sections) {
      for (const sub of section.subsections) {
        for (const item of sub.items) {
          const key = `${section.code || ''}:${sub.code || ''}:${item.code}`
          if (!responses.has(key)) count++
        }
      }
    }
    return count
  }, [template, responses])

  const progresoActual = useCallback(() => {
    if (!template) return { respondidos: 0, total: 0 }
    const total = template.sections.reduce(
      (sum, s) => sum + s.subsections.reduce((sSum, ss) => sSum + ss.items.length, 0), 0
    )
    const respondidos = total - itemsSinResponder()
    return { respondidos, total }
  }, [template, itemsSinResponder])

  const obtenerRespuestasArray = useCallback((): InspectionItemResponse[] => {
    return Array.from(responses.values())
  }, [responses])

  const guardar = useCallback(async () => {
    if (!checklistInspection) return false
    setEstado('enviando')
    const ok = await checklistService.guardarBorrador(
      checklistInspection.id,
      obtenerRespuestasArray(),
      observaciones,
    )
    if (ok) setEstado('listo')
    else { setEstado('error_envio'); setErrorMensaje('Error al guardar el borrador') }
    return ok
  }, [checklistInspection, obtenerRespuestasArray, observaciones])

  const cerrar = useCallback(async (resultado: InspectionResult) => {
    if (!checklistInspection) return false
    const sinResponder = itemsSinResponder()
    if (sinResponder > 0) {
      setErrorMensaje(`Faltan ${sinResponder} ítems por responder`)
      return false
    }

    setEstado('enviando')
    const guardadoOk = await checklistService.guardarBorrador(
      checklistInspection.id,
      obtenerRespuestasArray(),
      observaciones,
    )
    if (!guardadoOk) {
      setEstado('error_envio')
      setErrorMensaje('Error al guardar antes de cerrar')
      return false
    }

    const cerradoOk = await checklistService.cerrarInspeccion(checklistInspection.id, {
      general_result: resultado,
    })
    if (cerradoOk) {
      setEstado('exito')
      return true
    }
    setEstado('error_envio')
    setErrorMensaje('Error al cerrar la inspección')
    return false
  }, [checklistInspection, itemsSinResponder, obtenerRespuestasArray, observaciones])

  return {
    estado,
    template,
    checklistInspection,
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
    itemsSinResponder: itemsSinResponder(),
    guardar,
    cerrar,
  }
}
