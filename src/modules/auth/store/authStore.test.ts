import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/modules/auth/store/authStore'

const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  it('inicia sesion demo y persiste token', () => {
    useAuthStore.getState().loginAsDemo('INSPECTOR')

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(localStorage.getItem('cda_auth_token')).toBe('demo-token-web')
  })

  it('cierra sesion y limpia estado', () => {
    useAuthStore.getState().loginAsDemo('ADMIN')
    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem('cda_auth_token')).toBeNull()
  })
})
