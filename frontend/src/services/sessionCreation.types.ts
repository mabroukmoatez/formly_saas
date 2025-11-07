// Session Creation Types based on sessions.md API documentation

export interface SessionCreationFormData {
  // Step 1: Session Information
  title: string;
  subtitle: string;
  description: string;
  category_id: number | null;
  session_language_id: number | null;
  difficulty_level_id: number | null;
  price: number;
  price_ht: number;
  vat_percentage: number;
  currency: string;
  duration: string;
  duration_days: number;
  session_start_date: string;
  session_end_date: string;
  session_start_time: string;
  session_end_time: string;
  max_participants: number;
  target_audience: string;
  prerequisites: string;
  key_points: Array<{ name: string }>;
  trainer_ids: string[];
  isPublished: boolean;
  isDraft: boolean;
  sessionUuid?: string;
}

export interface SessionInstance {
  uuid: string;
  session_uuid: string;
  instance_type: 'presentiel' | 'distanciel' | 'e-learning';
  start_date: string;
  start_time: string;
  end_time?: string;
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  location_country?: string;
  location_building?: string;
  location_room?: string;
  platform_type?: string;
  meeting_link?: string;
  meeting_password?: string;
  elearning_platform?: string;
  elearning_link?: string;
  access_start_date?: string;
  access_end_date?: string;
  is_self_paced?: boolean;
  max_participants?: number;
  current_participants?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  trainer_ids?: string[];
  is_cancelled?: boolean;
  cancellation_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionParticipant {
  id: number;
  uuid: string;
  user_id: number;
  session_uuid: string;
  enrollment_date: string;
  status: 'enrolled' | 'active' | 'completed' | 'suspended' | 'cancelled';
  progress_percentage: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  attendances?: SessionAttendance[];
  created_at?: string;
  updated_at?: string;
}

export interface SessionAttendance {
  uuid: string;
  participant_id: number;
  instance_uuid: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionChapter {
  uuid: string;
  session_uuid: string;
  title: string;
  description?: string;
  order: number;
  sub_chapters?: SessionSubChapter[];
  created_at?: string;
  updated_at?: string;
}

export interface SessionSubChapter {
  uuid: string;
  chapter_uuid: string;
  title: string;
  description?: string;
  order: number;
  content?: SessionContent[];
  created_at?: string;
  updated_at?: string;
}

export interface SessionContent {
  uuid: string;
  type: 'video' | 'text' | 'image';
  title?: string;
  content?: string;
  file_url?: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SessionDocument {
  uuid: string;
  session_uuid: string;
  name: string;
  description?: string;
  category: 'syllabus' | 'handout' | 'reference';
  file_url: string;
  file_size?: number;
  mime_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionTrainer {
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience_years: number;
  description?: string;
  competencies: string[];
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionCategory {
  id: number;
  name: string;
  slug?: string;
  image_url?: string;
  sessions_count?: number;
}

export interface SessionLanguage {
  id: number;
  name: string;
  code: string;
}

export interface SessionDifficultyLevel {
  id: number;
  name: string;
  description?: string;
}

export interface SessionMetadata {
  categories: SessionCategory[];
  languages: SessionLanguage[];
  difficulty_levels: SessionDifficultyLevel[];
  currencies: Array<{ code: string; name: string; symbol: string }>;
}

// Create/Update Data Types
export type CreateSessionInstanceData = Omit<SessionInstance, 'uuid' | 'session_uuid' | 'created_at' | 'updated_at'>;
export type UpdateSessionInstanceData = Partial<CreateSessionInstanceData>;

export type CreateSessionParticipantData = Omit<SessionParticipant, 'id' | 'uuid' | 'session_uuid' | 'created_at' | 'updated_at'>;
export type UpdateSessionParticipantData = Partial<CreateSessionParticipantData>;

export type CreateSessionChapterData = Omit<SessionChapter, 'uuid' | 'session_uuid' | 'created_at' | 'updated_at'>;
export type UpdateSessionChapterData = Partial<CreateSessionChapterData>;

export type CreateSessionSubChapterData = Omit<SessionSubChapter, 'uuid' | 'created_at' | 'updated_at'> & { chapter_uuid?: string };
export type UpdateSessionSubChapterData = Partial<CreateSessionSubChapterData>;

export type CreateSessionContentData = Omit<SessionContent, 'uuid' | 'created_at' | 'updated_at'> & { chapter_uuid?: string };
export type UpdateSessionContentData = Partial<CreateSessionContentData>;

export type CreateSessionDocumentData = Omit<SessionDocument, 'uuid' | 'session_uuid' | 'created_at' | 'updated_at'> & { file: File };
export type UpdateSessionDocumentData = Partial<CreateSessionDocumentData>;

export type CreateSessionTrainerData = {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience_years: number;
  description?: string;
  competencies: string[];
  avatar?: File;
};
export type UpdateSessionTrainerData = Partial<CreateSessionTrainerData>;

// Instance generation data types
export interface InstanceGenerationData {
  instance_type: 'presentiel' | 'distanciel' | 'e-learning';
  has_recurrence: boolean;
  recurrence_start_date?: string;
  recurrence_end_date?: string;
  selected_days?: number[]; // 0=Sunday, 1=Monday, etc.
  time_slots?: string[]; // morning, afternoon, evening, full_day
  start_date?: string;
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  location_country?: string;
  location_building?: string;
  location_room?: string;
  platform_type?: string;
  meeting_link?: string;
  meeting_password?: string;
  elearning_platform?: string;
  elearning_link?: string;
  access_start_date?: string;
  access_end_date?: string;
  is_self_paced?: boolean;
  max_participants?: number;
  trainer_ids?: string[];
}

// Time slot definitions
export const TIME_SLOTS = {
  morning: { label: 'Matin (09:00-12:00)', duration: 3 },
  afternoon: { label: 'Après-midi (14:00-17:00)', duration: 3 },
  evening: { label: 'Soirée (18:00-21:00)', duration: 3 },
  full_day: { label: 'Journée complète (09:00-17:00)', duration: 8 }
} as const;

// Day numbers for recurrence
export const DAYS_OF_WEEK = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi'
} as const;
