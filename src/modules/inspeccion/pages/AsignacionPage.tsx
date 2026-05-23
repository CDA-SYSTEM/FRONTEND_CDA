import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ClipboardList,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { checklistService } from '@/modules/inspeccion/services/checklistService'
import { Toast } from '@/shared/components/Toast'
import type { ChecklistInspection, LabradoRecord } from '@/modules/inspeccion/domain/checklist.types'
import type { UserRole } from '@/modules/auth/domain/auth.types'

type Tab = 'inspecciones' | 'labrado'

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

function infoVehiculo(insp: ChecklistInspection): string {
  return insp.plate || `Vehículo ${insp.vehicle_id || '—'}`
}

function estadoBadge(insp: ChecklistInspection) {
  const estado = insp.status?.toUpperCase() || 'PENDIENTE'
  if (estado.includes('CERR')) {
    return { label: 'Cerrada', bg: '#dcfce7', color: '#166534' }
  }
  if (estado.includes('PROGRES')) {
    return { label: 'En progreso', bg: '#dbeafe', color: '#1d4ed8' }
  }
  if (estado.includes('BORR')) {
    return { label: 'Borrador', bg: '#fef3c7', color: '#92400e' }
  }
  return { label: 'Pendiente', bg: '#fef9c3', color: '#854d0e' }
}

function resultadoBadge(resultado?: string) {
  const value = (resultado || '').toUpperCase()
  if (value === 'APROBADO') return { label: 'Aprobado', bg: '#dcfce7', color: '#166534' }
  if (value === 'RECHAZADO' || value === 'REPROBADO') return { label: 'Rechazado', bg: '#fee2e2', color: '#991b1b' }
  return { label: 'Sin cierre', bg: '#f8fafc', color: '#64748b' }
}

function normalizarPlacaFiltro(value: string): string | undefined {
  const plate = value.trim().toUpperCase()
  if (!plate) return undefined
  if (plate.length > 10) return undefined
  if (!/^[A-Z0-9-]+$/.test(plate)) return undefined
  return plate
}

function nombreInspector(insp: ChecklistInspection): string {
  return insp.inspector_id || '—'
}

function renderLabrado(record: LabradoRecord | null) {
  if (!record) {
    return (
      <article className="panel" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <Wrench size={48} color="#94a3b8" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#374151', marginBottom: 8 }}>Sin medidas de labrado</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          No hay registro de labrado para esta inspección.
        </p>
      </article>
    )
  }

  return (
    <article className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wrench size={20} color="#155DFC" />
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Labrado de la inspección</h3>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.9rem' }}>ID inspección: {record.inspection_id}</p>
        </div>
      </div>

      {record.axles?.length ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {record.axles.map((axle) => (
            <div key={axle.axle_code} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 10 }}>{axle.axle_code}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {axle.wheels.map((wheel) => (
                  <div key={wheel.wheel_code} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8 }}>{wheel.wheel_code}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {wheel.tires.map((tire) => (
                        <div key={tire.tire_code} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 10, fontSize: '0.9rem', color: '#475569' }}>
                          <div><strong>{tire.tire_code}</strong></div>
                          <div>Exterior: {tire.outer_mm}</div>
                          <div>Centro: {tire.middle_mm}</div>
                          <div>Interior: {tire.inner_mm}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#64748b', margin: 0 }}>El backend no devolvió ejes/ruedas/llantas para este registro.</p>
      )}
    </article>
  )
}

export function AsignacionPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('inspecciones')
  const [inspecciones, setInspecciones] = useState<ChecklistInspection[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null)

  const [plateFiltro, setPlateFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [vehicleIdFiltro, setVehicleIdFiltro] = useState('')
  const [inspectionIdFiltro, setInspectionIdFiltro] = useState('')
  const [pageActual, setPageActual] = useState(1)
  const [tamanoPagina] = useState(20)

  const [selectedInspectionId, setSelectedInspectionId] = useState('')
  const [labrado, setLabrado] = useState<LabradoRecord | null>(null)
  const [cargandoLabrado, setCargandoLabrado] = useState(false)
  const [errorLabrado, setErrorLabrado] = useState<string | null>(null)

  const tieneAcceso = ROLES_PERMITIDOS.includes(user?.role ?? ('' as UserRole))

  const selectedInspection = useMemo(
    () => inspecciones.find((i) => i.id === selectedInspectionId) ?? null,
    [inspecciones, selectedInspectionId],
  )

  const cargarInspecciones = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const inspectionId = inspectionIdFiltro.trim()
      if (inspectionId) {
        const detalle = await checklistService.obtenerInspeccion(inspectionId)
        setInspecciones(detalle ? [detalle] : [])
        setSelectedInspectionId(detalle?.id ?? '')
        return
      }

      const resultados = await checklistService.listarInspecciones({
        page: pageActual,
        page_size: tamanoPagina,
        plate: normalizarPlacaFiltro(plateFiltro),
        status: statusFiltro.trim() || undefined,
        vehicle_id: vehicleIdFiltro.trim() ? Number(vehicleIdFiltro) : undefined,
      })
      const ordenadas = [...resultados].sort((a, b) => {
        const fechaA = new Date(a.created_at || a.inspection_datetime || '').getTime() || 0
        const fechaB = new Date(b.created_at || b.inspection_datetime || '').getTime() || 0
        return fechaB - fechaA
      })
      setInspecciones(ordenadas)
      if (resultados.length > 0 && !selectedInspectionId) {
        setSelectedInspectionId(ordenadas[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar checklist-inspections')
    } finally {
      setCargando(false)
    }
  }, [pageActual, tamanoPagina, plateFiltro, statusFiltro, vehicleIdFiltro, inspectionIdFiltro, selectedInspectionId])

  const cargarLabrado = useCallback(async (inspectionId: string) => {
    if (!inspectionId) {
      setLabrado(null)
      setErrorLabrado(null)
      return
    }
    setCargandoLabrado(true)
    setErrorLabrado(null)
    try {
      const record = await checklistService.obtenerLabradoPorInspeccion(inspectionId)
      setLabrado(record)
      if (!record) {
        setErrorLabrado('No se encontró labrado para esta inspección.')
      }
    } catch (err) {
      setLabrado(null)
      setErrorLabrado(err instanceof Error ? err.message : 'No se pudo cargar el labrado')
    } finally {
      setCargandoLabrado(false)
    }
  }, [])

  useEffect(() => {
    cargarInspecciones()
  }, [cargarInspecciones])

  useEffect(() => {
    if (tab === 'labrado' && selectedInspectionId) {
      cargarLabrado(selectedInspectionId)
    }
  }, [tab, selectedInspectionId, cargarLabrado])

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

  const limpiarFiltros = () => {
    setPlateFiltro('')
    setStatusFiltro('')
    setVehicleIdFiltro('')
    setInspectionIdFiltro('')
    setPageActual(1)
  }

  const onBuscar = async () => {
    await cargarInspecciones()
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
            Checklist y Labrado
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Consulte inspecciones reales del backend y el labrado asociado a cada una.
          </p>
        </div>
        <button
          onClick={onBuscar}
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

      <div className="panel" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto auto', gap: 12, alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>ID de inspección</span>
            <input autoComplete="off" spellCheck={false} name="inspectionIdFiltro" value={inspectionIdFiltro} onChange={(e) => setInspectionIdFiltro(e.target.value)} placeholder="6a11dda1fae01e695e137789" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Placa</span>
            <input autoComplete="off" spellCheck={false} autoCapitalize="characters" name="plateFiltro" value={plateFiltro} onChange={(e) => setPlateFiltro(e.target.value.toUpperCase())} placeholder="ABC123" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Estado</span>
            <select autoComplete="off" name="statusFiltro" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN PROGRESO">En progreso</option>
              <option value="BORRADOR">Borrador</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Vehículo ID</span>
            <input autoComplete="off" spellCheck={false} name="vehicleIdFiltro" value={vehicleIdFiltro} onChange={(e) => setVehicleIdFiltro(e.target.value)} placeholder="1" />
          </label>
          <button onClick={limpiarFiltros} style={{ height: 42, padding: '0 14px' }}>
            <Filter size={16} />
            Limpiar
          </button>
          <button onClick={onBuscar} style={{ height: 42, padding: '0 14px' }}>
            <Search size={16} />
            Buscar
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setTab('inspecciones')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: tab === 'inspecciones' ? '2px solid #155DFC' : '2px solid transparent',
            background: tab === 'inspecciones' ? '#eff6ff' : '#fff',
            color: tab === 'inspecciones' ? '#155DFC' : '#64748b',
            fontWeight: tab === 'inspecciones' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <ClipboardList size={18} />
          Inspecciones
          <span style={{ background: '#155DFC', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, marginLeft: 4 }}>
            {inspecciones.length}
          </span>
        </button>
        <button
          onClick={() => {
            setTab('labrado')
            if (selectedInspectionId) cargarLabrado(selectedInspectionId)
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: tab === 'labrado' ? '2px solid #155DFC' : '2px solid transparent',
            background: tab === 'labrado' ? '#eff6ff' : '#fff',
            color: tab === 'labrado' ? '#155DFC' : '#64748b',
            fontWeight: tab === 'labrado' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Wrench size={18} />
          Labrado
        </button>
      </div>

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

      {tab === 'inspecciones' ? (
        cargando ? (
          <article className="panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
          </article>
        ) : inspecciones.length === 0 ? (
          <article className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <CheckCircle size={48} color="#16a34a" strokeWidth={1.5} style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#374151', marginBottom: 8 }}>No hay checklist-inspections</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              El backend no devolvió registros para esta página y estos filtros.
            </p>
          </article>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {inspecciones.map((insp) => {
              const estado = estadoBadge(insp)
              const resultado = resultadoBadge(insp.general_result)
              return (
                <article
                  key={insp.id}
                  className="panel"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1fr 1fr auto',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={20} color="#155DFC" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{infoVehiculo(insp)}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {insp.id} {insp.inspection_number ? `· ${insp.inspection_number}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 6, fontSize: '0.86rem', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} />
                      {formatearFecha(insp.inspection_datetime || insp.created_at || insp.updated_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={14} />
                      Inspector: {nombreInspector(insp)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', padding: '6px 12px', borderRadius: 999, background: estado.bg, color: estado.color, fontWeight: 600, fontSize: '0.82rem' }}>
                      {estado.label}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', padding: '6px 12px', borderRadius: 999, background: resultado.bg, color: resultado.color, fontWeight: 600, fontSize: '0.82rem' }}>
                      {resultado.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifySelf: 'end' }}>
                    <button
                      onClick={() => {
                        if (!insp.id) {
                          setToast({ tipo: 'error', mensaje: 'La inspección no tiene un identificador válido para editar.' })
                          return
                        }
                        navigate(`/inspeccion/checklist/${insp.id}`)
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <ClipboardList size={14} />
                      Actualizar inspección
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInspectionId(insp.id)
                        setTab('labrado')
                        cargarLabrado(insp.id)
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#155DFC', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <Wrench size={14} />
                      Ver labrado
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="panel" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Inspección seleccionada</span>
                <select value={selectedInspectionId} onChange={(e) => setSelectedInspectionId(e.target.value)}>
                  <option value="">Seleccione una inspección</option>
                  {inspecciones.map((insp) => (
                    <option key={insp.id} value={insp.id}>
                      {insp.plate || insp.inspection_number || insp.id}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => selectedInspectionId && cargarLabrado(selectedInspectionId)}
                disabled={!selectedInspectionId || cargandoLabrado}
                style={{ height: 42, padding: '0 14px' }}
              >
                {cargandoLabrado ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                Cargar labrado
              </button>
            </div>
            {selectedInspection && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: '#475569', fontSize: '0.9rem' }}>
                <span><strong>Placa:</strong> {selectedInspection.plate || '—'}</span>
                <span><strong>Estado:</strong> {selectedInspection.status || '—'}</span>
                <span><strong>Resultado:</strong> {selectedInspection.general_result || '—'}</span>
                <span><strong>Vehicle ID:</strong> {selectedInspection.vehicle_id || '—'}</span>
              </div>
            )}
          </div>

          {cargandoLabrado ? (
            <article className="panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
            </article>
          ) : errorLabrado ? (
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
              <span>{errorLabrado}</span>
            </div>
          ) : (
            renderLabrado(labrado)
          )}
        </div>
      )}
    </div>
  )
}
