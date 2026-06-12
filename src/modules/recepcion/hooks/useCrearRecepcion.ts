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

export type RolAsignacion = 'inspector' | 'operario'

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
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false)

  const [mileage, setMileage] = useState('')
  const [revisionType, setRevisionType] = useState('')
  const [customerType, setCustomerType] = useState('')

  const [observations, setObservations] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null)
  const [confirmacionAcuerdo, setConfirmacionAcuerdo] = useState(false)

  const rolAsignado: RolAsignacion = 'operario'
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
        const personal = await usuarioService.obtenerPersonalAsignable('operario', user?.role)
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

  const recargarVehiculos = useCallback(async (placa?: string) => {
    if (!cliente) return
    setCargandoVehiculos(true)
    try {
      const v = await ordenServicioService.obtenerVehiculosCliente(cliente.id, placa)
      setVehiculos(v as Vehiculo[])
    } catch {
      setVehiculos([])
    } finally {
      setCargandoVehiculos(false)
    }
  }, [cliente])

  /**
   * Devuelve el nombre normalizado del tipo de vehículo (uppercase, sin espacios extra).
   * El backend puede enviar el objeto `{ nombre, name }` o directamente un string.
   */
  const resolverTipoVehiculo = (v: Vehiculo): string => {
    if (!v.tipoVehiculo) return ''
    const raw = typeof v.tipoVehiculo === 'object'
      ? (v.tipoVehiculo.nombre || v.tipoVehiculo.name || '')
      : String(v.tipoVehiculo)
    return raw.trim().toUpperCase().replace(/\s+/g, '_')
  }

  const seleccionarVehiculo = useCallback((v: Vehiculo) => {
    setVehiculo(v)

    const tipo = resolverTipoVehiculo(v)
    const isMoto = tipo.includes('MOTO') || tipo.includes('MOTOCICLETA')
    const isPesado2 = tipo.includes('PESADO_2') || (tipo.includes('PESADO') && tipo.includes('2_EJE'))
    const isPesado3 = tipo.includes('PESADO_3') || (tipo.includes('PESADO') && tipo.includes('3_EJE'))
    const isPesado4 = tipo.includes('PESADO_4') || (tipo.includes('PESADO') && tipo.includes('4_EJE'))
    const isPesado5 = tipo.includes('PESADO_5') || (tipo.includes('PESADO') && tipo.includes('5_EJE'))

    if (isMoto) {
      // ── MOTOCICLETA: 2 llantas de servicio, sin repuesto ──
      setTintedWindows('NO_APLICA')
      setArmoredVehicle('NO_APLICA')
      setAxles([
        { index: 1, axle_type: 'DELANTERO' },
        { index: 2, axle_type: 'TRASERO' },
      ])
      setTires([
        { position: 'FRONT', code: '', tire_pressure: 0 },
        { position: 'REAR', code: '', tire_pressure: 0 },
      ])
    } else if (isPesado5) {
      // ── PESADO 5 EJES: 18 servicio + 2 repuesto ──
      setTintedWindows('NO')
      setArmoredVehicle('NO')
      setAxles([
        { index: 1, axle_type: 'DELANTERO' },
        { index: 2, axle_type: 'TRACCION' },
        { index: 3, axle_type: 'TRACCION' },
        { index: 4, axle_type: 'REMOLQUE' },
        { index: 5, axle_type: 'REMOLQUE' },
      ])
      setTires([
        { position: 'EJE1_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE1_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE3_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE3_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE3_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE3_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE4_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE4_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE4_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE4_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE5_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE5_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE5_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE5_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_1', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_2', code: '', tire_pressure: 0 },
      ])
    } else if (isPesado4) {
      // ── PESADO 4 EJES: 14 servicio + 2 repuesto ──
      setTintedWindows('NO')
      setArmoredVehicle('NO')
      setAxles([
        { index: 1, axle_type: 'DELANTERO' },
        { index: 2, axle_type: 'TRACCION' },
        { index: 3, axle_type: 'TRACCION' },
        { index: 4, axle_type: 'REMOLQUE' },
      ])
      setTires([
        { position: 'EJE1_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE1_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE3_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE3_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE3_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE3_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE4_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE4_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE4_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE4_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_1', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_2', code: '', tire_pressure: 0 },
      ])
    } else if (isPesado3) {
      // ── PESADO 3 EJES: 10 servicio + 2 repuesto ──
      setTintedWindows('NO')
      setArmoredVehicle('NO')
      setAxles([
        { index: 1, axle_type: 'DELANTERO' },
        { index: 2, axle_type: 'TRACCION' },
        { index: 3, axle_type: 'TRACCION' },
      ])
      setTires([
        { position: 'EJE1_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE1_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE3_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE3_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE3_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE3_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_1', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_2', code: '', tire_pressure: 0 },
      ])
    } else if (isPesado2) {
      // ── PESADO 2 EJES: 6 servicio + 2 repuesto ──
      setTintedWindows('NO')
      setArmoredVehicle('NO')
      setAxles([
        { index: 1, axle_type: 'DELANTERO' },
        { index: 2, axle_type: 'TRACCION' },
      ])
      setTires([
        { position: 'EJE1_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE1_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_IZQ', code: '', tire_pressure: 0 },
        { position: 'EJE2_INT_DER', code: '', tire_pressure: 0 },
        { position: 'EJE2_EXT_DER', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_1', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_2', code: '', tire_pressure: 0 },
      ])
    } else {
      // ── CARRO ESTÁNDAR / fallback: 4 servicio + 1 repuesto ──
      setTintedWindows('NO')
      setArmoredVehicle('NO')
      setAxles([
        { index: 1, axle_type: 'DELANTERO' },
        { index: 2, axle_type: 'TRASERO' },
      ])
      setTires([
        { position: 'FRONT_LEFT', code: '', tire_pressure: 0 },
        { position: 'FRONT_RIGHT', code: '', tire_pressure: 0 },
        { position: 'REAR_LEFT', code: '', tire_pressure: 0 },
        { position: 'REAR_RIGHT', code: '', tire_pressure: 0 },
        { position: 'REPUESTO_1', code: '', tire_pressure: 0 },
      ])
    }

    setPaso('detalle')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const irADetalleSinVehiculo = useCallback(() => {
    setPaso('detalle')
  }, [])

  const irACondiciones = useCallback(() => {
    setPaso('condiciones')
  }, [])

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
    if (!confirmacionAcuerdo) {
      setErrorEnvio('Debe aceptar los términos y condiciones antes de finalizar.')
      setEstadoEnvio('error')
      return
    }
    const presionesIncompletas = tires.some((t) => !Number.isFinite(t.tire_pressure) || t.tire_pressure <= 0)
    if (presionesIncompletas) {
      setErrorEnvio('Registre la presión PSI de todas las llantas antes de finalizar.')
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
              tire_pressure: Number(t.tire_pressure) || 0,
            }))
          : [{ position: 'FRONT_LEFT', code: 'PENDIENTE', tire_pressure: 0 }],
        checklist: { is_clean: confirmacionAcuerdo },
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
    recargarVehiculos,
    irADetalleSinVehiculo,
    irACondiciones,
    enviar,
    volver,
    reset,
  }
}
