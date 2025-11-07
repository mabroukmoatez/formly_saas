import apiClient from './api';

const API_BASE = '/api/organization/students';

export interface CreateStudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  complementary_notes: string;
  adaptation_needs: 'OUI' | 'NON';
  company_id?: number;
  avatar?: File;
}

export interface Student {
  uuid: string;
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  company?: {
    id: number;
    name: string;
  };
  status: 'active' | 'inactive';
  registration_date: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  filters?: any;
}

export const studentsService = {
  /**
   * Créer un étudiant avec upload d'avatar
   */
  createStudent: async (data: CreateStudentFormData): Promise<ApiResponse<{ student: Student; temporary_password?: string }>> => {
    const formData = new FormData();
    
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.postal_code) formData.append('postal_code', data.postal_code);
    if (data.city) formData.append('city', data.city);
    if (data.complementary_notes) formData.append('complementary_notes', data.complementary_notes);
    if (data.adaptation_needs) formData.append('adaptation_needs', data.adaptation_needs);
    if (data.company_id) formData.append('company_id', data.company_id.toString());
    if (data.avatar) formData.append('avatar', data.avatar);

    // ✅ NE PAS définir le Content-Type manuellement
    // Axios le fera automatiquement avec le bon boundary
    const response = await apiClient.post(API_BASE, formData);
    return response;
  },

  /**
   * Liste des étudiants avec pagination
   */
  getStudents: async (params?: {
    search?: string;
    company_id?: number;
    course_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get(API_BASE, { params });
    return response;
  },

  /**
   * Détails d'un étudiant
   */
  getStudent: async (uuid: string): Promise<ApiResponse<Student>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}`);
    return response;
  },

  /**
   * Mettre à jour un étudiant
   */
  updateStudent: async (uuid: string, data: Partial<CreateStudentFormData>): Promise<ApiResponse<{ student: Student }>> => {
    const formData = new FormData();
    
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.postal_code) formData.append('postal_code', data.postal_code);
    if (data.city) formData.append('city', data.city);
    if (data.complementary_notes) formData.append('complementary_notes', data.complementary_notes);
    if (data.adaptation_needs) formData.append('adaptation_needs', data.adaptation_needs);
    if (data.company_id) formData.append('company_id', data.company_id.toString());
    if (data.avatar) formData.append('avatar', data.avatar);

    // ✅ Pas de header Content-Type
    const response = await apiClient.post(`${API_BASE}/${uuid}`, formData);
    return response;
  },

  /**
   * Supprimer un étudiant
   */
  deleteStudent: async (uuid: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`${API_BASE}/${uuid}`);
    return response;
  },

  /**
   * Supprimer plusieurs étudiants
   */
  bulkDeleteStudents: async (studentIds: string[]): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`${API_BASE}/bulk-delete`, { student_ids: studentIds });
    return response;
  },

  /**
   * Upload d'un document pour un étudiant
   */
  uploadDocument: async (uuid: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('document', file);
    
    // ✅ Pas de header Content-Type
    const response = await apiClient.post(`${API_BASE}/${uuid}/documents`, formData);
    return response;
  },

  /**
   * Supprimer un document d'un étudiant
   */
  deleteDocument: async (uuid: string, documentId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`${API_BASE}/${uuid}/documents/${documentId}`);
    return response;
  },

  /**
   * Upload avatar d'un étudiant
   */
  uploadAvatar: async (uuid: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // ✅ Pas de header Content-Type
    const response = await apiClient.post(`${API_BASE}/${uuid}/avatar`, formData);
    return response;
  },

  /**
   * Réinitialiser le mot de passe d'un étudiant
   */
  resetPassword: async (uuid: string): Promise<ApiResponse<{ temp_password: string }>> => {
    const response = await apiClient.post(`${API_BASE}/${uuid}/reset-password`);
    return response;
  },

  /**
   * Envoyer l'email de bienvenue
   */
  sendWelcomeEmail: async (uuid: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`${API_BASE}/${uuid}/send-welcome-email`);
    return response;
  },

  /**
   * Exporter les étudiants en Excel
   */
  exportStudents: async (params?: {
    search?: string;
    company_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/export`, {
      params,
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Exporter les étudiants sélectionnés
   */
  exportSelectedStudents: async (studentIds: string[]): Promise<Blob> => {
    const response = await apiClient.post(`${API_BASE}/export-selected`, 
      { student_ids: studentIds },
      { responseType: 'blob' }
    );
    return response;
  },

  /**
   * Exporter les logs de connexion d'un étudiant
   */
  exportConnectionLogs: async (uuid: string): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/connection-logs/export`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Récupérer les détails complets d'un apprenant (avec courses, attendance, documents, certificates, stats)
   */
  getStudentById: async (uuid: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}`);
    return response;
  },

  /**
   * Récupérer les sessions d'un apprenant
   */
  getSessions: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/sessions`);
    return response;
  },

  /**
   * Récupérer les cours d'un apprenant
   */
  getCourses: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/courses`);
    return response;
  },

  /**
   * Récupérer les documents d'un apprenant
   */
  getDocuments: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/documents`);
    return response;
  },

  /**
   * Récupérer l'historique d'émargement d'un apprenant
   */
  getAttendance: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/attendance`);
    return response;
  },

  /**
   * Télécharger une feuille d'émargement
   */
  downloadAttendanceSheet: async (uuid: string, attendanceId: number): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/attendance/${attendanceId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Télécharger toutes les feuilles d'émargement
   */
  downloadAllAttendanceSheets: async (uuid: string): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/attendance/download-all`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Récupérer les certificats d'un apprenant
   */
  getCertificates: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/certificates`);
    return response;
  },

  /**
   * Upload un certificat pour un apprenant
   */
  uploadCertificate: async (uuid: string, file: File, courseId: number, certificateNumber: string): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('course_id', courseId.toString());
    formData.append('certificate_number', certificateNumber);

    const response = await apiClient.post(`${API_BASE}/${uuid}/certificates`, formData);
    return response;
  },

  /**
   * Télécharger un certificat
   */
  downloadCertificate: async (uuid: string, certificateId: number): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/certificates/${certificateId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Partager un certificat par email
   */
  shareCertificate: async (uuid: string, certificateId: number, email?: string, message?: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`${API_BASE}/${uuid}/certificates/${certificateId}/share`, {
      email,
      message,
    });
    return response;
  },

  /**
   * Récupérer les logs de connexion d'un apprenant
   */
  getConnectionLogs: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/connection-logs`);
    return response;
  },

  /**
   * Récupérer les statistiques d'un apprenant
   */
  getStats: async (uuid: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/stats`);
    return response;
  },

  /**
   * Récupérer les évaluations d'un apprenant
   */
  getEvaluations: async (uuid: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`${API_BASE}/${uuid}/evaluations`);
    return response;
  },

  /**
   * Suppression multiple - Alias pour bulkDeleteStudents avec le bon nom d'argument
   */
  bulkDelete: async (uuids: string[]): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`${API_BASE}/bulk-delete`, { uuids });
    return response;
  },

  /**
   * Export tous les étudiants - Alias
   */
  exportAll: async (params?: any): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/export`, {
      params,
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Export sélection - Alias
   */
  exportSelected: async (uuids: string[]): Promise<Blob> => {
    const response = await apiClient.post(`${API_BASE}/export-selected`,
      { uuids },
      { responseType: 'blob' }
    );
    return response;
  },
};