import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import { vehiculoService } from '@/modules/recepcion/services/vehiculoService'
import { clienteSchema, type ClienteSchema } from '@/modules/recepcion/domain/recepcion.schema'
import type { ClientePersonaNatural, Vehiculo, DocumentType, PersonType } from '@/modules/recepcion/domain/recepcion.types'
import { CustomSelect } from '@/shared/components/CustomSelect'

interface Props {
  clienteInicial: ClientePersonaNatural
  onVolver: () => void
  onActualizado: () => void
}

export function ClienteDetalle({ clienteInicial, onVolver, onActualizado }: Props) {
  const { user } = useAuthStore()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tiposDocumento, setTiposDocumento] = useState<DocumentType[]>([])
  const [tiposPersona, setTiposPersona] = useState<PersonType[]>([])

  const puedeEditar = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'OPERARIO'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ClienteSchema>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: clienteInicial.nombre,
      apellido: clienteInicial.apellido,
      identity: clienteInicial.identity,
      celular: clienteInicial.celular,
      email: clienteInicial.email ?? '',
      direccion: clienteInicial.direccion ?? '',
      birthDate: clienteInicial.birthDate ?? '',
      documentTypeId: clienteInicial.documentTypeId,
      personTypeId: clienteInicial.personTypeId,
    },
  })

  const docTypeIdWatch = watch('documentTypeId')
  const persTypeIdWatch = watch('personTypeId')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [v, docs, personas] = await Promise.all([
          vehiculoService.obtenerVehiculosCliente(clienteInicial.id),
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
  }, [clienteInicial.id])

  const onSubmit = async (data: ClienteSchema) => {
    if (!puedeEditar) return
    setActualizando(true)
    setError(null)
    try {
      await clienteService.actualizarCliente(clienteInicial.id, data)
      onActualizado()
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar el cliente.')
    } finally {
      setActualizando(false)
    }
  }

  return (
    <div className="panel-grid" style={{ gridTemplateColumns: '1fr' }}>
      <article className="panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={onVolver}
            style={{ padding: '6px', background: '#e2e8f0', color: '#475569', borderRadius: '50%' }}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0 }}>Detalles del Cliente</h2>
        </div>

        {!puedeEditar && (
          <div style={{ padding: '10px 14px', background: '#fef9c3', color: '#854d0e', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            Estás en modo de <strong>solo lectura</strong>. No tienes permisos para editar a este cliente.
          </div>
        )}

        {/* Estado y Reactivación */}
        {clienteInicial && !(clienteInicial as any).active && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: '0.9rem'
          }}>
            <span>Este cliente se encuentra <strong>Inactivo / Eliminado</strong>.</span>
            {puedeEditar && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('¿Desea reactivar este cliente?')) return
                  setActualizando(true)
                  try {
                    await clienteService.activarCliente(clienteInicial.id)
                    alert('Cliente reactivado correctamente.')
                    onActualizado()
                  } catch (err) {
                    alert('No se pudo reactivar el cliente.')
                  } finally {
                    setActualizando(false)
                  }
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
          <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          <fieldset className="form-row-2">
            <label>
              Nombre <span style={{ color: '#ef4444' }}>*</span>
              <input {...register('nombre')} disabled={!puedeEditar || actualizando} />
              {errors.nombre && <span className="field-error">{errors.nombre.message}</span>}
            </label>
            <label>
              Apellido <span style={{ color: '#ef4444' }}>*</span>
              <input {...register('apellido')} disabled={!puedeEditar || actualizando} />
              {errors.apellido && <span className="field-error">{errors.apellido.message}</span>}
            </label>
          </fieldset>

          <fieldset className="form-row-2">
            <label>
              Documento (solo lectura)
              <input {...register('identity')} disabled />
            </label>
            <label>
              Celular <span style={{ color: '#ef4444' }}>*</span>
              <input type="tel" maxLength={10} {...register('celular')} disabled={!puedeEditar || actualizando} />
              {errors.celular && <span className="field-error">{errors.celular.message}</span>}
            </label>
          </fieldset>

          <fieldset className="form-row-2">
            <label>
              Tipo de documento <span style={{ color: '#ef4444' }}>*</span>
              {puedeEditar ? (
                <CustomSelect
                  options={tiposDocumento.map((d) => ({ value: String(d.id), label: d.nombre }))}
                  value={String(docTypeIdWatch)}
                  onChange={(val) => setValue('documentTypeId', Number(val), { shouldDirty: true })}
                />
              ) : (
                <input
                  disabled
                  value={tiposDocumento.find((d) => d.id === docTypeIdWatch)?.nombre || ''}
                />
              )}
            </label>
            <label>
              Tipo de persona <span style={{ color: '#ef4444' }}>*</span>
              {puedeEditar ? (
                <CustomSelect
                  options={tiposPersona.map((p) => ({ value: String(p.id), label: p.nombre }))}
                  value={String(persTypeIdWatch)}
                  onChange={(val) => setValue('personTypeId', Number(val), { shouldDirty: true })}
                />
              ) : (
                <input
                  disabled
                  value={tiposPersona.find((p) => p.id === persTypeIdWatch)?.nombre || ''}
                />
              )}
            </label>
          </fieldset>

          <fieldset className="form-row-2">
            <label>
              Correo electrónico
              <input type="email" {...register('email')} disabled={!puedeEditar || actualizando} />
            </label>
            <label>
              Dirección
              <input {...register('direccion')} disabled={!puedeEditar || actualizando} />
            </label>
          </fieldset>

          {puedeEditar && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={actualizando || !isDirty}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: (actualizando || !isDirty) ? 0.6 : 1,
                }}
              >
                {actualizando ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                {actualizando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          )}
        </form>
      </article>

      <article className="panel">
        <h2>Historial de Vehículos</h2>
        {cargandoVehiculos ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
          </div>
        ) : vehiculos.length === 0 ? (
          <p style={{ color: '#6b7280', marginTop: 12 }}>Este cliente no tiene vehículos registrados.</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table>
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
                    <td style={{ fontWeight: 600, textTransform: 'uppercase' }}>{v.placa}</td>
                    <td>{typeof v.marca === 'object' ? v.marca?.nombre || v.marca?.name : v.marca}</td>
                    <td>{typeof v.linea === 'object' ? v.linea?.nombre || v.linea?.name : v.linea}</td>
                    <td>{v.modelo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  )
}
