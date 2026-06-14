import { apiClient } from '@/core/api/apiClient'

export interface StorageFolder {
  id: string
  name: string
  description?: string
  created_at: string
  parent_id?: string
}

export interface StorageFile {
  id: string
  filename: string
  original_name: string
  mimetype: string
  size?: number
  created_at: string
  deleted_at: string | null
  url: string
  folder_id?: string
}

export type StorageItem = (StorageFolder & { type: 'folder' }) | (StorageFile & { type: 'file' })

export const storageService = {
  async listarCarpetas(search?: string): Promise<StorageFolder[]> {
    try {
      const response = await apiClient.get('/api/v1/storage/folders', {
        params: search ? { search } : undefined
      })
      const body = response.data as any
      const folders = body?.data?.data || body?.data || body || []
      return Array.isArray(folders) ? folders : []
    } catch (error) {
      console.error('Error listing folders:', error)
      return []
    }
  },

  async crearCarpeta(name: string, parentId?: string): Promise<StorageFolder | null> {
    try {
      const payload: Record<string, any> = { name }
      if (parentId) payload.parent_id = parentId
      const response = await apiClient.post('/api/v1/storage/folders', payload)
      const body = response.data as any
      return body?.data || body || null
    } catch (error) {
      console.error('Error creating folder:', error)
      return null
    }
  },

  async getFolderContents(folderId: string): Promise<StorageItem[]> {
    try {
      const response = await apiClient.get(`/api/v1/storage/folders/${folderId}/contents`)
      const body = response.data as any
      const items = body?.data?.data || body?.data || body || []
      if (Array.isArray(items)) return items
    } catch {
      // fallback to old endpoint
    }
    const files = await this.listarArchivosDeCarpeta(folderId)
    return files.map(f => ({ ...f, type: 'file' as const }))
  },

  async listRootContents(): Promise<StorageItem[]> {
    try {
      const response = await apiClient.get('/api/v1/storage/folders/root/contents')
      const body = response.data as any
      const items = body?.data?.data || body?.data || body || []
      if (Array.isArray(items)) return items
    } catch {
      // empty
    }
    return []
  },

  async listarArchivosDeCarpeta(folderId: string): Promise<StorageFile[]> {
    try {
      const response = await apiClient.get(`/api/v1/storage/folders/${folderId}/files`)
      const body = response.data as any
      const files = body?.data?.data || body?.data || body || []
      if (Array.isArray(files)) return files
    } catch {
      // Ignorar error e intentar fallback
    }

    try {
      const response = await apiClient.get(`/api/v1/storage/folders/${folderId}/f`)
      const body = response.data as any
      const files = body?.data?.data || body?.data || body || []
      if (Array.isArray(files)) return files
    } catch (error) {
      console.error('Error listing folder files:', error)
    }

    return []
  },

  async subirArchivo(file: File, folderId?: string): Promise<StorageFile | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (folderId) {
        formData.append('folder_id', folderId)
      }
      const response = await apiClient.post('/api/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const body = response.data as any
      return body?.data || body || null
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  },

  async listarArchivosActivos(limit = 100): Promise<StorageFile[]> {
    try {
      const response = await apiClient.get('/api/v1/storage/files', {
        params: { limit }
      })
      const body = response.data as any
      const files = body?.data?.data || body?.data || body || []
      return Array.isArray(files) ? files : []
    } catch (error) {
      console.error('Error listing active files:', error)
      return []
    }
  },

  async eliminarArchivo(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/v1/storage/files/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  },

  async eliminarCarpeta(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/v1/storage/folders/${id}`)
      return true
    } catch (error: any) {
      console.error('Error deleting folder:', error)
      return false
    }
  }
}
