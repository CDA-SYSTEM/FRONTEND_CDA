import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const recepcionSchema = z.object({
  cliente: z.string().min(3, 'Nombre de cliente requerido'),
  placa: z
    .string()
    .regex(/^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/, 'Formato de placa invalido'),
  tipoVehiculo: z.string().min(1, 'Selecciona tipo de vehiculo'),
})

type RecepcionSchema = z.infer<typeof recepcionSchema>

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
          {errors.tipoVehiculo ? <span>{errors.tipoVehiculo.message}</span> : null}
        </label>

        <button type="submit">Guardar recepcion</button>
      </form>
    </article>
  )
}
