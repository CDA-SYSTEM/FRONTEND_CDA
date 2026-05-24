/**
 * Extrae `data` del envelope estándar del API Gateway:
 * { statusCode, message, data, timestamp, path, origin }
 */
export function extractApiData<T = unknown>(responseData: unknown): T {
  if (responseData == null) return responseData as T
  const body = responseData as Record<string, unknown>
  if ('data' in body && body.data !== undefined) return body.data as T
  return responseData as T
}

export function extractApiArray(responseData: unknown): unknown[] {
  const data = extractApiData(responseData)
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of ['items', 'results', 'content', 'users', 'operarios', 'inspectors']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[]
    }
  }
  if (Array.isArray(responseData)) return responseData as unknown[]
  return []
}
