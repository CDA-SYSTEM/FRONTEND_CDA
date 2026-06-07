import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Bike,
  Calendar,
  Car,
  CheckCircle,
  ClipboardList,
  Eye,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Truck,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { Modal } from '@/core/components/Modal'
import { checklistService } from '@/modules/inspeccion/services/checklistService'
import { Toast } from '@/shared/components/Toast'
import { CustomSelect } from '@/shared/components/CustomSelect'
import type { AxleMeasurement, ChecklistInspection, LabradoRecord, VehicleType } from '@/modules/inspeccion/domain/checklist.types'
import { LabradoWizard, ChassisGrid, buildAxlesForType, getLayout, inferirConfig, mergeIntoLayout } from '@/modules/inspeccion/components/LabradoWizard'
import type { UserRole } from '@/modules/auth/domain/auth.types'
import './AsignacionPage.css'

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

function tipoBadge(tipo: VehicleType) {
  const map: Record<VehicleType, { label: string; bg: string; color: string }> = {
    MOTO: { label: 'Moto', bg: '#fef3c7', color: '#92400e' },
    LIVIANO: { label: 'Liviano', bg: '#dbeafe', color: '#1d4ed8' },
    PESADO: { label: 'Pesado', bg: '#fee2e2', color: '#991b1b' },
  }
  return map[tipo] || { label: tipo, bg: '#f1f5f9', color: '#475569' }
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

function LabradoView({ record }: { record: LabradoRecord | null }) {
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

  const type = inferirConfig(record.axles ?? []) ?? 'PESADO_5'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wrench size={20} color="#155DFC" />
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem' }}>Labrado de la inspección</h3>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.85rem' }}>ID: {record.inspection_id}</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: '#ecfeff', color: '#0f766e', fontSize: '0.8rem', fontWeight: 600, marginLeft: 'auto' }}>
          Medido: {record.measured_at ? formatearFecha(record.measured_at) : '—'}
        </span>
      </div>

      {record.axles?.length ? (
        <ChassisGrid type={type} axles={record.axles} mode="view" onChange={() => {}} />
      ) : (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
          El backend devolvió el labrado, pero no incluyó ejes/ruedas/llantas para mostrar.
        </div>
      )}
    </div>
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
  const [filtroTipo, setFiltroTipo] = useState<VehicleType | ''>('')
  const [pageActual, setPageActual] = useState(1)
  const [tamanoPagina] = useState(20)

  const [selectedInspectionId, setSelectedInspectionId] = useState('')
  const [labrado, setLabrado] = useState<LabradoRecord | null>(null)
  const [labradoDraft, setLabradoDraft] = useState<AxleMeasurement[]>([])
  const [editandoLabrado, setEditandoLabrado] = useState(false)
  const [guardandoLabrado, setGuardandoLabrado] = useState(false)
  const [errorEditorLabrado, setErrorEditorLabrado] = useState<string | null>(null)
  const [cargandoLabrado, setCargandoLabrado] = useState(false)
  const [errorLabrado, setErrorLabrado] = useState<string | null>(null)
  const labradoRequestSeq = useRef(0)

  const tieneAcceso = ROLES_PERMITIDOS.includes(user?.role ?? ('' as UserRole))

  const selectedInspection = useMemo(
    () => inspecciones.find((i) => i.id === selectedInspectionId) ?? null,
    [inspecciones, selectedInspectionId],
  )

  const inspeccionesFiltradas = useMemo(
    () => (filtroTipo ? inspecciones.filter((i) => i.vehicle_type === filtroTipo) : inspecciones),
    [inspecciones, filtroTipo],
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

    const requestSeq = ++labradoRequestSeq.current
    setCargandoLabrado(true)
    setErrorLabrado(null)
    try {
      const record = await checklistService.obtenerLabradoPorInspeccion(inspectionId)
      if (requestSeq !== labradoRequestSeq.current) return
      setLabrado(record)
      if (!record) {
        setErrorLabrado('No se encontró labrado para esta inspección.')
      } else if (!record.axles?.length) {
        setErrorLabrado('El backend devolvió el labrado, pero no incluyó ejes/ruedas/llantas para mostrar.')
      }
    } catch (err) {
      if (requestSeq !== labradoRequestSeq.current) return
      setLabrado(null)
      setErrorLabrado(err instanceof Error ? err.message : 'No se pudo cargar el labrado')
    } finally {
      if (requestSeq !== labradoRequestSeq.current) return
      setCargandoLabrado(false)
    }
  }, [])

  const abrirEditorLabrado = useCallback(() => {
    if (!selectedInspectionId) {
      setToast({ tipo: 'error', mensaje: 'Seleccione una inspección antes de editar el labrado.' })
      return
    }
    const inferredType = inferirConfig(labrado?.axles ?? []) ?? 'PESADO_5'
    const data = labrado?.axles?.length ? mergeIntoLayout(labrado.axles, getLayout(inferredType)) : buildAxlesForType(inferredType)
    setLabradoDraft(data)
    setErrorEditorLabrado(null)
    setEditandoLabrado(true)
  }, [labrado, selectedInspectionId])

  const guardarLabrado = useCallback(async () => {
    if (!selectedInspectionId) return
    setGuardandoLabrado(true)
    setErrorEditorLabrado(null)
    try {
      const actualizado = await checklistService.actualizarLabradoPorInspeccion(selectedInspectionId, {
        axles: labradoDraft,
      })
      if (!actualizado) {
        setErrorEditorLabrado('No se pudo actualizar el labrado.')
        return
      }
      setLabrado(actualizado)
      setEditandoLabrado(false)
      setToast({ tipo: 'exito', mensaje: 'Labrado actualizado correctamente.' })
    } catch (err) {
      setErrorEditorLabrado(err instanceof Error ? err.message : 'No se pudo guardar el labrado.')
    } finally {
      setGuardandoLabrado(false)
    }
  }, [labradoDraft, selectedInspectionId])

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
    setFiltroTipo('')
    setPageActual(1)
  }

  const onBuscar = async () => {
    await cargarInspecciones()
  }

  return (
    <div className="as-root">
      {toast && (
        <Toast
          tipo={toast.tipo}
          mensaje={toast.mensaje}
          onCerrar={() => setToast(null)}
        />
      )}

      <div className="page-header-responsive">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
            Checklist y Labrado
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Consulte inspecciones reales del backend y el labrado asociado a cada una.
          </p>
        </div>
        <div className="page-header-responsive-actions">
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
      </div>

      <div className="as-filters-panel" style={{ position: 'relative', zIndex: 10 }}>
        <div className="as-filters-grid">
          <label className="as-field-label">
            <span className="as-label-text">ID de inspección</span>
            <input className="as-input" autoComplete="off" spellCheck={false} name="inspectionIdFiltro" value={inspectionIdFiltro} onChange={(e) => setInspectionIdFiltro(e.target.value)} placeholder="6a11dda1fae01e695e137789" />
          </label>
          <label className="as-field-label">
            <span className="as-label-text">Placa</span>
            <input className="as-input" autoComplete="off" spellCheck={false} autoCapitalize="characters" name="plateFiltro" value={plateFiltro} onChange={(e) => setPlateFiltro(e.target.value.toUpperCase())} placeholder="ABC123" />
          </label>
          <label className="as-field-label">
            <span className="as-label-text">Estado</span>
            <CustomSelect
              options={[
                { value: '', label: 'Todos' },
                { value: 'PENDIENTE', label: 'Pendiente' },
                { value: 'EN PROGRESO', label: 'En progreso' },
                { value: 'BORRADOR', label: 'Borrador' },
                { value: 'CERRADA', label: 'Cerrada' },
              ]}
              value={statusFiltro}
              onChange={(val) => setStatusFiltro(val)}
              placeholder="Todos"
            />
          </label>
          <label className="as-field-label">
            <span className="as-label-text">Vehículo ID</span>
            <input className="as-input" autoComplete="off" spellCheck={false} name="vehicleIdFiltro" value={vehicleIdFiltro} onChange={(e) => setVehicleIdFiltro(e.target.value)} placeholder="1" />
          </label>
          <button onClick={limpiarFiltros} className="as-btn-filter-clear">
            <Filter size={16} />
            Limpiar
          </button>
          <button onClick={onBuscar} className="as-btn-filter-search">
            <Search size={16} />
            Buscar
          </button>
        </div>
      </div>

      <div className="as-type-panel">
        <span className="as-type-label">Filtrar por tipo:</span>
        <div className="as-filter-tabs">
          {(['', 'MOTO', 'LIVIANO', 'PESADO'] as const).map((t) => {
            const label = t === '' ? 'Todos' : t === 'MOTO' ? 'Motos' : t === 'LIVIANO' ? 'Livianos' : 'Pesados'
            const icon = t === '' ? <Layers size={16} /> : t === 'MOTO' ? <Bike size={16} /> : t === 'LIVIANO' ? <Car size={16} /> : <Truck size={16} />
            const isActive = filtroTipo === t
            return (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`as-filter-tab ${isActive ? 'as-filter-tab--active' : ''}`}
              >
                {icon}
                {label}
                {t !== '' && (
                  <span className="as-tab-badge">
                    {inspecciones.filter((i) => i.vehicle_type === t).length}
                  </span>
                )}
              </button>
            )
          })}
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
            {inspeccionesFiltradas.length}
          </span>
        </button>
        <button
          onClick={() => setTab('labrado')}
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
        ) : inspeccionesFiltradas.length === 0 ? (
          <article className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <CheckCircle size={48} color="#16a34a" strokeWidth={1.5} style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#374151', marginBottom: 8 }}>
              {filtroTipo ? `No hay inspecciones de tipo ${filtroTipo.toLowerCase()}` : 'No hay checklist-inspections'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              {filtroTipo ? 'No hay registros para el tipo de vehículo seleccionado.' : 'El backend no devolvió registros para esta página y estos filtros.'}
            </p>
          </article>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {inspeccionesFiltradas.map((insp) => {
              const estado = estadoBadge(insp)
              const resultado = resultadoBadge(insp.general_result)
              return (
                <article
                  key={insp.id}
                  className="as-inspection-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={20} color="#155DFC" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="as-id-title">{infoVehiculo(insp)}</span>
                          {(() => {
                            const tb = tipoBadge(insp.vehicle_type)
                            const badgeClass = insp.vehicle_type === 'MOTO' ? 'as-badge--borrador' : insp.vehicle_type === 'LIVIANO' ? 'as-badge--progreso' : 'as-badge--rechazado'
                            return <span className={`as-badge ${badgeClass}`}>{tb.label}</span>
                          })()}
                        </div>
                        <div className="as-mono" style={{ fontSize: '0.82rem' }}>
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
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        Inspector: <span className="as-mono">{nombreInspector(insp)}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className={`as-badge ${
                      estado.label === 'Borrador' ? 'as-badge--borrador' :
                      estado.label === 'Pendiente' ? 'as-badge--pendiente' :
                      estado.label === 'En progreso' ? 'as-badge--progreso' : 'as-badge--cerrada'
                    }`} style={{ width: 'fit-content' }}>
                      {estado.label}
                    </span>
                    <span className={`as-badge ${
                      resultado.label === 'Aprobado' ? 'as-badge--aprobado' :
                      resultado.label === 'Rechazado' ? 'as-badge--rechazado' : 'as-badge--sin-cierre'
                    }`} style={{ width: 'fit-content' }}>
                      {resultado.label}
                    </span>
                  </div>

                  <div className="as-inspection-card-actions">
                    <button
                      onClick={() => {
                        if (!insp.id) {
                          setToast({ tipo: 'error', mensaje: 'La inspección no tiene un identificador válido para editar.' })
                          return
                        }
                        const tipo = (insp.vehicle_type || 'LIVIANO').toLowerCase()
                        navigate(`/inspeccion/checklist/${tipo}/${insp.id}`)
                      }}
                      className="as-btn-action as-btn-action--dark"
                    >
                      <ClipboardList size={14} />
                      Actualizar inspección
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInspectionId(insp.id)
                        setTab('labrado')
                      }}
                      className="as-btn-action as-btn-action--primary"
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
            <div className="labrado-filter-grid">
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Inspección seleccionada</span>
                <CustomSelect
                  options={[
                    { value: '', label: 'Seleccione una inspección' },
                    ...inspecciones.map((insp) => ({
                      value: insp.id,
                      label: insp.plate || insp.inspection_number || insp.id,
                    }))
                  ]}
                  value={selectedInspectionId}
                  onChange={(val) => setSelectedInspectionId(val)}
                  placeholder="Seleccione una inspección"
                />
              </label>
              <button
                onClick={() => selectedInspectionId && cargarLabrado(selectedInspectionId)}
                disabled={!selectedInspectionId || cargandoLabrado}
                style={{ height: 42, padding: '0 14px' }}
              >
                {cargandoLabrado ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                Cargar labrado
              </button>
              <button
                onClick={abrirEditorLabrado}
                disabled={!selectedInspectionId || cargandoLabrado}
                style={{ height: 42, padding: '0 14px' }}
              >
                Editar labrado
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
            <LabradoView record={labrado} />
          )}
        </div>
      )}

      <Modal
        isOpen={editandoLabrado}
        onClose={() => {
          if (!guardandoLabrado) setEditandoLabrado(false)
        }}
        title="Editar labrado"
        maxWidth="1100px"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {errorEditorLabrado && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b' }}>
              <AlertCircle size={16} />
              <span>{errorEditorLabrado}</span>
            </div>
          )}

          <LabradoWizard
            axles={labradoDraft}
            onChange={setLabradoDraft}
            onSave={guardarLabrado}
            saving={guardandoLabrado}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={() => setEditandoLabrado(false)} disabled={guardandoLabrado} style={{ padding: '10px 16px' }}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
