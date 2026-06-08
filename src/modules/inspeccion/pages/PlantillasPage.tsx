import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  CheckSquare,
  Eye
} from 'lucide-react'
import { animate, stagger } from 'animejs'
import { checklistTemplateService } from '../services/checklistTemplateService'
import type { ChecklistTemplate } from '../domain/checklist.types'
import type { CrearChecklistTemplateDTO } from '../domain/checklistTemplate.types'
import { useAuthStore } from '@/core/store/authStore'
import { AnimatedText } from '@/shared/components/AnimatedText'
import { CustomSelect } from '@/shared/components/CustomSelect'
import './PlantillasPage.css'

export function PlantillasPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('todos')

  // Modales
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Detalle visualizador
  const [viewingTemplate, setViewingTemplate] = useState<ChecklistTemplate | null>(null)

  // Datos para nueva/editar plantilla
  const [formData, setFormData] = useState<CrearChecklistTemplateDTO>({
    code: 'LIVIANOS_PESADOS',
    name: '',
    version: 1,
    active: true,
    supported_vehicle_types: ['LIVIANO'],
    sections: []
  })

  // JSON de entrada rápido para las secciones de la plantilla
  const [sectionsJSON, setSectionsJSON] = useState('')

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await checklistTemplateService.listarPlantillas()
      setTemplates(data || [])
    } catch (err: any) {
      console.error('Error al listar plantillas:', err)
      setError('No se pudieron cargar las plantillas de checklist del sistema.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Animación staggered de las tarjetas de plantillas
  useEffect(() => {
    if (!loading && templates.length > 0) {
      animate('.template-card', {
        translateY: [24, 0],
        opacity: [0, 1],
        delay: stagger(80),
        duration: 700,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      })
    }
  }, [loading, templates])

  // Callback de Ref para animar la entrada del modal
  const modalBackdropRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      animate(node, {
        opacity: [0, 1],
        duration: 250,
        easing: 'easeOutQuad'
      })
      const box = node.querySelector('.modal-window-premium') || node.querySelector('.floating-modal-box')
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
    setSelectedTemplate(null)
    setFormData({
      code: 'LIVIANOS_PESADOS',
      name: '',
      version: templates.length + 1,
      active: true,
      supported_vehicle_types: ['LIVIANO'],
      sections: [
        {
          code: 'S1',
          title: 'Inspección Exterior',
          order: 1,
          subsections: [
            {
              code: 'SS1',
              title: 'Vidrios y Espejos',
              order: 1,
              items: [
                {
                  code: 'ITEM1',
                  description: 'Vidrios polarizados o fisurados',
                  defect_type: 'A',
                  order: 1
                }
              ]
            }
          ]
        }
      ]
    })
    setSectionsJSON(JSON.stringify([
      {
        code: 'S1',
        title: 'Inspección Exterior',
        order: 1,
        subsections: [
          {
            code: 'SS1',
            title: 'Vidrios y Espejos',
            order: 1,
            items: [
              {
                code: 'ITEM1',
                description: 'Vidrios polarizados o fisurados',
                defect_type: 'A',
                order: 1
              }
            ]
          }
        ]
      }
    ], null, 2))
    setShowFormModal(true)
  }

  const handleOpenEdit = (template: ChecklistTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      code: template.code,
      name: template.name,
      version: template.version ?? 1,
      active: template.active ?? true,
      supported_vehicle_types: (template.supported_vehicle_types || []) as any,
      sections: template.sections || []
    })
    setSectionsJSON(JSON.stringify(template.sections || [], null, 2))
    setShowFormModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      let parsedSections = []
      try {
        parsedSections = JSON.parse(sectionsJSON)
      } catch (err) {
        throw new Error('El formato JSON de las secciones es inválido.')
      }

      const payload = {
        ...formData,
        sections: parsedSections
      }

      if (selectedTemplate) {
        await checklistTemplateService.actualizarPlantilla(selectedTemplate.id, payload)
      } else {
        await checklistTemplateService.crearPlantilla(payload)
      }
      setShowFormModal(false)
      fetchTemplates()
    } catch (err: any) {
      console.error('Error guardando plantilla:', err)
      setError(err.message || 'Error al guardar la plantilla. Verifique los datos.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta plantilla de checklist?')) return
    try {
      await checklistTemplateService.eliminarPlantilla(id)
      fetchTemplates()
    } catch (err: any) {
      console.error('Error eliminando plantilla:', err)
      alert('No se pudo eliminar la plantilla.')
    }
  }

  const user = useAuthStore((state) => state.user)
  const isAllowed =
    user?.role === 'SUPERADMIN' ||
    user?.role === 'ROLE_SUPERADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER'

  const filteredTemplates = templates.filter((t) => {
    if (vehicleTypeFilter === 'todos') return true
    return t.supported_vehicle_types.includes(vehicleTypeFilter)
  })

  return (
    <div className="plantillas-root">
      <article className="panel">
        <header className="flex justify-between items-center mb-6">
          <div>
            <AnimatedText
              text="Plantillas de Checklist"
              variant="soft-blur-in"
              style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}
            />
            <p className="text-gray-500 text-sm" style={{ marginTop: '4px' }}>
              Gestione las secciones, subsecciones e ítems evaluados en las revisiones de vehículos.
            </p>
          </div>
          {isAllowed && (
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={handleOpenCreate}
            >
              <Plus size={16} /> Crear Plantilla
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
            <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Vehículo Soportado:</label>
              <CustomSelect
                options={[
                  { value: 'todos', label: 'Todos los vehículos' },
                  { value: 'LIVIANO', label: 'Liviano' },
                  { value: 'PESADO', label: 'Pesado' },
                  { value: 'MOTO', label: 'Motos' }
                ]}
                value={vehicleTypeFilter}
                onChange={setVehicleTypeFilter}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setVehicleTypeFilter('todos')
                }}
                className="btn btn-secondary"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', marginTop: '0.35rem' }}
              >
                Restablecer
              </button>

              <button
                type="button"
                onClick={fetchTemplates}
                className="btn btn-secondary flex items-center gap-1"
                title="Refrescar plantillas"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', marginTop: '0.35rem' }}
              >
                <RefreshCw size={14} /> Recargar
              </button>
            </div>
          </div>
        </section>

        {/* Grid de Plantillas */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <CheckSquare size={48} className="mx-auto mb-2 text-gray-300" />
            <p>No se encontraron plantillas configuradas.</p>
          </div>
        ) : (
          <div className="plantillas-cards-grid">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                className="template-card plantilla-premium-card"
                style={{ opacity: 0 }}
              >
                <div className="plantilla-premium-card-body">
                  <header className="plantilla-premium-card-header">
                    <div className="plantilla-vehicles-left">
                      {t.supported_vehicle_types.map((vt) => (
                        <span key={vt} className="plantilla-badge-vehicle">
                          {vt}
                        </span>
                      ))}
                    </div>
                    <span className={`plantilla-badge-status ${
                      t.active ? 'plantilla-badge-status--active' : 'plantilla-badge-status--inactive'
                    }`}>
                      {t.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </header>

                  <h3 className="plantilla-name">
                    {t.name}
                  </h3>

                  <div className="plantilla-details">
                    <div className="plantilla-detail-row">
                      <span className="plantilla-detail-row-label">Código</span>
                      <span className="plantilla-detail-row-value">{t.code}</span>
                    </div>
                    <div className="plantilla-detail-row">
                      <span className="plantilla-detail-row-label">Versión</span>
                      <span className="plantilla-detail-row-value">{t.version ?? 1}</span>
                    </div>
                    <div className="plantilla-detail-row">
                      <span className="plantilla-detail-row-label">Secciones</span>
                      <span className="plantilla-detail-row-value">{t.sections?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="plantilla-premium-card-footer">
                  <button
                    className="plt-btn-action plt-btn-action--view"
                    onClick={() => setViewingTemplate(t)}
                  >
                    <Eye size={13} /> Ver
                  </button>
                  {isAllowed && (
                    <>
                      <button
                        className="plt-btn-action plt-btn-action--edit"
                        onClick={() => handleOpenEdit(t)}
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        className="plt-btn-action plt-btn-action--delete"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Modal Formulario */}
      {showFormModal && createPortal(
        <div ref={modalBackdropRef} className="modal-overlay-premium" style={{ opacity: 0 }}>
          <form
            onSubmit={handleSubmit}
            className="modal-window-premium max-w-lg plantilla-crear-modal-window"
            style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}
          >
            <header className="floating-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                {selectedTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowFormModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: 8,
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                  boxShadow: 'none',
                  minHeight: 'initial'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              >
                <X size={18} />
              </button>
            </header>

            <div className="plantilla-crear-modal-body">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Plantilla *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Plantilla de Motocicletas NTC 5375"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Código de la Plantilla *</label>
                  <CustomSelect
                    options={[
                      { value: 'MOTOS', label: 'Motos' },
                      { value: 'LIVIANOS_PESADOS', label: 'Livianos y Pesados' }
                    ]}
                    value={formData.code}
                    onChange={(val) => setFormData({ ...formData, code: val as any })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Versión</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Secciones de la Plantilla (JSON Formato) *</label>
                <textarea
                  required
                  rows={8}
                  className="plantilla-crear-json-textarea"
                  value={sectionsJSON}
                  onChange={(e) => setSectionsJSON(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: 'auto', minHeight: 'initial', marginTop: 0 }}
                />
                <label htmlFor="active" className="text-sm font-semibold text-gray-700">Plantilla Activa</label>
              </div>
            </div>

            <div className="plantilla-crear-modal-footer">
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
                {submitting ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Visualizador de Plantilla */}
      {viewingTemplate && createPortal(
        <div ref={modalBackdropRef} className="modal-overlay-premium" style={{ opacity: 0 }}>
          <div 
            className="modal-window-premium max-w-lg plantilla-detalle-modal-window"
            style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}
          >
            <header className="floating-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>{viewingTemplate.name}</h3>
                <span className="text-xs text-gray-400">{viewingTemplate.code} — Versión {viewingTemplate.version ?? 1}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingTemplate(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: 8,
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                  boxShadow: 'none',
                  minHeight: 'initial'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              >
                <X size={18} />
              </button>
            </header>

            <div className="plantilla-detalle-modal-body">
              {viewingTemplate.sections?.map((section) => (
                <div key={section.id || section.code} style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#155DFC', fontSize: '1rem', fontWeight: 700 }}>
                    Sección {section.code || ''}: {section.title}
                  </h4>
                  {section.subsections?.map((subsec) => (
                    <div key={subsec.id || subsec.code} style={{ paddingLeft: '12px', marginBottom: '8px' }}>
                      <h5 style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>
                        {subsec.title}
                      </h5>
                      {subsec.items?.map((item) => (
                        <div key={item.id || item.code} style={{ paddingLeft: '12px', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>• {item.description}</span>
                          <span style={{ fontWeight: 600, color: item.defect_type === 'A' ? '#ea580c' : '#dc2626' }}>
                            Defecto {item.defect_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="plantilla-detalle-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingTemplate(null)}
                style={{ width: '100%' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
