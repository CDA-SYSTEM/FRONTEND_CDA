import { Search, Loader2, User, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  resultados: ClientePersonaNatural[]
  cargando: boolean
  error: string | null
  onSeleccionarCliente: (cliente: ClientePersonaNatural) => void
  pagina: number
  onPageChange: (p: number) => void
  limite: number
  onLimitChange: (l: number) => void
  totalElementos: number
  totalPages: number
  incluirInactivos: boolean
  onIncluirInactivosChange: (inc: boolean) => void
}

export function ClienteBuscador({
  query,
  onQueryChange,
  resultados,
  cargando,
  error,
  onSeleccionarCliente,
  pagina,
  onPageChange,
  limite,
  onLimitChange,
  totalElementos,
  totalPages,
  incluirInactivos,
  onIncluirInactivosChange,
}: Props) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', width: '100%' }}>
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="inc-inactivos"
            checked={incluirInactivos}
            onChange={(e) => onIncluirInactivosChange(e.target.checked)}
            style={{ width: 'auto', minHeight: 'initial', marginTop: 0, cursor: 'pointer' }}
          />
          <label htmlFor="inc-inactivos" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            Incluir clientes eliminados o inactivos
          </label>
        </div>
      </div>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>
      )}

      {/* Empty State / No hay resultados */}
      {resultados.length === 0 && !cargando && !error && (
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
          <div className="table-wrap clients-table-desktop">
            <table style={{ margin: 0 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '16px 24px' }}>Documento</th>
                  <th style={{ padding: '16px 24px' }}>Nombre completo</th>
                  <th style={{ padding: '16px 24px' }}>Celular</th>
                  <th style={{ padding: '16px 24px' }}>Estado</th>
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
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: (c as any).active !== false ? '#dcfce7' : '#fee2e2',
                        color: (c as any).active !== false ? '#166534' : '#991b1b'
                      }}>
                        {(c as any).active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
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

          <div className="clients-cards-mobile">
            {resultados.map((c) => (
              <div key={c.id} className="client-card">
                <div className="client-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="client-card-identity" style={{ fontSize: '1.05rem', color: '#1e293b' }}>
                    {c.nombre} {c.apellido}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: (c as any).active !== false ? '#dcfce7' : '#fee2e2',
                    color: (c as any).active !== false ? '#166534' : '#991b1b'
                  }}>
                    {(c as any).active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="client-card-row">
                  <span className="client-card-label">Documento:</span>
                  <span className="client-card-value">{c.identity}</span>
                </div>

                <div className="client-card-row">
                  <span className="client-card-label">Celular:</span>
                  <span className="client-card-value">{c.celular || '—'}</span>
                </div>

                <div className="client-card-actions">
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
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#64748b' }}>
              <span>Mostrar</span>
              <select
                value={limite}
                onChange={(e) => {
                  onLimitChange(Number(e.target.value))
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#334155',
                  minHeight: 'auto',
                  marginTop: 0,
                  width: 'auto',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  paddingRight: '24px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 6px center',
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Mostrando{' '}
              <strong>
                {totalElementos === 0 ? 0 : pagina * limite + 1}
              </strong>{' '}
              a{' '}
              <strong>
                {Math.min((pagina + 1) * limite, totalElementos)}
              </strong>{' '}
              de <strong>{totalElementos}</strong> clientes
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => onPageChange(Math.max(0, pagina - 1))}
                disabled={pagina === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 6,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 6,
                  cursor: pagina === 0 ? 'not-allowed' : 'pointer',
                  opacity: pagina === 0 ? 0.5 : 1,
                  boxShadow: 'none',
                  minHeight: 'auto',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                Página {pagina + 1} de {totalPages || 1}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages - 1, pagina + 1))}
                disabled={pagina >= totalPages - 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 6,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 6,
                  cursor: pagina >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  opacity: pagina >= totalPages - 1 ? 0.5 : 1,
                  boxShadow: 'none',
                  minHeight: 'auto',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </article>
      )}
    </div>
  )
}
