import { apiService } from './api';
import {
  Event,
  EventsListParams,
  EventsListResponse,
  EventDetailsResponse,
  CreateEventData,
  UpdateEventData,
  EventStatisticsResponse,
  UploadImageResponse,
  ApiResponse,
  CategoriesResponse
} from './events.types';

/**
 * Service pour gérer les événements
 */
class EventsService {
  /**
   * Récupère la liste des événements avec pagination et filtres
   */
  async getEvents(params?: EventsListParams): Promise<EventsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.organizerId) queryParams.append('organizerId', params.organizerId);

    const endpoint = '/api/events' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const response = await apiService.get<{ success: boolean; data: EventsListResponse }>(endpoint);
    return response.data;
  }

  /**
   * Récupère les détails d'un événement
   */
  async getEventById(eventId: string): Promise<EventDetailsResponse> {
    const response = await apiService.get<EventDetailsResponse>(`/api/events/${eventId}`);
    return response;
  }

  /**
   * Crée un nouvel événement
   */
  async createEvent(data: CreateEventData): Promise<ApiResponse<Event>> {
    // Créer FormData pour supporter l'upload d'image
    const formData = new FormData();
    
    // Ajouter les champs obligatoires
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('description', data.description);
    formData.append('short_description', data.short_description);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    
    // Ajouter les champs optionnels
    if (data.location) formData.append('location', data.location);
    if (data.location_type) formData.append('location_type', data.location_type);
    if (data.meeting_link) formData.append('meeting_link', data.meeting_link);
    if (data.event_type) formData.append('event_type', data.event_type);
    if (data.max_attendees) formData.append('max_attendees', data.max_attendees.toString());
    if (data.registration_deadline) formData.append('registration_deadline', data.registration_deadline);
    if (data.status) formData.append('status', data.status);
    if (data.is_visible_to_students !== undefined) {
      formData.append('is_visible_to_students', data.is_visible_to_students ? '1' : '0');
    }
    
    // Ajouter les tags (array)
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => formData.append('tags[]', tag));
    }
    
    // Ajouter l'image si fournie
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiService.post<ApiResponse<Event>>('/api/events', formData);
    return response;
  }

  /**
   * Modifie un événement existant
   */
  async updateEvent(eventId: string, data: UpdateEventData): Promise<ApiResponse<Event>> {
    const formData = new FormData();
    
    // Ajouter tous les champs fournis
    if (data.title) formData.append('title', data.title);
    if (data.category) formData.append('category', data.category);
    if (data.description) formData.append('description', data.description);
    if (data.short_description) formData.append('short_description', data.short_description);
    if (data.start_date) formData.append('start_date', data.start_date);
    if (data.end_date) formData.append('end_date', data.end_date);
    // Ajouter les champs optionnels
    if (data.location) formData.append('location', data.location);
    if (data.location_type) formData.append('location_type', data.location_type);
    if (data.meeting_link) formData.append('meeting_link', data.meeting_link);
    if (data.event_type) formData.append('event_type', data.event_type);
    if (data.max_attendees) formData.append('max_attendees', data.max_attendees.toString());
    if (data.registration_deadline) formData.append('registration_deadline', data.registration_deadline);
    if (data.status) formData.append('status', data.status);
    if (data.is_visible_to_students !== undefined) {
      formData.append('is_visible_to_students', data.is_visible_to_students ? '1' : '0');
    }
    
    // Ajouter les tags (array) - format correct selon la documentation
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => formData.append('tags[]', tag));
    }
    
    // Ajouter l'image si fournie
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiService.put<ApiResponse<Event>>(`/api/events/${eventId}`, formData);
    return response;
  }

  /**
   * Supprime un événement
   */
  async deleteEvent(eventId: string): Promise<ApiResponse> {
    const response = await apiService.delete<ApiResponse>(`/api/events/${eventId}`);
    return response;
  }

  /**
   * S'inscrit à un événement
   */
  async registerToEvent(eventId: string): Promise<ApiResponse> {
    const response = await apiService.post<ApiResponse>(`/api/events/${eventId}/register`);
    return response;
  }

  /**
   * Se désinscrit d'un événement
   */
  async unregisterFromEvent(eventId: string): Promise<ApiResponse> {
    const response = await apiService.delete<ApiResponse>(`/api/events/${eventId}/register`);
    return response;
  }

  /**
   * Récupère la liste des participants
   */
  async getEventAttendees(eventId: string, page: number = 1, limit: number = 20): Promise<ApiResponse> {
    const endpoint = `/api/events/${eventId}/attendees?page=${page}&limit=${limit}`;
    const response = await apiService.get<ApiResponse>(endpoint);
    return response;
  }

  /**
   * Récupère les statistiques d'un événement
   */
  async getEventStatistics(eventId: string): Promise<EventStatisticsResponse> {
    const response = await apiService.get<EventStatisticsResponse>(`/api/events/${eventId}/statistics`);
    return response;
  }

  /**
   * Récupère les catégories d'événements disponibles
   */
  async getCategories(): Promise<CategoriesResponse> {
    const response = await apiService.get<CategoriesResponse>('/api/events/categories');
    return response;
  }

  /**
   * Upload une image pour un événement
   */
  async uploadImage(image: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('image', image);

    const response = await apiService.post<UploadImageResponse>('/api/events/upload-image', formData);
    return response;
  }
}

// Export singleton
export const eventsService = new EventsService();
export default eventsService;

