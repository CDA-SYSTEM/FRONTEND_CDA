import { Search, Loader2, User, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'
import { useAuthStore } from '@/core/store/authStore'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  resultados: ClientePersonaNatural[]
  cargando: boolean
  error: string | null
  onSeleccionarCliente: (cliente: ClientePersonaNatural) => void
  onEliminarCliente?: (cliente: ClientePersonaNatural) => void
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
  onEliminarCliente,
  pagina,
  onPageChange,
  limite,
  onLimitChange,
  totalElementos,
  totalPages,
  incluirInactivos,
  onIncluirInactivosChange,
}: Props) {
  const { user } = useAuthStore()
  const puedeEliminar =
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.role === 'operario'

  return (
    <div>
      {/* ── Barra de búsqueda y filtros ── */}
      <div className="cl-filter-bar" style={{ marginBottom: 20 }}>
        <div className="cl-search-wrapper">
          <span className="cl-search-icon">
            {cargando ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={18} />
            )}
          </span>
          <input
            className="cl-search-input"
            type="text"
            placeholder="Buscar por nombre, documento o placa..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        <div className="cl-checkbox-row">
          <input
            type="checkbox"
            id="inc-inactivos"
            checked={incluirInactivos}
            onChange={(e) => onIncluirInactivosChange(e.target.checked)}
          />
          <label className="cl-checkbox-label" htmlFor="inc-inactivos">
            Incluir clientes eliminados o inactivos
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="cl-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Empty state */}
      {resultados.length === 0 && !cargando && !error && (
        <div className="cl-table-card">
          <div className="cl-empty">
            <User size={56} color="#cbd5e1" strokeWidth={1.5} />
            <p className="cl-empty-title">No se encontraron clientes</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      {resultados.length > 0 && (
        <div className="cl-table-card">
          {/* Vista desktop */}
          <div className="cl-table-scroll clients-table-desktop">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre completo</th>
                  <th>Celular</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((c) => {
                  const isActive = (c as any).active !== false
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="cl-doc-cell">{c.identity}</span>
                      </td>
                      <td>
                        <span className="cl-name-cell">{c.nombre} {c.apellido}</span>
                      </td>
                      <td>{c.celular}</td>
                      <td>
                        <span className={`cl-badge ${isActive ? 'cl-badge--active' : 'cl-badge--inactive'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            className="cl-btn-view"
                            onClick={() => onSeleccionarCliente(c)}
                            type="button"
                          >
                            Ver
                          </button>
                          {puedeEliminar && isActive && onEliminarCliente && (
                            <button
                              className="cl-btn-delete"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEliminarCliente(c)
                              }}
                              type="button"
                            >
                              <Trash2 size={13} style={{ marginRight: 4 }} />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Vista mobile cards */}
          <div className="clients-cards-mobile">
            {resultados.map((c) => {
              const isActive = (c as any).active !== false
              return (
                <div key={c.id} className="client-card">
                  <div className="client-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="client-card-identity">
                      {c.nombre} {c.apellido}
                    </span>
                    <span className={`cl-badge ${isActive ? 'cl-badge--active' : 'cl-badge--inactive'}`}>
                      {isActive ? 'Activo' : 'Inactivo'}
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

                  <div className="client-card-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="cl-btn-view"
                      onClick={() => onSeleccionarCliente(c)}
                      type="button"
                      style={{ flex: 1 }}
                    >
                      Ver
                    </button>
                    {puedeEliminar && isActive && onEliminarCliente && (
                      <button
                        className="cl-btn-delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEliminarCliente(c)
                        }}
                        type="button"
                        style={{ flex: 1 }}
                      >
                        <Trash2 size={13} style={{ marginRight: 4 }} />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pie de tabla — paginación + límite + contador */}
          <div className="cl-table-footer">
            {/* Selector de límite */}
            <div className="cl-limit-row">
              <span>Mostrar</span>
              <select
                className="cl-limit-select"
                value={limite}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>

            {/* Contador */}
            <div className="cl-footer-count">
              Mostrando{' '}
              <strong>{totalElementos === 0 ? 0 : pagina * limite + 1}</strong>
              {' '}a{' '}
              <strong>{Math.min((pagina + 1) * limite, totalElementos)}</strong>
              {' '}de <strong>{totalElementos}</strong> clientes
            </div>

            {/* Paginación */}
            <div className="cl-pagination">
              <button
                className="cl-pagination-btn"
                onClick={() => onPageChange(Math.max(0, pagina - 1))}
                disabled={pagina === 0}
                aria-label="Página anterior"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="cl-pagination-label">
                Página {pagina + 1} de {totalPages || 1}
              </span>
              <button
                className="cl-pagination-btn"
                onClick={() => onPageChange(Math.min(totalPages - 1, pagina + 1))}
                disabled={pagina >= totalPages - 1}
                aria-label="Página siguiente"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
