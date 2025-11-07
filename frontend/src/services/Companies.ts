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
      const response = await api.get('/api/organization/companies/list', { params });
      
      console.log('🌐 Raw axios response:', response);
      console.log('🌐 Response data:', response.data);
      console.log('🌐 Response status:', response.status);
      
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  },

   /**
   * Récupérer toutes les entreprises avec pagination
   */
  getCompanies: async (params?: GetCompaniesListParams): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/organization/companies', { params });
    return response.data;
  },

  /**
   * Récupérer une entreprise par UUID
   */
  getCompanyById: async (uuid: string): Promise<ApiResponse<Company>> => {
    const response = await api.get(`/api/organization/companies/${uuid}`);
    return response.data;
  },

  /**
   * Créer une entreprise
   */
  createCompany: async (data: Partial<Company>): Promise<ApiResponse<Company>> => {
    const response = await api.post('/api/organization/companies', data);
    return response.data;
  },

  /**
   * Mettre à jour une entreprise
   */
  updateCompany: async (uuid: string, data: Partial<Company>): Promise<ApiResponse<Company>> => {
    const response = await api.put(`/api/organization/companies/${uuid}`, data);
    return response.data;
  },

  /**
   * Supprimer une entreprise
   */
  deleteCompany: async (uuid: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/organization/companies/${uuid}`);
    return response.data;
  },
};
