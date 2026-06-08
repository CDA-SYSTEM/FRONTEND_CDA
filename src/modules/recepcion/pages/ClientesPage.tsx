import { useState } from 'react'
import { AlertCircle, Loader2, Plus, Users, CheckCircle, X } from 'lucide-react'
import { ClienteBuscador } from '@/modules/recepcion/components/ClienteBuscador'
import { ClienteDetalle } from '@/modules/recepcion/components/ClienteDetalle'
import { ClienteConfirmacion } from '@/modules/recepcion/components/ClienteConfirmacion'
import { Modal } from '@/core/components/Modal'
import { useRegistrarCliente } from '@/modules/recepcion/hooks/useRegistrarCliente'
import { useBuscarCliente } from '@/modules/recepcion/hooks/useBuscarCliente'
import { inferirCodigo } from '@/modules/recepcion/domain/recepcion.schema'
import { CustomSelect } from '@/shared/components/CustomSelect'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import './ClientesPage.css'

export function ClientesPage() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClientePersonaNatural | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const handleEliminarCliente = async (cliente: ClientePersonaNatural) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${cliente.nombre} ${cliente.apellido}?`)) return
    try {
      await clienteService.eliminarCliente(cliente.id)
      showToast('Cliente eliminado con éxito', 'success')
      buscador.refrescar()
    } catch (err) {
      console.error(err)
      showToast('No se pudo eliminar el cliente.', 'error')
    }
  }

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
    setValue,
  } = form

  const documentTypeId = watch('documentTypeId')
  const personTypeId = watch('personTypeId')
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
    <div className="clientes-root">

      {/* ── Cabecera ── */}
      <div className="cl-header">
        <div className="cl-header-info">
          <div className="cl-header-icon">
            <Users size={22} />
          </div>
          <div>
            <h1 className="cl-header-title">Gestión de Clientes</h1>
            <p className="cl-header-desc">Registro y administración de clientes</p>
          </div>
        </div>
        <button
          className="cl-btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* ── Contenido: Detalle o Buscador ── */}
      {clienteSeleccionado ? (
        <ClienteDetalle
          clienteInicial={clienteSeleccionado}
          onVolver={() => setClienteSeleccionado(null)}
          onActualizado={(keepOpen?: boolean) => {
            showToast('Cliente actualizado con éxito', 'success')
            if (!keepOpen) {
              setClienteSeleccionado(null)
            }
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
          onEliminarCliente={handleEliminarCliente}
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
      <form onSubmit={onSubmit} className="cliente-modal-form">
        <div className="cliente-modal-body">
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

          {/* ── Nombre y Apellido ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="cl-field">
              <span className="cl-field-label">
                Nombre <span className="cl-field-required">*</span>
              </span>
              <input
                className="cl-input"
                placeholder="Ej: Juan Carlos"
                {...register('nombre')}
                disabled={enviando}
              />
              {errors.nombre && (
                <span className="cl-field-error">{errors.nombre.message}</span>
              )}
            </div>

            <div className="cl-field">
              <span className="cl-field-label">
                Apellido <span className="cl-field-required">*</span>
              </span>
              <input
                className="cl-input"
                placeholder="Ej: Pérez Gómez"
                {...register('apellido')}
                disabled={enviando}
              />
              {errors.apellido && (
                <span className="cl-field-error">{errors.apellido.message}</span>
              )}
            </div>
          </div>

          {/* ── Tipo de documento e Identity ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="cl-field">
              <span className="cl-field-label">
                Tipo de documento <span className="cl-field-required">*</span>
              </span>
              <CustomSelect
                options={tiposDocumento.map((tipo) => ({ value: String(tipo.id), label: tipo.nombre }))}
                value={String(documentTypeId || '')}
                onChange={(val) => setValue('documentTypeId', Number(val), { shouldValidate: true, shouldDirty: true })}
              />
              {errors.documentTypeId && (
                <span className="cl-field-error">
                  {errors.documentTypeId.message}
                </span>
              )}
            </div>

            <div className="cl-field">
              <span className="cl-field-label">
                Número de documento <span className="cl-field-required">*</span>
              </span>
              <input
                className="cl-input"
                placeholder={placeholderIdentity}
                {...register('identity')}
                disabled={enviando}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.identity && (
                <span className="cl-field-error">{errors.identity.message}</span>
              )}
            </div>
          </div>

          {/* ── Tipo de persona (oculto si solo hay uno) ── */}
          {tiposPersona.length > 1 && (
            <div className="cl-field">
              <span className="cl-field-label">
                Tipo de persona <span className="cl-field-required">*</span>
              </span>
              <CustomSelect
                options={tiposPersona.map((tp) => ({ value: String(tp.id), label: tp.nombre }))}
                value={String(personTypeId || '')}
                onChange={(val) => setValue('personTypeId', Number(val), { shouldValidate: true, shouldDirty: true })}
              />
              {errors.personTypeId && (
                <span className="cl-field-error">{errors.personTypeId.message}</span>
              )}
            </div>
          )}

          {/* ── Celular ── */}
          <div className="cl-field">
            <span className="cl-field-label">
              Celular <span className="cl-field-required">*</span>
            </span>
            <input
              className="cl-input"
              type="tel"
              placeholder="Ej: 3001234567"
              maxLength={10}
              {...register('celular')}
              disabled={enviando}
            />
            {errors.celular && (
              <span className="cl-field-error">{errors.celular.message}</span>
            )}
          </div>

          {/* ── Correo (opcional) ── */}
          <div className="cl-field">
            <span className="cl-field-label">
              Correo electrónico
              <span className="cl-field-optional">(opcional)</span>
            </span>
            <input
              className="cl-input"
              type="email"
              placeholder="Ej: juan@correo.com"
              {...register('email')}
              disabled={enviando}
            />
            {errors.email && (
              <span className="cl-field-error">{errors.email.message}</span>
            )}
          </div>

          {/* ── Dirección (opcional) ── */}
          <div className="cl-field">
            <span className="cl-field-label">
              Dirección
              <span className="cl-field-optional">(opcional)</span>
            </span>
            <input
              className="cl-input"
              placeholder="Ej: Cra 5 # 12-34, Mocoa"
              {...register('direccion')}
              disabled={enviando}
            />
            {errors.direccion && (
              <span className="cl-field-error">{errors.direccion.message}</span>
            )}
          </div>

          {/* ── Fecha de nacimiento (opcional) ── */}
          <div className="cl-field form-group-fecha">
            <span className="cl-field-label">
              Fecha de nacimiento
              <span className="cl-field-optional">(opcional)</span>
            </span>
            <input
              className="cl-input"
              type="date"
              {...register('birthDate')}
              disabled={enviando}
            />
            {errors.birthDate && (
              <span className="cl-field-error">{errors.birthDate.message}</span>
            )}
          </div>
        </div>

        {/* ── Botón de envío ── */}
        <div className="cliente-modal-footer">
          <button
            type="submit"
            className="cl-btn-submit"
            disabled={enviando}
          >
            {enviando && (
              <Loader2
                size={18}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            )}
            {enviando ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </form>
      </Modal>

      {/* Notificación Toast */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close-btn" onClick={() => setToast(null)} type="button" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2, display: 'flex', marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
