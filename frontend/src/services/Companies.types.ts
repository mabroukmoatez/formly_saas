/**
 * Company Types
 * Matches backend Company model fields
 */

export interface Company {
  id: number;
  uuid: string;
  organization_id: number;
  name: string;
  legal_name?: string;
  siret?: string;
  siren?: string;
  vat_number?: string;
  ape_code?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  legal_form?: string;
  capital?: string;
  registration_number?: string;
  registration_city?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_full_name?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  logo_url?: string;
  employee_count?: number;
  industry?: string;
  is_active: boolean;
  last_interaction_at?: string;
  created_at: string;
  updated_at: string;
  active_students_count?: number;
  trainings_count?: number;
}

export interface CompanyFormData {
  name: string;
  legal_name?: string;
  siret?: string;
  siren?: string;
  vat_number?: string;
  ape_code?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  legal_form?: string;
  capital?: string;
  registration_number?: string;
  registration_city?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  employee_count?: number;
  industry?: string;
  is_active?: boolean;
}

export interface CompanyListParams {
  search?: string;
  industry?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'name' | 'created_at' | 'last_interaction_at' | 'employee_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CompanyDocument {
  id: number;
  company_id: number;
  organization_id: number;
  uploaded_by: number;
  name: string;
  original_filename: string;
  file_path: string;
  file_type: 'contract' | 'convention' | 'invoice' | 'quote' | 'other';
  mime_type: string;
  file_size: number;
  description?: string;
  document_date?: string;
  reference_number?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyStudent {
  id: number;
  uuid: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: number;
  created_at: string;
  courses: Array<{
    title: string;
    status: string;
  }>;
}

export interface CompanyCourse {
  id: number;
  title: string;
  description?: string;
  students_count?: number;
}

export interface CompanyTrainings {
  courses: CompanyCourse[];
  sessions: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}
