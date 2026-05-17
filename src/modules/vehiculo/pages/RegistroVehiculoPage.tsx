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
} from 'lucide-react'
import { useRegistrarVehiculo } from '@/modules/vehiculo/hooks/useRegistrarVehiculo'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

export function RegistroVehiculoPage() {
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
  } = useRegistrarVehiculo()

  const {
    register,
    formState: { errors },
    watch,
  } = form

  const enviando = estado === 'enviando'
  const tipoVehiculoId = watch('tipoVehiculoId')
  const tipoVehiculoActual = tiposVehiculo.find((t) => t.id === tipoVehiculoId)

  // ── Cargando catálogos ─────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <article className="panel" style={{ textAlign: 'center', padding: 40 }}>
        <Loader2
          size={32}
          style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }}
        />
        <p style={{ marginTop: 12, color: '#6b7280' }}>
          Cargando catálogos de vehículos...
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

  // ── Confirmación de éxito ──────────────────────────────────────────────────
  if (estado === 'exito' && vehiculoGuardado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <article className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
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
            <strong>Cliente ID:</strong> {vehiculoGuardado.clienteId}
          </div>

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
            Registrar otro vehículo
          </button>
        </article>
      </div>
    )
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
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
            Registro de Vehículo
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Registre un vehículo liviano, pesado o motocicleta asociado a un cliente
          </p>
        </div>
      </div>

      <article className="panel">
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

          {/* ── Botón de envío ── */}
          <button
            type="submit"
            disabled={enviando}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: enviando ? 0.7 : 1,
              marginTop: 8,
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
        </form>
      </article>
    </div>
  )
}
