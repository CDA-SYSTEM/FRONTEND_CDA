import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import { vehiculoService } from '@/modules/recepcion/services/vehiculoService'
import { clienteSchema, type ClienteSchema } from '@/modules/recepcion/domain/recepcion.schema'
import type { ClientePersonaNatural, Vehiculo, DocumentType, PersonType } from '@/modules/recepcion/domain/recepcion.types'
import { CustomSelect } from '@/shared/components/CustomSelect'
import { useConfirm } from '@/shared/hooks/useConfirm'

interface Props {
  clienteInicial: ClientePersonaNatural
  onVolver: () => void
  onActualizado: (keepOpen?: boolean) => void
}

// Grid layout helper
interface GridProps {
  columns?: number;
  gap?: string;
  children: React.ReactNode;
}
function Grid({ columns = 2, gap = '1.5rem', children }: GridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap,
      width: '100%'
    }}>
      {children}
    </div>
  )
}

// DataDisplayGroup layout helper
interface DataDisplayGroupProps {
  title?: string;
  children: React.ReactNode;
}
function DataDisplayGroup({ title, children }: DataDisplayGroupProps) {
  return (
    <div className="data-display-group" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {title && <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cl-text)', margin: '0 0 0.5rem 0' }}>{title}</h3>}
      {children}
    </div>
  )
}

// InfoField layout helper
interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
}
function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="info-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span className="info-field-label" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span className="info-field-value" style={{ fontSize: '0.9375rem', color: 'var(--cl-text)', fontWeight: 500 }}>
        {value || '—'}
      </span>
    </div>
  )
}

// Flex layout helper
interface FlexProps {
  justify?: 'start' | 'end' | 'center' | 'between';
  align?: 'start' | 'end' | 'center' | 'stretch';
  gap?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
function Flex({ justify = 'start', align = 'center', gap = '0.75rem', children, style }: FlexProps) {
  const justifyMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    between: 'space-between',
  }
  const alignMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    stretch: 'stretch',
  }
  return (
    <div style={{
      display: 'flex',
      justifyContent: justifyMap[justify],
      alignItems: alignMap[align],
      gap,
      ...style
    }}>
      {children}
    </div>
  )
}

export function ClienteDetalle({ clienteInicial, onVolver, onActualizado }: Props) {
  const { user } = useAuthStore()
  const [cliente, setCliente] = useState<ClientePersonaNatural>(clienteInicial)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm()

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [tiposDocumento, setTiposDocumento] = useState<DocumentType[]>([])
  const [tiposPersona, setTiposPersona] = useState<PersonType[]>([])

  const puedeEditar =
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.role === 'operario'

  useEffect(() => {
    setCliente(clienteInicial)
  }, [clienteInicial])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ClienteSchema>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      identity: cliente.identity,
      celular: cliente.celular,
      email: cliente.email ?? '',
      direccion: cliente.direccion ?? '',
      birthDate: cliente.birthDate ?? '',
      documentTypeId: cliente.documentTypeId || (cliente as any).documentType?.id,
      personTypeId: cliente.personTypeId || (cliente as any).personType?.id,
    },
  })

  const docTypeIdWatch = watch('documentTypeId')
  const persTypeIdWatch = watch('personTypeId')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [v, docs, personas] = await Promise.all([
          vehiculoService.obtenerVehiculosCliente(cliente.id),
          clienteService.obtenerTiposDocumento(),
          clienteService.obtenerTiposPersona(),
        ])
        if (mounted) {
          setVehiculos(v)
          setTiposDocumento(docs)
          setTiposPersona(personas)
        }
      } catch (err) {
        console.error('Error cargando datos de cliente:', err)
      } finally {
        if (mounted) setCargandoVehiculos(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [cliente.id])

  // Reset form when cliente changes
  useEffect(() => {
    reset({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      identity: cliente.identity,
      celular: cliente.celular,
      email: cliente.email ?? '',
      direccion: cliente.direccion ?? '',
      birthDate: cliente.birthDate ?? '',
      documentTypeId: cliente.documentTypeId || (cliente as any).documentType?.id,
      personTypeId: cliente.personTypeId || (cliente as any).personType?.id,
    })
  }, [cliente, reset])

  const docTipoNombre = 
    (cliente as any).documentType?.type || 
    (cliente as any).documentType?.nombre || 
    (cliente as any).documentType?.name || 
    tiposDocumento.find((d) => d.id === cliente.documentTypeId)?.nombre || 
    '—'
  const persTipoNombre = 
    (cliente as any).personType?.type || 
    (cliente as any).personType?.nombre || 
    (cliente as any).personType?.name || 
    tiposPersona.find((p) => p.id === cliente.personTypeId)?.nombre || 
    '—'

  const onSubmit = async (data: ClienteSchema) => {
    if (!puedeEditar) return
    setActualizando(true)
    setError(null)
    try {
      const emailVal = data.email?.trim()
      const direccionVal = data.direccion?.trim()
      const birthDateVal = data.birthDate?.trim()

      await clienteService.actualizarCliente(cliente.id, {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        identity: data.identity.trim(),
        celular: data.celular.trim(),
        email: emailVal !== '' ? emailVal : undefined,
        direccion: direccionVal !== '' ? direccionVal : undefined,
        birthDate: birthDateVal !== '' ? birthDateVal : undefined,
        documentTypeId: data.documentTypeId,
        personTypeId: data.personTypeId,
      })
      showToast('Cliente actualizado con éxito', 'success')
      setIsEditing(false)
      onActualizado()
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar el cliente.')
    } finally {
      setActualizando(false)
    }
  }

  const handleReactivar = async () => {
    setActualizando(true)
    try {
      await clienteService.activarCliente(cliente.id)
      showToast('Cliente reactivado correctamente.', 'success')
      setCliente((prev) => ({ ...prev, active: true }))
      onActualizado(true)
    } catch (err) {
      showToast('No se pudo reactivar el cliente.', 'error')
    } finally {
      setActualizando(false)
    }
  }

  return (
    <div className="panel-grid" style={{ gridTemplateColumns: '1fr' }}>
      <article className="panel">
        <Flex justify="between" align="center" style={{ marginBottom: 24 }}>
          <Flex align="center" gap="12px">
            <button
              onClick={onVolver}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                flexShrink: 0,
                padding: 0,
                minHeight: 'unset',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              aria-label="Volver"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--cl-text)' }}>Detalles del Cliente</h2>
          </Flex>
          
          <span className={`cl-badge ${(cliente as any).active !== false ? 'cl-badge--active' : 'cl-badge--inactive'}`}>
            {(cliente as any).active !== false ? 'Activo' : 'Inactivo'}
          </span>
        </Flex>

        {/* Estado y Reactivación */}
        {cliente && !(cliente as any).active && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: '0.9rem'
          }}>
            <span>Este cliente se encuentra <strong>Inactivo / Eliminado</strong>.</span>
            {puedeEditar && (
              <button
                type="button"
                onClick={async () => {
                  const verificado = await confirm({
                    title: 'Reactivar Cliente',
                    message: '¿Desea reactivar este cliente? Al hacerlo, volverá a estar activo en el sistema.',
                  })
                  if (!verificado) return
                  await handleReactivar()
                }}
                disabled={actualizando}
                className="btn btn-primary"
                style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Reactivar Cliente
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{
            color: '#ef4444',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.18)',
            borderRadius: '8px',
            marginBottom: 20,
            fontSize: '0.875rem'
          }}>{error}</div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Grid columns={2} gap="1.5rem">
                <div className="cl-field">
                  <span className="cl-field-label">Nombre <span className="cl-field-required">*</span></span>
                  <input className="cl-input" {...register('nombre')} disabled={actualizando} />
                  {errors.nombre && <span className="cl-field-error">{errors.nombre.message}</span>}
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Apellido <span className="cl-field-required">*</span></span>
                  <input className="cl-input" {...register('apellido')} disabled={actualizando} />
                  {errors.apellido && <span className="cl-field-error">{errors.apellido.message}</span>}
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Documento (solo lectura)</span>
                  <input className="cl-input" {...register('identity')} disabled />
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Celular <span className="cl-field-required">*</span></span>
                  <input className="cl-input" type="tel" maxLength={10} {...register('celular')} disabled={actualizando} />
                  {errors.celular && <span className="cl-field-error">{errors.celular.message}</span>}
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Tipo de documento <span className="cl-field-required">*</span></span>
                  <CustomSelect
                    options={tiposDocumento.map((d) => ({ value: String(d.id), label: d.nombre }))}
                    value={String(docTypeIdWatch)}
                    onChange={(val) => setValue('documentTypeId', Number(val), { shouldDirty: true })}
                  />
                  {errors.documentTypeId && <span className="cl-field-error">{errors.documentTypeId.message}</span>}
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Tipo de persona <span className="cl-field-required">*</span></span>
                  <CustomSelect
                    options={tiposPersona.map((p) => ({ value: String(p.id), label: p.nombre }))}
                    value={String(persTypeIdWatch)}
                    onChange={(val) => setValue('personTypeId', Number(val), { shouldDirty: true })}
                  />
                  {errors.personTypeId && <span className="cl-field-error">{errors.personTypeId.message}</span>}
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Correo electrónico <span className="cl-field-required">*</span></span>
                  <input className="cl-input" type="email" {...register('email')} disabled={actualizando} />
                  {errors.email && <span className="cl-field-error">{errors.email.message}</span>}
                </div>
                <div className="cl-field">
                  <span className="cl-field-label">Dirección <span className="cl-field-required">*</span></span>
                  <input className="cl-input" {...register('direccion')} disabled={actualizando} />
                  {errors.direccion && <span className="cl-field-error">{errors.direccion.message}</span>}
                </div>
                <div className="cl-field form-group-fecha">
                  <span className="cl-field-label">Fecha de nacimiento <span className="cl-field-required">*</span></span>
                  <input className="cl-input" type="date" {...register('birthDate')} disabled={actualizando} />
                  {errors.birthDate && <span className="cl-field-error">{errors.birthDate.message}</span>}
                </div>
              </Grid>
              
              <Flex justify="end" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--cl-border)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={actualizando}
                  className="cl-btn-view"
                  style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actualizando || !isDirty}
                  className="cl-btn-primary"
                  style={{ height: '38px', minHeight: 'unset', display: 'inline-flex', gap: 6, margin: 0 }}
                >
                  {actualizando ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  Guardar Cambios
                </button>
              </Flex>
            </div>
          </form>
        ) : (
          <>
            <DataDisplayGroup>
              <Grid columns={2} gap="1.75rem">
                <InfoField label="Nombre" value={cliente.nombre} />
                <InfoField label="Apellido" value={cliente.apellido} />
                
                <InfoField label="Documento" value={cliente.identity} />
                <InfoField label="Celular" value={cliente.celular} />
                
                <InfoField label="Tipo de documento" value={docTipoNombre} />
                <InfoField label="Tipo de persona" value={persTipoNombre} />
                
                <InfoField label="Correo electrónico" value={cliente.email} />
                <InfoField label="Dirección" value={cliente.direccion} />
                <InfoField label="Fecha de nacimiento" value={cliente.birthDate} />
              </Grid>
            </DataDisplayGroup>

            {puedeEditar && cliente && (cliente as any).active !== false && (
              <Flex justify="between" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--cl-border)' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const verificado = await confirm({
                      title: 'Confirmar Acción',
                      message: '¿Estás seguro de que deseas eliminar este cliente?',
                    })
                    if (!verificado) return
                    setActualizando(true)
                    setError(null)
                    try {
                      await clienteService.eliminarCliente(cliente.id)
                      showToast('Cliente eliminado con éxito', 'success')
                      onActualizado()
                    } catch (err) {
                      console.error(err)
                      setError('No se pudo eliminar el cliente.')
                    } finally {
                      setActualizando(false)
                    }
                  }}
                  disabled={actualizando}
                  className="cl-btn-delete"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    height: '42px',
                    paddingInline: '1.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {actualizando ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                  Eliminar Cliente
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="cl-btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    height: '42px',
                    paddingInline: '1.25rem',
                    fontSize: '0.875rem',
                    margin: 0
                  }}
                >
                  Editar Cliente
                </button>
              </Flex>
            )}
          </>
        )}
      </article>

      <article className="panel">
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cl-text)' }}>Historial de Vehículos</h2>
        {cargandoVehiculos ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--cl-accent)' }} />
          </div>
        ) : vehiculos.length === 0 ? (
          <p style={{ color: 'var(--cl-text-muted)', fontSize: '0.9rem', margin: 0 }}>Este cliente no tiene vehículos registrados.</p>
        ) : (
          <div className="cl-table-card">
            <div className="cl-table-scroll">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Marca</th>
                    <th>Línea</th>
                    <th>Modelo</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--cl-text)', fontFamily: 'ui-monospace, monospace' }}>
                        {v.placa}
                      </td>
                      <td>{typeof v.marca === 'object' ? v.marca?.nombre || v.marca?.name : v.marca}</td>
                      <td>{typeof v.linea === 'object' ? v.linea?.nombre || v.linea?.name : v.linea}</td>
                      <td>{v.modelo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </article>

      {isOpen && options && (
        <div className="confirm-modal-overlay" role="presentation" onClick={handleCancel}>
          <div
            className="confirm-modal-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-message"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <h3 id="confirm-modal-title" className="confirm-modal-title">{options.title}</h3>
            </div>
            <div className="confirm-modal-body">
              <p id="confirm-modal-message" className="confirm-modal-message">{options.message}</p>
            </div>
            <div className="confirm-modal-footer">
              <button type="button" className="confirm-modal-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="button" className="confirm-modal-confirm" onClick={handleConfirm}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
