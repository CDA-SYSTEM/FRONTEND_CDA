import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { getGuardRedirect } from '@/modules/auth/components/guard'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()
  const redirectPath = getGuardRedirect(isAuthenticated)

  if (redirectPath) {
    return <Navigate to={redirectPath} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
