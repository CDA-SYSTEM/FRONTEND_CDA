import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  /** Mensaje descriptivo de la acción a confirmar */
  mensaje: string
  /** Texto del botón de confirmación (default: "Confirmar") */
  labelConfirmar?: string
  /** Callback al aceptar */
  onAceptar: () => void
  /** Callback al cancelar o cerrar */
  onCancelar: () => void
}

/**
 * Modal de confirmación reutilizable.
 * Reemplaza window.confirm() con un diálogo estilizado.
 *
 * Uso:
 *   const [confirm, setConfirm] = useState<{ mensaje: string; onAceptar: () => void } | null>(null)
 *
 *   // Para abrir:
 *   setConfirm({ mensaje: '¿Seguro?', onAceptar: () => { ... } })
 *
 *   // En el JSX:
 *   {confirm && <ConfirmModal mensaje={confirm.mensaje} onAceptar={confirm.onAceptar} onCancelar={() => setConfirm(null)} />}
 */
export function ConfirmModal({
  mensaje,
  labelConfirmar = 'Confirmar',
  onAceptar,
  onCancelar,
}: ConfirmModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onCancelar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '32px 28px 24px',
          maxWidth: 400, width: '100%',
          boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
          display: 'grid', gap: 20,
          textAlign: 'center',
        }}
      >
        {/* Icono */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#fef3c7',
          margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={26} color="#d97706" strokeWidth={2.5} />
        </div>

        {/* Texto */}
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
            ¿Estás seguro?
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
            {mensaje}
          </p>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancelar}
            style={{
              flex: 1, padding: '10px 20px',
              background: '#f1f5f9', color: '#475569',
              border: '1px solid #e2e8f0', borderRadius: 10,
              fontWeight: 600, fontSize: '0.92rem',
              cursor: 'pointer', boxShadow: 'none',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onAceptar}
            style={{
              flex: 1, padding: '10px 20px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
            }}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
