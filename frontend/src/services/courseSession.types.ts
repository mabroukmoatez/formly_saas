/**
 * Course Session Types
 * 
 * Architecture Correcte:
 * - Un COURS (Course) est le modèle/template avec le contenu pédagogique
 * - Une SESSION (CourseSession) est une instance planifiée d'un cours
 * - Une SÉANCE (SessionSlot) est un créneau individuel de la session
 * 
 * Flux: Course → CourseSession → SessionSlot → Participants
 */

// ==================== ENUMS ====================

export type SessionStatus = 
  | 'draft' 
  | 'planned' 
  | 'open' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'postponed';

export type SessionType = 'intra' | 'inter' | 'individual';

export type DeliveryMode = 'presentiel' | 'distanciel' | 'hybrid' | 'e-learning';

export type SlotInstanceType = 'presentiel' | 'distanciel' | 'e-learning';

export type ParticipantPaymentType = 'Particulier' | 'Entreprise' | 'OPCO';

export type SlotStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// ==================== COURSES (Pour la sélection) ====================

export interface AvailableCourse {
  id: number;
  uuid: string;
  title: string;
  subtitle?: string;
  description?: string;
  duration: number; // heures
  duration_days?: number;
  price: number;
  price_ht?: number;
  image_url?: string;
  category?: {
    id: number;
    name: string;
  };
  language?: string;
  difficulty_level?: string;
  sessions_count: number;
  upcoming_sessions_count: number;
}

// ==================== SESSION LOCATION ====================

export interface SessionLocation {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  room?: string | null;
  full?: string | null;
}

export interface SessionOnline {
  platform_type?: string | null;
  meeting_link?: string | null;
}

// ==================== SESSION PARTICIPANTS ====================

export interface SessionParticipantsInfo {
  min: number;
  max: number;
  confirmed: number;
  available_spots: number;
  is_full: boolean;
  waitlist_count?: number;
}

// ==================== SESSION PRICING ====================

export interface SessionPricing {
  price_ht?: number | null;
  price_ttc?: number | null;
  effective_price?: number | null;
  vat_rate?: number | null;
  currency: string;
  pricing_type: 'per_person' | 'per_session';
}

// ==================== SESSION TRAINER ====================

export interface SessionTrainer {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  role?: string;
  is_primary: boolean;
}

// ==================== SESSION SLOT (SÉANCE) ====================

export interface SessionSlot {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  instance_type: SlotInstanceType;
  start_date: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number;
  status: SlotStatus;
  location_room?: string;
  trainer_uuids?: string[];
}

// ==================== COURSE SESSION (MAIN TYPE) ====================

export interface CourseSession {
  id: number;
  uuid: string;
  reference_code: string;
  title?: string | null;
  display_title: string;
  description?: string | null;
  session_type: SessionType;
  delivery_mode: DeliveryMode;
  start_date: string;
  end_date: string;
  default_start_time?: string | null;
  default_end_time?: string | null;
  total_hours?: number | null;
  total_days?: number | null;
  location: SessionLocation;
  online: SessionOnline;
  participants: SessionParticipantsInfo;
  pricing: SessionPricing;
  status: SessionStatus;
  is_published: boolean;
  is_registration_open: boolean;
  registration_deadline?: string | null;
  can_register: boolean;
  course?: {
    id: number;
    uuid: string;
    title: string;
    subtitle?: string;
    image_url?: string;
    duration?: number;
    category?: string;
  } | null;
  trainers: SessionTrainer[];
  slots: SessionSlot[];
  slots_count: number;
  internal_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== SESSION LIST ITEM (Vue résumée) ====================

export interface CourseSessionListItem {
  id: number;
  uuid: string;
  reference_code: string;
  title?: string | null;
  display_title: string;
  session_type: SessionType;
  delivery_mode: DeliveryMode;
  start_date: string;
  end_date: string;
  status: SessionStatus;
  participants: {
    min: number;
    max: number;
    confirmed: number;
    available_spots: number;
    is_full: boolean;
  };
  course?: {
    id: number;
    uuid: string;
    title: string;
    image_url?: string;
  };
  trainers: Array<{
    id: number;
    name: string;
    is_primary: boolean;
  }>;
}

// ==================== CREATE SESSION DATA ====================

export interface CreateCourseSessionData {
  course_uuid: string; // REQUIRED - UUID du cours de base
  title?: string | null;
  description?: string;
  session_type: SessionType;
  delivery_mode: DeliveryMode;
  start_date: string;
  end_date: string;
  default_start_time?: string;
  default_end_time?: string;
  total_hours?: number;
  total_days?: number;
  // Location (présentiel)
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  location_room?: string;
  // Online (distanciel)
  platform_type?: string;
  meeting_link?: string;
  // Participants
  min_participants?: number;
  max_participants?: number;
  // Pricing
  price_ht?: number | null; // null = utilise le prix du cours
  vat_rate?: number;
  pricing_type?: 'per_person' | 'per_session';
  // Status
  status?: SessionStatus;
  is_published?: boolean;
  is_registration_open?: boolean;
  registration_deadline?: string;
  // Trainers
  trainer_uuids?: string[];
  primary_trainer_uuid?: string;
  // Notes
  internal_notes?: string;
}

export type UpdateCourseSessionData = Partial<CreateCourseSessionData>;

// ==================== SLOT OPERATIONS ====================

export interface CreateSlotData {
  title?: string;
  description?: string;
  instance_type: SlotInstanceType;
  start_date: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  location_room?: string;
  trainer_uuids?: string[];
}

export interface GenerateSlotsData {
  pattern: 'daily' | 'weekly';
  start_time: string;
  end_time: string;
  instance_type: SlotInstanceType;
  days_of_week?: number[]; // Pour pattern weekly: 0=Dimanche, 1=Lundi, ..., 6=Samedi
}

// ==================== PARTICIPANT OPERATIONS ====================

export interface SessionParticipant {
  id: number;
  uuid: string;
  user_id: number;
  tarif?: number;
  type?: ParticipantPaymentType;
  notes?: string;
  status: 'enrolled' | 'active' | 'completed' | 'suspended' | 'cancelled';
  enrollment_date: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface AddParticipantData {
  user_id: number;
  tarif?: number;
  type?: ParticipantPaymentType;
  notes?: string;
}

// ==================== PLANNING / CALENDAR ====================

export interface PlanningStats {
  total_sessions: number;
  total_slots: number;
  sessions_by_status: Record<SessionStatus, number>;
  sessions_by_delivery_mode: Record<DeliveryMode, number>;
  total_participants: number;
  total_capacity: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor: string;
  extendedProps: {
    course_id?: number;
    course_title: string;
    status: SessionStatus;
    delivery_mode: DeliveryMode;
    location?: string;
    participants: string;
    trainers: string[];
  };
}

export interface PlanningResponse {
  stats: PlanningStats;
  sessions: CourseSessionListItem[];
  slots: SessionSlot[];
  calendar_events: CalendarEvent[];
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ==================== FILTER PARAMS ====================

export interface CourseSessionFilters {
  status?: SessionStatus;
  course_id?: number;
  delivery_mode?: DeliveryMode;
  session_type?: SessionType;
  start_date?: string;
  end_date?: string;
  upcoming?: boolean;
  search?: string;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==================== STATUS COLORS ====================

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  draft: '#6b7280',      // gray
  planned: '#3b82f6',    // blue
  open: '#10b981',       // green
  confirmed: '#059669',  // dark green
  in_progress: '#f59e0b', // orange
  completed: '#8b5cf6',  // purple
  cancelled: '#ef4444',  // red
  postponed: '#f97316',  // orange
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  open: 'Inscriptions ouvertes',
  confirmed: 'Confirmée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  postponed: 'Reportée',
};

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  presentiel: 'Présentiel',
  distanciel: 'À distance',
  hybrid: 'Hybride',
  'e-learning': 'E-learning',
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  inter: 'Inter-entreprises',
  intra: 'Intra-entreprise',
  individual: 'Individuel',
};



