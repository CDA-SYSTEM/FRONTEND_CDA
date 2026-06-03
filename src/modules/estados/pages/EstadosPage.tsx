import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  Hash,
  Sliders
} from 'lucide-react'
import { animate, stagger } from 'animejs'
import { estadoService } from '../services/estadoService'
import type { Estado, CrearEstadoDTO } from '../domain/estado.types'
import { useAuthStore } from '@/core/store/authStore'
import { AnimatedText } from '@/shared/components/AnimatedText'
import { CustomSelect } from '@/shared/components/CustomSelect'

export function EstadosPage() {
  const [statuses, setStatuses] = useState<Estado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [codeFilter, setCodeFilter] = useState('todos')

  // Modales
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<Estado | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Datos para nuevo/editar estado
  const [formData, setFormData] = useState<CrearEstadoDTO>({
    code: '',
    name: '',
    description: '',
    color: '#3B82F6',
    order: 1
  })

  const fetchStatuses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await estadoService.listarEstados({
        code: codeFilter !== 'todos' ? codeFilter : undefined
      })
      setStatuses(response.data || [])
    } catch (err: any) {
      console.error('Error al listar estados:', err)
      setError('No se pudieron cargar los estados del sistema.')
    } finally {
      setLoading(false)
    }
  }, [codeFilter])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  // Animación staggered de las tarjetas de estados
  useEffect(() => {
    if (!loading && statuses.length > 0) {
      animate('.status-card', {
        translateY: [24, 0],
        opacity: [0, 1],
        delay: stagger(80),
        duration: 700,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      })
    }
  }, [loading, statuses])

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
    setSelectedStatus(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      color: '#3B82F6',
      order: statuses.length + 1
    })
    setShowFormModal(true)
  }

  const handleOpenEdit = (status: Estado) => {
    setSelectedStatus(status)
    setFormData({
      code: status.code,
      name: status.name,
      description: status.description || '',
      color: status.color,
      order: status.order ?? 1
    })
    setShowFormModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (selectedStatus) {
        await estadoService.actualizarEstado(selectedStatus.id, formData)
      } else {
        await estadoService.crearEstado(formData)
      }
      setShowFormModal(false)
      fetchStatuses()
    } catch (err: any) {
      console.error('Error guardando estado:', err)
      setError(err?.response?.data?.message || 'Error al guardar el estado. Verifique los datos.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este estado?')) return
    try {
      await estadoService.eliminarEstado(id)
      fetchStatuses()
    } catch (err: any) {
      console.error('Error eliminando estado:', err)
      alert('No se pudo eliminar el estado.')
    }
  }

  const user = useAuthStore((state) => state.user)
  const isAllowed = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Obtener opciones únicas de filtros basadas en los códigos existentes
  const filterOptions = [
    { value: 'todos', label: 'Todos los códigos' },
    ...Array.from(new Set(statuses.map((s) => s.code))).map((code) => ({
      value: code,
      label: code
    }))
  ]

  return (
    <>
      <article className="panel">
        <header className="flex justify-between items-center mb-6">
          <div>
            <AnimatedText
              text="Gestión de Estados"
              variant="soft-blur-in"
              style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}
            />
            <p className="text-gray-500 text-sm" style={{ marginTop: '4px' }}>
              Administre los estados de inspección y orden de servicio utilizados en el sistema.
            </p>
          </div>
          {isAllowed && (
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={handleOpenCreate}
            >
              <Plus size={16} /> Agregar Estado
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
            <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
              <label>Filtrar por Código:</label>
              <CustomSelect
                options={filterOptions}
                value={codeFilter}
                onChange={setCodeFilter}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setCodeFilter('todos')
                }}
                className="btn btn-secondary"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', marginTop: '0.35rem' }}
              >
                Restablecer
              </button>

              <button
                type="button"
                onClick={fetchStatuses}
                className="btn btn-secondary flex items-center gap-1"
                title="Refrescar estados"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', marginTop: '0.35rem' }}
              >
                <RefreshCw size={14} /> Recargar
              </button>
            </div>
          </div>
        </section>

        {/* Grid de Estados */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <Sliders size={48} className="mx-auto mb-2 text-gray-300" />
            <p>No se encontraron estados configurados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statuses.map((status) => (
              <div
                key={status.id}
                className="status-card bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between"
                style={{ opacity: 0 }}
              >
                <div>
                  <header className="flex justify-between items-start mb-4">
                    <span
                      className="badge text-xs font-bold px-2.5 py-1 rounded"
                      style={{
                        backgroundColor: `${status.color}15`,
                        color: status.color
                      }}
                    >
                      {status.code}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Hash size={12} /> Orden: {status.order ?? 'N/A'}
                    </span>
                  </header>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: status.color
                      }}
                    />
                    {status.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-6">
                    {status.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                {isAllowed && (
                  <div className="flex gap-2 border-t border-gray-50 pt-4 mt-auto justify-end">
                    <button
                      className="btn btn-secondary flex items-center gap-1 py-1 px-3 text-xs"
                      onClick={() => handleOpenEdit(status)}
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      className="btn btn-secondary flex items-center gap-1 py-1 px-3 text-xs text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(status.id)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Modal flotante */}
      {showFormModal && (
        <div ref={modalBackdropRef} className="floating-modal-backdrop" style={{ opacity: 0 }}>
          <form
            onSubmit={handleSubmit}
            className="floating-modal-box max-w-md"
            style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}
          >
            <header className="floating-modal-header">
              <h3>
                {selectedStatus ? 'Editar Estado' : 'Agregar Nuevo Estado'}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código de Estado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. PENDING, IN_PROGRESS"
                  className="form-control"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Descriptivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pendiente, En Progreso"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea
                  placeholder="Descripción detallada del estado..."
                  className="form-control"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '0.7rem 0.85rem',
                    marginTop: '0.35rem',
                    background: 'rgba(255, 255, 255, 0.92)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#155dfc'
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 93, 252, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Color representativo</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      className="form-control"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ padding: '0px', width: '44px', height: '44px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                    />
                    <span className="text-sm font-mono text-gray-500 uppercase">{formData.color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Orden de visualización</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  />
                </div>
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
                {submitting ? 'Guardando...' : 'Guardar Estado'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  )
}
