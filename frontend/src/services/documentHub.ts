import { apiService } from './api';

export interface DocumentFolder {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  is_system: boolean;
  course_uuid?: string;
  icon: string;
  color: string;
  total_documents: number;
  total_questionnaires: number;
  total_size: number;
  last_updated: string;
  created_at: string;
  course?: {
    uuid: string;
    title: string;
    image_url: string;
    status: number;
  };
  creator?: {
    id: number;
    name: string;
    image_url?: string;
  };
}

export interface DocumentHubStatistics {
  total_folders: number;
  total_documents: number;
  total_questionnaires: number;
  total_size: number;
  storage_used_percentage: number;
  storage_limit: number;
  documents_by_type: {
    certificates: number;
    custom_builder: number;
    questionnaires: number;
    templates: number;
  };
}

class DocumentHubService {
  private baseUrl = '/api/organization/document-hub';

  async getHub(params?: {
    search?: string;
    filter_type?: 'formations' | 'custom' | 'all';
    sort_by?: 'name' | 'date' | 'size' | 'documents_count';
    sort_order?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.filter_type) queryParams.append('filter_type', params.filter_type);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const qs = queryParams.toString();
    return apiService.get(`${this.baseUrl}${qs ? `?${qs}` : ''}`);
  }

  async getFolder(folderUuid: string) {
    return apiService.get(`${this.baseUrl}/folders/${folderUuid}`);
  }

  async createFolder(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parent_folder_id?: number;
  }) {
    return apiService.post(`${this.baseUrl}/folders`, data);
  }

  async updateFolder(folderUuid: string, data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    return apiService.put(`${this.baseUrl}/folders/${folderUuid}`, data);
  }

  async deleteFolder(folderUuid: string) {
    return apiService.delete(`${this.baseUrl}/folders/${folderUuid}`);
  }

  async addDocumentToFolder(folderUuid: string, documentUuid: string, order?: number) {
    return apiService.post(`${this.baseUrl}/folders/${folderUuid}/documents`, {
      document_uuid: documentUuid,
      order
    });
  }

  async removeDocumentFromFolder(folderUuid: string, documentUuid: string) {
    return apiService.delete(`${this.baseUrl}/folders/${folderUuid}/documents/${documentUuid}`);
  }

  async getStatistics() {
    return apiService.get(`${this.baseUrl}/statistics`);
  }
}

export const documentHubService = new DocumentHubService();

