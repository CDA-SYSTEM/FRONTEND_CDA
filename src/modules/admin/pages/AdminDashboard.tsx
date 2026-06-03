import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  LayoutDashboard, Users, Car, Shield, FileText,
  Receipt, HardDrive, ClipboardList, MapPin, Settings,
  Activity, UserCheck, Truck, AlertTriangle, DollarSign,
  FileUp, CheckSquare, Clock, Calendar, TrendingUp,
  Wifi, Server, Globe, UserPlus, RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { useAdminStats } from '@/modules/admin/hooks/useAdminStats'
import type { AdminDashboardData, ClientStats, VehicleStats, InspectionStats, InvoiceStats, StorageStats, ChecklistStats, TrackerStats } from '@/modules/admin/domain/admin.types'
import '../Admin.css'

const CHART_COLORS = ['#155dfc', '#0f47d6', '#16a34a', '#d97706', '#9333ea', '#e11d48', '#0891b2', '#4f46e5', '#ca8a04']
const STATUS_NAMES: Record<string, string> = {
  '6a1ad9bf4d644ab738782e4b': 'COMPLETADA',
  '6a1ad9c04d644ab738782e4c': 'PENDIENTE',
  '6a1ad9cd20d2071ac5aec90f': 'CANCELADA',
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

function formatBytes(bytes: number): string {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function statNameDisplay(key: string): string {
  return STATUS_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ─── Reusable Components ─── */

function KpiCard({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: string | number; label: string }) {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-top">
        <div className={`admin-kpi-icon ${color}`}>{icon}</div>
      </div>
      <div className="admin-kpi-value">{value}</div>
      <div className="admin-kpi-label">{label}</div>
    </div>
  )
}

function LoadingSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 16, width: `${60 + Math.random() * 30}%`, background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '200% 100%', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
      ))}
    </div>
  )
}

function ErrorPanel({ message }: { message?: string }) {
  return (
    <div className="admin-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem' }}>
      <AlertTriangle size={24} style={{ color: '#e11d48' }} />
      <p style={{ color: '#e11d48', fontWeight: 500 }}>{message || 'Error al cargar datos del servicio'}</p>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="admin-kpi-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#e2e8f0' }} />
      <div style={{ height: 28, width: '60%', borderRadius: 6, background: '#e2e8f0', marginTop: 8 }} />
      <div style={{ height: 14, width: '40%', borderRadius: 6, background: '#e2e8f0' }} />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="admin-chart-card">
      <div style={{ height: 16, width: '50%', borderRadius: 6, background: '#e2e8f0', marginBottom: 16 }} />
      <div style={{ height: 200, borderRadius: 8, background: '#f8fafc', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        Cargando...
      </div>
    </div>
  )
}

/* ─── StatChart helpers ─── */

function PieStatChart({ data, title, icon }: { data: Record<string, number> | undefined; title: string; icon: React.ReactNode }) {
  if (!data) return null
  const entries = Object.entries(data)
  if (entries.length === 0) return null
  return (
    <div className="admin-chart-card">
      <h3>{icon} {title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={entries.map(([k, v]) => ({ name: statNameDisplay(k), value: v }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {entries.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function BarStatChart({ data, title, icon, color = '#155dfc', layout = 'vertical' }: { data: { label: string; count: number }[] | undefined; title: string; icon: React.ReactNode; color?: string; layout?: 'vertical' | 'horizontal' }) {
  if (!data || data.length === 0) return null
  const chartData = data.map((d) => ({ name: d.label, count: d.count }))
  return (
    <div className="admin-chart-card">
      <h3>{icon} {title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        {layout === 'vertical' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis type="number" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Tabs ─── */

function DashboardTab({ data, loading, error }: { data: AdminDashboardData; loading: boolean; error: boolean }) {
  const user = useAuthStore((s) => s.user)
  const cl = data.clients
  const veh = data.vehicles
  const ins = data.inspections
  const inv = data.invoices
  const sto = data.storage
  const chk = data.checklist

  const revenueData = inv?.revenueByMonth
    ? Object.entries(inv.revenueByMonth).map(([k, v]) => ({ month: k, revenue: v / 1000000 }))
    : []

  if (error && !cl && !veh && !ins && !inv && !sto && !chk) {
    return <ErrorPanel message="No se pudieron cargar los datos del dashboard" />
  }

  return (
    <div className="admin-content">
      <div className="admin-welcome">
        <h2>Bienvenido, {user?.name || 'Administrador'}</h2>
        <p>Panel de control centralizado del CDA Putumayo — datos en tiempo real de todos los servicios.</p>
      </div>

      <div className="admin-kpi-grid">
        {loading && !cl ? <KpiSkeleton /> : <KpiCard icon={<Users size={20} />} color="blue" value={cl?.totalClients ?? '—'} label="Total Clientes" />}
        {loading && !veh ? <KpiSkeleton /> : <KpiCard icon={<Car size={20} />} color="green" value={veh?.totalVehicles ?? '—'} label="Total Vehículos" />}
        {loading && !ins ? <KpiSkeleton /> : <KpiCard icon={<FileText size={20} />} color="purple" value={ins?.totalInspections ?? '—'} label="Inspecciones" />}
        {loading && !inv ? <KpiSkeleton /> : <KpiCard icon={<Receipt size={20} />} color="amber" value={inv ? formatCurrency(inv.totalRevenue) : '—'} label="Ingresos Totales" />}
        {loading && !sto ? <KpiSkeleton /> : <KpiCard icon={<HardDrive size={20} />} color="cyan" value={sto ? formatBytes(sto.totalSizeBytes) : '—'} label="Almacenamiento" />}
        {loading && !chk ? <KpiSkeleton /> : <KpiCard icon={<ClipboardList size={20} />} color="indigo" value={chk?.total_inspections ?? '—'} label="Checklists" />}
      </div>

      <div className="admin-chart-grid">
        {!ins ? <ChartSkeleton /> : (
          <PieStatChart data={ins.byStatus} title="Inspecciones por Estado" icon={<Activity size={16} />} />
        )}
        {revenueData.length === 0 ? <ChartSkeleton /> : (
          <div className="admin-chart-card">
            <h3><TrendingUp size={16} /> Ingresos Mensuales (COP millones)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(1)}M`, 'Ingresos']} />
                <Bar dataKey="revenue" fill="#155dfc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="admin-chart-grid">
        {veh ? <BarStatChart data={veh.byBrand} title="Vehículos por Marca" icon={<Truck size={16} />} color="#16a34a" layout="horizontal" /> : <ChartSkeleton />}
        {sto ? <PieStatChart data={Object.fromEntries(sto.filesByMimetype?.map((f) => [f.mimetype.split('/')[1]?.toUpperCase() || f.mimetype, f.count]) ?? [])} title="Archivos por Tipo" icon={<FileUp size={16} />} /> : <ChartSkeleton />}
      </div>
    </div>
  )
}

function ClientesTab({ data, loading, error }: { data: ClientStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar estadísticas de clientes" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Users size={20} /> Gestión de Clientes</h3>
      <div className="admin-kpi-grid">
        <KpiCard icon={<UserCheck size={20} />} color="blue" value={data.totalClients} label="Total Clientes" />
        <KpiCard icon={<Activity size={20} />} color="green" value={data.activeClients} label="Clientes Activos" />
        <KpiCard icon={<AlertTriangle size={20} />} color="rose" value={data.inactiveClients} label="Clientes Inactivos" />
      </div>

      <div className="admin-chart-grid">
        <BarStatChart data={data.clientsByDocumentType} title="Por Tipo de Documento" icon={<UserCheck size={16} />} color="#155dfc" />
        <PieStatChart data={Object.fromEntries(data.clientsByPersonType?.map((p) => [p.label, p.count]) ?? [])} title="Por Tipo de Persona" icon={<Users size={16} />} />
      </div>

      <div className="admin-flex-row" style={{ marginTop: '0.5rem' }}>
        <Link to="/clientes" className="admin-link-btn"><UserPlus size={16} /> Ir a Gestión de Clientes</Link>
      </div>
    </div>
  )
}

function VehiculosTab({ data, loading, error }: { data: VehicleStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar estadísticas de vehículos" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Car size={20} /> Gestión de Vehículos</h3>
      <div className="admin-kpi-grid">
        <KpiCard icon={<Truck size={20} />} color="blue" value={data.totalVehicles} label="Total Vehículos" />
        <KpiCard icon={<Activity size={20} />} color="green" value={data.byBrand?.length ?? 0} label="Marcas Diferentes" />
        <KpiCard icon={<Car size={20} />} color="purple" value={data.byType?.length ?? 0} label="Tipos de Vehículo" />
      </div>

      <div className="admin-chart-grid">
        <BarStatChart data={data.byBrand} title="Por Marca" icon={<Truck size={16} />} color="#16a34a" />
        <PieStatChart data={Object.fromEntries(data.byType?.map((t) => [t.label, t.count]) ?? [])} title="Distribución por Tipo" icon={<Car size={16} />} />
      </div>

      <div className="admin-section-card">
        <h3 className="admin-section-title" style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}><Shield size={16} /> Detalles por Tipo de Combustible y Servicio</h3>
        <div className="admin-detail-grid">
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Combustible</p>
            {data.byFuelType?.map((f) => (
              <div className="admin-detail-item" key={f.label}>
                <span className="admin-detail-label">{f.label}</span>
                <span className="admin-detail-value">{f.count}</span>
              </div>
            )) ?? <div className="admin-empty">Sin datos</div>}
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Servicio</p>
            {data.byServiceType?.map((s) => (
              <div className="admin-detail-item" key={s.label}>
                <span className="admin-detail-label">{s.label}</span>
                <span className="admin-detail-value">{s.count}</span>
              </div>
            )) ?? <div className="admin-empty">Sin datos</div>}
          </div>
        </div>
      </div>

      <div className="admin-flex-row">
        <Link to="/vehiculo/registro" className="admin-link-btn"><Car size={16} /> Ir a Registro de Vehículos</Link>
      </div>
    </div>
  )
}

function UsuariosTab() {
  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Shield size={20} /> Gestión de Usuarios</h3>

      <div className="admin-welcome" style={{ marginBottom: '1rem' }}>
        <p>Administre los usuarios del sistema, roles y permisos de acceso.</p>
      </div>

      <div className="admin-section-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>Roles del Sistema</h3>
        <div className="admin-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[
            { role: 'ADMIN', desc: 'Acceso total al sistema' },
            { role: 'MANAGER', desc: 'Gestión operativa y reportes' },
            { role: 'OPERARIO', desc: 'Recepción y registro de vehículos' },
            { role: 'INSPECTOR', desc: 'Inspecciones y checklists' },
            { role: 'FACTURADOR', desc: 'Facturación y cobros' },
          ].map((r) => (
            <div className="admin-detail-item" key={r.role}>
              <span className="admin-detail-label">
                <span className={`admin-badge ${r.role === 'ADMIN' ? 'red' : r.role === 'MANAGER' ? 'purple' : 'blue'}`}>{r.role}</span>
              </span>
              <span className="admin-detail-value" style={{ fontSize: '0.85rem', color: '#64748b' }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-flex-row">
        <Link to="/usuarios" className="admin-link-btn"><Shield size={16} /> Ir a Gestión de Usuarios</Link>
      </div>
    </div>
  )
}

function InspeccionesTab({ data, loading, error }: { data: InspectionStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar estadísticas de inspecciones" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><FileText size={20} /> Inspecciones Técnico-Mecánicas</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<FileText size={20} />} color="blue" value={data.totalInspections} label="Total Inspecciones" />
        <KpiCard icon={<Calendar size={20} />} color="green" value={data.todayInspections} label="Hoy" />
        <KpiCard icon={<Calendar size={20} />} color="amber" value={data.weekInspections} label="Esta Semana" />
        <KpiCard icon={<Calendar size={20} />} color="purple" value={data.monthInspections} label="Este Mes" />
      </div>

      <div className="admin-chart-grid">
        <PieStatChart data={data.byStatus} title="Por Estado" icon={<Activity size={16} />} />
        <PieStatChart data={data.byVehicleType} title="Por Tipo de Vehículo" icon={<Car size={16} />} />
      </div>

      {data.byServiceType && Object.keys(data.byServiceType).length > 0 && (
        <div className="admin-section-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Por Tipo de Servicio</h3>
          <div className="admin-detail-grid">
            {Object.entries(data.byServiceType).map(([k, v]) => (
              <div className="admin-detail-item" key={k}>
                <span className="admin-detail-label">{statNameDisplay(k)}</span>
                <span className="admin-detail-value">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FacturacionTab({ data, loading, error }: { data: InvoiceStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar estadísticas de facturación" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  const revenueData = Object.entries(data.revenueByMonth ?? {}).map(([k, v]) => ({ month: k, revenue: v }))

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Receipt size={20} /> Facturación</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<Receipt size={20} />} color="blue" value={data.totalInvoices} label="Total Facturas" />
        <KpiCard icon={<DollarSign size={20} />} color="green" value={formatCurrency(data.totalRevenue)} label="Ingresos Totales" />
        <KpiCard icon={<TrendingUp size={20} />} color="amber" value={formatCurrency(data.todayRevenue)} label="Ingresos Hoy" />
        <KpiCard icon={<TrendingUp size={20} />} color="purple" value={formatCurrency(data.monthRevenue)} label="Ingresos del Mes" />
      </div>

      <div className="admin-chart-grid">
        {revenueData.length > 0 ? (
          <div className="admin-chart-card">
            <h3><TrendingUp size={16} /> Ingresos por Mes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(Number(v) / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Ingresos']} />
                <Line type="monotone" dataKey="revenue" stroke="#155dfc" strokeWidth={2} dot={{ fill: '#155dfc', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <ChartSkeleton />}
        <PieStatChart data={data.byStatus} title="Por Estado" icon={<Activity size={16} />} />
      </div>

      <div className="admin-flex-row">
        <Link to="/facturacion" className="admin-link-btn"><Receipt size={16} /> Ir a Facturación</Link>
      </div>
    </div>
  )
}

function AlmacenamientoTab({ data, loading, error }: { data: StorageStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar estadísticas de almacenamiento" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><HardDrive size={20} /> Almacenamiento de Archivos</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<FileUp size={20} />} color="blue" value={data.totalFiles} label="Total Archivos" />
        <KpiCard icon={<HardDrive size={20} />} color="green" value={formatBytes(data.totalSizeBytes)} label="Espacio Ocupado" />
        <KpiCard icon={<Activity size={20} />} color="amber" value={data.recentUploads} label="Subidas Recientes" />
        <KpiCard icon={<CheckSquare size={20} />} color="purple" value={data.activeFiles} label="Archivos Activos" />
      </div>

      <div className="admin-chart-grid">
        <PieStatChart data={Object.fromEntries(data.filesByMimetype?.map((f) => [f.mimetype.split('/')[1]?.toUpperCase() || f.mimetype, f.count]) ?? [])} title="Archivos por Tipo MIME" icon={<FileUp size={16} />} />
        <div className="admin-chart-card">
          <h3><HardDrive size={16} /> Detalles de Almacenamiento</h3>
          <div className="admin-detail-grid">
            {data.filesByMimetype?.map((f) => (
              <div className="admin-detail-item" key={f.mimetype}>
                <span className="admin-detail-label">{f.mimetype}</span>
                <span className="admin-detail-value">{f.count} archivos</span>
              </div>
            ))}
            <div className="admin-detail-item">
              <span className="admin-detail-label">Activos / Total</span>
              <span className="admin-detail-value">{data.activeFiles} / {data.totalFiles}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChecklistTab({ data, loading, error }: { data: ChecklistStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar estadísticas de checklist" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><ClipboardList size={20} /> Inspecciones Checklist</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<ClipboardList size={20} />} color="blue" value={data.total_inspections} label="Total Checklists" />
        <KpiCard icon={<Calendar size={20} />} color="green" value={data.today_inspections} label="Hoy" />
        <KpiCard icon={<Calendar size={20} />} color="purple" value={data.month_inspections} label="Este Mes" />
        <KpiCard icon={<FileText size={20} />} color="amber" value={data.total_templates} label="Plantillas" />
        <KpiCard icon={<CheckSquare size={20} />} color="cyan" value={data.total_with_labrado} label="Con Labrado" />
      </div>

      <div className="admin-chart-grid">
        <PieStatChart data={data.by_status} title="Por Estado" icon={<Activity size={16} />} />
        <PieStatChart data={data.by_vehicle_type} title="Por Tipo de Vehículo" icon={<Car size={16} />} />
      </div>

      {data.by_result && Object.keys(data.by_result).length > 0 && (
        <div className="admin-section-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Resultados</h3>
          <div className="admin-detail-grid">
            {Object.entries(data.by_result).map(([k, v]) => (
              <div className="admin-detail-item" key={k}>
                <span className="admin-detail-label">{statNameDisplay(k)}</span>
                <span className="admin-detail-value">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrackerTab({ data, loading, error }: { data: TrackerStats | undefined; loading: boolean; error: boolean }) {
  if (error) return <ErrorPanel message="Error al cargar datos del tracker externo" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><MapPin size={20} /> Tracker Externo</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<Users size={20} />} color="blue" value={data.total_clientes ?? '—'} label="Clientes Tracker" />
        <KpiCard icon={<Truck size={20} />} color="green" value={data.total_vehiculos ?? '—'} label="Vehículos Tracker" />
        <KpiCard icon={<ClipboardList size={20} />} color="purple" value={data.total_planillas ?? '—'} label="Planillas" />
      </div>

      <div className="admin-chart-grid">
        <BarStatChart data={data.vehiculos_por_marca?.map((v) => ({ label: v.marca, count: v.total }))} title="Vehículos por Marca (Tracker)" icon={<Truck size={16} />} color="#9333ea" />
        <div className="admin-chart-card">
          <h3><Calendar size={16} /> Planillas por Fecha</h3>
          {(data.planillas_por_fecha?.filter((p) => p.fecha) ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.planillas_por_fecha.filter((p) => p.fecha).map((p) => ({ fecha: p.fecha!.split('T')[0], total: p.total }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#9333ea', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin planillas registradas</div>}
        </div>
      </div>

      {data.defectos_mas_comunes && data.defectos_mas_comunes.length > 0 && (
        <div className="admin-section-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Defectos Más Comunes</h3>
          <div className="admin-detail-grid">
            {data.defectos_mas_comunes.map((d, i) => (
              <div className="admin-detail-item" key={i}>
                <span className="admin-detail-label">{d.defecto || 'Desconocido'}</span>
                <span className="admin-detail-value">{d.total ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ConfiguracionTab() {
  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Settings size={20} /> Configuración del Sistema</h3>

      <div className="admin-welcome" style={{ marginBottom: '1rem' }}>
        <p>Estado y configuración de los servicios del sistema CDA Putumayo.</p>
      </div>

      <div className="admin-section-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>Servicios</h3>
        <div className="admin-config-section">
          {[
            { name: 'API Gateway', icon: <Globe size={16} />, status: 'Operativo', url: 'https://api-cda.ilesandres.online' },
            { name: 'Auth Service', icon: <Shield size={16} />, status: 'Operativo', url: '/auth' },
            { name: 'Clientes Service', icon: <Users size={16} />, status: 'Operativo', url: '/api/v1/clients' },
            { name: 'Vehículos Service', icon: <Car size={16} />, status: 'Operativo', url: '/api/v1/vehiculo' },
            { name: 'Form Service', icon: <FileText size={16} />, status: 'Operativo', url: '/api/v1/stats' },
            { name: 'Storage Service', icon: <HardDrive size={16} />, status: 'Operativo', url: '/api/v1/storage' },
            { name: 'Checklist Service', icon: <ClipboardList size={16} />, status: 'Operativo', url: '/api/v1/checklist' },
            { name: 'Tracker Service', icon: <MapPin size={16} />, status: 'Operativo', url: '/api/v1/tracker' },
          ].map((s) => (
            <div className="admin-config-item" key={s.name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#155dfc' }}>{s.icon}</span>
                <span className="label">{s.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="admin-badge green">{s.status}</span>
                <span className="value">{s.url}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>Estado del Sistema</h3>
        <div className="admin-flex-row" style={{ gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wifi size={16} color="#16a34a" />
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>Conexión API: <strong style={{ color: '#16a34a' }}>Online</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Server size={16} color="#155dfc" />
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>Versión App: <strong>1.0.0</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color="#64748b" />
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>Entorno: <strong>Producción</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Admin Dashboard ─── */

type AdminTab = 'dashboard' | 'clientes' | 'vehiculos' | 'usuarios' | 'inspecciones' | 'facturacion' | 'almacenamiento' | 'checklist' | 'tracker' | 'configuracion'

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'clientes', label: 'Clientes', icon: <Users size={16} /> },
  { id: 'vehiculos', label: 'Vehículos', icon: <Car size={16} /> },
  { id: 'usuarios', label: 'Usuarios', icon: <Shield size={16} /> },
  { id: 'inspecciones', label: 'Inspecciones', icon: <FileText size={16} /> },
  { id: 'facturacion', label: 'Facturación', icon: <Receipt size={16} /> },
  { id: 'almacenamiento', label: 'Almacenamiento', icon: <HardDrive size={16} /> },
  { id: 'checklist', label: 'Checklist', icon: <ClipboardList size={16} /> },
  { id: 'tracker', label: 'Tracker', icon: <MapPin size={16} /> },
  { id: 'configuracion', label: 'Configuración', icon: <Settings size={16} /> },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const { data, isLoading, isRefreshing, serviceState, refetchAll } = useAdminStats()

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab data={data} loading={isLoading} error={Object.values(serviceState).every((s) => s.isError)} />
      case 'clientes': return <ClientesTab data={data.clients} loading={serviceState.clients.isLoading} error={serviceState.clients.isError} />
      case 'vehiculos': return <VehiculosTab data={data.vehicles} loading={serviceState.vehicles.isLoading} error={serviceState.vehicles.isError} />
      case 'usuarios': return <UsuariosTab />
      case 'inspecciones': return <InspeccionesTab data={data.inspections} loading={serviceState.inspections.isLoading} error={serviceState.inspections.isError} />
      case 'facturacion': return <FacturacionTab data={data.invoices} loading={serviceState.invoices.isLoading} error={serviceState.invoices.isError} />
      case 'almacenamiento': return <AlmacenamientoTab data={data.storage} loading={serviceState.storage.isLoading} error={serviceState.storage.isError} />
      case 'checklist': return <ChecklistTab data={data.checklist} loading={serviceState.checklist.isLoading} error={serviceState.checklist.isError} />
      case 'tracker': return <TrackerTab data={data.tracker} loading={serviceState.tracker.isLoading} error={serviceState.tracker.isError} />
      case 'configuracion': return <ConfiguracionTab />
      default: return null
    }
  }, [activeTab, data, isLoading, serviceState])

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1><LayoutDashboard /> Panel de Administración</h1>
          <button
            className="admin-link-btn"
            onClick={() => refetchAll()}
            disabled={isRefreshing}
            title="Actualizar todos los datos"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        <p>Gestión centralizada del CDA Putumayo — {isLoading ? 'Cargando datos...' : 'Todos los módulos operativos'}</p>
      </div>

      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  )
}
