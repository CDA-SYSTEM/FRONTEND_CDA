import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { ordenServicioService } from '@/modules/recepcion/services/ordenServicioService'
import { usuarioService } from '@/modules/usuarios/services/usuarioService'
import type {
  CatalogoItem,
  ClienteConVehiculos,
  OrdenServicioResponse,
} from '@/modules/recepcion/domain/ordenServicio.types'
import type { Vehiculo } from '@/modules/recepcion/domain/recepcion.types'
import type { Usuario } from '@/modules/usuarios/domain/usuario.types'

export type PasoWizard = 'cliente' | 'vehiculo' | 'detalle' | 'condiciones' | 'confirmacion'

export type RolAsignacion = 'INSPECTOR' | 'OPERARIO'

export type EstadoEnvio = 'idle' | 'enviando' | 'exito' | 'error'

export function useCrearRecepcion() {
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

  const [observations, setObservations] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null)
  const [confirmacionAcuerdo, setConfirmacionAcuerdo] = useState(false)

  const rolAsignado: RolAsignacion = 'OPERARIO'
  const [usuarioAsignadoId, setUsuarioAsignadoId] = useState('')
  const [usuariosAsignables, setUsuariosAsignables] = useState<Usuario[]>([])
  const [cargandoUsuariosAsignables, setCargandoUsuariosAsignables] = useState(false)
  const [errorUsuariosAsignables, setErrorUsuariosAsignables] = useState<string | null>(null)
  const loadingRef = useRef(false)

  const [tintedWindows, setTintedWindows] = useState('NO')
  const [armoredVehicle, setArmoredVehicle] = useState('NO')
  const [brakeFluidSightGlass, setBrakeFluidSightGlass] = useState('BUEN_ESTADO')
  const [axles, setAxles] = useState<{ index: number; axle_type: string }[]>([
    { index: 1, axle_type: 'DELANTERO' },
    { index: 2, axle_type: 'TRASERO' },
  ])
  const [tires, setTires] = useState<{ position: string; code: string; tire_pressure: number }[]>([
    { position: 'FRONT_LEFT', code: '', tire_pressure: 0 },
    { position: 'FRONT_RIGHT', code: '', tire_pressure: 0 },
    { position: 'REAR_LEFT', code: '', tire_pressure: 0 },
    { position: 'REAR_RIGHT', code: '', tire_pressure: 0 },
  ])

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

  useEffect(() => {
    let mounted = true
    if (paso !== 'detalle') {
      return
    }

    async function cargarPersonalAsignable() {
      if (loadingRef.current) return
      loadingRef.current = true

      setCargandoUsuariosAsignables(true)
      setErrorUsuariosAsignables(null)

      try {
        const personal = await usuarioService.obtenerPersonalAsignable('OPERARIO')
        if (!mounted) return

        if (personal.length === 0) {
          setUsuariosAsignables([])
          setUsuarioAsignadoId('')
          setErrorUsuariosAsignables('No hay personal operario registrado. Regístrelo en Gestión de usuarios.')
          return
        }

        setUsuariosAsignables(personal)
        setUsuarioAsignadoId((prev) => {
          if (prev && personal.some((u) => u.id === prev)) return prev
          return personal[0]?.id ?? ''
        })
      } catch {
        if (!mounted) return
        setUsuariosAsignables([])
        setUsuarioAsignadoId('')
        setErrorUsuariosAsignables('No se pudo cargar el personal de su cuenta.')
      } finally {
        loadingRef.current = false
        if (mounted) setCargandoUsuariosAsignables(false)
      }
    }

    cargarPersonalAsignable()
    return () => {
      mounted = false
      loadingRef.current = false
    }
  }, [paso, user?.role])

  const seleccionarCliente = useCallback(async (c: ClienteConVehiculos) => {
    setCliente(c)
    setVehiculo(null)
    setCargandoVehiculos(true)
    try {
      const v = await ordenServicioService.obtenerVehiculosCliente(c.id)
      setVehiculos(v as Vehiculo[])
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

  const irACondiciones = useCallback(() => {
    setPaso('condiciones')
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
    } else if (paso === 'condiciones') {
      setPaso('detalle')
    } else if (paso === 'confirmacion') {
      reset()
    }
  }, [paso, vehiculo, reset])

  const enviar = useCallback(async () => {
    if (!cliente || !user) return
    if (!vehiculo) {
      setErrorEnvio('Seleccione un vehículo antes de crear la recepción.')
      setEstadoEnvio('error')
      return
    }
    if (!usuarioAsignadoId) {
      setErrorEnvio('Seleccione el personal operario que atenderá la recepción.')
      setEstadoEnvio('error')
      return
    }

    setEstadoEnvio('enviando')
    setErrorEnvio(null)

    try {
      const clientId = String(cliente.id)
      const vehicleId = String(vehiculo.id)

      const dto = {
        mileage: Number(mileage) || 0,
        client_id: clientId,
        vehicle_id: vehicleId,
        operator_id: usuarioAsignadoId,
        customer_type: customerType,
        revision_type: revisionType,
        observations: observations || undefined,
        tinted_windows: tintedWindows,
        armored_vehicle: armoredVehicle,
        brake_fluid_sight_glass: brakeFluidSightGlass,
        axles: axles.length > 0 ? axles : [{ index: 1, axle_type: 'DELANTERO' }],
        tires: tires.length > 0
          ? tires.map((t) => ({
              position: t.position,
              code: t.code || 'PENDIENTE',
              tire_pressure: t.tire_pressure || 32.5,
            }))
          : [{ position: 'FRONT_LEFT', code: 'PENDIENTE', tire_pressure: 32.5 }],
        checklist: { is_clean: false },
      }

      const response = await ordenServicioService.crearOrdenServicio(dto, {
        photo: photoFile,
        signature: signatureBlob,
      })
      setOrdenCreada(response)
      setEstadoEnvio('exito')
      setPaso('confirmacion')
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string }
      const msg = e.response?.data?.message || e.message || 'Error al crear la orden de servicio.'
      setErrorEnvio(msg)
      setEstadoEnvio('error')
    }
  }, [cliente, user, mileage, vehiculo, customerType, revisionType, observations, photoFile, signatureBlob, usuarioAsignadoId, tintedWindows, armoredVehicle, brakeFluidSightGlass, axles, tires])

  const reset = useCallback(() => {
    setPaso('cliente')
    setCliente(null)
    setVehiculos([])
    setVehiculo(null)
    setMileage('')
    setObservations('')
    setPhotoFile(null)
    setSignatureBlob(null)
    setConfirmacionAcuerdo(false)
    setTintedWindows('NO')
    setArmoredVehicle('NO')
    setBrakeFluidSightGlass('BUEN_ESTADO')
    setAxles([{ index: 1, axle_type: 'DELANTERO' }, { index: 2, axle_type: 'TRASERO' }])
    setTires([
      { position: 'FRONT_LEFT', code: '', tire_pressure: 0 },
      { position: 'FRONT_RIGHT', code: '', tire_pressure: 0 },
      { position: 'REAR_LEFT', code: '', tire_pressure: 0 },
      { position: 'REAR_RIGHT', code: '', tire_pressure: 0 },
    ])
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
    observations,
    photoFile,
    signatureBlob,
    confirmacionAcuerdo,
    rolAsignado,
    usuarioAsignadoId,
    setUsuarioAsignadoId,
    usuariosAsignables,
    cargandoUsuariosAsignables,
    errorUsuariosAsignables,
    estadoEnvio,
    ordenCreada,
    errorEnvio,
    setMileage,
    setRevisionType,
    setCustomerType,
    setObservations,
    setPhotoFile,
    setSignatureBlob,
    setConfirmacionAcuerdo,
    tintedWindows,
    setTintedWindows,
    armoredVehicle,
    setArmoredVehicle,
    brakeFluidSightGlass,
    setBrakeFluidSightGlass,
    axles,
    setAxles,
    tires,
    setTires,
    seleccionarCliente,
    seleccionarVehiculo,
    irADetalleSinVehiculo,
    irACondiciones,
    enviar,
    volver,
    reset,
  }
}
