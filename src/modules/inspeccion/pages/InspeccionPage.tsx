import { useState } from 'react'
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  Search,
  User,
  Wrench,
} from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import type {
  InspectionDetail,
  InspectionResult,
  InspectionSummary,
} from '@/modules/inspeccion/domain/inspeccion.types'

function nombreTecnico(insp: InspectionSummary | InspectionDetail): string {
  if ('operator_data' in insp && insp.operator_data) {
    const d = insp.operator_data
    return `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || '—'
  }
  if (insp.operator) {
    const o = insp.operator
    return `${o.firstName || ''} ${o.lastName || ''}`.trim() || o.name || '—'
  }
  return '—'
}

function resultadoEstilo(result?: InspectionResult) {
  switch (result) {
    case 'APROBADO':
      return { bg: '#f0fdf4', text: '#16a34a', label: 'Aprobado' }
    case 'REPROBADO':
      return { bg: '#fef2f2', text: '#dc2626', label: 'Reprobado' }
    default:
      return { bg: '#f8fafc', text: '#6b7280', label: 'Sin resultado' }
  }
}

export function InspeccionPage() {
  const user = useAuthStore((state) => state.user)
  const esLectura =
    user?.role !== 'admin' &&
    user?.role !== 'superadmin'

  const [placa, setPlaca] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inspecciones, setInspecciones] = useState<InspectionSummary[]>([])
  const [buscado, setBuscado] = useState(false)
  const [vehiculoInfo, setVehiculoInfo] = useState<string | null>(null)

  const [detalle, setDetalle] = useState<InspectionDetail | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [detalleAbierto, setDetalleAbierto] = useState<string | null>(null)

  const handleBuscar = async () => {
    const placaTrim = placa.trim().toUpperCase()
    if (!placaTrim) return

    setCargando(true)
    setError(null)
    setBuscado(true)
    setInspecciones([])
    setDetalle(null)
    setDetalleAbierto(null)
    setVehiculoInfo(null)

    try {
      const resultados = await inspeccionService.listarPorVehiculo(placaTrim)
      setInspecciones(resultados)
      if (resultados.length > 0) {
        const primero = resultados[0]
        const v = primero as InspectionDetail
        if (v.vehicle) {
          const veh = v.vehicle
          setVehiculoInfo(`${veh.placa || placaTrim} — ${veh.marca || ''} ${veh.linea || ''} ${veh.modelo || ''}`.trim().replace(/—\s*$/, '') || placaTrim)
        } else {
          setVehiculoInfo(placaTrim)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar el historial.')
    } finally {
      setCargando(false)
    }
  }

  const abrirDetalle = async (id: string) => {
    if (detalleAbierto === id) {
      setDetalleAbierto(null)
      setDetalle(null)
      return
    }

    setCargandoDetalle(true)
    setDetalleAbierto(id)
    setDetalle(null)

    try {
      const d = await inspeccionService.obtenerDetalle(id)
      setDetalle(d)
    } catch {
      setDetalle(null)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '—'
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return fecha
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '1.5rem',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
            Historial de Revisiones
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Consulte el historial técnico-mecánico de un vehículo por placa
          </p>
        </div>
        {esLectura && (
          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: '#854d0e',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Eye size={14} />
            Solo lectura
          </div>
        )}
      </div>

      {/* Buscador por placa */}
      <article className="panel">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            >
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por placa (ej: ABC123)"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              style={{ paddingLeft: 40, height: 44, textTransform: 'uppercase' }}
              maxLength={7}
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={cargando || !placa.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 20px',
            }}
          >
            {cargando ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} />
            )}
            {cargando ? 'Buscando...' : 'Consultar'}
          </button>
        </div>
      </article>

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#991b1b',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Sin resultados */}
      {buscado && !cargando && inspecciones.length === 0 && !error && (
        <article className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <ClipboardList size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#64748b', marginBottom: 8 }}>Sin historial</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            No se encontraron revisiones para la placa <strong>{placa}</strong>.
          </p>
        </article>
      )}

      {/* Lista de inspecciones */}
      {inspecciones.length > 0 && (
        <article className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <strong style={{ color: '#1e293b' }}>
                Vehículo: {vehiculoInfo || placa}
              </strong>
              <span style={{ marginLeft: 12, color: '#64748b', fontWeight: 400, fontSize: '0.9rem' }}>
                {inspecciones.length} revisión{inspecciones.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>

          {inspecciones.map((insp) => {
            const cr = resultadoEstilo(insp.result)
            return (
              <div key={insp.id}>
                {/* Fila de resumen */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => abrirDetalle(insp.id)}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <Calendar size={18} color="#64748b" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: '#1e293b' }}>
                        {insp.inspection_number ? `#${insp.inspection_number}` : `ID: ${insp.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Clock size={12} />
                        {formatearFecha(insp.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    {/* Resultado badge */}
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: cr.bg,
                        color: cr.text,
                        minWidth: 80,
                        textAlign: 'center',
                      }}
                    >
                      {cr.label}
                    </span>

                    {/* Técnico asignado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#475569' }}>
                      <User size={13} />
                      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nombreTecnico(insp)}
                      </span>
                    </div>

                    {/* Tipo de revisión */}
                    {insp.revision_type && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#64748b' }}>
                        <Wrench size={13} />
                        <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {insp.revision_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {detalleAbierto === insp.id ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </div>
                </div>

                {/* Detalle expandible */}
                {detalleAbierto === insp.id && (
                  <div
                    style={{
                      background: '#f8fafc',
                      borderBottom: '1px solid #e5e7eb',
                      padding: '16px 20px',
                    }}
                  >
                    {cargandoDetalle ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                      </div>
                    ) : detalle ? (
                      <div style={{ display: 'grid', gap: 16 }}>
                        {/* Grid de datos */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 12,
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Kilometraje</span>
                            <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{detalle.mileage ?? '—'} km</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Tipo de revisión</span>
                            <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                              {detalle.revision_type?.replace(/_/g, ' ') || '—'}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Cliente</span>
                            <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                              {detalle.client
                                ? `${detalle.client.nombre || ''} ${detalle.client.apellido || ''}`.trim() || '—'
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Técnico asignado</span>
                            <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                              {nombreTecnico(detalle)}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Resultado</span>
                            <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                              {detalle.result ? cr.label : 'Pendiente'}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Vehículo</span>
                            <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                              {detalle.vehicle
                                ? `${detalle.vehicle.placa || ''} ${detalle.vehicle.marca || ''} ${detalle.vehicle.linea || ''}`.trim() || '—'
                                : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Checklist */}
                        {detalle.checklist && Object.keys(detalle.checklist).length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: 8 }}>
                              Resultados del checklist
                            </span>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 6,
                              }}
                            >
                              {Object.entries(detalle.checklist).map(([key, val]) => (
                                <div
                                  key={key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 8px',
                                    background: val ? '#f0fdf4' : '#fef2f2',
                                    borderRadius: 4,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: val ? '#16a34a' : '#dc2626',
                                      flexShrink: 0,
                                    }}
                                  />
                                  {key.replace(/_/g, ' ')}: {String(val)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fotos si existen */}
                        {detalle.photo_url && (
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>
                              Foto de recepción
                            </span>
                            <a
                              href={detalle.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', fontSize: '0.9rem' }}
                            >
                              Ver imagen
                            </a>
                          </div>
                        )}

                        {/* Botón de edición solo para Admin */}
                        {!esLectura && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, gap: 8 }}>
                            <button
                              title="Funcionalidad en desarrollo"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 16px',
                                fontSize: '0.85rem',
                                background: '#e0e7ff',
                                color: '#4f46e5',
                                border: '1px solid #c7d2fe',
                                borderRadius: 6,
                                cursor: 'default',
                                opacity: 0.7,
                              }}
                              onClick={() => alert('Edición de revisión: funcionalidad en desarrollo.')}
                            >
                              <Eye size={14} />
                              Editar revisión
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                        No se pudo cargar el detalle de esta revisión.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </article>
      )}
    </div>
  )
}
