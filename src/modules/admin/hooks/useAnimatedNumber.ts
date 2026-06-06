import { useState, useEffect, useRef } from 'react'

export function useAnimatedNumber(target: number | string, duration = 700): string {
  const targetNum = typeof target === 'string' ? (Number(target.replace(/[^0-9.-]+/g, '')) || 0) : target
  const prefix = typeof target === 'string' && target.startsWith('$') ? '$' : ''
  const [display, setDisplay] = useState(0)
  const prevTarget = useRef(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = prevTarget.current
    const diff = targetNum - start
    if (Math.abs(diff) < 1) {
      setDisplay(targetNum)
      prevTarget.current = targetNum
      return
    }
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) raf.current = requestAnimationFrame(step)
      else prevTarget.current = targetNum
    }

    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [targetNum, duration])

  if (target === '—') return '—'
  const formatted = display.toLocaleString('es-CO')
  return prefix + formatted
}
