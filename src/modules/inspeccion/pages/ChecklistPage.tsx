import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  Save,
  XCircle,
} from 'lucide-react'
import { useChecklist } from '@/modules/inspeccion/hooks/useChecklist'
import type { ItemResponse, TemplateSection } from '@/modules/inspeccion/domain/checklist.types'

const OPCIONES: { value: ItemResponse; label: string; color: string }[] = [
  { value: 'Cumple', label: 'Cumple', color: '#16a34a' },
  { value: 'No Cumple', label: 'No Cumple', color: '#dc2626' },
  { value: 'No Aplica', label: 'N/A', color: '#6b7280' },
]

function nombreVehicleType(tipo: string | null) {
  switch (tipo) {
    case 'MOTO': return 'Motocicleta'
    case 'LIVIANO': return 'Liviano'
    case 'PESADO': return 'Pesado'
    default: return tipo || '—'
  }
}

export function ChecklistPage() {
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const navigate = useNavigate()
  const {
    estado,
    template,
    vehicleType,
    plate,
    observaciones,
    setObservaciones,
    errorMensaje,
    setErrorMensaje,
    progreso,
    responderItem,
    agregarObservacion,
    itemsSinResponder,
    guardar,
    cerrar,
  } = useChecklist(inspectionId || '')

  const [seccionActiva, setSeccionActiva] = useState(0)
  const [cerrando, setCerrando] = useState<'APROBADO' | 'RECHAZADO' | null>(null)
  const [guardando, setGuardando] = useState(false)

  const seccionActual = template?.sections[seccionActiva]

  const irSiguiente = () => {
    if (template && seccionActiva < template.sections.length - 1) {
      setSeccionActiva((prev) => prev + 1)
    }
  }

  const irAnterior = () => {
    if (seccionActiva > 0) {
      setSeccionActiva((prev) => prev - 1)
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setErrorMensaje(null)
    await guardar()
    setGuardando(false)
  }

  const handleCerrar = async (resultado: 'APROBADO' | 'RECHAZADO') => {
    setCerrando(resultado)
    setErrorMensaje(null)
    const ok = await cerrar(resultado)
    setCerrando(null)
    if (ok) {
      navigate('/inspeccion/asignacion', { replace: true })
    }
  }

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
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
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
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
          Verifica que el servicio de checklist esté disponible en el backend.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
            <ChevronLeft size={16} />
            Volver
          </button>
          <button onClick={() => window.location.reload()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
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
        <button onClick={() => navigate('/inspeccion/asignacion')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
          <ChevronLeft size={16} />
          Volver a asignaciones
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cabecera */}
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClipboardList size={24} color="#155DFC" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: '#1e293b' }}>
              Checklist Técnico-Mecánica
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              {plate ? `${plate} — ` : ''}Tipo: {nombreVehicleType(vehicleType)}
              {template && <span style={{ marginLeft: 8, color: '#9ca3af' }}>— {template.sections.length} secciones</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/inspeccion/asignacion')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
        >
          <ChevronLeft size={16} />
          Salir
        </button>
      </div>

      {/* Progreso */}
      <div className="panel" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
            Progreso: {progreso.respondidos} de {progreso.total} ítems
          </span>
          <span style={{ fontSize: '0.85rem', color: itemsSinResponder > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
            {itemsSinResponder > 0 ? `${itemsSinResponder} pendientes` : 'Completo'}
          </span>
        </div>
        <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: progreso.total > 0 ? `${(progreso.respondidos / progreso.total) * 100}%` : '0%',
            height: '100%',
            background: progreso.respondidos === progreso.total ? '#16a34a' : '#155DFC',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Error */}
      {errorMensaje && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b' }}>
          <AlertCircle size={16} />
          <span>{errorMensaje}</span>
          <button onClick={() => setErrorMensaje(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '1.1rem' }}>&times;</button>
        </div>
      )}

      {template && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Sidebar de secciones */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '1.5rem' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', background: '#f8fafc' }}>
              Secciones
            </div>
            {template.sections.map((section, idx) => {
              const total = section.subsections.reduce((s, ss) => s + ss.items.length, 0)
              return (
                <button
                  key={section.code || idx}
                  onClick={() => setSeccionActiva(idx)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: '1px solid #f1f5f9',
                    background: seccionActiva === idx ? '#eff6ff' : '#fff',
                    color: seccionActiva === idx ? '#155DFC' : '#374151',
                    fontWeight: seccionActiva === idx ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{section.title}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{total}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Contenido de la sección actual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SeccionContent
              section={seccionActual}
              onResponder={responderItem}
              onObservar={agregarObservacion}
            />

            {/* Navegación entre secciones */}
            <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={irAnterior}
                disabled={seccionActiva === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', ...(seccionActiva === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : { cursor: 'pointer' }) }}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {seccionActiva + 1} de {template.sections.length}
              </span>
              <button
                onClick={irSiguiente}
                disabled={seccionActiva >= template.sections.length - 1}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', ...(seccionActiva >= template.sections.length - 1 ? { opacity: 0.5, cursor: 'not-allowed' } : { cursor: 'pointer' }) }}
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Observaciones generales */}
            <div className="panel">
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Observaciones generales
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre la inspección..."
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={handleGuardar}
                disabled={guardando || estado === 'enviando'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
              >
                {guardando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Guardar borrador
              </button>

              <button
                onClick={() => handleCerrar('APROBADO')}
                disabled={cerrando !== null || estado === 'enviando'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                {cerrando === 'APROBADO' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                Aprobar
              </button>

              <button
                onClick={() => handleCerrar('RECHAZADO')}
                disabled={cerrando !== null || estado === 'enviando'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                {cerrando === 'RECHAZADO' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={16} />}
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SeccionContent({
  section,
  onResponder,
  onObservar,
}: {
  section?: TemplateSection
  onResponder: (section: string, subsection: string, item: string, response: ItemResponse) => void
  onObservar: (section: string, subsection: string, item: string, observation: string) => void
}) {
  if (!section) return null

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
          {section.title}
        </h2>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {section.subsections.map((sub, subIdx) => (
          <div key={sub.code || subIdx} style={{ marginBottom: subIdx < section.subsections.length - 1 ? 24 : 0 }}>
            {sub.title && (
              <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>
                {sub.title}
              </h3>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sub.items
                .slice().sort((a, b) => a.order - b.order)
                .map((item) => (
                  <ItemRow
                    key={item.code}
                    item={item}
                    sectionCode={section.code || ''}
                    subsectionCode={sub.code || ''}
                    onResponder={onResponder}
                    onObservar={onObservar}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ItemRow({
  item,
  sectionCode,
  subsectionCode,
  onResponder,
  onObservar,
}: {
  item: { code: string; description: string; defect_type: 'A' | 'B'; order: number }
  sectionCode: string
  subsectionCode: string
  onResponder: (section: string, subsection: string, item: string, response: ItemResponse) => void
  onObservar: (section: string, subsection: string, item: string, observation: string) => void
}) {
  const [selected, setSelected] = useState<ItemResponse | null>(null)
  const [observation, setObservation] = useState('')

  const handleResponse = (value: ItemResponse) => {
    setSelected(value)
    onResponder(sectionCode, subsectionCode, item.code, value)
  }

  const handleObservation = (value: string) => {
    setObservation(value)
    onObservar(sectionCode, subsectionCode, item.code, value)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 16px',
      borderRadius: 8,
      background: selected === 'No Cumple' ? '#fef2f2' : '#fff',
      border: '1px solid',
      borderColor: selected === 'No Cumple' ? '#fecaca' : selected ? '#bbf7d0' : '#e5e7eb',
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
              {item.description}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              background: item.defect_type === 'A' ? '#fef2f2' : '#fff7ed',
              color: item.defect_type === 'A' ? '#dc2626' : '#ea580c',
            }}>
              Tipo {item.defect_type}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {OPCIONES.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => handleResponse(op.value)}
              style={{
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontWeight: 500,
                borderRadius: 6,
                border: '2px solid',
                borderColor: selected === op.value ? op.color : '#e5e7eb',
                background: selected === op.value ? `${op.color}15` : '#fff',
                color: selected === op.value ? op.color : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <input
          type="text"
          placeholder="Observación (opcional)"
          value={observation}
          onChange={(e) => handleObservation(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: '0.82rem',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            outline: 'none',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#155DFC' }}
          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
        />
      </div>
    </div>
  )
}
