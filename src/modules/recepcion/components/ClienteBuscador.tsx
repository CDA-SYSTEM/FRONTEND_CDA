import { Search, Loader2, User } from 'lucide-react'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  resultados: ClientePersonaNatural[]
  cargando: boolean
  error: string | null
  onSeleccionarCliente: (cliente: ClientePersonaNatural) => void
}

export function ClienteBuscador({
  query,
  onQueryChange,
  resultados,
  cargando,
  error,
  onSeleccionarCliente,
}: Props) {
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
          }}
        >
          {cargando ? (
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={20} />
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, documento o placa..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ 
            paddingLeft: 46, 
            height: 48, 
            fontSize: '1rem', 
            borderRadius: 8, 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
          }}
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>
      )}

      {/* Empty State / No hay resultados */}
      {(query.length < 3 || (resultados.length === 0 && !cargando)) && !error && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6rem 2rem',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          color: '#64748b',
          minHeight: 300,
        }}>
          <User size={64} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: '1.1rem', margin: 0 }}>No se encontraron clientes</p>
        </div>
      )}

      {resultados.length > 0 && (
        <article className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table style={{ margin: 0 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '16px 24px' }}>Documento</th>
                  <th style={{ padding: '16px 24px' }}>Nombre completo</th>
                  <th style={{ padding: '16px 24px' }}>Celular</th>
                  <th style={{ padding: '16px 24px', width: 120 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>{c.identity}</td>
                    <td style={{ padding: '16px 24px' }}>
                      {c.nombre} {c.apellido}
                    </td>
                    <td style={{ padding: '16px 24px' }}>{c.celular}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        onClick={() => onSeleccionarCliente(c)}
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </div>
  )
}
