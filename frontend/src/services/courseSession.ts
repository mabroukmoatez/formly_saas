/**
 * Course Session API Service
 * 
 * Service pour gérer les sessions de formation basées sur des cours.
 * 
 * Architecture:
 * - Course (Cours) = Template/Modèle de formation
 * - CourseSession = Instance planifiée d'un cours
 * - SessionSlot = Créneau/Séance individuelle
 * 
 * @see Backend docs: docs/COURSE_SESSIONS_API.md
 */

import { apiService } from './api';
import type {
  AvailableCourse,
  CourseSession,
  CourseSessionListItem,
  CreateCourseSessionData,
  UpdateCourseSessionData,
  SessionSlot,
  CreateSlotData,
  GenerateSlotsData,
  SessionParticipant,
  AddParticipantData,
  CourseSessionFilters,
  PlanningResponse,
  ApiResponse,
  PaginatedResponse,
} from './courseSession.types';

const BASE_URL = '/api/admin/organization';
const SESSIONS_URL = `${BASE_URL}/course-sessions`;

class CourseSessionService {
  // ==================== COURSES (Pour la sélection) ====================

  /**
   * Récupère la liste des cours disponibles pour créer une session
   */
  async getAvailableCourses(): Promise<ApiResponse<AvailableCourse[]>> {
    return apiService.get(`${BASE_URL}/courses/available`);
  }

  /**
   * Récupère les détails d'un cours pour pré-remplir la création de session
   */
  async getCourseDetails(courseUuid: string): Promise<ApiResponse<AvailableCourse>> {
    return apiService.get(`${BASE_URL}/courses/${courseUuid}`);
  }

  // ==================== COURSE SESSIONS CRUD ====================

  /**
   * Liste toutes les sessions avec filtres optionnels
   */
  async listSessions(filters?: CourseSessionFilters): Promise<PaginatedResponse<CourseSessionListItem>> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.course_id) params.append('course_id', String(filters.course_id));
    if (filters?.delivery_mode) params.append('delivery_mode', filters.delivery_mode);
    if (filters?.session_type) params.append('session_type', filters.session_type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.upcoming !== undefined) params.append('upcoming', String(filters.upcoming));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    return apiService.get(`${SESSIONS_URL}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Récupère les détails complets d'une session
   */
  async getSession(uuid: string): Promise<ApiResponse<CourseSession>> {
    return apiService.get(`${SESSIONS_URL}/${uuid}`);
  }

  /**
   * Crée une nouvelle session basée sur un cours
   */
  async createSession(data: CreateCourseSessionData): Promise<ApiResponse<CourseSession>> {
    return apiService.post(SESSIONS_URL, data);
  }

  /**
   * Met à jour une session existante
   */
  async updateSession(uuid: string, data: UpdateCourseSessionData): Promise<ApiResponse<CourseSession>> {
    return apiService.put(`${SESSIONS_URL}/${uuid}`, data);
  }

  /**
   * Supprime une session (uniquement si pas de participants)
   */
  async deleteSession(uuid: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${SESSIONS_URL}/${uuid}`);
  }

  /**
   * Annule une session avec une raison
   */
  async cancelSession(uuid: string, reason: string): Promise<ApiResponse<CourseSession>> {
    return apiService.post(`${SESSIONS_URL}/${uuid}/cancel`, { reason });
  }

  // ==================== SESSION SLOTS (SÉANCES) ====================

  /**
   * Récupère les séances d'une session
   */
  async getSlots(sessionUuid: string): Promise<ApiResponse<SessionSlot[]>> {
    return apiService.get(`${SESSIONS_URL}/${sessionUuid}/slots`);
  }

  /**
   * Crée une séance individuelle
   */
  async createSlot(sessionUuid: string, data: CreateSlotData): Promise<ApiResponse<SessionSlot>> {
    return apiService.post(`${SESSIONS_URL}/${sessionUuid}/slots`, data);
  }

  /**
   * Met à jour une séance
   */
  async updateSlot(sessionUuid: string, slotUuid: string, data: Partial<CreateSlotData>): Promise<ApiResponse<SessionSlot>> {
    return apiService.put(`${SESSIONS_URL}/${sessionUuid}/slots/${slotUuid}`, data);
  }

  /**
   * Supprime une séance
   */
  async deleteSlot(sessionUuid: string, slotUuid: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${SESSIONS_URL}/${sessionUuid}/slots/${slotUuid}`);
  }

  /**
   * Génère automatiquement les séances selon un pattern
   */
  async generateSlots(sessionUuid: string, data: GenerateSlotsData): Promise<ApiResponse<SessionSlot[]>> {
    return apiService.post(`${SESSIONS_URL}/${sessionUuid}/generate-slots`, data);
  }

  // ==================== PARTICIPANTS ====================

  /**
   * Récupère les participants d'une session
   */
  async getParticipants(sessionUuid: string): Promise<ApiResponse<SessionParticipant[]>> {
    return apiService.get(`${SESSIONS_URL}/${sessionUuid}/participants`);
  }

  /**
   * Ajoute un participant à une session
   */
  async addParticipant(sessionUuid: string, data: AddParticipantData): Promise<ApiResponse<SessionParticipant>> {
    return apiService.post(`${SESSIONS_URL}/${sessionUuid}/participants`, data);
  }

  /**
   * Met à jour un participant
   */
  async updateParticipant(
    sessionUuid: string, 
    participantUuid: string, 
    data: Partial<AddParticipantData>
  ): Promise<ApiResponse<SessionParticipant>> {
    return apiService.put(`${SESSIONS_URL}/${sessionUuid}/participants/${participantUuid}`, data);
  }

  /**
   * Retire un participant de la session
   */
  async removeParticipant(sessionUuid: string, participantUuid: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${SESSIONS_URL}/${sessionUuid}/participants/${participantUuid}`);
  }

  // ==================== PLANNING / CALENDAR ====================

  /**
   * Récupère la vue planning avec statistiques et événements calendrier
   */
  async getPlanning(params?: { start_date?: string; end_date?: string }): Promise<ApiResponse<PlanningResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    return apiService.get(`${SESSIONS_URL}/planning${queryString ? `?${queryString}` : ''}`);
  }

  // ==================== TRAINERS ====================

  /**
   * Récupère les formateurs disponibles
   */
  async getAvailableTrainers(params?: { search?: string; per_page?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    
    const queryString = queryParams.toString();
    return apiService.get(`${BASE_URL}/trainers${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Assigne un formateur à une session
   */
  async assignTrainer(sessionUuid: string, trainerUuid: string, isPrimary: boolean = false): Promise<any> {
    return apiService.post(`${SESSIONS_URL}/${sessionUuid}/trainers`, {
      trainer_uuid: trainerUuid,
      is_primary: isPrimary,
    });
  }

  /**
   * Retire un formateur de la session
   */
  async removeTrainer(sessionUuid: string, trainerUuid: string): Promise<any> {
    return apiService.delete(`${SESSIONS_URL}/${sessionUuid}/trainers/${trainerUuid}`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Récupère les utilisateurs disponibles pour l'inscription (étudiants)
   */
  async getAvailableUsers(params?: { search?: string; per_page?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('role', 'student');
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    
    const queryString = queryParams.toString();
    return apiService.get(`${BASE_URL}/users?${queryString}`);
  }
}

// Export singleton instance
export const courseSessionService = new CourseSessionService();
export default courseSessionService;



