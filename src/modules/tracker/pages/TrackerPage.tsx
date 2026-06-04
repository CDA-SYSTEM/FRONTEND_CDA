import { useState, useEffect, useMemo } from 'react'
import {
  User,
  Car,
  FileText,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Network,
  List,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react'
import { trackerService } from '@/modules/tracker/services/trackerService'
import type { TrackerDashboardData, TrackerCliente, TrackerVehiculo, TrackerPlanilla } from '@/modules/tracker/domain/tracker.types'

type NodeType = 'client' | 'vehicle' | 'planilla'

interface GraphNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  raw: any
}

interface GraphEdge {
  id: string
  source: string
  target: string
}

export function TrackerPage() {
  const [data, setData] = useState<TrackerDashboardData | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Vista activa: 'grafo' | 'listas'
  const [vista, setVista] = useState<'grafo' | 'listas'>('grafo')
  
  // Sub-pestaña para la vista de listas
  const [subTab, setSubTab] = useState<'clientes' | 'vehiculos' | 'planillas'>('clientes')
  
  // Búsqueda y Selección
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // Zoom/Pan básico para el SVG
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await trackerService.obtenerDashboard()
      setData(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al obtener datos del grafo')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // ── Generar Nodos y Enlaces ──────────────────────────────────────────────
  const { nodes, edges, height } = useMemo(() => {
    if (!data) return { nodes: [], edges: [], height: 500 }

    const generatedNodes: GraphNode[] = []
    const generatedEdges: GraphEdge[] = []

    const { clientes = [], vehiculos = [], planillas = [] } = data

    // Definir dimensiones de visualización
    const height = Math.max(500, Math.max(clientes.length, Math.max(vehiculos.length, planillas.length)) * 75)

    // Columna 0 (x = 100): Clientes
    const clientYStep = height / (clientes.length + 1)
    clientes.forEach((cli, idx) => {
      generatedNodes.push({
        id: `client-${cli.id}`,
        label: cli.nombres,
        type: 'client',
        x: 100,
        y: clientYStep * (idx + 1),
        raw: cli
      })
    })

    // Columna 1 (x = 425): Vehículos
    const vehicleYStep = height / (vehiculos.length + 1)
    vehiculos.forEach((veh, idx) => {
      generatedNodes.push({
        id: `vehicle-${veh.placa}`,
        label: veh.placa,
        type: 'vehicle',
        x: 425,
        y: vehicleYStep * (idx + 1),
        raw: veh
      })

      // Enlace: Cliente ➔ Vehículo
      if (veh.cliente_id) {
        generatedEdges.push({
          id: `edge-c-v-${veh.cliente_id}-${veh.placa}`,
          source: `client-${veh.cliente_id}`,
          target: `vehicle-${veh.placa}`
        })
      }
    })

    // Columna 2 (x = 750): Planillas
    const planillaYStep = height / (planillas.length + 1)
    planillas.forEach((plan, idx) => {
      generatedNodes.push({
        id: `planilla-${plan.id}`,
        label: plan.id.substring(0, 8).toUpperCase(),
        type: 'planilla',
        x: 750,
        y: planillaYStep * (idx + 1),
        raw: plan
      })

      // Enlace: Vehículo ➔ Planilla
      if (plan.vehiculo_placa) {
        generatedEdges.push({
          id: `edge-v-p-${plan.vehiculo_placa}-${plan.id}`,
          source: `vehicle-${plan.vehiculo_placa}`,
          target: `planilla-${plan.id}`
        })
      }
    })

    return { nodes: generatedNodes, edges: generatedEdges, height }
  }, [data])

  // ── Filtrado por Búsqueda ────────────────────────────────────────────────
  const highlightedNodeIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>()
    const q = searchTerm.toLowerCase().trim()
    const matchIds = new Set<string>()

    nodes.forEach(n => {
      let isMatch = false
      if (n.type === 'client') {
        const c = n.raw as TrackerCliente
        isMatch = c.nombres.toLowerCase().includes(q) || c.documento.includes(q) || String(c.id).includes(q)
      } else if (n.type === 'vehicle') {
        const v = n.raw as TrackerVehiculo
        isMatch = v.placa.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q)
      } else if (n.type === 'planilla') {
        const p = n.raw as TrackerPlanilla
        isMatch = p.id.toLowerCase().includes(q) || p.vehiculo_placa.toLowerCase().includes(q)
      }
      if (isMatch) matchIds.add(n.id)
    })

    return matchIds
  }, [nodes, searchTerm])

  // Determinar qué nodos y aristas están en la "ruta activa" (seleccionada o en hover)
  const activeSubgraph = useMemo(() => {
    const activeIds = new Set<string>()
    const activeEdgeIds = new Set<string>()
    
    const rootNode = selectedNode || nodes.find(n => n.id === hoveredNodeId)
    if (!rootNode) return { nodeIds: activeIds, edgeIds: activeEdgeIds }

    activeIds.add(rootNode.id)

    // Si es un cliente: resaltar el cliente, sus vehículos y las planillas de sus vehículos
    if (rootNode.type === 'client') {
      const client = rootNode.raw as TrackerCliente
      edges.forEach(e => {
        if (e.source === `client-${client.id}`) {
          activeEdgeIds.add(e.id)
          activeIds.add(e.target) // Vehículos del cliente
          
          // Buscar planillas de este vehículo
          edges.forEach(e2 => {
            if (e2.source === e.target) {
              activeEdgeIds.add(e2.id)
              activeIds.add(e2.target) // Planillas de los vehículos
            }
          })
        }
      })
    }

    // Si es un vehículo: resaltar el vehículo, su dueño (cliente) y sus planillas
    if (rootNode.type === 'vehicle') {
      const veh = rootNode.raw as TrackerVehiculo
      edges.forEach(e => {
        if (e.target === `vehicle-${veh.placa}`) {
          activeEdgeIds.add(e.id)
          activeIds.add(e.source) // Cliente dueño
        }
        if (e.source === `vehicle-${veh.placa}`) {
          activeEdgeIds.add(e.id)
          activeIds.add(e.target) // Planillas
        }
      })
    }

    // Si es una planilla: resaltar la planilla, el vehículo correspondiente y su cliente dueño
    if (rootNode.type === 'planilla') {
      const plan = rootNode.raw as TrackerPlanilla
      edges.forEach(e => {
        if (e.target === `planilla-${plan.id}`) {
          activeEdgeIds.add(e.id)
          activeIds.add(e.source) // Vehículo
          
          // Buscar cliente dueño de este vehículo
          edges.forEach(e2 => {
            if (e2.target === e.source) {
              activeEdgeIds.add(e2.id)
              activeIds.add(e2.source) // Cliente
            }
          })
        }
      })
    }

    return { nodeIds: activeIds, edgeIds: activeEdgeIds }
  }, [nodes, edges, selectedNode, hoveredNodeId])

  // Manejo de drag para navegar por el grafo
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.min(2, Math.max(0.5, prev * factor)))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNode(null)
    setSearchTerm('')
  }

  // Estilos rápidos
  const kpiCardStyle = {
    flex: '1 1 200px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  }

  const tagLabelStyle = (type: NodeType) => {
    const map = {
      client: { bg: '#e0f2fe', color: '#0369a1', label: 'Cliente' },
      vehicle: { bg: '#fef3c7', color: '#b45309', label: 'Vehículo' },
      planilla: { bg: '#dcfce7', color: '#15803d', label: 'Planilla' }
    }
    return map[type]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%' }}>
      {/* ── Cabecera de Página ── */}
      <div className="page-header-responsive">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Network size={24} style={{ color: '#155DFC' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
              Tracker — Trazabilidad Grafo CDA
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              Visualización y rastreo interactivo del grafo de clientes, vehículos e inspecciones
            </p>
          </div>
        </div>

        <div className="page-header-responsive-actions" style={{ display: 'flex', gap: 8 }}>
          {/* Alternar Vista */}
          <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: 3, borderRadius: 8 }}>
            <button
              onClick={() => setVista('grafo')}
              style={{
                background: vista === 'grafo' ? '#ffffff' : 'transparent',
                color: vista === 'grafo' ? '#1e293b' : '#64748b',
                boxShadow: vista === 'grafo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                minHeight: 'auto',
                padding: '6px 12px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <Network size={14} style={{ marginRight: 6 }} /> Grafo
            </button>
            <button
              onClick={() => setVista('listas')}
              style={{
                background: vista === 'listas' ? '#ffffff' : 'transparent',
                color: vista === 'listas' ? '#1e293b' : '#64748b',
                boxShadow: vista === 'listas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                minHeight: 'auto',
                padding: '6px 12px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <List size={14} style={{ marginRight: 6 }} /> Explorador
            </button>
          </div>

          <button
            onClick={cargarDatos}
            disabled={cargando}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              minHeight: 'auto',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={14} className={cargando ? 'spin' : ''} />
            Refrescar
          </button>
        </div>
      </div>

      {/* Loading State */}
      {cargando && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#155DFC' }} />
          <p style={{ color: '#64748b', margin: 0 }}>Cargando información del grafo...</p>
        </div>
      )}

      {/* Error State */}
      {!cargando && error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#991b1b' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Contenido Principal ── */}
      {!cargando && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* KPI Dashboard */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={kpiCardStyle}>
              <div style={{ background: '#e0f2fe', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} style={{ color: '#0284c7' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{data.stats?.total_clientes || 0}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Clientes en el Grafo</span>
              </div>
            </div>
            
            <div style={kpiCardStyle}>
              <div style={{ background: '#fef3c7', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={24} style={{ color: '#d97706' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{data.stats?.total_vehiculos || 0}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Vehículos Registrados</span>
              </div>
            </div>
            
            <div style={kpiCardStyle}>
              <div style={{ background: '#dcfce7', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{data.stats?.total_planillas || 0}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Planillas de Inspección</span>
              </div>
            </div>
          </div>

          {/* ── Vista 1: GRAFO DE RED INTERACTIVO ── */}
          {vista === 'grafo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Controles del lienzo y barra de búsqueda */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Buscar por placa, nombres de cliente o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
                
                {/* Controles de visualización */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleZoom(1.2)} style={{ padding: '6px 12px', minHeight: 'auto', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600 }}>+</button>
                  <button onClick={() => handleZoom(0.8)} style={{ padding: '6px 12px', minHeight: 'auto', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600 }}>-</button>
                  <button onClick={resetView} style={{ padding: '6px 12px', minHeight: 'auto', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>Restablecer Vista</button>
                </div>
              </div>

              {/* Panel principal del Grafo (Lienzo + Panel Lateral) */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }} className="panel-grid">
                
                {/* SVG Canvas Box */}
                <div 
                  style={{
                    gridColumn: isMobile ? 'span 1' : (selectedNode ? 'span 2' : 'span 3'),
                    background: '#fafafa',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    height: isMobile ? '450px' : '600px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <svg 
                    width="100%" 
                    height="100%"
                    viewBox={isMobile ? `0 0 850 ${height}` : undefined}
                    style={{ userSelect: 'none' }}
                  >
                    {/* Definición de gradientes y marcadores de flechas */}
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                      </marker>
                      <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#155DFC" />
                      </marker>
                    </defs>

                    {/* Grupo principal con zoom y pan aplicados */}
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                      
                      {/* Dibujar Enlaces (Aristas / Relaciones) */}
                      {edges.map(e => {
                        const sourceNode = nodes.find(n => n.id === e.source)
                        const targetNode = nodes.find(n => n.id === e.target)
                        if (!sourceNode || !targetNode) return null

                        const hasSelection = !!selectedNode || !!hoveredNodeId
                        const isActive = activeSubgraph.edgeIds.has(e.id)
                        
                        // Si hay alguna selección y esta arista no es parte del camino activo, atenuarla
                        const strokeColor = isActive ? '#155DFC' : '#cbd5e1'
                        const strokeWidth = isActive ? 2.5 : 1.5
                        const opacity = hasSelection && !isActive ? 0.15 : 0.8
                        const marker = isActive ? 'url(#arrow-active)' : 'url(#arrow)'

                        // Líneas curvadas hermosas (curva bezier cúbica suave)
                        const midX = (sourceNode.x + targetNode.x) / 2
                        const pathData = `M ${sourceNode.x} ${sourceNode.y} C ${midX} ${sourceNode.y}, ${midX} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`

                        return (
                          <path
                            key={e.id}
                            d={pathData}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            opacity={opacity}
                            markerEnd={marker}
                            style={{ transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s' }}
                          />
                        )
                      })}

                      {/* Dibujar Nodos */}
                      {nodes.map(n => {
                        const isSelected = selectedNode?.id === n.id
                        const isHovered = hoveredNodeId === n.id
                        const isSearchMatch = highlightedNodeIds.has(n.id)
                        
                        const hasSelection = !!selectedNode || !!hoveredNodeId
                        const isActive = activeSubgraph.nodeIds.has(n.id)
                        
                        let opacity = 1
                        if (hasSelection && !isActive) opacity = 0.25
                        if (searchTerm.trim() && !isSearchMatch) opacity = 0.2

                        // Colores según tipo
                        const colors = {
                          client: { border: '#0284c7', fill: '#e0f2fe', text: '#0369a1', icon: User },
                          vehicle: { border: '#d97706', fill: '#fef3c7', text: '#b45309', icon: Car },
                          planilla: { border: '#16a34a', fill: '#dcfce7', text: '#15803d', icon: FileText }
                        }[n.type]

                        const NodeIcon = colors.icon

                        return (
                          <g
                            key={n.id}
                            transform={`translate(${n.x}, ${n.y})`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedNode(isSelected ? null : n)
                            }}
                            onMouseEnter={() => setHoveredNodeId(n.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                            opacity={opacity}
                          >
                            {/* Anillo de Selección o Búsqueda */}
                            {(isSelected || isHovered || isSearchMatch) && (
                              <circle
                                r={24}
                                fill="none"
                                stroke={isSearchMatch ? '#ef4444' : '#155DFC'}
                                strokeWidth={2.5}
                                strokeDasharray={isSearchMatch ? '4 4' : 'none'}
                                style={{ animation: 'spin 8s linear infinite' }}
                              />
                            )}

                            {/* Círculo Principal del Nodo */}
                            <circle
                              r={18}
                              fill={colors.fill}
                              stroke={colors.border}
                              strokeWidth={2}
                              style={{ transition: 'r 0.2s' }}
                            />

                            {/* Icono central */}
                            <g transform="translate(-9, -9)">
                              <NodeIcon size={18} style={{ color: colors.border }} />
                            </g>

                            {/* Nombre / Placa */}
                            <text
                              y={32}
                              textAnchor="middle"
                              style={{
                                fill: '#1e293b',
                                fontSize: '0.8rem',
                                fontWeight: (isSelected || isSearchMatch) ? 700 : 500,
                                userSelect: 'none',
                                textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                              }}
                            >
                              {n.label}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                  </svg>
                  
                  {/* Flotante: Indicadores de Columnas del Grafo */}
                  <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 16, background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> Clientes</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Car size={12} /> Vehículos</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12} /> Planillas</span>
                  </div>
                </div>

                {/* Panel de Detalles Lateral (si hay nodo seleccionado) */}
                {selectedNode && (
                  <div 
                    style={{
                      gridColumn: 'span 1',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 16,
                      padding: '1.25rem',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      animation: 'modalFadeIn 0.2s ease-out'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: tagLabelStyle(selectedNode.type)?.bg,
                        color: tagLabelStyle(selectedNode.type)?.color
                      }}>
                        {tagLabelStyle(selectedNode.type)?.label}
                      </span>
                      <button 
                        onClick={() => setSelectedNode(null)} 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          minHeight: 'auto',
                          padding: 4
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Contenido Detalle - CLIENTE */}
                    {selectedNode.type === 'client' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                          {(selectedNode.raw as TrackerCliente).nombres}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>ID Cliente:</span>
                            <span style={{ color: '#334155', fontWeight: 600 }}>{(selectedNode.raw as TrackerCliente).id}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Identificación:</span>
                            <span style={{ color: '#334155', fontWeight: 600 }}>{(selectedNode.raw as TrackerCliente).documento}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Total Vehículos:</span>
                            <span style={{ color: '#334155', fontWeight: 600 }}>{(selectedNode.raw as TrackerCliente).total_vehiculos ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contenido Detalle - VEHICULO */}
                    {selectedNode.type === 'vehicle' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {(selectedNode.raw as TrackerVehiculo).placa}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Marca:</span>
                            <span style={{ color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>{(selectedNode.raw as TrackerVehiculo).marca}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Asociado a Cliente ID:</span>
                            <span style={{ color: '#334155', fontWeight: 600 }}>{(selectedNode.raw as TrackerVehiculo).cliente_id}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contenido Detalle - PLANILLA */}
                    {selectedNode.type === 'planilla' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                          Planilla ID:
                        </h3>
                        <code style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', overflowWrap: 'anywhere' }}>
                          {(selectedNode.raw as TrackerPlanilla).id}
                        </code>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', marginTop: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Vehículo Placa:</span>
                            <span style={{ color: '#334155', fontWeight: 600, textTransform: 'uppercase' }}>{(selectedNode.raw as TrackerPlanilla).vehiculo_placa}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instrucciones de ayuda rápidas */}
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <Info size={16} style={{ color: '#155DFC', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3 }}>
                        Los nodos resaltados en el mapa representan las relaciones directas conectadas a este elemento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Vista 2: TABLAS DEL EXPLORADOR ── */}
          {vista === 'listas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#ffffff', padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              {/* Pestañas de tablas */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 12, paddingBottom: '0.25rem' }}>
                <button
                  onClick={() => setSubTab('clientes')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: subTab === 'clientes' ? '3px solid #155DFC' : '3px solid transparent',
                    color: subTab === 'clientes' ? '#155DFC' : '#64748b',
                    padding: '8px 16px',
                    borderRadius: 0,
                    minHeight: 'auto',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: 'none'
                  }}
                >
                  Clientes ({data.clientes?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('vehiculos')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: subTab === 'vehiculos' ? '3px solid #155DFC' : '3px solid transparent',
                    color: subTab === 'vehiculos' ? '#155DFC' : '#64748b',
                    padding: '8px 16px',
                    borderRadius: 0,
                    minHeight: 'auto',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: 'none'
                  }}
                >
                  Vehículos ({data.vehiculos?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('planillas')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: subTab === 'planillas' ? '3px solid #155DFC' : '3px solid transparent',
                    color: subTab === 'planillas' ? '#155DFC' : '#64748b',
                    padding: '8px 16px',
                    borderRadius: 0,
                    minHeight: 'auto',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: 'none'
                  }}
                >
                  Planillas ({data.planillas?.length || 0})
                </button>
              </div>

              {/* Tabla Clientes */}
              {subTab === 'clientes' && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombres</th>
                        <th>Identificación (Documento)</th>
                        <th>Cantidad de Vehículos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clientes.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.id}</td>
                          <td>{c.nombres}</td>
                          <td>{c.documento}</td>
                          <td>{c.total_vehiculos ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabla Vehículos */}
              {subTab === 'vehiculos' && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Placa</th>
                        <th>Marca</th>
                        <th>ID Cliente Propietario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.vehiculos.map(v => (
                        <tr key={v.placa}>
                          <td style={{ fontWeight: 700, textTransform: 'uppercase', color: '#0f172a' }}>{v.placa}</td>
                          <td style={{ textTransform: 'capitalize' }}>{v.marca || '—'}</td>
                          <td>{v.cliente_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabla Planillas */}
              {subTab === 'planillas' && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Planilla ID</th>
                        <th>Placa del Vehículo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.planillas.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.id}</td>
                          <td style={{ fontWeight: 700, textTransform: 'uppercase' }}>{p.vehiculo_placa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Sección de Estadísticas y Analítica ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            
            {/* Gráfico de Distribución por Marca */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart2 size={20} style={{ color: '#155DFC' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Distribución por Marca</h3>
              </div>
              {data.stats?.vehiculos_por_marca?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.stats.vehiculos_por_marca.map(item => {
                    const pct = Math.round((item.total / (data.stats?.total_vehiculos || 1)) * 100)
                    return (
                      <div key={item.marca} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                          <span style={{ textTransform: 'capitalize', color: '#334155' }}>{item.marca}</span>
                          <span style={{ color: '#64748b' }}>{item.total} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #155dfc 0%, #3b82f6 100%)', borderRadius: 4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>Sin datos de marcas disponibles.</p>
              )}
            </div>

            {/* Línea de tiempo de Planillas */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TrendingUp size={20} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Cronología de Planillas</h3>
              </div>
              {data.stats?.planillas_por_fecha?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.stats.planillas_por_fecha.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                      <Calendar size={16} style={{ color: '#64748b' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                          {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha no especificada'}
                        </span>
                      </div>
                      <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {item.total} {item.total === 1 ? 'planilla' : 'planillas'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>Sin datos cronológicos disponibles.</p>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  )
}
