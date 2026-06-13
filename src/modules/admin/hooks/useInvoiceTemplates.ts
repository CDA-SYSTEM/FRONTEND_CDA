import { useState, useEffect, useCallback, useRef } from 'react'
import { invoiceTemplateService } from '../services/invoiceTemplateService'
import type { InvoiceTemplate, TemplateVariable, TemplateType } from '../domain/invoiceTemplate.types'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export function useInvoiceTemplates() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [types, setTypes] = useState<TemplateType[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceTemplate | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tList, vList, tyList] = await Promise.all([
        invoiceTemplateService.listar(),
        invoiceTemplateService.listarVariables(),
        invoiceTemplateService.listarTipos()
      ])
      setTemplates(tList)
      setVariables(vList)
      setTypes(tyList)
    } catch {
      showToast('Error al cargar plantillas', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    return () => clearTimeout(toastTimer.current)
  }, [])

  const handleActivate = useCallback(async (id: string) => {
    try {
      await invoiceTemplateService.activar(id)
      showToast('Plantilla activada correctamente', 'success')
      fetchData()
    } catch {
      showToast('Error al activar plantilla', 'error')
    }
  }, [showToast, fetchData])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await invoiceTemplateService.eliminar(deleteTarget.id)
      showToast('Plantilla eliminada', 'success')
      setDeleteTarget(null)
      fetchData()
    } catch {
      showToast('Error al eliminar plantilla', 'error')
    }
  }, [deleteTarget, showToast, fetchData])

  return {
    templates,
    variables,
    types,
    loading,
    toast,
    deleteTarget,
    setDeleteTarget,
    handleActivate,
    handleDelete,
    fetchData,
    showToast,
  }
}
