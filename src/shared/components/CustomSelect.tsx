import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción...',
  style
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Botón Disparador */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          padding: '0.7rem 0.85rem',
          minHeight: '44px',
          color: selectedOption ? '#0f172a' : '#64748b',
          fontSize: '0.9rem',
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: 'none',
          marginTop: '0.35rem',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#155dfc'
          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 93, 252, 0.12)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: '8px',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Lista Desplegable (Dropdown) */}
      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
            padding: '4px',
            margin: '4px 0 0 0',
            listStyle: 'none',
            maxHeight: '240px',
            overflowY: 'auto',
            animation: 'modalFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'linear-gradient(135deg, #155dfc 0%, #0f47d6 100%)' : 'transparent',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '38px',
                    boxShadow: 'none',
                    display: 'block',
                    transition: 'background 0.15s, color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f1f5f9'
                      e.currentTarget.style.color = '#0f172a'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#334155'
                    }
                  }}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
