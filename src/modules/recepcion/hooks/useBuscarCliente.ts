import { useState, useEffect, useCallback } from 'react'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import type { ClientePersonaNatural } from '@/modules/recepcion/domain/recepcion.types'

export function useBuscarCliente() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ClientePersonaNatural[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [incluirInactivos, setIncluirInactivos] = useState(false)

  // Pagination states
  const [pagina, setPagina] = useState(0)
  const [limite, setLimite] = useState(10)
  const [totalElementos, setTotalElementos] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const cargarClientes = useCallback(async (q: string, p: number, s: number, incInactivos: boolean) => {
    setCargando(true)
    setError(null)
    try {
      let res
      if (incInactivos) {
        // Al buscar inactivos o todos usando el listado completo
        // Filtramos manualmente o usamos el servicio
        const allClients = await clienteService.obtenerTodosLosClientes()
        const qClean = q.trim().toLowerCase()
        const filtered = allClients.filter(c => {
          if (!qClean) return true
          return (
            c.nombre.toLowerCase().includes(qClean) ||
            c.apellido.toLowerCase().includes(qClean) ||
            c.identity.toLowerCase().includes(qClean)
          )
        })
        const total = filtered.length
        const content = filtered.slice(p * s, (p + 1) * s)
        res = {
          content,
          totalElements: total,
          totalPages: Math.ceil(total / s) || 1
        }
      } else {
        res = await clienteService.listarClientes({
          search: q,
          page: p,
          size: s,
        })
      }
      setResultados(res.content)
      setTotalElementos(res.totalElements)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setError('Ocurrió un error al cargar la lista de clientes.')
      setResultados([])
      setTotalElementos(0)
      setTotalPages(1)
    } finally {
      setCargando(false)
    }
  }, [])

  // Refrescar
  const refrescar = useCallback(async () => {
    await cargarClientes(query, pagina, limite, incluirInactivos)
  }, [query, pagina, limite, incluirInactivos, cargarClientes])

  // Debounce para query, y disparar al cambiar pagina/limite
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      cargarClientes(query, pagina, limite, incluirInactivos)
    }, query.trim() ? 500 : 0) // Debounce only when searching

    return () => clearTimeout(delayDebounceFn)
  }, [query, pagina, limite, incluirInactivos, cargarClientes])

  // Reset a página 0 cuando cambie la query o inclusión
  useEffect(() => {
    setPagina(0)
  }, [query, incluirInactivos])

  return {
    query,
    setQuery,
    resultados,
    cargando,
    error,
    refrescar,
    pagina,
    setPagina,
    limite,
    setLimite,
    totalElementos,
    totalPages,
    incluirInactivos,
    setIncluirInactivos,
  }
}
