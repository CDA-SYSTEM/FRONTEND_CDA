const LOCAL_DEV_API_URL = 'http://localhost:3600'
const ANDROID_API_URL = 'http://10.0.2.2:3600'

function normalizeBaseUrl(value?: string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/\/+$/, '')
}

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_URL) ??
  (import.meta.env.DEV ? LOCAL_DEV_API_URL : ANDROID_API_URL)

export const API_KEY_FRONT = import.meta.env.VITE_API_KEY_FRONT?.trim() ?? ''