import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import {
  Car, AlertCircle, CheckCircle, X, Mail, Lock, Eye, EyeOff,
} from 'lucide-react'
import {
  loginSchema,
  type LoginSchema,
} from '@/modules/auth/domain/auth.schema'
import { useAuthStore } from '@/core/store/authStore'
import logoSvg from '@/shared/assets/logo_cda.svg'
import './LoginPage.css'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
          renderButton: (
            parent: HTMLElement | null,
            options: { theme?: string; size?: string; width?: number; text?: string; shape?: string }
          ) => void
        }
      }
    }
  }
}


const DASHBOARD_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  manager: '/recepcion',
  operario: '/recepcion',
  inspector: '/inspeccion/asignacion',
  facturador: '/facturacion',
}

const LOGIN_TITLE = 'CDA del Putumayo'
const LOGIN_SUBTITLE = 'Sistema de Gestión y Diagnóstico Automotor'

const FEATURES = [
  'Gestión completa de inspecciones',
  'Control de recepciones en tiempo real',
  'Facturación integrada',
  'Reportes y estadísticas',
]

function renderTextCharacters(text: string, className: string) {
  return Array.from(text).map((character, index) => (
    <span
      key={`${className}-${index}-${character}`}
      className={className}
      aria-hidden="true"
    >
      {character === ' ' ? '\u00A0' : character}
    </span>
  ))
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const error = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const loginWithCredentials = useAuthStore(
    (state) => state.loginWithCredentials,
  )
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const clearError = useAuthStore((state) => state.clearError)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (user) {
      const searchParams = new URLSearchParams(location.search)
      const onreturn = searchParams.get('onreturn')
      const fromState = (location.state as { from?: string })?.from

      if (onreturn && !onreturn.startsWith('/login')) {
        navigate(onreturn, { replace: true })
      } else if (fromState && !fromState.startsWith('/login')) {
        navigate(fromState, { replace: true })
      } else {
        const dashboardRoute = DASHBOARD_ROUTES[user.role] || '/dashboard'
        navigate(dashboardRoute, { replace: true })
      }
    }
  }, [user, navigate, location])

  useEffect(() => {
    const animacionTitulo = animate('.login-title-char', {
      opacity: [0, 1],
      translateY: [16, 0],
      filter: ['blur(12px)', 'blur(0px)'],
      duration: 900,
      delay: stagger(25, { from: 'first' }),
      ease: 'outCubic',
    })

    const animacionSubtitulo = animate('.login-subtitle-word', {
      opacity: [0, 1],
      translateY: [8, 0],
      scale: [0.98, 1],
      duration: 600,
      delay: stagger(70, { from: 'first' }),
      ease: 'outCubic',
    })

    const animacionFeatures = animate('.feature-item', {
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 500,
      delay: stagger(120, { from: 'first' }),
      ease: 'outCubic',
    })

    return () => {
      animacionTitulo.revert()
      animacionSubtitulo.revert()
      animacionFeatures.revert()
    }
  }, [])

  const handleGoogleLogin = async (response: { credential: string }) => {
    try {
      clearError()
      await loginWithGoogle(response.credential)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google.'
      showToast(msg, 'error')
    }
  }

  const handleGoogleLoginRef = useRef(handleGoogleLogin)
  useEffect(() => {
    handleGoogleLoginRef.current = handleGoogleLogin
  })

  useEffect(() => {
    const scriptId = 'google-gsi-client'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (res) => handleGoogleLoginRef.current(res),
        })

        const container = document.getElementById('google-signin-btn-container')
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 380,
          })
        }
      }
    }

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      document.body.appendChild(script)
    } else {
      initializeGoogle()
    }
  }, [])

  const onClickGoogle = () => {
    if (window.google) {
      window.google.accounts.id.prompt()
    } else {
      showToast('El servicio de Google no está disponible. Reintente en unos momentos.', 'error')
    }
  }

  const onSubmit = async (data: LoginSchema) => {
    try {
      clearError()
      await loginWithCredentials({
        email: data.email,
        password: data.password,
      })
    } catch {
      // noop
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-split">
        {/* ── Left: Branding Panel ── */}
        <aside className="auth-brand">
          <div className="brand-content">
            <div className="brand-logo">
              <img src={logoSvg} alt="CDA del Putumayo" className="brand-logo-img" />
            </div>

            <h1 className="auth-title" aria-label={LOGIN_TITLE}>
              {renderTextCharacters(LOGIN_TITLE, 'login-title-char')}
            </h1>

            <p className="auth-subtitle login-subtitle" aria-label={LOGIN_SUBTITLE}>
              {LOGIN_SUBTITLE.split(' ').map((word, index, words) => (
                <span key={`${word}-${index}`} className="login-subtitle-word">
                  {word}
                  {index < words.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </p>

            <div className="brand-features">
              {FEATURES.map((feature) => (
                <div key={feature} className="feature-item">
                  <CheckCircle size={20} className="feature-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right: Form Panel ── */}
        <div className="auth-form-panel">
          <section className="auth-card">
            <div className="auth-card-header">
              <div className="logo-circle mobile-only">
                <Car size={38} strokeWidth={2.2} />
              </div>
              <h2>Iniciar Sesión</h2>
              <p className="auth-card-desc">
                Accede al sistema de gestión CDA Putumayo
              </p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
              <label>
                Correo Electrónico
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="usuario@cda.com"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email ? (
                  <span className="field-error">{errors.email.message}</span>
                ) : null}
              </label>

              <label>
                Contraseña
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password ? (
                  <span className="field-error">{errors.password.message}</span>
                ) : null}
              </label>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked={false} />
                  <span>Recordarme</span>
                </label>
                <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button type="submit" disabled={isSubmitting || isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
              </button>

              <div className="form-badge">
                <span className="badge-dot" />
                <span>+5.000 inspecciones realizadas</span>
              </div>

              <div className="auth-divider">
                <span>o continúa con</span>
              </div>

              <div className="google-btn-wrapper">
                <button
                  type="button"
                  className="btn-google-oauth"
                  onClick={onClickGoogle}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" className="google-icon" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Ingresar con Google</span>
                </button>
                <div id="google-signin-btn-container" className="google-signin-overlay"></div>
              </div>

              <div className="form-support">
                <span>¿Necesitas ayuda?</span>
                <a href="#" onClick={(e) => e.preventDefault()}>Soporte técnico</a>
              </div>
            </form>
          </section>

          <p className="auth-footer">
            © {new Date().getFullYear()} CDA Putumayo — Todos los derechos reservados
          </p>
        </div>
      </div>

      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button
            className="toast-close-btn"
            onClick={() => setToast(null)}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              marginLeft: 'auto',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </main>
  )
}
