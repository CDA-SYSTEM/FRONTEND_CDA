import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
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


const DASHBOARD_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  superadmin: '/admin/dashboard',
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
  const [googleBtnWidth, setGoogleBtnWidth] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 480 ? 300 : 380
  })

  useEffect(() => {
    const handleResize = () => {
      setGoogleBtnWidth(window.innerWidth < 480 ? 300 : 380)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
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
        const roleKey = (user.role || '').toLowerCase()
        const dashboardRoute = DASHBOARD_ROUTES[roleKey] || '/dashboard'
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
      <div className="bg-image" />
      <div className="bg-overlay" />
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
                <GoogleLogin
                  onSuccess={(credentialResponse: any) => {
                    if (credentialResponse.credential) {
                      handleGoogleLogin({ credential: credentialResponse.credential })
                    }
                  }}
                  onError={() => showToast('Error al iniciar sesión con Google.', 'error')}
                  shape="rectangular"
                  size="large"
                  width={googleBtnWidth}
                  theme="outline"
                  text="signin_with"
                />
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
