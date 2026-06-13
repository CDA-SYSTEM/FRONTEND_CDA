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
import { ArchivosPage } from '@/modules/storage/pages/ArchivosPage'
import { TrackerPage } from '@/modules/tracker/pages/TrackerPage'
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
  // Backend (minúsculas): admin | manager | operario | inspector | facturador | superadmin
  const roleRoutes: Record<string, string> = {
    admin: '/admin/dashboard',
    superadmin: '/admin/dashboard',
    manager: '/recepcion',
    operario: '/recepcion',
    inspector: '/inspeccion/asignacion',
    facturador: '/facturacion',
    recepcionista: '/recepcion',
  }

  const route = roleRoutes[user.role] || '/dashboard'
  return <Navigate to={route} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas generales (requieren estar autenticado) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Solo Admin, Manager, Facturador */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'manager', 'facturador']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* Solo Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/archivos" element={<ArchivosPage />} />
            </Route>

            {/* Solo Admin, Manager, Recepcionista, Operario */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'manager', 'operario', 'recepcionista']} />}>
              <Route path="/recepcion" element={<RecepcionPage />} />
            </Route>

            {/* Admin, Manager, Recepcionista, Operario, Inspector */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'manager', 'operario', 'recepcionista', 'inspector']} />}>
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/vehiculo/registro" element={<RegistroVehiculoPage />} />
            </Route>

            {/* Admin, Inspector */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'inspector']} />}>
              <Route path="/inspeccion" element={<InspeccionPage />} />
              <Route path="/inspeccion/asignacion" element={<AsignacionPage />} />
              <Route path="/inspeccion/ejecutar/:vehicleType/:inspectionId" element={<ChecklistPage />} />
              <Route path="/inspeccion/ejecutar/:inspectionId" element={<ChecklistPage />} />
            </Route>

            {/* Admin, Manager, Facturador */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'manager', 'facturador']} />}>
              <Route path="/facturacion" element={<FacturacionPage />} />
            </Route>

            {/* Admin, Manager */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'manager']} />}>
              <Route path="/precios" element={<PreciosPage />} />
              <Route path="/estados" element={<EstadosPage />} />
              <Route path="/plantillas" element={<PlantillasPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
