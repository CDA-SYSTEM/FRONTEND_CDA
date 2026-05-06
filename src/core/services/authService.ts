import { apiClient } from '@/core/api/apiClient'
import type { AuthUser, LoginFormData } from '@/modules/auth/types/auth.types'

interface LoginResponse {
  token: string
  user: AuthUser
}

export const authService = {
  /**
   * Autentica el usuario contra el endpoint /auth/login
   * @param credentials - email y password del usuario
   * @returns token y datos del usuario
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      return response.data
    } catch (error: any) {
      // Error genérico sin revelar si el usuario existe
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw new Error('Credenciales inválidas. Verifique su email y contraseña.')
      }

      if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.')
      }

      throw new Error(
        error.message || 'Error al iniciar sesión. Por favor, intente de nuevo.'
      )
    }
  },

  /**
   * Logout - simplemente se hace client-side borrando el token
   * (el backend puede invalidar sesión si es necesario)
   */
  async logout(): Promise<void> {
    // Opcional: llamar a /auth/logout si el backend requiere notificación
    // await apiClient.post('/auth/logout')
    // Por ahora solo se borra el token client-side
  },
}
