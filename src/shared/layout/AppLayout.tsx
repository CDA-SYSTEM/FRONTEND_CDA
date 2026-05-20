import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import './AppLayout.css'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] },
  { to: '/recepcion', label: 'Recepcion' },
  { to: '/clientes', label: 'Clientes', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { to: '/inspeccion', label: 'Inspeccion', roles: ['ADMIN'] },
  { to: '/inspeccion/asignacion', label: 'Inspeccion', roles: ['INSPECTOR'] },
  { to: '/vehiculo/registro', label: 'Vehículos' },
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
      navigate('/login', { replace: true })
      window.location.replace('/login')
    }
  }

  const [menuAbierto, setMenuAbierto] = useState(false)
  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])

  const linksFiltrados = links.filter(
    (link) =>
      !link.roles || (user?.role && link.roles.includes(user.role)),
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="hamburger"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
          <strong>CDA Putumayo</strong>
        </div>
        <div className="topbar-right">
          <span className="badge">{user?.role ?? 'SIN ROL'}</span>
          <button className="btn-logout-topbar" onClick={openConfirm}>Cerrar sesión</button>
        </div>
      </header>

      <nav className={`tabs${menuAbierto ? ' tabs--open' : ''}`}>
        {linksFiltrados.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
            onClick={cerrarMenu}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {menuAbierto && (
        <div className="nav-overlay" onClick={cerrarMenu} />
      )}

      <section className="content">
        <Outlet />
      </section>

      {showConfirm && (
        <div className="logout-modal-backdrop" role="dialog" aria-modal="true">
          <div className="logout-modal-box">
            <div className="logout-modal-icon">
              <LogOut size={28} strokeWidth={2.5} />
            </div>
            <h3>Confirmar cierre de sesión</h3>
            <p>
              ¿Seguro que desea cerrar la sesión? Se le redirigirá a la pantalla
              de ingreso.
            </p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={closeConfirm}>
                Cancelar
              </button>
              <button className="btn-logout" onClick={handleConfirmLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
