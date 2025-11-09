/**
 * Funder/Financeur TypeScript Types
 * Types for funder management API responses and requests
 */

export type FunderType = 'individual' | 'company' | 'external';

export interface Funder {
  id: number;
  uuid: string;
  organization_id: number;
  type: FunderType;
  name: string;
  legal_name?: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_full_name?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  opco_name?: string;
  agreement_number?: string;
  max_funding_amount?: number;
  eligible_training_types?: string[];
  notes?: string;
  logo_url?: string;
  user_id?: number;
  company_id?: number;
  is_active: boolean;
  last_interaction_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relationship counts
  students_count?: number;
  active_students_count?: number;
  trainings_count?: number;
  documents_count?: number;
  // Calculated fields
  budget?: number;
  funding_status?: 'assigned' | 'not_assigned';
}

export interface FunderFormData {
  type: FunderType;
  name: string;
  legal_name?: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  opco_name?: string;
  agreement_number?: string;
  max_funding_amount?: number;
  eligible_training_types?: string[];
  notes?: string;
  logo_url?: string;
  user_id?: number;
  company_id?: number;
  is_active?: boolean;
}

export interface FunderListParams {
  search?: string;
  type?: FunderType;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'name' | 'type' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface FunderDocument {
  id: number;
  uuid: string;
  funder_id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  document_type?: string; // 'contract', 'invoice', 'agreement', 'general', etc.
  description?: string;
  uploaded_by?: number;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface FunderStudent {
  id: number;
  uuid: string;
  full_name: string;
  email: string;
  phone?: string;
  status: number | string;
  courses?: Array<{
    id: number;
    name: string;
  }>;
}

export interface FunderTraining {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  students_count?: number;
  sessions?: FunderSession[];
}

export interface FunderSession {
  id: number;
  uuid: string;
  session_name: string;
  start_date: string;
  end_date: string;
  session_type: string;
  students?: FunderStudent[];
  funding_agreement_date?: string;
  funded_amount?: number;
  funding_type?: 'total' | 'partial';
  status?: 'en cours' | 'terminée' | 'à venir';
}

export interface FunderTrainings {
  courses: FunderTraining[];
  total_trainings: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
