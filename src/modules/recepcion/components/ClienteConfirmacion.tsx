import { CheckCircle2 } from 'lucide-react'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

interface Props {
  cliente: ClientePersonaNatural
  onNuevoRegistro: () => void
}

/**
 * Confirmación visual tras registrar exitosamente un cliente.
 * Criterio de aceptación HU-005: "Se muestra confirmación visual al guardar".
 */
export function ClienteConfirmacion({ cliente, onNuevoRegistro }: Props) {
  return (
    <div
      className="panel"
      style={{ textAlign: 'center', padding: '32px 24px' }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#dcfce7',
          color: '#16a34a',
          marginBottom: 16,
        }}
      >
        <CheckCircle2 size={36} strokeWidth={2} />
      </div>

      <h2 style={{ margin: '0 0 4px', color: '#15803d' }}>
        Cliente registrado exitosamente
      </h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        El cliente ha sido guardado en el sistema.
      </p>

      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px 24px',
        }}
      >
        <Detail
          label="Nombre"
          value={`${cliente.nombre} ${cliente.apellido}`}
        />
        <Detail label="Documento" value={cliente.identity} />
        <Detail label="Celular" value={cliente.celular} />
        {cliente.email && <Detail label="Correo" value={cliente.email} />}
        {cliente.direccion && (
          <Detail label="Dirección" value={cliente.direccion} />
        )}
        {cliente.birthDate && (
          <Detail label="Fecha de nac." value={cliente.birthDate} />
        )}
      </div>

      <button
        onClick={onNuevoRegistro}
        style={{
          padding: '10px 28px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.95rem',
        }}
      >
        Registrar otro cliente
      </button>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          fontSize: '0.72rem',
          color: '#9ca3af',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#111827' }}>
        {value}
      </p>
    </div>
  )
}
