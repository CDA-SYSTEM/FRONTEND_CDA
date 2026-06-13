import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react'
import grapesjs, { type Editor, type Component } from 'grapesjs'
import presetWebpage from 'grapesjs-preset-webpage'
import 'grapesjs/dist/css/grapes.min.css'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { buildTemplateHtml, parseTemplateHtml } from '../utils/templateHtml'

export interface DocumentTemplateCanvasRef {
  insertVariable: (tag: string) => void
  insertImage: (url: string) => void
  insertLink: (url: string, name: string) => void
  exportHtml: () => string
}

interface Props {
  html: string
  onChange: (html: string) => void
}

const BLOCKS_CONTAINER_ID = 'gjs-blocks-container'
const STYLES_CONTAINER_ID = 'gjs-styles-container'
const TRAITS_CONTAINER_ID = 'gjs-traits-container'

export const DocumentTemplateCanvas = forwardRef<DocumentTemplateCanvasRef, Props>(
  function DocumentTemplateCanvas({ html, onChange }, ref) {
    const hostRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<Editor | null>(null)
    const syncingRef = useRef(false)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const internalUpdateRef = useRef(false)
    const isTypingRef = useRef(false)

    const [activeTab, setActiveTab] = useState<'styles' | 'traits'>('styles')
    const [hasSelection, setHasSelection] = useState(false)
    const [selectedComponent, setSelectedComponent] = useState<any>(null)
    const [selectedText, setSelectedText] = useState('')
    const [selectedId, setSelectedId] = useState('')

    const [quickTitle, setQuickTitle] = useState('')
    const [quickText, setQuickText] = useState('')
    const [quickInsertOpen, setQuickInsertOpen] = useState(false)

    const handleQuickTitleInsert = () => {
      if (!quickTitle.trim()) return
      const editor = editorRef.current
      if (!editor) return

      const selected = editor.getSelected()
      const titleHtml = `<h2 style="font-family: Inter, sans-serif; font-size: 20px; font-weight: 600; color: #1e293b; margin-top: 10px; margin-bottom: 10px;">${quickTitle.trim()}</h2>`

      if (selected) {
        selected.append({
          type: 'text',
          content: quickTitle.trim(),
          tagName: 'h2',
          style: { 'font-family': 'Inter, sans-serif', 'font-size': '20px', 'font-weight': '600', 'color': '#1e293b', 'margin-top': '10px', 'margin-bottom': '10px' }
        })
      } else {
        editor.addComponents(titleHtml)
      }
      setQuickTitle('')
    }

    const handleQuickTextInsert = () => {
      if (!quickText.trim()) return
      const editor = editorRef.current
      if (!editor) return

      const selected = editor.getSelected()
      const textHtml = `<p style="font-family: Inter, sans-serif; font-size: 14px; color: #475569; line-height: 1.5; margin-top: 10px; margin-bottom: 10px;">${quickText.trim()}</p>`

      if (selected) {
        selected.append({
          type: 'text',
          content: quickText.trim(),
          tagName: 'p',
          style: { 'font-family': 'Inter, sans-serif', 'font-size': '14px', 'color': '#475569', 'line-height': '1.5', 'margin-top': '10px', 'margin-bottom': '10px' }
        })
      } else {
        editor.addComponents(textHtml)
      }
      setQuickText('')
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setSelectedText(val)
      
      const component = selectedComponent
      if (component) {
        isTypingRef.current = true
        component.set('content', val)
        const el = component.getEl()
        if (el) {
          el.innerText = val
        }
        const editor = editorRef.current
        if (editor) {
          editor.store()
        }
        setTimeout(() => {
          isTypingRef.current = false
        }, 100)
      }
    }

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setSelectedId(val)
      
      const component = selectedComponent
      if (component) {
        isTypingRef.current = true
        const attrs = component.get('attributes') || {}
        component.set('attributes', { ...attrs, id: val })
        const editor = editorRef.current
        if (editor) {
          editor.store()
        }
        setTimeout(() => {
          isTypingRef.current = false
        }, 100)
      }
    }

    const handleTabChange = (tab: 'styles' | 'traits') => {
      setActiveTab(tab)
      const editor = editorRef.current
      if (!editor) return
      if (tab === 'styles') {
        editor.runCommand('open-sm')
      } else {
        editor.runCommand('open-tm')
      }
    }

    const exportHtml = useCallback(() => {
      const editor = editorRef.current
      if (!editor) return html
      return buildTemplateHtml(editor.getCss() ?? '', editor.getHtml() ?? '')
    }, [html])

    useImperativeHandle(ref, () => ({
      insertVariable(tag: string) {
        const editor = editorRef.current
        if (!editor) return

        const variable = `{{${tag}}}`
        const selected = editor.getSelected()

        if (selected?.is('text')) {
          const content = selected.get('content') ?? ''
          selected.set('content', `${content}${variable}`)
        } else if (selected) {
          selected.append({ type: 'text', content: variable })
        } else {
          editor.addComponents(
            `<span class="template-variable" style="background:#eff6ff;color:#1d4ed8;padding:2px 6px;border-radius:4px;font-weight:600;">${variable}</span>`,
          )
        }
      },
      insertImage(url: string) {
        const editor = editorRef.current
        if (!editor) return

        const selected = editor.getSelected()
        if (selected && selected.is('image')) {
          selected.set('attributes', { ...selected.get('attributes'), src: url })
        } else if (selected) {
          selected.append({
            type: 'image',
            dmode: 'absolute',
            attributes: { src: url, style: 'max-width: 150px; height: auto; position: absolute; z-index: 10; cursor: move;' }
          })
        } else {
          editor.addComponents({
            type: 'image',
            dmode: 'absolute',
            attributes: { src: url, style: 'max-width: 150px; height: auto; position: absolute; z-index: 10; cursor: move;' }
          })
        }
      },
      insertLink(url: string, name: string) {
        const editor = editorRef.current
        if (!editor) return

        const selected = editor.getSelected()
        if (selected?.is('text')) {
          const content = selected.get('content') ?? ''
          selected.set('content', `${content}<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`)
        } else if (selected) {
          selected.append({
            type: 'link',
            content: name,
            attributes: { href: url, target: '_blank', style: 'color: #2563eb; text-decoration: underline;' }
          })
        } else {
          editor.addComponents(
            `<a href="${url}" style="color: #2563eb; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${name}</a>`
          )
        }
      },
      exportHtml,
    }))

    useEffect(() => {
      if (!hostRef.current) return

      const editor = grapesjs.init({
        container: hostRef.current,
        height: '100%',
        width: 'auto',
        fromElement: false,
        storageManager: false,
        noticeOnUnload: false,
        plugins: [presetWebpage],
        pluginsOpts: {
          'gjs-preset-webpage': {
            modalImportTitle: 'Importar plantilla',
            modalImportButton: 'Importar',
            modalImportLabel: 'Pega tu HTML aquí',
            modalImportContent: (editorInstance: Editor) => editorInstance.getHtml(),
            showStylesOnChange: false,
          },
        },
        blockManager: {
          appendTo: `#${BLOCKS_CONTAINER_ID}`,
        },
        styleManager: {
          appendTo: `#${STYLES_CONTAINER_ID}`,
          sectors: [
            {
              name: 'Dimensiones y Espaciado',
              open: true,
              buildProps: ['width', 'height', 'margin', 'padding'],
            },
            {
              name: 'Tipografía y Alineación',
              open: true,
              buildProps: ['font-family', 'font-size', 'font-weight', 'color', 'line-height', 'text-align'],
              properties: [
                {
                  property: 'font-family',
                  type: 'select',
                  defaults: 'Inter, sans-serif',
                  list: [
                    { id: 'Inter, sans-serif', name: 'Inter' },
                    { id: 'Arial, Helvetica, sans-serif', name: 'Arial' },
                    { id: 'Georgia, serif', name: 'Georgia' },
                    { id: 'Courier New, monospace', name: 'Courier' },
                    { id: 'Times New Roman, serif', name: 'Times' },
                    { id: 'Verdana, sans-serif', name: 'Verdana' }
                  ]
                }
              ]
            },
            {
              name: 'Fondo y Bordes',
              open: true,
              buildProps: ['background-color', 'border', 'border-radius', 'box-shadow'],
            },
          ],
        },
        traitManager: {
          appendTo: `#${TRAITS_CONTAINER_ID}`,
        },
        deviceManager: {
          devices: [
            { id: 'a4', name: 'Documento A4', width: '794px' },
            { id: 'tablet', name: 'Tablet', width: '768px' },
            { id: 'mobile', name: 'Móvil', width: '375px' },
          ],
        },
        canvas: {
          styles: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
          ],
        },
      })

      editorRef.current = editor
      configureEditorPanels(editor)

      // Configurar el tipo de componente cell para que sea completamente editable (td y th)
      const cellType = editor.DomComponents.getType('cell')
      if (cellType) {
        editor.DomComponents.addType('cell', {
          model: {
            defaults: {
              ...cellType.model.prototype.defaults,
              editable: true,
            },
          },
        })
      }

      const { styles, body } = parseTemplateHtml(html)
      editor.setComponents(body)
      if (styles) editor.setStyle(styles)

      editor.on('update', () => {
        if (syncingRef.current) return
        internalUpdateRef.current = true
        onChangeRef.current(exportHtmlFromEditor(editor))
        setTimeout(() => {
          internalUpdateRef.current = false
        }, 50)
      })

      editor.on('component:selected', (component) => {
        setHasSelection(true)
        setSelectedComponent(component)
        const el = component.getEl()
        setSelectedText(el ? el.innerText : (component.get('content') || ''))
        setSelectedId(component.get('attributes')?.id || component.get('id') || '')
      })

      editor.on('component:deselected', () => {
        if (!editor.getSelected()) {
          setHasSelection(false)
          setSelectedComponent(null)
          setSelectedText('')
          setSelectedId('')
        }
      })

      editor.on('component:update', (component) => {
        if (isTypingRef.current) return

        const selected = editor.getSelected()
        if (selected && selected === component) {
          const el = component.getEl()
          setSelectedText(el ? el.innerText : (component.get('content') || ''))
          setSelectedId(component.get('attributes')?.id || component.get('id') || '')
        }
      })

      return () => {
        editor.destroy()
        editorRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <div className="document-template-canvas-host">
        <aside className="gjs-side-panel">
          <section className="gjs-side-panel__section">
            <h4 className="gjs-side-panel__title">Insertar bloques</h4>
            <p className="gjs-side-panel__hint">Arrastra al documento</p>
            <div id={BLOCKS_CONTAINER_ID} className="gjs-side-panel__blocks" />
          </section>

          <section className="gjs-side-panel__section">
            <div 
              className="quick-insert-header"
              onClick={() => setQuickInsertOpen(!quickInsertOpen)}
            >
              <div>
                <h4 className="gjs-side-panel__title">Creación Rápida</h4>
                <p className="gjs-side-panel__hint">Escribe e inserta en la posición seleccionada</p>
              </div>
              <span className="quick-insert-chevron">
                {quickInsertOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>
            
            {quickInsertOpen && (
              <div className="quick-insert-fields">
                <div className="quick-insert-field">
                  <input 
                    type="text" 
                    placeholder="Escribe un título..."
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="form-control-custom"
                  />
                  <button 
                    type="button" 
                    onClick={handleQuickTitleInsert}
                    className="quick-insert-btn"
                    title="Insertar Título"
                  >
                    <Plus size={14} />
                    Insertar Título
                  </button>
                </div>
                <div className="quick-insert-field">
                  <textarea 
                    placeholder="Escribe un párrafo o texto..."
                    value={quickText}
                    onChange={(e) => setQuickText(e.target.value)}
                    className="form-control-custom"
                    rows={2}
                  />
                  <button 
                    type="button" 
                    onClick={handleQuickTextInsert}
                    className="quick-insert-btn"
                    title="Insertar Texto"
                  >
                    <Plus size={14} />
                    Insertar Texto
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="gjs-side-panel__section gjs-side-panel__section--props">
            <h4 className="gjs-side-panel__title">Propiedades</h4>
            <p className="gjs-side-panel__hint">Selecciona un elemento del documento</p>
            
            <div className="gjs-panel-tabs">
              <button 
                type="button" 
                className={`gjs-panel-tab ${activeTab === 'styles' ? 'gjs-panel-tab--active' : ''}`}
                onClick={() => handleTabChange('styles')}
              >
                Estilos
              </button>
              <button 
                type="button" 
                className={`gjs-panel-tab ${activeTab === 'traits' ? 'gjs-panel-tab--active' : ''}`}
                onClick={() => handleTabChange('traits')}
              >
                Atributos
              </button>
            </div>

            <div id={TRAITS_CONTAINER_ID} style={{ display: 'none' }} />
            <div id={STYLES_CONTAINER_ID} className="gjs-side-panel__styles" style={{ display: activeTab === 'styles' && hasSelection ? 'block' : 'none' }} />
            
            {activeTab === 'traits' && hasSelection && (
              <div className="custom-traits-panel">
                {selectedComponent && (
                  selectedComponent.is('text') || 
                  selectedComponent.is('cell') || 
                  (selectedComponent.components && selectedComponent.components().length === 0)
                ) ? (
                  <div className="custom-trait-field">
                    <label htmlFor="custom-trait-text">Texto a editar</label>
                    <textarea
                      id="custom-trait-text"
                      value={selectedText}
                      onChange={handleTextChange}
                      rows={4}
                      className="form-control-custom"
                      placeholder="Escribe el texto aquí..."
                    />
                  </div>
                ) : (
                  <p className="custom-traits-info">Este elemento contiene otros bloques. Selecciona un texto interno para editar su contenido.</p>
                )}
                
                <div className="custom-trait-field">
                  <label htmlFor="custom-trait-id">ID del Elemento (Opcional)</label>
                  <input
                    id="custom-trait-id"
                    type="text"
                    value={selectedId}
                    onChange={handleIdChange}
                    className="form-control-custom"
                    placeholder="Ej: mi-id-unico"
                  />
                </div>
              </div>
            )}

            {!hasSelection && (
              <div className="gjs-side-panel__empty-state">
                <p>Selecciona un elemento en el documento para editar sus {activeTab === 'styles' ? 'estilos (colores, fuentes y tamaños)' : 'atributos (ID y configuraciones)'}.</p>
              </div>
            )}
          </section>
        </aside>
        <div className="gjs-editor-area">
          <div ref={hostRef} className="document-template-canvas" />
        </div>
      </div>
    )
  },
)

function configureEditorPanels(editor: Editor) {
  // Registrar comandos de manipulación de tablas
  editor.Commands.add('table-insert-row-above', {
    run(editorInstance) {
      const cell = editorInstance.getSelected()
      if (!cell || !cell.is('cell')) return
      const row = cell.parent()
      if (!row || !row.is('row')) return
      const tableBody = row.parent()
      if (!tableBody) return

      const rows = tableBody.components()
      const index = rows.indexOf(row)
      const cellCount = row.components().length

      const newRow = tableBody.append({
        type: 'row',
        components: Array.from({ length: cellCount }).map(() => ({
          type: 'cell',
          content: 'Texto...'
        }))
      }, { at: index })

      const rowComp = Array.isArray(newRow) ? newRow[0] : newRow
      if (rowComp && typeof rowComp.components === 'function') {
        const firstCell = rowComp.components().at(0)
        if (firstCell) {
          editorInstance.select(firstCell)
        }
      }
    }
  })

  editor.Commands.add('table-insert-row-below', {
    run(editorInstance) {
      const cell = editorInstance.getSelected()
      if (!cell || !cell.is('cell')) return
      const row = cell.parent()
      if (!row || !row.is('row')) return
      const tableBody = row.parent()
      if (!tableBody) return

      const rows = tableBody.components()
      const index = rows.indexOf(row)
      const cellCount = row.components().length

      const newRow = tableBody.append({
        type: 'row',
        components: Array.from({ length: cellCount }).map(() => ({
          type: 'cell',
          content: 'Texto...'
        }))
      }, { at: index + 1 })

      const rowComp = Array.isArray(newRow) ? newRow[0] : newRow
      if (rowComp && typeof rowComp.components === 'function') {
        const firstCell = rowComp.components().at(0)
        if (firstCell) {
          editorInstance.select(firstCell)
        }
      }
    }
  })

  editor.Commands.add('table-delete-row', {
    run(editorInstance) {
      const cell = editorInstance.getSelected()
      if (!cell || !cell.is('cell')) return
      const row = cell.parent()
      if (!row || !row.is('row')) return
      const tableBody = row.parent()
      if (!tableBody) return

      if (tableBody.components().length <= 1) return
      row.remove()
    }
  })

  editor.Commands.add('table-insert-column-left', {
    run(editorInstance) {
      const cell = editorInstance.getSelected()
      if (!cell || !cell.is('cell')) return
      const row = cell.parent()
      if (!row || !row.is('row')) return
      const tableBody = row.parent()
      if (!tableBody) return
      const tableComp = tableBody.parent()
      if (!tableComp) return

      const cellIndex = row.components().indexOf(cell)

      tableComp.find('row').forEach((r: any) => {
        r.append({
          type: 'cell',
          content: 'Texto...'
        }, { at: cellIndex })
      })
    }
  })

  editor.Commands.add('table-insert-column-right', {
    run(editorInstance) {
      const cell = editorInstance.getSelected()
      if (!cell || !cell.is('cell')) return
      const row = cell.parent()
      if (!row || !row.is('row')) return
      const tableBody = row.parent()
      if (!tableBody) return
      const tableComp = tableBody.parent()
      if (!tableComp) return

      const cellIndex = row.components().indexOf(cell)

      tableComp.find('row').forEach((r: any) => {
        r.append({
          type: 'cell',
          content: 'Texto...'
        }, { at: cellIndex + 1 })
      })
    }
  })

  editor.Commands.add('table-delete-column', {
    run(editorInstance) {
      const cell = editorInstance.getSelected()
      if (!cell || !cell.is('cell')) return
      const row = cell.parent()
      if (!row || !row.is('row')) return
      const tableBody = row.parent()
      if (!tableBody) return
      const tableComp = tableBody.parent()
      if (!tableComp) return

      const cellIndex = row.components().indexOf(cell)
      const rows = tableComp.find('row')

      if (row.components().length <= 1) return

      rows.forEach((r: any) => {
        const c = r.components().at(cellIndex)
        if (c) c.remove()
      })
    }
  })

  const stripAddToolbar = (component: Component) => {
    const toolbar = component.get('toolbar')
    if (!Array.isArray(toolbar) || toolbar.length === 0) return

    const filtered = toolbar.filter(item => {
      const key = `${String(item.command ?? '')}${String(item.id ?? '')}`.toLowerCase()
      return !key.includes('add') && !key.includes('insert') && !key.includes('open-blocks')
    })

    if (filtered.length !== toolbar.length) {
      (component as any).set({ toolbar: filtered })
    }
  }

  editor.on('component:selected', (component) => {
    stripAddToolbar(component)

    // Sincronizar el texto interno actual en el trait 'Texto'
    const el = component.getEl()
    if (el) {
      const trait = component.getTrait('content')
      if (trait) {
        trait.set('value', el.innerText || '')
      }
    }

    if (component.is('cell')) {
      const toolbar = component.get('toolbar') || []
      const hasCustom = toolbar.some(item => String(item.command).startsWith('table-'))
      
      if (!hasCustom) {
        (component as any).set({
          toolbar: [
            ...toolbar,
            {
              id: 'table-row-above',
              label: '+F↑',
              title: 'Insertar fila arriba',
              command: 'table-insert-row-above',
            },
            {
              id: 'table-row-below',
              label: '+F↓',
              title: 'Insertar fila abajo',
              command: 'table-insert-row-below',
            },
            {
              id: 'table-col-left',
              label: '+C←',
              title: 'Insertar columna a la izquierda',
              command: 'table-insert-column-left',
            },
            {
              id: 'table-col-right',
              label: '+C→',
              title: 'Insertar columna a la derecha',
              command: 'table-insert-column-right',
            },
            {
              id: 'table-row-del',
              label: '-F',
              title: 'Eliminar fila',
              command: 'table-delete-row',
            },
            {
              id: 'table-col-del',
              label: '-C',
              title: 'Eliminar columna',
              command: 'table-delete-column',
            }
          ]
        })
      }
    }
  })

  editor.on('load', () => {
    const panels = editor.Panels

    panels.getPanel('views')?.set('visible', false)

    const deactivate = (panelId: string, btnId: string) => {
      panels.getButton(panelId, btnId)?.set('active', false)
    }

    deactivate('views', 'open-blocks')
    deactivate('views', 'open-sm')
    deactivate('views', 'open-tm')
    deactivate('views', 'open-layers')

    editor.BlockManager.render()

    editor.BlockManager.getCategories().forEach((cat: { get: (k: string) => string; set: (k: string, v: string) => void }) => {
      if (cat.get('label') === 'Basic') cat.set('label', 'Básicos')
    })

    editor.BlockManager.getAll().forEach((block: { get: (k: string) => string; set: (k: string, v: string) => void }) => {
      const id = block.get('id')
      if (id === 'link-block') block.set('label', 'Bloque con enlace')
      if (id === 'quote') block.set('label', 'Cita')
      if (id === 'text-basic') block.set('label', 'Sección de texto')
    })

    // Registrar nuevos bloques ricos en español
    editor.BlockManager.add('text-h1', {
      label: 'Título H1',
      category: 'Básicos',
      content: '<h1 style="font-family: Inter, sans-serif; font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; line-height: 1.2;">Título Principal</h1>',
      attributes: { class: 'gjs-fonts gjs-f-h1' }
    })

    editor.BlockManager.add('text-h2', {
      label: 'Subtítulo H2',
      category: 'Básicos',
      content: '<h2 style="font-family: Inter, sans-serif; font-size: 20px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 10px; line-height: 1.3;">Subtítulo H2</h2>',
      attributes: { class: 'gjs-fonts gjs-f-h2' }
    })

    editor.BlockManager.add('text-p', {
      label: 'Párrafo',
      category: 'Básicos',
      content: '<p style="font-family: Inter, sans-serif; font-size: 14px; color: #475569; line-height: 1.5; margin-top: 0; margin-bottom: 10px;">Escribe tu texto descriptivo aquí...</p>',
      attributes: { class: 'gjs-fonts gjs-f-p' }
    })

    editor.BlockManager.add('table-custom', {
      label: 'Tabla Estructurada',
      category: 'Elementos',
      content: `
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-family: Inter, sans-serif; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; text-align: left; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;">Columna 1</th>
              <th style="padding: 10px; text-align: left; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;">Columna 2</th>
              <th style="padding: 10px; text-align: left; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;">Columna 3</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px; color: #334155; border: 1px solid #e2e8f0;">Celda A1</td>
              <td style="padding: 10px; color: #334155; border: 1px solid #e2e8f0;">Celda A2</td>
              <td style="padding: 10px; color: #334155; border: 1px solid #e2e8f0;">Celda A3</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px; color: #334155; border: 1px solid #e2e8f0;">Celda B1</td>
              <td style="padding: 10px; color: #334155; border: 1px solid #e2e8f0;">Celda B2</td>
              <td style="padding: 10px; color: #334155; border: 1px solid #e2e8f0;">Celda B3</td>
            </tr>
          </tbody>
        </table>
      `,
      attributes: { class: 'gjs-fonts gjs-f-b2' }
    })

    editor.BlockManager.add('divider', {
      label: 'Divisor',
      category: 'Básicos',
      content: '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />',
      attributes: { class: 'gjs-fonts gjs-f-hr' }
    })

    editor.BlockManager.add('layout-2-columns', {
      label: '2 Columnas',
      category: 'Elementos',
      content: `
        <div style="display: flex; gap: 20px; margin: 15px 0;">
          <div style="flex: 1; min-height: 60px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px;">
            <p style="font-family: Inter, sans-serif; font-size: 13px; color: #94a3b8; margin: 0; text-align: center;">Columna Izquierda (Arrastra bloques aquí)</p>
          </div>
          <div style="flex: 1; min-height: 60px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px;">
            <p style="font-family: Inter, sans-serif; font-size: 13px; color: #94a3b8; margin: 0; text-align: center;">Columna Derecha (Arrastra bloques aquí)</p>
          </div>
        </div>
      `,
      attributes: { class: 'gjs-fonts gjs-f-b2' }
    })

    editor.BlockManager.add('signature-block', {
      label: 'Bloque de Firmas',
      category: 'Elementos',
      content: `
        <div style="margin-top: 40px; display: flex; justify-content: space-around; font-family: Inter, sans-serif; font-size: 13px;">
          <div style="width: 220px; text-align: center;">
            <div style="border-bottom: 1px solid #cbd5e1; height: 60px; margin-bottom: 8px;"></div>
            <p style="margin: 0; font-weight: 600; color: #475569;">Firma de Conformidad</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Representante Legal</p>
          </div>
          <div style="width: 220px; text-align: center;">
            <div style="border-bottom: 1px solid #cbd5e1; height: 60px; margin-bottom: 8px;"></div>
            <p style="margin: 0; font-weight: 600; color: #475569;">Firma del Cliente</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Aceptado a Satisfacción</p>
          </div>
        </div>
      `,
      attributes: { class: 'gjs-fonts gjs-f-b2' }
    })

    // Asegurar que el Style Manager quede seleccionado
    editor.runCommand('open-sm')

    setTimeout(() => {
      deactivate('views', 'open-blocks')
      deactivate('views', 'open-sm')
    }, 0)
  })
}

function exportHtmlFromEditor(editor: Editor): string {
  return buildTemplateHtml(editor.getCss() ?? '', editor.getHtml() ?? '')
}



