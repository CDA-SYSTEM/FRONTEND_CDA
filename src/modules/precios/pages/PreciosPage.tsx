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
import { animate, stagger } from 'animejs'
import { precioService } from '../services/precioService'
import type { Precio, CreatePrecioDTO } from '../domain/precio.types'
import { useAuthStore } from '@/core/store/authStore'
import { AnimatedText } from '@/shared/components/AnimatedText'
import { CustomSelect } from '@/shared/components/CustomSelect'
import './PreciosPage.css'

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

  // Animación staggered de las tarjetas de tarifas
  useEffect(() => {
    if (!loading && prices.length > 0) {
      animate('.price-card', {
        translateY: [24, 0],
        opacity: [0, 1],
        delay: stagger(80),
        duration: 700,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      })
    }
  }, [loading, prices])

  // Callback de Ref para animar la entrada del modal
  const modalBackdropRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      animate(node, {
        opacity: [0, 1],
        duration: 250,
        easing: 'easeOutQuad'
      })
      const box = node.querySelector('.floating-modal-box')
      if (box) {
        animate(box, {
          scale: [0.95, 1],
          translateY: [20, 0],
          opacity: [0, 1],
          duration: 450,
          easing: 'cubicBezier(0.22, 1, 0.36, 1)'
        })
      }
    }
  }, [])

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
    const formatLabel = (txt: string) => {
    return txt.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  }

  return (
    <div className="pr-root">
      <article className="panel">
      <header className="flex justify-between items-center mb-6">
        <div>
          <AnimatedText 
            text="Tarifas y Precios" 
            variant="soft-blur-in" 
            style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}
          />
          <p className="text-gray-500 text-sm" style={{ marginTop: '4px' }}>Administre los costos de las revisiones tecnico-mecanicas y preventivas según el tipo de vehículo.</p>
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

      {/* Filtros responsivos */}
      <section className="filters-bar">
        <div className="filters-bar-right" style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-group" style={{ flex: 1, minWidth: '180px' }}>
            <label>Vehículo:</label>
            <CustomSelect
              options={[
                { value: 'todos', label: 'Todos los vehículos' },
                { value: 'LIVIANO', label: 'Liviano' },
                { value: 'PESADO', label: 'Pesado' },
                { value: 'MOTOCICLETA_2_TIEMPOS', label: 'Moto 2 Tiempos' },
                { value: 'MOTOCICLETA_4_TIEMPOS', label: 'Moto 4 Tiempos' }
              ]}
              value={vehicleTypeFilter}
              onChange={setVehicleTypeFilter}
            />
          </div>

          <div className="filter-group" style={{ flex: 1, minWidth: '180px' }}>
            <label>Revisión:</label>
            <CustomSelect
              options={[
                { value: 'todos', label: 'Todas las revisiones' },
                { value: 'TECNICO_MECANICA', label: 'Técnico Mecánica' },
                { value: 'PREVENTIVA', label: 'Preventiva' }
              ]}
              value={revisionTypeFilter}
              onChange={setRevisionTypeFilter}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={() => {
                setVehicleTypeFilter('todos')
                setRevisionTypeFilter('todos')
              }}
              className="btn btn-secondary"
              style={{ height: '44px', minHeight: '44px', padding: '0 16px', marginTop: '0.35rem' }}
            >
              Restablecer
            </button>

            <button 
              type="button"
              onClick={fetchPrices}
              className="btn btn-secondary flex items-center gap-1"
              title="Refrescar tarifas"
              style={{ height: '44px', minHeight: '44px', padding: '0 16px', marginTop: '0.35rem' }}
            >
              <RefreshCw size={14} /> Recargar
            </button>
          </div>
        </div>
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
        <div className="pr-grid">
          {prices.map((p) => (
            <div 
              key={p.id}
              className="pr-card price-card"
              style={{ opacity: 0 }} /* Anime.js lo animará a 1 */
            >
              <div className="pr-card-body">
                <header className="pr-card-header">
                  <span className="pr-badge-vehicle">
                    {formatLabel(p.vehicleType)}
                  </span>
                  <span className={`pr-badge-status ${
                    p.isActive ? 'pr-badge-status--active' : 'pr-badge-status--inactive'
                  }`}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </header>
                <h3 className="pr-price">
                  {formatCOP(p.amount)}
                </h3>
                <h4 className="pr-revision-type">
                  <span className="pr-revision-icon"><Tag size={14} /></span> {formatLabel(p.revisionType)}
                </h4>
                <p className="pr-desc">{p.description}</p>
              </div>

              {isAdmin && (
                <div className="pr-card-footer">
                  <button 
                    type="button"
                    className="pr-btn-action pr-btn-action--edit"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button 
                    type="button"
                    className="pr-btn-action pr-btn-action--delete"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </article>

      {showFormModal && (
        <div ref={modalBackdropRef} className="floating-modal-backdrop" style={{ opacity: 0 }}>
            <form 
              onSubmit={handleSubmit}
              className="floating-modal-box max-w-md"
              style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}
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
                  <CustomSelect
                    options={[
                      { value: 'LIVIANO', label: 'Liviano' },
                      { value: 'PESADO', label: 'Pesado' },
                      { value: 'MOTOCICLETA_2_TIEMPOS', label: 'Moto 2 Tiempos' },
                      { value: 'MOTOCICLETA_4_TIEMPOS', label: 'Moto 4 Tiempos' }
                    ]}
                    value={formData.vehicleType}
                    onChange={(val) => setFormData({ ...formData, vehicleType: val })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Revisión *</label>
                  <CustomSelect
                    options={[
                      { value: 'TECNICO_MECANICA', label: 'Técnico Mecánica' },
                      { value: 'PREVENTIVA', label: 'Preventiva' }
                    ]}
                    value={formData.revisionType}
                    onChange={(val) => setFormData({ ...formData, revisionType: val })}
                  />
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
              </footer>
            </form>
          </div>
      )}
    </div>
  )
}
