import { openDB, type IDBPDatabase } from 'idb'
import type { InspectionItemPhoto, InspectionItemResponse } from '@/modules/inspeccion/domain/checklist.types'

const DB_NAME = 'cda-offline'
const DB_VERSION = 1

type DbSchema = {
  responses: {
    key: string
    value: { key: string; data: InspectionItemResponse }
    indexes: never
  }
  photos: {
    key: string
    value: { key: string; blob: Blob; id: string }
    indexes: never
  }
  syncQueue: {
    key: number
    value: {
      id?: number
      endpoint: string
      method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
      payload: unknown
      timestamp: number
    }
    indexes: { 'timestamp': number }
  }
  metadata: {
    key: string
    value: { key: string; value: string }
    indexes: never
  }
}

let dbPromise: Promise<IDBPDatabase<DbSchema>> | null = null

function getDb(): Promise<IDBPDatabase<DbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('responses')) {
          db.createObjectStore('responses', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          store.createIndex('timestamp', 'timestamp')
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export const offlineStorage = {
  /* ── Responses ── */
  async guardarRespuesta(key: string, data: InspectionItemResponse): Promise<void> {
    const db = await getDb()
    await db.put('responses', { key, data })
  },

  async guardarRespuestas(entries: [string, InspectionItemResponse][]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('responses', 'readwrite')
    for (const [key, data] of entries) {
      tx.store.put({ key, data })
    }
    await tx.done
  },

  async obtenerRespuestas(): Promise<Map<string, InspectionItemResponse>> {
    const db = await getDb()
    const items = await db.getAll('responses')
    const map = new Map<string, InspectionItemResponse>()
    for (const item of items) {
      map.set(item.key, item.data)
    }
    return map
  },

  async limpiarRespuestas(): Promise<void> {
    const db = await getDb()
    await db.clear('responses')
  },

  /* ── Photos ── */
  async guardarFoto(key: string, photoId: string, blob: Blob): Promise<void> {
    const db = await getDb()
    await db.put('photos', { key: `${key}:${photoId}`, blob, id: photoId })
  },

  async eliminarFoto(key: string, photoId: string): Promise<void> {
    const db = await getDb()
    await db.delete('photos', `${key}:${photoId}`)
  },

  async obtenerFotos(): Promise<Map<string, InspectionItemPhoto[]>> {
    const db = await getDb()
    const items = await db.getAll('photos')
    const map = new Map<string, InspectionItemPhoto[]>()
    for (const item of items) {
      const photoKey = item.key.slice(0, item.key.lastIndexOf(':'))
      const photo: InspectionItemPhoto = {
        id: item.id,
        compressedBlob: item.blob,
        previewUrl: URL.createObjectURL(item.blob),
      }
      const existing = map.get(photoKey) || []
      existing.push(photo)
      map.set(photoKey, existing)
    }
    return map
  },

  async limpiarFotos(): Promise<void> {
    const db = await getDb()
    await db.clear('photos')
  },

  /* ── Sync Queue ── */
  async encolar(endpoint: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', payload: unknown): Promise<void> {
    const db = await getDb()
    await db.add('syncQueue', { endpoint, method, payload, timestamp: Date.now() })
  },

  async obtenerCola(): Promise<DbSchema['syncQueue']['value'][]> {
    const db = await getDb()
    const items = await db.getAll('syncQueue')
    items.sort((a, b) => a.timestamp - b.timestamp)
    return items
  },

  async eliminarDeCola(id: number): Promise<void> {
    const db = await getDb()
    await db.delete('syncQueue', id)
  },

  async limpiarCola(): Promise<void> {
    const db = await getDb()
    await db.clear('syncQueue')
  },

  /* ── Metadata ── */
  async guardarMetadata(key: string, value: string): Promise<void> {
    const db = await getDb()
    await db.put('metadata', { key, value })
  },

  async obtenerMetadata(key: string): Promise<string | undefined> {
    const db = await getDb()
    const item = await db.get('metadata', key)
    return item?.value
  },

  async eliminarMetadata(key: string): Promise<void> {
    const db = await getDb()
    await db.delete('metadata', key)
  },

  /* ── Util ── */
  async limpiarTodo(inspectionId: string): Promise<void> {
    await Promise.all([
      offlineStorage.limpiarRespuestas(),
      offlineStorage.limpiarFotos(),
      offlineStorage.eliminarMetadata(`inspection:${inspectionId}`),
    ])
  },
}
