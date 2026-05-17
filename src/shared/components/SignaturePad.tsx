import { useRef, useEffect, useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  onSave: (blob: Blob | null) => void
  height?: number
}

export function SignaturePad({ onSave, height = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dibujando, setDibujando] = useState(false)
  const [tieneFirma, setTieneFirma] = useState(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const empezar = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDibujando(true)
  }

  const mover = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!dibujando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    setTieneFirma(true)
  }

  const terminar = () => {
    setDibujando(false)
  }

  const limpiar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTieneFirma(false)
    onSave(null)
  }

  const guardarFirma = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !tieneFirma) {
      onSave(null)
      return
    }
    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/png')
  }, [tieneFirma, onSave])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#fafafa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [height])

  useEffect(() => {
    return () => {
      guardarFirma()
    }
  }, [guardarFirma])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
          Firma digital
        </span>
        {tieneFirma && (
          <button
            type="button"
            onClick={limpiar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: '0.78rem',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
            Borrar
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height,
          border: '2px dashed #d1d5db',
          borderRadius: 8,
          cursor: 'crosshair',
          touchAction: 'none',
        }}
        onMouseDown={empezar}
        onMouseMove={mover}
        onMouseUp={terminar}
        onMouseLeave={terminar}
        onTouchStart={empezar}
        onTouchMove={mover}
        onTouchEnd={terminar}
      />
      {!tieneFirma && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
          Firme sobre esta área con el mouse o con el dedo (en dispositivos táctiles)
        </p>
      )}
    </div>
  )
}
