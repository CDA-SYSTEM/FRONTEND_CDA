import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  vehiculoSchema,
  type VehiculoSchema,
} from '@/modules/vehiculo/domain/vehiculo.schema'
import { vehiculoService } from '@/modules/vehiculo/services/vehiculoService'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import type {
  CatalogoItem,
  VehiculoResponse,
} from '@/modules/vehiculo/domain/vehiculo.types'
import type {
  ClientePersonaNatural,
} from '@/modules/recepcion/domain/recepcion.types'

export type EstadoFormulario =
  | 'cargando'
  | 'idle'
  | 'enviando'
  | 'exito'
  | 'error'

function esMoto(tipo: CatalogoItem | undefined): boolean {
  if (!tipo) return false
  const nombre = tipo.nombre.toLowerCase()
  return nombre.includes('moto') || nombre.includes('motocicleta')
}

export function useRegistrarVehiculo() {
  const [marcas, setMarcas] = useState<CatalogoItem[]>([])
  const [clases, setClases] = useState<CatalogoItem[]>([])
  const [lineas, setLineas] = useState<CatalogoItem[]>([])
  const [colores, setColores] = useState<CatalogoItem[]>([])
  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogoItem[]>([])
  const [tiposCombustible, setTiposCombustible] = useState<CatalogoItem[]>([])
  const [tiposServicio, setTiposServicio] = useState<CatalogoItem[]>([])

  const [estado, setEstado] = useState<EstadoFormulario>('cargando')
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [vehiculoGuardado, setVehiculoGuardado] = useState<VehiculoResponse | null>(null)

  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClientePersonaNatural | null>(null)

  const [vehiculos, setVehiculos] = useState<VehiculoResponse[]>([])
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false)
  const [errorVehiculos, setErrorVehiculos] = useState<string | null>(null)

  const [pagina, setPagina] = useState(0)
  const [limite, setLimite] = useState(10)
  const [totalElementos, setTotalElementos] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const lastFetchedRef = useRef({ page: -1, search: '____none____' })

  const cargarVehiculos = useCallback(async (pageOverride?: number, searchOverride?: string) => {
    const pageToUse = pageOverride !== undefined ? pageOverride : pagina
    const searchToUse = searchOverride !== undefined ? searchOverride : debouncedSearch

    // Evitar peticiones duplicadas idénticas consecutivas
    if (lastFetchedRef.current.page === pageToUse && lastFetchedRef.current.search === searchToUse) {
      return
    }
    lastFetchedRef.current = { page: pageToUse, search: searchToUse }

    console.log('[DEBUG] Fetching vehicles - page:', pageToUse, 'limit:', limite, 'search:', JSON.stringify(searchToUse))

    setCargandoVehiculos(true)
    setErrorVehiculos(null)
    try {
      const data = await vehiculoService.listarVehiculos(pageToUse, limite, searchToUse)
      setVehiculos(data.content)
      setTotalElementos(data.totalElements)
      setTotalPaginas(data.totalPages)
    } catch (err) {
      console.error(err)
      setErrorVehiculos('No se pudieron cargar los vehículos. Verifique la conexión.')
    } finally {
      setCargandoVehiculos(false)
    }
  }, [pagina, limite, debouncedSearch])

  useEffect(() => {
    if (searchTerm === '') {
      setDebouncedSearch('')
      setPagina(0)
      return
    }

    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPagina(0)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Efecto para cambios en el término de búsqueda debounced (forzando página 0)
  useEffect(() => {
    cargarVehiculos(0, debouncedSearch)
  }, [debouncedSearch, cargarVehiculos])

  // Efecto para cambios en la paginación manual
  useEffect(() => {
    cargarVehiculos(pagina, debouncedSearch)
  }, [pagina, debouncedSearch, cargarVehiculos])

  const eliminarVehiculo = useCallback(async (id: string | number) => {
    if (!window.confirm('¿Seguro que desea eliminar este vehículo?')) return
    try {
      await vehiculoService.eliminarVehiculo(id)
      lastFetchedRef.current = { page: -1, search: '____none____' }
      await cargarVehiculos(pagina, debouncedSearch)
    } catch (err) {
      alert('No se pudo eliminar el vehículo.')
    }
  }, [cargarVehiculos, pagina, debouncedSearch])


  const form = useForm<VehiculoSchema>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      clienteId: '',
      placa: '',
      tipoVehiculoId: 0,
      marcaId: 0,
      lineaId: 0,
      claseId: 0,
      colorId: 0,
      modelo: '',
      tipoCombustibleId: 0,
      tipoServicioId: 0,
      certificadoNo: '',
      cilindraje: '',
    },
  })

  const { reset, setValue, watch } = form

  const tipoVehiculoId = watch('tipoVehiculoId')

  const tipoVehiculoSeleccionado = useMemo(
    () => tiposVehiculo.find((t) => t.id === tipoVehiculoId),
    [tiposVehiculo, tipoVehiculoId],
  )

  const esMotocicleta = esMoto(tipoVehiculoSeleccionado)

  // ── Cargar catálogos al montar ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function cargarCatalogos() {
      try {
        const [
          marcasData,
          clasesData,
          lineasData,
          coloresData,
          tiposV,
          tiposC,
          tiposS,
        ] = await Promise.all([
          vehiculoService.listarMarcas(),
          vehiculoService.listarClases(),
          vehiculoService.listarLineas(),
          vehiculoService.listarColores(),
          vehiculoService.listarTiposVehiculo(),
          vehiculoService.listarTiposCombustible(),
          vehiculoService.listarTiposServicio(),
        ])

        if (!mounted) return

        setMarcas(marcasData)
        setClases(clasesData)
        setLineas(lineasData)
        setColores(coloresData)
        setTiposVehiculo(tiposV)
        setTiposCombustible(tiposC)
        setTiposServicio(tiposS)
        setEstado('idle')
      } catch {
        if (!mounted) return
        setErrorCatalogo('No se pudieron cargar los catálogos. Verifique la conexión.')
        setEstado('error')
      }
    }

    cargarCatalogos()
    return () => { mounted = false }
  }, [])

  // ── Seleccionar cliente ────────────────────────────────────────────────────
  const seleccionarCliente = (cliente: ClientePersonaNatural) => {
    setClienteSeleccionado(cliente)
    setValue('clienteId', String(cliente.id))
  }

  const limpiarCliente = () => {
    setClienteSeleccionado(null)
    setValue('clienteId', '')
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetFormulario = () => {
    reset()
    setClienteSeleccionado(null)
    setVehiculoGuardado(null)
    setErrorServidor(null)
    setEstado('idle')
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async (data: VehiculoSchema) => {
    if (esMotocicleta && (!data.cilindraje || data.cilindraje.trim() === '')) {
      form.setError('cilindraje', {
        message: 'El cilindraje es obligatorio para motocicletas',
      })
      return
    }

    setEstado('enviando')
    setErrorServidor(null)

    try {
      const vehiculo = await vehiculoService.crearVehiculo({
        clienteId: data.clienteId,
        placa: data.placa.trim().toUpperCase(),
        marcaId: data.marcaId,
        lineaId: data.lineaId,
        claseId: data.claseId,
        colorId: data.colorId,
        tipoVehiculoId: data.tipoVehiculoId,
        tipoCombustibleId: data.tipoCombustibleId,
        tipoServicioId: data.tipoServicioId,
        modelo: data.modelo,
        certificadoNo: data.certificadoNo?.trim() || '',
        cilindraje: esMotocicleta ? data.cilindraje?.trim() : undefined,
      })

      setVehiculoGuardado(vehiculo)
      setEstado('exito')
      reset()
      setClienteSeleccionado(null)
      cargarVehiculos()
    } catch (error: unknown) {
      const e = error as {
        response?: { status?: number; data?: { message?: string } }
      }

      if (e.response?.status === 409) {
        form.setError('placa', {
          message: 'Ya existe un vehículo registrado con esta placa',
        })
        setEstado('error')
        return
      }

      const msg =
        e.response?.data?.message ?? 'Error al registrar el vehículo. Intente de nuevo.'
      setErrorServidor(msg)
      setEstado('error')
    }
  })

  // ── Búsqueda de clientes (debounced) ──────────────────────────────────────
  const [queryCliente, setQueryCliente] = useState('')
  const [resultadosCliente, setResultadosCliente] = useState<ClientePersonaNatural[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  useEffect(() => {
    if (queryCliente.trim().length < 3) {
      setResultadosCliente([])
      return
    }

    const timer = setTimeout(async () => {
      setBuscandoCliente(true)
      try {
        const res = await clienteService.buscarClientes(queryCliente)
        setResultadosCliente(res)
      } catch {
        setResultadosCliente([])
      } finally {
        setBuscandoCliente(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [queryCliente])

  return {
    form,
    estado,
    errorCatalogo,
    errorServidor,
    vehiculoGuardado,
    clienteSeleccionado,
    seleccionarCliente,
    limpiarCliente,
    resetFormulario,
    onSubmit,
    marcas,
    clases,
    lineas,
    colores,
    tiposVehiculo,
    tiposCombustible,
    tiposServicio,
    esMotocicleta,
    queryCliente,
    setQueryCliente,
    resultadosCliente,
    buscandoCliente,
    vehiculos,
    cargandoVehiculos,
    errorVehiculos,
    cargarVehiculos,
    eliminarVehiculo,
    pagina,
    setPagina,
    limite,
    setLimite,
    totalElementos,
    totalPaginas,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
  }
}
