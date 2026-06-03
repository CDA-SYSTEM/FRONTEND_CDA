import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Factura } from '@/modules/facturacion/domain/factura.types'

export function useInvoiceSocket() {
  const [latestInvoice, setLatestInvoice] = useState<Factura | null>(null)
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
      console.log('[InvoiceSocket] Conectado al gateway')
    })

    socketRef.current.on('invoice.created', (data: Factura) => {
      console.log('[InvoiceSocket] invoice.created recibido:', data.invoice_number)
      setLatestInvoice(data)
    })

    socketRef.current.on('connect_error', (err) => {
      console.warn('[InvoiceSocket] Error de conexión:', err.message)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [])

  return latestInvoice
}
