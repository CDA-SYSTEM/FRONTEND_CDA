import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  UserCheck,
  UserPlus,
  Wrench,
} from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import { Toast } from '@/shared/components/Toast'
import type { InspectionSummary } from '@/modules/inspeccion/domain/inspeccion.types'
import type { UserRole } from '@/modules/auth/domain/auth.types'

type Tab = 'pendientes' | 'mis-asignaciones'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'INSPECTOR']

function formatearFecha(fecha?: string) {
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

function infoVehiculo(insp: InspectionSummary): string {
  if ('vehicle' in insp) {
    const v = (insp as Record<string, unknown>).vehicle as
      | { placa?: string; marca?: string; linea?: string; modelo?: string }
      | undefined
    if (v) {
      return `${v.placa || '?'} — ${v.marca || ''} ${v.linea || ''}`.trim().replace(/—\s*$/, '') || v.placa || '?'
    }
  }
  return insp.vehicle_id || '?'
}

function nombreCliente(insp: InspectionSummary): string {
  if ('client' in insp) {
    const c = (insp as Record<string, unknown>).client as
      | { nombre?: string; apellido?: string; identity?: string }
      | undefined
    if (c) return `${c.nombre || ''} ${c.apellido || ''}`.trim() || c.identity || '—'
  }
  return insp.client_id || '—'
}

export function AsignacionPage() {
  const user = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<Tab>('pendientes')
  const [todas, setTodas] = useState<InspectionSummary[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asignandoId, setAsignandoId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null)

  const userId = user?.id
  const esInspector = user?.role === 'INSPECTOR'
  const esAdmin = user?.role === 'ADMIN'
  const puedeAsignarse = esInspector
  const tieneAcceso = ROLES_PERMITIDOS.includes(user?.role ?? ('' as UserRole))

  const pendientes = todas.filter((i) => !i.operator_id && (!i.result || i.result === 'SIN_RESULTADO'))
  const misAsignaciones = todas.filter(
    (i) => i.operator_id === userId && (!i.result || i.result === 'SIN_RESULTADO'),
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await inspeccionService.listarTodas(1, 50)
      setTodas(resultado)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inspecciones')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const handleAsignarse = async (inspectionId: string) => {
    if (!userId || !esInspector) return
    setAsignandoId(inspectionId)
    setError(null)
    try {
      await inspeccionService.asignarInspector(inspectionId, userId)
      setTodas((prev) =>
        prev.map((i) =>
          i.id === inspectionId ? { ...i, operator_id: userId } : i,
        ),
      )
      setToast({ tipo: 'exito', mensaje: 'Te has asignado la orden exitosamente' })
      setTab('mis-asignaciones')
    } catch {
      setToast({ tipo: 'error', mensaje: 'No se pudo asignar la inspección. Intente de nuevo.' })
    } finally {
      setAsignandoId(null)
    }
  }

  if (!tieneAcceso) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <Eye size={48} color="#dc2626" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>Acceso denegado</h3>
        <p style={{ color: '#6b7280' }}>
          Solo los usuarios con rol de Inspector o Administrador pueden acceder a esta sección.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && (
        <Toast
          tipo={toast.tipo}
          mensaje={toast.mensaje}
          onCerrar={() => setToast(null)}
        />
      )}

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
            Asignación de Órdenes
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            {esInspector
              ? 'Seleccione una orden de servicio pendiente para asignarse'
              : 'Visualización de órdenes de servicio'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {esAdmin && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#fefce8',
                border: '1px solid #fde68a',
                color: '#854d0e',
                fontSize: '0.8rem',
              }}
            >
              <Eye size={14} />
              Solo lectura
            </div>
          )}
          <button
            onClick={cargar}
            disabled={cargando}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              padding: '0 16px',
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          >
            <RefreshCw size={16} className={cargando ? 'spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setTab('pendientes')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: tab === 'pendientes' ? '2px solid #155DFC' : '2px solid transparent',
            background: tab === 'pendientes' ? '#eff6ff' : '#fff',
            color: tab === 'pendientes' ? '#155DFC' : '#64748b',
            fontWeight: tab === 'pendientes' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Clock size={18} />
          Pendientes
          {pendientes.length > 0 && (
            <span
              style={{
                background: '#155DFC',
                color: '#fff',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginLeft: 4,
              }}
            >
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('mis-asignaciones')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: tab === 'mis-asignaciones' ? '2px solid #155DFC' : '2px solid transparent',
            background: tab === 'mis-asignaciones' ? '#eff6ff' : '#fff',
            color: tab === 'mis-asignaciones' ? '#155DFC' : '#64748b',
            fontWeight: tab === 'mis-asignaciones' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <UserCheck size={18} />
          Mis Asignaciones
          {misAsignaciones.length > 0 && (
            <span
              style={{
                background: '#16a34a',
                color: '#fff',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginLeft: 4,
              }}
            >
              {misAsignaciones.length}
            </span>
          )}
        </button>
      </div>

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

      {/* Contenido */}
      {cargando ? (
        <article
          className="panel"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem',
          }}
        >
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
        </article>
      ) : tab === 'pendientes' ? (
        <ContenidoPendientes
          pendientes={pendientes}
          asignandoId={asignandoId}
          puedeAsignarse={puedeAsignarse}
          onAsignarse={handleAsignarse}
        />
      ) : (
        <ContenidoMisAsignaciones
          asignaciones={misAsignaciones}
          onRefresh={cargar}
        />
      )}
    </div>
  )
}

function ContenidoPendientes({
  pendientes,
  asignandoId,
  puedeAsignarse,
  onAsignarse,
}: {
  pendientes: InspectionSummary[]
  asignandoId: string | null
  puedeAsignarse: boolean
  onAsignarse: (id: string) => void
}) {
  if (pendientes.length === 0) {
    return (
      <article className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <CheckCircle size={48} color="#16a34a" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>No hay órdenes pendientes</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Todas las órdenes de servicio tienen un inspector asignado.
        </p>
      </article>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pendientes.map((insp) => (
        <article
          key={insp.id}
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 200 }}>
            <Car size={24} color="#155DFC" />
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.05rem' }}>
                {infoVehiculo(insp)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                {insp.inspection_number ? `#${insp.inspection_number}` : `ID: ${insp.id.slice(0, 8)}`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
              flex: 2,
              minWidth: 280,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
              <UserCheck size={14} />
              {nombreCliente(insp)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
              <Calendar size={14} />
              {formatearFecha(insp.createdAt)}
            </div>

            {insp.revision_type && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
                <Wrench size={14} />
                {insp.revision_type.replace(/_/g, ' ')}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
              <Clock size={14} />
              {insp.mileage ? `${insp.mileage} km` : '—'}
            </div>
          </div>

          {puedeAsignarse ? (
            <button
              onClick={() => onAsignarse(insp.id)}
              disabled={asignandoId === insp.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                background: asignandoId === insp.id ? '#93c5fd' : '#155DFC',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: asignandoId === insp.id ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 140,
                justifyContent: 'center',
              }}
            >
              {asignandoId === insp.id ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <UserPlus size={16} />
              )}
              {asignandoId === insp.id ? 'Asignando...' : 'Asignarme'}
            </button>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                background: '#fefce8',
                color: '#a16207',
                fontWeight: 500,
                fontSize: '0.85rem',
              }}
            >
              <Clock size={14} />
              Pendiente
            </span>
          )}
        </article>
      ))}
    </div>
  )
}

function ContenidoMisAsignaciones({
  asignaciones,
  onRefresh,
}: {
  asignaciones: InspectionSummary[]
  onRefresh: () => void
}) {
  const navigate = useNavigate()
  if (asignaciones.length === 0) {
    return (
      <article className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <UserCheck size={48} color="#94a3b8" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>Sin asignaciones activas</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          No tiene órdenes de servicio asignadas actualmente.
        </p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </article>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {asignaciones.map((insp) => (
        <article
          key={insp.id}
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            borderLeft: '4px solid #155DFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 200 }}>
            <Car size={24} color="#155DFC" />
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.05rem' }}>
                {infoVehiculo(insp)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                {insp.inspection_number
                  ? `Orden #${insp.inspection_number}`
                  : `ID: ${insp.id.slice(0, 8)}`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
              flex: 2,
              minWidth: 280,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
              <UserCheck size={14} />
              {nombreCliente(insp)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
              <Calendar size={14} />
              {formatearFecha(insp.createdAt)}
            </div>

            {insp.revision_type && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#475569' }}>
                <Wrench size={14} />
                {insp.revision_type.replace(/_/g, ' ')}
              </div>
            )}
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 999,
              background: '#dbeafe',
              color: '#1d4ed8',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <CheckCircle size={14} />
            Asignado
          </span>

          <button
            onClick={() => navigate(`/inspeccion/checklist/${insp.id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#155DFC',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            <ClipboardList size={14} />
            Realizar Checklist
          </button>
        </article>
      ))}
    </div>
  )
}
