import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { FacturacionPage } from '@/modules/facturacion/pages/FacturacionPage'
import { AsignacionPage } from '@/modules/inspeccion/pages/AsignacionPage'
import { ChecklistPage } from '@/modules/inspeccion/pages/ChecklistPage'
import { InspeccionPage } from '@/modules/inspeccion/pages/InspeccionPage'
import { RecepcionPage } from '@/modules/recepcion/pages/RecepcionPage'
import { ClientesPage } from '@/modules/recepcion/pages/ClientesPage'
import { RegistroVehiculoPage } from '@/modules/vehiculo/pages/RegistroVehiculoPage'
import { UsuariosPage } from '@/modules/usuarios/pages/UsuariosPage'
import { PreciosPage } from '@/modules/precios/pages/PreciosPage'
import { EstadosPage } from '@/modules/estados/pages/EstadosPage'
import { PlantillasPage } from '@/modules/inspeccion/pages/PlantillasPage'
import { AdminDashboard } from '@/modules/admin/pages/AdminDashboard'
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

  // Mapeo de roles backend → ruta inicial del frontend
  // Backend: ADMIN | MANAGER | OPERARIO | INSPECTOR | FACTURADOR
  const roleRoutes: Record<string, string> = {
    ADMIN: '/dashboard',
    MANAGER: '/recepcion',
    OPERARIO: '/recepcion',
    INSPECTOR: '/inspeccion/asignacion',
    FACTURADOR: '/facturacion',
    RECEPCIONISTA: '/recepcion',
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
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recepcion" element={<RecepcionPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/inspeccion" element={<InspeccionPage />} />
            <Route path="/inspeccion/asignacion" element={<AsignacionPage />} />
            <Route path="/inspeccion/checklist/:vehicleType/:inspectionId" element={<ChecklistPage />} />
            <Route path="/inspeccion/checklist/:inspectionId" element={<ChecklistPage />} />
            <Route path="/facturacion" element={<FacturacionPage />} />
            <Route path="/precios" element={<PreciosPage />} />
            <Route path="/estados" element={<EstadosPage />} />
            <Route path="/plantillas" element={<PlantillasPage />} />
            <Route path="/vehiculo/registro" element={<RegistroVehiculoPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
