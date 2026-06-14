import { useMemo } from 'react'
import { FileText, RefreshCw } from 'lucide-react'
import { renderTemplatePreview } from '../utils/templatePreview'

interface Props {
  html: string
  title?: string
}

export function DocumentPreviewPanel({ html, title = 'Vista previa en vivo' }: Props) {
  const previewDoc = useMemo(() => renderTemplatePreview(html), [html])

  return (
    <div className="document-preview-panel">
      <div className="document-preview-panel__header">
        <span className="document-preview-panel__title">
          <FileText size={16} />
          {title}
        </span>
        <span className="document-preview-panel__badge">
          <RefreshCw size={12} />
          Datos de ejemplo
        </span>
      </div>
      <div className="document-preview-panel__viewport">
        <div className="document-preview-panel__paper">
          <iframe
            title="Vista previa del documento"
            className="document-preview-panel__iframe"
            srcDoc={previewDoc}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
