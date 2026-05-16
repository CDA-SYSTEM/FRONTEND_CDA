import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { FacturacionPage } from '@/modules/facturacion/pages/FacturacionPage'
import { InspeccionPage } from '@/modules/inspeccion/pages/InspeccionPage'
import { RecepcionPage } from '@/modules/recepcion/pages/RecepcionPage'
import { UsuariosPage } from '@/modules/usuarios/pages/UsuariosPage'
import { AppLayout } from '@/shared/layout/AppLayout'
import { useAuthStore } from '@/core/store/authStore'

/**
 * Componente que redirija "/" al módulo correcto según el rol del usuario
 */
function RoleBasedRedirect() {
  const user = useAuthStore((state) => state.user)

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Mapeo de roles a sus rutas
  const roleRoutes: Record<string, string> = {
    ADMIN: '/dashboard',
    RECEPCIONISTA: '/recepcion',
    INSPECTOR: '/inspeccion',
    FACTURADOR: '/facturacion',
  }

  const route = roleRoutes[user.role] || '/dashboard'
  return <Navigate to={route} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recepcion" element={<RecepcionPage />} />
            <Route path="/inspeccion" element={<InspeccionPage />} />
            <Route path="/facturacion" element={<FacturacionPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
