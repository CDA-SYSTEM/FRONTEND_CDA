import { describe, expect, it, vi, beforeEach } from 'vitest'
import { apiClient } from '@/core/api/apiClient'

vi.mock('@/core/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { checklistService } from './checklistService'

describe('checklistService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerTodasLasInspecciones', () => {
    it('llama a GET /api/v1/checklist/inspections', async () => {
      const mockData = [{ id: 'insp-1', plate: 'ABC123', vehicle_id: 1, vehicle_type: 'LIVIANO' }]
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData })

      const result = await checklistService.obtenerTodasLasInspecciones()
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/checklist/inspections')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('insp-1')
    })
  })

  describe('actualizarInspeccion', () => {
    it('llama a PUT /api/v1/checklist/inspections/{id} con payload correcto', async () => {
      const mockData = { id: 'insp-1', plate: 'XYZ789', vehicle_id: 2, vehicle_type: 'LIVIANO' }
      vi.mocked(apiClient.put).mockResolvedValue({ data: mockData })

      const dto = { plate: 'XYZ789', vehicle_id: 2 }
      const result = await checklistService.actualizarInspeccion('insp-1', dto as any)
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/checklist/inspections/insp-1', dto)
      expect(result?.plate).toBe('XYZ789')
    })
  })

  describe('eliminarInspeccion', () => {
    it('llama a DELETE /api/v1/checklist/inspections/{id}', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ status: 200 })

      const result = await checklistService.eliminarInspeccion('insp-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/checklist/inspections/insp-1')
      expect(result).toBe(true)
    })
  })

  describe('guardarComoBorrador', () => {
    it('llama a PATCH /api/v1/checklist/inspections/{id}/draft', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ status: 200 })

      const payload = {
        plate: 'DEF456',
        vehicle_id: 3,
        vehicle_type: 'MOTO' as const,
        responses: [],
      }
      const result = await checklistService.guardarComoBorrador('insp-1', payload)
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/checklist/inspections/insp-1/draft', payload)
      expect(result).toBe(true)
    })
  })
})
