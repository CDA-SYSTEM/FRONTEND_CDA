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
  disabled?: boolean
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción...',
  style,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: disabled ? '#f1f5f9' : '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.7rem 0.85rem',
          minHeight: '44px',
          color: disabled ? '#94a3b8' : (value && String(value) !== '0' && String(value) !== '' ? '#0f172a' : '#ef4444'),
          fontSize: '0.9rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          boxShadow: 'none',
          marginTop: '0.35rem',
          transition: 'background 0.22s, border-color 0.22s, box-shadow 0.22s',
          opacity: disabled ? 0.7 : 1,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#ffffff'
            e.currentTarget.style.borderColor = '#155dfc'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21, 93, 252, 0.12)'
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = '#f8fafc'
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span style={{ color: 'inherit' }}>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: disabled ? '#cbd5e1' : '#64748b',
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
                  className="custom-select-option"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100% !important',
                    padding: '8px 12px !important',
                    borderRadius: '8px !important',
                    border: 'none !important',
                    background: isSelected ? 'linear-gradient(135deg, #155dfc 0%, #0f47d6 100%) !important' : 'transparent !important',
                    color: isSelected ? '#ffffff !important' : '#334155 !important',
                    fontSize: '0.9rem !important',
                    textAlign: 'left !important',
                    cursor: 'pointer !important',
                    minHeight: '38px !important',
                    boxShadow: 'none !important',
                    display: 'block !important',
                    transition: 'background 0.15s, color 0.15s !important'
                  } as any}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.setProperty('background', '#f1f5f9', 'important')
                      e.currentTarget.style.setProperty('color', '#0f172a', 'important')
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.setProperty('background', 'transparent', 'important')
                      e.currentTarget.style.setProperty('color', '#334155', 'important')
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
