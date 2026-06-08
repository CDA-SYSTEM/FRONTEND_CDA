import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Car, 
  FileText, 
  DollarSign, 
  Tag, 
  List, 
  FileArchive, 
  Activity,
  Home,
  Menu,
} from 'lucide-react'
import './Navigation.css'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <Home size={20} />, roles: ['admin', 'manager', 'facturador'] },
  { to: '/usuarios', label: 'Usuarios', icon: <Users size={20} />, roles: ['admin'] },
  { to: '/recepcion', label: 'Recepción', icon: <LayoutDashboard size={20} />, roles: ['admin', 'recepcionista', 'manager', 'operario'] },
  { to: '/clientes', label: 'Clientes', icon: <Users size={20} />, roles: ['admin', 'recepcionista', 'manager', 'operario', 'inspector'] },
  { to: '/inspeccion/asignacion', label: 'Inspección', icon: <ClipboardCheck size={20} />, roles: ['admin', 'inspector'] },
  { to: '/vehiculo/registro', label: 'Vehículos', icon: <Car size={20} />, roles: ['admin', 'recepcionista', 'manager', 'operario', 'inspector'] },
  { to: '/facturacion', label: 'Facturación', icon: <DollarSign size={20} />, roles: ['admin', 'facturador', 'manager'] },
  { to: '/precios', label: 'Tarifas', icon: <Tag size={20} />, roles: ['admin', 'manager'] },
  { to: '/estados', label: 'Estados', icon: <List size={20} />, roles: ['admin', 'manager'] },
  { to: '/plantillas', label: 'Plantillas', icon: <FileText size={20} />, roles: ['admin', 'manager'] },
  { to: '/archivos', label: 'Archivos', icon: <FileArchive size={20} />, roles: ['admin'] },
  { to: '/tracker', label: 'Trazabilidad', icon: <Activity size={20} />, roles: ['admin', 'manager'] },
]

interface NavigationProps {
  collapsed: boolean
}

export function Navigation({ collapsed }: NavigationProps) {
  const user = useAuthStore((state) => state.user)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const filteredItems = navItems.filter(
    (item) =>
      !item.roles ||
      (user?.role &&
        (user.role === 'superadmin' ||
          item.roles.includes(user.role))),
  )

  return (
    <nav className={`navigation${collapsed ? ' navigation--collapsed' : ''}`} aria-label="Navegación principal">
      <ul className="navigation__list navigation__list--desktop">
        {filteredItems.map((item) => (
          <li key={item.to} className="navigation__item">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => 
                `navigation__link ${isActive ? 'navigation__link--active' : ''}`
              }
            >
              <span className="navigation__icon">{item.icon}</span>
              <span className="navigation__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Mobile List */}
      <ul className="navigation__list navigation__list--mobile">
        {filteredItems.length <= 5 ? (
          filteredItems.map((item) => (
            <li key={item.to} className="navigation__item">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => 
                  `navigation__link ${isActive ? 'navigation__link--active' : ''}`
                }
              >
                <span className="navigation__icon">{item.icon}</span>
                <span className="navigation__label">{item.label}</span>
              </NavLink>
            </li>
          ))
        ) : (
          <>
            {filteredItems.slice(0, 4).map((item) => (
              <li key={item.to} className="navigation__item">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => 
                    `navigation__link ${isActive ? 'navigation__link--active' : ''}`
                  }
                >
                  <span className="navigation__icon">{item.icon}</span>
                  <span className="navigation__label">{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li className="navigation__item">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="navigation__link navigation__button"
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  padding: '6px 2px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: 'var(--nav-text)'
                }}
              >
                <span className="navigation__icon"><Menu size={20} /></span>
                <span className="navigation__label">Más</span>
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Mobile BottomSheet Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-nav-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-sheet-header">
              <h3>Más opciones</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="mobile-nav-sheet-close" aria-label="Cerrar">
                <span style={{ fontSize: '1.6rem', color: '#ffffff', lineHeight: 1, display: 'block', transform: 'translateY(-1px)' }}>&times;</span>
              </button>
            </div>
            <ul className="mobile-nav-sheet-list">
              {filteredItems.slice(4).map((item) => (
                <li key={item.to} className="mobile-nav-sheet-item">
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => 
                      `mobile-nav-sheet-link ${isActive ? 'mobile-nav-sheet-link--active' : ''}`
                    }
                  >
                    <span className="mobile-nav-sheet-icon">{item.icon}</span>
                    <span className="mobile-nav-sheet-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  )
}
