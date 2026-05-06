import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { loginSchema, type LoginSchema } from '@/modules/auth/schemas/loginSchema'
import { useAuthStore } from '@/modules/auth/store/authStore'
import './LoginPage.css'

/**
 * Mapeo de rutas por rol del usuario
 */
const DASHBOARD_ROUTES: Record<string, string> = {
  ADMIN: '/dashboard',
  RECEPCIONISTA: '/recepcion',
  INSPECTOR: '/inspeccion',
  FACTURADOR: '/facturacion',
}

export function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const error = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const loginWithCredentials = useAuthStore((state) => state.loginWithCredentials)
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
      const dashboardRoute = DASHBOARD_ROUTES[user.role] || '/dashboard'
      navigate(dashboardRoute, { replace: true })
    }
  }, [user, navigate])

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
    } catch (err) {
      // El error ya está en el store, se mostrará en el formulario
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Ingreso CDA Putumayo</h1>
        <p>Accede al modulo de recepcion e inspeccion vehicular.</p>

        {/* Mostrar error genérico del servidor */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          <label>
            Correo
            <input
              type="email"
              placeholder="usuario@cda.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </label>

          <label>
            Contraseña
            <input
              type="password"
              placeholder="******"
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

        {/* Link a recuperación de contraseña (futuro) */}
        <p className="forgot-password">
          <a href="#forgot-password">¿Olvidó su contraseña?</a>
        </p>
      </section>
    </main>
  )
}
