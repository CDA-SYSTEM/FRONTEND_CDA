import { useState } from 'react'
import { AlertCircle, Loader2, Plus, Users } from 'lucide-react'
import { ClienteBuscador } from '@/modules/recepcion/components/ClienteBuscador'
import { ClienteDetalle } from '@/modules/recepcion/components/ClienteDetalle'
import { ClienteConfirmacion } from '@/modules/recepcion/components/ClienteConfirmacion'
import { Modal } from '@/core/components/Modal'
import { useRegistrarCliente } from '@/modules/recepcion/hooks/useRegistrarCliente'
import { useBuscarCliente } from '@/modules/recepcion/hooks/useBuscarCliente'
import { inferirCodigo } from '@/modules/recepcion/domain/recepcion.schema'
import { CustomSelect } from '@/shared/components/CustomSelect'
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

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* ── Nombre y Apellido ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Nombre <span style={{ color: '#ef4444', display: 'inline' }}>*</span>
            </span>
            <input
              placeholder="Ej: Juan Carlos"
              {...register('nombre')}
              disabled={enviando}
              style={{
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {errors.nombre && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.nombre.message}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Apellido <span style={{ color: '#ef4444', display: 'inline' }}>*</span>
            </span>
            <input
              placeholder="Ej: Pérez Gómez"
              {...register('apellido')}
              disabled={enviando}
              style={{
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {errors.apellido && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.apellido.message}</span>
            )}
          </div>
        </div>

        {/* ── Tipo de documento e Identity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Tipo de documento <span style={{ color: '#ef4444', display: 'inline' }}>*</span>
            </span>
            <CustomSelect
              options={tiposDocumento.map((tipo) => ({ value: String(tipo.id), label: tipo.nombre }))}
              value={String(documentTypeId || '')}
              onChange={(val) => setValue('documentTypeId', Number(val), { shouldValidate: true, shouldDirty: true })}
            />
            {errors.documentTypeId && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>
                {errors.documentTypeId.message}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Número de documento <span style={{ color: '#ef4444', display: 'inline' }}>*</span>
            </span>
            <input
              placeholder={placeholderIdentity}
              {...register('identity')}
              disabled={enviando}
              style={{
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                fontSize: '0.95rem',
                outline: 'none',
                textTransform: 'uppercase',
              }}
            />
            {errors.identity && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.identity.message}</span>
            )}
          </div>
        </div>

        {/* ── Tipo de persona (oculto si solo hay uno) ── */}
        {tiposPersona.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Tipo de persona <span style={{ color: '#ef4444', display: 'inline' }}>*</span>
            </span>
            <CustomSelect
              options={tiposPersona.map((tp) => ({ value: String(tp.id), label: tp.nombre }))}
              value={String(personTypeId || '')}
              onChange={(val) => setValue('personTypeId', Number(val), { shouldValidate: true, shouldDirty: true })}
            />
            {errors.personTypeId && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.personTypeId.message}</span>
            )}
          </div>
        )}

        {/* ── Celular ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
            Celular <span style={{ color: '#ef4444', display: 'inline' }}>*</span>
          </span>
          <input
            type="tel"
            placeholder="Ej: 3001234567"
            maxLength={10}
            {...register('celular')}
            disabled={enviando}
            style={{
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              padding: '10px 14px',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          {errors.celular && (
            <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.celular.message}</span>
          )}
        </div>

        {/* ── Correo (opcional) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
            Correo electrónico{' '}
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 400 }}>
              (opcional)
            </span>
          </span>
          <input
            type="email"
            placeholder="Ej: juan@correo.com"
            {...register('email')}
            disabled={enviando}
            style={{
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              padding: '10px 14px',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          {errors.email && (
            <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.email.message}</span>
          )}
        </div>

        {/* ── Dirección (opcional) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
            Dirección{' '}
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 400 }}>
              (opcional)
            </span>
          </span>
          <input
            placeholder="Ej: Cra 5 # 12-34, Mocoa"
            {...register('direccion')}
            disabled={enviando}
            style={{
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              padding: '10px 14px',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          {errors.direccion && (
            <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>{errors.direccion.message}</span>
          )}
        </div>

        {/* ── Botón de envío ── */}
        <button
          type="submit"
          disabled={enviando}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: '1rem',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #155DFC 0%, #0c4ad1 100%)',
            color: '#fff',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 4px 12px rgba(21, 93, 252, 0.2)',
            transition: 'opacity 0.2s',
            opacity: enviando ? 0.7 : 1,
            width: '100%',
          }}
        >
          {enviando && (
            <Loader2
              size={18}
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
