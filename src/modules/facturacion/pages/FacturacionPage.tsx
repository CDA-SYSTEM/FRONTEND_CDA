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
  FileSpreadsheet,
  Pencil
} from 'lucide-react'
import { animate, stagger } from 'animejs'
import { facturaService } from '../services/facturaService'
import type { Factura, CreateInvoiceDTO, Status } from '../domain/factura.types'
import { useAuthStore } from '@/core/store/authStore'
import { AnimatedText } from '@/shared/components/AnimatedText'
import { CustomSelect } from '@/shared/components/CustomSelect'

export function FacturacionPage() {
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados disponibles (desde el backend)
  const [statuses, setStatuses] = useState<Status[]>([])

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
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)

  // Datos para nueva/editar factura
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
        search: searchTerm.trim() || undefined,
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

  // Cargar estados disponibles
  useEffect(() => {
    facturaService.listarStatuses()
      .then(setStatuses)
      .catch(() => {
        // fallback por si el endpoint no existe
        setStatuses([
          { id: '6a1ad9bf4d644ab738782e4b', name: 'Pendiente' },
          { id: '6a1ad9c04d644ab738782e4c', name: 'Pagado' },
        ])
      })
  }, [])

  // Animación staggered de las filas de la tabla al cargar
  useEffect(() => {
    if (!loading && invoices.length > 0) {
      animate('.invoice-row', {
        translateX: [-12, 0],
        opacity: [0, 1],
        delay: stagger(40),
        duration: 600,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      })
    }
  }, [loading, invoices])

  // Callback de Ref para animar la entrada del modal
  const modalBackdropRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      animate(node, {
        opacity: [0, 1],
        duration: 250,
        easing: 'easeOutQuad'
      })
      const box = node.querySelector('.floating-modal-box')
      if (box) {
        animate(box, {
          scale: [0.95, 1],
          translateY: [20, 0],
          opacity: [0, 1],
          duration: 450,
          easing: 'cubicBezier(0.22, 1, 0.36, 1)'
        })
      }
    }
  }, [])

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

  const handleOpenCreate = () => {
    setEditingInvoiceId(null)
    setNewInvoice({
      client: { document: '', name: '', address: '', phone: '', email: '' },
      items: [{ concept: '', quantity: 1, unitPrice: 0 }],
      statusId: '6a1ad9bf4d644ab738782e4b', // ID de estado Pendiente
      inspection_id: '',
      observations: ''
    })
    setShowCreateModal(true)
  }

  const handleOpenEdit = (inv: Factura) => {
    setEditingInvoiceId(inv.id)
    setNewInvoice({
      client: { 
        document: inv.client.document, 
        name: inv.client.name, 
        address: inv.client.address || '', 
        phone: inv.client.phone || '', 
        email: inv.client.email || '' 
      },
      items: inv.items.map(it => ({
        concept: it.concept,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      })),
      statusId: inv.statusId,
      inspection_id: inv.inspection_id,
      observations: inv.observations || ''
    })
    setShowCreateModal(true)
  }

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (editingInvoiceId) {
        await facturaService.actualizarFactura(editingInvoiceId, newInvoice)
      } else {
        await facturaService.crearFactura(newInvoice)
      }
      setShowCreateModal(false)
      setEditingInvoiceId(null)
      setNewInvoice({
        client: { document: '', name: '', address: '', phone: '', email: '' },
        items: [{ concept: '', quantity: 1, unitPrice: 0 }],
        statusId: '6a1ad9bf4d644ab738782e4b',
        inspection_id: '',
        observations: ''
      })
      fetchInvoices()
    } catch (err: any) {
      console.error('Error al guardar factura:', err)
      setError(err?.response?.data?.message || 'Error al guardar la factura. Verifique los campos.')
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
    <>
      <article className="panel">
      <header className="flex justify-between items-center mb-6">
        <div>
          <AnimatedText 
            text="Cola de Facturación" 
            variant="soft-blur-in"
            style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}
          />
          <p className="text-gray-500 text-sm" style={{ marginTop: '4px' }}>Gestione las facturas del sistema y asócielas con inspecciones de recepción.</p>
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
            onClick={handleOpenCreate}
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

      {/* Filtros de búsqueda responsivos */}
      <section className="filters-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minHeight: 'auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              className="text-gray-400" 
              size={18} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', marginTop: 0 }}
            />
            <input
              type="text"
              placeholder="Buscar por número de factura..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', height: '40px', minHeight: '40px', marginTop: 0 }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ height: '40px', minHeight: '40px', padding: '0 16px' }}>
            Buscar
          </button>
        </form>

        <div className="filters-bar-right">
          <div className="filter-group">
            <label>Estado:</label>
            <CustomSelect
              options={[
                { value: 'todos', label: 'Todos los estados' },
                ...statuses.map((s) => ({ value: s.id, label: s.name }))
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            />
          </div>

          <button 
            type="button"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('todos')
              setCurrentPage(1)
            }}
            className="btn btn-secondary"
            title="Limpiar filtros"
            style={{ height: '40px', minHeight: '40px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Limpiar
          </button>
        </div>
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
        <>
          <div className="table-wrap invoices-table-desktop">
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
                  <tr key={inv.id} className="invoice-row" style={{ opacity: 0 }}>
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
                      <button 
                        className="btn btn-secondary p-1"
                        title="Editar Factura"
                        onClick={() => handleOpenEdit(inv)}
                      >
                        <Pencil size={16} />
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

          <div className="invoices-cards-mobile">
            {invoices.map((inv) => (
              <div key={inv.id} className="invoice-card">
                <div className="invoice-card-header">
                  <span className="invoice-card-number">{inv.invoice_number}</span>
                  <span className="invoice-card-date">{new Date(inv.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="invoice-card-body">
                  <div className="invoice-card-row">
                    <span className="invoice-card-label">Cliente</span>
                    <span className="invoice-card-value">
                      <strong>{inv.client.name}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Doc: {inv.client.document}</span>
                    </span>
                  </div>
                  <div className="invoice-card-row">
                    <span className="invoice-card-label">Concepto</span>
                    <span className="invoice-card-value">
                      {inv.items.map((it, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          {it.concept} (x{it.quantity})
                        </div>
                      ))}
                    </span>
                  </div>
                  <div className="invoice-card-row">
                    <span className="invoice-card-label">Total</span>
                    <span className="invoice-card-value" style={{ fontWeight: 'bold', color: '#0f172a' }}>
                      {formatCOP(inv.total)}
                    </span>
                  </div>
                  <div className="invoice-card-row">
                    <span className="invoice-card-label">Estado</span>
                    <span 
                      className={`badge text-xs px-2 py-1 rounded font-bold`}
                      style={{
                        backgroundColor: inv.statusName === 'Pagado' ? '#dcfce7' : '#fee2e2',
                        color: inv.statusName === 'Pagado' ? '#166534' : '#991b1b',
                        marginTop: 0
                      }}
                    >
                      {inv.statusName || 'Pendiente'}
                    </span>
                  </div>
                </div>
                <div className="invoice-card-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary p-1"
                    title="Ver Detalles"
                    onClick={() => setSelectedInvoice(inv)}
                    style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={14} /> Detalles
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary p-1"
                    title="Editar Factura"
                    onClick={() => handleOpenEdit(inv)}
                    style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  {isAdmin && (
                    <button 
                      type="button"
                      className="btn btn-secondary p-1 text-red-600 hover:bg-red-50"
                      title="Eliminar Factura"
                      onClick={() => handleDeleteInvoice(inv.id)}
                      style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
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
    </article>

    {/* Modal de Detalle */}
    {selectedInvoice && (
      <div ref={modalBackdropRef} className="floating-modal-backdrop" style={{ opacity: 0 }}>
          <div className="floating-modal-box" style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}>
            <header className="floating-modal-header">
              <h3 className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet className="text-primary" /> Factura {selectedInvoice.invoice_number}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'transparent', boxShadow: 'none', minHeight: 'initial', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </header>
            <div className="floating-modal-body">
              {/* Información del Cliente */}
              <div className="form-row-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Información del Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold flex items-center gap-2 text-gray-800" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
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
                    <p className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Fecha: {new Date(selectedInvoice.createdAt).toLocaleString('es-CO')}
                    </p>
                    <p>ID Inspección: <span className="font-mono text-xs">{selectedInvoice.inspection_id}</span></p>
                    <p className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Estado: <span className="font-bold text-primary" style={{ fontWeight: 'bold' }}>{selectedInvoice.statusName || 'Pendiente'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conceptos</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th>Cant</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.concept}</td>
                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatCOP(it.unitPrice)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            {formatCOP(it.total ?? (it.unitPrice * it.quantity))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: '500' }}>{formatCOP(selectedInvoice.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IVA (19%):</span>
                    <span style={{ fontWeight: '500' }}>{formatCOP(selectedInvoice.tax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontWeight: 'bold' }}>
                    <span>Total a Pagar:</span>
                    <span>{formatCOP(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.observations && (
                <div className="bg-gray-50 p-4 rounded-lg" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Observaciones</h5>
                  <p className="text-sm text-gray-700">{selectedInvoice.observations}</p>
                </div>
              )}
            </div>
            <footer className="floating-modal-footer">
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
        <div ref={modalBackdropRef} className="floating-modal-backdrop" style={{ opacity: 0 }}>
          <form 
            onSubmit={handleGenerateInvoice}
            className="floating-modal-box max-w-md"
            style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}
          >
            <header className="floating-modal-header">
              <h3>Autogenerar Factura</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowGenerateModal(false)
                  setInspectionIdToGen('')
                }}
                style={{ background: 'transparent', boxShadow: 'none', minHeight: 'initial', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </header>
            <div className="floating-modal-body">
              <p className="text-sm text-gray-500" style={{ color: '#64748b', fontSize: '0.9rem' }}>
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
            <footer className="floating-modal-footer">
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
                {submitting ? <Loader2 className="spin" size={16} /> : <DollarSign size={16} />}
                Generar Factura
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Modal Crear/Editar Factura Manual */}
      {showCreateModal && (
        <div ref={modalBackdropRef} className="floating-modal-backdrop" style={{ opacity: 0 }}>
          <form 
            onSubmit={handleSaveInvoice}
            className="floating-modal-box"
            style={{ opacity: 0, transform: 'scale(0.95) translateY(20px)' }}
          >
            <header className="floating-modal-header">
              <h3>{editingInvoiceId ? 'Editar Factura' : 'Crear Factura Manual'}</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingInvoiceId(null)
                }}
                style={{ background: 'transparent', boxShadow: 'none', minHeight: 'initial', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </header>
            
            <div className="floating-modal-body">
              {/* Cliente */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', fontWeight: 'bold' }}>Datos del Cliente</h4>
                <div className="form-row-2">
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
                </div>
                <div className="form-row-2" style={{ marginTop: '10px' }}>
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
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newInvoice.client.address}
                    onChange={(e) => handleClientChange('address', e.target.value)}
                  />
                </div>
              </div>

              {/* Referencias */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 className="text-sm font-bold text-gray-800 mb-3" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', fontWeight: 'bold' }}>Detalles de Referencia</h4>
                <div className="form-row-2">
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
                    <CustomSelect
                      options={statuses.map((s) => ({ value: s.id, label: s.name }))}
                      value={newInvoice.statusId}
                      onChange={(val) => setNewInvoice({ ...newInvoice, statusId: val })}
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginTop: '1.5rem' }}>
                <div className="flex justify-between items-center mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <h4 className="text-sm font-bold text-gray-800" style={{ fontWeight: 'bold' }}>Conceptos de Cobro</h4>
                  <button 
                    type="button"
                    className="btn btn-secondary flex items-center gap-1 py-1 text-xs"
                    onClick={handleAddItem}
                    style={{ minHeight: '32px', padding: '4px 12px' }}
                  >
                    <Plus size={14} /> Añadir Concepto
                  </button>
                </div>
                <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {newInvoice.items.map((it, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div style={{ flex: 1 }}>
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
                      <div style={{ width: '80px' }}>
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
                      <div style={{ width: '140px' }}>
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
                          style={{ minHeight: '44px', color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div style={{ marginTop: '1.5rem' }}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones / Notas Adicionales</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={newInvoice.observations}
                  onChange={(e) => setNewInvoice({ ...newInvoice, observations: e.target.value })}
                />
              </div>
            </div>

            <footer className="floating-modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingInvoiceId(null)
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : (editingInvoiceId ? 'Actualizar Factura' : 'Emitir Factura')}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  )
}
