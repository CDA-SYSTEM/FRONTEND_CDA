import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  Tag
} from 'lucide-react'
import { precioService } from '../services/precioService'
import type { Precio, CreatePrecioDTO } from '../domain/precio.types'
import { useAuthStore } from '@/core/store/authStore'

export function PreciosPage() {
  const [prices, setPrices] = useState<Precio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('todos')
  const [revisionTypeFilter, setRevisionTypeFilter] = useState('todos')

  // Modales
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<Precio | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Datos para nuevo/editar precio
  const [formData, setFormData] = useState<CreatePrecioDTO>({
    vehicleType: 'LIVIANO',
    revisionType: 'TECNICO_MECANICA',
    amount: 0,
    description: '',
    isActive: true
  })

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await precioService.listarPrecios({
        vehicleType: vehicleTypeFilter !== 'todos' ? vehicleTypeFilter : undefined,
        revisionType: revisionTypeFilter !== 'todos' ? revisionTypeFilter : undefined,
      })
      setPrices(data)
    } catch (err: any) {
      console.error('Error al listar precios:', err)
      setError('No se pudieron cargar las tarifas de precios del sistema.')
    } finally {
      setLoading(false)
    }
  }, [vehicleTypeFilter, revisionTypeFilter])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  const handleOpenCreate = () => {
    setSelectedPrice(null)
    setFormData({
      vehicleType: 'LIVIANO',
      revisionType: 'TECNICO_MECANICA',
      amount: 0,
      description: '',
      isActive: true
    })
    setShowFormModal(true)
  }

  const handleOpenEdit = (price: Precio) => {
    setSelectedPrice(price)
    setFormData({
      vehicleType: price.vehicleType,
      revisionType: price.revisionType,
      amount: price.amount,
      description: price.description,
      isActive: price.isActive
    })
    setShowFormModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (selectedPrice) {
        await precioService.actualizarPrecio(selectedPrice.id, formData)
      } else {
        await precioService.crearPrecio(formData)
      }
      setShowFormModal(false)
      fetchPrices()
    } catch (err: any) {
      console.error('Error guardando precio:', err)
      setError(err?.response?.data?.message || 'Error al guardar la tarifa de precio. Verifique los datos.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta tarifa?')) return
    try {
      await precioService.eliminarPrecio(id)
      fetchPrices()
    } catch (err: any) {
      alert('No se pudo eliminar la tarifa.')
    }
  }

  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val)
  }

  const formatLabel = (txt: string) => {
    return txt.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  }

  return (
    <article className="panel">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2>Tarifas y Precios</h2>
          <p className="text-gray-500 text-sm">Administre los costos de las revisiones tecnico-mecanicas y preventivas según el tipo de vehículo.</p>
        </div>
        {isAdmin && (
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={handleOpenCreate}
          >
            <Plus size={16} /> Agregar Tarifa
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros */}
      <section className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-semibold text-gray-600">Tipo de Vehículo:</label>
          <select 
            className="form-control"
            value={vehicleTypeFilter}
            onChange={(e) => {
              setVehicleTypeFilter(e.target.value)
            }}
          >
            <option value="todos">Todos</option>
            <option value="LIVIANO">Liviano</option>
            <option value="PESADO">Pesado</option>
            <option value="MOTOCICLETA_2_TIEMPOS">Moto 2 Tiempos</option>
            <option value="MOTOCICLETA_4_TIEMPOS">Moto 4 Tiempos</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm font-semibold text-gray-600">Tipo de Revisión:</label>
          <select 
            className="form-control"
            value={revisionTypeFilter}
            onChange={(e) => {
              setRevisionTypeFilter(e.target.value)
            }}
          >
            <option value="todos">Todos</option>
            <option value="TECNICO_MECANICA">Técnico Mecánica</option>
            <option value="PREVENTIVA">Preventiva</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setVehicleTypeFilter('todos')
            setRevisionTypeFilter('todos')
          }}
          className="btn btn-secondary flex items-center gap-1"
        >
          Reestablecer
        </button>

        <button 
          onClick={fetchPrices}
          className="btn btn-secondary flex items-center gap-1 ml-auto"
          title="Refrescar tarifas"
        >
          <RefreshCw size={14} /> Recargar
        </button>
      </section>

      {/* Grid de precios */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : prices.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <DollarSign size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No se encontraron tarifas configuradas para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prices.map((p) => (
            <div 
              key={p.id}
              className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between"
            >
              <div>
                <header className="flex justify-between items-start mb-4">
                  <span className="badge text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded">
                    {formatLabel(p.vehicleType)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    p.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </header>
                <h3 className="text-2xl font-black text-gray-800 mb-2 flex items-center gap-1">
                  {formatCOP(p.amount)}
                </h3>
                <h4 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1">
                  <Tag size={14} className="text-gray-400" /> {formatLabel(p.revisionType)}
                </h4>
                <p className="text-sm text-gray-500 mb-6">{p.description}</p>
              </div>

              {isAdmin && (
                <div className="flex gap-2 border-t border-gray-50 pt-4 mt-auto justify-end">
                  <button 
                    className="btn btn-secondary flex items-center gap-1 py-1 px-3 text-xs"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button 
                    className="btn btn-secondary flex items-center gap-1 py-1 px-3 text-xs text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <div className="floating-modal-backdrop">
          <form 
            onSubmit={handleSubmit}
            className="floating-modal-box max-w-md"
          >
            <header className="floating-modal-header">
              <h3>
                {selectedPrice ? 'Editar Tarifa' : 'Agregar Nueva Tarifa'}
              </h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowFormModal(false)}
                style={{ background: 'transparent', boxShadow: 'none', minHeight: 'initial', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </header>

            <div className="floating-modal-body">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Vehículo *</label>
                <select
                  className="form-control"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                >
                  <option value="LIVIANO">Liviano</option>
                  <option value="PESADO">Pesado</option>
                  <option value="MOTOCICLETA_2_TIEMPOS">Moto 2 Tiempos</option>
                  <option value="MOTOCICLETA_4_TIEMPOS">Moto 4 Tiempos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Revisión *</label>
                <select
                  className="form-control"
                  value={formData.revisionType}
                  onChange={(e) => setFormData({ ...formData, revisionType: e.target.value })}
                >
                  <option value="TECNICO_MECANICA">Técnico Mecánica</option>
                  <option value="PREVENTIVA">Preventiva</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Monto (COP) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción / Notas *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Revisión tecnico-mecanica vehiculo liviano"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 'auto', minHeight: 'initial', marginTop: 0 }}
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Tarifa Activa</label>
              </div>
            </div>

            <footer className="floating-modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => setShowFormModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Guardar Tarifa'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </article>
  )
}
