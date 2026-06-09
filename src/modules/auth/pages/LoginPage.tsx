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
  const [useGoogleFallback, setUseGoogleFallback] = useState(() => {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost' && !!(window as any).Capacitor
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
    const isAndroidAPK = typeof window !== 'undefined' && window.location.hostname === 'localhost' && !!(window as any).Capacitor

    if (!isAndroidAPK) {
      return
    }

    // 1. OAUTH FALLBACK INJECTION AND ERROR HANDLING
    const SCRIPT_URL = 'https://accounts.google.com/gsi/client'
    let script = document.querySelector(`script[src="${SCRIPT_URL}"]`) as HTMLScriptElement

    const initGoogle = () => {
      const g = (window as any).google
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim(),
            callback: (res: any) => {
              if (res.credential) {
                handleGoogleLogin({ credential: res.credential })
              }
            },
            ux_mode: 'popup', // Forzar siempre popup para evitar el escape al navegador externo
            context: 'signin'
          })
        } catch (err) {
          console.error('Error initializing Google Accounts GSI:', err)
        }
      }
    }

    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.defer = true
      script.onload = initGoogle
      script.onerror = () => {
        setUseGoogleFallback(true)
      }
      document.body.appendChild(script)
    } else {
      if ((window as any).google?.accounts?.id) {
        initGoogle()
      } else {
        script.addEventListener('load', initGoogle)
      }
      script.addEventListener('error', () => setUseGoogleFallback(true))
    }

    // 2. PARSE HASH FOR REDIRECT OAUTH (Implicit flow fallback)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const idToken = params.get('id_token')
      if (idToken) {
        handleGoogleLogin({ credential: idToken })
        window.location.hash = ''
      }
    }

    // 3. CHECK FOR STORED FALLBACK OAUTH TOKEN (stored by main.tsx)
    const tempToken = localStorage.getItem('temp_google_id_token')
    if (tempToken) {
      handleGoogleLogin({ credential: tempToken })
      localStorage.removeItem('temp_google_id_token')
    }
  }, [location])

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
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                {useGoogleFallback ? (
                  <button
                    type="button"
                    className="btn-google-custom"
                    onClick={async () => {
                      const Capacitor = (window as any).Capacitor
                      const GoogleAuth = Capacitor?.Plugins?.GoogleAuth
                      if (GoogleAuth) {
                        try {
                          const user = await GoogleAuth.signIn()
                          if (user?.authentication?.idToken) {
                            handleGoogleLogin({ credential: user.authentication.idToken })
                            return
                          }
                        } catch (err) {
                          console.error('Capacitor GoogleAuth error:', err)
                        }
                      }
                      
                      // Fallback implicit OAuth redirect
                      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
                      const redirectUri = window.location.origin
                      const nonce = Math.random().toString(36).substring(2)
                      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`
                      window.location.href = authUrl
                    }}
                  >
                    <svg viewBox="0 0 48 48" className="google-icon-svg" style={{ width: '18px', height: '18px', marginRight: '10px', display: 'block', flexShrink: 0 }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.89h12.66c-.55 2.92-2.19 5.39-4.66 7.05l7.24 5.61C43.5 36.32 46.5 30.73 46.5 24z"/>
                      <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.24-5.61c-2 .67-4.55 1.07-7.65 1.07-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Iniciar sesión con Google</span>
                  </button>
                ) : (
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
                )}
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
