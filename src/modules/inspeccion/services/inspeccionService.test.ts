import { describe, expect, it, vi, beforeEach } from 'vitest'
import { apiClient } from '@/core/api/apiClient'

vi.mock('@/core/api/apiClient', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import { inspeccionService } from './inspeccionService'

describe('inspeccionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarPorVehiculo', () => {
    it('retorna lista ordenada cronológicamente (más reciente primero)', async () => {
      const mock = [
        { id: '1', createdAt: '2026-03-01T10:00:00Z' },
        { id: '2', createdAt: '2026-05-15T10:00:00Z' },
        { id: '3', createdAt: '2026-01-10T10:00:00Z' },
      ]
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mock } })

      const result = await inspeccionService.listarPorVehiculo('ABC123')
      expect(result.map((r) => r.id)).toEqual(['2', '1', '3'])
    })

    it('retorna arreglo vacío ante error de red', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      await expect(inspeccionService.listarPorVehiculo('ABC123')).rejects.toThrow('Network error')
    })

    it('maneja respuesta plana (sin envelope)', async () => {
      const mock = [{ id: '1', createdAt: '2026-05-01T00:00:00Z' }]
      vi.mocked(apiClient.get).mockResolvedValue({ data: mock })

      const result = await inspeccionService.listarPorVehiculo('XYZ789')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('maneja envelope anidado { data: { data: [...] } }', async () => {
      const mock = { data: { data: [{ id: '42', createdAt: '2026-06-01T00:00:00Z' }] } }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mock })

      const result = await inspeccionService.listarPorVehiculo('PLACA1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('42')
    })

    it('incluye parámetros page y size en la petición', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [] } })
      await inspeccionService.listarPorVehiculo('ABC123', 2, 10)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/inspections', {
        params: { vehicle_id: 'ABC123', page: 2, size: 10 },
      })
    })
  })

  describe('obtenerDetalle', () => {
    it('retorna detalle de inspección', async () => {
      const mock = {
        data: {
          id: '1',
          mileage: 50000,
          client: { nombre: 'Juan' },
          vehicle: { placa: 'ABC123' },
        },
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mock })

      const result = await inspeccionService.obtenerDetalle('1')
      expect(result).not.toBeNull()
      expect(result?.mileage).toBe(50000)
    })

    it('retorna null si la petición falla', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'))

      const result = await inspeccionService.obtenerDetalle('999')
      expect(result).toBeNull()
    })

    it('extrae item de respuesta plana', async () => {
      const mock = { id: '1', mileage: 10000 }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mock })

      const result = await inspeccionService.obtenerDetalle('1')
      expect(result?.id).toBe('1')
    })
  })

  describe('eliminar', () => {
    it('llama a DELETE con el ID correcto', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({})
      await inspeccionService.eliminar('123')
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/inspections/123')
    })
  })

  describe('actualizar', () => {
    it('llama a PATCH con un objeto plano', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({})
      await inspeccionService.actualizar('123', { mileage: 60000 })
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/inspections/123', { mileage: 60000 })
    })

    it('llama a PATCH con un FormData y cabeceras adecuadas', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({})
      const fd = new FormData()
      await inspeccionService.actualizar('123', fd)
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/inspections/123', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    })
  })

  describe('actualizarChecklist', () => {
    it('llama a PATCH con el checklistId correcto', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({})
      await inspeccionService.actualizarChecklist('123', 'chk-999')
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/inspections/123/checklist-id', { checklistId: 'chk-999' })
    })
  })
})
