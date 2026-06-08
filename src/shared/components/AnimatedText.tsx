import { useEffect, useRef } from 'react'
import { animate, stagger, set } from 'animejs'

interface AnimatedTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
  variant?: 'soft-blur-in' | 'per-character-rise' | 'micro-scale-fade'
}

export function AnimatedText({ 
  text, 
  className = '', 
  style = {}, 
  variant = 'soft-blur-in' 
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Obtener los caracteres
    const spans = el.querySelectorAll('.char')
    if (spans.length === 0) return

    // Reiniciar estados iniciales
    if (variant === 'soft-blur-in') {
      set(spans, {
        opacity: 0,
        translateY: 16,
        filter: 'blur(12px)'
      })

      animate(spans, {
        opacity: [0, 1],
        translateY: [16, 0],
        filter: ['blur(12px)', 'blur(0px)'],
        delay: stagger(25),
        duration: 900,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      })
    } else if (variant === 'per-character-rise') {
      set(spans, {
        opacity: 0,
        translateY: 24
      })

      animate(spans, {
        opacity: [0, 1],
        translateY: [24, 0],
        delay: stagger(20),
        duration: 800,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      })
    } else if (variant === 'micro-scale-fade') {
      set(el, {
        opacity: 0,
        scale: 0.98
      })

      animate(el, {
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 500,
        easing: 'easeOutQuad'
      })
    }
  }, [text, variant])

  if (variant === 'micro-scale-fade') {
    return (
      <span ref={containerRef} className={className} style={{ display: 'inline-block', ...style }}>
        {text}
      </span>
    )
  }

  // Dividir por caracteres, manteniendo espacios intactos
  const characters = text.split('')

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ 
        display: 'inline-flex', 
        flexWrap: 'wrap', 
        overflow: 'hidden',
        ...style 
      }}
    >
      {characters.map((char, index) => (
        <span
          key={index}
          className="char"
          style={{
            display: 'inline-block',
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            filter: 'blur(0px)' // para evitar parpadeos iniciales
          }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}
