import { useState, useRef, useEffect } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Image,
  Loader2,
  Search,
  User,
  UserPlus,
  X,
  Plus,
  Bike,
  Truck,
  Gauge,
  Pencil,
} from 'lucide-react'
import { useCrearRecepcion, type PasoWizard } from '@/modules/recepcion/hooks/useCrearRecepcion'
import { useBuscarCliente } from '@/modules/recepcion/hooks/useBuscarCliente'
import { SignaturePad } from '@/shared/components/SignaturePad'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'
import type { Vehiculo } from '@/modules/recepcion/domain/recepcion.types'
import type { Usuario } from '@/modules/usuarios/domain/usuario.types'
import { Modal } from '@/core/components/Modal'
import { useRegistrarCliente } from '@/modules/recepcion/hooks/useRegistrarCliente'
import { inferirCodigo } from '@/modules/recepcion/domain/recepcion.schema'
import { CustomSelect } from '@/shared/components/CustomSelect'
import { useRegistrarVehiculo } from '@/modules/vehiculo/hooks/useRegistrarVehiculo'
import { vehiculoService } from '@/modules/vehiculo/services/vehiculoService'
import type { CatalogoItem } from '@/modules/vehiculo/domain/vehiculo.types'

interface Props {
  onCancelar: () => void
}

const PASOS: { key: PasoWizard; label: string }[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'detalle', label: 'Detalle' },
  { key: 'condiciones', label: 'Condiciones' },
  { key: 'confirmacion', label: 'Confirmación' },
]

const INDICE_PASO: Record<PasoWizard, number> = {
  cliente: 0,
  vehiculo: 1,
  detalle: 2,
  condiciones: 3,
  confirmacion: 4,
}

export function RecepcionWizard({ onCancelar }: Props) {
  const wizard = useCrearRecepcion()
  const buscador = useBuscarCliente()
  const [clienteNuevoModal, setClienteNuevoModal] = useState(false)

  const pasoActual = INDICE_PASO[wizard.paso]

  return (
    <div className="recepcion-wizard-container">
      <div className="recepcion-sticky-header">
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
                Nueva Recepción
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                Registre el ingreso de un vehículo para iniciar la revisión técnico-mecánica
              </p>
          </div>
          <button
            onClick={onCancelar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <X size={16} />
            Cancelar
          </button>
        </div>

        {/* Barra de progreso */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: '#fff',
            borderRadius: 12,
            padding: '12px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {PASOS.map((p, i) => (
            <div
              key={p.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: i <= pasoActual ? '#2563eb' : '#e2e8f0',
                  color: i <= pasoActual ? '#fff' : '#94a3b8',
                  flexShrink: 0,
                }}
              >
                {i < pasoActual ? (
                  <CheckCircle2 size={16} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: i === pasoActual ? 600 : 400,
                  color: i <= pasoActual ? '#1e293b' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.label}
              </span>
              {i < PASOS.length - 1 && (
                <ChevronRight size={16} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido según paso */}
      <div className="recepcion-step-content-scroll">
        {wizard.cargandoCatalogos ? (
          <article className="panel" style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <p style={{ marginTop: 12, color: '#6b7280' }}>Cargando...</p>
          </article>
        ) : wizard.errorCatalogo ? (
          <article className="panel">
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#991b1b' }}>
              <AlertCircle size={18} />
              <span>{wizard.errorCatalogo}</span>
            </div>
          </article>
        ) : wizard.paso === 'cliente' ? (
          <PasoCliente
            buscador={buscador}
            onSeleccionar={wizard.seleccionarCliente}
            onNuevoCliente={() => setClienteNuevoModal(true)}
            clienteNuevoModal={clienteNuevoModal}
            onCloseModal={() => setClienteNuevoModal(false)}
              onClienteCreado={(c: ClientePersonaNatural) => {
              setClienteNuevoModal(false)
              wizard.seleccionarCliente(c)
            }}
          />
        ) : wizard.paso === 'vehiculo' ? (
          <PasoVehiculo
            vehiculos={wizard.vehiculos}
            cargando={wizard.cargandoVehiculos}
            onSeleccionar={wizard.seleccionarVehiculo}
            onSaltar={wizard.irADetalleSinVehiculo}
            cliente={wizard.cliente}
            onVolver={wizard.volver}
            onVehiculoCreado={wizard.recargarVehiculos}
          />
        ) : wizard.paso === 'detalle' ? (
          <PasoDetalle
            mileage={wizard.mileage}
            setMileage={wizard.setMileage}
            revisionType={wizard.revisionType}
            setRevisionType={wizard.setRevisionType}
            customerType={wizard.customerType}
            setCustomerType={wizard.setCustomerType}
            tiposRevision={wizard.tiposRevision}
            tiposCliente={wizard.tiposCliente}
            usuarioAsignadoId={wizard.usuarioAsignadoId}
            setUsuarioAsignadoId={wizard.setUsuarioAsignadoId}
            usuariosAsignables={wizard.usuariosAsignables}
            cargandoUsuariosAsignables={wizard.cargandoUsuariosAsignables}
            errorUsuariosAsignables={wizard.errorUsuariosAsignables}
            onSiguiente={wizard.irACondiciones}
            onVolver={wizard.volver}
          />
        ) : wizard.paso === 'condiciones' ? (
          <PasoCondiciones
            observations={wizard.observations}
            setObservations={wizard.setObservations}
            photoFile={wizard.photoFile}
            setPhotoFile={wizard.setPhotoFile}
            signatureBlob={wizard.signatureBlob}
            setSignatureBlob={wizard.setSignatureBlob}
            confirmacionAcuerdo={wizard.confirmacionAcuerdo}
            setConfirmacionAcuerdo={wizard.setConfirmacionAcuerdo}
              tires={wizard.tires}
              setTires={wizard.setTires}
            estadoEnvio={wizard.estadoEnvio}
            errorEnvio={wizard.errorEnvio}
            tintedWindows={wizard.tintedWindows}
            setTintedWindows={wizard.setTintedWindows}
            armoredVehicle={wizard.armoredVehicle}
            setArmoredVehicle={wizard.setArmoredVehicle}
            brakeFluidSightGlass={wizard.brakeFluidSightGlass}
            setBrakeFluidSightGlass={wizard.setBrakeFluidSightGlass}
            onSubmit={wizard.enviar}
            onVolver={wizard.volver}
          />
        ) : wizard.paso === 'confirmacion' && wizard.ordenCreada ? (
          <PasoConfirmacion
            orden={wizard.ordenCreada}
            cliente={wizard.cliente}
            vehiculo={wizard.vehiculo}
            observations={wizard.observations}
            tieneFoto={!!wizard.photoFile}
            tieneFirma={!!wizard.signatureBlob}
            onNuevaOrden={wizard.reset}
            onSalir={onCancelar}
          />
        ) : null}
      </div>
    </div>
  )
}

/* ── Paso 1: Seleccionar Cliente ──────────────────────────────────────────── */

interface PasoClienteProps {
  buscador: ReturnType<typeof useBuscarCliente>
  onSeleccionar: (c: ClientePersonaNatural) => void
  onNuevoCliente: () => void
  clienteNuevoModal: boolean
  onCloseModal: () => void
  onClienteCreado: (c: ClientePersonaNatural) => void
}

function PasoCliente({
  buscador,
  onSeleccionar,
  onNuevoCliente,
  clienteNuevoModal,
  onCloseModal,
  onClienteCreado,
}: PasoClienteProps) {
  const {
    form,
    estado,
    clienteGuardado,
    errorServidor,
    onSubmit,
    resetFormulario,
    tiposDocumento,
    tiposPersona,
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

  useEffect(() => {
    if (estado === 'exito' && clienteGuardado) {
      onClienteCreado(clienteGuardado)
      resetFormulario()
    }
  }, [estado, clienteGuardado, onClienteCreado, resetFormulario])

  return (
    <article className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Seleccionar Cliente</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Busque un cliente existente o registre uno nuevo
          </p>
        </div>
        <button
          onClick={onNuevoCliente}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}
        >
          <UserPlus size={16} />
          Nuevo Cliente
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
          {buscador.cargando ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={18} />
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, documento o placa..."
          value={buscador.query}
          onChange={(e) => buscador.setQuery(e.target.value)}
          style={{ paddingLeft: 42, height: 46, fontSize: '0.95rem', width: '100%' }}
        />
      </div>

      {buscador.error && (
        <div style={{ color: '#ef4444', marginBottom: 12, fontSize: '0.9rem' }}>{buscador.error}</div>
      )}

      {buscador.resultados.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Documento</th>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Celular</th>
                <th style={{ padding: '12px 16px', width: 100 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {buscador.resultados.map((c: ClientePersonaNatural) => (
                <tr key={c.id}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.identity}</td>
                  <td style={{ padding: '12px 16px' }}>{c.nombre} {c.apellido}</td>
                  <td style={{ padding: '12px 16px' }}>{c.celular}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => onSeleccionar(c)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        background: '#e0e7ff',
                        color: '#4f46e5',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-pagination-wrapper">
            <button
              type="button"
              className="recepcion-pagination-text-btn"
              disabled={buscador.pagina === 0}
              onClick={() => buscador.setPagina(buscador.pagina - 1)}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
              Página {buscador.pagina + 1} de {buscador.totalPages}
            </span>
            <button
              type="button"
              className="recepcion-pagination-text-btn"
              disabled={buscador.pagina >= buscador.totalPages - 1}
              onClick={() => buscador.setPagina(buscador.pagina + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : !buscador.cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <User size={36} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <p>No se encontraron clientes. Puede registrar uno nuevo o cambiar la búsqueda.</p>
        </div>
      ) : null}

      {/* Modal de Registro de Cliente */}
      <Modal
        isOpen={clienteNuevoModal}
        onClose={onCloseModal}
        title="Registro de Cliente"
        maxWidth="800px"
        className="cliente-registro-window"
      >
        {estado === 'cargando' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando tipos de documentos...</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', margin: 0 }}>
            <div className="cliente-registro-body">
              <p style={{ color: '#6b7280', marginBottom: 20 }}>
                Los campos marcados con <span style={{ color: '#ef4444' }}>*</span> son obligatorios.
              </p>

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

              {/* Nombre y Apellido */}
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

              {/* Tipo de documento e Identity */}
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

              {/* Tipo de persona */}
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

              {/* Celular */}
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

              {/* Correo (opcional) */}
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

              {/* Dirección (opcional) */}
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
            </div>

            <div className="cliente-registro-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={enviando}
                onClick={onCloseModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={enviando}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
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
                }}
              >
                {enviando && (
                  <Loader2
                    size={18}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                )}
                {enviando ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </article>
  )
}

  interface PasoVehiculoProps {
  vehiculos: Vehiculo[]
  cargando: boolean
  onSeleccionar: (v: { id: number | string; placa: string }) => void
  onSaltar: () => void
  cliente: any
  onVolver: () => void
  onVehiculoCreado: () => Promise<void>
}

function PasoVehiculo({
  vehiculos,
  cargando,
  onSeleccionar,
  onSaltar,
  cliente,
  onVolver,
  onVehiculoCreado,
}: PasoVehiculoProps) {
  const [vehiculoNuevoModal, setVehiculoNuevoModal] = useState(false)

  const {
    form,
    estado,
    errorCatalogo,
    errorServidor,
    vehiculoGuardado,
    seleccionarCliente,
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

  // Pre-seleccionar el cliente actual al abrir el modal
  useEffect(() => {
    if (vehiculoNuevoModal && cliente) {
      seleccionarCliente(cliente)
    }
  }, [vehiculoNuevoModal, cliente, seleccionarCliente])

  // Recargar la lista de vehículos cuando se crea exitosamente
  useEffect(() => {
    if (estado === 'exito' && vehiculoGuardado) {
      onVehiculoCreado()
      setVehiculoNuevoModal(false)
      resetFormulario()
    }
  }, [estado, vehiculoGuardado, onVehiculoCreado, resetFormulario])

  const [localMarcas, setLocalMarcas] = useState<CatalogoItem[]>([])
  const [localClases, setLocalClases] = useState<CatalogoItem[]>([])
  const [localLineas, setLocalLineas] = useState<CatalogoItem[]>([])
  const [localColores, setLocalColores] = useState<CatalogoItem[]>([])
  const [localCombustibles, setLocalCombustibles] = useState<CatalogoItem[]>([])
  const [localTiposVehiculo, setLocalTiposVehiculo] = useState<CatalogoItem[]>([])
  const [localTiposServicio, setLocalTiposServicio] = useState<CatalogoItem[]>([])

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

  const handleCloseModal = () => {
    resetFormulario()
    setVehiculoNuevoModal(false)
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



  const clienteNombre = cliente ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() : ''

  return (
    <article className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver} style={{ padding: 6, background: '#e2e8f0', color: '#475569', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Seleccionar Vehículo</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Cliente: <strong>{clienteNombre}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setVehiculoNuevoModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}
        >
          <Plus size={16} />
          Nuevo Vehículo
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
        </div>
      ) : vehiculos.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Placa</th>
                <th style={{ padding: '12px 16px' }}>Marca</th>
                <th style={{ padding: '12px 16px' }}>Línea</th>
                <th style={{ padding: '12px 16px' }}>Modelo</th>
                <th style={{ padding: '12px 16px', width: 100 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, textTransform: 'uppercase' }}>{v.placa}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {typeof v.marca === 'object' && v.marca ? String((v.marca as { nombre?: string }).nombre ?? (v.marca as { name?: string }).name ?? '') : String(v.marca ?? '')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {typeof v.linea === 'object' && v.linea ? String((v.linea as { nombre?: string }).nombre ?? (v.linea as { name?: string }).name ?? '') : String(v.linea ?? '')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{v.modelo}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => onSeleccionar({ id: v.id, placa: v.placa })}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        background: '#e0e7ff',
                        color: '#4f46e5',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <Car size={36} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <p>Este cliente no tiene vehículos registrados.</p>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={onSaltar}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}
        >
          Registrar vehiculo después
        </button>
      </div>

      {/* Modal de Registro de Vehículo */}
      <Modal
        isOpen={vehiculoNuevoModal}
        onClose={handleCloseModal}
        title="Registro de Vehículo"
        maxWidth="800px"
      >
        {estado === 'cargando' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando datos de catálogos de vehículos...</span>
          </div>
        ) : (
          <div>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              Los campos marcados con <span style={{ color: '#ef4444' }}>*</span> son obligatorios.
            </p>

            {/* Error de catálogos */}
            {errorCatalogo && (
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
                <span>{errorCatalogo}</span>
              </div>
            )}

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
              {/* Cliente Info (Solo lectura) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  padding: '14px 18px',
                  marginBottom: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cliente Propietario
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{clienteNombre}</strong>
                <span style={{ color: '#64748b', marginLeft: 12, fontSize: '0.9rem', fontWeight: 500 }}>
                  ({cliente?.identity})
                </span>
              </div>

              {/* Identificación del Vehículo */}
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

              {/* Indicador de formato de inspección */}
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

              {/* Cilindraje (solo para motos) */}
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

              {/* Marca, Línea y Clase */}
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

              {/* Modelo, Combustible, Servicio */}
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

              {/* Botones de envío / cancelación */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, width: '100%' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 20px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    transition: 'background-color 0.2s',
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
                    padding: '11px 22px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #155DFC 0%, #0c4ad1 100%)',
                    color: '#fff',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(21, 93, 252, 0.2)',
                    transition: 'opacity 0.2s',
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
    </article>
  )
}

/* ── Paso 3: Detalle de la orden ──────────────────────────────────────────── */

interface PasoDetalleProps {
  mileage: string
  setMileage: (v: string) => void
  revisionType: string
  setRevisionType: (v: string) => void
  customerType: string
  setCustomerType: (v: string) => void
  tiposRevision: { id: number | string; nombre: string }[]
  tiposCliente: { id: number | string; nombre: string }[]
  usuarioAsignadoId: string
  setUsuarioAsignadoId: (v: string) => void
  usuariosAsignables: Usuario[]
  cargandoUsuariosAsignables: boolean
  errorUsuariosAsignables: string | null
  onSiguiente: () => void
  onVolver: () => void
}

function labelPersonal(u: Usuario): string {
  const nombre = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()
  if (nombre && u.email) return `${nombre} (${u.email})`
  return nombre || u.email || `Personal #${u.id}`
}

function PasoDetalle({
  mileage, setMileage, revisionType, setRevisionType, customerType, setCustomerType,
  tiposRevision, tiposCliente,
  usuarioAsignadoId, setUsuarioAsignadoId,
  usuariosAsignables, cargandoUsuariosAsignables, errorUsuariosAsignables,
  onSiguiente, onVolver,
}: PasoDetalleProps) {
  const puedeContinuar =
    Boolean(revisionType && customerType && usuarioAsignadoId && !cargandoUsuariosAsignables)

  return (
    <article className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onVolver} style={{ padding: 6, background: '#e2e8f0', color: '#475569', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Detalle de la Recepción</h2>
      </div>

      <div className="form-grid">
        <label>
          Kilometraje actual (km)
          <input
            type="number"
            placeholder="Ej: 50000"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            min={0}
          />
        </label>

        <label>
          Tipo de revisión <span style={{ color: '#ef4444' }}>*</span>
          <CustomSelect
            options={tiposRevision.map((t) => ({ value: String(t.id), label: t.nombre }))}
            value={String(revisionType)}
            onChange={(val) => setRevisionType(val)}
            placeholder="Seleccione..."
          />
        </label>

        <label>
          Tipo de cliente <span style={{ color: '#ef4444' }}>*</span>
          <CustomSelect
            options={tiposCliente.map((t) => ({ value: String(t.id), label: t.nombre }))}
            value={String(customerType)}
            onChange={(val) => setCustomerType(val)}
            placeholder="Seleccione..."
          />
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 12 }}>
          <div style={{ padding: '10px 12px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.85rem' }}>
            La recepción asigna personal con rol <strong>Operario</strong>. La lista de usuarios está filtrada automáticamente.
          </div>

          <label>
            <span style={{ fontWeight: 500 }}>Operario a asignar <span style={{ color: '#ef4444' }}>*</span></span>
            <CustomSelect
              options={usuariosAsignables.map((u) => ({ value: String(u.id), label: labelPersonal(u) }))}
              value={String(usuarioAsignadoId)}
              onChange={(val) => setUsuarioAsignadoId(val)}
              placeholder="Seleccione operario..."
              disabled={cargandoUsuariosAsignables || usuariosAsignables.length === 0}
            />
            {cargandoUsuariosAsignables && (
              <span style={{ marginTop: 4, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>
                Cargando operarios disponibles...
              </span>
            )}
            {errorUsuariosAsignables && (
              <span style={{ marginTop: 4, color: '#dc2626', fontSize: '0.8rem', display: 'block' }}>
                {errorUsuariosAsignables}
              </span>
            )}
          </label>
        </div>

        <div style={{ marginTop: 8 }}>
          <button
            onClick={onSiguiente}
            disabled={!puedeContinuar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 24px',
              fontSize: '1rem',
              opacity: !puedeContinuar ? 0.7 : 1,
            }}
          >
            <ArrowRight size={18} />
            Siguiente — Condiciones de ingreso
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Paso 4: Condiciones de Ingreso ───────────────────────────────────────── */

interface PasoCondicionesProps {
  observations: string
  setObservations: (v: string) => void
  photoFile: File | null
  setPhotoFile: (f: File | null) => void
  signatureBlob: Blob | null
  setSignatureBlob: (b: Blob | null) => void
  confirmacionAcuerdo: boolean
  setConfirmacionAcuerdo: (v: boolean) => void
  tires: { position: string; code: string; tire_pressure: number }[]
  setTires: (v: { position: string; code: string; tire_pressure: number }[]) => void
  estadoEnvio: 'idle' | 'enviando' | 'exito' | 'error'
  errorEnvio: string | null
  tintedWindows: string
  setTintedWindows: (v: string) => void
  armoredVehicle: string
  setArmoredVehicle: (v: string) => void
  brakeFluidSightGlass: string
  setBrakeFluidSightGlass: (v: string) => void
  onSubmit: () => void
  onVolver: () => void
}

function PasoCondiciones({
  observations, setObservations,
  photoFile, setPhotoFile,
  setSignatureBlob,
  confirmacionAcuerdo, setConfirmacionAcuerdo,
  tires, setTires,
  estadoEnvio, errorEnvio,
  tintedWindows, setTintedWindows,
  armoredVehicle, setArmoredVehicle,
  brakeFluidSightGlass, setBrakeFluidSightGlass,
  onSubmit, onVolver,
}: PasoCondicionesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const presionesInvalidas = tires.some((t) => !Number.isFinite(t.tire_pressure) || t.tire_pressure <= 0)
  const puedeFinalizar = confirmacionAcuerdo && !presionesInvalidas && estadoEnvio !== 'enviando'

  const actualizarPresion = (index: number, value: string) => {
    setTires(
      tires.map((tire, tireIndex) => (
        tireIndex === index
          ? { ...tire, tire_pressure: Number(value) || 0 }
          : tire
      )),
    )
  }

  const etiquetaLlanta = (position: string) => {
    switch (position) {
      case 'FRONT_LEFT': return 'Delantera izquierda'
      case 'FRONT_RIGHT': return 'Delantera derecha'
      case 'REAR_LEFT': return 'Trasera izquierda'
      case 'REAR_RIGHT': return 'Trasera derecha'
      default: return position
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5 MB.')
        return
      }
      if (!['image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
        alert('Formato no permitido. Use JPG, PNG o HEIC.')
        return
      }
      setPhotoFile(file)
    }
  }

  return (
    <article className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onVolver} style={{ padding: 6, background: '#e2e8f0', color: '#475569', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Condiciones de Ingreso</h2>
      </div>

      {errorEnvio && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: '0.9rem' }}>
          <AlertCircle size={16} />
          <span>{errorEnvio}</span>
        </div>
      )}

      <div className="form-grid">
        {/* Condiciones del vehículo */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <label>
            <span style={{ fontWeight: 500 }}>Vidrios polarizados</span>
            <CustomSelect
              options={[
                { value: 'NO', label: 'NO' },
                { value: 'SI', label: 'SÍ' },
                { value: 'NO_APLICA', label: 'NO APLICA' },
              ]}
              value={tintedWindows}
              onChange={(val) => setTintedWindows(val)}
              disabled={estadoEnvio === 'enviando'}
            />
          </label>
          <label>
            <span style={{ fontWeight: 500 }}>Vehículo blindado</span>
            <CustomSelect
              options={[
                { value: 'NO', label: 'NO' },
                { value: 'SI', label: 'SÍ' },
                { value: 'NO_APLICA', label: 'NO APLICA' },
              ]}
              value={armoredVehicle}
              onChange={(val) => setArmoredVehicle(val)}
              disabled={estadoEnvio === 'enviando'}
            />
          </label>
          <label>
            <span style={{ fontWeight: 500 }}>Depósito líquido frenos</span>
            <CustomSelect
              options={[
                { value: 'BUEN_ESTADO', label: 'BUEN ESTADO' },
                { value: 'MAL_ESTADO', label: 'MAL ESTADO' },
                { value: 'NO_APLICA', label: 'NO APLICA' },
              ]}
              value={brakeFluidSightGlass}
              onChange={(val) => setBrakeFluidSightGlass(val)}
              disabled={estadoEnvio === 'enviando'}
            />
          </label>
        </div>

        {/* Presión de llantas */}
        <section style={{ gridColumn: '1 / -1', padding: 18, borderRadius: 16, border: '1px solid #bfdbfe', background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Presión de llantas</h3>
              <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.9rem' }}>
                Registre la presión en PSI de cada llanta antes de finalizar la recepción.
              </p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: '0.82rem' }}>
              {tires.length} llanta(s)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            {tires.map((tire, index) => {
              const invalida = !Number.isFinite(tire.tire_pressure) || tire.tire_pressure <= 0
              return (
                <article
                  key={`${tire.position}-${index}`}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${invalida ? '#fecaca' : '#bfdbfe'}`,
                    background: invalida ? '#fff1f2' : '#ffffff',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {etiquetaLlanta(tire.position)}
                      </div>
                      <div style={{ marginTop: 4, color: '#0f172a', fontWeight: 700 }}>{tire.code || 'Código pendiente'}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', borderRadius: 999, background: invalida ? '#fee2e2' : '#dcfce7', color: invalida ? '#991b1b' : '#166534', fontWeight: 700, fontSize: '0.78rem' }}>
                      {invalida ? 'Requerida' : 'OK'}
                    </span>
                  </div>

                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Presión PSI</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        inputMode="decimal"
                        value={tire.tire_pressure}
                        onChange={(e) => actualizarPresion(index, e.target.value)}
                        placeholder="Ej: 32.5"
                        disabled={estadoEnvio === 'enviando'}
                        style={{ paddingRight: 56, borderColor: invalida ? '#fca5a5' : undefined }}
                      />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.82rem', fontWeight: 700 }}>PSI</span>
                    </div>
                  </label>
                </article>
              )
            })}
          </div>

          {presionesInvalidas && (
            <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: '0.86rem' }}>
              Complete la presión de todas las llantas para poder continuar.
            </p>
          )}
        </section>

        {/* Observaciones */}
        <label style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <FileText size={16} color="#64748b" />
            <span style={{ fontWeight: 500 }}>Observaciones del estado del vehículo</span>
          </div>
          <textarea
            placeholder="Describa el estado visual del vehículo al ingreso (combustible, daños previos, accesorios, etc.)"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={4}
            style={{ width: '100%', resize: 'vertical', minHeight: 80 }}
            disabled={estadoEnvio === 'enviando'}
          />
        </label>

        {/* Foto de ingreso */}
        <label style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Camera size={16} color="#64748b" />
            <span style={{ fontWeight: 500 }}>Foto del estado de ingreso</span>
            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>(opcional — JPG, PNG, HEIC, máx 5 MB)</span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={estadoEnvio === 'enviando'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              <Image size={16} />
              {photoFile ? 'Cambiar foto' : 'Seleccionar archivo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {photoFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={URL.createObjectURL(photoFile)}
                    alt="Vista previa"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {photoFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  X
                </button>
              </div>
            )}
          </div>
        </label>

        {/* Firma digital */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SignaturePad
            onSave={(blob) => setSignatureBlob(blob)}
            height={140}
          />
        </div>

        {/* Confirmación de acuerdo */}
        <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={confirmacionAcuerdo}
            onChange={(e) => setConfirmacionAcuerdo(e.target.checked)}
            disabled={estadoEnvio === 'enviando'}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <div>
            <span style={{ fontWeight: 500, color: '#92400e', fontSize: '0.9rem' }}>
              Confirmo que las condiciones de ingreso registradas reflejan el estado real del vehículo al momento de la recepción
            </span>
            <span style={{ color: '#a16207', fontSize: '0.8rem', display: 'block', marginTop: 2 }}>
              Esta confirmación tiene validez como acuerdo entre el operario y el cliente
            </span>
          </div>
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gap: 2 }}>
            <strong style={{ color: '#0f172a' }}>Aceptación requerida</strong>
            <span style={{ color: '#64748b', fontSize: '0.86rem' }}>
              No podrá registrar la recepción si falta la presión PSI o la confirmación de condiciones.
            </span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: puedeFinalizar ? '#dcfce7' : '#fee2e2', color: puedeFinalizar ? '#166534' : '#991b1b', fontWeight: 700, fontSize: '0.82rem' }}>
            {puedeFinalizar ? 'Listo para registrar' : 'Información pendiente'}
          </span>
        </div>

        {/* Botón de envío */}
        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
          <button
            onClick={onSubmit}
            disabled={!puedeFinalizar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 24px',
              fontSize: '1rem',
              opacity: puedeFinalizar ? 1 : 0.7,
            }}
          >
            {estadoEnvio === 'enviando' ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Registrando...
              </>
            ) : (
              <>
                <ClipboardList size={18} />
                Registrar Recepción
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Paso 5: Confirmación ─────────────────────────────────────────────────── */

interface PasoConfirmacionProps {
  orden: { id: string; inspection_number?: string; createdAt?: string }
  cliente: { nombre: string; apellido: string } | null
  vehiculo: { placa: string } | null
  observations?: string
  tieneFoto?: boolean
  tieneFirma?: boolean
  onNuevaOrden: () => void
  onSalir: () => void
}

function PasoConfirmacion({ orden, cliente, vehiculo, observations, tieneFoto, tieneFirma, onNuevaOrden, onSalir }: PasoConfirmacionProps) {
  const fecha = orden.createdAt
    ? new Date(orden.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  return (
    <article className="panel" style={{ textAlign: 'center', padding: '32px 24px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#dcfce7',
          color: '#16a34a',
          marginBottom: 16,
        }}
      >
        <CheckCircle2 size={36} strokeWidth={2} />
      </div>

      <h2 style={{ margin: '0 0 4px', color: '#15803d' }}>
        Recepción Registrada
      </h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        El vehículo ha sido registrado para revisión técnico-mecánica.
      </p>

      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: 24,
          display: 'grid',
          gap: '10px 24px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            N° de Recepción
          </span>
          <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#2563eb', fontSize: '1.1rem' }}>
            {orden.inspection_number ? `#${orden.inspection_number}` : orden.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fecha de ingreso
          </span>
          <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#111827' }}>{fecha}</p>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cliente
          </span>
          <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#111827' }}>
            {cliente ? `${cliente.nombre} ${cliente.apellido}` : '—'}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vehículo
          </span>
          <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#111827' }}>
            {vehiculo?.placa || 'Pendiente'}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estado
          </span>
          <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#111827' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: '#fefce8', color: '#a16207', fontSize: '0.85rem' }}>
              En recepción
            </span>
          </p>
        </div>
        {tieneFoto && (
          <div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Foto de ingreso
            </span>
            <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#16a34a' }}>✓ Adjuntada</p>
          </div>
        )}
        {tieneFirma && (
          <div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Firma digital
            </span>
            <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#16a34a' }}>✓ Capturada</p>
          </div>
        )}
        {observations && (
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Observaciones
            </span>
            <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#111827', whiteSpace: 'pre-wrap' }}>
              {observations}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onNuevaOrden}
          style={{
            padding: '10px 24px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          Nueva Recepción
        </button>
        <button
          onClick={onSalir}
          style={{
            padding: '10px 24px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          Volver al inicio
        </button>
      </div>
    </article>
  )
}
