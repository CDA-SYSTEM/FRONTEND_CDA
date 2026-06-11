import { describe, expect, it } from 'vitest'
import {
  clienteSchema,
  inferirCodigo,
  validarIdentityPorTipo,
} from './recepcion.schema'

// ── Tests del schema Zod ──────────────────────────────────────────────────────

describe('clienteSchema', () => {
  const base = {
    nombre: 'Juan',
    apellido: 'Pérez',
    identity: '1045678901',
    documentTypeId: 1,
    personTypeId: 1,
    celular: '3001234567',
    email: 'juan@correo.com',
    direccion: 'Cra 5 # 12-34, Mocoa',
    birthDate: '1990-05-15',
  }

  it('acepta un payload mínimo válido con campos obligatorios', () => {
    expect(clienteSchema.safeParse(base).success).toBe(true)
  })

  it('acepta payload completo con campos opcionales', () => {
    const result = clienteSchema.safeParse({
      ...base,
      email: 'juan@correo.com',
      direccion: 'Cra 5 # 12-34, Mocoa',
      birthDate: '1990-05-15',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre con menos de 2 caracteres', () => {
    expect(clienteSchema.safeParse({ ...base, nombre: 'J' }).success).toBe(
      false,
    )
  })

  it('rechaza nombre con números', () => {
    expect(clienteSchema.safeParse({ ...base, nombre: 'Juan1' }).success).toBe(
      false,
    )
  })

  it('rechaza apellido con menos de 2 caracteres', () => {
    expect(clienteSchema.safeParse({ ...base, apellido: 'P' }).success).toBe(
      false,
    )
  })

  it('rechaza celular que no inicia con 3 o 6', () => {
    expect(
      clienteSchema.safeParse({ ...base, celular: '1001234567' }).success,
    ).toBe(false)
  })

  it('rechaza celular con menos de 10 dígitos', () => {
    expect(
      clienteSchema.safeParse({ ...base, celular: '300123' }).success,
    ).toBe(false)
  })

  it('rechaza email con formato inválido', () => {
    expect(
      clienteSchema.safeParse({ ...base, email: 'no-es-email' }).success,
    ).toBe(false)
  })

  it('rechaza email vacío ya que es campo obligatorio', () => {
    expect(clienteSchema.safeParse({ ...base, email: '' }).success).toBe(false)
  })

  it('rechaza identity vacío', () => {
    expect(clienteSchema.safeParse({ ...base, identity: '' }).success).toBe(
      false,
    )
  })

  it('rechaza documentTypeId igual a 0', () => {
    expect(
      clienteSchema.safeParse({ ...base, documentTypeId: 0 }).success,
    ).toBe(false)
  })

  it('rechaza birthDate con formato incorrecto', () => {
    expect(
      clienteSchema.safeParse({ ...base, birthDate: '15-05-1990' }).success,
    ).toBe(false)
  })

  it('rechaza birthDate vacío ya que es campo obligatorio', () => {
    expect(clienteSchema.safeParse({ ...base, birthDate: '' }).success).toBe(
      false,
    )
  })
})

// ── Tests del validador cruzado de identity ───────────────────────────────────

describe('validarIdentityPorTipo', () => {
  it('acepta cédula colombiana válida (CC)', () => {
    expect(validarIdentityPorTipo('CC', '1045678901')).toBeNull()
  })

  it('rechaza cédula CC con menos de 6 dígitos', () => {
    expect(validarIdentityPorTipo('CC', '12345')).not.toBeNull()
  })

  it('rechaza cédula CC con más de 10 dígitos', () => {
    expect(validarIdentityPorTipo('CC', '12345678901')).not.toBeNull()
  })

  it('rechaza cédula CC con letras', () => {
    expect(validarIdentityPorTipo('CC', '1045ABC901')).not.toBeNull()
  })

  it('acepta cédula de extranjería válida (CE)', () => {
    expect(validarIdentityPorTipo('CE', 'ABC12345')).toBeNull()
  })

  it('acepta pasaporte válido (PAS)', () => {
    expect(validarIdentityPorTipo('PAS', 'AB12345')).toBeNull()
  })

  it('retorna error si identity está vacío', () => {
    expect(validarIdentityPorTipo('CC', '')).not.toBeNull()
  })

  it('no valida formato para tipo OTRO', () => {
    expect(validarIdentityPorTipo('OTRO', 'CUALQUIER123')).toBeNull()
  })
})

// ── Tests del inferidor de código ─────────────────────────────────────────────

describe('inferirCodigo', () => {
  it('infiere CC para "Cédula de Ciudadanía"', () => {
    expect(inferirCodigo('Cédula de Ciudadanía')).toBe('CC')
  })

  it('infiere CE para "Cédula de Extranjería"', () => {
    expect(inferirCodigo('Cédula de Extranjería')).toBe('CE')
  })

  it('infiere PAS para "Pasaporte"', () => {
    expect(inferirCodigo('Pasaporte')).toBe('PAS')
  })

  it('retorna OTRO para tipo desconocido', () => {
    expect(inferirCodigo('Tarjeta de identidad')).toBe('OTRO')
  })
})
