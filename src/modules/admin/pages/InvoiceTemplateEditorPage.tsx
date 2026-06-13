import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Save,
  Sparkles,
  LayoutTemplate,
  Code2,
  PenLine,
  Search,
  Eye,
  MoreVertical,
  Play,
  Copy,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { invoiceTemplateService } from '../services/invoiceTemplateService'
import type { TemplateVariable, TemplateType } from '../domain/invoiceTemplate.types'
import { DEFAULT_INVOICE_TEMPLATE } from '../constants/defaultInvoiceTemplate'
import type { DocumentTemplateCanvasRef } from '../components/DocumentTemplateCanvas'
import { DocumentPreviewPanel } from '../components/DocumentPreviewPanel'
import './InvoiceTemplatesPage.css'

const DocumentTemplateCanvas = lazy(() =>
  import('../components/DocumentTemplateCanvas').then(m => ({ default: m.DocumentTemplateCanvas })),
)

type EditorMode = 'visual' | 'code' | 'preview'

interface VariableChipProps {
  variable: TemplateVariable
  onInsert: (tag: string) => void
  showToast: (msg: string, type: 'success' | 'error') => void
}

function VariableChip({ variable, onInsert, showToast }: VariableChipProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    try {
      const textToCopy = `{{${variable.tag}}}`
      await navigator.clipboard.writeText(textToCopy)
      showToast(`Copiado: ${textToCopy}`, 'success')
    } catch (err) {
      showToast('Error al copiar al portapapeles', 'error')
    }
  }

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    onInsert(variable.tag)
  }

  return (
    <div className="invoice-editor-variable-chip-container">
      <div 
        className="invoice-editor-variable-chip-main"
        onClick={() => onInsert(variable.tag)}
        title={variable.description || variable.name}
      >
        <code>{'{{' + variable.tag + '}}'}</code>
        <span>{variable.name}</span>
      </div>
      <div className="invoice-editor-variable-chip-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className="invoice-editor-variable-chip-menu-btn"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          aria-label="Más opciones"
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div className="invoice-editor-variable-chip-dropdown">
            <button type="button" onClick={handleInsert}>
              <Play size={10} />
              Agregar directamente
            </button>
            <button type="button" onClick={handleCopy}>
              <Copy size={10} />
              Copiar variable
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function InvoiceTemplateEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuevo'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [types, setTypes] = useState<TemplateType[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>('visual')
  const [variableSearch, setVariableSearch] = useState('')

  const [name, setName] = useState('')
  const [typeCode, setTypeCode] = useState('INVOICE')
  const [body, setBody] = useState(isNew ? DEFAULT_INVOICE_TEMPLATE : '')
  const [isActive, setIsActive] = useState(false)
  const [templateKey, setTemplateKey] = useState(0)

  const canvasRef = useRef<DocumentTemplateCanvasRef>(null)
  const codeRef = useRef<HTMLTextAreaElement>(null)
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
          setTemplateKey(k => k + 1)
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

  const getCurrentBody = () => {
    if (editorMode === 'visual' && canvasRef.current) {
      return canvasRef.current.exportHtml()
    }
    return body
  }

  const insertVariable = (tag: string) => {
    if (editorMode === 'preview') return

    if (editorMode === 'visual') {
      canvasRef.current?.insertVariable(tag)
      return
    }

    const textarea = codeRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = body.substring(0, start)
    const after = body.substring(end)
    const insertion = `{{${tag}}}`
    const newBody = `${before}${insertion}${after}`
    setBody(newBody)

    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + insertion.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  const switchMode = (mode: EditorMode) => {
    if (mode === editorMode) return

    if (editorMode === 'visual' && canvasRef.current) {
      setBody(canvasRef.current.exportHtml())
      setTemplateKey(k => k + 1)
    }

    setEditorMode(mode)
  }

  const handleSave = async () => {
    const currentBody = getCurrentBody().trim()

    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'error')
      return
    }
    if (!currentBody) {
      showToast('El cuerpo HTML no puede estar vacío', 'error')
      return
    }

    setSaving(true)
    try {
      const data = { name: name.trim(), typeCode, body: currentBody, isActive }
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

  const filteredVariables = variables.filter(v => {
    const q = variableSearch.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      v.tag.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    )
  })

  const categories = ['INVOICE', 'CLIENT', 'VEHICLE', 'DATE'] as const

  if (loading) {
    return (
      <div className="invoice-templates-root invoice-templates-root--centered">
        <div className="invoice-templates-spinner" />
        <p className="invoice-templates-loading-text">Cargando plantilla...</p>
      </div>
    )
  }

  return (
    <div className="invoice-templates-root invoice-editor-root">
      <header className="invoice-editor-header">
        <div className="invoice-editor-header__left">
          <button
            type="button"
            className="invoice-editor-back-btn"
            onClick={() => navigate('/admin/documentos')}
            aria-label="Volver"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="invoice-editor-title">
              {isNew ? 'Nueva Plantilla' : 'Editar Plantilla'}
            </h2>
            <p className="invoice-editor-subtitle">
              Diseña visualmente tu documento. Al guardar se almacena el HTML con variables dinámicas.
            </p>
          </div>
        </div>
        <div className="invoice-editor-header__actions">
          <button
            type="button"
            className="btn btn-primary invoice-editor-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      {toast && createPortal(
        <div className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
        </div>,
        document.body,
      )}

      <section className="invoice-editor-meta">
        <div className="invoice-editor-meta__field">
          <label htmlFor="template-name">Nombre descriptivo</label>
          <input
            id="template-name"
            type="text"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Factura Estándar CDA 2026"
          />
        </div>
        <div className="invoice-editor-meta__field">
          <label htmlFor="template-type">Tipo de documento</label>
          <select
            id="template-type"
            className="form-control"
            value={typeCode}
            onChange={e => setTypeCode(e.target.value)}
          >
            {types.map(t => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="invoice-editor-meta__field invoice-editor-meta__field--toggle">
          <label htmlFor="template-active">Estado</label>
          <label className="invoice-editor-toggle">
            <input
              id="template-active"
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            <span>{isActive ? 'Activa al guardar' : 'Inactiva al guardar'}</span>
          </label>
        </div>
      </section>

      <div className={`invoice-editor-workspace ${editorMode === 'preview' ? 'invoice-editor-workspace--preview' : ''}`}>
        <div className="invoice-editor-main">
          <div className="invoice-editor-toolbar">
            <div className="invoice-editor-mode-tabs">
              <button
                type="button"
                className={`invoice-editor-mode-tab ${editorMode === 'visual' ? 'invoice-editor-mode-tab--active' : ''}`}
                onClick={() => switchMode('visual')}
              >
                <LayoutTemplate size={16} />
                Editor visual
              </button>
              <button
                type="button"
                className={`invoice-editor-mode-tab ${editorMode === 'code' ? 'invoice-editor-mode-tab--active' : ''}`}
                onClick={() => switchMode('code')}
              >
                <Code2 size={16} />
                Código HTML
              </button>
              <button
                type="button"
                className={`invoice-editor-mode-tab ${editorMode === 'preview' ? 'invoice-editor-mode-tab--active' : ''}`}
                onClick={() => switchMode('preview')}
              >
                <Eye size={16} />
                Vista previa
              </button>
            </div>
            <p className="invoice-editor-toolbar-hint">
              {editorMode === 'visual' && 'Arrastra bloques, edita textos y estilos directamente sobre el documento.'}
              {editorMode === 'code' && 'Modo avanzado para bloques {{#each}} y ajustes finos del HTML.'}
              {editorMode === 'preview' && 'Así se verá el documento con datos reales al generarse.'}
            </p>
          </div>

          <div className="invoice-editor-content">
            {editorMode === 'visual' && (
              <Suspense fallback={
                <div className="invoice-templates-root--centered" style={{ minHeight: 420 }}>
                  <div className="invoice-templates-spinner" />
                  <p className="invoice-templates-loading-text">Iniciando editor visual...</p>
                </div>
              }>
                <DocumentTemplateCanvas
                  key={templateKey}
                  ref={canvasRef}
                  html={body}
                  onChange={setBody}
                />
              </Suspense>
            )}

            {editorMode === 'code' && (
              <div className="invoice-editor-code-wrap">
                <textarea
                  ref={codeRef}
                  className="invoice-editor-code"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  spellCheck={false}
                  aria-label="Editor de código HTML"
                />
              </div>
            )}

            {editorMode === 'preview' && (
              <div className="invoice-editor-preview-wrap">
                <DocumentPreviewPanel html={body} />
              </div>
            )}
          </div>
        </div>

        {editorMode !== 'preview' && (
        <aside className="invoice-editor-variables">
          <div className="invoice-editor-variables__header">
            <span className="invoice-editor-variables__title">
              <Sparkles size={18} />
              Variables dinámicas
            </span>
            <p>Haz clic para insertar en el documento</p>
          </div>

          <div className="invoice-editor-variables__search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Buscar variable..."
              value={variableSearch}
              onChange={e => setVariableSearch(e.target.value)}
            />
          </div>

          <div className="invoice-editor-variables__list">
            {categories.map(cat => {
              const items = filteredVariables.filter(v => v.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat} className="invoice-editor-variable-group">
                  <div className="invoice-editor-variable-group__label">{cat}</div>
                  {items.map(v => (
                    <VariableChip
                      key={v.tag}
                      variable={v}
                      onInsert={insertVariable}
                      showToast={showToast}
                    />
                  ))}
                </div>
              )
            })}
            {filteredVariables.length === 0 && (
              <p className="invoice-editor-variables__empty">No hay variables que coincidan.</p>
            )}
          </div>

          <div className="invoice-editor-variables__tip">
            <PenLine size={14} />
            <span>
              Usa <strong>{'{{variable}}'}</strong> para datos simples y{' '}
              <strong>{'{{#each}}'}</strong> en modo código para filas repetibles.
            </span>
          </div>
        </aside>
        )}
      </div>
    </div>
  )
}
