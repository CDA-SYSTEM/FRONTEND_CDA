import { apiClient } from '@/core/api/apiClient'
import type {
  CatalogoItem,
  CreateVehicleDto,
  VehiculoResponse,
} from '@/modules/vehiculo/domain/vehiculo.types'

function extractItem(responseData: unknown): any {
  const body = responseData as Record<string, any>
  if (body && body.data && typeof body.data === 'object' && body.data.data) return body.data.data
  if (body && body.data && typeof body.data === 'object') return body.data
  return body
}

function extractArray(responseData: unknown): any[] {
  const body = responseData as Record<string, any>

  if (Array.isArray(responseData)) return responseData

  if (body?.data) {
    if (Array.isArray(body.data)) return body.data

    const inner = body.data.data
    if (inner) {
      if (Array.isArray(inner)) return inner
      if (typeof inner === 'object') {
        const arr = Object.values(inner).find((v) => Array.isArray(v))
        if (arr) return arr as any[]
      }
    }

    if (typeof body.data === 'object') {
      const arr = Object.values(body.data).find((v) => Array.isArray(v))
      if (arr) return arr as any[]
    }
  }

  return []
}

function normalizarCatalogo(raw: unknown[]): CatalogoItem[] {
  return raw.map((item) => {
    if (item && typeof item === 'object' && 'id' in (item as Record<string, unknown>) && 'nombre' in (item as Record<string, unknown>)) {
      const obj = item as Record<string, unknown>
      return { id: Number(obj.id), nombre: String(obj.nombre) }
    }
    return { id: Number(item) || 0, nombre: String(item).replace(/_/g, ' ') }
  })
}

export const vehiculoService = {
  async crearVehiculo(payload: CreateVehicleDto): Promise<VehiculoResponse> {
    const response = await apiClient.post('/api/v1/vehiculo', payload)
    return extractItem(response.data) as VehiculoResponse
  },

  async obtenerVehiculoPorId(id: string): Promise<VehiculoResponse | null> {
    try {
      const response = await apiClient.get(`/api/v1/vehiculo/${id}`)
      return extractItem(response.data) as VehiculoResponse
    } catch {
      return null
    }
  },

  async listarVehiculos(page = 0, size = 20): Promise<{
    content: VehiculoResponse[]
    totalElements: number
    totalPages: number
  }> {
    const response = await apiClient.get('/api/v1/vehiculo', {
      params: { page, size },
    })
    const body = response.data as Record<string, any>
    const data = body?.data
    return {
      content: (data?.content || []) as VehiculoResponse[],
      totalElements: data?.totalElements || 0,
      totalPages: data?.totalPages || 0,
    }
  },

  // ── Catálogos ─────────────────────────────────────────────────────────────

  async listarMarcas(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/marca')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarClases(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/clase')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarLineas(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/linea')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarColores(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/color')
    return extractArray(response.data) as CatalogoItem[]
  },

  async listarTiposVehiculo(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/vehicle-types')
    return normalizarCatalogo(extractArray(response.data) as unknown[])
  },

  async listarTiposCombustible(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/fuel-types')
    return normalizarCatalogo(extractArray(response.data) as unknown[])
  },

  async listarTiposServicio(): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/catalogs/service-types')
    return normalizarCatalogo(extractArray(response.data) as unknown[])
  },

  // ── Operaciones CRUD completas para Vehículos ──────────────────────────────

  async actualizarVehiculo(id: string | number, payload: Partial<CreateVehicleDto>): Promise<VehiculoResponse> {
    const response = await apiClient.put(`/api/v1/vehiculo/${id}`, payload)
    return extractItem(response.data) as VehiculoResponse
  },

  async eliminarVehiculo(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/vehiculo/${id}`)
  },

  // ── Operaciones CRUD completas para Marcas ─────────────────────────────────

  async crearMarca(nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/marca', { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async obtenerMarcaPorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/marca/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarMarca(id: string | number, nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/marca/${id}`, { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarMarca(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/marca/${id}`)
  },

  // ── Operaciones CRUD completas para Clases ─────────────────────────────────

  async crearClase(nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/clase', { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async obtenerClasePorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/clase/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarClase(id: string | number, nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/clase/${id}`, { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarClase(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/clase/${id}`)
  },

  // ── Operaciones CRUD completas para Líneas ─────────────────────────────────

  async crearLinea(nombre: string, marcaId?: number): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/linea', { nombre, marcaId })
    return extractItem(response.data) as CatalogoItem
  },

  async obtenerLineaPorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/linea/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarLinea(id: string | number, nombre: string, marcaId?: number): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/linea/${id}`, { nombre, marcaId })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarLinea(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/linea/${id}`)
  },

  // ── Operaciones CRUD completas para Colores ────────────────────────────────

  async crearColor(nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/color', { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async obtenerColorPorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/color/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarColor(id: string | number, nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/color/${id}`, { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarColor(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/color/${id}`)
  },

  // ── Operaciones CRUD completas para Tipos de Vehículo ──────────────────────

  async crearTipoVehiculo(nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/tipo-vehiculo', { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async listarTiposVehiculoCRUD(page = 0, size = 100): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/tipo-vehiculo', {
      params: { page, size }
    })
    return extractArray(response.data) as CatalogoItem[]
  },

  async obtenerTipoVehiculoPorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/tipo-vehiculo/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarTipoVehiculo(id: string | number, nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/tipo-vehiculo/${id}`, { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarTipoVehiculo(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/tipo-vehiculo/${id}`)
  },

  // ── Operaciones CRUD completas para Tipos de Combustible ───────────────────

  async crearTipoCombustible(nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/tipo-combustible', { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async listarTiposCombustibleCRUD(page = 0, size = 100): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/tipo-combustible', {
      params: { page, size }
    })
    return extractArray(response.data) as CatalogoItem[]
  },

  async obtenerTipoCombustiblePorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/tipo-combustible/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarTipoCombustible(id: string | number, nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/tipo-combustible/${id}`, { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarTipoCombustible(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/tipo-combustible/${id}`)
  },

  // ── Operaciones CRUD completas para Tipos de Servicio ──────────────────────

  async crearTipoServicio(nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.post('/api/v1/tipo-servicio', { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async listarTiposServicioCRUD(page = 0, size = 100): Promise<CatalogoItem[]> {
    const response = await apiClient.get('/api/v1/tipo-servicio', {
      params: { page, size }
    })
    return extractArray(response.data) as CatalogoItem[]
  },

  async obtenerTipoServicioPorId(id: string | number): Promise<CatalogoItem | null> {
    try {
      const response = await apiClient.get(`/api/v1/tipo-servicio/${id}`)
      return extractItem(response.data) as CatalogoItem
    } catch {
      return null
    }
  },

  async actualizarTipoServicio(id: string | number, nombre: string): Promise<CatalogoItem> {
    const response = await apiClient.put(`/api/v1/tipo-servicio/${id}`, { nombre })
    return extractItem(response.data) as CatalogoItem
  },

  async eliminarTipoServicio(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/tipo-servicio/${id}`)
  },
}
