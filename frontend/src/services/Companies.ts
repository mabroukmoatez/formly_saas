import api from './api';
import type {
  Company,
  CompanyFormData,
  CompanyListParams,
  CompanyDocument,
  CompanyStudent,
  CompanyTrainings,
  ApiResponse,
  PaginatedResponse,
} from './Companies.types';

/**
 * Companies Service
 * Handles all API calls related to companies management
 */
export const companiesService = {
  /**
   * Get paginated list of companies
   * GET /api/organization/companies
   */
  getCompanies: async (params?: CompanyListParams): Promise<ApiResponse<{ companies: PaginatedResponse<Company> }>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.industry) queryParams.append('industry', params.industry);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/api/organization/companies?${queryString}` : '/api/organization/companies';

    return await api.get<ApiResponse<{ companies: PaginatedResponse<Company> }>>(url);
  },

  /**
   * Get simple list of companies (for dropdowns/autocomplete)
   * GET /api/organization/companies/list
   */
  getCompaniesList: async (params?: { search?: string; per_page?: number; page?: number }): Promise<ApiResponse<Company[]>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.page) queryParams.append('page', params.page.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/api/organization/companies/list?${queryString}` : '/api/organization/companies/list';

    return await api.get<ApiResponse<Company[]>>(url);
  },

  /**
   * Get company details by UUID
   * GET /api/organization/companies/{uuid}
   */
  getCompanyById: async (uuid: string): Promise<ApiResponse<{ company: Company; trainings?: CompanyTrainings; students_count?: number; documents_count?: number }>> => {
    return await api.get<ApiResponse<{ company: Company; trainings?: CompanyTrainings; students_count?: number; documents_count?: number }>>(`/api/organization/companies/${uuid}`);
  },

  /**
   * Create a new company
   * POST /api/organization/companies
   */
  createCompany: async (data: CompanyFormData): Promise<ApiResponse<Company>> => {
    return await api.post<ApiResponse<Company>>('/api/organization/companies', data);
  },

  /**
   * Update a company (using POST as per backend configuration)
   * POST /api/organization/companies/{uuid}
   */
  updateCompany: async (uuid: string, data: Partial<CompanyFormData>): Promise<ApiResponse<Company>> => {
    return await api.post<ApiResponse<Company>>(`/api/organization/companies/${uuid}`, data);
  },

  /**
   * Delete a company
   * DELETE /api/organization/companies/{uuid}
   */
  deleteCompany: async (uuid: string): Promise<ApiResponse<void>> => {
    return await api.delete<ApiResponse<void>>(`/api/organization/companies/${uuid}`);
  },

  /**
   * Get trainings associated with a company
   * GET /api/organization/companies/{uuid}/trainings
   */
  getCompanyTrainings: async (uuid: string): Promise<ApiResponse<CompanyTrainings>> => {
    return await api.get<ApiResponse<CompanyTrainings>>(`/api/organization/companies/${uuid}/trainings`);
  },

  /**
   * Get students associated with a company
   * GET /api/organization/companies/{uuid}/students
   */
  getCompanyStudents: async (uuid: string): Promise<ApiResponse<CompanyStudent[]>> => {
    return await api.get<ApiResponse<CompanyStudent[]>>(`/api/organization/companies/${uuid}/students`);
  },

  /**
   * Get documents for a company
   * GET /api/organization/companies/{uuid}/documents
   */
  getCompanyDocuments: async (uuid: string): Promise<ApiResponse<CompanyDocument[]>> => {
    return await api.get<ApiResponse<CompanyDocument[]>>(`/api/organization/companies/${uuid}/documents`);
  },

  /**
   * Upload a document for a company
   * POST /api/organization/companies/{uuid}/documents
   */
  uploadCompanyDocument: async (
    uuid: string,
    file: File,
    metadata?: {
      file_type?: 'contract' | 'convention' | 'invoice' | 'quote' | 'other';
      description?: string;
      document_date?: string;
      reference_number?: string;
    }
  ): Promise<ApiResponse<CompanyDocument>> => {
    const formData = new FormData();
    formData.append('document', file);

    if (metadata) {
      if (metadata.file_type) formData.append('file_type', metadata.file_type);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.document_date) formData.append('document_date', metadata.document_date);
      if (metadata.reference_number) formData.append('reference_number', metadata.reference_number);
    }

    return await api.post<ApiResponse<CompanyDocument>>(
      `/api/organization/companies/${uuid}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Download a company document
   * GET /api/organization/companies/{uuid}/documents/{documentId}/download
   */
  downloadCompanyDocument: async (uuid: string, documentId: number): Promise<Blob> => {
    const response = await fetch(
      `${api.defaults?.baseURL || ''}/api/organization/companies/${uuid}/documents/${documentId}/download`,
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
   * Delete a company document
   * DELETE /api/organization/companies/{uuid}/documents/{documentId}
   */
  deleteCompanyDocument: async (uuid: string, documentId: number): Promise<ApiResponse<void>> => {
    return await api.delete<ApiResponse<void>>(`/api/organization/companies/${uuid}/documents/${documentId}`);
  },

  /**
   * Export companies to CSV
   * GET /api/organization/companies/export/csv
   */
  exportCompaniesCSV: async (params?: {
    uuids?: string[];
    search?: string;
    industry?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.uuids && params.uuids.length > 0) queryParams.append('uuids', params.uuids.join(','));
      if (params.search) queryParams.append('search', params.search);
      if (params.industry) queryParams.append('industry', params.industry);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${api.defaults?.baseURL || ''}/api/organization/companies/export/csv?${queryString}`
      : `${api.defaults?.baseURL || ''}/api/organization/companies/export/csv`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export companies');
    }

    return await response.blob();
  },

  /**
   * Export companies to Excel
   * GET /api/organization/companies/export/excel
   */
  exportCompaniesExcel: async (params?: {
    uuids?: string[];
    search?: string;
    industry?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.uuids && params.uuids.length > 0) queryParams.append('uuids', params.uuids.join(','));
      if (params.search) queryParams.append('search', params.search);
      if (params.industry) queryParams.append('industry', params.industry);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${api.defaults?.baseURL || ''}/api/organization/companies/export/excel?${queryString}`
      : `${api.defaults?.baseURL || ''}/api/organization/companies/export/excel`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export companies');
    }

    return await response.blob();
  },
};

// Export types for convenience
export type { Company, CompanyFormData, CompanyListParams, CompanyDocument, CompanyStudent, CompanyTrainings };
