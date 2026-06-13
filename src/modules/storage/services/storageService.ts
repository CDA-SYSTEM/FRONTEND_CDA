import { apiClient } from '@/core/api/apiClient'

export interface StorageFolder {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface StorageFile {
  id: string
  filename: string
  original_name: string
  mimetype: string
  created_at: string
  deleted_at: string | null
  url: string
  folder_id?: string
}

export const storageService = {
  // Listar todas las carpetas
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

  // Crear carpeta
  async crearCarpeta(name: string): Promise<StorageFolder | null> {
    try {
      const response = await apiClient.post('/api/v1/storage/folders', { name })
      const body = response.data as any
      return body?.data || body || null
    } catch (error) {
      console.error('Error creating folder:', error)
      return null
    }
  },

  // Listar archivos dentro de una carpeta
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

  // Subir archivo
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

  // Listar todos los archivos activos
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

  // Eliminar archivo
  async eliminarArchivo(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/v1/storage/files/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  },

  // Eliminar carpeta (solo si está vacía)
  async eliminarCarpeta(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/v1/storage/folders/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting folder:', error)
      return false
    }
  }
}
