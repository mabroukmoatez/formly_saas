export interface CourseModule {
  uuid: string;
  course_uuid: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseObjective {
  uuid: string;
  course_uuid: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AdditionalFee {
  uuid: string;
  course_uuid: string;
  name: string;
  amount: number;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseChapter {
  uuid: string;
  course_uuid: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SubChapter {
  uuid: string;
  chapter_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseContent {
  uuid: string;
  chapter_id: string | null;
  sub_chapter_id: string | null;
  type: 'video' | 'text' | 'image';
  title: string | null;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file: string | File | null; // Add file property for UI compatibility
  order: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  uuid: string;
  chapter_id: string;
  sub_chapter_id: string | null;
  type: 'devoir' | 'examen';
  title: string;
  description: string;
  due_date: string | null;
  file_url: string | null;
  file_name: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SupportFile {
  uuid: string;
  chapter_id: string;
  sub_chapter_id: string | null;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  uuid: string;
  course_uuid: string;
  name: string;
  description: string;
  category: 'apprenant' | 'formateur' | 'entreprise';
  file_url: string;
  file_size: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificationModel {
  uuid: string;
  name: string;
  description: string;
  file_url: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface Questionnaire {
  uuid: string;
  course_uuid: string;
  title: string;
  description: string;
  category: 'apprenant' | 'formateur' | 'entreprise';
  type: 'survey' | 'evaluation' | 'feedback';
  questions: Question[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  uuid: string;
  questionnaire_id: string;
  type: 'multiple_choice' | 'true_false' | 'text' | 'rating';
  question: string;
  options?: string[];
  correct_answer?: string | boolean;
  required: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Trainer {
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  experience_years: number;
  description: string | null;
  competencies: string[];
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseTrainer {
  uuid: string;
  course_uuid: string;
  trainer_id: string;
  permissions: {
    can_modify_course: boolean;
    can_manage_students: boolean;
    can_view_analytics: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  uuid: string;
  course_uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  uuid: string;
  course_uuid: string;
  title: string;
  type: 'email' | 'notification' | 'document' | 'assignment' | 'reminder' | 'certificate' | 'payment' | 'enrollment' | 'completion' | 'feedback' | 'meeting' | 'resource';
  recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin';
  timing: string | null;
  scheduled_time: string | null;
  is_active: boolean;
  order_index: number;
  config: any;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  uuid: string;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ENHANCED DOCUMENT TEMPLATES TYPES ====================

export interface DocumentTemplate {
  uuid: string;
  name: string;
  description: string;
  category: 'contract' | 'certificate' | 'quote' | 'invoice' | 'report' | 'other';
  template_type: 'predefined' | 'custom';
  file_path: string;
  file_url: string;
  variables: any; // JSON object containing template variables
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationDocumentTemplate {
  uuid: string;
  organization_id: number;
  name: string;
  description: string;
  category: 'contract' | 'certificate' | 'quote' | 'invoice' | 'report' | 'other';
  template_type: 'predefined' | 'custom';
  file_path: string;
  file_url: string;
  variables: any; // JSON object containing template variables
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  uuid: string;
  course_uuid: string;
  template_id: string;
  template_variables: any;
  is_generated: boolean;
  generated_at: string;
  file_url: string;
  file_name: string;
  file_size: number;
}

// ==================== ENHANCED QUESTIONNAIRE TYPES ====================

export interface QuestionnaireTemplate {
  uuid: string;
  name: string;
  description: string;
  category: 'satisfaction' | 'evaluation' | 'feedback' | 'assessment';
  target_audience: string[]; // ['apprenant', 'formateur', 'entreprise']
  questions: any[]; // Complete question structure
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedQuestionnaire extends Questionnaire {
  questionnaire_type: 'survey' | 'evaluation' | 'feedback' | 'satisfaction';
  target_audience: string[];
  is_template: boolean;
  template_category: string;
  import_source: 'manual' | 'csv' | 'template';
  csv_file_path: string;
  csv_import_settings: any;
}

export interface EnhancedQuestion extends Question {
  question_type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'rating' | 'date' | 'file';
  options: any; // For radio, checkbox, select
  validation_rules: any; // Validation rules
  is_required: boolean;
  conditional_logic: any; // Show/hide based on other answers
}

export interface QuestionnaireResponse {
  uuid: string;
  questionnaire_id: string;
  course_id: string;
  user_id: string;
  user_type: 'apprenant' | 'formateur' | 'entreprise';
  responses: any; // JSON object containing responses
  completed_at: string;
}

export interface QuestionnaireAnalytics {
  total_responses: number;
  completion_rate: number;
  average_score: number;
  response_breakdown: any;
  question_analytics: any[];
}

// ==================== ENHANCED WORKFLOW TYPES ====================

export interface WorkflowTrigger {
  uuid: string;
  workflow_id: string;
  trigger_name: string;
  trigger_event: 'course_started' | 'course_completed' | 'lesson_completed' | 'assignment_submitted' | 'payment_received' | 'enrollment_created' | 'deadline_approaching' | 'custom';
  trigger_conditions: any; // JSON object containing conditions
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnhancedWorkflowAction extends WorkflowAction {
  trigger_type: 'manual' | 'automatic' | 'scheduled';
  trigger_conditions: any;
  execution_order: number;
  retry_count: number;
  last_executed_at: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface NotificationTemplate {
  uuid: string;
  organization_id: number;
  name: string;
  title: string;
  message: string;
  notification_type: 'email' | 'push' | 'sms' | 'in_app';
  placeholders: any;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  uuid: string;
  workflow_id: string;
  trigger_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at: string;
  error_message: string;
  execution_data: any; // Store execution context
  created_at: string;
}

export interface WorkflowAnalytics {
  total_executions: number;
  success_rate: number;
  average_execution_time: number;
  failure_reasons: any[];
  performance_metrics: any;
}

// ==================== CSV IMPORT/EXPORT TYPES ====================

export interface CSVImportSettings {
  delimiter: string;
  encoding: string;
  skip_header: boolean;
  column_mapping: any;
  validation_rules: any;
}

export interface CSVImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors: string[];
  warnings: string[];
}

// ==================== NEW: ENHANCED COURSE STRUCTURE TYPES ====================

export interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order: number;
  is_published: boolean;
  isExpanded?: boolean;
  created_at: string;
  updated_at: string;
  chapters?: CourseChapterEnhanced[];
}

export interface CourseChapterEnhanced {
  id: number;
  uuid: string;
  course_uuid: string;
  course_section_id?: number;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  section?: CourseSection;
  subChapters?: CourseSubChapterEnhanced[];
}

export interface CourseSubChapterEnhanced {
  id: number;
  uuid: string;
  chapter_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  chapter?: CourseChapterEnhanced;
  contentItems?: ContentItem[];
  assignments?: CourseAssignment[];
  supportItems?: CourseSupportItem[];
}

export type ContentType = 'text' | 'video' | 'image' | 'file' | 'audio';

export interface ContentItem {
  id: number;
  course_subchapter_id: number;
  type: ContentType;
  title: string;
  content?: string;
  video_path?: string;
  video_duration?: number;
  image_path?: string;
  file_path?: string;
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  subchapter?: CourseSubChapterEnhanced;
}

export interface CourseAssignment {
  id: number;
  course_subchapter_id: number;
  title: string;
  description?: string;
  instructions?: string;
  order: number;
  is_published: boolean;
  due_date?: string;
  max_score?: number;
  created_at: string;
  updated_at: string;
  subchapter?: CourseSubChapterEnhanced;
  files?: CourseAssignmentFile[];
}

export interface CourseAssignmentFile {
  id: number;
  course_assignment_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

export interface CourseSupportItem {
  id: number;
  course_subchapter_id: number;
  title: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  order: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

export type DocumentType = 'template' | 'uploaded_file';
export type AudienceType = 'students' | 'instructors' | 'organization';

export interface CourseDocumentEnhanced {
  id: number;
  uuid: string;
  course_uuid: string;
  name: string;
  description?: string;
  document_type: DocumentType;
  template_id?: number;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  audience_type: AudienceType;
  position: number;
  is_certificate: boolean;
  template_variables?: Record<string, any>;
  is_generated?: boolean;
  generated_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  course?: any;
  template?: CourseDocumentTemplateEnhanced;
  createdBy?: any;
}

export type TemplateType = 'certificate' | 'contract' | 'questionnaire' | 'evaluation' | 'custom';

export interface CourseDocumentTemplateEnhanced {
  id: number;
  name: string;
  description?: string;
  type: TemplateType;
  content?: string;
  fields?: Record<string, string>;
  logo_path?: string;
  logo_url?: string;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface TrainerPermissions {
  view_course: boolean;
  edit_content: boolean;
  manage_students: boolean;
  grade_assignments: boolean;
  view_analytics: boolean;
  manage_documents: boolean;
  manage_workflow: boolean;
  publish_content: boolean;
}

export interface CourseTrainerEnhanced {
  id: number;
  trainer_id: number;
  course_uuid: string;
  permissions: TrainerPermissions;
  assigned_at: string;
  assigned_by?: number;
  trainer: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    experience_years?: number;
    description?: string;
    competencies?: string[];
    avatar_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export type DestType = 'email' | 'notification' | 'webhook';
export type RefDate = 'enrollment' | 'completion' | 'start' | 'custom';
export type TimeType = 'before' | 'after' | 'on';

export interface CourseFlowAction {
  id: number;
  title: string;
  course_id: number;
  dest?: string;
  dest_type: DestType;
  n_days: number;
  ref_date: RefDate;
  time_type: TimeType;
  custom_time?: string;
  email_id?: number;
  created_at: string;
  updated_at: string;
  course?: any;
  email?: EmailTemplate;
  files?: CourseFlowActionFile[];
}

export interface CourseFlowActionFile {
  id: number;
  flow_action_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject?: string;
  content?: string;
  placeholders?: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoursePedagogicalObjective {
  id: number;
  course_id: number;
  objective: string;
  order: number;
  created_at: string;
  updated_at: string;
  course?: any;
}
