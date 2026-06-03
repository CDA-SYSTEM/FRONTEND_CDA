import { useState } from 'react'
import { AlertCircle, Loader2, Plus, Users } from 'lucide-react'
import { ClienteBuscador } from '@/modules/recepcion/components/ClienteBuscador'
import { ClienteDetalle } from '@/modules/recepcion/components/ClienteDetalle'
import { ClienteConfirmacion } from '@/modules/recepcion/components/ClienteConfirmacion'
import { Modal } from '@/core/components/Modal'
import { useRegistrarCliente } from '@/modules/recepcion/hooks/useRegistrarCliente'
import { useBuscarCliente } from '@/modules/recepcion/hooks/useBuscarCliente'
import { inferirCodigo } from '@/modules/recepcion/domain/recepcion.schema'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

export function ClientesPage() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClientePersonaNatural | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    form,
    estado,
    clienteGuardado,
    errorServidor,
    errorCatalogo,
    tiposDocumento,
    tiposPersona,
    onSubmit,
    resetFormulario,
  } = useRegistrarCliente()

  const {
    register,
    formState: { errors },
    watch,
  } = form

  const documentTypeId = watch('documentTypeId')
  const enviando = estado === 'enviando'

  // Inferir código del tipo seleccionado para mostrar placeholder dinámico
  const tipoDoc = tiposDocumento.find((d) => d.id === Number(documentTypeId))
  const codigoTipo = tipoDoc ? inferirCodigo(tipoDoc.nombre) : 'CC'
  const placeholderIdentity =
    codigoTipo === 'CC'
      ? 'Ej: 1045678901'
      : codigoTipo === 'CE'
        ? 'Ej: 123456AB'
        : codigoTipo === 'PAS'
          ? 'Ej: AB12345'
          : 'Número de documento'

  // ── Hook de Búsqueda ───────────────────────────────────────────────────────
  const buscador = useBuscarCliente()

  // ── Cargando catálogos ─────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <article className="panel" style={{ textAlign: 'center', padding: 40 }}>
        <Loader2
          size={32}
          style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }}
        />
        <p style={{ marginTop: 12, color: '#6b7280' }}>
          Cargando formulario...
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
  if (estado === 'exito' && clienteGuardado) {
    return (
      <ClienteConfirmacion
        cliente={clienteGuardado}
        onNuevoRegistro={resetFormulario}
      />
    )
  }

  // ── Renderizado Principal ──────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Cabecera ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1.5rem', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} style={{ color: '#155DFC' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
              Gestión de Clientes
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              Registro y administración de clientes
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
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
          Nuevo Cliente
        </button>
      </div>

      {/* ── Contenido: Detalle o Buscador ── */}
      {clienteSeleccionado ? (
        <ClienteDetalle
          clienteInicial={clienteSeleccionado}
          onVolver={() => setClienteSeleccionado(null)}
          onActualizado={() => {
            alert('Cliente actualizado con éxito')
            setClienteSeleccionado(null)
            buscador.refrescar()
          }}
        />
      ) : (
        <ClienteBuscador
          query={buscador.query}
          onQueryChange={buscador.setQuery}
          resultados={buscador.resultados}
          cargando={buscador.cargando}
          error={buscador.error}
          onSeleccionarCliente={setClienteSeleccionado}
          pagina={buscador.pagina}
          onPageChange={buscador.setPagina}
          limite={buscador.limite}
          onLimitChange={buscador.setLimite}
          totalElementos={buscador.totalElementos}
          totalPages={buscador.totalPages}
          incluirInactivos={buscador.incluirInactivos}
          onIncluirInactivosChange={buscador.setIncluirInactivos}
        />
      )}

      {/* ── Modal de Registro de Cliente ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registro de Cliente"
        maxWidth="800px"
      >
      <p style={{ color: '#6b7280', marginBottom: 20 }}>
        Los campos marcados con <span style={{ color: '#ef4444' }}>*</span> son
        obligatorios.
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
        {/* ── Nombre y Apellido ── */}
        <fieldset className="form-row-2">
          <label>
            Nombre <span style={{ color: '#ef4444' }}>*</span>
            <input
              placeholder="Ej: Juan Carlos"
              {...register('nombre')}
              disabled={enviando}
            />
            {errors.nombre && (
              <span className="field-error">{errors.nombre.message}</span>
            )}
          </label>

          <label>
            Apellido <span style={{ color: '#ef4444' }}>*</span>
            <input
              placeholder="Ej: Pérez Gómez"
              {...register('apellido')}
              disabled={enviando}
            />
            {errors.apellido && (
              <span className="field-error">{errors.apellido.message}</span>
            )}
          </label>
        </fieldset>

        {/* ── Tipo de documento e Identity ── */}
        <fieldset className="form-row-doc">
          <label>
            Tipo de documento <span style={{ color: '#ef4444' }}>*</span>
            <select
              {...register('documentTypeId', { valueAsNumber: true })}
              disabled={enviando}
            >
              {tiposDocumento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errors.documentTypeId && (
              <span className="field-error">
                {errors.documentTypeId.message}
              </span>
            )}
          </label>

          <label>
            Número de documento <span style={{ color: '#ef4444' }}>*</span>
            <input
              placeholder={placeholderIdentity}
              {...register('identity')}
              disabled={enviando}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.identity && (
              <span className="field-error">{errors.identity.message}</span>
            )}
          </label>
        </fieldset>

        {/* ── Tipo de persona (oculto si solo hay uno) ── */}
        {tiposPersona.length > 1 && (
          <label>
            Tipo de persona <span style={{ color: '#ef4444' }}>*</span>
            <select
              {...register('personTypeId', { valueAsNumber: true })}
              disabled={enviando}
            >
              {tiposPersona.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.nombre}
                </option>
              ))}
            </select>
            {errors.personTypeId && (
              <span className="field-error">{errors.personTypeId.message}</span>
            )}
          </label>
        )}

        {/* ── Celular ── */}
        <label>
          Celular <span style={{ color: '#ef4444' }}>*</span>
          <input
            type="tel"
            placeholder="Ej: 3001234567"
            maxLength={10}
            {...register('celular')}
            disabled={enviando}
          />
          {errors.celular && (
            <span className="field-error">{errors.celular.message}</span>
          )}
        </label>

        {/* ── Correo (opcional) ── */}
        <label>
          Correo electrónico{' '}
          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
            (opcional)
          </span>
          <input
            type="email"
            placeholder="Ej: juan@correo.com"
            {...register('email')}
            disabled={enviando}
          />
          {errors.email && (
            <span className="field-error">{errors.email.message}</span>
          )}
        </label>

        {/* ── Dirección (opcional) ── */}
        <label>
          Dirección{' '}
          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
            (opcional)
          </span>
          <input
            placeholder="Ej: Cra 5 # 12-34, Mocoa"
            {...register('direccion')}
            disabled={enviando}
          />
          {errors.direccion && (
            <span className="field-error">{errors.direccion.message}</span>
          )}
        </label>

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
          }}
        >
          {enviando && (
            <Loader2
              size={16}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          )}
          {enviando ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </form>
      </Modal>
    </div>
  )
}
