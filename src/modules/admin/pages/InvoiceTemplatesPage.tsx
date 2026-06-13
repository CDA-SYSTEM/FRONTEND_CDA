import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Pencil, Trash2, Check, Sparkles, LayoutTemplate } from 'lucide-react'
import { createPortal } from 'react-dom'
import { AnimatedText } from '@/shared/components/AnimatedText'
import { ConfirmModal } from '@/shared/components/ConfirmModal'
import { useInvoiceTemplates } from '../hooks/useInvoiceTemplates'
import './InvoiceTemplatesPage.css'

export function InvoiceTemplatesPage() {
  const navigate = useNavigate()
  const {
    templates, loading, toast, deleteTarget,
    setDeleteTarget, handleActivate, handleDelete,
  } = useInvoiceTemplates()

  return (
    <div className="invoice-templates-root">
      <header className="flex justify-between items-center mb-6">
        <div>
          <AnimatedText
            text="Configuración de Documentos"
            variant="soft-blur-in"
            style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b' }}
          />
          <p className="text-slate-500 mt-1">Personaliza el diseño de tus facturas y comprobantes con el editor Canvas.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => navigate('/admin/documentos/nuevo')}>
          <Plus size={18} /> Nueva Plantilla
        </button>
      </header>

      {toast && createPortal(
        <div className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
        </div>,
        document.body,
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <LayoutTemplate size={64} strokeWidth={1} />
          <p className="mt-4 text-lg font-semibold text-slate-500">No hay plantillas aún</p>
          <p className="text-sm">Crea la primera para personalizar tus documentos</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map(t => (
            <div key={t.id} className={`template-card-premium ${t.isActive ? 'template-card-premium--active' : ''}`}>
              {t.isActive && (
                <div className="active-badge">
                  <Check size={12} /> Activa
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{t.name}</h3>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t.typeCode}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2 py-2" onClick={() => navigate(`/admin/documentos/${t.id}/edit`)}>
                  <Pencil size={14} /> Editar
                </button>
                {!t.isActive && (
                  <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2 py-2 text-blue-600" onClick={() => handleActivate(t.id)}>
                    <Sparkles size={14} /> Activar
                  </button>
                )}
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setDeleteTarget(t)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && createPortal(
        <ConfirmModal
          mensaje={`¿Eliminar "${deleteTarget.name}" definitivamente?`}
          labelConfirmar="Eliminar"
          onAceptar={handleDelete}
          onCancelar={() => setDeleteTarget(null)}
        />,
        document.body,
      )}
    </div>
  )
}
