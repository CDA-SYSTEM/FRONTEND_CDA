import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  recepcionSchema,
  type RecepcionSchema,
} from '@/modules/recepcion/domain/recepcion.schema'

/**
 * Página de recepción de vehículos.
 * Validación de formulario delegada al schema de dominio (recepcion.schema.ts).
 */
export function RecepcionPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecepcionSchema>({
    resolver: zodResolver(recepcionSchema),
    defaultValues: { cliente: '', placa: '', tipoVehiculo: '' },
  })

  const onSubmit = (data: RecepcionSchema) => {
    // Placeholder local para validar flujo frontend sin backend integrado.
    console.table(data)
  }

  return (
    <article className="panel">
      <h2>Recepcion de Vehiculo</h2>
      <p>Formulario inicial para registrar cliente y vehiculo.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
        <label>
          Cliente
          <input placeholder="Nombre completo" {...register('cliente')} />
          {errors.cliente ? <span>{errors.cliente.message}</span> : null}
        </label>

        <label>
          Placa
          <input
            placeholder="ABC123 o ABC12D"
            {...register('placa')}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase()
            }}
          />
          {errors.placa ? <span>{errors.placa.message}</span> : null}
        </label>

        <label>
          Tipo de vehiculo
          <select {...register('tipoVehiculo')}>
            <option value="">Seleccionar</option>
            <option value="moto">Moto</option>
            <option value="liviano">Liviano</option>
            <option value="pesado">Pesado</option>
          </select>
          {errors.tipoVehiculo ? (
            <span>{errors.tipoVehiculo.message}</span>
          ) : null}
        </label>

        <button type="submit">Guardar recepcion</button>
      </form>
    </article>
  )
}
