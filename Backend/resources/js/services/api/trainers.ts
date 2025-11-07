import axios from 'axios';
import type {
  Trainer,
  TrainerDetails,
  TrainerSession,
  TrainerCourse,
  CalendarData,
  TrainerFormData,
  ApiResponse,
  PaginatedResponse,
} from '@/types/trainer';

// Configuration de base Axios
const api = axios.create({
  baseURL: '/api/organization',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erreur API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== Gestion des Formateurs ====================

/**
 * Récupérer la liste de tous les formateurs
 */
export const fetchTrainers = async (params?: {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Trainer>> => {
  const response = await api.get('/trainers', { params });
  return response.data;
};

/**
 * Récupérer les détails d'un formateur
 */
export const fetchTrainerDetails = async (
  uuid: string
): Promise<ApiResponse<{ trainer: TrainerDetails }>> => {
  const response = await api.get(`/trainers/${uuid}`);
  return response.data;
};

/**
 * Créer un nouveau formateur
 */
export const createTrainer = async (
  data: TrainerFormData
): Promise<ApiResponse<Trainer>> => {
  const formData = prepareFormData(data);
  const response = await api.post('/trainers', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Mettre à jour un formateur
 */
export const updateTrainer = async (
  uuid: string,
  data: TrainerFormData
): Promise<ApiResponse<Trainer>> => {
  const formData = prepareFormData(data);
  const response = await api.post(`/trainers/${uuid}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Supprimer un formateur
 */
export const deleteTrainer = async (
  uuid: string
): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/trainers/${uuid}`);
  return response.data;
};

// ==================== Sessions du Formateur ====================

/**
 * Récupérer les sessions assignées à un formateur
 */
export const fetchTrainerSessions = async (
  uuid: string,
  params?: {
    status?: 'upcoming' | 'ongoing' | 'completed';
    start_date?: string;
    end_date?: string;
  }
): Promise<ApiResponse<TrainerSession[]>> => {
  const response = await api.get(`/trainers/${uuid}/sessions`, { params });
  return response.data;
};

/**
 * Récupérer les formations assignées à un formateur
 */
export const fetchTrainerCourses = async (
  uuid: string
): Promise<ApiResponse<{ courses: TrainerCourse[]; total_courses: number }>> => {
  const response = await api.get(`/trainers/${uuid}/courses`);
  return response.data;
};

// ==================== Calendrier et Disponibilités ====================

/**
 * Récupérer le calendrier d'un formateur pour un mois donné
 */
export const fetchTrainerCalendar = async (
  uuid: string,
  year: number,
  month: number
): Promise<ApiResponse<CalendarData>> => {
  const response = await api.get(`/trainers/${uuid}/calendar`, {
    params: { year, month },
  });
  return response.data;
};

/**
 * Ajouter une période d'indisponibilité
 */
export const addTrainerUnavailability = async (
  uuid: string,
  data: {
    start_date: string;
    end_date: string;
    reason?: string;
    type?: 'unavailable' | 'vacation' | 'sick' | 'other';
  }
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/trainers/${uuid}/unavailability`, data);
  return response.data;
};

/**
 * Supprimer une période d'indisponibilité
 */
export const deleteTrainerUnavailability = async (
  uuid: string,
  unavailabilityId: number
): Promise<ApiResponse<null>> => {
  const response = await api.delete(
    `/trainers/${uuid}/unavailability/${unavailabilityId}`
  );
  return response.data;
};

// ==================== Documents ====================

/**
 * Uploader un document pour un formateur
 */
export const uploadTrainerDocument = async (
  uuid: string,
  file: File,
  documentType: string,
  documentName?: string
): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', documentType);
  if (documentName) {
    formData.append('name', documentName);
  }

  const response = await api.post(`/trainers/${uuid}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Supprimer un document
 */
export const deleteTrainerDocument = async (
  uuid: string,
  documentId: number
): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/trainers/${uuid}/documents/${documentId}`);
  return response.data;
};

// ==================== Évaluations ====================

/**
 * Évaluer un formateur
 */
export const evaluateTrainer = async (
  uuid: string,
  data: {
    rating: number;
    comment?: string;
    criteria?: Record<string, number>;
  }
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/trainers/${uuid}/evaluate`, data);
  return response.data;
};

// ==================== Statistiques ====================

/**
 * Récupérer les statistiques d'un formateur
 */
export const fetchTrainerStatistics = async (
  uuid: string,
  params?: {
    start_date?: string;
    end_date?: string;
  }
): Promise<ApiResponse<any>> => {
  const response = await api.get(`/trainers/${uuid}/statistics`, { params });
  return response.data;
};

// ==================== Helpers ====================

/**
 * Préparer les données du formulaire (avec fichier)
 */
const prepareFormData = (data: TrainerFormData): FormData => {
  const formData = new FormData();

  // Champs obligatoires
  formData.append('name', data.name);
  formData.append('email', data.email);

  // Champs optionnels
  if (data.first_name) formData.append('first_name', data.first_name);
  if (data.last_name) formData.append('last_name', data.last_name);
  if (data.phone) formData.append('phone', data.phone);
  if (data.address) formData.append('address', data.address);
  if (data.city) formData.append('city', data.city);
  if (data.postal_code) formData.append('postal_code', data.postal_code);
  if (data.country) formData.append('country', data.country);
  if (data.specialization) formData.append('specialization', data.specialization);
  if (data.experience_years !== undefined)
    formData.append('experience_years', String(data.experience_years));
  if (data.description) formData.append('description', data.description);
  if (data.bio) formData.append('bio', data.bio);
  if (data.linkedin_url) formData.append('linkedin_url', data.linkedin_url);
  if (data.internal_notes) formData.append('internal_notes', data.internal_notes);
  if (data.contract_type) formData.append('contract_type', data.contract_type);
  if (data.contract_start_date)
    formData.append('contract_start_date', data.contract_start_date);
  if (data.siret) formData.append('siret', data.siret);
  if (data.hourly_rate !== undefined)
    formData.append('hourly_rate', String(data.hourly_rate));
  if (data.daily_rate !== undefined)
    formData.append('daily_rate', String(data.daily_rate));
  if (data.status) formData.append('status', data.status);

  // Arrays
  if (data.competencies && data.competencies.length > 0) {
    data.competencies.forEach((comp, index) => {
      formData.append(`competencies[${index}]`, comp);
    });
  }

  if (data.certifications && data.certifications.length > 0) {
    data.certifications.forEach((cert, index) => {
      formData.append(`certifications[${index}]`, cert);
    });
  }

  // Availability schedule (object)
  if (data.availability_schedule) {
    formData.append(
      'availability_schedule',
      JSON.stringify(data.availability_schedule)
    );
  }

  // Avatar (file)
  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }

  return formData;
};

export default api;

