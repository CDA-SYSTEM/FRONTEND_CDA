import { useEffect } from 'react'
import { animate, stagger } from 'animejs'

import type { DashboardCard } from '../domain/dashboard.types'

import { useAuthStore } from '@/core/store/authStore'
import { Navigate } from 'react-router-dom'

const tarjetasDashboard: DashboardCard[] = [
  {
    titulo: 'Recepcion',
    descripcion: 'Registro de cliente, vehiculo y validaciones iniciales del proceso.',
    ruta: '/recepcion',
  },
  {
    titulo: 'Inspeccion NTC 5375',
    descripcion: 'Formulario base para iniciar lista de chequeo numerales 6 y 7.',
    ruta: '/inspeccion',
  },
  {
    titulo: 'Facturacion',
    descripcion: 'Espacio para cola de vehiculos listos para procesamiento de factura.',
    ruta: '/facturacion',
  },
]

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  if (user?.role === 'operario') {
    return <Navigate to="/recepcion" replace />
  }

  if (user?.role === 'inspector') {
    return <Navigate to="/inspeccion/asignacion" replace />
  }

  useEffect(() => {
    const animacion = animate('.dashboard-card', {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 700,
      delay: stagger(120, { grid: true, axis: 'y', from: 'last' }),
      ease: 'outCubic',
    })

    return () => {
      animacion.revert()
    }
  }, [])

  return (
    <div className="panel-grid">
      {tarjetasDashboard.map((tarjeta) => (
        <article
          key={tarjeta.titulo}
          className="panel dashboard-card"
          style={{ opacity: 0, transform: 'translateY(1.75rem)' }}
        >
          <h2>{tarjeta.titulo}</h2>
          <p>{tarjeta.descripcion}</p>
        </article>
      ))}
    </div>
  )
}
