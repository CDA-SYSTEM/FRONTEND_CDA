import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Factura } from '@/modules/facturacion/domain/factura.types'

export interface InspectionStatusUpdate {
  id: string
  inspection_number: string
  statusId: string
  statusName?: string
}

const PAGADO_STATUS_ID = '6a1ad9c04d644ab738782e4c'

export function useInvoiceSocket() {
  const [latestInvoice, setLatestInvoice] = useState<Factura | null>(null)
  const [inspectionUpdate, setInspectionUpdate] = useState<InspectionStatusUpdate | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const wsUrl = baseUrl.replace(/\/api\/?$/, '')
    const apiKey = import.meta.env.VITE_API_KEY_FRONT as string | undefined

    socketRef.current = io(`${wsUrl}/events`, {
      transports: ['websocket', 'polling'],
      auth: apiKey ? { 'x-api-key': apiKey } : undefined,
    })

    socketRef.current.on('connect', () => {
      console.log('[Socket] Conectado al gateway')
    })

    socketRef.current.on('invoice.created', (data: Factura) => {
      setLatestInvoice({ ...data })
    })

    socketRef.current.on('inspection.status.updated', (data: InspectionStatusUpdate) => {
      setInspectionUpdate({ ...data })
    })

    socketRef.current.on('connect_error', (err) => {
      console.warn('[Socket] Error de conexión:', err.message)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [])

  return { latestInvoice, inspectionUpdate }
}
