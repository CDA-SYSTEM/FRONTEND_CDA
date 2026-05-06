import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/modules/auth/store/authStore'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/recepcion', label: 'Recepcion' },
  { to: '/inspeccion', label: 'Inspeccion' },
  { to: '/facturacion', label: 'Facturacion' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [showConfirm, setShowConfirm] = useState(false)

  const openConfirm = () => setShowConfirm(true)
  const closeConfirm = () => setShowConfirm(false)

  const handleConfirmLogout = async () => {
    try {
      await logout()
    } finally {
      // Redirigir al login y forzar recarga para evitar estados en memoria
      navigate('/login', { replace: true })
      // Asegurar que el historial no permita volver a rutas protegidas
      window.location.replace('/login')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>CDA Putumayo</strong>
        <div>
          <span className="badge">{user?.role ?? 'SIN ROL'}</span>
          <button onClick={openConfirm}>Cerrar sesión</button>
        </div>
      </header>

      <nav className="tabs">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <section className="content">
        <Outlet />
      </section>

      {showConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Confirmar cierre de sesión</h3>
            <p>¿Seguro que desea cerrar la sesión? Se le redirigirá a la pantalla de ingreso.</p>
            <div className="modal-actions">
              <button onClick={closeConfirm}>Cancelar</button>
              <button onClick={handleConfirmLogout}>Cerrar sesión</button>
            </div>
          </div>
        </div>
        
      )}
    </div>
  )
}
