import { useState, useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import { API_BASE_URL } from '@/core/api/apiConfig'
import type { InspectionDetail } from '@/modules/inspeccion/domain/inspeccion.types'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

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
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function estadoBadge(insp: InspectionDetail) {
  const statusId = (insp as any).statusId || insp.status_id || (insp as any).status?.id

  if (insp.result === 'APROBADO') return { label: 'Aprobado', bg: '#dcfce7', color: '#166534' }
  if (insp.result === 'REPROBADO') return { label: 'Rechazado', bg: '#fee2e2', color: '#991b1b' }
  if (statusId && (insp.operator_id || insp.responsible_id) && !insp.result)
    return { label: 'En inspección', bg: '#dbeafe', color: '#1e40af' }
  return { label: 'En recepción', bg: '#fef9c3', color: '#854d0e' }
}

function getMediaUrl(path?: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}/api/v1/storage/files/${path}`
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  inspectionId: string | null
  onClose: () => void
  paymentStatusName?: string
}

/* ── Componente ──────────────────────────────────────────────────────────── */

export function DetalleRecepcionModal({ inspectionId, onClose, paymentStatusName }: Props) {
  const [detail, setDetail] = useState<InspectionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!inspectionId) {
      setDetail(null)
      return
    }
    setLoading(true)
    inspeccionService.obtenerDetalle(inspectionId).then((data) => {
      setDetail(data)
      setLoading(false)
    })
  }, [inspectionId])

  if (!inspectionId) return null

  const badge = detail ? estadoBadge(detail) : null

  return (
    <div
      style={{
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
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafbfc',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
              Detalle de Recepción #{detail?.inspection_number || inspectionId.substring(0, 8)}
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              ID: {inspectionId}
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Contenido */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1,
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 12 }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>
                Cargando información detallada...
              </p>
            </div>
          ) : detail ? (
            <>
              {/* Estado de Pago (desde factura) */}
              {paymentStatusName && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: paymentStatusName === 'Pagado' ? '#d1fae5' : '#fef3c7',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: paymentStatusName === 'Pagado' ? '#059669' : '#d97706', fontSize: '0.875rem' }}>
                    Estado de Pago
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: paymentStatusName === 'Pagado' ? '#059669' : '#d97706',
                      color: '#fff',
                    }}
                  >
                    {paymentStatusName.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Estado del Vehículo */}
              {badge && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: badge.bg,
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: badge.color, fontSize: '0.875rem' }}>
                    Estado del Vehículo
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: badge.color,
                      color: '#fff',
                    }}
                  >
                    {badge.label.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Cliente */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                  INFORMACIÓN DEL CLIENTE
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Nombre: </strong>{' '}
                  {detail.client
                    ? `${detail.client.nombre || ''} ${detail.client.apellido || ''}`.trim() || '—'
                    : '—'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Identificación: </strong>{' '}
                  {detail.client
                    ? `${detail.client.documentType?.type || 'CC'}: ${detail.client.identity}`
                    : '—'}
                </div>
                {detail.client?.celular && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Celular: </strong> {detail.client.celular}
                  </div>
                )}
                {detail.client?.email && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Email: </strong> {detail.client.email}
                  </div>
                )}
              </div>

              {/* Vehículo */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                  INFORMACIÓN DEL VEHÍCULO
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Placa: </strong> {detail.vehicle?.placa || '—'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Clase / Tipo: </strong>{' '}
                  {detail.vehicle?.tipoVehiculo?.nombre || detail.vehicle_type || '—'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Marca: </strong>{' '}
                  {typeof detail.vehicle?.marca === 'object' && detail.vehicle.marca
                    ? (detail.vehicle.marca as any).nombre
                    : detail.vehicle?.marca || '—'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Línea / Modelo: </strong>{' '}
                  {detail.vehicle
                    ? `${typeof detail.vehicle.linea === 'object' && detail.vehicle.linea ? (detail.vehicle.linea as any).nombre : detail.vehicle.linea || '—'} (${detail.vehicle.modelo || '—'})`
                    : '—'}
                </div>
                {detail.vehicle?.tipoCombustible?.nombre && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Combustible: </strong> {detail.vehicle.tipoCombustible.nombre}
                  </div>
                )}
                {detail.vehicle?.tipoServicio?.nombre && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Servicio: </strong> {detail.vehicle.tipoServicio.nombre}
                  </div>
                )}
              </div>

              {/* Condiciones de Ingreso */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                  CONDICIONES DE INGRESO
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Kilometraje: </strong>{' '}
                  {detail.mileage != null ? `${detail.mileage.toLocaleString()} km` : '—'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Tipo Revisión: </strong> {formatRevisionType(detail.revision_type)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Vidrios Polarizados: </strong> {detail.tinted_windows || 'NO'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Vehículo Blindado: </strong> {detail.armored_vehicle || 'NO'}
                </div>
                {detail.brake_fluid_sight_glass && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Líquido de frenos: </strong>{' '}
                    {detail.brake_fluid_sight_glass.replace(/_/g, ' ')}
                  </div>
                )}
              </div>

              {/* Ejes y Llantas */}
              {((detail.tires && detail.tires.length > 0) ||
                (detail.axles && detail.axles.length > 0)) && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, fontSize: '0.85rem' }}>
                    CONFIGURACIÓN DE EJES Y LLANTAS
                  </div>
                  {detail.axles && detail.axles.length > 0 && (
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#475569' }}>
                        Ejes:
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {detail.axles.map((ax, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                            }}
                          >
                            Eje {ax.index || idx + 1}: {ax.axle_type || '—'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.tires && detail.tires.length > 0 && (
                    <div style={{ fontSize: '0.85rem', marginTop: 6 }}>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#475569' }}>
                        Llantas:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {detail.tires.map((t, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', color: '#334155' }}>
                            • {t.position ? t.position.replace(/_/g, ' ') : `Rueda ${idx + 1}`} — Presión:{' '}
                            {t.tire_pressure ?? '—'} PSI — DOT: {t.code || 'PENDIENTE'}
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
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.85rem',
                    color: '#334155',
                    minHeight: '60px',
                  }}
                >
                  {detail.observations || 'Sin observaciones registradas.'}
                </div>
              </div>

              {/* Evidencias */}
              {((detail as any).photo_reception_url ||
                (detail as any).photo_url ||
                detail.signature_url) && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {((detail as any).photo_reception_url || (detail as any).photo_url) && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                      <span
                        style={{
                          display: 'block',
                          background: '#f8fafc',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        Evidencia Fotográfica
                      </span>
                      <div
                        style={{
                          padding: 10,
                          display: 'flex',
                          justifyContent: 'center',
                          background: '#f8fafc',
                        }}
                      >
                        <img
                          src={getMediaUrl(
                            (detail as any).photo_reception_url || (detail as any).photo_url,
                          )}
                          alt="Evidencia vehículo"
                          style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }}
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {detail.signature_url && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                      <span
                        style={{
                          display: 'block',
                          background: '#f8fafc',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        Firma del Cliente
                      </span>
                      <div
                        style={{
                          padding: 10,
                          display: 'flex',
                          justifyContent: 'center',
                          background: '#fff',
                        }}
                      >
                        <img
                          src={getMediaUrl(detail.signature_url)}
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

              {/* Operario */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  background: '#f8fafc',
                  padding: '0.85rem',
                  borderRadius: 8,
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                    Operador Asignado:
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                    {detail.operator_id ? `ID: ${detail.operator_id}` : 'No asignado'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                    Registrado el:
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                    {formatDate(detail.inspection_date || detail.date || detail.createdAt)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#ef4444' }}>
              No se pudo cargar la información de la recepción.
            </p>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#fafbfc',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <button
            onClick={onClose}
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
  )
}
