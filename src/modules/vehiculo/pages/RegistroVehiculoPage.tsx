import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { useRegistrarVehiculo } from '@/modules/vehiculo/hooks/useRegistrarVehiculo'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'
import { Modal } from '@/core/components/Modal'

export function RegistroVehiculoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [queryVehiculo, setQueryVehiculo] = useState('')

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
  } = useRegistrarVehiculo()

  const {
    register,
    formState: { errors },
    watch,
  } = form

  const enviando = estado === 'enviando'
  const tipoVehiculoId = watch('tipoVehiculoId')
  const tipoVehiculoActual = tiposVehiculo.find((t) => t.id === tipoVehiculoId)

  // ── Filtrado de Vehículos en Cliente ─────────────────────────────────────────
  const vehiculosFiltrados = useMemo(() => {
    const q = queryVehiculo.toLowerCase().trim()
    if (!q) return vehiculos
    return vehiculos.filter((v) => {
      const placaMatch = v.placa?.toLowerCase().includes(q)
      const modeloMatch = v.modelo?.toLowerCase().includes(q)
      const marcaNombre = typeof v.marca === 'object' ? v.marca?.nombre : v.marca
      const marcaMatch = marcaNombre?.toLowerCase().includes(q)
      const lineaNombre = typeof v.linea === 'object' ? v.linea?.nombre : v.linea
      const lineaMatch = lineaNombre?.toLowerCase().includes(q)
      
      const clientName = v.client ? `${v.client.nombre} ${v.client.apellido}`.toLowerCase() : ''
      const clientIdDoc = v.client ? v.client.identity.toLowerCase() : ''
      const clientMatch = clientName.includes(q) || clientIdDoc.includes(q) || String(v.clienteId).includes(q)

      return placaMatch || modeloMatch || marcaMatch || lineaMatch || clientMatch
    })
  }, [vehiculos, queryVehiculo])

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

  const handleCloseModal = () => {
    resetFormulario()
    setIsModalOpen(false)
  }

  // ── Renderizado Principal ──────────────────────────────────────────────────
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} style={{ color: '#155DFC' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
              Gestión de Vehículos
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              Administración, búsqueda y registro de vehículos en el sistema
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetFormulario()
            setIsModalOpen(true)
          }}
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
          Nuevo Vehículo
        </button>
      </div>

      {/* Buscador de vehículos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          gap: 12,
        }}
      >
        <Search size={18} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Buscar por placa, modelo, marca, línea o cliente..."
          value={queryVehiculo}
          onChange={(e) => setQueryVehiculo(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            width: '100%',
            background: 'transparent',
          }}
        />
      </div>

      {/* Tabla / Lista de Vehículos */}
      <article className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {cargandoVehiculos ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
          </div>
        ) : errorVehiculos ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={24} style={{ marginBottom: 8 }} />
            <p>{errorVehiculos}</p>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Truck size={48} style={{ color: '#94a3b8', marginBottom: 16, marginInline: 'auto' }} />
            <h3 style={{ color: '#334155', margin: '0 0 8px 0' }}>No se encontraron vehículos</h3>
            <p style={{ color: '#64748b', margin: '0 0 24px 0', fontSize: '0.9rem' }}>
              {queryVehiculo.trim()
                ? 'Intente ajustar los términos de búsqueda'
                : 'Comience registrando el primer vehículo en el sistema'}
            </p>
            {!queryVehiculo.trim() && (
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: '#155DFC',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Registrar Vehículo
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Placa</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Marca / Línea</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Modelo</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Cliente</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Certificado</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map((v) => {
                  const marca = typeof v.marca === 'object' ? v.marca?.nombre : v.marca
                  const linea = typeof v.linea === 'object' ? v.linea?.nombre : v.linea
                  const tipo = typeof v.tipoVehiculo === 'object' ? v.tipoVehiculo?.nombre : v.tipoVehiculo

                  return (
                    <tr key={v.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, textTransform: 'uppercase', color: '#1e293b' }}>
                        {v.placa}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        {tipo || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569', textTransform: 'capitalize' }}>
                        {marca || '—'} {linea ? `/ ${linea}` : ''}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        {v.modelo || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        {v.client ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {v.client.nombre} {v.client.apellido}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {v.client.identity}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            ID: {v.clienteId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                        {v.certificadoNo || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => eliminarVehiculo(v.id)}
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: 'none',
                            padding: '6px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                          title="Eliminar Vehículo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!cargandoVehiculos && !errorVehiculos && vehiculos.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#64748b' }}>
              <span>Mostrar</span>
              <select
                value={limite}
                onChange={(e) => {
                  setLimite(Number(e.target.value))
                  setPagina(0)
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Mostrando{' '}
              <strong>
                {totalElementos === 0 ? 0 : pagina * limite + 1}
              </strong>{' '}
              a{' '}
              <strong>
                {Math.min((pagina + 1) * limite, totalElementos)}
              </strong>{' '}
              de <strong>{totalElementos}</strong> vehículos
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setPagina((prev) => Math.max(0, prev - 1))}
                disabled={pagina === 0}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: pagina === 0 ? '#f1f5f9' : '#fff',
                  color: pagina === 0 ? '#94a3b8' : '#334155',
                  cursor: pagina === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Anterior
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                Página {pagina + 1} de {Math.max(1, totalPaginas)}
              </span>
              <button
                onClick={() => setPagina((prev) => Math.min(totalPaginas - 1, prev + 1))}
                disabled={pagina >= totalPaginas - 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: pagina >= totalPaginas - 1 ? '#f1f5f9' : '#fff',
                  color: pagina >= totalPaginas - 1 ? '#94a3b8' : '#334155',
                  cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
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

            <form onSubmit={onSubmit} className="form-grid">
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
                <label>
                  Placa <span style={{ color: '#ef4444' }}>*</span>
                  <input
                    placeholder="Ej: ABC123 o ABC12A"
                    style={{ textTransform: 'uppercase' }}
                    {...register('placa')}
                    disabled={enviando}
                    maxLength={7}
                  />
                  {errors.placa && (
                    <span className="field-error">{errors.placa.message}</span>
                  )}
                </label>

                <label>
                  Tipo de vehículo <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('tipoVehiculoId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {tiposVehiculo.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.tipoVehiculoId && (
                    <span className="field-error">
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
                    gap: 8,
                    padding: '10px 14px',
                    background: esMotocicleta ? '#fefce8' : '#f0f9ff',
                    border: `1px solid ${esMotocicleta ? '#fde68a' : '#bae6fd'}`,
                    borderRadius: 8,
                    color: esMotocicleta ? '#854d0e' : '#075985',
                    fontSize: '0.9rem',
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
                <label>
                  Cilindraje (cc) <span style={{ color: '#ef4444' }}>*</span>
                  <div style={{ position: 'relative' }}>
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
                      style={{ paddingLeft: 40 }}
                      {...register('cilindraje')}
                      disabled={enviando}
                    />
                  </div>
                  {errors.cilindraje && (
                    <span className="field-error">{errors.cilindraje.message}</span>
                  )}
                </label>
              )}

              {/* ── Marca, Línea y Clase ─────────────────────────────────────────── */}
              <fieldset className="form-row-2">
                <label>
                  Marca <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('marcaId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.marcaId && (
                    <span className="field-error">{errors.marcaId.message}</span>
                  )}
                </label>

                <label>
                  Línea <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('lineaId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {lineas.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.lineaId && (
                    <span className="field-error">{errors.lineaId.message}</span>
                  )}
                </label>
              </fieldset>

              <fieldset className="form-row-2">
                <label>
                  Clase <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('claseId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {clases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.claseId && (
                    <span className="field-error">{errors.claseId.message}</span>
                  )}
                </label>

                <label>
                  Color <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('colorId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {colores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.colorId && (
                    <span className="field-error">{errors.colorId.message}</span>
                  )}
                </label>
              </fieldset>

              {/* ── Modelo, Combustible, Servicio ────────────────────────────────── */}
              <fieldset className="form-row-2">
                <label>
                  Modelo (año) <span style={{ color: '#ef4444' }}>*</span>
                  <input
                    placeholder="Ej: 2024"
                    maxLength={4}
                    {...register('modelo')}
                    disabled={enviando}
                  />
                  {errors.modelo && (
                    <span className="field-error">{errors.modelo.message}</span>
                  )}
                </label>

                <label>
                  Tipo de combustible <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('tipoCombustibleId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {tiposCombustible.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.tipoCombustibleId && (
                    <span className="field-error">
                      {errors.tipoCombustibleId.message}
                    </span>
                  )}
                </label>
              </fieldset>

              <fieldset className="form-row-2">
                <label>
                  Tipo de servicio <span style={{ color: '#ef4444' }}>*</span>
                  <select
                    {...register('tipoServicioId', { valueAsNumber: true })}
                    disabled={enviando}
                  >
                    <option value={0}>-- Seleccione --</option>
                    {tiposServicio.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.tipoServicioId && (
                    <span className="field-error">
                      {errors.tipoServicioId.message}
                    </span>
                  )}
                </label>

                <label>
                  Número de certificado{' '}
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                    (opcional)
                  </span>
                  <input
                    placeholder="Ej: CERT-001"
                    {...register('certificadoNo')}
                    disabled={enviando}
                  />
                </label>
              </fieldset>

              {/* ── Botones de envío / cancelación ── */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
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
    </div>
  )
}
