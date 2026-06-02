import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  FileText,
  DollarSign,
  User,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import { facturaService } from '../services/facturaService'
import type { Factura, CreateInvoiceDTO } from '../domain/factura.types'
import { useAuthStore } from '@/core/store/authStore'

export function FacturacionPage() {
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Paginación y Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // Modales
  const [selectedInvoice, setSelectedInvoice] = useState<Factura | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Datos para nueva factura manual
  const [newInvoice, setNewInvoice] = useState<CreateInvoiceDTO>({
    client: { document: '', name: '', address: '', phone: '', email: '' },
    items: [{ concept: '', quantity: 1, unitPrice: 0 }],
    statusId: 'PENDIENTE',
    inspection_id: '',
    observations: ''
  })

  // ID de inspección para autogeneración
  const [inspectionIdToGen, setInspectionIdToGen] = useState('')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await facturaService.listarFacturas({
        invoice_number: searchTerm.trim() || undefined,
        // En base de datos, el statusId puede ser un ID real o string.
        // Si no es 'todos', lo pasamos
        statusId: statusFilter !== 'todos' ? statusFilter : undefined,
        page: currentPage,
        size: pageSize,
      })
      setInvoices(response.data)
      setTotalItems(response.total)
      setTotalPages(response.totalPages)
    } catch (err: any) {
      console.error('Error cargando facturas:', err)
      setError('No se pudieron cargar las facturas. Por favor intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, currentPage])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchInvoices()
  }

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectionIdToGen.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await facturaService.generarFacturaDeInspeccion(inspectionIdToGen.trim())
      setShowGenerateModal(false)
      setInspectionIdToGen('')
      setCurrentPage(1)
      fetchInvoices()
    } catch (err: any) {
      console.error('Error generando factura:', err)
      setError(err?.response?.data?.message || 'Error al generar la factura. Verifique el ID de inspección.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await facturaService.crearFactura(newInvoice)
      setShowCreateModal(false)
      setNewInvoice({
        client: { document: '', name: '', address: '', phone: '', email: '' },
        items: [{ concept: '', quantity: 1, unitPrice: 0 }],
        statusId: 'PENDIENTE',
        inspection_id: '',
        observations: ''
      })
      setCurrentPage(1)
      fetchInvoices()
    } catch (err: any) {
      console.error('Error al crear factura manual:', err)
      setError(err?.response?.data?.message || 'Error al crear la factura manual. Verifique los campos.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { concept: '', quantity: 1, unitPrice: 0 }]
    })
  }

  const handleRemoveItem = (index: number) => {
    if (newInvoice.items.length === 1) return
    const updated = [...newInvoice.items]
    updated.splice(index, 1)
    setNewInvoice({ ...newInvoice, items: updated })
  }

  const handleItemChange = (index: number, field: keyof typeof newInvoice.items[0], value: any) => {
    const updated = [...newInvoice.items]
    updated[index] = { ...updated[index], [field]: value }
    setNewInvoice({ ...newInvoice, items: updated })
  }

  const handleClientChange = (field: keyof typeof newInvoice.client, value: string) => {
    setNewInvoice({
      ...newInvoice,
      client: { ...newInvoice.client, [field]: value }
    })
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta factura?')) return
    try {
      await facturaService.eliminarFactura(id)
      fetchInvoices()
    } catch (err: any) {
      alert('Error al eliminar la factura.')
    }
  }

  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  // Helper formatting values
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val)
  }

  return (
    <article className="panel">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2>Cola de Facturación</h2>
          <p className="text-gray-500 text-sm">Gestione las facturas del sistema y asócielas con inspecciones de recepción.</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary flex items-center gap-2"
            onClick={() => setShowGenerateModal(true)}
          >
            <RefreshCw size={16} /> Autogenerar Factura
          </button>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> Crear Factura Manual
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros de búsqueda */}
      <section className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por número de factura..."
              className="form-control pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>

        <div className="flex gap-2 items-center">
          <label className="text-sm font-semibold text-gray-600">Estado:</label>
          <select 
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('todos')
            setCurrentPage(1)
          }}
          className="btn btn-secondary flex items-center gap-1"
          title="Limpiar filtros"
        >
          Limpiar
        </button>
      </section>

      {/* Tabla de Facturas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <FileText size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No se encontraron facturas registradas.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nº Factura</th>
                <th>Cliente</th>
                <th>Concepto Principal</th>
                <th>Total</th>
                <th>Fecha de Emisión</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-semibold text-primary">{inv.invoice_number}</td>
                  <td>
                    <div className="text-sm font-bold text-gray-800">{inv.client.name}</div>
                    <div className="text-xs text-gray-500">{inv.client.document}</div>
                  </td>
                  <td>
                    {inv.items.map((it, idx) => (
                      <span key={idx} className="block text-sm text-gray-700">
                        {it.concept} (x{it.quantity})
                      </span>
                    ))}
                  </td>
                  <td className="font-bold text-gray-900">{formatCOP(inv.total)}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString('es-CO')}</td>
                  <td>
                    <span 
                      className={`badge text-xs px-2 py-1 rounded font-bold`}
                      style={{
                        backgroundColor: inv.statusName === 'Pagado' ? '#dcfce7' : '#fee2e2',
                        color: inv.statusName === 'Pagado' ? '#166534' : '#991b1b'
                      }}
                    >
                      {inv.statusName || 'Pendiente'}
                    </span>
                  </td>
                  <td className="text-right flex gap-1 justify-end">
                    <button 
                      className="btn btn-secondary p-1"
                      title="Ver Detalles"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <Eye size={16} />
                    </button>
                    {isAdmin && (
                      <button 
                        className="btn btn-secondary p-1 text-red-600 hover:bg-red-50"
                        title="Eliminar Factura"
                        onClick={() => handleDeleteInvoice(inv.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <footer className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-500">Mostrando {invoices.length} de {totalItems} facturas</span>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </button>
            <span className="self-center px-4 font-bold text-sm">Página {currentPage} de {totalPages}</span>
            <button 
              className="btn btn-secondary" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
        </footer>
      )}

      {/* Modal de Detalle */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <header className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="text-primary" /> Factura {selectedInvoice.invoice_number}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedInvoice(null)}
              >
                <X size={24} />
              </button>
            </header>
            <div className="p-6 space-y-6">
              {/* Información del Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Información del Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold flex items-center gap-2 text-gray-800">
                      <User size={14} /> {selectedInvoice.client.name}
                    </p>
                    <p className="text-gray-500">Doc: {selectedInvoice.client.document}</p>
                    {selectedInvoice.client.phone && <p className="text-gray-500">Tel: {selectedInvoice.client.phone}</p>}
                    {selectedInvoice.client.email && <p className="text-gray-500">Email: {selectedInvoice.client.email}</p>}
                    {selectedInvoice.client.address && <p className="text-gray-500">Dirección: {selectedInvoice.client.address}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detalles del Documento</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Calendar size={14} /> Fecha: {new Date(selectedInvoice.createdAt).toLocaleString('es-CO')}
                    </p>
                    <p>ID Inspección: <span className="font-mono text-xs">{selectedInvoice.inspection_id}</span></p>
                    <p className="flex items-center gap-2">
                      Estado: <span className="font-bold text-primary">{selectedInvoice.statusName || 'Pendiente'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conceptos</h4>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Concepto</th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-600">Cant</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Precio Unit.</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedInvoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-gray-800">{it.concept}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{it.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCOP(it.unitPrice)}</td>
                          <td className="px-4 py-3 text-right text-gray-800 font-medium">
                            {formatCOP(it.total ?? (it.unitPrice * it.quantity))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-800">{formatCOP(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-medium text-gray-800">{formatCOP(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                    <span>Total a Pagar:</span>
                    <span>{formatCOP(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.observations && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Observaciones</h5>
                  <p className="text-sm text-gray-700">{selectedInvoice.observations}</p>
                </div>
              )}
            </div>
            <footer className="p-6 border-t border-gray-100 flex justify-end">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedInvoice(null)}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal Autogenerar factura */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleGenerateInvoice}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <header className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">Autogenerar Factura</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowGenerateModal(false)
                  setInspectionIdToGen('')
                }}
              >
                <X size={24} />
              </button>
            </header>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Ingrese el ID de la inspección. El sistema consultará automáticamente el tipo de vehículo, la tarifa correspondiente y los datos del cliente para generar el cobro.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ID de Inspección</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 672a1f2d4c2e0f7722a7e2ba"
                  className="form-control"
                  value={inspectionIdToGen}
                  onChange={(e) => setInspectionIdToGen(e.target.value)}
                />
              </div>
            </div>
            <footer className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => {
                  setShowGenerateModal(false)
                  setInspectionIdToGen('')
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex items-center gap-2"
                disabled={submitting || !inspectionIdToGen.trim()}
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
                Generar Factura
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Modal Crear Factura Manual */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateManualInvoice}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <header className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">Crear Factura Manual</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={24} />
              </button>
            </header>
            
            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Datos del Cliente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Documento / NIT *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={newInvoice.client.document}
                      onChange={(e) => handleClientChange('document', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={newInvoice.client.name}
                      onChange={(e) => handleClientChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newInvoice.client.phone}
                      onChange={(e) => handleClientChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newInvoice.client.email}
                      onChange={(e) => handleClientChange('email', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newInvoice.client.address}
                      onChange={(e) => handleClientChange('address', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Referencias */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Detalles de Referencia</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ID de Inspección Relacionada *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 672a1f2d4c2e0f7722a7e2ba"
                      className="form-control"
                      value={newInvoice.inspection_id}
                      onChange={(e) => setNewInvoice({ ...newInvoice, inspection_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado de Pago</label>
                    <select
                      className="form-control"
                      value={newInvoice.statusId}
                      onChange={(e) => setNewInvoice({ ...newInvoice, statusId: e.target.value })}
                    >
                      {/* En base de datos, el statusId de un estado PENDING */}
                      <option value="6a1ad9bf4d644ab738782e4b">Pendiente</option>
                      <option value="6a1ad9c04d644ab738782e4c">Pagado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <h4 className="text-sm font-bold text-gray-800">Conceptos de Cobro</h4>
                  <button 
                    type="button"
                    className="btn btn-secondary flex items-center gap-1 py-1 text-xs"
                    onClick={handleAddItem}
                  >
                    <Plus size={14} /> Añadir Concepto
                  </button>
                </div>
                <div className="space-y-3">
                  {newInvoice.items.map((it, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Descripción del Concepto</label>
                        <input
                          type="text"
                          required
                          placeholder="Revisión técnico-mecánica..."
                          className="form-control bg-white"
                          value={it.concept}
                          onChange={(e) => handleItemChange(idx, 'concept', e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">Cant.</label>
                        <input
                          type="number"
                          required
                          min={1}
                          className="form-control bg-white text-center"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-36">
                        <label className="block text-xs text-gray-500 mb-1">Valor Unitario ($)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          className="form-control bg-white text-right"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      {newInvoice.items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-secondary p-2 text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones / Notas Adicionales</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={newInvoice.observations}
                  onChange={(e) => setNewInvoice({ ...newInvoice, observations: e.target.value })}
                />
              </div>
            </div>

            <footer className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Emitir Factura'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </article>
  )
}
