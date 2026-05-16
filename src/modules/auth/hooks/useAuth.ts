import { useAuthStore } from '@/core/store/authStore'

/**
 * Hook de aplicación que expone las acciones y estado de autenticación.
 * Actúa como capa de aplicación (caso de uso) entre la UI y el store global.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const loginWithCredentials = useAuthStore((state) => state.loginWithCredentials)
  const loginAsDemo = useAuthStore((state) => state.loginAsDemo)
  const logout = useAuthStore((state) => state.logout)
  const clearError = useAuthStore((state) => state.clearError)

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithCredentials,
    loginAsDemo,
    logout,
    clearError,
  }
}
