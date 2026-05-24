import { z } from 'zod'

const placaRegex = /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/

export const vehiculoSchema = z.object({
  clienteId: z.string({ message: 'Debe seleccionar un cliente' }).min(1, 'Seleccione un cliente'),
  placa: z
    .string()
    .min(1, 'La placa es obligatoria')
    .toUpperCase()
    .regex(placaRegex, 'Formato inválido. Use ABC123 o ABC12A'),
  tipoVehiculoId: z.number({ message: 'Seleccione un tipo' }).min(1, 'Seleccione un tipo de vehículo'),
  marcaId: z.number({ message: 'Seleccione una marca' }).min(1, 'Seleccione una marca'),
  lineaId: z.number({ message: 'Seleccione una línea' }).min(1, 'Seleccione una línea'),
  claseId: z.number({ message: 'Seleccione una clase' }).min(1, 'Seleccione una clase'),
  colorId: z.number({ message: 'Seleccione un color' }).min(1, 'Seleccione un color'),
  modelo: z
    .string()
    .min(1, 'El modelo es obligatorio')
    .regex(/^\d{4}$/, 'Ingrese un año válido de 4 dígitos (ej: 2024)'),
  tipoCombustibleId: z.number({ message: 'Seleccione un tipo' }).min(1, 'Seleccione un tipo de combustible'),
  tipoServicioId: z.number({ message: 'Seleccione un tipo' }).min(1, 'Seleccione un tipo de servicio'),
  certificadoNo: z.string().optional(),
  cilindraje: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const num = Number(val)
        return !isNaN(num) && num > 0 && Number.isInteger(num)
      },
      { message: 'El cilindraje debe ser un número entero positivo (ej: 150)' },
    ),
})

export type VehiculoSchema = z.infer<typeof vehiculoSchema>
