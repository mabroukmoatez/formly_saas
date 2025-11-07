// Types pour la gestion des formateurs

export type DayStatus = 'en_formation' | 'disponible' | 'indisponible';

export type SessionStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface CalendarData {
  year: number;
  month: number;
  days: Record<string, DayStatus>; // Format: "2025-01-15" => "en_formation"
  sessions: Array<{
    uuid: string;
    name: string;
    start_date: string;
    end_date: string;
    course_title?: string;
  }>;
  unavailabilities: Array<{
    id: number;
    start_date: string;
    end_date: string;
    reason?: string;
  }>;
}

export interface TrainerSession {
  uuid: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SessionStatus;
  completed_seances: number;
  total_seances: number;
  course?: {
    uuid: string;
    title: string;
    image?: string | null;
    description?: string;
  };
  progress?: number;
  students_count?: number;
}

export interface TrainerAvailability {
  id: number;
  trainer_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
  type: 'unavailable' | 'vacation' | 'sick' | 'other';
  created_at: string;
  updated_at: string;
}

export interface TrainerCourse {
  uuid: string;
  title: string;
  description?: string;
  image?: string | null;
  status: string;
  duration?: number;
  price?: number;
  source: 'course_trainers' | 'course_instructor';
  created_at: string;
  updated_at: string;
}

export interface TrainerDocument {
  id: number;
  name: string;
  type: string;
  file_url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface TrainerEvaluation {
  id: number;
  evaluator_name: string;
  rating: number;
  comment?: string;
  criteria?: Record<string, number>;
  evaluation_date: string;
}

export interface TrainerStats {
  total_sessions: number;
  total_courses: number;
  upcoming_sessions: number;
  ongoing_sessions: number;
  completed_sessions: number;
  average_rating: number;
  total_evaluations: number;
  total_documents: number;
  total_hours_taught: number;
}

export interface Trainer {
  id: number;
  uuid: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  avatar_url?: string | null;
  specialization?: string;
  experience_years?: number;
  description?: string;
  bio?: string;
  competencies?: string[];
  certifications?: string[];
  linkedin_url?: string;
  internal_notes?: string;
  contract_type?: string;
  contract_start_date?: string;
  siret?: string;
  hourly_rate?: number;
  daily_rate?: number;
  status: 'active' | 'inactive' | 'pending';
  average_rating: number;
  is_active: boolean;
  availability_schedule?: Record<string, string[]>;
  collaboration_start_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainerDetails extends Trainer {
  statistics: TrainerStats;
  documents: TrainerDocument[];
  evaluations: TrainerEvaluation[];
  unavailabilities: TrainerAvailability[];
}

// Types pour les formulaires
export interface TrainerFormData {
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  specialization?: string;
  experience_years?: number;
  description?: string;
  bio?: string;
  competencies?: string[];
  certifications?: string[];
  linkedin_url?: string;
  internal_notes?: string;
  contract_type?: string;
  contract_start_date?: string;
  siret?: string;
  hourly_rate?: number;
  daily_rate?: number;
  status?: 'active' | 'inactive' | 'pending';
  availability_schedule?: Record<string, string[]>;
  avatar?: File | null;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

