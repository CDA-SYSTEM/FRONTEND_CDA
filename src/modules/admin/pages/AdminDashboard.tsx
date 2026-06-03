import { useState } from 'react'
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
  Wifi, Server, Globe, UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { useAdminStats } from '@/modules/admin/hooks/useAdminStats'
import type { AdminDashboardData } from '@/modules/admin/domain/admin.types'
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
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function statNameDisplay(key: string): string {
  return STATUS_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ─── Tab Components ─── */

function DashboardTab({ data }: { data: AdminDashboardData }) {
  const user = useAuthStore((s) => s.user)
  const inspectionData = data.inspections
  const invoiceData = data.invoices

  const statusChart = inspectionData
    ? Object.entries(inspectionData.byStatus).map(([k, v]) => ({ name: statNameDisplay(k), value: v }))
    : []

  const revenueData = invoiceData?.revenueByMonth
    ? Object.entries(invoiceData.revenueByMonth).map(([k, v]) => ({ month: k, revenue: v / 1000000 }))
    : []

  return (
    <div className="admin-content">
      <div className="admin-welcome">
        <h2>Bienvenido, {user?.name || 'Administrador'}</h2>
        <p>Panel de control centralizado del CDA Putumayo. Monitoree todas las operaciones en tiempo real.</p>
      </div>

      <div className="admin-kpi-grid">
        <KpiCard icon={<Users size={20} />} color="blue" value={data.clients?.totalClients ?? '...'} label="Total Clientes" />
        <KpiCard icon={<Car size={20} />} color="green" value={data.vehicles?.totalVehicles ?? '...'} label="Total Vehículos" />
        <KpiCard icon={<FileText size={20} />} color="purple" value={data.inspections?.totalInspections ?? '...'} label="Inspecciones" />
        <KpiCard icon={<Receipt size={20} />} color="amber" value={invoiceData ? formatCurrency(invoiceData.totalRevenue) : '...'} label="Ingresos Totales" />
        <KpiCard icon={<HardDrive size={20} />} color="cyan" value={data.storage ? formatBytes(data.storage.totalSizeBytes) : '...'} label="Almacenamiento" />
        <KpiCard icon={<ClipboardList size={20} />} color="indigo" value={data.checklist?.total_inspections ?? '...'} label="Checklists" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><Activity size={16} /> Inspecciones por Estado</h3>
          {statusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos</div>}
        </div>

        <div className="admin-chart-card">
          <h3><TrendingUp size={16} /> Ingresos Mensuales (COP millones)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(1)}M`, 'Ingresos']} />
                <Bar dataKey="revenue" fill="#155dfc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos de ingresos</div>}
        </div>
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><Truck size={16} /> Vehículos por Marca</h3>
          {data.vehicles && data.vehicles.byBrand.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.vehicles.byBrand.map((b) => ({ name: b.label, count: b.count }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos de vehículos</div>}
        </div>

        <div className="admin-chart-card">
          <h3><FileText size={16} /> Archivos por Tipo</h3>
          {data.storage && data.storage.filesByMimetype.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                  <Pie data={data.storage.filesByMimetype.map((f) => ({ name: f.mimetype.split('/')[1]?.toUpperCase() || f.mimetype, value: f.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.storage.filesByMimetype.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos de almacenamiento</div>}
        </div>
      </div>
    </div>
  )
}

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

function ClientesTab({ data }: { data: AdminDashboardData }) {
  const clients = data.clients
  if (!clients) return <div className="admin-empty">Cargando datos de clientes...</div>

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Users size={20} /> Gestión de Clientes</h3>
      <div className="admin-kpi-grid">
        <KpiCard icon={<UserCheck size={20} />} color="blue" value={clients.totalClients} label="Total Clientes" />
        <KpiCard icon={<Activity size={20} />} color="green" value={clients.activeClients} label="Clientes Activos" />
        <KpiCard icon={<AlertTriangle size={20} />} color="rose" value={clients.inactiveClients} label="Clientes Inactivos" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><UserCheck size={16} /> Por Tipo de Documento</h3>
          {clients.clientsByDocumentType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clients.clientsByDocumentType.map((d) => ({ name: d.label, count: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#155dfc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos</div>}
        </div>

        <div className="admin-chart-card">
          <h3><Users size={16} /> Por Tipo de Persona</h3>
          {clients.clientsByPersonType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={clients.clientsByPersonType.map((p) => ({ name: p.label, value: p.count }))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {clients.clientsByPersonType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos</div>}
        </div>
      </div>

      <div className="admin-flex-row" style={{ marginTop: '0.5rem' }}>
        <Link to="/clientes" className="admin-link-btn"><UserPlus size={16} /> Ir a Gestión de Clientes</Link>
      </div>
    </div>
  )
}

function VehiculosTab({ data }: { data: AdminDashboardData }) {
  const vehicles = data.vehicles
  if (!vehicles) return <div className="admin-empty">Cargando datos de vehículos...</div>

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Car size={20} /> Gestión de Vehículos</h3>
      <div className="admin-kpi-grid">
        <KpiCard icon={<Truck size={20} />} color="blue" value={vehicles.totalVehicles} label="Total Vehículos" />
        <KpiCard icon={<Activity size={20} />} color="green" value={vehicles.byBrand.length} label="Marcas Diferentes" />
        <KpiCard icon={<Car size={20} />} color="purple" value={vehicles.byType.length} label="Tipos de Vehículo" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><Truck size={16} /> Por Marca</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vehicles.byBrand.map((b) => ({ name: b.label, count: b.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3><Car size={16} /> Distribución por Tipo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={vehicles.byType.map((t) => ({ name: t.label, value: t.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {vehicles.byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-section-card">
        <h3 className="admin-section-title" style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}><Shield size={16} /> Detalles por Tipo de Combustible y Servicio</h3>
        <div className="admin-detail-grid">
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Combustible</p>
            {vehicles.byFuelType.map((f) => (
              <div className="admin-detail-item" key={f.label}>
                <span className="admin-detail-label">{f.label}</span>
                <span className="admin-detail-value">{f.count}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Servicio</p>
            {vehicles.byServiceType.map((s) => (
              <div className="admin-detail-item" key={s.label}>
                <span className="admin-detail-label">{s.label}</span>
                <span className="admin-detail-value">{s.count}</span>
              </div>
            ))}
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

function InspeccionesTab({ data }: { data: AdminDashboardData }) {
  const ins = data.inspections
  if (!ins) return <div className="admin-empty">Cargando datos de inspecciones...</div>

  const statusChart = Object.entries(ins.byStatus).map(([k, v]) => ({ name: statNameDisplay(k), value: v }))
  const typeChart = Object.entries(ins.byVehicleType).map(([k, v]) => ({ name: statNameDisplay(k), value: v }))

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><FileText size={20} /> Inspecciones Técnico-Mecánicas</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<FileText size={20} />} color="blue" value={ins.totalInspections} label="Total Inspecciones" />
        <KpiCard icon={<Calendar size={20} />} color="green" value={ins.todayInspections} label="Hoy" />
        <KpiCard icon={<Calendar size={20} />} color="amber" value={ins.weekInspections} label="Esta Semana" />
        <KpiCard icon={<Calendar size={20} />} color="purple" value={ins.monthInspections} label="Este Mes" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><Activity size={16} /> Por Estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3><Car size={16} /> Por Tipo de Vehículo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {typeChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-section-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Por Tipo de Servicio</h3>
        <div className="admin-detail-grid">
          {Object.entries(ins.byServiceType).map(([k, v]) => (
            <div className="admin-detail-item" key={k}>
              <span className="admin-detail-label">{statNameDisplay(k)}</span>
              <span className="admin-detail-value">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FacturacionTab({ data }: { data: AdminDashboardData }) {
  const inv = data.invoices
  if (!inv) return <div className="admin-empty">Cargando datos de facturación...</div>

  const revenueData = Object.entries(inv.revenueByMonth).map(([k, v]) => ({ month: k, revenue: v }))

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><Receipt size={20} /> Facturación</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<Receipt size={20} />} color="blue" value={inv.totalInvoices} label="Total Facturas" />
        <KpiCard icon={<DollarSign size={20} />} color="green" value={formatCurrency(inv.totalRevenue)} label="Ingresos Totales" />
        <KpiCard icon={<TrendingUp size={20} />} color="amber" value={formatCurrency(inv.todayRevenue)} label="Ingresos Hoy" />
        <KpiCard icon={<TrendingUp size={20} />} color="purple" value={formatCurrency(inv.monthRevenue)} label="Ingresos del Mes" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><TrendingUp size={16} /> Ingresos por Mes</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Ingresos']} />
                <Line type="monotone" dataKey="revenue" stroke="#155dfc" strokeWidth={2} dot={{ fill: '#155dfc', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos de ingresos mensuales</div>}
        </div>

        <div className="admin-chart-card">
          <h3><Activity size={16} /> Por Estado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={Object.entries(inv.byStatus).map(([k, v]) => ({ name: statNameDisplay(k), value: v }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {Object.keys(inv.byStatus).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-flex-row">
        <Link to="/facturacion" className="admin-link-btn"><Receipt size={16} /> Ir a Facturación</Link>
      </div>
    </div>
  )
}

function AlmacenamientoTab({ data }: { data: AdminDashboardData }) {
  const storage = data.storage
  if (!storage) return <div className="admin-empty">Cargando datos de almacenamiento...</div>

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><HardDrive size={20} /> Almacenamiento de Archivos</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<FileUp size={20} />} color="blue" value={storage.totalFiles} label="Total Archivos" />
        <KpiCard icon={<HardDrive size={20} />} color="green" value={formatBytes(storage.totalSizeBytes)} label="Espacio Ocupado" />
        <KpiCard icon={<Activity size={20} />} color="amber" value={storage.recentUploads} label="Subidas Recientes" />
        <KpiCard icon={<CheckSquare size={20} />} color="purple" value={storage.activeFiles} label="Archivos Activos" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><FileUp size={16} /> Archivos por Tipo MIME</h3>
          {storage.filesByMimetype.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={storage.filesByMimetype.map((f) => ({ name: f.mimetype.split('/')[1]?.toUpperCase() || f.mimetype, value: f.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {storage.filesByMimetype.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin archivos registrados</div>}
        </div>

        <div className="admin-chart-card">
          <h3><HardDrive size={16} /> Detalles de Almacenamiento</h3>
          <div className="admin-detail-grid">
            {storage.filesByMimetype.map((f) => (
              <div className="admin-detail-item" key={f.mimetype}>
                <span className="admin-detail-label">{f.mimetype}</span>
                <span className="admin-detail-value">{f.count} archivos</span>
              </div>
            ))}
            <div className="admin-detail-item">
              <span className="admin-detail-label">Activos / Total</span>
              <span className="admin-detail-value">{storage.activeFiles} / {storage.totalFiles}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChecklistTab({ data }: { data: AdminDashboardData }) {
  const cl = data.checklist
  if (!cl) return <div className="admin-empty">Cargando datos de checklist...</div>

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><ClipboardList size={20} /> Inspecciones Checklist</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<ClipboardList size={20} />} color="blue" value={cl.total_inspections} label="Total Checklists" />
        <KpiCard icon={<Calendar size={20} />} color="green" value={cl.today_inspections} label="Hoy" />
        <KpiCard icon={<Calendar size={20} />} color="purple" value={cl.month_inspections} label="Este Mes" />
        <KpiCard icon={<FileText size={20} />} color="amber" value={cl.total_templates} label="Plantillas" />
        <KpiCard icon={<CheckSquare size={20} />} color="cyan" value={cl.total_with_labrado} label="Con Labrado" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><Activity size={16} /> Por Estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={Object.entries(cl.by_status).map(([k, v]) => ({ name: statNameDisplay(k), value: v }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {Object.keys(cl.by_status).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3><Car size={16} /> Por Tipo de Vehículo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={Object.entries(cl.by_vehicle_type).map(([k, v]) => ({ name: statNameDisplay(k), value: v }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {Object.keys(cl.by_vehicle_type).map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-section-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Resultados</h3>
        <div className="admin-detail-grid">
          {Object.entries(cl.by_result).map(([k, v]) => (
            <div className="admin-detail-item" key={k}>
              <span className="admin-detail-label">{statNameDisplay(k)}</span>
              <span className="admin-detail-value">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrackerTab({ data }: { data: AdminDashboardData }) {
  const tr = data.tracker
  if (!tr) return <div className="admin-empty">Cargando datos del tracker...</div>

  return (
    <div className="admin-content">
      <h3 className="admin-section-title"><MapPin size={20} /> Tracker Externo</h3>

      <div className="admin-kpi-grid">
        <KpiCard icon={<Users size={20} />} color="blue" value={tr.total_clientes} label="Clientes Tracker" />
        <KpiCard icon={<Truck size={20} />} color="green" value={tr.total_vehiculos} label="Vehículos Tracker" />
        <KpiCard icon={<ClipboardList size={20} />} color="purple" value={tr.total_planillas} label="Planillas" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <h3><Truck size={16} /> Vehículos por Marca (Tracker)</h3>
          {tr.vehiculos_por_marca.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tr.vehiculos_por_marca.map((v) => ({ name: v.marca, count: v.total }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Sin datos de tracker</div>}
        </div>

        <div className="admin-chart-card">
          <h3><Calendar size={16} /> Planillas por Fecha</h3>
          {tr.planillas_por_fecha.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tr.planillas_por_fecha.filter((p) => p.fecha).map((p) => ({ fecha: p.fecha!.split('T')[0], total: p.total }))}>
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

      {tr.defectos_mas_comunes.length > 0 && (
        <div className="admin-section-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Defectos Más Comunes</h3>
          <div className="admin-detail-grid">
            {tr.defectos_mas_comunes.map((d, i) => (
              <div className="admin-detail-item" key={i}>
                <span className="admin-detail-label">{d.defecto || 'Desconocido'}</span>
                <span className="admin-detail-value">{d.total || 0}</span>
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

const TABS: { id: AdminTab; label: string; icon: React.ReactNode; roles?: string[] }[] = [
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
  const { data, isLoading, isError } = useAdminStats()

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab data={data} />
      case 'clientes': return <ClientesTab data={data} />
      case 'vehiculos': return <VehiculosTab data={data} />
      case 'usuarios': return <UsuariosTab />
      case 'inspecciones': return <InspeccionesTab data={data} />
      case 'facturacion': return <FacturacionTab data={data} />
      case 'almacenamiento': return <AlmacenamientoTab data={data} />
      case 'checklist': return <ChecklistTab data={data} />
      case 'tracker': return <TrackerTab data={data} />
      case 'configuracion': return <ConfiguracionTab />
      default: return null
    }
  }

  if (isError) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1><LayoutDashboard /> Panel de Administración</h1>
          <p>Error al cargar datos. Verifique la conexión con los servicios.</p>
        </div>
        <div className="admin-content">
          <div className="admin-welcome" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
            <h2 style={{ color: '#dc2626' }}><AlertTriangle size={20} style={{ marginRight: '0.5rem' }} /> Error de Conexión</h2>
            <p>No se pudieron obtener los datos de los servicios. Intente recargar la página o contacte al administrador.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><LayoutDashboard /> Panel de Administración</h1>
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

      {isLoading && (
        <div className="admin-welcome" style={{ marginBottom: '1rem' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #155dfc', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Cargando estadísticas de todos los servicios...
          </p>
        </div>
      )}

      {renderTab()}
    </div>
  )
}
