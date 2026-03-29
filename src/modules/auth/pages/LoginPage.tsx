import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { loginSchema, type LoginSchema } from '@/modules/auth/schemas/loginSchema'
import { useAuthStore } from '@/modules/auth/store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const loginAsDemo = useAuthStore((state) => state.loginAsDemo)

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

  const onSubmit = async () => {
    loginAsDemo('RECEPCIONISTA')
    navigate('/')
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Ingreso CDA Putumayo</h1>
        <p>Accede al modulo de recepcion e inspeccion vehicular.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          <label>
            Correo
            <input
              type="email"
              placeholder="usuario@cda.com"
              {...register('email')}
            />
            {errors.email ? <span>{errors.email.message}</span> : null}
          </label>

          <label>
            Contrasena
            <input type="password" placeholder="******" {...register('password')} />
            {errors.password ? <span>{errors.password.message}</span> : null}
          </label>

          <button type="submit" disabled={isSubmitting}>
            Ingresar
          </button>
        </form>
      </section>
    </main>
  )
}
