import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, Save, Code, Sparkles, Info, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { invoiceTemplateService } from '../services/invoiceTemplateService'
import type { TemplateVariable, TemplateType } from '../domain/invoiceTemplate.types'
import './InvoiceTemplatesPage.css'

export function InvoiceTemplateEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuevo'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [types, setTypes] = useState<TemplateType[]>([])
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [name, setName] = useState('')
  const [typeCode, setTypeCode] = useState('INVOICE')
  const [body, setBody] = useState(isNew ? '<html>\n  <body>\n    <h1>Factura {{invoice.number}}</h1>\n  </body>\n</html>' : '')
  const [isActive, setIsActive] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    invoiceTemplateService.listarVariables().then(setVariables).catch(() => {})
    invoiceTemplateService.listarTipos().then(setTypes).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isNew && id) {
      invoiceTemplateService.obtenerPorId(id)
        .then(t => {
          setName(t.name)
          setTypeCode(t.typeCode)
          setBody(t.body)
          setIsActive(t.isActive)
        })
        .catch(() => {
          showToast('Plantilla no encontrada', 'error')
          navigate('/admin/documentos')
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, navigate, showToast])

  useEffect(() => {
    return () => clearTimeout(toastTimer.current)
  }, [])

  const insertVariable = (tag: string) => {
    if (!textareaRef.current) return
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const text = textareaRef.current.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const newBody = `${before}{{${tag}}}${after}`
    setBody(newBody)
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(start + tag.length + 4, start + tag.length + 4)
    }, 0)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'error')
      return
    }
    if (!body.trim()) {
      showToast('El cuerpo HTML no puede estar vacío', 'error')
      return
    }
    setSaving(true)
    try {
      const data = { name: name.trim(), typeCode, body: body.trim(), isActive }
      if (isNew) {
        await invoiceTemplateService.crear(data)
        showToast('Plantilla creada correctamente', 'success')
      } else {
        await invoiceTemplateService.actualizar(id!, data)
        showToast('Plantilla actualizada correctamente', 'success')
      }
      setTimeout(() => navigate('/admin/documentos'), 1000)
    } catch {
      showToast('Error al guardar la plantilla', 'error')
    } finally {
      setSaving(false)
    }
  }

  const generatePreview = () => {
    setPreviewHtml(body.replace(/{{(.*?)}}/g, '<strong>[{{$1}}]</strong>'))
    setShowPreview(true)
  }

  if (loading) {
    return (
      <div className="invoice-templates-root flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="invoice-templates-root">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button className="btn btn-secondary p-2 rounded-full" onClick={() => navigate('/admin/documentos')}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isNew ? 'Nueva Plantilla' : 'Editar Plantilla'}
            </h2>
            <p className="text-slate-500 text-sm">Diseña el cuerpo del documento usando HTML y variables dinámicas.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center gap-2" onClick={generatePreview}>
            <Eye size={18} /> Previsualizar
          </button>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      {toast && createPortal(
        <div className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
        </div>,
        document.body,
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre descriptivo</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Factura Electrónica Oficial 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Documento</label>
            <select className="form-control" value={typeCode} onChange={e => setTypeCode(e.target.value)}>
              {types.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="editor-container">
        <div className="canvas-main">
          <div className="flex items-center justify-between px-2">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <Code size={16} className="text-blue-500" /> Editor HTML / Canvas
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info size={14} /> Usa doble llave {"{{variable}}"} para inyectar datos.
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="canvas-editor-textarea"
            value={body}
            onChange={e => setBody(e.target.value)}
            spellCheck={false}
          />
        </div>

        <aside className="variables-sidebar">
          <div className="sidebar-header">
            <span className="flex items-center gap-2 font-bold text-slate-700">
              <Sparkles size={18} className="text-amber-500" /> Variables
            </span>
            <p className="text-xs text-slate-500 mt-1">Haz clic para insertar</p>
          </div>
          <div className="variables-list">
            {['INVOICE', 'CLIENT', 'VEHICLE', 'DATE'].map(cat => (
              <div key={cat}>
                <div className="category-label">{cat}</div>
                {variables.filter(v => v.category === cat).map(v => (
                  <button key={v.tag} className="variable-chip w-full" onClick={() => insertVariable(v.tag)}>
                    <span className="variable-tag">{"{{" + v.tag + "}}"}</span>
                    <span className="variable-name">{v.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {showPreview && createPortal(
        <div className="modal-overlay-premium" onClick={() => setShowPreview(false)}>
          <div className="modal-window-premium max-w-4xl" onClick={e => e.stopPropagation()} style={{ height: '90vh', overflowY: 'auto' }}>
            <header className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold">Vista Previa</h3>
              <button className="p-2 bg-slate-100 rounded-full" onClick={() => setShowPreview(false)}>
                <X size={20} />
              </button>
            </header>
            <div className="p-8 bg-slate-200 min-h-screen">
              <div
                className="preview-modal-content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
