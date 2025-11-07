// TypeScript types for Admin Management module

// 1. Organization Settings
export interface OrganizationSettings {
  id: number;
  name: string;
  siret: string;
  legal_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  welcome_booklet_path?: string;
  internal_regulations_path?: string;
  logo_path?: string;
  director_name: string;
  training_license_number?: string;
  qualiopi_certification_date?: string;
  qualiopi_certificate_path?: string;
}

// 2. Messaging
export interface MessageSender {
  id: number;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
}

export interface MessageRecipient {
  id: number;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
}

export interface Message {
  id: number;
  subject: string;
  message: string;
  sender: MessageSender;
  recipient: MessageRecipient;
  is_read: boolean;
  attachments?: string[];
  created_at: string;
  reply_to?: number;
}

export interface MessagesPagination {
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: MessagesPagination;
  unread_count: number;
}

export interface SendMessageData {
  recipient_id?: number;
  recipient_type?: 'user' | 'mailing_list';
  mailing_list_id?: number;
  subject: string;
  message: string;
  attachments?: File[];
  reply_to?: number;
}

// 3. Mailing Lists
export interface MailingList {
  id: number;
  name: string;
  description?: string;
  type: 'course' | 'session' | 'custom' | 'all_students' | 'all_instructors';
  course_id?: number;
  recipients_count: number;
  is_editable: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateMailingListData {
  name: string;
  description?: string;
  type: 'custom';
  recipients: number[];
}

export interface UpdateMailingListData {
  name?: string;
  recipients?: number[];
}

// 4. News
export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  image?: string;
  external_link?: string;
  status: 'published' | 'draft' | 'archived';
  is_visible_to_students: boolean;
  published_at?: string;
  views_count: number;
  created_by: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface CreateNewsData {
  title: string;
  description: string;
  image?: File;
  external_link?: string;
  status: 'draft' | 'published';
  is_visible_to_students: boolean;
  published_at?: string;
}

// 5. Events
export interface OrganizationEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location_type: 'physical' | 'online' | 'hybrid';
  location?: string;
  meeting_link?: string;
  event_type: 'training' | 'conference' | 'meeting' | 'exam' | 'other';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_visible_to_students: boolean;
  participants?: number[];
  participants_count: number;
  color: string;
  created_by: {
    id: number;
    name: string;
  };
}

export interface CreateEventData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location_type: 'physical' | 'online' | 'hybrid';
  location?: string;
  meeting_link?: string;
  event_type: 'training' | 'conference' | 'meeting' | 'exam' | 'other';
  is_visible_to_students: boolean;
  participants?: number[];
  color: string;
}

// 6. Calendar
export interface CalendarEvent {
  id: string;
  type: 'event' | 'session';
  title: string;
  start: string;
  end: string;
  color: string;
  location?: string;
  is_online?: boolean;
  course?: {
    id: number;
    title: string;
  };
  instructor?: {
    id: number;
    name: string;
  };
  students_count?: number;
}

export interface CalendarData {
  events: CalendarEvent[];
  sessions: CalendarEvent[];
}

// 7. Reports & Statistics
export interface ReportPeriod {
  type: 'today' | 'week' | 'month' | 'year' | 'custom';
  start_date: string;
  end_date: string;
  label: string;
}

export interface CoursesStats {
  active: number;
  published: number;
  draft: number;
  total: number;
}

export interface UsersStats {
  total_instructors: number;
  active_instructors: number;
  total_students: number;
  active_students: number;
  new_students_this_period: number;
}

export interface SessionsStats {
  ongoing: number;
  completed: number;
  upcoming: number;
  total: number;
}

export interface ConnectionsStats {
  total: number;
  students: number;
  instructors: number;
  admins: number;
  connection_rate: number;
  average_session_duration: number;
}

export interface RevenueStats {
  total: number;
  completed: number;
  pending: number;
  currency: string;
}

export interface EnrollmentsStats {
  total: number;
  paid: number;
  pending: number;
  completion_rate: number;
}

export interface CertificatesStats {
  issued: number;
}

export interface SatisfactionStats {
  average_rating: number;
  total_reviews: number;
}

export interface TopCourse {
  id: number;
  title: string;
  enrollments: number;
  revenue: number;
  satisfaction: number;
}

export interface TopInstructor {
  id: number;
  name: string;
  courses_count: number;
  students_count: number;
  average_rating: number;
}

export interface DashboardReport {
  period: ReportPeriod;
  courses: CoursesStats;
  users: UsersStats;
  sessions: SessionsStats;
  connections: ConnectionsStats;
  revenue: RevenueStats;
  enrollments: EnrollmentsStats;
  certificates: CertificatesStats;
  satisfaction: SatisfactionStats;
  top_courses: TopCourse[];
  top_instructors: TopInstructor[];
}

export interface ConnectionsByDay {
  date: string;
  connections: number;
  unique_users: number;
}

export interface ConnectionsByType {
  students: number;
  instructors: number;
  admins: number;
}

export interface PeakHour {
  hour: string;
  connections: number;
}

export interface ConnectionsReport {
  total_connections: number;
  unique_users: number;
  connections_by_day: ConnectionsByDay[];
  connections_by_type: ConnectionsByType;
  peak_hours: PeakHour[];
  average_session_duration: number;
}

export interface ExportReportData {
  report_type: 'dashboard' | 'connections' | 'revenue' | 'courses';
  format: 'pdf' | 'excel';
  period: 'today' | 'week' | 'month' | 'year' | 'custom';
  start_date?: string;
  end_date?: string;
}

export interface ExportReportResponse {
  download_url: string;
  filename: string;
}

// 8. Admin Dashboard Stats (for useAdminDashboard hook)
export interface AdminDashboardStats {
  courses: {
    active: number;
    published?: number;
    draft?: number;
    total: number;
    trend: number;
  };
  users: {
    total_instructors?: number;
    active_instructors?: number;
    total_students?: number;
    active_students: number;
    new_students_this_period: number;
    trend: number;
  };
  sessions: {
    ongoing: number;
    completed?: number;
    upcoming: number;
    total?: number;
    trend: number;
  };
  revenue: {
    total: number;
    completed: number;
    pending?: number;
    currency?: string;
    trend: number;
  };
  connections: {
    total: number;
    students?: number;
    instructors?: number;
    admins?: number;
    connection_rate: number;
    average_session_duration?: number;
  };
  certificates: {
    issued: number;
    completion_rate?: number;
  };
  satisfaction: {
    average_rating: number;
    total_reviews: number;
  };
  top_courses: Array<{
    id: string;
    title: string;
    enrollments: number;
    revenue: number;
    satisfaction: number;
  }>;
  top_instructors: Array<{
    id: string;
    name: string;
    courses_count: number;
    students_count: number;
    average_rating: number;
  }>;
}

// Re-exports for compatibility
export type AdminMessage = Message;
export type AdminMailingList = MailingList;
export type AdminNews = NewsArticle;
export type AdminEvent = OrganizationEvent;
export type AdminReportConnections = ConnectionsReport;
export type AdminReportExport = ExportReportResponse;

