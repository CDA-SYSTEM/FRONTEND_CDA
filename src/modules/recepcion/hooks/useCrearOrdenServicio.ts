import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { ordenServicioService } from '@/modules/recepcion/services/ordenServicioService'
import type {
  CatalogoItem,
  ClienteConVehiculos,
  OrdenServicioResponse,
} from '@/modules/recepcion/domain/ordenServicio.types'
import type { Vehiculo } from '@/modules/recepcion/domain/recepcion.types'

export type PasoWizard = 'cliente' | 'vehiculo' | 'detalle' | 'confirmacion'

export type EstadoEnvio = 'idle' | 'enviando' | 'exito' | 'error'

export function useCrearOrdenServicio() {
  const user = useAuthStore((s) => s.user)

  const [paso, setPaso] = useState<PasoWizard>('cliente')
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null)

  const [tiposRevision, setTiposRevision] = useState<CatalogoItem[]>([])
  const [tiposCliente, setTiposCliente] = useState<CatalogoItem[]>([])

  const [cliente, setCliente] = useState<ClienteConVehiculos | null>(null)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [vehiculo, setVehiculo] = useState<{ id: number | string; placa: string } | null>(null)
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false)

  const [mileage, setMileage] = useState('')
  const [revisionType, setRevisionType] = useState('')
  const [customerType, setCustomerType] = useState('')

  const [estadoEnvio, setEstadoEnvio] = useState<EstadoEnvio>('idle')
  const [ordenCreada, setOrdenCreada] = useState<OrdenServicioResponse | null>(null)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function cargar() {
      try {
        const [rev, cust] = await Promise.all([
          ordenServicioService.obtenerTiposRevision(),
          ordenServicioService.obtenerTiposCliente(),
        ])
        if (!mounted) return
        setTiposRevision(rev)
        setTiposCliente(cust)
        if (rev.length > 0) setRevisionType(String(rev[0].id))
        if (cust.length > 0) setCustomerType(String(cust[0].id))
      } catch {
        if (!mounted) return
        setErrorCatalogo('No se pudieron cargar los catálogos.')
      } finally {
        if (mounted) setCargandoCatalogos(false)
      }
    }
    cargar()
    return () => { mounted = false }
  }, [])

  const seleccionarCliente = useCallback(async (c: ClienteConVehiculos) => {
    setCliente(c)
    setVehiculo(null)
    setCargandoVehiculos(true)
    try {
      const v = await ordenServicioService.obtenerVehiculosCliente(c.id)
      setVehiculos(v)
      setPaso('vehiculo')
    } catch {
      setVehiculos([])
      setPaso('vehiculo')
    } finally {
      setCargandoVehiculos(false)
    }
  }, [])

  const seleccionarVehiculo = useCallback((v: { id: number | string; placa: string }) => {
    setVehiculo(v)
    setPaso('detalle')
  }, [])

  const irADetalleSinVehiculo = useCallback(() => {
    setPaso('detalle')
  }, [])

  const volver = useCallback(() => {
    if (paso === 'vehiculo') {
      setCliente(null)
      setVehiculos([])
      setVehiculo(null)
      setPaso('cliente')
    } else if (paso === 'detalle') {
      if (vehiculo) {
        setVehiculo(null)
        setPaso('vehiculo')
      } else {
        setCliente(null)
        setVehiculos([])
        setPaso('cliente')
      }
    } else if (paso === 'confirmacion') {
      reset()
    }
  }, [paso, vehiculo])

  const enviar = useCallback(async () => {
    if (!cliente || !user) return

    setEstadoEnvio('enviando')
    setErrorEnvio(null)

    try {
      const dto = {
        mileage: Number(mileage) || 0,
        client_id: String(cliente.id),
        vehicle_id: String(vehiculo?.id || ''),
        customer_type: customerType,
        revision_type: revisionType,
      }

      const response = await ordenServicioService.crearOrdenServicio(dto)
      setOrdenCreada(response)
      setEstadoEnvio('exito')
      setPaso('confirmacion')
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string }
      const msg = e.response?.data?.message || e.message || 'Error al crear la orden de servicio.'
      setErrorEnvio(msg)
      setEstadoEnvio('error')
    }
  }, [cliente, user, mileage, vehiculo, customerType, revisionType])

  const reset = useCallback(() => {
    setPaso('cliente')
    setCliente(null)
    setVehiculos([])
    setVehiculo(null)
    setMileage('')
    setOrdenCreada(null)
    setEstadoEnvio('idle')
    setErrorEnvio(null)
    if (tiposRevision.length > 0) setRevisionType(String(tiposRevision[0].id))
    if (tiposCliente.length > 0) setCustomerType(String(tiposCliente[0].id))
  }, [tiposRevision, tiposCliente])

  return {
    paso,
    cargandoCatalogos,
    errorCatalogo,
    tiposRevision,
    tiposCliente,
    cliente,
    vehiculos,
    vehiculo,
    cargandoVehiculos,
    mileage,
    revisionType,
    customerType,
    estadoEnvio,
    ordenCreada,
    errorEnvio,
    setMileage,
    setRevisionType,
    setCustomerType,
    seleccionarCliente,
    seleccionarVehiculo,
    irADetalleSinVehiculo,
    enviar,
    volver,
    reset,
  }
}
