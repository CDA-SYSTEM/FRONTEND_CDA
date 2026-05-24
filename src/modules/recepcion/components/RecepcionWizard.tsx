import { useState, useRef } from 'react'
import { useAuthStore } from '@/core/store/authStore'
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
} from 'lucide-react'
import { useCrearRecepcion, type PasoWizard } from '@/modules/recepcion/hooks/useCrearRecepcion'
import { useBuscarCliente } from '@/modules/recepcion/hooks/useBuscarCliente'
import { SignaturePad } from '@/shared/components/SignaturePad'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'
import type { Vehiculo } from '@/modules/recepcion/domain/recepcion.types'
import type { Usuario } from '@/modules/usuarios/domain/usuario.types'

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

      {/* Contenido según paso */}
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
            onClienteCreado={(c) => {
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
          clienteNombre={`${wizard.cliente?.nombre || ''} ${wizard.cliente?.apellido || ''}`}
          onVolver={wizard.volver}
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
          rolAsignado={wizard.rolAsignado}
          setRolAsignado={wizard.setRolAsignado}
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

function PasoCliente({ buscador, onSeleccionar, onNuevoCliente }: PasoClienteProps) {
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
              {buscador.resultados.map((c) => (
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
        </div>
      ) : buscador.query.length >= 3 && !buscador.cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <User size={36} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <p>No se encontraron clientes. Puede registrar uno nuevo.</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <Search size={36} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <p>Escriba al menos 3 caracteres para buscar</p>
        </div>
      )}
    </article>
  )
}

/* ── Paso 2: Seleccionar Vehículo ─────────────────────────────────────────── */

interface PasoVehiculoProps {
  vehiculos: Vehiculo[]
  cargando: boolean
  onSeleccionar: (v: { id: number | string; placa: string }) => void
  onSaltar: () => void
  clienteNombre: string
  onVolver: () => void
}

function PasoVehiculo({ vehiculos, cargando, onSeleccionar, onSaltar, clienteNombre, onVolver }: PasoVehiculoProps) {
  return (
    <article className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
          Registrar vehículo después
        </button>
      </div>
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
  rolAsignado: 'INSPECTOR' | 'OPERARIO'
  setRolAsignado: (v: 'INSPECTOR' | 'OPERARIO') => void
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

const ROL_PERSONAL_LABEL: Record<'INSPECTOR' | 'OPERARIO', string> = {
  OPERARIO: 'Operario',
  INSPECTOR: 'Inspector',
}

function PasoDetalle({
  mileage, setMileage, revisionType, setRevisionType, customerType, setCustomerType,
  tiposRevision, tiposCliente,
  rolAsignado, setRolAsignado,
  usuarioAsignadoId, setUsuarioAsignadoId,
  usuariosAsignables, cargandoUsuariosAsignables, errorUsuariosAsignables,
  onSiguiente, onVolver,
}: PasoDetalleProps) {
  const currentUserRole = useAuthStore((s) => s.user?.role)
  const rolesPersonal: Array<'INSPECTOR' | 'OPERARIO'> =
    currentUserRole === 'OPERARIO' ? ['OPERARIO'] : ['OPERARIO', 'INSPECTOR']

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
          <select
            value={revisionType}
            onChange={(e) => setRevisionType(e.target.value)}
          >
            <option value="">Seleccione...</option>
            {tiposRevision.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </label>

        <label>
          Tipo de cliente <span style={{ color: '#ef4444' }}>*</span>
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
          >
            <option value="">Seleccione...</option>
            {tiposCliente.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <label>
            <span style={{ fontWeight: 500 }}>Rol del personal</span>
            <select
              value={rolAsignado}
              onChange={(e) => setRolAsignado(e.target.value as 'INSPECTOR' | 'OPERARIO')}
              disabled={rolesPersonal.length === 1}
            >
              {rolesPersonal.map((rol) => (
                <option key={rol} value={rol}>
                  {ROL_PERSONAL_LABEL[rol]}
                </option>
              ))}
            </select>
            <span style={{ marginTop: 4, color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
              {currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER'
                ? 'Lista de personal registrado (requiere rol Admin o Manager en el API).'
                : 'Con su rol se asigna su propia cuenta como operario.'}
            </span>
          </label>

          <label>
            <span style={{ fontWeight: 500 }}>
              {ROL_PERSONAL_LABEL[rolAsignado]} a asignar <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <select
              value={usuarioAsignadoId}
              onChange={(e) => setUsuarioAsignadoId(e.target.value)}
              disabled={cargandoUsuariosAsignables || usuariosAsignables.length === 0}
            >
              <option value="">Seleccione personal...</option>
              {usuariosAsignables.map((u) => (
                <option key={u.id} value={u.id}>
                  {labelPersonal(u)}
                </option>
              ))}
            </select>
            {cargandoUsuariosAsignables && (
              <span style={{ marginTop: 4, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>
                Cargando personal de su cuenta...
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
  estadoEnvio, errorEnvio,
  tintedWindows, setTintedWindows,
  armoredVehicle, setArmoredVehicle,
  brakeFluidSightGlass, setBrakeFluidSightGlass,
  onSubmit, onVolver,
}: PasoCondicionesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            <select value={tintedWindows} onChange={(e) => setTintedWindows(e.target.value)} disabled={estadoEnvio === 'enviando'}>
              <option value="NO">NO</option>
              <option value="SI">SI</option>
              <option value="NO_APLICA">NO APLICA</option>
            </select>
          </label>
          <label>
            <span style={{ fontWeight: 500 }}>Vehículo blindado</span>
            <select value={armoredVehicle} onChange={(e) => setArmoredVehicle(e.target.value)} disabled={estadoEnvio === 'enviando'}>
              <option value="NO">NO</option>
              <option value="SI">SI</option>
              <option value="NO_APLICA">NO APLICA</option>
            </select>
          </label>
          <label>
            <span style={{ fontWeight: 500 }}>Depósito líquido frenos</span>
            <select value={brakeFluidSightGlass} onChange={(e) => setBrakeFluidSightGlass(e.target.value)} disabled={estadoEnvio === 'enviando'}>
              <option value="BUEN_ESTADO">BUEN ESTADO</option>
              <option value="MAL_ESTADO">MAL ESTADO</option>
              <option value="NO_APLICA">NO APLICA</option>
            </select>
          </label>
        </div>

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

        {/* Botón de envío */}
        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
          <button
            onClick={onSubmit}
            disabled={estadoEnvio === 'enviando' || !confirmacionAcuerdo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 24px',
              fontSize: '1rem',
              opacity: (estadoEnvio === 'enviando' || !confirmacionAcuerdo) ? 0.7 : 1,
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
