import api from './api';
import type {
  Funder,
  FunderFormData,
  FunderListParams,
  FunderDocument,
  FunderStudent,
  FunderTrainings,
  ApiResponse,
  PaginatedResponse,
} from './Funders.types';

/**
 * Funders Service
 * Handles all API calls related to funders/financeurs management
 */
export const fundersService = {
  /**
   * Get paginated list of funders
   * GET /api/organization/funders
   */
  getFunders: async (params?: FunderListParams): Promise<ApiResponse<{ funders: PaginatedResponse<Funder> }>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/api/organization/funders?${queryString}` : '/api/organization/funders';

    return await api.get<ApiResponse<{ funders: PaginatedResponse<Funder> }>>(url);
  },

  /**
   * Get funder details by UUID
   * GET /api/organization/funders/{uuid}
   */
  getFunderById: async (uuid: string): Promise<ApiResponse<{ funder: Funder; trainings?: FunderTrainings; students_count?: number; documents_count?: number }>> => {
    return await api.get<ApiResponse<{ funder: Funder; trainings?: FunderTrainings; students_count?: number; documents_count?: number }>>(`/api/organization/funders/${uuid}`);
  },

  /**
   * Create a new funder
   * POST /api/organization/funders
   */
  createFunder: async (data: FunderFormData): Promise<ApiResponse<Funder>> => {
    return await api.post<ApiResponse<Funder>>('/api/organization/funders', data);
  },

  /**
   * Update a funder (using POST as per backend configuration)
   * POST /api/organization/funders/{uuid}
   */
  updateFunder: async (uuid: string, data: Partial<FunderFormData>): Promise<ApiResponse<Funder>> => {
    return await api.post<ApiResponse<Funder>>(`/api/organization/funders/${uuid}`, data);
  },

  /**
   * Delete a funder
   * DELETE /api/organization/funders/{uuid}
   */
  deleteFunder: async (uuid: string): Promise<ApiResponse<void>> => {
    return await api.delete<ApiResponse<void>>(`/api/organization/funders/${uuid}`);
  },

  /**
   * Get trainings associated with a funder
   * GET /api/organization/funders/{uuid}/trainings
   */
  getFunderTrainings: async (uuid: string): Promise<ApiResponse<FunderTrainings>> => {
    return await api.get<ApiResponse<FunderTrainings>>(`/api/organization/funders/${uuid}/trainings`);
  },

  /**
   * Get students associated with a funder
   * GET /api/organization/funders/{uuid}/students
   */
  getFunderStudents: async (uuid: string): Promise<ApiResponse<FunderStudent[]>> => {
    return await api.get<ApiResponse<FunderStudent[]>>(`/api/organization/funders/${uuid}/students`);
  },

  /**
   * Get documents for a funder
   * GET /api/organization/funders/{uuid}/documents
   */
  getFunderDocuments: async (uuid: string): Promise<ApiResponse<FunderDocument[]>> => {
    return await api.get<ApiResponse<FunderDocument[]>>(`/api/organization/funders/${uuid}/documents`);
  },

  /**
   * Upload a document for a funder
   * POST /api/organization/funders/{uuid}/documents
   */
  uploadFunderDocument: async (
    uuid: string,
    file: File,
    metadata?: {
      file_type?: 'contract' | 'convention' | 'invoice' | 'quote' | 'other';
      description?: string;
      document_date?: string;
      reference_number?: string;
    }
  ): Promise<ApiResponse<FunderDocument>> => {
    const formData = new FormData();
    formData.append('document', file);

    if (metadata) {
      if (metadata.file_type) formData.append('file_type', metadata.file_type);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.document_date) formData.append('document_date', metadata.document_date);
      if (metadata.reference_number) formData.append('reference_number', metadata.reference_number);
    }

    return await api.post<ApiResponse<FunderDocument>>(
      `/api/organization/funders/${uuid}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Download a funder document
   * GET /api/organization/funders/{uuid}/documents/{documentId}/download
   */
  downloadFunderDocument: async (uuid: string, documentId: number): Promise<Blob> => {
    const response = await fetch(
      `${api.defaults?.baseURL || ''}/api/organization/funders/${uuid}/documents/${documentId}/download`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return await response.blob();
  },

  /**
   * Delete a funder document
   * DELETE /api/organization/funders/{uuid}/documents/{documentId}
   */
  deleteFunderDocument: async (uuid: string, documentId: number): Promise<ApiResponse<void>> => {
    return await api.delete<ApiResponse<void>>(`/api/organization/funders/${uuid}/documents/${documentId}`);
  },

  /**
   * Export funders to CSV
   * GET /api/organization/funders/export/csv
   */
  exportFundersCSV: async (params?: {
    uuids?: string[];
    search?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.uuids && params.uuids.length > 0) queryParams.append('uuids', params.uuids.join(','));
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${api.defaults?.baseURL || ''}/api/organization/funders/export/csv?${queryString}`
      : `${api.defaults?.baseURL || ''}/api/organization/funders/export/csv`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export funders');
    }

    return await response.blob();
  },

  /**
   * Export funders to Excel
   * GET /api/organization/funders/export/excel
   */
  exportFundersExcel: async (params?: {
    uuids?: string[];
    search?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.uuids && params.uuids.length > 0) queryParams.append('uuids', params.uuids.join(','));
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${api.defaults?.baseURL || ''}/api/organization/funders/export/excel?${queryString}`
      : `${api.defaults?.baseURL || ''}/api/organization/funders/export/excel`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export funders');
    }

    return await response.blob();
  },
};

// Export types for convenience
export type { Funder, FunderFormData, FunderListParams, FunderDocument, FunderStudent, FunderTrainings };
