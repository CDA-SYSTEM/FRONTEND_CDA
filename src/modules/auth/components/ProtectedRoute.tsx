import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { getGuardRedirect } from '@/modules/auth/components/guard'

const DASHBOARD_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  superadmin: '/admin/dashboard',
  manager: '/recepcion',
  operario: '/recepcion',
  inspector: '/inspeccion/asignacion',
  facturador: '/facturacion',
  recepcionista: '/recepcion',
}

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()
  const redirectPath = getGuardRedirect(isAuthenticated)

  if (redirectPath) {
    return (
      <Navigate to={redirectPath} replace state={{ from: location.pathname + location.search }} />
    )
  }

  // Si el rol del usuario no está dentro de los roles permitidos para esta ruta
  if (user && allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
    const defaultRoute = DASHBOARD_ROUTES[user.role.toLowerCase()] || '/dashboard'
    return <Navigate to={defaultRoute} replace />
  }

  return <Outlet />
}
