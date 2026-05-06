import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { LogOut } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] },
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
        {links
          .filter((link) => !link.roles || (user?.role && link.roles.includes(user.role)))
          .map((link) => (
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
        <>
          <style>{`
            .logout-modal-backdrop {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              backdrop-filter: blur(4px);
            }
            .logout-modal-box {
              background: #ffffff;
              padding: 32px 24px;
              border-radius: 16px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              max-width: 400px;
              width: 90%;
              text-align: center;
              animation: logoutModalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .logout-modal-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: #fee2e2;
              color: #ef4444;
              margin-bottom: 16px;
            }
            .logout-modal-box h3 {
              margin: 0 0 8px 0;
              color: #111827;
              font-size: 1.25rem;
              font-weight: 600;
            }
            .logout-modal-box p {
              color: #6b7280;
              font-size: 0.95rem;
              margin: 0 0 24px 0;
              line-height: 1.5;
            }
            .logout-modal-actions {
              display: flex;
              gap: 12px;
            }
            .logout-modal-actions button {
              flex: 1;
              padding: 10px 0;
              border-radius: 8px;
              font-weight: 500;
              font-size: 0.95rem;
              border: none;
              cursor: pointer;
              transition: all 0.2s;
            }
            .btn-cancel { background: #f3f4f6; color: #374151; }
            .btn-cancel:hover { background: #e5e7eb; }
            .btn-logout { background: #ef4444; color: white; }
            .btn-logout:hover { background: #dc2626; }
            @keyframes logoutModalFadeIn {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div className="logout-modal-backdrop" role="dialog" aria-modal="true">
            <div className="logout-modal-box">
              <div className="logout-modal-icon">
                <LogOut size={28} strokeWidth={2.5} />
              </div>
              <h3>Confirmar cierre de sesión</h3>
              <p>¿Seguro que desea cerrar la sesión? Se le redirigirá a la pantalla de ingreso.</p>
              <div className="logout-modal-actions">
                <button className="btn-cancel" onClick={closeConfirm}>Cancelar</button>
                <button className="btn-logout" onClick={handleConfirmLogout}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
