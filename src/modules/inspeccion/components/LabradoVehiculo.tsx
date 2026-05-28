import { useCallback, useMemo } from 'react'
import { Wrench } from 'lucide-react'
import type {
  AxleMeasurement,
  TireMeasurement,
  WheelMeasurement,
} from '@/modules/inspeccion/domain/checklist.types'

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

const VEHICLE_LAYOUT: AxleSlot[] = [
  {
    id: 'EJE01',
    label: 'EJE 1: DELANTERO',
    type: 'single',
    tireSlots: [
      { id: 'DEL-IZQ', label: 'DELANTERA IZQUIERDA', side: 'left' },
      { id: 'DEL-DER', label: 'DELANTERA DERECHA', side: 'right' },
    ],
  },
  ...['02', '03', '04', '05'].map((num) => ({
    id: `EJE${num}`,
    label: `EJE ${Number(num)}: TRASERO DUAL`,
    type: 'dual' as const,
    tireSlots: [
      { id: `TR${num}-IZQ-EXT`, label: `TRASERA IZQUIERDA EXTERNA`, side: 'left' as const },
      { id: `TR${num}-IZQ-INT`, label: `TRASERA IZQUIERDA INTERNA`, side: 'left' as const },
      { id: `TR${num}-DER-INT`, label: `TRASERA DERECHA INTERNA`, side: 'right' as const },
      { id: `TR${num}-DER-EXT`, label: `TRASERA DERECHA EXTERNA`, side: 'right' as const },
    ],
  })),
  {
    id: 'REPUESTO',
    label: 'LLANTAS DE REPUESTO',
    type: 'spare',
    tireSlots: [
      { id: 'REP-01', label: 'REPUESTO 1', side: 'left' },
      { id: 'REP-02', label: 'REPUESTO 2', side: 'right' },
    ],
  },
]

const TIRE_FIELDS: { key: keyof TireMeasurement; label: string; abbr: string }[] = [
  { key: 'outer_mm', label: 'Exterior', abbr: 'Ext' },
  { key: 'middle_mm', label: 'Centro', abbr: 'Cen' },
  { key: 'inner_mm', label: 'Interior', abbr: 'Int' },
]

type TireNumericKey = 'outer_mm' | 'middle_mm' | 'inner_mm'

const TIRE_KEYS: TireNumericKey[] = ['outer_mm', 'middle_mm', 'inner_mm']

function menorMedida(tire: TireMeasurement): TireNumericKey {
  const vals: [number, TireNumericKey][] = TIRE_KEYS.map((k) => [tire[k] ?? 0, k])
  return vals.reduce((min, curr) => (curr[0] < min[0] ? curr : min))[1]
}

function crearTire(id: string): TireMeasurement {
  return { tire_code: id, outer_mm: 0, middle_mm: 0, inner_mm: 0 }
}

function crearWheel(id: string, tireCount: number): WheelMeasurement {
  const tires = Array.from({ length: tireCount }, (_, i) =>
    crearTire(`${id}-LL${i + 1}`),
  )
  return { wheel_code: id, tires }
}

function crearAxle(slot: AxleSlot): AxleMeasurement {
  const wheels = slot.tireSlots.map((ts) => crearWheel(ts.id, 1))
  return { axle_code: slot.id, wheels }
}

function buildDefaultAxles(): AxleMeasurement[] {
  return VEHICLE_LAYOUT.map(crearAxle)
}

function mergeWithLayout(existing: AxleMeasurement[]): AxleMeasurement[] {
  const existingMap = new Map<string, AxleMeasurement>()
  for (const axle of existing) {
    if (axle.axle_code) existingMap.set(axle.axle_code, axle)
  }

  return VEHICLE_LAYOUT.map((slot) => {
    const existingAxle = existingMap.get(slot.id)
    if (!existingAxle) return crearAxle(slot)

    const existingWheelsMap = new Map<string, WheelMeasurement>()
    for (const wheel of existingAxle.wheels ?? []) {
      if (wheel.wheel_code) existingWheelsMap.set(wheel.wheel_code, wheel)
    }

    const wheels = slot.tireSlots.map((ts) => {
      const existingWheel = existingWheelsMap.get(ts.id)
      if (!existingWheel) return crearWheel(ts.id, 1)

      const tires = existingWheel.tires?.length
        ? existingWheel.tires.map((t) => ({
            tire_code: t.tire_code || `${ts.id}-LL`,
            outer_mm: Number.isFinite(t.outer_mm) ? t.outer_mm : 0,
            middle_mm: Number.isFinite(t.middle_mm) ? t.middle_mm : 0,
            inner_mm: Number.isFinite(t.inner_mm) ? t.inner_mm : 0,
          }))
        : [crearTire(`${ts.id}-LL1`)]

      return {
        wheel_code: existingWheel.wheel_code || ts.id,
        tires,
      } as WheelMeasurement
    })

    return { axle_code: slot.id, wheels } as AxleMeasurement
  })
}

interface LabradoVehiculoProps {
  axles: AxleMeasurement[]
  onChange: (axles: AxleMeasurement[]) => void
}

function LabradoVehiculo({ axles, onChange }: LabradoVehiculoProps) {
  const filledAxles = useMemo(() => {
    if (!axles?.length) return buildDefaultAxles()
    return mergeWithLayout(axles)
  }, [axles])

  const updateTire = useCallback(
    (axleIdx: number, wheelIdx: number, tireIdx: number, field: keyof TireMeasurement, value: number) => {
      const next = filledAxles.map((axle, ai) => {
        if (ai !== axleIdx) return axle
        return {
          ...axle,
          wheels: axle.wheels.map((wheel, wi) => {
            if (wi !== wheelIdx) return wheel
            return {
              ...wheel,
              tires: wheel.tires.map((tire, ti) => {
                if (ti !== tireIdx) return tire
                return { ...tire, [field]: value }
              }),
            }
          }),
        }
      })
      onChange(next)
    },
    [filledAxles, onChange],
  )

  const renderTireInputs = (
    axleIdx: number,
    wheelIdx: number,
    tire: TireMeasurement,
  ) => {
    const menor = menorMedida(tire)

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
      }}>
        {TIRE_FIELDS.map(({ key, abbr }) => {
          const esMenor = key === menor && (tire[key as TireNumericKey] ?? 0) > 0
          return (
            <div key={key} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                color: esMenor ? '#16a34a' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {abbr}
              </span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={tire[key] ?? 0}
                onChange={(e) => {
                  const v = e.target.value === '' ? 0 : Number(e.target.value)
                  updateTire(axleIdx, wheelIdx, 0, key, v)
                }}
                style={{
                  width: '100%',
                  minHeight: 36,
                  padding: '4px 6px',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: 6,
                  border: `2px solid ${esMenor ? '#86efac' : '#e2e8f0'}`,
                  background: esMenor ? '#f0fdf4' : '#ffffff',
                  color: esMenor ? '#16a34a' : '#0f172a',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#155DFC'
                  e.target.style.boxShadow = '0 0 0 3px rgba(21,93,252,0.12)'
                }}
                onBlur={(e) => {
                  if (!esMenor) {
                    e.target.style.borderColor = '#e2e8f0'
                  }
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const sectionBox: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
    background: '#ffffff',
  }

  const sectionHeader: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'linear-gradient(90deg, #f1f5f9 0%, #ffffff 100%)',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 700,
    fontSize: '0.82rem',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  }

  const tireCard: React.CSSProperties = {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 10,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  }

  const tireLabel: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: 6,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Vehicle front indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: 'linear-gradient(90deg, #eff6ff 0%, #ffffff 100%)',
        borderRadius: 12,
        border: '1px solid #bfdbfe',
      }}>
        <span style={{ fontSize: '1.2rem', color: '#155DFC' }}>↑</span>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1d4ed8' }}>
          FRENTE DEL VEHÍCULO
        </span>
        <span style={{ fontSize: '1.2rem', color: '#155DFC' }}>↑</span>
      </div>

      {/* Axles */}
      {VEHICLE_LAYOUT.map((slot, axleIdx) => {
        const axle = filledAxles[axleIdx]
        const wheels = axle?.wheels ?? []
        const isDual = slot.type === 'dual'
        const isSpare = slot.type === 'spare'

        return (
          <section key={slot.id} style={sectionBox}>
            <div style={sectionHeader}>
              <Wrench size={13} style={{ marginRight: 6 }} />
              {slot.label}
            </div>

            <div style={{
              padding: 12,
              display: 'grid',
              gap: 10,
            }}>
              {isDual ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* Left side */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {slot.tireSlots
                      .filter((ts) => ts.side === 'left')
                      .map((ts, i) => {
                        const wheel = wheels[i] ?? wheels[0]
                        const tire = wheel?.tires?.[0]
                        return (
                          <div key={ts.id} style={tireCard}>
                            <div style={tireLabel}>{ts.label}</div>
                            {tire && renderTireInputs(axleIdx, i, tire)}
                          </div>
                        )
                      })}
                  </div>
                  {/* Right side */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(() => {
                      const rightSlots = slot.tireSlots.filter((ts) => ts.side === 'right')
                      const rightStart = slot.tireSlots.findIndex((ts) => ts.side === 'right')
                      return rightSlots.map((ts, i) => {
                        const idx = rightStart + i
                        const wheel = wheels[idx]
                        const tire = wheel?.tires?.[0]
                        return (
                          <div key={ts.id} style={tireCard}>
                            <div style={tireLabel}>{ts.label}</div>
                            {tire && renderTireInputs(axleIdx, idx, tire)}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isSpare ? '1fr 1fr' : '1fr 1fr',
                  gap: 10,
                }}>
                  {slot.tireSlots.map((ts, i) => {
                    const wheel = wheels[i]
                    const tire = wheel?.tires?.[0]
                    return (
                      <div key={ts.id} style={tireCard}>
                        <div style={tireLabel}>{ts.label}</div>
                        {tire && renderTireInputs(axleIdx, i, tire)}
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

// eslint-disable-next-line react-refresh/only-export-components
export { buildDefaultAxles, mergeWithLayout, LabradoVehiculo }
export type { LabradoVehiculoProps }
