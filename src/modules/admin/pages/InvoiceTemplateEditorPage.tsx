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
  FolderOpen,
  FolderPlus,
  UploadCloud,
  ArrowLeft,
  Plus,
  FileText,
  File,
  Trash2,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { invoiceTemplateService } from '../services/invoiceTemplateService'
import type { TemplateVariable, TemplateType } from '../domain/invoiceTemplate.types'
import { DEFAULT_INVOICE_TEMPLATE } from '../constants/defaultInvoiceTemplate'
import type { DocumentTemplateCanvasRef } from '../components/DocumentTemplateCanvas'
import { DocumentPreviewPanel } from '../components/DocumentPreviewPanel'
import { storageService, StorageFolder, StorageFile, StorageItem } from '@/modules/storage/services/storageService'
import { ConfirmModal } from '@/shared/components/ConfirmModal'
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

interface MediaLibraryPanelProps {
  onInsertImage: (url: string) => void
  onInsertLink: (url: string, name: string) => void
  showToast: (msg: string, type: 'success' | 'error') => void
}

function MediaLibraryPanel({ onInsertImage, onInsertLink, showToast }: MediaLibraryPanelProps) {
  const [currentFolder, setCurrentFolder] = useState<StorageFolder | null>(null)
  const [contents, setContents] = useState<StorageItem[]>([])
  const [folderStack, setFolderStack] = useState<StorageFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [folderSearch, setFolderSearch] = useState('')
  const [folderToDelete, setFolderToDelete] = useState<StorageFolder | null>(null)
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null)

  const loadContents = useCallback(async () => {
    setLoading(true)
    let data: StorageItem[]
    if (currentFolder) {
      data = await storageService.getFolderContents(currentFolder.id)
    } else if (folderSearch) {
      const rootFolders = await storageService.listarCarpetas(folderSearch)
      data = rootFolders.map(f => ({ ...f, type: 'folder' as const }))
    } else {
      data = await storageService.listRootContents()
    }
    setContents(data)
    setLoading(false)
  }, [currentFolder, folderSearch])

  useEffect(() => { loadContents() }, [loadContents])

  const navigateToFolder = (folder: StorageFolder) => {
    setFolderStack(prev => currentFolder ? [...prev, currentFolder] : [])
    setCurrentFolder(folder)
    setShowCreateFolder(false)
  }

  const navigateUp = () => {
    if (folderStack.length === 0) {
      setCurrentFolder(null)
    } else {
      const parent = folderStack[folderStack.length - 1]
      setFolderStack(prev => prev.slice(0, -1))
      setCurrentFolder(parent)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    const folder = await storageService.crearCarpeta(newFolderName.trim(), currentFolder?.id)
    if (folder) {
      showToast('Carpeta creada con éxito', 'success')
      setNewFolderName('')
      setShowCreateFolder(false)
      loadContents()
    } else {
      showToast('Error al crear la carpeta', 'error')
    }
  }

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return
    const id = folderToDelete.id
    setFolderToDelete(null)
    setLoading(true)
    const success = await storageService.eliminarCarpeta(id)
    setLoading(false)
    if (success) {
      showToast('Carpeta eliminada con éxito', 'success')
      loadContents()
    } else {
      showToast('Error al eliminar. Asegúrate de que la carpeta esté vacía.', 'error')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const uploaded = await storageService.subirArchivo(file, currentFolder?.id)
    setUploading(false)
    if (uploaded) {
      showToast('Archivo subido con éxito', 'success')
      loadContents()
    } else {
      showToast('Error al subir el archivo', 'error')
    }
  }

  const handleDeleteFile = async () => {
    if (!fileToDelete) return
    const id = fileToDelete.id
    setFileToDelete(null)
    const success = await storageService.eliminarArchivo(id)
    if (success) {
      showToast('Archivo eliminado', 'success')
      loadContents()
    } else {
      showToast('Error al eliminar archivo', 'error')
    }
  }

  const getFileUrl = (file: StorageFile) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://api-cda.ilesandres.online'
    return `${backendUrl}/api/v1/storage/files/${file.id}`
  }

  const handleCopyUrl = async (file: StorageFile, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = getFileUrl(file)
    try {
      await navigator.clipboard.writeText(url)
      showToast('Enlace copiado al portapapeles', 'success')
    } catch {
      showToast('Error al copiar el enlace', 'error')
    }
  }

  const handleInsert = (file: StorageFile, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = getFileUrl(file)
    const isImage = file.mimetype.startsWith('image/')
    if (isImage) {
      onInsertImage(url)
      showToast('Imagen insertada en la plantilla', 'success')
    } else {
      onInsertLink(url, file.original_name)
      showToast('Enlace de archivo insertado', 'success')
    }
  }

  const getFolderColorClass = (index: number) => {
    const colors = ['folder-blue', 'folder-green', 'folder-purple', 'folder-pink', 'folder-cyan']
    return colors[index % colors.length]
  }

  const folderContents = contents.filter(i => i.type === 'folder') as StorageItem[]
  const fileContents = contents.filter(i => i.type === 'file') as StorageItem[]

  return (
    <div className="media-library-panel">
      <div className="media-folders-view">
        <div className="media-folders-header">
          {currentFolder ? (
            <button type="button" className="media-back-btn" onClick={navigateUp}>
              <ArrowLeft size={14} />
              Volver
            </button>
          ) : null}
          <span className="media-folders-title">
            {currentFolder ? currentFolder.name : 'Biblioteca de Medios'}
          </span>
          <button
            type="button"
            className="media-new-folder-btn"
            onClick={() => setShowCreateFolder(s => !s)}
            title="Nueva carpeta"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        <div className="media-upload-area">
          <label className="media-upload-label">
            <UploadCloud size={20} />
            <span>{uploading ? 'Subiendo...' : 'Subir archivo'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {!currentFolder && (
          <div className="invoice-editor-variables__search" style={{ margin: '0 0 0.75rem 0' }}>
            <Search size={15} />
            <input
              type="search"
              placeholder="Buscar carpeta..."
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
            />
          </div>
        )}

        {showCreateFolder && (
          <form onSubmit={handleCreateFolder} className="media-new-folder-form">
            <input
              type="text"
              placeholder="Nombre de la carpeta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateFolder(false)}>Cancelar</button>
              <button type="submit" className="submit-btn">Crear</button>
            </div>
          </form>
        )}

        {loading ? (
            <div className="media-loading">
              <span className="spinner" />
              <span>Cargando...</span>
            </div>
          ) : contents.length === 0 ? (
            <div className="media-empty">
              <span>Esta carpeta está vacía.</span>
            </div>
          ) : (
            <>
              {folderContents.length > 0 && (
                <div className="media-folders-grid">
                  {folderContents.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`media-folder-card ${getFolderColorClass(idx)}`}
                      onClick={() => navigateToFolder(item as StorageFolder)}
                    >
                      <button
                        type="button"
                        className="media-folder-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFolderToDelete(item as StorageFolder)
                        }}
                        title="Eliminar carpeta"
                      >
                        <Trash2 size={12} />
                      </button>
                      <FolderOpen size={28} className="folder-icon" />
                      <span className="folder-name" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {fileContents.length > 0 && (
                <div className="media-files-grid">
                  {fileContents.map((item) => {
                    const isImage = item.mimetype?.startsWith('image/')
                    const fileUrl = getFileUrl(item)
                    return (
                      <div key={item.id} className="media-file-card">
                        <div className="media-file-card__preview">
                          {isImage ? (
                            <img src={fileUrl} alt={item.original_name} />
                          ) : (
                            <div className="media-file-icon">
                              {item.mimetype === 'application/pdf' ? (
                                <FileText size={24} style={{ color: '#ef4444' }} />
                              ) : (
                                <File size={24} style={{ color: '#64748b' }} />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="media-file-card__info">
                          <span className="media-file-name" title={item.original_name}>
                            {item.original_name}
                          </span>
                        </div>
                        <div className="media-file-card__actions">
                          <button
                            type="button"
                            onClick={(e) => handleInsert(item, e)}
                            title={isImage ? "Insertar Imagen" : "Insertar Enlace"}
                            className="media-action-btn media-action-btn--insert"
                          >
                            <Plus size={12} />
                            Insertar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyUrl(item, e)}
                            title="Copiar Enlace"
                            className="media-action-btn"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFileToDelete(item) }}
                            title="Eliminar"
                            className="media-action-btn media-action-btn--danger"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
      </div>

      {folderToDelete && (
        <ConfirmModal
          mensaje={`¿Estás seguro de que deseas eliminar la carpeta "${folderToDelete.name}"? Esta acción solo se puede realizar si la carpeta está completamente vacía.`}
          labelConfirmar="Eliminar"
          onAceptar={handleDeleteFolder}
          onCancelar={() => setFolderToDelete(null)}
        />
      )}

      {fileToDelete && (
        <ConfirmModal
          mensaje={`¿Estás seguro de eliminar el archivo "${fileToDelete.original_name}"?`}
          labelConfirmar="Eliminar"
          onAceptar={handleDeleteFile}
          onCancelar={() => setFileToDelete(null)}
        />
      )}
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
  const [sidebarTab, setSidebarTab] = useState<'variables' | 'media'>('variables')
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
      if (canvasRef.current) {
        canvasRef.current.insertVariable(tag)
      } else {
        console.warn('[PAGE] canvasRef.current is null!')
      }
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
          <div className="invoice-sidebar-tabs">
            <button
              type="button"
              className={`invoice-sidebar-tab ${sidebarTab === 'variables' ? 'invoice-sidebar-tab--active' : ''}`}
              onClick={() => setSidebarTab('variables')}
            >
              <Sparkles size={14} />
              Variables
            </button>
            <button
              type="button"
              className={`invoice-sidebar-tab ${sidebarTab === 'media' ? 'invoice-sidebar-tab--active' : ''}`}
              onClick={() => setSidebarTab('media')}
            >
              <FolderOpen size={14} />
              Biblioteca
            </button>
          </div>

          {sidebarTab === 'variables' ? (
            <>
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
            </>
          ) : (
            <MediaLibraryPanel
              onInsertImage={(url) => canvasRef.current?.insertImage(url)}
              onInsertLink={(url, name) => canvasRef.current?.insertLink(url, name)}
              showToast={showToast}
            />
          )}
        </aside>
        )}
      </div>
    </div>
  )
}
