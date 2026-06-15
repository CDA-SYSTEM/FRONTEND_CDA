import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import {
  AlertCircle,
  AlertTriangle,
  Bike,
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
  Truck,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { useChecklist } from '@/modules/inspeccion/hooks/useChecklist'
import { type TemplateSection, type VehicleType } from '@/modules/inspeccion/domain/checklist.types'
import { CustomSelect } from '@/shared/components/CustomSelect'

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
    const [cerrando, setCerrando] = useState<'APROBADO' | 'RECHAZADO' | null>(null)
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

function getFriendlySectionTitle(code: string, title: string): string {
  const normalizedCode = (code || '').trim()
  if (normalizedCode.startsWith('10.')) {
    return `${normalizedCode} ADAPTACIONES DE LOS VEHICULOS UTILIZADOS PARA IMPARTIR LA ENSEÑANZA AUTOMOVILISTICA`
  }
  return title
}

function agruparSeccionesPlantilla(sections: TemplateSection[]): TemplateSection[] {
  const result: TemplateSection[] = []
  let seccion10: TemplateSection | null = null

  for (const sec of sections) {
    const code = (sec.code || '').trim()
    const title = (sec.title || '').toUpperCase()
    const isAnexoA =
      code.startsWith('10.') ||
      code === '10' ||
      code.startsWith('ANEXO A') ||
      title.includes('ADAPTACIONES DE LOS VEHICULOS')

    if (isAnexoA) {
      if (!seccion10) {
        seccion10 = {
          code: '10',
          title: 'ADAPTACIONES DE LOS VEHICULOS UTILIZADOS PARA IMPARTIR LA ENSEÑANZA AUTOMOVILISTICA En los vehiculos autorizados para impartir la enseñanza automovilistica se debe verificar:',
          order: sec.order || 10,
          subsections: []
        }
        result.push(seccion10)
      }
      
      for (const sub of sec.subsections) {
        const subTitle = sub.title || sec.title || ''
        seccion10.subsections.push({
          ...sub,
          title: subTitle
        })
      }
    } else {
      result.push(sec)
    }
  }

  if (seccion10) {
    seccion10.subsections.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  return result
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

function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

function esCamaraTelefonica(label: string): boolean {
  const value = label.toLowerCase()
  return (
    value.includes('phone')
    || value.includes('mobile')
    || value.includes('movil')
    || value.includes('móvil')
    || value.includes('link')
    || value.includes('remote')
    || value.includes('virtual')
    || value.includes('android')
    || value.includes('iphone')
  )
}

function esCamaraPreferida(label: string): boolean {
  const value = label.toLowerCase()
  return (
    value.includes('integrated')
    || value.includes('built-in')
    || value.includes('builtin')
    || value.includes('internal')
    || value.includes('webcam')
    || value.includes('camera')
    || value.includes('hd')
    || value.includes('usb')
  )
}

async function obtenerCamaraWebPreferida(): Promise<MediaStream> {
  const permisoTemporal = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  const dispositivos = await navigator.mediaDevices.enumerateDevices()
  const camaras = dispositivos.filter((device) => device.kind === 'videoinput')
  const infoCamaras = camaras.map((device, index) => ({
    deviceId: device.deviceId,
    label: device.label || '',
    index,
  }))

  const preferida = infoCamaras.find((device) => esCamaraPreferida(device.label) && !esCamaraTelefonica(device.label))
    || infoCamaras.find((device) => !esCamaraTelefonica(device.label))
    || infoCamaras[0]

  permisoTemporal.getTracks().forEach((track) => track.stop())

  if (!preferida) {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
  }

  return navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: preferida.deviceId } },
    audio: false,
  })
}

export function ChecklistPage() {
  const { inspectionId, vehicleType: vehicleTypeParam } = useParams<{ inspectionId: string; vehicleType?: string }>()
  const navigate = useNavigate()
  const vehicleTypeFromUrl: VehicleType | null = useMemo(() => {
    if (!vehicleTypeParam) return null
    const upper = vehicleTypeParam.toUpperCase()
    if (upper === 'MOTO' || upper === 'LIVIANO' || upper === 'PESADO') return upper as VehicleType
    return null
  }, [vehicleTypeParam])
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
    agregarObservacion,
    agregarFoto,
    eliminarFoto,
    obtenerFotosPorItem,
    responderItem,
    guardar,
    cerrar,
    inspectorId,
    setInspectorId,
    inspectores,
    limpiarBorradorLocal,
  } = useChecklist(inspectionId || '', vehicleTypeFromUrl)

  const optionsInspectores = useMemo(() => {
    return inspectores.map((ins) => ({
      value: ins.id,
      label: ins.name || [ins.firstName, ins.lastName].filter(Boolean).join(' ') || ins.email || '',
    }))
  }, [inspectores])
   const [seccionesAbiertas, setSeccionesAbiertas] = useState<Set<number>>(new Set([0]))
  const [cerrando, setCerrando] = useState<'APROBADO' | 'RECHAZADO' | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mostrarExitoGuardado, setMostrarExitoGuardado] = useState(false)
  const [mostrarExitoCierre, setMostrarExitoCierre] = useState(false)
  const [mostrarErrorCierre, setMostrarErrorCierre] = useState(false)

  /* HU-014: Opciones de respuesta dinámicas — del template o fallback NTC5375 */
  

  

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
    const ok = await guardar()
    setGuardando(false)
    if (ok) {
      setMostrarExitoGuardado(true)
    }
  }

  const handleCerrar = async (resultado: 'APROBADO' | 'RECHAZADO') => {
    if (!inspectorId) {
      setErrorMensaje('Debe seleccionar un inspector asignado antes de cerrar la inspección.')
      return
    }
    setCerrando(resultado)
    setErrorMensaje(null)
    const ok = await cerrar(resultado)
    setCerrando(null)
    if (ok) {
      setMostrarExitoCierre(true)
    } else {
      setMostrarErrorCierre(true)
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

      {/* Botón de Volver */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          onClick={() => navigate('/inspeccion/asignacion')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#ffffff',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 500,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <ChevronLeft size={16} />
          Volver a Inspecciones
        </button>
      </div>

      {/* ═══════ Cabecera ═══════ */}
      <div className="panel" style={{ borderTop: '4px solid #155DFC', position: 'relative', zIndex: 10 }}>
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
                ? 'Inspección Técnica NTC 5375:2012 — Numeral 8 (Motocicletas)'
                : 'Inspección Técnica NTC 5375:2012 — Numerales 6 y 7'}
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
            {vehicleType === 'MOTO' ? <Bike size={14} /> : vehicleType === 'PESADO' ? <Truck size={14} /> : <Car size={14} />}
            Tipo: {vehicleTypeLabel(vehicleType)}
          </div>
        )}

        {/* Placa + Inspector + Fecha */}
        <div className="checklist-header-grid has-inspector">
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Placa del Vehículo <span style={{ display: 'inline', color: '#dc2626', margin: 0, fontSize: 'inherit' }}>*</span>
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
              Inspector Asignado <span style={{ display: 'inline', color: '#dc2626', margin: 0, fontSize: 'inherit' }}>*</span>
            </label>
            <CustomSelect
              options={optionsInspectores}
              value={inspectorId}
              onChange={setInspectorId}
              placeholder="Seleccione inspector..."
              style={{
                marginTop: 0,
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

      {/* ═══════ Barra de progreso global — Oculta para Inspección por Excepción ═══════ */}

      {/* ═══════ Error ═══════ */}
      {errorMensaje && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b' }}>
          <AlertCircle size={16} />
          <span style={{ flex: 1, fontSize: '0.88rem' }}>{errorMensaje}</span>
          <button onClick={() => setErrorMensaje(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '1.1rem', padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {/* ═══════ Secciones Accordion ═══════ */}
      {template && agruparSeccionesPlantilla(template.sections)
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section, idx) => (
          <AccordionSection
            key={section.code || idx}
            section={section}
            index={idx}
            isOpen={seccionesAbiertas.has(idx)}
            onToggle={() => toggleSeccion(idx)}
            respuestas={responses}
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
            onClick={() => { limpiarBorradorLocal(); navigate(-1) }}
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
            Guardar progreso
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


        </div>
      )}

      {/* Modal de éxito al guardar progreso */}
      {mostrarExitoGuardado && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '24px 32px',
            width: '90%',
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>
              Progreso Guardado
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
              El progreso de la inspección se ha guardado correctamente en el sistema.
            </p>
            <button
              onClick={() => setMostrarExitoGuardado(false)}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#155DFC',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#155DFC' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal de éxito al cerrar inspección */}
      {mostrarExitoCierre && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '24px 32px',
            width: '90%',
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>
              Inspección Guardada
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
              La inspección técnica se ha cerrado y guardado exitosamente en el sistema.
            </p>
            <button
              onClick={() => {
                setMostrarExitoCierre(false)
                navigate('/inspeccion/asignacion', { replace: true })
              }}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal de error al cerrar (ej. falta labrado) */}
      {mostrarErrorCierre && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '24px 32px',
            width: '90%',
            maxWidth: 420,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700, color: '#991b1b' }}>
              No se pudo cerrar
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
              Ocurrió un inconveniente al cerrar la inspección.
            </p>
            {errorMensaje && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px',
                fontSize: '0.85rem',
                color: '#475569',
                textAlign: 'left',
                maxHeight: 120,
                overflowY: 'auto',
                marginBottom: 20,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                <strong>Detalle:</strong> {errorMensaje}
              </div>
            )}
            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Por favor, verifique si falta registrar el labrado de las llantas en la pestaña de la inspección, o si hay algún campo obligatorio pendiente.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setMostrarErrorCierre(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Volver al Formulario
              </button>
              <button
                onClick={() => {
                  setMostrarErrorCierre(false)
                  navigate('/inspeccion/asignacion')
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#155DFC',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Ir a Asignaciones
              </button>
            </div>
          </div>
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
  respuestas,
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
  respuestas: Map<string, { response?: string; observation?: string }>
  onResponder: (section: string, subsection: string, item: string, response: string, isNew: boolean) => void
  onObservar: (section: string, subsection: string, item: string, observation: string) => void
  onAgregarFoto: (section: string, subsection: string, item: string, file: File) => Promise<void>
  onEliminarFoto: (section: string, subsection: string, item: string, photoId: string) => void
  obtenerFotos: (section: string, subsection: string, item: string) => { id: string; previewUrl: string }[]
}) {
  const totalItems = section.subsections.reduce((s, ss) => s + ss.items.length, 0)
  // Calcular los ítems respondidos a partir del mapa `respuestas` para mantener consistencia
  const respondidos = section.subsections.reduce((count, ss) => {
    for (const it of ss.items) {
      const key = `${section.code || ''}:${ss.code || ''}:${it.code}`
      if (respuestas.has(key)) count++
    }
    return count
  }, 0)

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
          {getFriendlySectionTitle(section.code || '', section.title)}
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
                    .map((item, itemIdx) => (
                      <ItemRow
                        key={`${section.code || ''}:${sub.code || ''}:${item.code}-${itemIdx}`}
                        item={item}
                        sectionCode={section.code || ''}
                        subsectionCode={sub.code || ''}
                        initialResponse={respuestas.get(`${section.code || ''}:${sub.code || ''}:${item.code}`)?.response ?? null}
                        initialObservation={respuestas.get(`${section.code || ''}:${sub.code || ''}:${item.code}`)?.observation ?? ''}
                        onResponder={onResponder}
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
  initialResponse,
  initialObservation,
  onResponder,
  onObservar,
  onAgregarFoto,
  onEliminarFoto,
  obtenerFotos,
}: {
  item: { code: string; description: string; defect_type: 'A' | 'B'; order: number }
  sectionCode: string
  subsectionCode: string
  initialResponse?: string | null
  initialObservation?: string
  onResponder: (section: string, subsection: string, item: string, response: string, isNew: boolean) => void
  onObservar: (section: string, subsection: string, item: string, observation: string) => void
  onAgregarFoto: (section: string, subsection: string, item: string, file: File) => Promise<void>
  onEliminarFoto: (section: string, subsection: string, item: string, photoId: string) => void
  obtenerFotos: () => { id: string; previewUrl: string }[]
}) {
  // Ya no usamos selección interactiva; renderizamos sólo el `defect_type` del item
  const [observation, setObservation] = useState(initialObservation ?? '')
  const [showObservation, setShowObservation] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null)
  const [mostrarCamaraWeb, setMostrarCamaraWeb] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const webStreamRef = useRef<MediaStream | null>(null)
  const fotos = obtenerFotos()
  const selectedType = initialResponse === 'A' || initialResponse === 'B' ? initialResponse : null

  const procesarArchivoFoto = useCallback(async (file: File) => {
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
  }, [item.code, onAgregarFoto, sectionCode, subsectionCode])

  const handleAdjuntarFoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await procesarArchivoFoto(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [procesarArchivoFoto])

  const cerrarCamaraWeb = useCallback(() => {
    webStreamRef.current?.getTracks().forEach((track) => track.stop())
    webStreamRef.current = null
    setMostrarCamaraWeb(false)
  }, [])

  const capturarFotoWeb = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setErrorFoto('No se pudo preparar la captura de la cámara.')
      setTimeout(() => setErrorFoto(null), 4000)
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.85)
    })

    if (!blob) {
      setErrorFoto('No se pudo capturar la imagen de la cámara.')
      setTimeout(() => setErrorFoto(null), 4000)
      return
    }

    cerrarCamaraWeb()
    await procesarArchivoFoto(new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' }))
  }, [cerrarCamaraWeb, procesarArchivoFoto])

  useEffect(() => {
    if (!mostrarCamaraWeb) return undefined

    const video = videoRef.current
    if (!video || !webStreamRef.current) return undefined

    video.srcObject = webStreamRef.current
    void video.play().catch(() => {
      setErrorFoto('No se pudo iniciar la cámara del navegador.')
      setTimeout(() => setErrorFoto(null), 4000)
      cerrarCamaraWeb()
    })

    return () => {
      cerrarCamaraWeb()
    }
  }, [mostrarCamaraWeb, cerrarCamaraWeb])

  const handleTomarFoto = useCallback(async () => {
    setErrorFoto(null)
    try {
      if (!isNativePlatform()) {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErrorFoto('Este navegador no soporta acceso a la cámara.')
          setTimeout(() => setErrorFoto(null), 4000)
          return
        }

        const stream = await obtenerCamaraWebPreferida()

        webStreamRef.current = stream
        setMostrarCamaraWeb(true)
        return
      }

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
  }, [procesarArchivoFoto])

  // Selección A/B visible desde la tarjeta del ítem

  const handleObservation = useCallback((value: string) => {
    setObservation(value)
    onObservar(sectionCode, subsectionCode, item.code, value)
  }, [item.code, onObservar, sectionCode, subsectionCode])

  // Mostrar sólo el defect_type que viene en la plantilla/backend
  const displayType = item.defect_type
  const isSelected = selectedType === displayType
  const isDefect = displayType === 'B'
  const defectTone = !isSelected
    ? {
        bg: '#f0fdf4',
        border: '#bbf7d0',
        chipBg: '#dcfce7',
        chipColor: '#166534',
        chipBorder: '#86efac',
      }
    : displayType === 'B'
    ? {
        bg: '#fff7ed',
        border: '#fed7aa',
        chipBg: '#fef3c7',
        chipColor: '#92400e',
        chipBorder: '#f59e0b',
      }
    : {
        bg: '#fef2f2',
        border: '#fecaca',
        chipBg: '#fee2e2',
        chipColor: '#991b1b',
        chipBorder: '#fca5a5',
      }

  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: defectTone.bg,
      border: '1px solid',
      borderColor: defectTone.border,
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.4 }}>
          {item.description}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onResponder(sectionCode, subsectionCode, item.code, isSelected ? '' : displayType, initialResponse == null)}
          title={`Seleccionar tipo ${displayType}`}
          aria-pressed={isSelected}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 28, height: 28, padding: '0 12px', borderRadius: 999, cursor: 'pointer',
            border: `1.5px solid ${isSelected ? (displayType === 'B' ? '#f59e0b' : '#dc2626') : '#16a34a'}`,
            background: isSelected ? (displayType === 'B' ? '#fef3c7' : '#fee2e2') : '#dcfce7',
            color: isSelected ? (displayType === 'B' ? '#92400e' : '#991b1b') : '#166534',
            fontWeight: 700,
            fontSize: '0.76rem',
            lineHeight: 1,
            boxShadow: isSelected ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
          }}
        >
          {displayType}
        </button>

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
            title={isNativePlatform() ? 'Tomar foto con la cámara del dispositivo' : 'Tomar foto con la cámara del navegador'}
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

      {mostrarCamaraWeb && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, 0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            width: 'min(92vw, 760px)', background: '#fff', borderRadius: 16,
            overflow: 'hidden', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.35)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <strong style={{ color: '#0f172a' }}>Tomar foto con la cámara</strong>
              <button type="button" onClick={cerrarCamaraWeb} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#64748b' }}>
                ×
              </button>
            </div>
            <div style={{ background: '#0f172a' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', maxHeight: '65vh', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 16 }}>
              <button type="button" onClick={cerrarCamaraWeb} style={{ padding: '10px 16px' }}>
                Cancelar
              </button>
              <button type="button" onClick={capturarFotoWeb} style={{ padding: '10px 16px', background: '#155DFC', color: '#fff', border: 'none', borderRadius: 8 }}>
                Capturar foto
              </button>
            </div>
          </div>
        </div>
      )}

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
