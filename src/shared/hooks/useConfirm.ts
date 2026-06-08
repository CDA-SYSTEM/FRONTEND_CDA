import { useCallback, useEffect, useRef, useState } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const closeConfirm = useCallback((value: boolean) => {
    const resolve = resolveRef.current
    resolveRef.current = null
    setIsOpen(false)
    setOptions(null)
    resolve?.(value)
  }, [])

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions)
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(() => {
    closeConfirm(true)
  }, [closeConfirm])

  const handleCancel = useCallback(() => {
    closeConfirm(false)
  }, [closeConfirm])

  useEffect(() => {
    return () => {
      resolveRef.current?.(false)
      resolveRef.current = null
    }
  }, [])

  return { confirm, isOpen, options, handleConfirm, handleCancel }
}