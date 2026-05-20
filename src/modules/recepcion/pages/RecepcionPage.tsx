import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Car, Calendar, Clock, ClipboardList, Loader2, Plus, RefreshCw, Wrench, X } from 'lucide-react'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import { RecepcionWizard } from '@/modules/recepcion/components/RecepcionWizard'
import type { InspectionSummary } from '@/modules/inspeccion/domain/inspeccion.types'

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
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

/* ── Badge de estado ──────────────────────────────────────────────────────── */

interface BadgeInfo {
  label: string
  bg: string
  color: string
}

function estadoBadge(insp: InspectionSummary): BadgeInfo {
  if (insp.result === 'APROBADO') return { label: 'Aprobado', bg: '#dcfce7', color: '#166534' }
  if (insp.result === 'REPROBADO') return { label: 'Rechazado', bg: '#fee2e2', color: '#991b1b' }
  if (insp.operator_id && !insp.result) return { label: 'En inspección', bg: '#dbeafe', color: '#1e40af' }
  return { label: 'En recepción', bg: '#fef9c3', color: '#854d0e' }
}

/* ── Componente Principal ─────────────────────────────────────────────────── */

export function RecepcionPage() {
  const [modo, setModo] = useState<'tabla' | 'wizard'>('tabla')
  const [inspecciones, setInspecciones] = useState<InspectionSummary[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await inspeccionService.listarTodas(1, 50)
      setInspecciones(data)
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

  /* ── Wizard de nueva orden ──────────────────────────────────────────────── */
  if (modo === 'wizard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Cabecera con botón de volver */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '1.5rem',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
              Nueva Recepción
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              Registro de ingreso de vehículo para revisión técnico-mecánica
            </p>
          </div>
          <button
            onClick={() => { setModo('tabla'); cargarDatos() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#f1f5f9',
              color: '#475569',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <X size={16} />
            Volver
          </button>
        </div>
        <RecepcionWizard onCancelar={() => { setModo('tabla'); cargarDatos() }} />
      </div>
    )
  }

  /* ── Vista de tabla (dashboard) ─────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Cabecera ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '1.5rem',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: '#eff6ff',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Car size={24} style={{ color: '#155DFC' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
              Recepción de Vehículos
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              Registro de ingreso de vehículos para revisión técnico-mecánica
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            title="Refrescar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9',
              color: '#475569',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.6 : 1,
            }}
          >
            <RefreshCw size={18} style={cargando ? { animation: 'spin 1s linear infinite' } : undefined} />
          </button>
          <button
            onClick={() => setModo('wizard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#155DFC',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1347d4')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#155DFC')}
          >
            <Plus size={18} />
            Nueva Recepción
          </button>
        </div>
      </div>

      {/* ── Contenido Principal ── */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>

        {/* Loading */}
        {cargando && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
            <p style={{ color: '#64748b', margin: 0 }}>Cargando recepciones...</p>
          </div>
        )}

        {/* Error */}
        {!cargando && error && (
          <div style={{ padding: '1.5rem' }}>
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#991b1b',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                onClick={cargarDatos}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!cargando && !error && inspecciones.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px',
            gap: 12,
          }}>
            <div style={{
              background: '#f1f5f9',
              borderRadius: 999,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ClipboardList size={32} style={{ color: '#94a3b8' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
              No hay recepciones registradas
            </h3>
            <p style={{ margin: 0, color: '#64748b', textAlign: 'center', maxWidth: 400 }}>
              Aún no se han registrado recepciones de vehículos. Haz clic en "+ Nueva Recepción" para comenzar.
            </p>
          </div>
        )}

        {/* Table */}
        {!cargando && !error && inspecciones.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['#', 'Placa', 'Cliente', 'Tipo de revisión', 'Kilometraje', 'Fecha', 'Estado'].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#475569',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inspecciones.map((insp, idx) => {
                  const badge = estadoBadge(insp)
                  const isHovered = hoveredRow === insp.id
                  return (
                    <tr
                      key={insp.id}
                      onMouseEnter={() => setHoveredRow(insp.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isHovered ? '#f8fafc' : idx % 2 === 0 ? '#fff' : '#fafbfc',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {insp.inspection_number || insp.id.substring(0, 8)}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#1e293b',
                          fontWeight: 500,
                        }}>
                          <Car size={14} style={{ color: '#64748b' }} />
                          {infoVehiculo(insp)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {infoCliente(insp)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Wrench size={14} style={{ color: '#64748b' }} />
                          {formatRevisionType(insp.revision_type)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {insp.mileage != null ? `${insp.mileage.toLocaleString()} km` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} style={{ color: '#64748b' }} />
                          {formatDate(insp.createdAt)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                          whiteSpace: 'nowrap',
                        }}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Footer con contador */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '0.8rem',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} />
                Última actualización: {new Date().toLocaleTimeString('es-CO')}
              </span>
              <span>{inspecciones.length} recepción(es) encontrada(s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
