import { useState, useEffect, useCallback } from 'react'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

export function useBuscarCliente() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ClientePersonaNatural[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce simple
  useEffect(() => {
    if (query.trim().length < 3) {
      setResultados([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setCargando(true)
      setError(null)
      try {
        const res = await clienteService.buscarClientes(query)
        setResultados(res)
      } catch (err) {
        console.error('Error buscando clientes:', err)
        setError('Ocurrió un error al buscar clientes.')
        setResultados([])
      } finally {
        setCargando(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const refrescar = useCallback(async () => {
    if (query.trim().length < 3) return
    setCargando(true)
    try {
      const res = await clienteService.buscarClientes(query)
      setResultados(res)
    } catch (err) {
      console.error('Error refrescando clientes:', err)
    } finally {
      setCargando(false)
    }
  }, [query])

  return {
    query,
    setQuery,
    resultados,
    cargando,
    error,
    refrescar,
  }
}
