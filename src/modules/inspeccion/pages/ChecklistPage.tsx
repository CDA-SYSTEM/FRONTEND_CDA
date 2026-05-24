import { useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import {
  AlertCircle,
  AlertTriangle,
  Camera as CameraIcon,
  Car,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ClipboardList,
  Eye,
  Gauge,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { useChecklist } from '@/modules/inspeccion/hooks/useChecklist'
import {
  RESPONSE_OPTIONS_NTC5375,
  type ResponseOption,
  type TemplateSection,
} from '@/modules/inspeccion/domain/checklist.types'

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function vehicleTypeLabel(type: string | null): string {
  switch (type) {
    case 'MOTO': return 'Motocicleta'
    case 'LIVIANO': return 'Liviano'
    case 'PESADO': return 'Pesado'
    default: return type || '—'
  }
}

/**
 * HU-016: Mapea el título/código de sección a un ícono contextual.
 * Detecta secciones de sistema exterior (carrocería, puertas, vidrios, espejos, chasis)
 * y otros sistemas comunes de inspección vehicular.
 */
function sectionIcon(title: string) {
  const t = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (t.includes('exterior') || t.includes('carrocer') || t.includes('puerta') || t.includes('vidrio') || t.includes('espejo') || t.includes('chasis'))
    return <Car size={16} />
  if (t.includes('freno') || t.includes('brake'))
    return <Shield size={16} />
  if (t.includes('luces') || t.includes('luz') || t.includes('electr') || t.includes('señal'))
    return <Zap size={16} />
  if (t.includes('motor') || t.includes('emision') || t.includes('escape'))
    return <Settings size={16} />
  if (t.includes('suspension') || t.includes('direccion') || t.includes('llanta') || t.includes('rin'))
    return <Gauge size={16} />
  if (t.includes('visibilidad') || t.includes('retrovisor'))
    return <Eye size={16} />
  return <ClipboardList size={16} />
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

const FORMATOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/heic']
const TAMAÑO_MAXIMO_MB = 5
const TAMAÑO_MAXIMO_BYTES = TAMAÑO_MAXIMO_MB * 1024 * 1024

function base64ToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',')
  const match = header?.match(/data:(.*?);base64/)
  const mimeType = match?.[1] || 'image/jpeg'
  const binary = atob(base64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mimeType })
}

export function ChecklistPage() {
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const navigate = useNavigate()
  const {
    estado,
    template,
    responses,
    vehicleType,
    plate,
    observaciones,
    setObservaciones,
    errorMensaje,
    setErrorMensaje,
    progreso,
    responderItem,
    agregarObservacion,
    agregarFoto,
    eliminarFoto,
    obtenerFotosPorItem,
    itemsSinResponder,
    guardar,
    cerrar,
  } = useChecklist(inspectionId || '')

  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Set<number>>(new Set([0]))
  const [cerrando, setCerrando] = useState<'APROBADO' | 'RECHAZADO' | null>(null)
  const [guardando, setGuardando] = useState(false)

  /* HU-014: Opciones de respuesta dinámicas — del template o fallback NTC5375 */
  const responseOptions: ResponseOption[] = useMemo(() => {
    if (template?.response_options && template.response_options.length > 0) {
      return template.response_options
    }
    return RESPONSE_OPTIONS_NTC5375
  }, [template])

  const getRespuestaKey = useCallback((section: string, subsection: string, item: string) => {
    return `${section}:${subsection}:${item}`
  }, [])

  const getRespondidosPorSeccion = useCallback((section: TemplateSection) => {
    let count = 0
    for (const sub of section.subsections) {
      for (const item of sub.items) {
        const key = getRespuestaKey(section.code || '', sub.code || '', item.code)
        if (responses.has(key)) count++
      }
    }
    return count
  }, [getRespuestaKey, responses])

  const toggleSeccion = useCallback((idx: number) => {
    setSeccionesAbiertas((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  const handleGuardar = async () => {
    setGuardando(true)
    setErrorMensaje(null)
    await guardar()
    setGuardando(false)
  }

  const handleCerrar = async (resultado: 'APROBADO' | 'RECHAZADO') => {
    /* HU-014: No se puede enviar si hay ítems obligatorios sin respuesta */
    if (itemsSinResponder > 0) {
      setErrorMensaje(`No se puede cerrar: faltan ${itemsSinResponder} ítems obligatorios sin respuesta.`)
      return
    }
    setCerrando(resultado)
    setErrorMensaje(null)
    const ok = await cerrar(resultado)
    setCerrando(null)
    if (ok) {
      navigate('/inspeccion/asignacion', { replace: true })
    }
  }

  /* ── Estados de carga / error ── */
  if (estado === 'cargando') {
    return (
      <div className="panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#155DFC', marginBottom: 16 }} />
          <p style={{ color: '#64748b' }}>Cargando checklist...</p>
        </div>
      </div>
    )
  }

  if (estado === 'plantilla_sin_asignar') {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <ClipboardList size={48} color="#f59e0b" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>Plantilla no disponible</h3>
        <p style={{ color: '#6b7280', marginBottom: 8 }}>{errorMensaje}</p>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
          El servicio de checklist no tiene plantillas cargadas para este tipo de vehículo.
          Contacta al administrador para que agregue las plantillas NTC 5375 en el backend.
        </p>
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
          <ChevronLeft size={16} />
          Volver
        </button>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <AlertCircle size={48} color="#dc2626" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>Error al cargar</h3>
        <p style={{ color: '#6b7280', marginBottom: 8 }}>{errorMensaje || 'Ocurrió un error inesperado'}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
            <ChevronLeft size={16} />
            Volver
          </button>
          <button onClick={() => window.location.reload()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#155DFC', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'exito') {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <CheckCircle size={48} color="#16a34a" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>Inspección completada</h3>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>El checklist ha sido cerrado exitosamente.</p>
        <button onClick={() => navigate('/inspeccion/asignacion')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#155DFC', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          <ChevronLeft size={16} />
          Volver a asignaciones
        </button>
      </div>
    )
  }

  const hoy = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 900, margin: '0 auto' }}>

      {/* ═══════ Cabecera ═══════ */}
      <div className="panel" style={{ borderTop: '4px solid #155DFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #155DFC 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ClipboardList size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#1e293b' }}>
              {vehicleType === 'MOTO' ? 'Inspección Técnica — Motocicletas' : 'Inspección Técnica'}
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              {vehicleType === 'MOTO'
                ? 'Lista de chequeo NTC 5375:2012 — Numeral 8 (Motocicletas)'
                : 'Lista de chequeo NTC 5375:2012 — Numerales 6 y 7'}
            </p>
          </div>
        </div>

        {/* HU-014: Adaptación por tipo de vehículo — se muestra prominentemente */}
        {vehicleType && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 999, marginBottom: 16,
            background: vehicleType === 'MOTO' ? '#fef3c7' : vehicleType === 'PESADO' ? '#fee2e2' : '#dbeafe',
            color: vehicleType === 'MOTO' ? '#92400e' : vehicleType === 'PESADO' ? '#991b1b' : '#1e40af',
            fontSize: '0.82rem', fontWeight: 600,
          }}>
            {vehicleType === 'MOTO' ? '🏍️' : vehicleType === 'PESADO' ? '🚛' : '🚗'}
            Tipo: {vehicleTypeLabel(vehicleType)}
          </div>
        )}

        {/* Placa + Fecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Placa del Vehículo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={plate || ''}
              readOnly
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#f8fafc',
                fontSize: '0.95rem', fontWeight: 600, color: '#1e293b',
                textTransform: 'uppercase', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Fecha de Inspección
            </label>
            <input
              type="text"
              value={hoy}
              readOnly
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#f8fafc',
                fontSize: '0.95rem', color: '#475569', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══════ Barra de progreso global ═══════ */}
      <div className="panel" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
            Progreso: {progreso.respondidos} de {progreso.total} ítems
          </span>
          <span style={{ fontSize: '0.85rem', color: itemsSinResponder > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
            {itemsSinResponder > 0 ? `${itemsSinResponder} pendientes` : '✓ Completo'}
          </span>
        </div>
        <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: progreso.total > 0 ? `${(progreso.respondidos / progreso.total) * 100}%` : '0%',
            height: '100%',
            background: progreso.respondidos === progreso.total && progreso.total > 0
              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
              : 'linear-gradient(90deg, #155DFC, #3b82f6)',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* ═══════ Error ═══════ */}
      {errorMensaje && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b' }}>
          <AlertCircle size={16} />
          <span style={{ flex: 1, fontSize: '0.88rem' }}>{errorMensaje}</span>
          <button onClick={() => setErrorMensaje(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '1.1rem', padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {/* ═══════ Secciones Accordion ═══════ */}
      {template && template.sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section, idx) => (
          <AccordionSection
            key={section.code || idx}
            section={section}
            index={idx}
            isOpen={seccionesAbiertas.has(idx)}
            onToggle={() => toggleSeccion(idx)}
            initialRespondidos={getRespondidosPorSeccion(section)}
            respuestas={responses}
            responseOptions={responseOptions}
            onResponder={responderItem}
            onObservar={agregarObservacion}
            onAgregarFoto={agregarFoto}
            onEliminarFoto={eliminarFoto}
            obtenerFotos={obtenerFotosPorItem}
          />
        ))}

      {/* ═══════ Observaciones generales ═══════ */}
      {template && (
        <div className="panel">
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Observaciones generales
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales sobre la inspección..."
            rows={3}
            style={{
              width: '100%', resize: 'vertical', padding: '10px 14px',
              border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem',
              outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#155DFC' }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
          />
        </div>
      )}

      {/* ═══════ Acciones finales ═══════ */}
      {template && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap',
          padding: '16px 0', borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              background: '#fff', color: '#475569', border: '1px solid #e2e8f0',
              borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleGuardar}
            disabled={guardando || estado === 'enviando'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
              borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
              opacity: guardando ? 0.7 : 1,
            }}
          >
            {guardando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            Guardar borrador
          </button>

          <button
            onClick={() => handleCerrar('APROBADO')}
            disabled={cerrando !== null || estado === 'enviando'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
              fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              opacity: cerrando ? 0.7 : 1,
            }}
          >
            {cerrando === 'APROBADO'
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <CheckCircle size={16} />}
            Guardar Inspección
          </button>

          <button
            onClick={() => handleCerrar('RECHAZADO')}
            disabled={cerrando !== null || estado === 'enviando'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              opacity: cerrando ? 0.7 : 1,
            }}
          >
            {cerrando === 'RECHAZADO'
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <XCircle size={16} />}
            Rechazar
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Accordion Section Component
   ═══════════════════════════════════════════════ */

function AccordionSection({
  section,
  index,
  isOpen,
  onToggle,
  initialRespondidos,
  respuestas,
  responseOptions,
  onResponder,
  onObservar,
  onAgregarFoto,
  onEliminarFoto,
  obtenerFotos,
}: {
  section: TemplateSection
  index: number
  isOpen: boolean
  onToggle: () => void
  initialRespondidos: number
  respuestas: Map<string, { response?: string; observation?: string }>
  responseOptions: ResponseOption[]
  onResponder: (section: string, subsection: string, item: string, response: string) => void
  onObservar: (section: string, subsection: string, item: string, observation: string) => void
  onAgregarFoto: (section: string, subsection: string, item: string, file: File) => Promise<void>
  onEliminarFoto: (section: string, subsection: string, item: string, photoId: string) => void
  obtenerFotos: (section: string, subsection: string, item: string) => { id: string; previewUrl: string }[]
}) {
  const totalItems = section.subsections.reduce((s, ss) => s + ss.items.length, 0)
  const [respondidos, setRespondidos] = useState(initialRespondidos)

  const handleResponder = useCallback((sectionCode: string, subsectionCode: string, itemCode: string, response: string, isNewResponse: boolean) => {
    onResponder(sectionCode, subsectionCode, itemCode, response)
    if (isNewResponse) {
      setRespondidos((prev) => Math.min(prev + 1, totalItems))
    }
  }, [onResponder, totalItems])

  const colors = ['#155DFC', '#7c3aed', '#0ea5e9', '#8b5cf6', '#06b6d4', '#6366f1', '#14b8a6', '#a855f7', '#0d9488']
  const accentColor = colors[index % colors.length]

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${accentColor}`,
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '14px 20px',
          background: isOpen ? '#f8fafc' : '#fff',
          border: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseOver={(e) => { if (!isOpen) e.currentTarget.style.background = '#f8fafc' }}
        onMouseOut={(e) => { if (!isOpen) e.currentTarget.style.background = '#fff' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b', textAlign: 'left' }}>
          <span style={{ color: colors[index % colors.length], flexShrink: 0 }}>{sectionIcon(section.title)}</span>
          {section.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{
            fontSize: '0.82rem', fontWeight: 600,
            color: respondidos === totalItems && totalItems > 0 ? '#16a34a' : '#94a3b8',
          }}>
            {respondidos}/{totalItems}
          </span>
          {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </div>
      </button>

      {/* Contenido expandible */}
      {isOpen && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 20px' }}>
          {section.subsections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((sub, subIdx) => (
              <div key={sub.code || subIdx} style={{ marginBottom: subIdx < section.subsections.length - 1 ? 20 : 0 }}>
                {sub.title && (
                  <h4 style={{
                    margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 600,
                    color: '#475569', paddingBottom: 6,
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    {sub.title}
                  </h4>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sub.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <ItemRow
                        key={item.code}
                        item={item}
                        sectionCode={section.code || ''}
                        subsectionCode={sub.code || ''}
                        initialResponse={respuestas.get(`${section.code || ''}:${sub.code || ''}:${item.code}`)?.response ?? null}
                        initialObservation={respuestas.get(`${section.code || ''}:${sub.code || ''}:${item.code}`)?.observation ?? ''}
                        responseOptions={responseOptions}
                        onResponder={handleResponder}
                        onObservar={onObservar}
                        onAgregarFoto={onAgregarFoto}
                        onEliminarFoto={onEliminarFoto}
                        obtenerFotos={() => obtenerFotos(section.code || '', sub.code || '', item.code)}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   ItemRow — cada ítem del checklist
   HU-014: Cada ítem tiene opciones que vienen del backend
   HU-016: Muestra tipo de defecto (A/B) y observaciones
           para documentar estado estructural del vehículo
   ═══════════════════════════════════════════════ */

function ItemRow({
  item,
  sectionCode,
  subsectionCode,
  responseOptions,
  onResponder,
  onObservar,
  onAgregarFoto,
  onEliminarFoto,
  obtenerFotos,
  initialResponse,
  initialObservation,
}: {
  item: { code: string; description: string; defect_type: 'A' | 'B'; order: number }
  sectionCode: string
  subsectionCode: string
  initialResponse?: string | null
  initialObservation?: string
  responseOptions: ResponseOption[]
  onResponder: (section: string, subsection: string, item: string, response: string, isNew: boolean) => void
  onObservar: (section: string, subsection: string, item: string, observation: string) => void
  onAgregarFoto: (section: string, subsection: string, item: string, file: File) => Promise<void>
  onEliminarFoto: (section: string, subsection: string, item: string, photoId: string) => void
  obtenerFotos: () => { id: string; previewUrl: string }[]
}) {
  const [selected, setSelected] = useState<string | null>(initialResponse ?? null)
  const [observation, setObservation] = useState(initialObservation ?? '')
  const [showObservation, setShowObservation] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fotos = obtenerFotos()

  const procesarArchivoFoto = async (file: File) => {
    if (!FORMATOS_PERMITIDOS.includes(file.type)) {
      setErrorFoto('Formato no permitido. Use JPG, PNG o HEIC.')
      setTimeout(() => setErrorFoto(null), 4000)
      return
    }

    if (file.size > TAMAÑO_MAXIMO_BYTES) {
      setErrorFoto(`La imagen excede el tamaño máximo de ${TAMAÑO_MAXIMO_MB} MB.`)
      setTimeout(() => setErrorFoto(null), 4000)
      return
    }

    setSubiendoFoto(true)
    try {
      await onAgregarFoto(sectionCode, subsectionCode, item.code, file)
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleAdjuntarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await procesarArchivoFoto(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleTomarFoto = async () => {
    setErrorFoto(null)
    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
      })

      if (!photo.dataUrl) {
        setErrorFoto('No se pudo obtener la imagen de la cámara.')
        setTimeout(() => setErrorFoto(null), 4000)
        return
      }

      const file = base64ToFile(photo.dataUrl, `camera-${Date.now()}.jpg`)
      await procesarArchivoFoto(file)
    } catch (error) {
      setErrorFoto(
        error && typeof error === 'object' && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : 'No se pudo abrir la cámara.',
      )
      setTimeout(() => setErrorFoto(null), 4000)
    }
  }

  const handleResponse = (value: string) => {
    const isNew = selected === null
    setSelected(value)
    onResponder(sectionCode, subsectionCode, item.code, value, isNew)
  }

  const handleObservation = (value: string) => {
    setObservation(value)
    onObservar(sectionCode, subsectionCode, item.code, value)
  }

  /* Determine visual state from the selected option */
  const selectedOption = responseOptions.find((op) => op.value === selected)
  const isDefect = selected !== null && selected !== 'CUMPLE' && selected !== 'NO_APLICA'

  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: isDefect ? '#fef2f2' : selected ? '#f0fdf4' : '#fafafa',
      border: '1px solid',
      borderColor: selectedOption ? selectedOption.border : '#f1f5f9',
      transition: 'all 0.15s ease',
    }}>
      {/* HU-016: Descripción + badge de tipo de defecto */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.4 }}>
          {item.description}
        </span>
        <span
          title={item.defect_type === 'A' ? 'Defecto tipo A (leve)' : 'Defecto tipo B (grave)'}
          style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 4, fontSize: '0.72rem', fontWeight: 700,
            background: item.defect_type === 'A' ? '#fef3c7' : '#fee2e2',
            color: item.defect_type === 'A' ? '#92400e' : '#991b1b',
            border: `1px solid ${item.defect_type === 'A' ? '#fde68a' : '#fecaca'}`,
          }}
        >
          {item.defect_type}
        </span>
      </div>

      {/* Opciones de respuesta + toggle de observación */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {responseOptions.map((op) => {
          const isSelected = selected === op.value
          return (
            <button
              key={op.value}
              type="button"
              onClick={() => handleResponse(op.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 14px', fontSize: '0.82rem', fontWeight: 500,
                borderRadius: 6, cursor: 'pointer',
                border: `1.5px solid ${isSelected ? op.color : '#d1d5db'}`,
                background: isSelected ? op.bg : '#fff',
                color: isSelected ? op.color : '#6b7280',
                transition: 'all 0.12s ease',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>{op.icon}</span>
              {op.label}
            </button>
          )
        })}

        {/* HU-016: Botón para abrir/cerrar observación manualmente */}
        {!isDefect && !showObservation && (
          <button
            type="button"
            onClick={() => setShowObservation(true)}
            title="Agregar observación"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', fontSize: '0.78rem', fontWeight: 500,
              borderRadius: 6, cursor: 'pointer',
              border: '1px dashed #d1d5db', background: 'transparent',
              color: '#94a3b8', transition: 'all 0.12s ease',
            }}
          >
            <MessageSquare size={13} />
            Nota
          </button>
        )}
      </div>

      {/* HU-016: Campo de observación — visible siempre en defecto, o si el inspector lo abre */}
      {(isDefect || showObservation) && (
        <div style={{ marginTop: 8 }}>
          <input
            type="text"
            placeholder="Observación sobre el estado del componente..."
            value={observation}
            onChange={(e) => handleObservation(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px',
              fontSize: '0.82rem', border: '1px solid #e5e7eb',
              borderRadius: 6, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#155DFC' }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
          />
        </div>
      )}

      {/* HU-017: Adjuntar imágenes desde galería / explorador de archivos */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {errorFoto && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem',
            background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
          }}>
            <AlertTriangle size={13} />
            <span>{errorFoto}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleTomarFoto}
            disabled={subiendoFoto}
            title="Tomar foto con la cámara"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', fontSize: '0.78rem', fontWeight: 500,
              borderRadius: 6, cursor: subiendoFoto ? 'not-allowed' : 'pointer',
              border: '1px dashed #93c5fd', background: '#eff6ff',
              color: '#155DFC', transition: 'all 0.12s ease',
              opacity: subiendoFoto ? 0.6 : 1,
            }}
          >
            {subiendoFoto ? (
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CameraIcon size={13} />
            )}
            Tomar foto
          </button>

          {/* Input para galería / explorador */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
            onChange={handleAdjuntarFoto}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            title="Adjuntar imagen (JPG, PNG, HEIC — máx 5 MB)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', fontSize: '0.78rem', fontWeight: 500,
              borderRadius: 6, cursor: subiendoFoto ? 'not-allowed' : 'pointer',
              border: '1px dashed #93c5fd', background: '#eff6ff',
              color: '#155DFC', transition: 'all 0.12s ease',
              opacity: subiendoFoto ? 0.6 : 1,
            }}
          >
            {subiendoFoto ? (
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={13} />
            )}
            Adjuntar{subiendoFoto ? '' : fotos.length > 0 ? ` (${fotos.length})` : ''}
          </button>
        </div>
      </div>

      {/* HU-017: Miniaturas de fotos */}
      {fotos.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {fotos.map((foto) => (
            <div
              key={foto.id}
              style={{
                position: 'relative', width: 60, height: 60, borderRadius: 6,
                overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <img
                src={typeof foto.previewUrl === 'string' ? foto.previewUrl : ''}
                alt="Foto inspección"
                onClick={() => setFotoPreviewUrl(typeof foto.previewUrl === 'string' ? foto.previewUrl : null)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEliminarFoto(sectionCode, subsectionCode, item.code, foto.id) }}
                style={{
                  position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                  borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)',
                  color: '#fff', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HU-017: Modal de vista previa en tamaño completo */}
      {typeof fotoPreviewUrl === 'string' && fotoPreviewUrl.trim() && (
        <div
          onClick={() => setFotoPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 20,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setFotoPreviewUrl(null) }}
            style={{
              position: 'absolute', top: 16, right: 16, width: 36, height: 36,
              borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <X size={20} />
          </button>
          <img
            src={fotoPreviewUrl}
            alt="Vista previa"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '90vh', borderRadius: 8,
              objectFit: 'contain', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}
    </div>
  )
}
