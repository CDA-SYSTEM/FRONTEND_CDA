import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart,
} from 'recharts'
import {
  LayoutDashboard, Users, Car, Shield, FileText,
  Receipt, HardDrive, ClipboardList, MapPin, Settings,
  Activity, UserCheck, Truck, AlertTriangle, DollarSign,
  FileUp, CheckSquare, Clock, Calendar, TrendingUp,
  Wifi, Server, Globe, UserPlus, RefreshCw,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { useAdminStats } from '@/modules/admin/hooks/useAdminStats'
import { useAnimatedNumber } from '@/modules/admin/hooks/useAnimatedNumber'
import { useInvoiceSocket } from '@/modules/admin/hooks/useInvoiceSocket'
import { facturaService } from '@/modules/facturacion/services/facturaService'
import type { Factura } from '@/modules/facturacion/domain/factura.types'
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

function KpiCard({ icon, color, value, label, rawValue }: { icon: React.ReactNode; color: string; value: string | number; label: string; rawValue?: number }) {
  const animDisplay = useAnimatedNumber(rawValue ?? 0)
  const display = rawValue !== undefined ? animDisplay : value
  return (
    <div className="admin-kpi-card" data-label={label}>
      <div className="admin-kpi-top">
        <div className={`admin-kpi-icon ${color}`}>{icon}</div>
      </div>
      <div className="admin-kpi-value">{display}</div>
      <div className="admin-kpi-label">{label}</div>
    </div>
  )
}

/* ─── Custom Tooltip ─── */

function ChartTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string; formatter?: (v: number) => string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="admin-chart-tooltip">
      {label && <div className="admin-chart-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div className="admin-chart-tooltip-row" key={i}>
          <span className="admin-chart-tooltip-name">{p.name}</span>
          <span className="admin-chart-tooltip-value">{formatter ? formatter(p.value) : p.value.toLocaleString('es-CO')}</span>
        </div>
      ))}
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
      <div style={{ width: '100%', height: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {entries.map((_, i) => (
                <linearGradient key={i} id={`pieGrad_${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <Pie data={entries.map(([k, v]) => ({ name: statNameDisplay(k), value: v }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`} isAnimationActive animationDuration={900} animationEasing="ease-out">
              {entries.map((_, i) => <Cell key={i} fill={`url(#pieGrad_${i})`} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(21,93,252,0.06)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function BarStatChart({ data, title, icon, color = '#155dfc', layout = 'vertical', gradientId = 'barGrad', formatter }: { data: { label: string; count: number }[] | undefined; title: string; icon: React.ReactNode; color?: string; layout?: 'vertical' | 'horizontal'; gradientId?: string; formatter?: (v: number) => string }) {
  if (!data || data.length === 0) return null
  const chartData = data.map((d) => ({ name: d.label, count: d.count }))
  const staggerDuration = Math.max(200, 800 / chartData.length)
  return (
    <div className="admin-chart-card">
      <h3>{icon} {title}</h3>
      <div style={{ width: '100%', height: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          {layout === 'vertical' ? (
            <BarChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis type="number" tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgba(21,93,252,0.06)' }} />
              <Bar dataKey="count" fill={`url(#${gradientId})`} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={staggerDuration} animationEasing="ease-out" />
            </BarChart>
          ) : (
            <BarChart data={chartData} layout="vertical">
              <defs>
                <linearGradient id={`${gradientId}_h`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgba(21,93,252,0.06)' }} />
              <Bar dataKey="count" fill={`url(#${gradientId}_h)`} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={staggerDuration} animationEasing="ease-out" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
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
        {loading && !cl ? <KpiSkeleton /> : <KpiCard icon={<Users size={20} />} color="blue" value={cl?.totalClients ?? '—'} label="Total Clientes" rawValue={cl?.totalClients} />}
        {loading && !veh ? <KpiSkeleton /> : <KpiCard icon={<Car size={20} />} color="green" value={veh?.totalVehicles ?? '—'} label="Total Vehículos" rawValue={veh?.totalVehicles} />}
        {loading && !ins ? <KpiSkeleton /> : <KpiCard icon={<FileText size={20} />} color="purple" value={ins?.totalInspections ?? '—'} label="Inspecciones" rawValue={ins?.totalInspections} />}
        {loading && !inv ? <KpiSkeleton /> : <KpiCard icon={<Receipt size={20} />} color="amber" value={inv ? formatCurrency(inv.totalRevenue) : '—'} label="Ingresos Totales" rawValue={inv?.totalRevenue} />}
        {loading && !sto ? <KpiSkeleton /> : <KpiCard icon={<HardDrive size={20} />} color="cyan" value={sto ? formatBytes(sto.totalSizeBytes) : '—'} label="Almacenamiento" rawValue={sto?.totalSizeBytes} />}
        {loading && !chk ? <KpiSkeleton /> : <KpiCard icon={<ClipboardList size={20} />} color="indigo" value={chk?.total_inspections ?? '—'} label="Checklists" rawValue={chk?.total_inspections} />}
      </div>

      <div className="admin-chart-grid">
        {!ins ? <ChartSkeleton /> : (
          <PieStatChart data={ins.byStatus} title="Inspecciones por Estado" icon={<Activity size={16} />} />
        )}
        {revenueData.length === 0 ? <ChartSkeleton /> : (
          <div className="admin-chart-card">
            <h3><TrendingUp size={16} /> Ingresos Mensuales</h3>
            <div style={{ width: '100%', height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#155dfc" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#155dfc" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `$${v.toFixed(1)}M`} />} cursor={{ stroke: '#155dfc', strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#155dfc" strokeWidth={2.5} fill="url(#revenueGrad)" isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
        <KpiCard icon={<UserCheck size={20} />} color="blue" value={data.totalClients} label="Total Clientes" rawValue={data.totalClients} />
        <KpiCard icon={<Activity size={20} />} color="green" value={data.activeClients} label="Clientes Activos" rawValue={data.activeClients} />
        <KpiCard icon={<AlertTriangle size={20} />} color="rose" value={data.inactiveClients} label="Clientes Inactivos" rawValue={data.inactiveClients} />
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
        <KpiCard icon={<Truck size={20} />} color="blue" value={data.totalVehicles} label="Total Vehículos" rawValue={data.totalVehicles} />
        <KpiCard icon={<Activity size={20} />} color="green" value={data.byBrand?.length ?? 0} label="Marcas Diferentes" rawValue={data.byBrand?.length} />
        <KpiCard icon={<Car size={20} />} color="purple" value={data.byType?.length ?? 0} label="Tipos de Vehículo" rawValue={data.byType?.length} />
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
        <KpiCard icon={<FileText size={20} />} color="blue" value={data.totalInspections} label="Total Inspecciones" rawValue={data.totalInspections} />
        <KpiCard icon={<Calendar size={20} />} color="green" value={data.todayInspections} label="Hoy" rawValue={data.todayInspections} />
        <KpiCard icon={<Calendar size={20} />} color="amber" value={data.weekInspections} label="Esta Semana" rawValue={data.weekInspections} />
        <KpiCard icon={<Calendar size={20} />} color="purple" value={data.monthInspections} label="Este Mes" rawValue={data.monthInspections} />
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

const STATUS_MAP: Record<string, string> = {
  '6a1ad9bf4d644ab738782e4b': 'PENDIENTE',
  '6a1ad9c04d644ab738782e4c': 'PAGADO',
  '6a1ad9cd20d2071ac5aec90f': 'CANCELADO',
}

function statusBadge(statusId: string) {
  const name = STATUS_MAP[statusId] || 'PENDIENTE'
  return (
    <span className="admin-invoice-status" data-status={name}>
      {name}
    </span>
  )
}

function FacturacionTab({ data, loading, error }: { data: InvoiceStats | undefined; loading: boolean; error: boolean }) {
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const { latestInvoice, invoiceUpdate, inspectionUpdate } = useInvoiceSocket()
  const feedRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(0)

  useEffect(() => {
    facturaService.listarFacturas({ size: 20 }).then((res) => {
      setInvoices(res.data)
      setFeedLoading(false)
    }).catch(() => setFeedLoading(false))
  }, [])

  useEffect(() => {
    if (!latestInvoice) return
    setInvoices((prev) => {
      if (prev.some((inv) => inv.id === latestInvoice.id)) return prev
      const sanitized = { ...latestInvoice, items: latestInvoice.items ?? [], client: latestInvoice.client ?? { document: '', name: '—' } }
      setNewIds((ids) => new Set(ids).add(latestInvoice.id))
      setTimeout(() => setNewIds((ids) => { const next = new Set(ids); next.delete(latestInvoice.id); return next }), 3000)
      return [sanitized, ...prev]
    })
  }, [latestInvoice])

  useEffect(() => {
    if (!invoiceUpdate) return
    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceUpdate.id ? { ...inv, ...invoiceUpdate } : inv)
    )
  }, [invoiceUpdate])

  useEffect(() => {
    if (!inspectionUpdate) return
    const isPaid = inspectionUpdate.statusName?.toUpperCase() === 'PAGADO' || inspectionUpdate.statusId === '6a1ad9c04d644ab738782e4c'
    if (!isPaid) return
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.inspection_id === inspectionUpdate.id
          ? { ...inv, statusId: '6a1ad9c04d644ab738782e4c' }
          : inv
      )
    )
  }, [inspectionUpdate])

  useEffect(() => {
    if (invoices.length > prevLen.current && prevLen.current > 0) {
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    prevLen.current = invoices.length
  }, [invoices.length])

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

  if (error) return <ErrorPanel message="Error al cargar estadísticas de facturación" />
  if (loading || !data) return <LoadingSkeleton lines={6} />

  const revenueData = Object.entries(data.revenueByMonth ?? {}).map(([k, v]) => ({ month: k, revenue: v }))

  return (
    <div className="admin-content">
      <h3 className="admin-section-title">
        <Receipt size={20} /> Facturación
        <span className="admin-invoice-badge">{data.totalInvoices} emitidas</span>
      </h3>

      <div className="admin-invoice-layout">
        <div className="admin-invoice-feed-panel">
          <div className="admin-invoice-feed-header">
            <span><Zap size={14} style={{ color: '#d97706' }} /> Facturas en vivo</span>
            <span className="admin-invoice-feed-count">{invoices.length}</span>
          </div>
          <div className="admin-invoice-feed" ref={feedRef}>
            {feedLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="admin-invoice-row admin-invoice-row-skeleton" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="admin-invoice-row-line" style={{ width: '55%' }} />
                  <div className="admin-invoice-row-line" style={{ width: '35%' }} />
                </div>
              ))
            ) : invoices.length === 0 ? (
              <div className="admin-empty">No hay facturas registradas</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className={`admin-invoice-row${newIds.has(inv.id) ? ' admin-invoice-row-new' : ''} ${!newIds.has(inv.id) && invoices.indexOf(inv) < 3 ? '' : ''}`}>
                  <div className="admin-invoice-row-top">
                    <span className="admin-invoice-row-number">{inv.invoice_number}</span>
                    {statusBadge(inv.statusId)}
                  </div>
                  <div className="admin-invoice-row-client">
                    <Users size={12} /> {inv.client.name} — <span className="admin-invoice-row-doc">{inv.client.document}</span>
                  </div>
                  <div className="admin-invoice-row-bottom">
                    <span className="admin-invoice-row-total">{formatCOP(inv.total)}</span>
                    <span className="admin-invoice-row-date">{new Date(inv.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-invoice-charts">
          <div className="admin-invoice-kpis">
            <KpiCard icon={<Receipt size={20} />} color="blue" value={data.totalInvoices} label="Total Facturas" rawValue={data.totalInvoices} />
            <KpiCard icon={<DollarSign size={20} />} color="green" value={formatCurrency(data.totalRevenue)} label="Ingresos Totales" rawValue={data.totalRevenue} />
            <KpiCard icon={<TrendingUp size={20} />} color="amber" value={formatCurrency(data.todayRevenue)} label="Ingresos Hoy" rawValue={data.todayRevenue} />
            <KpiCard icon={<TrendingUp size={20} />} color="purple" value={formatCurrency(data.monthRevenue)} label="Ingresos del Mes" rawValue={data.monthRevenue} />
          </div>
          <div className="admin-chart-grid" style={{ marginTop: '1rem' }}>
            {revenueData.length > 0 ? (
              <div className="admin-chart-card">
                <h3><TrendingUp size={16} /> Ingresos por Mes</h3>
                <div style={{ width: '100%', height: 250, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="invRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#155dfc" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#155dfc" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(Number(v) / 1000000).toFixed(0)}M`} />
                      <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(Number(v))} />} cursor={{ stroke: '#155dfc', strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#155dfc" strokeWidth={2.5} fill="url(#invRevenueGrad)" isAnimationActive animationDuration={1000} animationEasing="ease-out" activeDot={{ r: 6, fill: '#155dfc', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : <ChartSkeleton />}
            <PieStatChart data={data.byStatus} title="Por Estado" icon={<Activity size={16} />} />
          </div>
          <div className="admin-flex-row" style={{ marginTop: '0.5rem' }}>
            <Link to="/facturacion" className="admin-link-btn"><Receipt size={16} /> Ir a Facturación completa</Link>
          </div>
        </div>
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
        <KpiCard icon={<FileUp size={20} />} color="blue" value={data.totalFiles} label="Total Archivos" rawValue={data.totalFiles} />
        <KpiCard icon={<HardDrive size={20} />} color="green" value={formatBytes(data.totalSizeBytes)} label="Espacio Ocupado" rawValue={data.totalSizeBytes} />
        <KpiCard icon={<Activity size={20} />} color="amber" value={data.recentUploads} label="Subidas Recientes" rawValue={data.recentUploads} />
        <KpiCard icon={<CheckSquare size={20} />} color="purple" value={data.activeFiles} label="Archivos Activos" rawValue={data.activeFiles} />
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
        <KpiCard icon={<ClipboardList size={20} />} color="blue" value={data.total_inspections} label="Total Checklists" rawValue={data.total_inspections} />
        <KpiCard icon={<Calendar size={20} />} color="green" value={data.today_inspections} label="Hoy" rawValue={data.today_inspections} />
        <KpiCard icon={<Calendar size={20} />} color="purple" value={data.month_inspections} label="Este Mes" rawValue={data.month_inspections} />
        <KpiCard icon={<FileText size={20} />} color="amber" value={data.total_templates} label="Plantillas" rawValue={data.total_templates} />
        <KpiCard icon={<CheckSquare size={20} />} color="cyan" value={data.total_with_labrado} label="Con Labrado" rawValue={data.total_with_labrado} />
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
        <KpiCard icon={<Users size={20} />} color="blue" value={data.total_clientes ?? '—'} label="Clientes Tracker" rawValue={data.total_clientes} />
        <KpiCard icon={<Truck size={20} />} color="green" value={data.total_vehiculos ?? '—'} label="Vehículos Tracker" rawValue={data.total_vehiculos} />
        <KpiCard icon={<ClipboardList size={20} />} color="purple" value={data.total_planillas ?? '—'} label="Planillas" rawValue={data.total_planillas} />
      </div>

      <div className="admin-chart-grid">
        <BarStatChart data={data.vehiculos_por_marca?.map((v) => ({ label: v.marca, count: v.total }))} title="Vehículos por Marca (Tracker)" icon={<Truck size={16} />} color="#9333ea" />
          <div className="admin-chart-card">
          <h3><Calendar size={16} /> Planillas por Fecha</h3>
          {(data.planillas_por_fecha?.filter((p) => p.fecha) ?? []).length > 0 ? (
            <div style={{ width: '100%', height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.planillas_por_fecha.filter((p) => p.fecha).map((p) => ({ fecha: p.fecha!.split('T')[0], total: p.total }))}>
                  <defs>
                    <linearGradient id="trackerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#9333ea" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#9333ea', strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="total" stroke="#9333ea" strokeWidth={2.5} fill="url(#trackerGrad)" isAnimationActive animationDuration={1000} animationEasing="ease-out" activeDot={{ r: 6, fill: '#9333ea', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
