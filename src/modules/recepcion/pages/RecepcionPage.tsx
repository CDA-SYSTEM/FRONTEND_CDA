import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle,
  Car,
  Calendar,
  Clock,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Wrench,
  X,
  Trash2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Pencil
} from 'lucide-react'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import { RecepcionWizard } from '@/modules/recepcion/components/RecepcionWizard'
import { SignaturePad } from '@/shared/components/SignaturePad'
import { useAuthStore } from '@/core/store/authStore'
import { estadoService } from '@/modules/estados/services/estadoService'
import type { Estado } from '@/modules/estados/domain/estado.types'
import type { InspectionSummary, InspectionDetail } from '@/modules/inspeccion/domain/inspeccion.types'
import { CustomSelect } from '@/shared/components/CustomSelect'
import './RecepcionPage.css'

/* ── Helpers para datos enriquecidos ──────────────────────────────────────── */

function infoVehiculo(insp: InspectionSummary): string {
  if ('vehicle' in insp) {
    const v = (insp as Record<string, unknown>).vehicle as { placa?: string } | undefined
    if (v?.placa) return v.placa
  }
  return insp.vehicle_id || '—'
}

function infoCliente(insp: InspectionSummary): string {
  if ('client' in insp) {
    const c = (insp as Record<string, unknown>).client as { nombre?: string; apellido?: string } | undefined
    if (c) return `${c.nombre || ''} ${c.apellido || ''}`.trim() || '—'
  }
  return insp.client_id || '—'
}

function formatRevisionType(type?: string): string {
  if (!type) return '—'
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

interface BadgeInfo {
  label: string
  bg: string
  color: string
}

function estadoBadge(insp: InspectionSummary | InspectionDetail, backendStatuses?: Estado[]): BadgeInfo {
  // Intentar buscar el estado en los cargados del backend
  const statusId = insp.status_id || (insp as any).status?.id
  const matched = backendStatuses?.find((s) => s.id === statusId)
  if (matched) {
    return {
      label: matched.name,
      bg: `${matched.color}15`,
      color: matched.color
    }
  }

  if (insp.result === 'APROBADO') return { label: 'Aprobado', bg: '#dcfce7', color: '#166534' }
  if (insp.result === 'REPROBADO') return { label: 'Rechazado', bg: '#fee2e2', color: '#991b1b' }
  if ((insp.operator_id || insp.responsible_id) && !insp.result) return { label: 'En inspección', bg: '#dbeafe', color: '#1e40af' }
  return { label: 'En recepción', bg: '#fef9c3', color: '#854d0e' }
}

/* ── Componente Principal ─────────────────────────────────────────────────── */

export function RecepcionPage() {
  const [modo, setModo] = useState<'tabla' | 'wizard'>('tabla')
  const [inspecciones, setInspecciones] = useState<InspectionSummary[]>([])
  const [statuses, setStatuses] = useState<Estado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)


  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal de Detalle
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [inspectionDetail, setInspectionDetail] = useState<InspectionDetail | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Modal de Edición
  const [editInspectionId, setEditInspectionId] = useState<string | null>(null)
  const [editMileage, setEditMileage] = useState<number | string>('')
  const [editObservations, setEditObservations] = useState('')
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editSignatureBlob, setEditSignatureBlob] = useState<Blob | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [editStatusId, setEditStatusId] = useState('')

  // Modal de Eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  // Obtener rol de usuario
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  // Dirección base de la API para imágenes
  const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [inspsData, statusesRes] = await Promise.all([
        inspeccionService.listarTodas(1, 100),
        estadoService.listarEstados({ size: 100 }),
      ])
      setInspecciones(inspsData)
      setStatuses(statusesRes.data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar las recepciones'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Cargar detalle cuando se selecciona
  useEffect(() => {
    if (!selectedInspectionId) {
      setInspectionDetail(null)
      return
    }
    let active = true
    const fetchDetail = async () => {
      setCargandoDetalle(true)
      try {
        const detail = await inspeccionService.obtenerDetalle(selectedInspectionId)
        if (active) setInspectionDetail(detail)
      } catch (err) {
        console.error('Error al cargar detalle', err)
      } finally {
        if (active) setCargandoDetalle(false)
      }
    }
    fetchDetail()
    return () => {
      active = false
    }
  }, [selectedInspectionId])

  // Cargar datos en el formulario de edición al seleccionar
  const iniciarEdicion = async (insp: InspectionSummary) => {
    setEditInspectionId(insp.id)
    setEditMileage(insp.mileage || '')
    setEditObservations('')
    setEditPhoto(null)
    setEditSignatureBlob(null)
    setEditStatusId('')
    
    try {
      const detail = await inspeccionService.obtenerDetalle(insp.id)
      if (detail) {
        setEditMileage(detail.mileage || '')
        setEditObservations(detail.observations || '')
        if (detail.status_id) {
          setEditStatusId(String(detail.status_id))
        } else if ((detail as any).status?.id) {
          setEditStatusId(String((detail as any).status.id))
        }
      }
    } catch (err) {
      console.error('Error al precargar observaciones para edición', err)
    }
  }

  // Guardar cambios de edición
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editInspectionId) return
    setGuardandoEdicion(true)
    try {
      const payload: Record<string, unknown> = {
        mileage: Number(editMileage),
        observations: editObservations,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(payload))
      
      if (editPhoto) {
        formData.append('photo', editPhoto)
      }
      if (editSignatureBlob) {
        formData.append('signature', editSignatureBlob, 'signature.png')
      }
      
      // Actualizar datos de inspección
      await inspeccionService.actualizar(editInspectionId, formData)

      // Actualizar estado si fue seleccionado uno válido
      if (editStatusId) {
        const detail = await inspeccionService.obtenerDetalle(editInspectionId)
        const oldStatusId = detail?.status_id || (detail as any)?.status?.id
        if (String(oldStatusId) !== String(editStatusId)) {
          // LLamada a endpoint PATCH /api/v1/inspections/{id}/status
          const { ordenServicioService } = await import('../services/ordenServicioService')
          await ordenServicioService.actualizarEstadoInspeccion(editInspectionId, editStatusId)
        }
      }

      await cargarDatos()
      setEditInspectionId(null)
    } catch (err) {
      alert('Error: No se pudieron guardar los cambios.')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  // Filtrado
  const filteredInspecciones = inspecciones.filter((insp) => {
    const plate = infoVehiculo(insp).toLowerCase()
    const client = infoCliente(insp).toLowerCase()
    const matchesSearch = plate.includes(searchTerm.toLowerCase()) || client.includes(searchTerm.toLowerCase())

    if (statusFilter === 'todos') return matchesSearch
    const badge = estadoBadge(insp, statuses)
    
    // Comparación case-insensitive de la etiqueta del badge
    const labelLower = badge.label.toLowerCase()
    if (statusFilter === 'aprobado' && labelLower === 'aprobado') return matchesSearch
    if (statusFilter === 'rechazado' && (labelLower === 'rechazado' || labelLower === 'reprobado')) return matchesSearch
    if (statusFilter === 'inspeccion' && labelLower === 'en inspección') return matchesSearch
    if (statusFilter === 'recepcion' && labelLower === 'en recepción') return matchesSearch
    
    // O si el filtro coincide exactamente con el ID del estado o el código
    const statusId = insp.status_id || (insp as any).status?.id
    const matchedStatus = statuses.find((s) => s.id === statusId)
    if (matchedStatus && (statusFilter === matchedStatus.id || statusFilter === matchedStatus.code.toLowerCase())) {
      return matchesSearch
    }

    return false
  })

  // Paginación
  const totalPages = Math.ceil(filteredInspecciones.length / itemsPerPage)
  const paginatedInspecciones = filteredInspecciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset de página al filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Manejar Eliminación
  const handleEliminar = async (id: string) => {
    setEliminandoId(id)
    try {
      await inspeccionService.eliminar(id)
      setInspecciones((prev) => prev.filter((i) => i.id !== id))
      setDeleteConfirmId(null)
    } catch (err) {
      alert('Error: No se pudo eliminar la recepción.')
    } finally {
      setEliminandoId(null)
    }
  }

  const getMediaUrl = (path?: string) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${apiBaseURL}/api/v1/storage/files/${path}`
  }

  /* ── Wizard de nueva orden ──────────────────────────────────────────────── */
  if (modo === 'wizard') {
    return (
      <RecepcionWizard onCancelar={() => { setModo('tabla'); cargarDatos() }} />
    )
  }

  /* ── Vista de tabla (dashboard) ─────────────────────────────────────────── */
  return (
    <div className="recepcion-root">

      {/* ── Cabecera ── */}
      <div className="page-header-responsive">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="recepcion-page-icon">
            <Car size={22} />
          </div>
          <div>
            <h1 className="recepcion-page-title">Recepción de Vehículos</h1>
            <p className="recepcion-page-desc">
              Registro de ingreso de vehículos para revisión técnico-mecánica
            </p>
          </div>
        </div>
        <div className="page-header-responsive-actions">
          <button
            className="recepcion-btn-refresh"
            onClick={cargarDatos}
            disabled={cargando}
            title="Refrescar"
          >
            <RefreshCw size={17} className={cargando ? 'recepcion-spin' : undefined} />
          </button>
          <button
            className="recepcion-btn-primary"
            onClick={() => setModo('wizard')}
          >
            <Plus size={16} />
            Nueva Recepción
          </button>
        </div>
      </div>

      {/* ── Controles de Filtros y Búsqueda ── */}
      <div className="recepcion-filter-bar">
        {/* Barra de Búsqueda */}
        <div className="recepcion-search-wrapper">
          <span className="recepcion-search-icon"><Search size={16} /></span>
          <input
            className="recepcion-search-input"
            type="text"
            placeholder="Buscar por placa o nombre de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro de Estado — pill tabs unificados */}
        <div className="recepcion-filter-tabs">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'recepcion', label: 'En recepción' },
            { value: 'inspeccion', label: 'En inspección' },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`recepcion-filter-tab${
                statusFilter === opt.value ? ' recepcion-filter-tab--active' : ''
              }`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido Principal ── */}
      <div className="recepcion-table-card">

        {/* Loading */}
        {cargando && (
          <div className="recepcion-loading">
            <Loader2 size={30} className="recepcion-spin" style={{ color: '#155DFC' }} />
            <p style={{ margin: 0 }}>Cargando recepciones...</p>
          </div>
        )}

        {/* Error */}
        {!cargando && error && (
          <div className="recepcion-error">
            <div className="recepcion-error-inner" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button className="recepcion-error-retry" onClick={cargarDatos}>Reintentar</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!cargando && !error && filteredInspecciones.length === 0 && (
          <div className="recepcion-empty">
            <div className="recepcion-empty-icon">
              <ClipboardList size={28} />
            </div>
            <h3 className="recepcion-empty-title">No hay recepciones que coincidan</h3>
            <p className="recepcion-empty-desc">
              No encontramos recepciones que coincidan con la búsqueda o el filtro activo.
            </p>
          </div>
        )}

        {/* Table */}
        {!cargando && !error && filteredInspecciones.length > 0 && (
          <div className="recepcion-table-scroll">
            <div className="receptions-table-desktop">
              <table className="recepcion-table">
              <thead>
                <tr>
                  {['#', 'Placa', 'Cliente', 'Tipo de revisión', 'Kilometraje', 'Fecha', 'Estado', 'Acciones'].map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedInspecciones.map((insp) => {
                  const badge = estadoBadge(insp, statuses)
                  return (
                    <tr key={insp.id}>
                      <td>
                        <span className="recepcion-id-cell">
                          {insp.inspection_number || insp.id.substring(0, 8)}
                        </span>
                      </td>
                      <td>
                        <span className="recepcion-plate-cell">
                          <Car size={13} className="rc-icon-muted" />
                          {infoVehiculo(insp)}
                        </span>
                      </td>
                      <td>{infoCliente(insp)}</td>
                      <td>
                        <span className="recepcion-type-cell">
                          <Wrench size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          {formatRevisionType(insp.revision_type)}
                        </span>
                      </td>
                      <td>
                        {insp.mileage != null ? `${insp.mileage.toLocaleString()} km` : '—'}
                      </td>
                      <td>
                        <span className="recepcion-date-cell">
                          <Calendar size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          {formatDate(insp.inspection_date || insp.date || insp.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="recepcion-badge-generic"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div className="recepcion-actions-cell">
                          <button
                            className="recepcion-action-btn recepcion-action-btn--view"
                            onClick={() => setSelectedInspectionId(insp.id)}
                            title="Ver Detalle"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="recepcion-action-btn recepcion-action-btn--edit"
                            onClick={() => iniciarEdicion(insp)}
                            title="Editar Recepción"
                          >
                            <Pencil size={16} />
                          </button>

                          {isAdmin && (
                            <button
                              className="recepcion-action-btn recepcion-action-btn--delete"
                              onClick={() => setDeleteConfirmId(insp.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="receptions-cards-mobile">
            {paginatedInspecciones.map((insp) => {
              const badge = estadoBadge(insp, statuses)
              return (
                <div key={insp.id} className="reception-card">
                  <div className="reception-card-header">
                    <span className="reception-card-number">{insp.inspection_number || insp.id.substring(0, 8)}</span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="reception-card-row">
                    <span className="reception-card-label">Placa:</span>
                    <span className="reception-card-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Car size={12} />
                      {infoVehiculo(insp)}
                    </span>
                  </div>

                  <div className="reception-card-row">
                    <span className="reception-card-label">Cliente:</span>
                    <span className="reception-card-value">{infoCliente(insp)}</span>
                  </div>

                  <div className="reception-card-row">
                    <span className="reception-card-label">Revisión:</span>
                    <span className="reception-card-value">{formatRevisionType(insp.revision_type)}</span>
                  </div>

                  <div className="reception-card-row">
                    <span className="reception-card-label">Kilometraje:</span>
                    <span className="reception-card-value">{insp.mileage != null ? `${insp.mileage.toLocaleString()} km` : '—'}</span>
                  </div>

                  <div className="reception-card-row">
                    <span className="reception-card-label">Fecha:</span>
                    <span className="reception-card-value">{formatDate(insp.inspection_date || insp.date || insp.createdAt)}</span>
                  </div>

                  <div className="reception-card-actions">
                    <button
                      onClick={() => setSelectedInspectionId(insp.id)}
                      style={{
                        background: '#eff6ff',
                        color: '#155DFC',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      <Eye size={14} />
                      Detalle
                    </button>

                    <button
                      onClick={() => iniciarEdicion(insp)}
                      style={{
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      <Pencil size={14} />
                      Editar
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setDeleteConfirmId(insp.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>


            {/* Paginación y Contador */}
            <div className="recepcion-table-footer">
              <span className="recepcion-footer-timestamp">
                <Clock size={13} />
                Última actualización: {new Date().toLocaleTimeString('es-CO')}
              </span>

              {totalPages > 1 && (
                <div className="recepcion-pagination">
                  <button
                    className="recepcion-pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="recepcion-pagination-label">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="recepcion-pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              <span className="recepcion-footer-count">
                {filteredInspecciones.length} de {inspecciones.length} recepciones
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de Detalle de Recepción ── */}
      {selectedInspectionId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Cabecera Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafbfc',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
                  Detalle de Recepción #{inspectionDetail?.inspection_number || selectedInspectionId.substring(0, 8)}
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  ID: {selectedInspectionId}
                </p>
              </div>
              <button
                onClick={() => setSelectedInspectionId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido Modal */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cargandoDetalle ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 12 }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Cargando información detallada...</p>
                </div>
              ) : inspectionDetail ? (
                <>
                  {/* Estado Principal */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: estadoBadge(inspectionDetail, statuses).bg,
                    borderRadius: 8,
                  }}>
                    <span style={{ fontWeight: 600, color: estadoBadge(inspectionDetail, statuses).color, fontSize: '0.875rem' }}>
                      Estado del Vehículo
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: estadoBadge(inspectionDetail, statuses).color,
                      color: '#fff',
                    }}>
                      {estadoBadge(inspectionDetail, statuses).label.toUpperCase()}
                    </span>
                  </div>

                  {/* Ficha técnica del Cliente */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                      INFORMACIÓN DEL CLIENTE
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Nombre: </strong> {inspectionDetail.client ? `${inspectionDetail.client.nombre} ${inspectionDetail.client.apellido || ''}` : '—'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Identificación: </strong> {inspectionDetail.client ? `${inspectionDetail.client.documentType?.type || 'CC'}: ${inspectionDetail.client.identity}` : '—'}
                    </div>
                    {inspectionDetail.client?.celular && (
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        <strong>Celular: </strong> {inspectionDetail.client.celular}
                      </div>
                    )}
                    {inspectionDetail.client?.email && (
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        <strong>Email: </strong> {inspectionDetail.client.email}
                      </div>
                    )}
                  </div>

                  {/* Ficha técnica del Vehículo */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                      INFORMACIÓN DEL VEHÍCULO
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Placa: </strong> {inspectionDetail.vehicle?.placa || '—'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Clase / Tipo: </strong> {inspectionDetail.vehicle?.tipoVehiculo?.nombre || inspectionDetail.vehicle_type || '—'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Marca: </strong> {typeof inspectionDetail.vehicle?.marca === 'object' && inspectionDetail.vehicle.marca ? (inspectionDetail.vehicle.marca as any).nombre : (inspectionDetail.vehicle?.marca || '—')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Línea / Modelo: </strong> {inspectionDetail.vehicle ? `${typeof inspectionDetail.vehicle.linea === 'object' && inspectionDetail.vehicle.linea ? (inspectionDetail.vehicle.linea as any).nombre : (inspectionDetail.vehicle.linea || '—')} (${inspectionDetail.vehicle.modelo || '—'})` : '—'}
                    </div>
                    {inspectionDetail.vehicle?.tipoCombustible?.nombre && (
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        <strong>Combustible: </strong> {inspectionDetail.vehicle.tipoCombustible.nombre}
                      </div>
                    )}
                    {inspectionDetail.vehicle?.tipoServicio?.nombre && (
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        <strong>Servicio: </strong> {inspectionDetail.vehicle.tipoServicio.nombre}
                      </div>
                    )}
                  </div>

                  {/* Ficha técnica de la Recepción */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                      CONDICIONES DE INGRESO
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Kilometraje: </strong> {inspectionDetail.mileage != null ? `${inspectionDetail.mileage.toLocaleString()} km` : '—'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Tipo Revisión: </strong> {formatRevisionType(inspectionDetail.revision_type)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Vidrios Polarizados: </strong> {inspectionDetail.tinted_windows || 'NO'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <strong>Vehículo Blindado: </strong> {inspectionDetail.armored_vehicle || 'NO'}
                    </div>
                    {inspectionDetail.brake_fluid_sight_glass && (
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        <strong>Líquido de frenos: </strong> {inspectionDetail.brake_fluid_sight_glass.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>

                  {/* Detalle de Llantas y Ejes */}
                  {((inspectionDetail.tires && inspectionDetail.tires.length > 0) || (inspectionDetail.axles && inspectionDetail.axles.length > 0)) && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                        CONFIGURACIÓN DE EJES Y LLANTAS
                      </div>
                      {inspectionDetail.axles && inspectionDetail.axles.length > 0 && (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#475569' }}>Ejes:</span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {inspectionDetail.axles.map((ax, idx) => (
                              <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
                                Eje {ax.index || idx + 1}: {ax.axle_type || '—'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {inspectionDetail.tires && inspectionDetail.tires.length > 0 && (
                        <div style={{ fontSize: '0.85rem', marginTop: 6 }}>
                          <span style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#475569' }}>Llantas:</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {inspectionDetail.tires.map((t, idx) => (
                              <div key={idx} style={{ fontSize: '0.8rem', color: '#334155' }}>
                                • {t.position ? t.position.replace(/_/g, ' ') : `Rueda ${idx + 1}`} — Presión: {t.tire_pressure ?? '—'} PSI — DOT: {t.code || 'PENDIENTE'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Observaciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      Observaciones de Ingreso
                    </span>
                    <div style={{
                      background: '#f8fafc',
                      padding: '0.85rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                      color: '#334155',
                      minHeight: '60px',
                    }}>
                      {inspectionDetail.observations || 'Sin observaciones registradas.'}
                    </div>
                  </div>


                  {/* Evidencias (Fotos y Firma) */}
                  {((inspectionDetail as any).photo_reception_url || (inspectionDetail as any).photo_url || inspectionDetail.signature_url) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {/* Foto */}
                      {((inspectionDetail as any).photo_reception_url || (inspectionDetail as any).photo_url) && (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                          <span style={{ display: 'block', background: '#f8fafc', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Evidencia Fotográfica
                          </span>
                          <div style={{ padding: 10, display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
                            <img
                              src={getMediaUrl((inspectionDetail as any).photo_reception_url || (inspectionDetail as any).photo_url)}
                              alt="Evidencia vehículo"
                              style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Firma */}
                      {inspectionDetail.signature_url && (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                          <span style={{ display: 'block', background: '#f8fafc', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Firma del Cliente
                          </span>
                          <div style={{ padding: 10, display: 'flex', justifyContent: 'center', background: '#fff' }}>
                            <img
                              src={getMediaUrl(inspectionDetail.signature_url)}
                              alt="Firma del cliente"
                              style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Datos del Operario */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Operador Asignado:</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                        {inspectionDetail.operator_id ? `ID: ${inspectionDetail.operator_id}` : 'No asignado'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Registrado el:</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                        {formatDate(inspectionDetail.inspection_date || inspectionDetail.date || inspectionDetail.createdAt)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ textAlign: 'center', color: '#ef4444' }}>No se pudo cargar la información.</p>
              )}
            </div>

            {/* Pie de Modal */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#fafbfc',
            }}>
              <button
                onClick={() => setSelectedInspectionId(null)}
                style={{
                  background: '#155DFC',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Edición de Recepción ── */}
      {editInspectionId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <form onSubmit={handleGuardarEdicion} style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Cabecera Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafbfc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Pencil size={18} style={{ color: '#155DFC' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                  Editar Recepción
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditInspectionId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido Formulario */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Kilometraje */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  Kilometraje Actual (km) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editMileage}
                  onChange={(e) => setEditMileage(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Estado de la inspección */}
              {statuses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                    Estado de la Recepción *
                  </label>
                  <CustomSelect
                    options={statuses.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                    value={editStatusId}
                    onChange={(val) => setEditStatusId(val)}
                  />
                </div>
              )}

              {/* Observaciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  Observaciones de Ingreso
                </label>
                <textarea
                  rows={3}
                  value={editObservations}
                  onChange={(e) => setEditObservations(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Foto Adjunta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  Actualizar Foto del Vehículo (Opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPhoto(e.target.files?.[0] || null)}
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                  }}
                />
              </div>

              {/* Firma Adjunta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  Actualizar Firma del Cliente (Opcional)
                </label>
                <div style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: 10,
                  background: '#f8fafc',
                }}>
                  <SignaturePad onSave={(blob) => setEditSignatureBlob(blob)} height={120} />
                </div>
              </div>

            </div>

            {/* Pie de Formulario */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              background: '#fafbfc',
            }}>
              <button
                type="button"
                onClick={() => setEditInspectionId(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoEdicion}
                style={{
                  background: '#155DFC',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {guardandoEdicion ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal de Confirmación de Eliminación ── */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#991b1b' }}>
              Confirmar Eliminación
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem', lineHeight: '1.4' }}>
              ¿Estás seguro de que deseas eliminar esta recepción? Esta acción es irreversible y realizará un borrado lógico en el sistema.
            </p>
            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={eliminandoId !== null}
                style={{
                  flex: 1,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '10px',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(deleteConfirmId)}
                disabled={eliminandoId !== null}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {eliminandoId !== null ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
