import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type TipoToast = 'exito' | 'error'

interface Props {
  tipo: TipoToast
  mensaje: string
  onCerrar: () => void
  duracion?: number
}

export function Toast({ tipo, mensaje, onCerrar, duracion = 4000 }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const anim = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onCerrar, 300)
    }, duracion)
    return () => {
      cancelAnimationFrame(anim)
      clearTimeout(timer)
    }
  }, [duracion, onCerrar])

  const color = tipo === 'exito' ? '#16a34a' : '#dc2626'
  const bg = tipo === 'exito' ? '#f0fdf4' : '#fef2f2'
  const borde = tipo === 'exito' ? '#bbf7d0' : '#fecaca'
  const Icono = tipo === 'exito' ? CheckCircle : XCircle

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 10,
        background: bg,
        border: `1px solid ${borde}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        transition: 'all 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        maxWidth: 400,
      }}
    >
      <Icono size={20} color={color} />
      <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>
        {mensaje}
      </span>
      <button
        onClick={() => { setVisible(false); setTimeout(onCerrar, 300) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
