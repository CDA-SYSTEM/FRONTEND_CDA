import { describe, expect, it, vi, beforeEach } from 'vitest'
import { apiClient } from '@/core/api/apiClient'

vi.mock('@/core/api/apiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

import { ordenServicioService } from './ordenServicioService'

describe('ordenServicioService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerTiposRevision', () => {
    it('retorna lista de catálogo', async () => {
      const mock = { data: { data: [{ id: 1, nombre: 'Técnico-Mecánica' }] } }
      vi.mocked(apiClient.get).mockResolvedValue(mock)

      const result = await ordenServicioService.obtenerTiposRevision()
      expect(result).toHaveLength(1)
      expect(result[0].nombre).toBe('Técnico-Mecánica')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/catalogs/revision-types')
    })

    it('retorna arreglo vacío si no hay data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: {} })
      const result = await ordenServicioService.obtenerTiposRevision()
      expect(result).toEqual([])
    })
  })

  describe('obtenerTiposCliente', () => {
    it('retorna lista de catálogo', async () => {
      const mock = { data: { data: [{ id: 1, nombre: 'Propietario' }] } }
      vi.mocked(apiClient.get).mockResolvedValue(mock)

      const result = await ordenServicioService.obtenerTiposCliente()
      expect(result).toHaveLength(1)
      expect(result[0].nombre).toBe('Propietario')
    })
  })

  describe('crearOrdenServicio', () => {
    it('envía POST con FormData y retorna la orden creada', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'ord-001',
            inspection_number: '0001',
            createdAt: '2026-05-17T10:00:00Z',
          },
        },
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await ordenServicioService.crearOrdenServicio({
        mileage: 50000,
        client_id: '1',
        vehicle_id: '10',
        customer_type: 'PROPIETARIO',
        revision_type: 'TECNICO_MECANICA',
      })

      expect(result.id).toBe('ord-001')
      expect(result.inspection_number).toBe('0001')
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/inspections',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
    })

    it('lanza error si la petición falla', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Error de red'))

      await expect(
        ordenServicioService.crearOrdenServicio({
          mileage: 1000,
          client_id: '1',
          vehicle_id: '5',
          customer_type: 'PROPIETARIO',
          revision_type: 'TECNICO_MECANICA',
        }),
      ).rejects.toThrow()
    })
  })

  describe('obtenerVehiculosCliente', () => {
    it('retorna vehículos normalizados del cliente', async () => {
      const mock = {
        data: {
          data: [
            { id: 'v1', placa: 'ABC123', marca: 'Toyota', linea: 'Corolla', modelo: '2024' },
          ],
        },
      }
      vi.mocked(apiClient.get).mockResolvedValue(mock)

      const result = await ordenServicioService.obtenerVehiculosCliente(1)
      expect(result).toHaveLength(1)
      expect(result[0].placa).toBe('ABC123')
    })

    it('retorna arreglo vacío ante error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Error'))

      const result = await ordenServicioService.obtenerVehiculosCliente(999)
      expect(result).toEqual([])
    })
  })
})
