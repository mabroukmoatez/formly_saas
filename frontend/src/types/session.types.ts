/**
 * Session Creation Types
 * 
 * Strict TypeScript types for session creation flow.
 * Replaces `any` types with proper interfaces.
 */

// ==================== ENUMS & CONSTANTS ====================

export const FORMATION_ACTIONS = [
  "Actions de formation",
  "Bilan de compétences",
  "VAE (Validation des Acquis de l'Expérience)",
  "Actions de formation par apprentissage",
  "Autre..."
] as const;

export type FormationAction = typeof FORMATION_ACTIONS[number];

export const SESSION_STATUSES = [
  'draft',
  'planned', 
  'open',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'postponed'
] as const;

export type SessionStatus = typeof SESSION_STATUSES[number];

export const SESSION_TYPES = ['intra', 'inter', 'individual'] as const;
export type SessionType = typeof SESSION_TYPES[number];

export const DELIVERY_MODES = ['presentiel', 'distanciel', 'hybrid', 'e-learning'] as const;
export type DeliveryMode = typeof DELIVERY_MODES[number];

export const INSTANCE_TYPES = ['presentiel', 'distanciel', 'e-learning'] as const;
export type InstanceType = typeof INSTANCE_TYPES[number];

// ==================== FORM DATA ====================

export interface SessionFormData {
  // Basic info
  title: string;
  subtitle: string;
  description: string;
  formation_action: FormationAction;
  
  // Classification
  category_id: number | null;
  subcategory_id: number | null;
  session_language_id: number | null;
  difficulty_level_id: number | null;
  
  // Pricing
  price: number;
  price_ht: number;
  vat_percentage: number;
  currency: string;
  
  // Duration
  duration: number;
  duration_days: number;
  
  // Session-specific dates
  session_start_date: string;
  session_end_date: string;
  session_start_time: string;
  session_end_time: string;
  max_participants: number;
  
  // Content
  target_audience: string;
  prerequisites: string;
  methods: string;
  specifics: string;
  evaluation_modalities: string;
  access_modalities: string;
  accessibility: string;
  contacts: string;
  update_date: string;
  
  // Related data
  key_points: KeyPoint[];
  trainer_ids: string[];
  formation_practice_ids: number[];
  tags: Tag[];
  
  // Media
  intro_video: File | null;
  intro_image: File | null;
  intro_video_url: string;
  intro_image_url: string;
  youtube_video_id: string;
  
  // State
  isPublished: boolean;
  isDraft: boolean;
  
  // UUIDs
  sessionUuid?: string;
  courseUuid?: string;
}

export interface KeyPoint {
  id?: number;
  name: string;
}

export interface Tag {
  id?: number;
  name: string;
}

// ==================== METADATA ====================

export interface SessionMetadata {
  categories: Category[];
  subcategories: Subcategory[];
  languages: Language[];
  difficultyLevels: DifficultyLevel[];
  formationPractices: FormationPractice[];
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  image_url?: string;
  is_custom: boolean;
}

export interface Subcategory {
  id: number;
  uuid: string;
  name: string;
  category_id: number;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}

export interface DifficultyLevel {
  id: number;
  name: string;
  order: number;
}

export interface FormationPractice {
  id: number;
  name: string;
  description?: string;
}

// ==================== INSTANCES (SÉANCES) ====================

export interface SessionInstance {
  uuid: string;
  session_uuid: string;
  instance_type: InstanceType;
  start_date: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  
  // Location (présentiel)
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  location_country?: string;
  location_building?: string;
  location_room?: string;
  
  // Online (distanciel)
  platform_type?: string;
  meeting_link?: string;
  meeting_password?: string;
  
  // E-learning
  elearning_platform?: string;
  elearning_link?: string;
  access_start_date?: string;
  access_end_date?: string;
  is_self_paced?: boolean;
  
  // Participants
  max_participants?: number;
  current_participants?: number;
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_cancelled?: boolean;
  cancellation_reason?: string;
  
  // Trainers
  trainer_ids?: string[];
}

export interface InstanceGenerationPayload {
  instance_type: InstanceType;
  has_recurrence: boolean;
  start_date: string;
  end_date?: string;
  selected_days?: number[];
  time_slots?: string[];
  trainer_ids?: string[];
  include_weekend?: boolean;
  
  // Location
  location_address?: string;
  
  // Online
  platform_type?: string;
  meeting_link?: string;
}

// ==================== PARTICIPANTS ====================

export interface SessionParticipant {
  id: number;
  uuid: string;
  user_id: number;
  session_uuid: string;
  enrollment_date: string;
  status: ParticipantStatus;
  progress_percentage: number;
  tarif?: number;
  type?: ParticipantType;
  notes?: string;
  
  user?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export type ParticipantStatus = 
  | 'registered'
  | 'enrolled' 
  | 'active' 
  | 'completed' 
  | 'suspended' 
  | 'cancelled';

export type ParticipantType = 'Particulier' | 'Entreprise' | 'OPCO';

// ==================== CHAPTERS & CONTENT ====================

export interface Chapter {
  id: number;
  uuid: string;
  course_uuid: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  
  sub_chapters: SubChapter[];
  content: ContentItem[];
  evaluations: Evaluation[];
  support_files: SupportFile[];
}

export interface SubChapter {
  id: number;
  uuid: string;
  chapter_uuid: string;
  title: string;
  description?: string;
  order_index: number;
  
  content: ContentItem[];
  evaluations: Evaluation[];
  support_files: SupportFile[];
}

export interface ContentItem {
  id: number;
  uuid: string;
  chapter_id?: string;
  sub_chapter_id?: string;
  type: ContentType;
  title: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  order_index: number;
}

export type ContentType = 'text' | 'video' | 'image' | 'audio' | 'document' | 'link';

export interface Evaluation {
  id: number;
  uuid: string;
  chapter_id?: string;
  sub_chapter_id?: string;
  type: EvaluationType;
  title: string;
  description?: string;
  due_date?: string;
  file_url?: string;
  file_name?: string;
}

export type EvaluationType = 'devoir' | 'quiz' | 'examen' | 'projet';

export interface SupportFile {
  id: number;
  uuid: string;
  chapter_id?: string;
  sub_chapter_id?: string;
  name: string;
  type: string;
  size: number;
  file_url: string;
  uploaded_at: string;
}

// ==================== DOCUMENTS ====================

export interface SessionDocument {
  id: number;
  uuid: string;
  course_uuid?: string;
  session_uuid?: string;
  name: string;
  document_type: DocumentType;
  description?: string;
  category: DocumentCategory;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  audience_type: AudienceType;
  position: number;
  
  is_certificate: boolean;
  certificate_background_url?: string;
  certificate_orientation?: 'portrait' | 'landscape';
  
  is_questionnaire: boolean;
  questionnaire_type?: string;
  
  is_required: boolean;
  template_id?: number;
  template_variables?: Record<string, string>;
  custom_template?: CustomTemplate;
}

export type DocumentType = 'custom_builder' | 'uploaded' | 'template';
export type DocumentCategory = 'apprenant' | 'formateur' | 'administratif';
export type AudienceType = 'students' | 'trainers' | 'admin';

export interface CustomTemplate {
  pages: TemplatePage[];
}

export interface TemplatePage {
  page: number;
  content: string;
}

// ==================== TRAINERS ====================

export interface SessionTrainer {
  id: number;
  uuid: string;
  user_id: number;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  is_primary: boolean;
  
  permissions?: TrainerPermissions;
}

export interface TrainerPermissions {
  can_edit_content: boolean;
  can_manage_participants: boolean;
  can_grade: boolean;
  can_view_reports: boolean;
}

// ==================== MODULES & OBJECTIVES ====================

export interface Module {
  id: number;
  uuid: string;
  course_uuid: string;
  name: string;
  description?: string;
  order_index: number;
}

export interface Objective {
  id: number;
  uuid: string;
  course_uuid: string;
  name: string;
  description?: string;
  order_index: number;
}

// ==================== ADDITIONAL FEES ====================

export interface AdditionalFee {
  id: number;
  uuid: string;
  course_uuid: string;
  name: string;
  amount: number;
  description?: string;
  is_mandatory: boolean;
}

// ==================== WORKFLOW ====================

export interface Workflow {
  id: number;
  uuid: string;
  session_uuid: string;
  name: string;
  description?: string;
  is_active: boolean;
  
  actions: WorkflowAction[];
}

export interface WorkflowAction {
  id: number;
  uuid: string;
  workflow_uuid: string;
  type: WorkflowActionType;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_value?: string;
  is_enabled: boolean;
  order_index: number;
  
  email_template_id?: number;
  document_id?: number;
}

export type WorkflowActionType = 
  | 'send_email'
  | 'generate_document'
  | 'update_status'
  | 'notify_trainer'
  | 'notify_admin';

export type TriggerType =
  | 'on_enrollment'
  | 'before_session'
  | 'after_session'
  | 'on_completion'
  | 'manual';

export interface EmailTemplate {
  id: number;
  uuid: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

// ==================== API RESPONSES ====================

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

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]>;
}

// ==================== TYPE GUARDS ====================

export function isValidFormationAction(value: string): value is FormationAction {
  return FORMATION_ACTIONS.includes(value as FormationAction);
}

export function isValidSessionStatus(value: string): value is SessionStatus {
  return SESSION_STATUSES.includes(value as SessionStatus);
}

export function isValidSessionType(value: string): value is SessionType {
  return SESSION_TYPES.includes(value as SessionType);
}

export function isValidDeliveryMode(value: string): value is DeliveryMode {
  return DELIVERY_MODES.includes(value as DeliveryMode);
}

// ==================== DEFAULT VALUES ====================

export const DEFAULT_SESSION_FORM_DATA: SessionFormData = {
  title: '',
  subtitle: '',
  description: '',
  formation_action: 'Actions de formation',
  category_id: null,
  subcategory_id: null,
  session_language_id: null,
  difficulty_level_id: null,
  price: 0,
  price_ht: 0,
  vat_percentage: 20,
  currency: 'EUR',
  duration: 0,
  duration_days: 0,
  session_start_date: '',
  session_end_date: '',
  session_start_time: '09:00',
  session_end_time: '17:00',
  max_participants: 20,
  target_audience: '',
  prerequisites: '',
  methods: '',
  specifics: '',
  evaluation_modalities: '',
  access_modalities: '',
  accessibility: '',
  contacts: '',
  update_date: '',
  key_points: [],
  trainer_ids: [],
  formation_practice_ids: [],
  tags: [],
  intro_video: null,
  intro_image: null,
  intro_video_url: '',
  intro_image_url: '',
  youtube_video_id: '',
  isPublished: false,
  isDraft: true,
  sessionUuid: undefined,
  courseUuid: undefined,
};


