import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/recepcion', label: 'Recepcion' },
  { to: '/inspeccion', label: 'Inspeccion' },
  { to: '/facturacion', label: 'Facturacion' },
]

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>CDA Putumayo</strong>
        <div>
          <span className="badge">{user?.role ?? 'SIN ROL'}</span>
          <button onClick={logout}>Cerrar sesion</button>
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
    </div>
  )
}
