import { useToastStore, ToastItem } from '@/core/store/toastStore'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import './Toast.css'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="toast-container" id="global-toast-container">
      {toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: ToastItem
  onClose: () => void
}) {
  const { message, type } = toast

  const iconMap = {
    success: <CheckCircle className="toast-icon toast-icon--success" size={20} />,
    error: <XCircle className="toast-icon toast-icon--error" size={20} />,
    warning: (
      <AlertTriangle className="toast-icon toast-icon--warning" size={20} />
    ),
    info: <Info className="toast-icon toast-icon--info" size={20} />,
  }

  return (
    <div className={`toast-item toast-item--${type}`} role="alert" id={`toast-item-${toast.id}`}>
      {iconMap[type]}
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close-btn"
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  )
}
