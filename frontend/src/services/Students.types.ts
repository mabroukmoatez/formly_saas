export interface Student {
  uuid: string;
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  company?: {
    id: number;
    name: string;
  };
  status: 'active' | 'inactive';
  registration_date: string;
}

export interface CreateStudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  complementary_notes: string;
  adaptation_needs: 'OUI' | 'NON';
  company_id?: number;
}

export interface StudentSession {
  id: number;
  uuid: string;
  session_name: string;
  course_name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'past' | 'completed';
  progress_percentage?: number;
  attendance_rate?: number;
  current_session?: number;
  total_sessions?: number;
  image_url?: string;
  image?: string;
}

export interface StudentCourse {
  uuid: string;
  title: string;
  description?: string;
  category?: string;
  duration?: number;
  price?: string;
  status?: number | string;
  image_url?: string;
  total_sessions?: number;
  completed_sessions?: number;
  progress_percentage?: number;
  start_date?: string;
  end_date?: string;
  is_completed?: boolean;
}

export interface StudentDocument {
  id: number;
  name: string;
  type: string;
  file_path?: string;
  file_url?: string;
  uploaded_at: string;
}

export interface StudentAttendance {
  id: number;
  session_id: number;
  session_name: string;
  course_name: string;
  session_date: string;
  session_number: number;
  morning_status?: 'present' | 'absent' | 'late';
  afternoon_status?: 'present' | 'absent' | 'late';
  signature_url?: string;
  attendance_sheet_url?: string;
}

export interface StudentEvaluation {
  id: number;
  questionnaire_name: string;
  session_name?: string;
  course_name?: string;
  status: 'completed' | 'pending';
  completed_at?: string;
  score?: number;
  responses?: any;
}

export interface StudentCertificate {
  id: number;
  certificate_type: 'completion' | 'success' | 'attendance';
  course_name: string;
  issue_date: string;
  certificate_url?: string;
  certificate_number?: string;
}

export interface StudentConnectionLog {
  id: number;
  login_time: string;
  logout_time?: string;
  duration_minutes?: number;
  ip_address?: string;
  device?: string;
}

export interface StudentStats {
  total_sessions: number;
  completed_sessions: number;
  total_courses: number;
  completed_courses: number;
  total_hours: number;
  effective_hours: number; // Heures effectives de présence
  attendance_rate: number;
  total_evaluations: number;
  completed_evaluations: number;
  average_score?: number;
  total_certificates: number;
  last_connection?: string;
  total_connection_time?: number; // en minutes
}

export interface GetStudentsParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: 'name' | 'registration_date' | 'company' | 'courses';
  sort_order?: 'asc' | 'desc';
  status?: 'active' | 'inactive' | 'pending';
  company_id?: string;
  course_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
  pagination?: {
    current_page: number;
    total: number;
    per_page: number;
    total_pages: number;
    from?: number;
    to?: number;
  };
}