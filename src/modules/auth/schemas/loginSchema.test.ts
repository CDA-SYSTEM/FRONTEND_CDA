import { describe, expect, it } from 'vitest'
import { loginSchema } from '@/modules/auth/schemas/loginSchema'

describe('loginSchema', () => {
  it('valida un payload correcto', () => {
    const result = loginSchema.safeParse({
      email: 'demo@cda.com',
      password: '123456',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza una contrasena corta', () => {
    const result = loginSchema.safeParse({
      email: 'demo@cda.com',
      password: '123',
    })

    expect(result.success).toBe(false)
  })
})
