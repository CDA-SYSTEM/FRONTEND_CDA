import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import './ArchivosPage.css'
import { 
  FileImage, 
  FileText, 
  File, 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  Loader2, 
  FolderOpen, 
  ExternalLink,
  AlertTriangle,
  X
} from 'lucide-react'
import { checklistService } from '@/modules/inspeccion/services/checklistService'

interface StorageFile {
  id: string
  filename: string
  original_name: string
  mimetype: string
  created_at: string
  deleted_at: string | null
  url: string
}

export function ArchivosPage() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'pdf' | 'other'>('all')
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cargar lista de archivos
  const loadFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await checklistService.listarArchivos(200)
      setFiles(data)
    } catch (err) {
      console.error('Error al cargar archivos:', err)
      setError('Ocurrió un error al cargar la lista de archivos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  // Formatear fecha
  const formatFecha = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return isoString
    }
  }

  // Eliminar archivo
  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      const success = await checklistService.eliminarArchivo(deletingId)
      if (success) {
        setFiles((prev) => prev.filter((f) => f.id !== deletingId))
        setDeletingId(null)
      } else {
        alert('No se pudo eliminar el archivo. Inténtalo de nuevo.')
      }
    } catch (err) {
      console.error('Error al eliminar archivo:', err)
      alert('Error en el servidor al intentar eliminar el archivo.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Obtener URL final para descargar/previsualizar
  const getFileUrl = (file: StorageFile) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://api-cda.ilesandres.online'
    return `${backendUrl}/api/v1/storage/files/${file.id}`
  }

  // Filtrado y búsqueda
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (!matchesSearch) return false

      if (activeTab === 'image') {
        return file.mimetype.startsWith('image/')
      }
      if (activeTab === 'pdf') {
        return file.mimetype === 'application/pdf'
      }
      if (activeTab === 'other') {
        return !file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf'
      }

      return true
    })
  }, [files, searchQuery, activeTab])

  // Obtener icono correspondiente al mimetype
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <FileImage size={24} style={{ color: '#3b82f6' }} />
    }
    if (mimetype === 'application/pdf') {
      return <FileText size={24} style={{ color: '#ef4444' }} />
    }
    return <File size={24} style={{ color: '#64748b' }} />
  }

  return (
    <div className="archivos-root">
      
      {/* ── Cabecera de Módulo ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: '#fff', 
        padding: '1.5rem', 
        borderRadius: 12, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={24} style={{ color: '#155DFC' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
              Gestión de Archivos
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              Administración de evidencias, imágenes y documentos del sistema
            </p>
          </div>
        </div>
      </div>

      {/* ── Buscador y Filtros Rápidos ── */}
      <div style={{
        background: '#fff',
        padding: '1.25rem',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar archivos por nombre original..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%',
              paddingLeft: 46, 
              height: 44, 
              fontSize: '0.95rem', 
              borderRadius: 8, 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'image', 'pdf', 'other'] as const).map((tab) => {
            const labelMap = { all: 'Todos', image: 'Imágenes', pdf: 'PDFs', other: 'Otros' }
            const isSelected = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: isSelected ? '#155DFC' : '#f8fafc',
                  color: isSelected ? '#fff' : '#64748b',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 'auto',
                  boxShadow: isSelected ? '0 4px 10px rgba(21,93,252,0.15)' : 'none'
                }}
              >
                {labelMap[tab]}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contenido Principal ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
          <p style={{ marginTop: 12, color: '#64748b', fontSize: '0.95rem' }}>Cargando archivos...</p>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.5rem', borderRadius: 12, color: '#991b1b', textAlign: 'center' }}>
          <p>{error}</p>
          <button onClick={loadFiles} style={{ marginTop: 10, background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
            Reintentar
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 2rem',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          color: '#64748b',
          minHeight: 300,
        }}>
          <FolderOpen size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: '1.05rem', margin: 0 }}>No se encontraron archivos en esta categoría</p>
        </div>
      ) : (
        <div className="archivos-media-grid">
          {filteredFiles.map((file) => {
            const isImage = file.mimetype.startsWith('image/')
            const fileUrl = getFileUrl(file)
            return (
              <div 
                key={file.id} 
                className="archivo-premium-card"
              >
                {/* Preview / Miniatura superior */}
                <div className="archivo-preview-box">
                  {isImage ? (
                    <img 
                      src={fileUrl} 
                      alt={file.original_name}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      {getFileIcon(file.mimetype)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                        {file.mimetype.split('/')[1] || 'Archivo'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detalles e Información */}
                <div className="archivo-info">
                  <h3 
                    title={file.original_name}
                    className="archivo-filename"
                  >
                    {file.original_name}
                  </h3>
                  <div className="archivo-meta">
                    <span>Subido: {formatFecha(file.created_at)}</span>
                    <span className="archivo-id">ID: {file.id.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="archivo-footer">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="arc-btn-ghost arc-btn-ghost--view"
                    title="Ver vista previa"
                  >
                    <Eye size={16} />
                  </button>
                  <a
                    href={fileUrl}
                    download={file.original_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="arc-btn-ghost arc-btn-ghost--download"
                    title="Descargar archivo"
                  >
                    <Download size={16} />
                  </a>
                  
                  <button
                    onClick={() => setDeletingId(file.id)}
                    className="arc-btn-ghost arc-btn-ghost--delete"
                    title="Eliminar archivo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal de Vista Previa ── */}
      {previewFile && createPortal(
        <div className="modal-overlay-premium">
          <div 
            className="modal-window-premium"
            style={{ maxWidth: previewFile.mimetype.startsWith('image/') ? '750px' : '500px' }}
          >
            {/* Cabecera Modal */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                Vista previa del archivo
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: 'auto',
                  boxShadow: 'none'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo Modal */}
            <div style={{ 
              padding: '1.5rem', 
              background: '#f8fafc', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 250,
              maxHeight: '60vh',
              overflow: 'auto'
            }}>
              {previewFile.mimetype.startsWith('image/') ? (
                <img
                  src={getFileUrl(previewFile)}
                  alt={previewFile.original_name}
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: 8 }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '2rem 1rem' }}>
                  {getFileIcon(previewFile.mimetype)}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1e293b' }}>{previewFile.original_name}</p>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Formato: {previewFile.mimetype}</span>
                  </div>
                  <a
                    href={getFileUrl(previewFile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#155DFC',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <ExternalLink size={16} />
                    Abrir en pestaña nueva
                  </a>
                </div>
              )}
            </div>

            {/* Pie Modal */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minHeight: 'auto',
                  boxShadow: 'none',
                  border: 'none'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal de Confirmación de Eliminación ── */}
      {deletingId && createPortal(
        <div className="modal-overlay-premium">
          <div className="modal-window-premium max-w-sm" style={{ padding: '1.5rem', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dc2626' }}>
              <div style={{ background: '#fef2f2', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>¿Eliminar archivo?</h3>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Esta acción marcará el archivo como eliminado en el servidor. Las referencias en las inspecciones podrían dejar de mostrar este recurso.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minHeight: 'auto',
                  boxShadow: 'none',
                  border: 'none'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 'auto',
                  boxShadow: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isDeleting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
