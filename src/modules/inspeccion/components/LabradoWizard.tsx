import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft, Car, CheckCircle, ChevronRight, Loader2, Truck, Wrench } from 'lucide-react'
import type { AxleMeasurement, TireMeasurement, WheelMeasurement } from '@/modules/inspeccion/domain/checklist.types'

/* ── Tipos ── */

type VehicleConfig = 'LIVIANO' | 'PESADO_2' | 'PESADO_3' | 'PESADO_4' | 'PESADO_5'
type WizardMode = 'select' | 'edit' | 'view'
type TireNumericKey = 'outer_mm' | 'middle_mm' | 'inner_mm'
type ValidationLevel = 'normal' | 'green' | 'red' | 'intense-red'

interface TireSlot {
  id: string
  label: string
  side: 'left' | 'right'
}

interface AxleSlot {
  id: string
  label: string
  type: 'single' | 'dual' | 'spare'
  tireSlots: TireSlot[]
}

interface LabradoWizardProps {
  axles: AxleMeasurement[]
  onChange: (axles: AxleMeasurement[]) => void
  onSave?: () => Promise<void>
  saving?: boolean
}

/* ── Constantes ── */

const TIRE_FIELDS: { key: TireNumericKey; label: string; abbr: string }[] = [
  { key: 'outer_mm', label: 'Exterior', abbr: 'Ext' },
  { key: 'middle_mm', label: 'Centro', abbr: 'Cen' },
  { key: 'inner_mm', label: 'Interior', abbr: 'Int' },
]

const TIRE_KEYS: TireNumericKey[] = ['outer_mm', 'middle_mm', 'inner_mm']

const VEHICLE_OPTIONS: { id: VehicleConfig; label: string; desc: string }[] = [
  { id: 'LIVIANO', label: 'Liviano', desc: '4 llantas + 1 repuesto' },
  { id: 'PESADO_2', label: 'Pesado 2 ejes', desc: '2 delanteras + 4 traseras dual + 2 repuesto' },
  { id: 'PESADO_3', label: 'Pesado 3 ejes', desc: '2 delanteras + 8 traseras dual + 2 repuesto' },
  { id: 'PESADO_4', label: 'Pesado 4 ejes', desc: '2 delanteras + 12 traseras dual + 2 repuesto' },
  { id: 'PESADO_5', label: 'Pesado 5 ejes', desc: '2 delanteras + 16 traseras dual + 2 repuesto' },
]

/* ── Helpers ── */

function getMinLegal(type: VehicleConfig): number {
  return type === 'LIVIANO' ? 1.6 : 2.0
}

function crearTire(id: string): TireMeasurement {
  return { tire_code: id, outer_mm: 0, middle_mm: 0, inner_mm: 0 }
}

function crearWheel(id: string): WheelMeasurement {
  return { wheel_code: id, tires: [crearTire(`${id}-LL1`)] }
}

function crearAxle(slot: AxleSlot): AxleMeasurement {
  return { axle_code: slot.id, wheels: slot.tireSlots.map((ts) => crearWheel(ts.id)) }
}

function buildPesadoLayout(num: number): AxleSlot[] {
  const axles: AxleSlot[] = [
    { id: 'EJE01', label: 'EJE 1: DELANTERO', type: 'single', tireSlots: [
      { id: 'DEL-IZQ', label: 'DELANTERA IZQUIERDA', side: 'left' },
      { id: 'DEL-DER', label: 'DELANTERA DERECHA', side: 'right' },
    ]},
  ]
  for (let i = 2; i <= num; i++) {
    const p = String(i).padStart(2, '0')
    axles.push({
      id: `EJE${p}`, label: `EJE ${i}: TRASERO DUAL`, type: 'dual',
      tireSlots: [
        { id: `TR${p}-IZQ-EXT`, label: 'TRASERA IZQUIERDA EXTERNA', side: 'left' },
        { id: `TR${p}-IZQ-INT`, label: 'TRASERA IZQUIERDA INTERNA', side: 'left' },
        { id: `TR${p}-DER-INT`, label: 'TRASERA DERECHA INTERNA', side: 'right' },
        { id: `TR${p}-DER-EXT`, label: 'TRASERA DERECHA EXTERNA', side: 'right' },
      ],
    })
  }
  axles.push({
    id: 'REPUESTO', label: 'LLANTAS DE REPUESTO', type: 'spare',
    tireSlots: [
      { id: 'REP-01', label: 'REPUESTO 1', side: 'left' },
      { id: 'REP-02', label: 'REPUESTO 2', side: 'right' },
    ],
  })
  return axles
}

const LAYOUTS: Record<VehicleConfig, AxleSlot[]> = {
  LIVIANO: [
    { id: 'EJE01', label: 'EJE 1: DELANTERO', type: 'single', tireSlots: [
      { id: 'DEL-IZQ', label: 'DELANTERA IZQUIERDA', side: 'left' },
      { id: 'DEL-DER', label: 'DELANTERA DERECHA', side: 'right' },
    ]},
    { id: 'EJE02', label: 'EJE 2: TRASERO', type: 'single', tireSlots: [
      { id: 'TRAS-IZQ', label: 'TRASERA IZQUIERDA', side: 'left' },
      { id: 'TRAS-DER', label: 'TRASERA DERECHA', side: 'right' },
    ]},
    { id: 'REPUESTO', label: 'LLANTA DE REPUESTO', type: 'spare', tireSlots: [
      { id: 'REP-01', label: 'REPUESTO', side: 'left' },
    ]},
  ],
  PESADO_2: buildPesadoLayout(2),
  PESADO_3: buildPesadoLayout(3),
  PESADO_4: buildPesadoLayout(4),
  PESADO_5: buildPesadoLayout(5),
}

function getLayout(type: VehicleConfig): AxleSlot[] { return LAYOUTS[type] }

function inferirConfig(axles: AxleMeasurement[]): VehicleConfig | null {
  if (!axles?.length) return null
  const dualCount = axles.filter((a) => a.axle_code !== 'REPUESTO' && (a.wheels?.length ?? 0) > 2).length
  if (dualCount === 0) return 'LIVIANO'
  if (dualCount === 1) return 'PESADO_2'
  if (dualCount === 2) return 'PESADO_3'
  if (dualCount === 3) return 'PESADO_4'
  if (dualCount >= 4) return 'PESADO_5'
  return null
}

function mergeIntoLayout(axles: AxleMeasurement[], layout: AxleSlot[]): AxleMeasurement[] {
  const axleMap = new Map(axles.filter((a) => a.axle_code).map((a) => [a.axle_code, a]))
  return layout.map((slot) => {
    const existing = axleMap.get(slot.id)
    if (!existing) return crearAxle(slot)
    const wheelMap = new Map((existing.wheels ?? []).filter((w) => w.wheel_code).map((w) => [w.wheel_code, w]))
    const wheels = slot.tireSlots.map((ts) => {
      const ew = wheelMap.get(ts.id)
      if (!ew) return crearWheel(ts.id)
      const tires = ew.tires?.length
        ? ew.tires.map((t) => ({
            tire_code: t.tire_code || `${ts.id}-LL1`,
            outer_mm: Number.isFinite(t.outer_mm) ? t.outer_mm : 0,
            middle_mm: Number.isFinite(t.middle_mm) ? t.middle_mm : 0,
            inner_mm: Number.isFinite(t.inner_mm) ? t.inner_mm : 0,
          }))
        : [crearTire(`${ts.id}-LL1`)]
      return { wheel_code: ew.wheel_code || ts.id, tires } as WheelMeasurement
    })
    return { axle_code: slot.id, wheels } as AxleMeasurement
  })
}

function buildAxlesForType(type: VehicleConfig): AxleMeasurement[] {
  return getLayout(type).map(crearAxle)
}

function totalTires(axles: AxleMeasurement[]): number {
  return axles.reduce((s, a) => s + (a.wheels ?? []).reduce((sw, w) => sw + (w.tires?.length ?? 0), 0), 0)
}

/* ── Validación NTC 5375 ── */

function getValidationLevels(tire: TireMeasurement, minLegal: number): Record<TireNumericKey, ValidationLevel> {
  const values = TIRE_KEYS.map((k) => ({ key: k, value: tire[k] ?? 0 }))
  const below = values.filter((v) => v.value < minLegal)

  if (below.length === 0) {
    const lowest = values.reduce((a, b) => (a.value <= b.value ? a : b))
    return Object.fromEntries(values.map((v) => [v.key, v.key === lowest.key ? 'green' : 'normal'])) as Record<TireNumericKey, ValidationLevel>
  }

  if (below.length === 3) {
    const lowest = below.reduce((a, b) => (a.value <= b.value ? a : b))
    return Object.fromEntries(values.map((v) => {
      if (v.key === lowest.key) return [v.key, 'intense-red']
      if (v.value < minLegal) return [v.key, 'red']
      return [v.key, 'normal']
    })) as Record<TireNumericKey, ValidationLevel>
  }

  return Object.fromEntries(values.map((v) => {
    if (v.value < minLegal) return [v.key, 'red']
    return [v.key, 'normal']
  })) as Record<TireNumericKey, ValidationLevel>
}

function getInputStyle(level: ValidationLevel, focused: boolean): React.CSSProperties {
  if (level === 'intense-red') {
    return {
      borderColor: focused ? '#155DFC' : '#dc2626',
      background: '#fee2e2',
      color: '#991b1b',
      fontWeight: 800,
    }
  }
  if (level === 'red') {
    return {
      borderColor: focused ? '#155DFC' : '#fecaca',
      background: '#fef2f2',
      color: '#dc2626',
      fontWeight: 700,
    }
  }
  if (level === 'green') {
    return {
      borderColor: focused ? '#155DFC' : '#86efac',
      background: '#f0fdf4',
      color: '#16a34a',
      fontWeight: 700,
    }
  }
  return {
    borderColor: focused ? '#155DFC' : '#e2e8f0',
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
  }
}

/* ── Step 1: Selector ── */

interface StepSelectorProps {
  selected: VehicleConfig | null
  onSelect: (type: VehicleConfig) => void
}

function StepSelector({ selected, onSelect }: StepSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '1.15rem' }}>
          Seleccione la configuración del vehículo
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Elija el tipo de vehículo para habilitar las posiciones de medición de labrado
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {VEHICLE_OPTIONS.map((opt) => {
          const sel = selected === opt.id
          const pesado = opt.id.startsWith('PESADO')
          return (
            <button key={opt.id} type="button" onClick={() => onSelect(opt.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: '18px 14px', borderRadius: 14, cursor: 'pointer', minHeight: 100,
                border: sel ? '2px solid #155DFC' : '2px solid #e2e8f0',
                background: sel ? '#eff6ff' : '#ffffff', color: sel ? '#155DFC' : '#334155',
                transition: 'all 0.15s ease', boxShadow: sel ? '0 4px 12px rgba(21,93,252,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseOver={(e) => { if (!sel) { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#f8fafc' } }}
              onMouseOut={(e) => { if (!sel) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#ffffff' } }}
            >
              {pesado ? <Truck size={32} /> : <Car size={32} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{opt.desc}</div>
              </div>
              {sel && <ChevronRight size={18} style={{ marginTop: 'auto' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── TireCell: Input (edit) / Text (view) ── */

interface TireCellProps {
  axleIdx: number
  wheelIdx: number
  tire: TireMeasurement
  minLegal: number
  mode: 'edit' | 'view'
  onUpdate?: (axleIdx: number, wheelIdx: number, tireIdx: number, field: TireNumericKey, value: number) => void
}

function TireCell({ axleIdx, wheelIdx, tire, minLegal, mode, onUpdate }: TireCellProps) {
  const levels = useMemo(() => getValidationLevels(tire, minLegal), [tire, minLegal])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
      {TIRE_FIELDS.map(({ key }) => {
        const value = tire[key] ?? 0
        const level = levels[key]

        if (mode === 'view') {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 36, padding: '3px 6px',
                fontSize: '0.95rem', fontWeight: level === 'intense-red' ? 800 : 700,
                borderRadius: 6,                 color: getInputStyle(level, false).color as string,
                background: getInputStyle(level, false).background as string,
                border: `1px solid ${(getInputStyle(level, false).borderColor as string) || '#e2e8f0'}`,
              }}>
                {`${value.toFixed(2)}`}
              </span>
            </div>
          )
        }

        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <input
              type="number"
              step="0.01"
              min="0"
              max="30"
              maxLength={5}
              value={value}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : Number(e.target.value)
                onUpdate?.(axleIdx, wheelIdx, 0, key, v)
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#155DFC'
                e.target.style.boxShadow = '0 0 0 3px rgba(21,93,252,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = (getInputStyle(level, false).borderColor as string) || '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
              style={{
                width: '100%', maxWidth: 44, minHeight: 28, padding: '1px 2px',
                textAlign: 'center', fontSize: '0.75rem', borderRadius: 6,
                outline: 'none', transition: 'all 0.15s ease',
                ...getInputStyle(level, false),
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── Chassis: shared layout for edit / view ── */

interface ChassisGridProps {
  type: VehicleConfig
  axles: AxleMeasurement[]
  mode: 'edit' | 'view'
  onChange: (axles: AxleMeasurement[]) => void
}

function ChassisGrid({ type, axles, mode, onChange }: ChassisGridProps) {
  const layout = useMemo(() => getLayout(type), [type])
  const minLegal = useMemo(() => getMinLegal(type), [type])
  const isReadOnly = mode === 'view'

  const filledAxles = useMemo(() => {
    if (!axles?.length) return buildAxlesForType(type)
    return mergeIntoLayout(axles, getLayout(type))
  }, [axles, type])

  const updateTire = useCallback(
    (axleIdx: number, wheelIdx: number, tireIdx: number, field: TireNumericKey, value: number) => {
      const next = filledAxles.map((axle, ai) => {
        if (ai !== axleIdx) return axle
        return {
          ...axle,
          wheels: axle.wheels.map((wheel, wi) => {
            if (wi !== wheelIdx) return wheel
            return { ...wheel, tires: wheel.tires.map((tire, ti) => (ti !== tireIdx ? tire : { ...tire, [field]: value })) }
          }),
        }
      })
      onChange(next)
    },
    [filledAxles, onChange],
  )

  const totalCount = useMemo(() => totalTires(filledAxles), [filledAxles])

  const sectionBox: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: '#ffffff' }
  const sectionHeader: React.CSSProperties = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '10px 16px', background: 'linear-gradient(90deg, #f1f5f9 0%, #ffffff 100%)',
    borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b',
    textTransform: 'uppercase', letterSpacing: '0.03em',
  }
  const innerPad = isReadOnly ? 12 : 8
  const tireCard: React.CSSProperties = { flex: 1, padding: isReadOnly ? '8px 8px' : '4px 6px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
  const tireLabelS: React.CSSProperties = { fontSize: isReadOnly ? '0.65rem' : '0.6rem', fontWeight: 600, color: '#475569', marginBottom: 4, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary strip — only in edit mode */}
      {!isReadOnly && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{type === 'LIVIANO' ? 'Liviano' : `Pesado ${type.replace('PESADO_', '')} ejes`}</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>· {layout.length - 1} eje{layout.length - 1 !== 1 ? 's' : ''} · {totalCount} llantas</span>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
            fontSize: '0.8rem', fontWeight: 600,
            background: type === 'LIVIANO' ? '#f0fdf4' : '#fff7ed',
            color: type === 'LIVIANO' ? '#16a34a' : '#c2410c',
          }}>
            Mín. legal: {minLegal} mm
          </span>
        </div>
      )}

      {/* Front indicator */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
        padding: '10px 16px', background: 'linear-gradient(90deg, #eff6ff 0%, #ffffff 100%)',
        borderRadius: 12, border: '1px solid #bfdbfe',
      }}>
        <span style={{ fontSize: '1.2rem', color: '#155DFC' }}>↑</span>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1d4ed8' }}>FRENTE DEL VEHÍCULO</span>
        <span style={{ fontSize: '1.2rem', color: '#155DFC' }}>↑</span>
      </div>

      {/* Axles */}
      {layout.map((slot, axleIdx) => {
        const axle = filledAxles[axleIdx]
        const wheels = axle?.wheels ?? []
        const isDual = slot.type === 'dual'
        const isSpare = slot.type === 'spare'

        return (
          <section key={slot.id} style={sectionBox}>
            <div style={sectionHeader}><Wrench size={13} style={{ marginRight: 6 }} />{slot.label}</div>
            <div style={{ padding: innerPad, display: 'grid', gap: innerPad }}>
              {isDual ? (
                <div style={{ display: 'flex', gap: innerPad, flexWrap: 'wrap' }}>
                  {slot.tireSlots.map((ts, i) => {
                    const w = wheels[i]; const t = w?.tires?.[0]
                    return (
                      <div key={ts.id} style={tireCard}>
                        <div style={tireLabelS}>{ts.label}</div>
                        {t && <TireCell axleIdx={axleIdx} wheelIdx={i} tire={t} minLegal={minLegal} mode={mode} onUpdate={updateTire} />}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isSpare && slot.tireSlots.length === 1 ? '1fr' : '1fr 1fr',
                  gap: 10, justifyItems: isSpare && slot.tireSlots.length === 1 ? 'center' : 'stretch',
                  maxWidth: isSpare && slot.tireSlots.length === 1 ? 240 : 'none', margin: '0 auto',
                }}>
                  {slot.tireSlots.map((ts, i) => {
                    const w = wheels[i]; const t = w?.tires?.[0]
                    return (
                      <div key={ts.id} style={tireCard}>
                        <div style={tireLabelS}>{ts.label}</div>
                        {t && <TireCell axleIdx={axleIdx} wheelIdx={i} tire={t} minLegal={minLegal} mode={mode} onUpdate={updateTire} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ── Componente principal ── */

function LabradoWizard({ axles, onChange, onSave, saving = false }: LabradoWizardProps) {
  const [mode, setMode] = useState<WizardMode>('select')
  const [vehicleType, setVehicleType] = useState<VehicleConfig | null>(() => inferirConfig(axles))

  const startedWithData = useMemo(() => inferirConfig(axles) !== null, [axles])

  const handleSelectType = useCallback((type: VehicleConfig) => {
    setVehicleType(type)
    if (!startedWithData) {
      onChange(buildAxlesForType(type))
    }
    setMode('edit')
  }, [onChange, startedWithData])

  const handleBackToSelect = useCallback(() => {
    setMode('select')
  }, [])

  const handleSave = useCallback(async () => {
    if (!onSave) return
    await onSave()
    setMode('view')
  }, [onSave])

  /* ── Step 1: Select ── */
  if (mode === 'select') {
    return <StepSelector selected={vehicleType} onSelect={handleSelectType} />
  }

  if (!vehicleType) return null

  /* ── Step 2: Edit ── */
  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleBackToSelect}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', minHeight: 36, boxShadow: 'none',
            }}
          >
            <ArrowLeft size={15} /> Volver
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {vehicleType === 'LIVIANO' ? 'Vehículo Liviano' : `Vehículo Pesado ${vehicleType.replace('PESADO_', '')} ejes`}
          </span>
        </div>

        <ChassisGrid type={vehicleType} axles={axles} mode="edit" onChange={onChange} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
              borderRadius: 10, background: 'linear-gradient(135deg, #155DFC 0%, #0f47d6 100%)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 10px 20px rgba(21,93,252,0.18)',
            }}
          >
            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={18} />}
            {saving ? 'Guardando...' : 'Guardar / Finalizar'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Step 3: View (read-only) ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {vehicleType === 'LIVIANO' ? 'Vehículo Liviano' : `Vehículo Pesado ${vehicleType.replace('PESADO_', '')} ejes`}
          <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '0.78rem' }}>
            <CheckCircle size={12} /> Guardado
          </span>
        </span>
      </div>

      <ChassisGrid type={vehicleType} axles={axles} mode="view" onChange={onChange} />
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { LabradoWizard, ChassisGrid, buildAxlesForType, getLayout, inferirConfig, mergeIntoLayout }
export type { LabradoWizardProps, VehicleConfig }
