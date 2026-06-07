import { useState, useEffect, useCallback } from 'react'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

export function useBuscarCliente() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(5) // Default to 5 to keep table compact in wizard
  const [incluirInactivos, setIncluirInactivos] = useState(false)

  const [resultados, setResultados] = useState<ClientePersonaNatural[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalElementos, setTotalElementos] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [triggerReload, setTriggerReload] = useState(0)

  const refrescar = useCallback(() => {
    setTriggerReload((prev) => prev + 1)
  }, [])

  // Reset to page 0 when search query or inclusion changes
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, incluirInactivos])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setCargando(true)
      setError(null)
      try {
        const response = await clienteService.listarClientes({
          search: searchQuery,
          page: currentPage,
          size: pageSize,
        })
        setResultados(response.content)
        setTotalElementos(response.totalElements)
        setTotalPages(response.totalPages)
      } catch (err) {
        console.error('Error al cargar clientes:', err)
        setError('Ocurrió un error al cargar la lista de clientes.')
        setResultados([])
        setTotalElementos(0)
        setTotalPages(1)
      } finally {
        setCargando(false)
      }
    }, 300) // Debounce of 300ms

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, currentPage, pageSize, incluirInactivos, triggerReload])

  return {
    query: searchQuery,
    setQuery: setSearchQuery,
    resultados,
    cargando,
    error,
    pagina: currentPage,
    setPagina: setCurrentPage,
    limite: pageSize,
    setLimite: setPageSize,
    totalElementos,
    totalPages,
    incluirInactivos,
    setIncluirInactivos,
    refrescar,
  }
}
