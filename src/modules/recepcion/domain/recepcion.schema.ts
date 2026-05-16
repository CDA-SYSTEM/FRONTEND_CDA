import { z } from 'zod'

/**
 * Esquema de validación para el formulario de recepción de vehículos.
 * Reglas de negocio puras: formato de placa colombiana NTC 5375.
 */
export const recepcionSchema = z.object({
  cliente: z.string().min(3, 'Nombre de cliente requerido'),
  placa: z
    .string()
    .regex(
      /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/,
      'Formato de placa invalido (ej: ABC123 o ABC12D)',
    ),
  tipoVehiculo: z.string().min(1, 'Selecciona tipo de vehiculo'),
})

export type RecepcionSchema = z.infer<typeof recepcionSchema>
