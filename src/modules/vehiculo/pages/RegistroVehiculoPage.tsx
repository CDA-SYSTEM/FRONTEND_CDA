import { useState, useEffect } from 'react'
import {
  AlertCircle,
  Bike,
  CheckCircle,
  Gauge,
  Loader2,
  Plus,
  Search,
  User,
  X,
  Truck,
  Trash2,
  Pencil,
  Eye,
} from 'lucide-react'
import { useRegistrarVehiculo } from '@/modules/vehiculo/hooks/useRegistrarVehiculo'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'
import { Modal } from '@/core/components/Modal'
import { CustomSelect } from '@/shared/components/CustomSelect'
import { vehiculoService } from '@/modules/vehiculo/services/vehiculoService'
import type { CatalogoItem } from '@/modules/vehiculo/domain/vehiculo.types'
import './VehiculosPage.css'

export function RegistroVehiculoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ── Estado del modal de edición de vehículo ───────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editVehiculo, setEditVehiculo] = useState<any>(null)
  const [editGuardando, setEditGuardando] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  // ── Estado del modal de detalles de vehículo ─────────────────────────────────
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailVehiculo, setDetailVehiculo] = useState<any>(null)

  const {
    form,
    estado,
    errorCatalogo,
    errorServidor,
    vehiculoGuardado,
    clienteSeleccionado,
    seleccionarCliente,
    limpiarCliente,
    resetFormulario,
    onSubmit,
    marcas,
    clases,
    lineas,
    colores,
    tiposVehiculo,
    tiposCombustible,
    tiposServicio,
    esMotocicleta,
    queryCliente,
    setQueryCliente,
    resultadosCliente,
    buscandoCliente,
    vehiculos,
    cargandoVehiculos,
    errorVehiculos,
    eliminarVehiculo,
    pagina,
    setPagina,
    limite,
    setLimite,
    totalElementos,
    totalPaginas,
    searchTerm,
    setSearchTerm,
  } = useRegistrarVehiculo()

  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form

  const enviando = estado === 'enviando'
  const tipoVehiculoId = watch('tipoVehiculoId')
  const tipoVehiculoActual = tiposVehiculo.find((t) => t.id === tipoVehiculoId)

  // ── Estados locales de catálogos (deben estar ANTES de cualquier early return) ──
  const [localMarcas, setLocalMarcas] = useState<CatalogoItem[]>([])
  const [localClases, setLocalClases] = useState<CatalogoItem[]>([])
  const [localLineas, setLocalLineas] = useState<CatalogoItem[]>([])
  const [localColores, setLocalColores] = useState<CatalogoItem[]>([])
  const [localCombustibles, setLocalCombustibles] = useState<CatalogoItem[]>([])
  const [localTiposVehiculo, setLocalTiposVehiculo] = useState<CatalogoItem[]>([])
  const [localTiposServicio, setLocalTiposServicio] = useState<CatalogoItem[]>([])

  const [creandoMarcaInline, setCreandoMarcaInline] = useState(false)
  const [creandoLineaInline, setCreandoLineaInline] = useState(false)
  const [creandoClaseInline, setCreandoClaseInline] = useState(false)
  const [creandoColorInline, setCreandoColorInline] = useState(false)
  const [creandoCombustibleInline, setCreandoCombustibleInline] = useState(false)
  const [creandoTipoVehiculoInline, setCreandoTipoVehiculoInline] = useState(false)
  const [creandoTipoServicioInline, setCreandoTipoServicioInline] = useState(false)

  const [editandoMarcaInline, setEditandoMarcaInline] = useState(false)
  const [editandoLineaInline, setEditandoLineaInline] = useState(false)
  const [editandoClaseInline, setEditandoClaseInline] = useState(false)
  const [editandoColorInline, setEditandoColorInline] = useState(false)
  const [editandoCombustibleInline, setEditandoCombustibleInline] = useState(false)
  const [editandoTipoVehiculoInline, setEditandoTipoVehiculoInline] = useState(false)
  const [editandoTipoServicioInline, setEditandoTipoServicioInline] = useState(false)

  const [nuevaMarcaNombre, setNuevaMarcaNombre] = useState('')
  const [nuevaLineaNombre, setNuevaLineaNombre] = useState('')
  const [nuevaClaseNombre, setNuevaClaseNombre] = useState('')
  const [nuevaColorNombre, setNuevaColorNombre] = useState('')
  const [nuevaCombustibleNombre, setNuevaCombustibleNombre] = useState('')
  const [nuevaTipoVehiculoNombre, setNuevaTipoVehiculoNombre] = useState('')
  const [nuevaTipoServicioNombre, setNuevaTipoServicioNombre] = useState('')

  const [guardandoCatalogo, setGuardandoCatalogo] = useState(false)

  // ── Sincronización de catálogos con datos del hook ──────────────────────────
  useEffect(() => {
    if (marcas.length > 0) setLocalMarcas(marcas)
  }, [marcas])
  useEffect(() => {
    if (clases.length > 0) setLocalClases(clases)
  }, [clases])
  useEffect(() => {
    if (lineas.length > 0) setLocalLineas(lineas)
  }, [lineas])
  useEffect(() => {
    if (colores.length > 0) setLocalColores(colores)
  }, [colores])
  useEffect(() => {
    if (tiposCombustible.length > 0) setLocalCombustibles(tiposCombustible)
  }, [tiposCombustible])
  useEffect(() => {
    if (tiposVehiculo.length > 0) setLocalTiposVehiculo(tiposVehiculo)
  }, [tiposVehiculo])
  useEffect(() => {
    if (tiposServicio.length > 0) setLocalTiposServicio(tiposServicio)
  }, [tiposServicio])

  // ── Filtrado de Vehículos en Cliente (Ahora se realiza en Backend) ───────────
  const vehiculosFiltrados = vehiculos

  const handleCloseModal = () => {
    resetFormulario()
    setIsModalOpen(false)
    setCreandoMarcaInline(false)
    setCreandoLineaInline(false)
    setCreandoClaseInline(false)
    setCreandoColorInline(false)
    setCreandoCombustibleInline(false)
    setCreandoTipoVehiculoInline(false)
    setCreandoTipoServicioInline(false)
    setEditandoMarcaInline(false)
    setEditandoLineaInline(false)
    setEditandoClaseInline(false)
    setEditandoColorInline(false)
    setEditandoCombustibleInline(false)
    setEditandoTipoVehiculoInline(false)
    setEditandoTipoServicioInline(false)
  }

  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#334155',
  } as const

  const inputStyle = {
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    padding: '10px 14px',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#fff',
  } as const

  const btnActionStyle = {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 6px',
  } as const

  const btnSaveStyle = {
    padding: '8px 12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  } as const

  const btnCancelStyle = {
    padding: '8px 12px',
    background: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  } as const

  // ── Cargando catálogos iniciales ────────────────────────────────────────────
  if (estado === 'cargando' && vehiculos.length === 0) {
    return (
      <article className="panel" style={{ textAlign: 'center', padding: 40 }}>
        <Loader2
          size={32}
          style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }}
        />
        <p style={{ marginTop: 12, color: '#6b7280' }}>
          Cargando datos de vehículos...
        </p>
      </article>
    )
  }

  // ── Error al cargar catálogos ──────────────────────────────────────────────
  if (errorCatalogo) {
    return (
      <article className="panel">
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
          <span>{errorCatalogo}</span>
        </div>
      </article>
    )
  }

  // ── Renderizado Principal ──────────────────────────────────────────────────
  return (
    <div className="vh-root">
      
      {/* Cabecera */}
      <div className="page-header-responsive">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="vh-page-icon">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="vh-page-title">Gestión de Vehículos</h1>
            <p className="vh-page-desc">
              Administración, búsqueda y registro de vehículos en el sistema
            </p>
          </div>
        </div>

        <div className="page-header-responsive-actions">
          <button
            onClick={() => {
              resetFormulario()
              setIsModalOpen(true)
            }}
            className="vh-btn-primary"
          >
            <Plus size={18} />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Buscador de vehículos */}
      <div className="vh-search-wrap">
        <span className="vh-search-icon"><Search size={18} /></span>
        <input
          type="text"
          className="vh-search-input"
          placeholder="Buscar por placa, modelo, marca, línea o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla / Lista de Vehículos */}
      <article className="vh-table-card">
        {cargandoVehiculos ? (
          <div className="vh-state">
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
          </div>
        ) : errorVehiculos ? (
          <div className="vh-state">
            <div className="vh-state-icon vh-state-icon--error"><AlertCircle size={24} /></div>
            <h3 className="vh-state-title">Error al cargar vehículos</h3>
            <p className="vh-state-desc">{errorVehiculos}</p>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="vh-state">
            <div className="vh-state-icon vh-state-icon--neutral"><Truck size={24} /></div>
            <h3 className="vh-state-title">No se encontraron vehículos</h3>
            <p className="vh-state-desc">
              {searchTerm.trim()
                ? 'Intente ajustar los términos de búsqueda'
                : 'Comience registrando el primer vehículo en el sistema'}
            </p>
            {!searchTerm.trim() && (
              <button onClick={() => setIsModalOpen(true)} className="vh-btn-primary">
                <Plus size={16} />
                Registrar Vehículo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="vh-table-scroll vehicles-table-desktop">
              <table className="vh-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Tipo</th>
                    <th>Marca / Línea</th>
                    <th>Modelo</th>
                    <th>Cliente</th>
                    <th>Certificado</th>
                    <th style={{ textAlign: 'center', width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculosFiltrados.map((v) => {
                    const marca = typeof v.marca === 'object' ? v.marca?.nombre : v.marca
                    const linea = typeof v.linea === 'object' ? v.linea?.nombre : v.linea
                    const tipo = typeof v.tipoVehiculo === 'object' ? v.tipoVehiculo?.nombre : v.tipoVehiculo

                    return (
                      <tr key={v.id}>
                        <td><span className="vh-placa-cell">{v.placa}</span></td>
                        <td>{tipo || '—'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{marca || '—'} {linea ? `/ ${linea}` : ''}</td>
                        <td>{v.modelo || '—'}</td>
                        <td>
                          {v.client ? (
                            <div>
                              <div className="vh-client-name">{v.client.nombre} {v.client.apellido}</div>
                              <div className="vh-client-id">{v.client.identity}</div>
                            </div>
                          ) : (
                            <span className="vh-client-id">ID: {v.clienteId}</span>
                          )}
                        </td>
                        <td><span className="vh-cert-cell">{v.certificadoNo || '—'}</span></td>
                        <td>
                          <div className="vh-actions-cell">
                            <button
                              onClick={() => {
                                const v2 = vehiculosFiltrados.find(x => x.id === v.id)
                                if (!v2) return
                                setDetailVehiculo(v2)
                                setDetailModalOpen(true)
                              }}
                              className="vh-action-btn vh-action-btn--view"
                              title="Ver Detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => {
                                const v2 = vehiculosFiltrados.find(x => x.id === v.id)
                                if (!v2) return
                                const marcaId = typeof v2.marca === 'object' ? String(v2.marca?.id ?? '') : ''
                                const lineaId = typeof v2.linea === 'object' ? String(v2.linea?.id ?? '') : ''
                                const claseId = typeof v2.clase === 'object' ? String((v2.clase as any)?.id ?? '') : ''
                                const colorId = typeof v2.color === 'object' ? String((v2.color as any)?.id ?? '') : ''
                                const tipoVehiculoId = typeof v2.tipoVehiculo === 'object' ? String(v2.tipoVehiculo?.id ?? '') : ''
                                const tipoCombustibleId = typeof v2.tipoCombustible === 'object' ? String((v2.tipoCombustible as any)?.id ?? '') : ''
                                const tipoServicioId = typeof v2.tipoServicio === 'object' ? String((v2.tipoServicio as any)?.id ?? '') : ''
                                setEditVehiculo(v2)
                                setEditForm({
                                  placa: v2.placa || '',
                                  modelo: v2.modelo || '',
                                  certificadoNo: v2.certificadoNo || '',
                                  cilindraje: v2.cilindraje || '',
                                  marcaId,
                                  lineaId,
                                  claseId,
                                  colorId,
                                  tipoVehiculoId,
                                  tipoCombustibleId,
                                  tipoServicioId,
                                })
                                setEditError(null)
                                setEditModalOpen(true)
                              }}
                              className="vh-action-btn vh-action-btn--edit"
                              title="Editar Vehículo"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => eliminarVehiculo(v.id)}
                              className="vh-action-btn vh-action-btn--delete"
                              title="Eliminar Vehículo"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="vehicles-cards-mobile">
              {vehiculosFiltrados.map((v) => {
                const marca = typeof v.marca === 'object' ? v.marca?.nombre : v.marca
                const linea = typeof v.linea === 'object' ? v.linea?.nombre : v.linea
                const tipo = typeof v.tipoVehiculo === 'object' ? v.tipoVehiculo?.nombre : v.tipoVehiculo

                return (
                  <div key={v.id} className="vehicle-card">
                    <div className="vehicle-card-header">
                      <span className="vehicle-card-plate">{v.placa}</span>
                      <span className="vehicle-card-type">{tipo || 'Vehículo'}</span>
                    </div>

                    <div className="vehicle-card-row">
                      <span className="vehicle-card-label">Marca / Línea:</span>
                      <span className="vehicle-card-value">{marca || '—'} {linea ? `/ ${linea}` : ''}</span>
                    </div>

                    <div className="vehicle-card-row">
                      <span className="vehicle-card-label">Modelo:</span>
                      <span className="vehicle-card-value">{v.modelo || '—'}</span>
                    </div>

                    <div className="vehicle-card-row">
                      <span className="vehicle-card-label">Cliente:</span>
                      <span className="vehicle-card-value">
                        {v.client ? (
                          `${v.client.nombre} ${v.client.apellido} (${v.client.identity})`
                        ) : (
                          `ID: ${v.clienteId}`
                        )}
                      </span>
                    </div>

                    <div className="vehicle-card-row">
                      <span className="vehicle-card-label">Certificado:</span>
                      <span className="vehicle-card-value">{v.certificadoNo || '—'}</span>
                    </div>

                    <div className="vehicle-card-actions">
                      <button
                        onClick={() => {
                          setDetailVehiculo(v)
                          setDetailModalOpen(true)
                        }}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        <Eye size={14} />
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => {
                          const v2 = v
                          const marcaId = typeof v2.marca === 'object' ? String(v2.marca?.id ?? '') : ''
                          const lineaId = typeof v2.linea === 'object' ? String(v2.linea?.id ?? '') : ''
                          const claseId = typeof v2.clase === 'object' ? String((v2.clase as any)?.id ?? '') : ''
                          const colorId = typeof v2.color === 'object' ? String((v2.color as any)?.id ?? '') : ''
                          const tipoVehiculoId = typeof v2.tipoVehiculo === 'object' ? String(v2.tipoVehiculo?.id ?? '') : ''
                          const tipoCombustibleId = typeof v2.tipoCombustible === 'object' ? String((v2.tipoCombustible as any)?.id ?? '') : ''
                          const tipoServicioId = typeof v2.tipoServicio === 'object' ? String((v2.tipoServicio as any)?.id ?? '') : ''
                          setEditVehiculo(v2)
                          setEditForm({
                            placa: v2.placa || '',
                            modelo: v2.modelo || '',
                            certificadoNo: v2.certificadoNo || '',
                            cilindraje: v2.cilindraje || '',
                            marcaId, lineaId, claseId, colorId,
                            tipoVehiculoId, tipoCombustibleId, tipoServicioId,
                          })
                          setEditError(null)
                          setEditModalOpen(true)
                        }}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarVehiculo(v.id)}
                        style={{
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!cargandoVehiculos && !errorVehiculos && vehiculos.length > 0 && (
          <div className="vh-table-footer">
            <div className="vh-footer-left">
              <span>Mostrar</span>
              <select
                className="vh-footer-select"
                value={limite}
                onChange={(e) => {
                  setLimite(Number(e.target.value))
                  setPagina(0)
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>

            <span className="vh-footer-info">
              Mostrando{' '}
              <strong>{totalElementos === 0 ? 0 : pagina * limite + 1}</strong>{' '}
              a <strong>{Math.min((pagina + 1) * limite, totalElementos)}</strong>{' '}
              de <strong>{totalElementos}</strong> vehículos
            </span>

            <div className="vh-pagination">
              <button
                onClick={() => setPagina((prev) => Math.max(0, prev - 1))}
                disabled={pagina === 0}
                className="vh-pagination-btn"
              >
                Anterior
              </button>
              <span className="vh-pagination-label">
                Página {pagina + 1} de {Math.max(1, totalPaginas)}
              </span>
              <button
                onClick={() => setPagina((prev) => Math.min(totalPaginas - 1, prev + 1))}
                disabled={pagina >= totalPaginas - 1}
                className="vh-pagination-btn"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Modal de Registro de Vehículo */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Registro de Vehículo"
        maxWidth="800px"
        className="vehiculo-modal-window"
      >
        {estado === 'exito' && vehiculoGuardado ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
            <h2 style={{ color: '#16a34a', marginBottom: 8 }}>Vehículo Registrado</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              {esMotocicleta ? 'La motocicleta' : 'El vehículo'} con placa{' '}
              <strong>{vehiculoGuardado.placa}</strong> fue registrado exitosamente.
            </p>

            <div
              style={{
                display: 'inline-block',
                textAlign: 'left',
                background: '#f8fafc',
                padding: '16px 24px',
                borderRadius: 8,
                marginBottom: 24,
                lineHeight: 2,
                width: '100%',
                maxWidth: '400px',
              }}
            >
              <strong>Placa:</strong> {vehiculoGuardado.placa}<br />
              <strong>Tipo:</strong>{' '}
              {typeof vehiculoGuardado.tipoVehiculo === 'object'
                ? vehiculoGuardado.tipoVehiculo?.nombre
                : vehiculoGuardado.tipoVehiculo}
              <br />
              {vehiculoGuardado.cilindraje && (
                <>
                  <strong>Cilindraje:</strong> {vehiculoGuardado.cilindraje} cc<br />
                </>
              )}
              <strong>Marca:</strong>{' '}
              {typeof vehiculoGuardado.marca === 'object'
                ? vehiculoGuardado.marca?.nombre
                : vehiculoGuardado.marca}
              <br />
              <strong>Modelo:</strong> {vehiculoGuardado.modelo}<br />
              <strong>Cliente:</strong>{' '}
              {clienteSeleccionado
                ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
                : vehiculoGuardado.clienteId}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={resetFormulario}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                }}
              >
                <Plus size={18} />
                Registrar otro
              </button>
              <button
                onClick={handleCloseModal}
                className="btn-cancel"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              Los campos marcados con <span style={{ color: '#ef4444' }}>*</span> son obligatorios.
            </p>

            {/* Error global del servidor */}
            {errorServidor && (
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
                  marginBottom: 16,
                  color: '#991b1b',
                  fontSize: '0.9rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorServidor}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="vehiculo-modal-form">
              <div className="vehiculo-modal-body">
              {/* ── Cliente ─────────────────────────────────────────────────────── */}
              <fieldset
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 16,
                  margin: 0,
                }}
              >
                <legend
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    padding: '0 8px',
                  }}
                >
                  Cliente <span style={{ color: '#ef4444' }}>*</span>
                </legend>

                {clienteSeleccionado ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '12px 16px',
                    }}
                  >
                    <div>
                      <strong>
                        {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                      </strong>
                      <span style={{ color: '#6b7280', marginLeft: 12, fontSize: '0.9rem' }}>
                        {clienteSeleccionado.identity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={limpiarCliente}
                      style={{
                        background: '#fef2f2',
                        color: '#991b1b',
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.85rem',
                      }}
                    >
                      <X size={14} />
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                        }}
                      >
                        {buscandoCliente ? (
                          <Loader2
                            size={18}
                            style={{ animation: 'spin 1s linear infinite' }}
                          />
                        ) : (
                          <Search size={18} />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre o documento..."
                        value={queryCliente}
                        onChange={(e) => setQueryCliente(e.target.value)}
                        style={{ paddingLeft: 40, height: 44 }}
                        disabled={enviando}
                      />
                    </div>

                    {resultadosCliente.length > 0 && (
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          maxHeight: 200,
                          overflowY: 'auto',
                        }}
                      >
                        {resultadosCliente.map((c: ClientePersonaNatural) => (
                          <div
                            key={c.id}
                            onClick={() => seleccionarCliente(c)}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              transition: 'background 0.15s',
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.background = '#f8fafc')
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.background = 'transparent')
                            }
                          >
                            <span>
                              {c.nombre} {c.apellido}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                              {c.identity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {queryCliente.length >= 3 &&
                      resultadosCliente.length === 0 &&
                      !buscandoCliente && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 16px',
                            color: '#6b7280',
                          }}
                        >
                          <User size={16} />
                          <span>No se encontraron clientes con ese criterio</span>
                        </div>
                      )}

                    {errors.clienteId && (
                      <span className="field-error">
                        {errors.clienteId.message}
                      </span>
                    )}
                  </div>
                )}
              </fieldset>

              {/* ── Identificación del Vehículo ─────────────────────────────────── */}
              <fieldset className="form-row-2">
                <label style={labelStyle}>
                  <div>Placa <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                  <input
                    placeholder="Ej: ABC123 o ABC12A"
                    style={{ ...inputStyle, textTransform: 'uppercase' }}
                    {...register('placa')}
                    disabled={enviando}
                    maxLength={7}
                  />
                  {errors.placa && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.placa.message}</span>
                  )}
                </label>

                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Tipo de vehículo <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoTipoVehiculoInline && !editandoTipoVehiculoInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaTipoVehiculoNombre('')
                              setCreandoTipoVehiculoInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nuevo
                          </button>
                          {Number(watch('tipoVehiculoId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('tipoVehiculoId'))
                                const item = localTiposVehiculo.find(t => t.id === selectedId)
                                if (item) {
                                  setNuevaTipoVehiculoNombre(item.nombre)
                                  setEditandoTipoVehiculoInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoTipoVehiculoInline || editandoTipoVehiculoInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoTipoVehiculoInline ? "Editar tipo..." : "Nuevo tipo..."}
                        value={nuevaTipoVehiculoNombre}
                        onChange={(e) => setNuevaTipoVehiculoNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaTipoVehiculoNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoTipoVehiculoInline) {
                              const selectedId = Number(watch('tipoVehiculoId'))
                              const updated = await vehiculoService.actualizarTipoVehiculo(selectedId, nuevaTipoVehiculoNombre.trim())
                              setLocalTiposVehiculo(localTiposVehiculo.map(t => t.id === selectedId ? updated : t))
                              setEditandoTipoVehiculoInline(false)
                            } else {
                              const nueva = await vehiculoService.crearTipoVehiculo(nuevaTipoVehiculoNombre.trim())
                              setLocalTiposVehiculo([...localTiposVehiculo, nueva])
                              setValue('tipoVehiculoId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoTipoVehiculoInline(false)
                            }
                            setNuevaTipoVehiculoNombre('')
                          } catch (e) {
                            alert(editandoTipoVehiculoInline ? 'Error al editar el tipo de vehículo' : 'Error al crear el tipo de vehículo')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaTipoVehiculoNombre('')
                          setCreandoTipoVehiculoInline(false)
                          setEditandoTipoVehiculoInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localTiposVehiculo.map((t) => ({ value: String(t.id), label: t.nombre }))}
                      value={String(watch('tipoVehiculoId') || '')}
                      onChange={(val) => setValue('tipoVehiculoId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.tipoVehiculoId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>
                      {errors.tipoVehiculoId.message}
                    </span>
                  )}
                </label>
              </fieldset>

              {/* ── Indicador de formato de inspección ──────────────────────────── */}
              {tipoVehiculoActual && tipoVehiculoId > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: esMotocicleta ? '#fefce8' : '#f0f9ff',
                    border: `1px solid ${esMotocicleta ? '#fde68a' : '#bae6fd'}`,
                    borderRadius: 10,
                    color: esMotocicleta ? '#854d0e' : '#075985',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
                  }}
                >
                  {esMotocicleta ? <Bike size={18} /> : <Truck size={18} />}
                  <span>
                    Formato de inspección:{' '}
                    <strong>
                      {esMotocicleta ? 'Motocicleta (NTC 5385)' : 'Vehículo liviano/pesado (NTC 5375)'}
                    </strong>
                  </span>
                </div>
              )}

              {/* ── Cilindraje (solo para motos) ────────────────────────────────── */}
              {esMotocicleta && (
                <label style={labelStyle}>
                  <div>Cilindraje (cc) <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                      }}
                    >
                      <Gauge size={18} />
                    </div>
                    <input
                      placeholder="Ej: 150"
                      style={{ ...inputStyle, paddingLeft: 40 }}
                      {...register('cilindraje')}
                      disabled={enviando}
                    />
                  </div>
                  {errors.cilindraje && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.cilindraje.message}</span>
                  )}
                </label>
              )}

              {/* ── Marca, Línea y Clase ─────────────────────────────────────────── */}
              <fieldset className="form-row-2">
                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Marca <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoMarcaInline && !editandoMarcaInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaMarcaNombre('')
                              setCreandoMarcaInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nueva
                          </button>
                          {Number(watch('marcaId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('marcaId'))
                                const item = localMarcas.find(m => m.id === selectedId)
                                if (item) {
                                  setNuevaMarcaNombre(item.nombre)
                                  setEditandoMarcaInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoMarcaInline || editandoMarcaInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoMarcaInline ? "Editar marca..." : "Nueva marca..."}
                        value={nuevaMarcaNombre}
                        onChange={(e) => setNuevaMarcaNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaMarcaNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoMarcaInline) {
                              const selectedId = Number(watch('marcaId'))
                              const updated = await vehiculoService.actualizarMarca(selectedId, nuevaMarcaNombre.trim())
                              setLocalMarcas(localMarcas.map(m => m.id === selectedId ? updated : m))
                              setEditandoMarcaInline(false)
                            } else {
                              const nueva = await vehiculoService.crearMarca(nuevaMarcaNombre.trim())
                              setLocalMarcas([...localMarcas, nueva])
                              setValue('marcaId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoMarcaInline(false)
                            }
                            setNuevaMarcaNombre('')
                          } catch (e) {
                            alert(editandoMarcaInline ? 'Error al editar la marca' : 'Error al crear la marca')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaMarcaNombre('')
                          setCreandoMarcaInline(false)
                          setEditandoMarcaInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localMarcas.map((m) => ({ value: String(m.id), label: m.nombre }))}
                      value={String(watch('marcaId') || '')}
                      onChange={(val) => setValue('marcaId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.marcaId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.marcaId.message}</span>
                  )}
                </label>

                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Línea <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoLineaInline && !editandoLineaInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaLineaNombre('')
                              setCreandoLineaInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nueva
                          </button>
                          {Number(watch('lineaId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('lineaId'))
                                const item = localLineas.find(l => l.id === selectedId)
                                if (item) {
                                  setNuevaLineaNombre(item.nombre)
                                  setEditandoLineaInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoLineaInline || editandoLineaInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoLineaInline ? "Editar línea..." : "Nueva línea..."}
                        value={nuevaLineaNombre}
                        onChange={(e) => setNuevaLineaNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaLineaNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoLineaInline) {
                              const selectedId = Number(watch('lineaId'))
                              const marcaIdActual = watch('marcaId')
                              const updated = await vehiculoService.actualizarLinea(
                                selectedId,
                                nuevaLineaNombre.trim(),
                                marcaIdActual ? Number(marcaIdActual) : undefined
                              )
                              setLocalLineas(localLineas.map(l => l.id === selectedId ? updated : l))
                              setEditandoLineaInline(false)
                            } else {
                              const marcaIdActual = watch('marcaId')
                              const nueva = await vehiculoService.crearLinea(
                                nuevaLineaNombre.trim(),
                                marcaIdActual ? Number(marcaIdActual) : undefined
                              )
                              setLocalLineas([...localLineas, nueva])
                              setValue('lineaId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoLineaInline(false)
                            }
                            setNuevaLineaNombre('')
                          } catch (e) {
                            alert(editandoLineaInline ? 'Error al editar la línea' : 'Error al crear la línea')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaLineaNombre('')
                          setCreandoLineaInline(false)
                          setEditandoLineaInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localLineas.map((l) => ({ value: String(l.id), label: l.nombre }))}
                      value={String(watch('lineaId') || '')}
                      onChange={(val) => setValue('lineaId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.lineaId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.lineaId.message}</span>
                  )}
                </label>
              </fieldset>

              <fieldset className="form-row-2">
                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Clase <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoClaseInline && !editandoClaseInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaClaseNombre('')
                              setCreandoClaseInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nueva
                          </button>
                          {Number(watch('claseId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('claseId'))
                                const item = localClases.find(c => c.id === selectedId)
                                if (item) {
                                  setNuevaClaseNombre(item.nombre)
                                  setEditandoClaseInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoClaseInline || editandoClaseInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoClaseInline ? "Editar clase..." : "Nueva clase..."}
                        value={nuevaClaseNombre}
                        onChange={(e) => setNuevaClaseNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaClaseNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoClaseInline) {
                              const selectedId = Number(watch('claseId'))
                              const updated = await vehiculoService.actualizarClase(selectedId, nuevaClaseNombre.trim())
                              setLocalClases(localClases.map(c => c.id === selectedId ? updated : c))
                              setEditandoClaseInline(false)
                            } else {
                              const nueva = await vehiculoService.crearClase(nuevaClaseNombre.trim())
                              setLocalClases([...localClases, nueva])
                              setValue('claseId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoClaseInline(false)
                            }
                            setNuevaClaseNombre('')
                          } catch (e) {
                            alert(editandoClaseInline ? 'Error al editar la clase' : 'Error al crear la clase')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaClaseNombre('')
                          setCreandoClaseInline(false)
                          setEditandoClaseInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localClases.map((c) => ({ value: String(c.id), label: c.nombre }))}
                      value={String(watch('claseId') || '')}
                      onChange={(val) => setValue('claseId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.claseId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.claseId.message}</span>
                  )}
                </label>

                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Color <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoColorInline && !editandoColorInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaColorNombre('')
                              setCreandoColorInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nuevo
                          </button>
                          {Number(watch('colorId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('colorId'))
                                const item = localColores.find(c => c.id === selectedId)
                                if (item) {
                                  setNuevaColorNombre(item.nombre)
                                  setEditandoColorInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoColorInline || editandoColorInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoColorInline ? "Editar color..." : "Nuevo color..."}
                        value={nuevaColorNombre}
                        onChange={(e) => setNuevaColorNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaColorNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoColorInline) {
                              const selectedId = Number(watch('colorId'))
                              const updated = await vehiculoService.actualizarColor(selectedId, nuevaColorNombre.trim())
                              setLocalColores(localColores.map(c => c.id === selectedId ? updated : c))
                              setEditandoColorInline(false)
                            } else {
                              const nueva = await vehiculoService.crearColor(nuevaColorNombre.trim())
                              setLocalColores([...localColores, nueva])
                              setValue('colorId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoColorInline(false)
                            }
                            setNuevaColorNombre('')
                          } catch (e) {
                            alert(editandoColorInline ? 'Error al editar el color' : 'Error al crear el color')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaColorNombre('')
                          setCreandoColorInline(false)
                          setEditandoColorInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localColores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                      value={String(watch('colorId') || '')}
                      onChange={(val) => setValue('colorId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.colorId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.colorId.message}</span>
                  )}
                </label>
              </fieldset>

              {/* ── Modelo, Combustible, Servicio ────────────────────────────────── */}
              <fieldset className="form-row-2">
                <label style={labelStyle}>
                  <div>Modelo (año) <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                  <input
                    placeholder="Ej: 2024"
                    maxLength={4}
                    style={inputStyle}
                    {...register('modelo')}
                    disabled={enviando}
                  />
                  {errors.modelo && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.modelo.message}</span>
                  )}
                </label>

                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Tipo de combustible <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoCombustibleInline && !editandoCombustibleInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaCombustibleNombre('')
                              setCreandoCombustibleInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nuevo
                          </button>
                          {Number(watch('tipoCombustibleId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('tipoCombustibleId'))
                                const item = localCombustibles.find(t => t.id === selectedId)
                                if (item) {
                                  setNuevaCombustibleNombre(item.nombre)
                                  setEditandoCombustibleInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoCombustibleInline || editandoCombustibleInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoCombustibleInline ? "Editar combustible..." : "Nuevo combustible..."}
                        value={nuevaCombustibleNombre}
                        onChange={(e) => setNuevaCombustibleNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaCombustibleNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoCombustibleInline) {
                              const selectedId = Number(watch('tipoCombustibleId'))
                              const updated = await vehiculoService.actualizarTipoCombustible(selectedId, nuevaCombustibleNombre.trim())
                              setLocalCombustibles(localCombustibles.map(t => t.id === selectedId ? updated : t))
                              setEditandoCombustibleInline(false)
                            } else {
                              const nueva = await vehiculoService.crearTipoCombustible(nuevaCombustibleNombre.trim())
                              setLocalCombustibles([...localCombustibles, nueva])
                              setValue('tipoCombustibleId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoCombustibleInline(false)
                            }
                            setNuevaCombustibleNombre('')
                          } catch (e) {
                            alert(editandoCombustibleInline ? 'Error al editar el tipo de combustible' : 'Error al crear el tipo de combustible')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaCombustibleNombre('')
                          setCreandoCombustibleInline(false)
                          setEditandoCombustibleInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localCombustibles.map((t) => ({ value: String(t.id), label: t.nombre }))}
                      value={String(watch('tipoCombustibleId') || '')}
                      onChange={(val) => setValue('tipoCombustibleId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.tipoCombustibleId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>
                      {errors.tipoCombustibleId.message}
                    </span>
                  )}
                </label>
              </fieldset>

              <fieldset className="form-row-2">
                <label style={labelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Tipo de servicio <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!creandoTipoServicioInline && !editandoTipoServicioInline && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevaTipoServicioNombre('')
                              setCreandoTipoServicioInline(true)
                            }}
                            style={btnActionStyle}
                          >
                            <Plus size={14} /> Crear nuevo
                          </button>
                          {Number(watch('tipoServicioId') || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = Number(watch('tipoServicioId'))
                                const item = localTiposServicio.find(t => t.id === selectedId)
                                if (item) {
                                  setNuevaTipoServicioNombre(item.nombre)
                                  setEditandoTipoServicioInline(true)
                                }
                              }}
                              style={btnActionStyle}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {creandoTipoServicioInline || editandoTipoServicioInline ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: '4px' }}>
                      <input
                        placeholder={editandoTipoServicioInline ? "Editar servicio..." : "Nuevo servicio..."}
                        value={nuevaTipoServicioNombre}
                        onChange={(e) => setNuevaTipoServicioNombre(e.target.value)}
                        style={inputStyle}
                        disabled={guardandoCatalogo}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!nuevaTipoServicioNombre.trim()) return
                          setGuardandoCatalogo(true)
                          try {
                            if (editandoTipoServicioInline) {
                              const selectedId = Number(watch('tipoServicioId'))
                              const updated = await vehiculoService.actualizarTipoServicio(selectedId, nuevaTipoServicioNombre.trim())
                              setLocalTiposServicio(localTiposServicio.map(t => t.id === selectedId ? updated : t))
                              setEditandoTipoServicioInline(false)
                            } else {
                              const nueva = await vehiculoService.crearTipoServicio(nuevaTipoServicioNombre.trim())
                              setLocalTiposServicio([...localTiposServicio, nueva])
                              setValue('tipoServicioId', Number(nueva.id), { shouldValidate: true, shouldDirty: true })
                              setCreandoTipoServicioInline(false)
                            }
                            setNuevaTipoServicioNombre('')
                          } catch (e) {
                            alert(editandoTipoServicioInline ? 'Error al editar el tipo de servicio' : 'Error al crear el tipo de servicio')
                          } finally {
                            setGuardandoCatalogo(false)
                          }
                        }}
                        style={btnSaveStyle}
                        disabled={guardandoCatalogo}
                      >
                        {guardandoCatalogo ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNuevaTipoServicioNombre('')
                          setCreandoTipoServicioInline(false)
                          setEditandoTipoServicioInline(false)
                        }}
                        style={btnCancelStyle}
                        disabled={guardandoCatalogo}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <CustomSelect
                      options={localTiposServicio.map((t) => ({ value: String(t.id), label: t.nombre }))}
                      value={String(watch('tipoServicioId') || '')}
                      onChange={(val) => setValue('tipoServicioId', Number(val), { shouldValidate: true, shouldDirty: true })}
                      placeholder="-- Seleccione --"
                    />
                  )}
                  {errors.tipoServicioId && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>
                      {errors.tipoServicioId.message}
                    </span>
                  )}
                </label>

                <label style={labelStyle}>
                  <div>Número de certificado <small style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 400 }}>(opcional)</small></div>
                  <input
                    placeholder="Ej: CERT-001"
                    style={inputStyle}
                    {...register('certificadoNo')}
                    disabled={enviando}
                  />
                </label>
              </fieldset>


              </div>

              {/* ── Botones de envío / cancelación ── */}
              <div className="vehiculo-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-cancel"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: enviando ? 0.7 : 1,
                  }}
                >
                  {enviando && (
                    <Loader2
                      size={16}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  )}
                  {esMotocicleta ? <Bike size={18} /> : <Truck size={18} />}
                  {enviando ? 'Guardando...' : 'Registrar vehículo'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ── Modal Editar Vehículo ──────────────────────────────────────────── */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => !editGuardando && setEditModalOpen(false)}
        title={`Editar Vehículo${editVehiculo ? ' — ' + editVehiculo.placa : ''}`}
        maxWidth="700px"
        className="vehiculo-modal-window"
      >
        {editVehiculo && (
          <div className="vehiculo-modal-form">
            <div className="vehiculo-modal-body">
              {editError && (
                <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontSize: '0.9rem', marginBottom: 12 }}>
                  <AlertCircle size={16} /><span>{editError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Placa */}
              <label style={labelStyle}>
                <div>Placa <strong style={{ color: '#ef4444', fontWeight: 'normal' }}>*</strong></div>
                <input
                  value={editForm.placa || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                  placeholder="ABC123"
                  style={inputStyle}
                  disabled={editGuardando}
                />
              </label>

              {/* Modelo */}
              <label style={labelStyle}>
                Modelo (año)
                <input
                  value={editForm.modelo || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, modelo: e.target.value }))}
                  placeholder="2024"
                  style={inputStyle}
                  disabled={editGuardando}
                />
              </label>

              {/* Marca */}
              <label style={labelStyle}>
                Marca
                <CustomSelect
                  options={localMarcas.map(m => ({ value: String(m.id), label: m.nombre }))}
                  value={editForm.marcaId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, marcaId: val }))}
                  placeholder="Seleccione marca"
                  disabled={editGuardando}
                />
              </label>

              {/* Línea */}
              <label style={labelStyle}>
                Línea
                <CustomSelect
                  options={localLineas.map(l => ({ value: String(l.id), label: l.nombre }))}
                  value={editForm.lineaId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, lineaId: val }))}
                  placeholder="Seleccione línea"
                  disabled={editGuardando}
                />
              </label>

              {/* Clase */}
              <label style={labelStyle}>
                Clase
                <CustomSelect
                  options={localClases.map(c => ({ value: String(c.id), label: c.nombre }))}
                  value={editForm.claseId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, claseId: val }))}
                  placeholder="Seleccione clase"
                  disabled={editGuardando}
                />
              </label>

              {/* Color */}
              <label style={labelStyle}>
                Color
                <CustomSelect
                  options={localColores.map(c => ({ value: String(c.id), label: c.nombre }))}
                  value={editForm.colorId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, colorId: val }))}
                  placeholder="Seleccione color"
                  disabled={editGuardando}
                />
              </label>

              {/* Tipo de Vehículo */}
              <label style={labelStyle}>
                Tipo de vehículo
                <CustomSelect
                  options={localTiposVehiculo.map(t => ({ value: String(t.id), label: t.nombre }))}
                  value={editForm.tipoVehiculoId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, tipoVehiculoId: val }))}
                  placeholder="Seleccione tipo"
                  disabled={editGuardando}
                />
              </label>

              {/* Tipo de Combustible */}
              <label style={labelStyle}>
                Combustible
                <CustomSelect
                  options={localCombustibles.map(c => ({ value: String(c.id), label: c.nombre }))}
                  value={editForm.tipoCombustibleId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, tipoCombustibleId: val }))}
                  placeholder="Seleccione combustible"
                  disabled={editGuardando}
                />
              </label>

              {/* Tipo de Servicio */}
              <label style={labelStyle}>
                Tipo de servicio
                <CustomSelect
                  options={localTiposServicio.map(t => ({ value: String(t.id), label: t.nombre }))}
                  value={editForm.tipoServicioId || ''}
                  onChange={(val) => setEditForm(f => ({ ...f, tipoServicioId: val }))}
                  placeholder="Seleccione servicio"
                  disabled={editGuardando}
                />
              </label>

              {/* Cilindraje */}
              <label style={labelStyle}>
                Cilindraje
                <input
                  value={editForm.cilindraje || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, cilindraje: e.target.value }))}
                  placeholder="Ej: 1600cc"
                  style={inputStyle}
                  disabled={editGuardando}
                />
              </label>

              {/* Certificado */}
              <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                Número de certificado
                <input
                  value={editForm.certificadoNo || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, certificadoNo: e.target.value }))}
                  placeholder="Ej: CERT-001"
                  style={inputStyle}
                  disabled={editGuardando}
                />
              </label>
            </div>
            </div>

            <div className="vehiculo-modal-footer">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={editGuardando}
                style={{ padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={editGuardando || !editForm.placa}
                onClick={async () => {
                  if (!editVehiculo) return
                  setEditGuardando(true)
                  setEditError(null)
                  try {
                    await vehiculoService.actualizarVehiculo(editVehiculo.id, {
                      placa: editForm.placa,
                      modelo: editForm.modelo,
                      certificadoNo: editForm.certificadoNo,
                      cilindraje: editForm.cilindraje,
                      ...(editForm.marcaId ? { marcaId: Number(editForm.marcaId) } : {}),
                      ...(editForm.lineaId ? { lineaId: Number(editForm.lineaId) } : {}),
                      ...(editForm.claseId ? { claseId: Number(editForm.claseId) } : {}),
                      ...(editForm.colorId ? { colorId: Number(editForm.colorId) } : {}),
                      ...(editForm.tipoVehiculoId ? { tipoVehiculoId: Number(editForm.tipoVehiculoId) } : {}),
                      ...(editForm.tipoCombustibleId ? { tipoCombustibleId: Number(editForm.tipoCombustibleId) } : {}),
                      ...(editForm.tipoServicioId ? { tipoServicioId: Number(editForm.tipoServicioId) } : {}),
                    } as any)
                    setEditModalOpen(false)
                    setPagina(0)
                  } catch (err: any) {
                    setEditError(err?.response?.data?.message || err?.message || 'Error al actualizar el vehículo')
                  } finally {
                    setEditGuardando(false)
                  }
                }}
                style={{
                  padding: '10px 24px',
                  background: editGuardando ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: editGuardando ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {editGuardando && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {editGuardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Detalle de Vehículo ────────────────────────────────────────── */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Detalles del Vehículo — Placa: ${detailVehiculo?.placa || ''}`}
        maxWidth="750px"
        className="vehiculo-detalle-modal-window"
      >
        {detailVehiculo && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="vehiculo-detalle-modal-body">
              {/* Cabecera / Placa estilo placa real */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                <div style={{
                  background: '#fef08a',
                  border: '3px solid #1e293b',
                  borderRadius: 8,
                  padding: '6px 20px',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>Colombia</span>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    {detailVehiculo.placa}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    display: 'inline-block'
                  }}>
                    {typeof detailVehiculo.tipoVehiculo === 'object' ? detailVehiculo.tipoVehiculo?.nombre : detailVehiculo.tipoVehiculo || 'Vehículo'}
                  </span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    ID Vehículo: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{detailVehiculo.id}</code>
                  </p>
                </div>
              </div>

              {/* Dos Columnas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                
                {/* Columna Especificaciones */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', paddingBottom: 6 }}>
                    Especificaciones Técnicas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Marca:</span>
                      <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                        {typeof detailVehiculo.marca === 'object' ? detailVehiculo.marca?.nombre : detailVehiculo.marca || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Línea:</span>
                      <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                        {typeof detailVehiculo.linea === 'object' ? detailVehiculo.linea?.nombre : detailVehiculo.linea || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Modelo (Año):</span>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{detailVehiculo.modelo || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Clase:</span>
                      <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                        {typeof detailVehiculo.clase === 'object' ? detailVehiculo.clase?.nombre : detailVehiculo.clase || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Cilindraje:</span>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{detailVehiculo.cilindraje || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Color:</span>
                      <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                        {typeof detailVehiculo.color === 'object' ? detailVehiculo.color?.nombre : detailVehiculo.color || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Combustible:</span>
                      <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                        {typeof detailVehiculo.tipoCombustible === 'object' ? detailVehiculo.tipoCombustible?.nombre : detailVehiculo.tipoCombustible || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Tipo Servicio:</span>
                      <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                        {typeof detailVehiculo.tipoServicio === 'object' ? detailVehiculo.tipoServicio?.nombre : detailVehiculo.tipoServicio || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>No. Certificado:</span>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{detailVehiculo.certificadoNo || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Columna Propietario */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', paddingBottom: 6 }}>
                    Información del Propietario
                  </h3>
                  {detailVehiculo.client ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Nombre Completo</span>
                        <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' }}>
                          {detailVehiculo.client.nombre} {detailVehiculo.client.apellido}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Identificación / Cédula</span>
                        <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
                          {detailVehiculo.client.identity}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Teléfono / Celular</span>
                        <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
                          {detailVehiculo.client.celular || '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Correo Electrónico</span>
                        <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
                          {detailVehiculo.client.email || '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Dirección</span>
                        <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
                          {detailVehiculo.client.direccion || '—'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', color: '#64748b', gap: 8 }}>
                      <User size={32} style={{ color: '#cbd5e1' }} />
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>Asociado to Cliente ID</p>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                          {detailVehiculo.clienteId}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Botón cerrar */}
            <div className="vehiculo-detalle-modal-footer">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
