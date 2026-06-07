import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, User } from 'lucide-react'
import { inspeccionService } from '@/modules/inspeccion/services/inspeccionService'
import type { InspectionDetail } from '@/modules/inspeccion/domain/inspeccion.types'

export function RecepcionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<InspectionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    inspeccionService
      .obtenerDetalle(id)
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [id])

  if (!id) return <div style={{ padding: 20 }}>ID de recepción no proporcionado</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft />
        </button>
        <h2 style={{ margin: 0 }}>Detalle de Recepción</h2>
      </div>

      {loading && <div>Cargando...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {data && (
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <strong>Orden / Inspección:</strong>
              <div>{data.inspection_number || data.id}</div>
            </div>
            <div>
              <strong>Fecha:</strong>
              <div>{data.createdAt ? new Date(data.createdAt).toLocaleString('es-CO') : '—'}</div>
            </div>
            <div>
              <strong>Placa:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Car size={16} /> {data.vehicle?.placa || data.vehicle_id || '—'}
              </div>
            </div>
            <div>
              <strong>Cliente:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} /> {data.client?.nombre ? `${data.client.nombre} ${data.client.apellido || ''}` : data.client_id || '—'}
              </div>
            </div>
            <div>
              <strong>Kilometraje:</strong>
              <div>{data.mileage != null ? `${data.mileage} km` : '—'}</div>
            </div>
            <div>
              <strong>Tipo revisión:</strong>
              <div>{data.revision_type || '—'}</div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Observaciones:</strong>
            <div style={{ marginTop: 8 }}>{data.observations || data.observations_text || '—'}</div>
          </div>

          {data.photo_url && (
            <div style={{ marginTop: 12 }}>
              <strong>Foto:</strong>
              <div style={{ marginTop: 8 }}>
                <img src={data.photo_url} alt="foto recepcion" style={{ maxWidth: '100%', borderRadius: 8 }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecepcionDetailPage
