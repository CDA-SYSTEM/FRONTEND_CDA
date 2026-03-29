import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { FacturacionPage } from '@/modules/facturacion/pages/FacturacionPage'
import { InspeccionPage } from '@/modules/inspeccion/pages/InspeccionPage'
import { RecepcionPage } from '@/modules/recepcion/pages/RecepcionPage'
import { AppLayout } from '@/shared/layout/AppLayout'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/recepcion" element={<RecepcionPage />} />
            <Route path="/inspeccion" element={<InspeccionPage />} />
            <Route path="/facturacion" element={<FacturacionPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
