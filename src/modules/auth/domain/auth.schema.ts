import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo invalido'),
  password: z.string().min(4, 'La contrasena debe tener al menos 4 caracteres'),
})

export type LoginSchema = z.infer<typeof loginSchema>
