import { z } from 'zod'

// ── Regex de validación colombiana ────────────────────────────────────────────

/** Cédula colombiana: 6 a 10 dígitos numéricos */
const cedulaRegex = /^\d{6,10}$/

/** Cédula de extranjería: 6 a 12 caracteres alfanuméricos */
const ceRegex = /^[A-Z0-9]{6,12}$/

/** Pasaporte: 5 a 9 caracteres alfanuméricos */
const pasaporteRegex = /^[A-Z0-9]{5,9}$/

/** Teléfono / celular colombiano: 10 dígitos, inicia con 3 (celular) o 6 (fijo) */
const telefonoRegex = /^[36]\d{9}$/

// ── Schema del formulario — campos alineados con POST /api/v1/clients ─────────

export const clienteSchema = z.object({
  /** Separados porque el backend espera nombre y apellido por separado */
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar 80 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'Solo se permiten letras y espacios'),

  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(80, 'El apellido no puede superar 80 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'Solo se permiten letras y espacios'),

  /**
   * identity = número de documento.
   * La validación de formato se hace en validarIdentityPorTipo(),
   * aquí solo validamos que no esté vacío.
   */
  identity: z.string().min(1, 'El número de documento es obligatorio'),

  /** ID numérico del tipo de documento — viene de GET /api/v1/document-types */
  documentTypeId: z
    .number({ invalid_type_error: 'Selecciona un tipo de documento' })
    .int()
    .positive('Selecciona un tipo de documento'),

  /** ID numérico del tipo de persona — viene de GET /api/v1/person-types */
  personTypeId: z
    .number({ invalid_type_error: 'Selecciona un tipo de persona' })
    .int()
    .positive('Selecciona un tipo de persona'),

  celular: z
    .string()
    .regex(telefonoRegex, 'Celular inválido: 10 dígitos, inicia con 3 o 6'),

  email: z
    .string()
    .email('Correo electrónico inválido')
    .optional()
    .or(z.literal('')),

  direccion: z
    .string()
    .max(200, 'La dirección no puede superar 200 caracteres')
    .optional()
    .or(z.literal('')),

  /** Fecha de nacimiento en formato ISO YYYY-MM-DD (opcional) */
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
})

export type ClienteSchema = z.infer<typeof clienteSchema>

// ── Validador cruzado: identity según documentTypeId ─────────────────────────
// Usamos los códigos conocidos; si el backend devuelve IDs distintos,
// este mapa se puede actualizar sin cambiar el formulario.

/**
 * Código de documento inferido del nombre del tipo devuelto por el backend.
 * Se usa en el formulario para mostrar el placeholder correcto.
 */
export type CodigoDocumento = 'CC' | 'CE' | 'PAS' | 'OTRO'

export function inferirCodigo(nombreTipo: string): CodigoDocumento {
  // Normalizar: minúsculas + quitar tildes para comparaciones robustas
  const n = nombreTipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (n.includes('ciudadan') || n.includes(' cc') || n.startsWith('cc'))
    return 'CC'
  if (n.includes('extranjeri') || n.includes(' ce') || n.startsWith('ce'))
    return 'CE'
  if (n.includes('pasaporte') || n.includes('pas')) return 'PAS'
  return 'OTRO'
}

export function validarIdentityPorTipo(
  codigoTipo: CodigoDocumento,
  identity: string,
): string | null {
  if (!identity || identity.trim().length === 0) {
    return 'El número de documento es obligatorio'
  }
  const n = identity.toUpperCase().trim()

  switch (codigoTipo) {
    case 'CC':
      return cedulaRegex.test(n)
        ? null
        : 'La cédula debe tener entre 6 y 10 dígitos'
    case 'CE':
      return ceRegex.test(n)
        ? null
        : 'La cédula de extranjería debe tener entre 6 y 12 caracteres alfanuméricos'
    case 'PAS':
      return pasaporteRegex.test(n)
        ? null
        : 'El pasaporte debe tener entre 5 y 9 caracteres alfanuméricos'
    default:
      return null // Sin validación de formato para tipos desconocidos
  }
}
