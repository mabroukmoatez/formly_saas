/**
 * Types for Trainers Management
 */

export interface Trainer {
  id?: number;
  uuid?: string;
  name?: string; // Pour compatibilité, mais préférer first_name + last_name
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  specialization?: string | null;
  experience_years?: number;
  description?: string | null;
  competencies?: string[];
  avatar?: string;
  avatar_url?: string;
  contract_type?: 'CDI' | 'CDD' | 'Freelance' | null;
  hourly_rate?: number | null;
  status?: 'active' | 'inactive' | 'pending';
  contract_start_date?: string | null;
  siret?: string | null;
  average_rating?: number;
  total_sessions?: number;
  total_courses?: number;
  created_at?: string;
  updated_at?: string;
  availability_schedule?: {
    [key: string]: string[]; // e.g., { "monday": ["09:00-12:00", "14:00-18:00"] }
  } | null;
}

export interface TrainerCalendarEvent {
  id: string;
  type: 'training' | 'unavailable' | 'available';
  title: string;
  start: string;
  end: string;
  session_id?: string;
  course_id?: string;
  course_name?: string;
}

export interface TrainerCalendar {
  events: TrainerCalendarEvent[];
  unavailable_periods: Array<{
    start: string;
    end: string;
    reason?: string;
  }>;
}

export interface TrainerTraining {
  id: string;
  course_name: string;
  session_name?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  start_date: string;
  end_date?: string;
  progress_percentage?: number;
  student_count?: number;
}

export interface TrainerDocument {
  id: number;
  name: string;
  type: string;
  file_path: string;
  file_size?: number;
  uploaded_at: string;
}

export interface TrainerEvaluation {
  id: number;
  evaluator_name: string;
  rating: number;
  comment?: string;
  evaluation_date: string;
  criteria?: {
    [key: string]: number;
  };
}

export interface TrainerQuestionnaire {
  id: number;
  questionnaire_id?: number;
  title: string;
  status: 'pending' | 'completed';
  sent_at: string;
  completed_at?: string;
  reminder_sent_at?: string;
  reminder_count?: number;
}

export interface TrainerStakeholder {
  id: number;
  trainer_id: number;
  type: 'internal' | 'external';
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainerStakeholderInteraction {
  id: number;
  stakeholder_id: number;
  interaction_type: 'email' | 'phone' | 'meeting' | 'note' | 'other';
  subject: string;
  notes?: string;
  interaction_date: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StakeholdersResponse {
  success: boolean;
  data: TrainerStakeholder[];
  message?: string;
}

export interface StakeholderInteractionsResponse {
  success: boolean;
  data: TrainerStakeholderInteraction[];
  message?: string;
}

export interface QuestionnairesResponse {
  success: boolean;
  data: TrainerQuestionnaire[];
  message?: string;
}

export interface TrainerCourse {
  id?: number;
  uuid: string;
  title: string;
  description?: string;
  image_url?: string;
  category?: string;
  status?: number | string; // Le backend peut retourner un nombre (1) ou une chaîne
  duration?: number;
  price?: string;
  source?: string;
  total_sessions?: number;
  total_students?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TrainerCoursesResponse {
  success: boolean;
  data: {
    courses: TrainerCourse[];
    total_courses?: number;
  };
  message?: string;
}

export interface TrainerStats {
  total_trainings: number;
  upcoming_trainings: number;
  ongoing_trainings: number;
  completed_trainings: number;
  average_rating: number;
  total_students: number;
}

export interface TrainerListResponse {
  success: boolean;
  data: Trainer[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface TrainerDetailsResponse {
  success: boolean;
  data: {
    trainer: Trainer;
    stats?: TrainerStats;
    trainings?: TrainerTraining[];
    documents?: TrainerDocument[];
    evaluations?: TrainerEvaluation[];
    questionnaires?: TrainerQuestionnaire[];
  };
}

export interface TrainerCalendarResponse {
  success: boolean;
  data: TrainerCalendar;
}

export interface CreateTrainerData {
  name?: string; // Pour compatibilité
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
  competencies?: string[];
  contract_type?: 'CDI' | 'CDD' | 'Freelance';
  hourly_rate?: number;
  status?: 'active' | 'inactive' | 'pending';
  password?: string;
  password_confirmation?: string;
  permissions?: {
    can_create_courses?: boolean;
    can_manage_students?: boolean;
    can_view_analytics?: boolean;
    can_evaluate_students?: boolean;
  };
  availability_schedule?: {
    [key: string]: string[];
  };
  avatar?: File; // Pour upload
  // Informations administratives
  contract_start_date?: string;
  siret?: string;
}

export interface UpdateTrainerData extends Partial<CreateTrainerData> {}

export interface TrainerEvaluationData {
  rating: number;
  comment?: string;
  criteria?: {
    [key: string]: number;
  };
}

