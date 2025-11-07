import api from './api';

export interface Company {
  id: number;
  uuid: string;
  name: string;
  city?: string;
  logo_url?: string | null;
  legal_name?: string;
  siret?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  country?: string;
}

export interface GetCompaniesListParams {
  search?: string;
  per_page?: number;
  page?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const companiesService = {
  getCompaniesList: async (params?: GetCompaniesListParams): Promise<ApiResponse<Company[]>> => {
    console.log('🌐 companiesService.getCompaniesList called with params:', params);

    try {
      // Construire l'URL avec les query params
      let url = '/api/organization/companies/list';
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params.page) queryParams.append('page', params.page.toString());

        const queryString = queryParams.toString();
        if (queryString) url += `?${queryString}`;
      }

      const response = await api.get<ApiResponse<Company[]>>(url);

      console.log('🌐 API response:', response);
      console.log('🌐 Response.success:', response.success);
      console.log('🌐 Response.data:', response.data);
      console.log('🌐 Is array?', Array.isArray(response.data));

      return response;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  },

   /**
   * Récupérer toutes les entreprises avec pagination
   */
  getCompanies: async (params?: GetCompaniesListParams): Promise<ApiResponse<any>> => {
    let url = '/api/organization/companies';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.page) queryParams.append('page', params.page.toString());

      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const response = await api.get<ApiResponse<any>>(url);
    return response;
  },

  /**
   * Récupérer une entreprise par UUID
   */
  getCompanyById: async (uuid: string): Promise<ApiResponse<Company>> => {
    const response = await api.get<ApiResponse<Company>>(`/api/organization/companies/${uuid}`);
    return response;
  },

  /**
   * Créer une entreprise
   */
  createCompany: async (data: Partial<Company>): Promise<ApiResponse<Company>> => {
    const response = await api.post<ApiResponse<Company>>('/api/organization/companies', data);
    return response;
  },

  /**
   * Mettre à jour une entreprise
   */
  updateCompany: async (uuid: string, data: Partial<Company>): Promise<ApiResponse<Company>> => {
    const response = await api.put<ApiResponse<Company>>(`/api/organization/companies/${uuid}`, data);
    return response;
  },

  /**
   * Supprimer une entreprise
   */
  deleteCompany: async (uuid: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/api/organization/companies/${uuid}`);
    return response;
  },
};
