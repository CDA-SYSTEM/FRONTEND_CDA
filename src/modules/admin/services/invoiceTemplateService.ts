import { apiClient } from '@/core/api/apiClient';
import { extractApiData, extractApiArray } from '@/core/api/extractApiData';
import type { InvoiceTemplate, TemplateType, TemplateVariable, CreateTemplateDto } from '../domain/invoiceTemplate.types';

export const invoiceTemplateService = {
  // CRUD de Plantillas
  listar: async (typeCode?: string): Promise<InvoiceTemplate[]> => {
    const response = await apiClient.get(`/api/v1/invoice-templates${typeCode ? '?typeCode=' + typeCode : ''}`);
    return extractApiArray(response.data) as InvoiceTemplate[];
  },

  obtenerPorId: async (id: string): Promise<InvoiceTemplate> => {
    const response = await apiClient.get(`/api/v1/invoice-templates/${id}`);
    return extractApiData<InvoiceTemplate>(response.data);
  },

  crear: async (data: CreateTemplateDto): Promise<InvoiceTemplate> => {
    const response = await apiClient.post('/api/v1/invoice-templates', data);
    return extractApiData<InvoiceTemplate>(response.data);
  },

  actualizar: async (id: string, data: Partial<CreateTemplateDto>): Promise<InvoiceTemplate> => {
    const response = await apiClient.patch(`/api/v1/invoice-templates/${id}`, data);
    return extractApiData<InvoiceTemplate>(response.data);
  },

  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/invoice-templates/${id}`);
  },

  activar: async (id: string): Promise<InvoiceTemplate> => {
    const response = await apiClient.patch(`/api/v1/invoice-templates/${id}/activate`);
    return extractApiData<InvoiceTemplate>(response.data);
  },

  // Metadatos
  listarTipos: async (): Promise<TemplateType[]> => {
    const response = await apiClient.get('/api/v1/invoice-templates/meta/types');
    return extractApiArray(response.data) as TemplateType[];
  },

  listarVariables: async (category?: string): Promise<TemplateVariable[]> => {
    const response = await apiClient.get(`/api/v1/invoice-templates/meta/variables${category ? '?category=' + category : ''}`);
    return extractApiArray(response.data) as TemplateVariable[];
  },

  obtenerActiva: async (typeCode: string): Promise<InvoiceTemplate> => {
    const response = await apiClient.get(`/api/v1/invoice-templates/active/${typeCode}`);
    return extractApiData<InvoiceTemplate>(response.data);
  }
};
