import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import { vehiculoService } from '@/modules/recepcion/services/vehiculoService'
import type { ClientePersonaNatural, Vehiculo, DocumentType, PersonType } from '@/modules/recepcion/domain/recepcion.types'

interface Props {
  clienteInicial: ClientePersonaNatural
  onVolver: () => void
  onActualizado: () => void
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
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tiposDocumento, setTiposDocumento] = useState<DocumentType[]>([])
  const [tiposPersona, setTiposPersona] = useState<PersonType[]>([])

  const puedeEditar = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'OPERARIO'

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

  const docTipoNombre = tiposDocumento.find((d) => d.id === clienteInicial.documentTypeId)?.nombre || '—'
  const persTipoNombre = tiposPersona.find((p) => p.id === clienteInicial.personTypeId)?.nombre || '—'

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
          
          <span className={`cl-badge ${(clienteInicial as any).active !== false ? 'cl-badge--active' : 'cl-badge--inactive'}`}>
            {(clienteInicial as any).active !== false ? 'Activo' : 'Inactivo'}
          </span>
        </Flex>

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
            marginBottom: 20,
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

        <DataDisplayGroup>
          <Grid columns={2} gap="1.75rem">
            <InfoField label="Nombre" value={clienteInicial.nombre} />
            <InfoField label="Apellido" value={clienteInicial.apellido} />
            
            <InfoField label="Documento" value={clienteInicial.identity} />
            <InfoField label="Celular" value={clienteInicial.celular} />
            
            <InfoField label="Tipo de documento" value={docTipoNombre} />
            <InfoField label="Tipo de persona" value={persTipoNombre} />
            
            <InfoField label="Correo electrónico" value={clienteInicial.email} />
            <InfoField label="Dirección" value={clienteInicial.direccion} />
          </Grid>
        </DataDisplayGroup>

        {puedeEditar && clienteInicial && (clienteInicial as any).active !== false && (
          <Flex justify="end" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--cl-border)' }}>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) return
                setActualizando(true)
                setError(null)
                try {
                  await clienteService.eliminarCliente(clienteInicial.id)
                  alert('Cliente eliminado con éxito')
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
          </Flex>
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
    </div>
  )
}

