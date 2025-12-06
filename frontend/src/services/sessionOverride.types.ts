/**
 * Session Override Types
 * 
 * Types pour le système d'héritage Cours → Session
 * Une session hérite du cours template et peut override n'importe quelle donnée
 */

// ==================== BASE TYPES ====================

/**
 * Valeur qui peut être héritée du cours ou overridée par la session
 */
export interface OverridableField<T> {
  value: T;
  override: T | null;
  inherited: boolean;
}

// ==================== SESSION OVERRIDE DATA ====================

/**
 * Données d'override pour les champs simples de la session
 */
export interface SessionOverrideData {
  // Informations générales
  title_override: string | null;
  subtitle_override: string | null;
  description_override: string | null;
  
  // Durée
  duration_override: number | null;
  duration_unit_override: string | null;
  
  // Tarification
  price_ht_override: number | null;
  vat_rate_override: number | null;
  
  // Médias
  image_url_override: string | null;
  intro_video_override: string | null;
  
  // Objectifs et prérequis
  objectives_override: string[] | null;
  prerequisites_override: string[] | null;
  target_audience_override: string[] | null;
  
  // Certification
  certification_override: CertificationOverride | null;
  
  // Flags d'override pour les entités complexes
  has_chapters_override: boolean;
  has_documents_override: boolean;
  has_workflow_override: boolean;
}

export interface CertificationOverride {
  is_certifying: boolean;
  certification_name?: string;
  certification_body?: string;
  rncp_code?: string;
  rs_code?: string;
}

// ==================== SESSION CHAPTER ====================

/**
 * Chapitre spécifique à une session (override ou nouveau)
 */
export interface SessionChapter {
  uuid: string;
  session_uuid: string;
  original_chapter_uuid: string | null; // null si nouveau chapitre
  
  title: string;
  description: string | null;
  order_index: number;
  duration: number | null;
  is_active: boolean;
  
  // Métadonnées
  is_new: boolean; // true si chapitre ajouté pour cette session
  is_removed: boolean; // true si chapitre du template supprimé pour cette session
  is_modified: boolean; // true si différent du template
  is_from_course: boolean; // true si vient directement du cours (pas d'override)
  
  sub_chapters: SessionSubChapter[];
  
  created_at: string;
  updated_at: string;
}

/**
 * Sous-chapitre spécifique à une session
 */
export interface SessionSubChapter {
  uuid: string;
  session_chapter_uuid: string;
  original_sub_chapter_uuid: string | null;
  
  title: string;
  description: string | null;
  order_index: number;
  duration: number | null;
  is_active: boolean;
  
  is_new: boolean;
  is_removed: boolean;
  is_modified: boolean;
  is_from_course: boolean;
  
  contents: SessionContent[];
  
  created_at: string;
  updated_at: string;
}

/**
 * Contenu spécifique à une session
 */
export interface SessionContent {
  uuid: string;
  session_sub_chapter_uuid: string;
  original_content_uuid: string | null;
  
  title: string;
  content_type: 'video' | 'document' | 'quiz' | 'text' | 'scorm';
  content_url: string | null;
  content_data: any;
  order_index: number;
  duration: number | null;
  is_active: boolean;
  
  is_new: boolean;
  is_removed: boolean;
  is_modified: boolean;
  is_from_course: boolean;
}

// ==================== SESSION DOCUMENT ====================

/**
 * Document spécifique à une session
 */
export interface SessionDocument {
  uuid: string;
  session_uuid: string;
  original_document_uuid: string | null;
  
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  document_type: 'support' | 'exercise' | 'resource' | 'certificate' | 'other';
  visibility: 'all' | 'trainers_only' | 'participants_only';
  order_index: number;
  is_active: boolean;
  
  is_new: boolean;
  is_removed: boolean;
  is_modified: boolean;
  is_from_course: boolean;
  
  created_at: string;
  updated_at: string;
}

// ==================== SESSION WORKFLOW ====================

/**
 * Action workflow spécifique à une session
 */
export interface SessionWorkflowAction {
  uuid: string;
  session_uuid: string;
  original_action_uuid: string | null;
  
  action_type: 'send_email' | 'send_document' | 'send_questionnaire' | 'send_notification' | 'create_task';
  trigger_type: 'before_session' | 'after_session' | 'before_slot' | 'after_slot' | 'on_enrollment' | 'on_completion';
  trigger_days: number;
  target_type: 'participants' | 'trainers' | 'all' | 'specific';
  target_uuids: string[] | null; // Pour target_type = 'specific'
  
  // Configuration
  email_template_uuid: string | null;
  document_uuids: string[];
  questionnaire_uuids: string[];
  custom_message: string | null;
  
  is_active: boolean;
  is_new: boolean;
  is_removed: boolean;
  is_modified: boolean;
  is_from_course: boolean;
  
  created_at: string;
  updated_at: string;
}

// ==================== API REQUEST TYPES ====================

/**
 * Données pour mettre à jour les overrides simples d'une session
 */
export interface UpdateSessionOverridesData {
  title_override?: string | null;
  subtitle_override?: string | null;
  description_override?: string | null;
  duration_override?: number | null;
  duration_unit_override?: string | null;
  price_ht_override?: number | null;
  vat_rate_override?: number | null;
  image_url_override?: string | null;
  intro_video_override?: string | null;
  objectives_override?: string[] | null;
  prerequisites_override?: string[] | null;
  target_audience_override?: string[] | null;
  certification_override?: CertificationOverride | null;
}

/**
 * Données pour créer/modifier un chapitre de session
 */
export interface SessionChapterData {
  title: string;
  description?: string | null;
  order_index?: number;
  duration?: number | null;
  is_active?: boolean;
}

/**
 * Données pour créer/modifier un sous-chapitre de session
 */
export interface SessionSubChapterData {
  title: string;
  description?: string | null;
  order_index?: number;
  duration?: number | null;
  is_active?: boolean;
}

/**
 * Données pour créer/modifier un document de session
 */
export interface SessionDocumentData {
  title: string;
  description?: string | null;
  document_type?: 'support' | 'exercise' | 'resource' | 'certificate' | 'other';
  visibility?: 'all' | 'trainers_only' | 'participants_only';
  order_index?: number;
  file?: File; // Pour l'upload
}

/**
 * Données pour créer/modifier une action workflow de session
 */
export interface SessionWorkflowActionData {
  action_type: 'send_email' | 'send_document' | 'send_questionnaire' | 'send_notification' | 'create_task';
  trigger_type: 'before_session' | 'after_session' | 'before_slot' | 'after_slot' | 'on_enrollment' | 'on_completion';
  trigger_days?: number;
  target_type: 'participants' | 'trainers' | 'all' | 'specific';
  target_uuids?: string[];
  email_template_uuid?: string;
  document_uuids?: string[];
  questionnaire_uuids?: string[];
  custom_message?: string;
  is_active?: boolean;
}

// ==================== API RESPONSE TYPES ====================

/**
 * Réponse de session avec données effectives (héritées ou overridées)
 */
export interface SessionWithEffectiveData {
  uuid: string;
  course_uuid: string;
  
  // Valeurs effectives (override ou héritée)
  title: string;
  subtitle: string | null;
  description: string | null;
  duration: number | null;
  duration_unit: string | null;
  price_ht: number | null;
  vat_rate: number | null;
  image_url: string | null;
  intro_video: string | null;
  objectives: string[];
  prerequisites: string[];
  target_audience: string[];
  
  // Overrides (null = hérite du cours)
  title_override: string | null;
  subtitle_override: string | null;
  description_override: string | null;
  duration_override: number | null;
  duration_unit_override: string | null;
  price_ht_override: number | null;
  vat_rate_override: number | null;
  image_url_override: string | null;
  intro_video_override: string | null;
  objectives_override: string[] | null;
  prerequisites_override: string[] | null;
  target_audience_override: string[] | null;
  certification_override: CertificationOverride | null;
  
  // Indicateurs d'héritage
  title_inherited: boolean;
  subtitle_inherited: boolean;
  description_inherited: boolean;
  duration_inherited: boolean;
  price_inherited: boolean;
  image_inherited: boolean;
  objectives_inherited: boolean;
  prerequisites_inherited: boolean;
  
  // Flags d'override pour les entités complexes
  has_chapters_override: boolean;
  has_documents_override: boolean;
  has_workflow_override: boolean;
  
  // Données effectives des entités complexes
  effective_chapters: SessionChapter[];
  effective_documents: SessionDocument[];
  effective_workflow_actions: SessionWorkflowAction[];
  
  // Données du cours template (pour référence/comparaison)
  course: {
    uuid: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    duration: number | null;
    price_ht: number | null;
    image_url: string | null;
    chapters_count: number;
    documents_count: number;
  };
  
  // Données propres à la session (pas des overrides)
  session_type: 'inter' | 'intra' | 'individual';
  delivery_mode: 'presentiel' | 'distanciel' | 'hybrid' | 'e-learning';
  start_date: string;
  end_date: string;
  default_start_time: string;
  default_end_time: string;
  status: 'draft' | 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  is_published: boolean;
  
  // Relations
  trainers: any[];
  participants: any[];
  slots: any[];
}

/**
 * Réponse de l'initialisation des overrides
 */
export interface InitializeOverrideResponse {
  success: boolean;
  message: string;
  data: {
    items_count: number;
    sub_items_count?: number;
  };
}

/**
 * Réponse des chapitres effectifs
 */
export interface EffectiveChaptersResponse {
  success: boolean;
  data: {
    has_override: boolean;
    chapters: SessionChapter[];
  };
}

/**
 * Réponse des documents effectifs
 */
export interface EffectiveDocumentsResponse {
  success: boolean;
  data: {
    has_override: boolean;
    documents: SessionDocument[];
  };
}

/**
 * Réponse des actions workflow effectives
 */
export interface EffectiveWorkflowActionsResponse {
  success: boolean;
  data: {
    has_override: boolean;
    workflow_actions: SessionWorkflowAction[];
  };
}

