import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import { Car } from 'lucide-react'
import {
  loginSchema,
  type LoginSchema,
} from '@/modules/auth/domain/auth.schema'
import { useAuthStore } from '@/core/store/authStore'
import './LoginPage.css'

/**
 * Mapeo de rutas por rol del usuario
 */
const DASHBOARD_ROUTES: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/recepcion',
  OPERARIO: '/recepcion',
  INSPECTOR: '/inspeccion/asignacion',
  FACTURADOR: '/facturacion',
}

const LOGIN_TITLE = 'CDA del Putumayo'
const LOGIN_SUBTITLE = 'Sistema de Control de Acceso'

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
  const clearError = useAuthStore((state) => state.clearError)

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

  /**
   * Después de un login exitoso, redirigir según el rol del usuario
   */
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

    return () => {
      animacionTitulo.revert()
      animacionSubtitulo.revert()
    }
  }, [])

  /**
   * Manejo del submit del formulario
   */
  const onSubmit = async (data: LoginSchema) => {
    try {
      clearError()
      await loginWithCredentials({
        email: data.email,
        password: data.password,
      })
      // La redirección ocurre automáticamente en el useEffect cuando user cambia
    } catch {
      // El error ya está en el store, se mostrará en el formulario
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <div className="auth-header">
          <div className="logo-circle">
            <Car size={42} strokeWidth={2.2} />
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
        </div>

        <section className="auth-card">
          <h2>Iniciar Sesión</h2>

          {/* Mostrar error genérico del servidor */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
            <label>
              Correo Electrónico
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="usuario@cda.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email ? (
                <span className="field-error">{errors.email.message}</span>
              ) : null}
            </label>

            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password ? (
                <span className="field-error">{errors.password.message}</span>
              ) : null}
            </label>

            <button type="submit" disabled={isSubmitting || isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
          </form>
        </section>

        <p className="auth-footer">
          © {new Date().getFullYear()} CDA Putumayo — Todos los derechos reservados
        </p>
      </div>
    </main>
  )
}
