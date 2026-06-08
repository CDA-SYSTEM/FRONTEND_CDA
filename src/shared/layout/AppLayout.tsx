import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { LogOut, WifiOff, KeyRound, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { estaOnline, suscribirConectividad, sincronizar } from '@/core/api/apiClient'
import { offlineStorage } from '@/core/services/offlineStorage'
import { authService } from '@/modules/auth/services/authService'
import { Navigation } from './Navigation'
import './AppLayout.css'

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const [showConfirm, setShowConfirm] = useState(false)

  const openConfirm = () => setShowConfirm(true)
  const closeConfirm = () => setShowConfirm(false)

  // Estados para Cambio de Contraseña (Solo ADMIN)
  const [changePassOpen, setChangePassOpen] = useState(false)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmNewPass, setConfirmNewPass] = useState('')
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState<string | null>(null)
  const [changingPass, setChangingPass] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassSuccess(null)

    if (newPass.length < 4) {
      setPassError('La nueva contraseña debe tener al menos 4 caracteres.')
      return
    }

    if (newPass !== confirmNewPass) {
      setPassError('Las contraseñas nuevas no coinciden.')
      return
    }

    setChangingPass(true)
    try {
      await authService.cambiarPassword(oldPass, newPass)
      setPassSuccess('Contraseña cambiada con éxito.')
      setOldPass('')
      setNewPass('')
      setConfirmNewPass('')
      setTimeout(() => {
        setChangePassOpen(false)
        setPassSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || err.message || 'No se pudo cambiar la contraseña.'
      setPassError(msg)
    } finally {
      setChangingPass(false)
    }
  }

  const handleConfirmLogout = async () => {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
    try {
      await logout()
    } finally {
      window.location.href = `/login?onreturn=${returnTo}`
    }
  }


  const [online, setOnline] = useState(estaOnline())
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    const unsuscribe = suscribirConectividad((conectado) => {
      setOnline(conectado)
      if (conectado) {
        sincronizar()
      }
    })
    return unsuscribe
  }, [])

  useEffect(() => {
    if (online) {
      offlineStorage.obtenerCola().then((cola) => setPendientes(cola.length))
    } else {
      setPendientes(0)
    }
  }, [online])

  return (
    <div className="app-shell">
      <Navigation collapsed={sidebarCollapsed} />
      
      <div className={`app-shell__main${sidebarCollapsed ? ' app-shell__main--collapsed' : ''}`}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-toggle"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} strokeWidth={2.5} /> : <PanelLeftClose size={20} strokeWidth={2.5} />}
            </button>
            <img src="/logo_cda.svg" alt="Logo" style={{ height: 28, width: 'auto' }} />
            <strong>CDA Putumayo</strong>
          </div>
          <div className="topbar-right">
            <span className="badge">{user?.role ?? 'SIN ROL'}</span>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                className="btn-logout-topbar"
                onClick={() => setChangePassOpen(true)}
                title="Cambiar contraseña"
              >
                <KeyRound size={16} />
                <span className="btn-text">Cambiar contraseña</span>
              </button>
            )}
            <button className="btn-logout-topbar" onClick={openConfirm} title="Cerrar sesión">
              <LogOut size={16} />
              <span className="btn-text">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* HU-037: Indicador de conectividad */}
        {!online && (
          <div className="offline-bar">
            <WifiOff size={14} />
            <span>Sin conexión</span>
            {pendientes > 0 && (
              <span className="offline-pending">
                — {pendientes} {pendientes === 1 ? 'cambio pendiente' : 'cambios pendientes'} de sincronización
              </span>
            )}
          </div>
        )}

        <section className="content">
          <Outlet />
        </section>
      </div>

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

      {changePassOpen && (
        <div className="logout-modal-backdrop" role="dialog" aria-modal="true">
          <div className="logout-modal-box" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="logout-modal-icon">
              <KeyRound size={28} strokeWidth={2.5} style={{ color: '#2563eb' }} />
            </div>
            <h3>Cambiar Contraseña</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 12 }}>
              Actualice su clave de acceso al sistema.
            </p>
            {passError && (
              <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem', marginBottom: 12 }}>
                {passError}
              </div>
            )}
            {passSuccess && (
              <div style={{ color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem', marginBottom: 12 }}>
                {passSuccess}
              </div>
            )}
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', color: '#334155' }}>
                Contraseña Actual
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', color: '#334155' }}>
                Nueva Contraseña
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', color: '#334155' }}>
                Confirmar Nueva Contraseña
                <input
                  type="password"
                  required
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </label>
              <div className="logout-modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setChangePassOpen(false)
                    setOldPass('')
                    setNewPass('')
                    setConfirmNewPass('')
                    setPassError(null)
                  }}
                  disabled={changingPass}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-logout"
                  style={{ background: '#2563eb', color: '#fff' }}
                  disabled={changingPass}
                >
                  {changingPass ? 'Guardando...' : 'Cambiar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
