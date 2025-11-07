// Types pour le système d'événements

export interface Event {
  id: string;
  title: string;
  category: string;
  description: string;
  short_description: string;
  start_date: string;
  end_date: string;
  location?: string;
  image_url?: string;
  organizer: {
    id: number; // L'API retourne un number, pas un string
    name: string;
    email: string;
    avatar_url?: string;
  };
  attendees_count: number;
  max_attendees?: number;
  status: 'À venir' | 'En cours' | 'Terminé' | 'Annulé'; // Statuts en français comme retournés par l'API
  is_registered: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventDetails extends Event {
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    registered_at: string;
  }>;
  registration_deadline?: string;
  tags?: string[];
  views_count?: number;
  shares_count?: number;
  saves_count?: number;
}

export interface EventsListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'all';
  startDate?: string;
  endDate?: string;
  organizerId?: string;
  sortBy?: 'date' | 'title' | 'attendees' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface EventsListResponse {
  events: Event[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface EventDetailsResponse {
  success: boolean;
  data: EventDetails;
  message: string;
}

export interface CreateEventData {
  // Champs obligatoires
  title: string;
  category: string;
  description: string;
  short_description: string;
  start_date: string;
  end_date: string;
  
  // Champs optionnels
  location?: string;
  location_type?: 'physical' | 'online' | 'hybrid';
  meeting_link?: string;
  event_type?: 'training' | 'conference' | 'meeting' | 'exam' | 'webinar' | 'workshop' | 'seminar' | 'other';
  max_attendees?: number;
  registration_deadline?: string;
  tags?: string[];
  is_visible_to_students?: boolean;
  status?: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image_url?: string; // URL de l'image uploadée
  
  // Champ image (pour compatibilité future)
  image?: File;
}

export interface UpdateEventData {
  // Champs obligatoires
  title?: string;
  category?: string;
  description?: string;
  short_description?: string;
  start_date?: string;
  end_date?: string;
  
  // Champs optionnels
  location?: string;
  location_type?: 'physical' | 'online' | 'hybrid';
  meeting_link?: string;
  event_type?: 'training' | 'conference' | 'meeting' | 'exam' | 'webinar' | 'workshop' | 'seminar' | 'other';
  max_attendees?: number;
  registration_deadline?: string;
  tags?: string[];
  is_visible_to_students?: boolean;
  status?: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image_url?: string; // URL de l'image uploadée
  
  // Champ image (pour compatibilité future)
  image?: File;
}

export interface EventStatistics {
  total_attendees: number;
  attendance_rate: number;
  registrations_over_time: Array<{
    date: string;
    count: number;
  }>;
  demographics: {
    by_role: Record<string, number>;
    by_department?: Record<string, number>;
  };
  engagement: {
    views: number;
    shares: number;
    saves: number;
  };
}

export interface EventStatisticsResponse {
  success: boolean;
  data: EventStatistics;
  message: string;
}

export interface UploadImageResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
    size: number;
    dimensions: {
      width: number;
      height: number;
    };
  };
  message: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: string[];
    event_types: Record<string, string>;
    statuses: Record<string, string>;
    location_types: Record<string, string>;
  };
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
}

