import { describe, expect, it } from 'vitest'
import { getGuardRedirect } from '@/modules/auth/components/guard'

describe('guard', () => {
  it('retorna null cuando hay sesion', () => {
    expect(getGuardRedirect(true)).toBeNull()
  })

  it('retorna /login cuando no hay sesion', () => {
    expect(getGuardRedirect(false)).toBe('/login')
  })
})
