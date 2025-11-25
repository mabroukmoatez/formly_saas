import { apiService as api } from './api';

// Types for Learner
export interface LearnerProfile {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  nationality?: string;
  birth_date?: string;
  birth_city?: string;
  student_number?: string;
  image_url?: string;
  role: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    course_updates: boolean;
    deadline_reminders: boolean;
    event_notifications: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  attendance_rate?: number;
  learning_time: {
    total_hours: number;
    content_readings: number;
    videos_watched: number;
    assignments_completed: number;
    quizzes_completed: number;
  };
  activity: {
    total_activities: number;
    content_readings: number;
    videos_watched: number;
    assignments_completed: number;
    quizzes_completed: number;
  };
  activity_chart?: {
    week_data: Array<{
      day: string;
      value: number;
    }>;
  };
  last_activity: {
    type: 'content' | 'video' | 'quiz' | 'assignment';
    title: string;
    course_name: string;
    completed_at: string;
    image_url?: string;
  };
  upcoming_deadlines: Array<{
    id: number;
    type: 'session' | 'test' | 'assignment' | 'event';
    title: string;
    date: string;
    formatted_date?: string;
    instructor?: string;
    instructor_avatar?: string;
    days_remaining: number;
    course_name: string;
    image?: string;
    image_url?: string;
  }>;
}

export interface LearnerCourse {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  cover_image?: string;
  category?: string;
  instructor?: {
    id: number;
    name: string;
    avatar?: string;
  };
  progress: {
    percentage: number;
    type: 'content' | 'sessions';
    sessions_completed?: number;
    sessions_total?: number;
    videos_completed?: number;
    videos_total?: number;
    quizzes_completed?: number;
    quizzes_total?: number;
    assignments_completed?: number;
    assignments_total?: number;
  };
  session?: {
    id: number;
    uuid: string;
    start_date: string;
    end_date: string;
    type: 'presentiel' | 'distanciel' | 'e-learning' | 'synchrone' | 'hybrid';
    location?: string;
    schedule?: string;
  };
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  enrollment_date: string;
  last_accessed_at?: string;
  participants_count?: number;
  participants?: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
  duration_hours?: number;
}

export interface LearnerDocument {
  id: number;
  name: string;
  type: string;
  url: string;
  size: number;
  session?: {
    id: number;
    name: string;
    date: string;
  };
  course?: {
    id: number;
    name: string;
  };
  received_at: string;
  can_download: boolean;
}

export interface Questionnaire {
  id: number;
  title: string;
  description?: string;
  type: 'satisfaction' | 'evaluation' | 'feedback';
  session?: {
    id: number;
    name: string;
  };
  course?: {
    id: number;
    name: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  deadline?: string;
  completed_at?: string;
  created_at: string;
}

export interface AttendanceSheet {
  id: number;
  session: {
    id: number;
    name: string;
    date: string;
    end_date: string;
    period: 'morning' | 'afternoon';
  };
  course: {
    id: number;
    name: string;
  };
  status: 'pending' | 'signed' | 'missed' | 'late';
  signature_method?: 'code' | 'qr_code' | 'manual';
  signed_at?: string;
  qr_code?: string;
  code?: string;
  created_at: string;
}

export interface Absence {
  id: number;
  session: {
    id: number;
    name: string;
    date: string;
    period: 'morning' | 'afternoon';
  };
  course: {
    id: number;
    name: string;
  };
  status: 'justified' | 'unjustified' | 'pending';
  justification?: {
    id: number;
    type: 'medical' | 'personal' | 'professional' | 'other';
    document_url?: string;
    comment?: string;
    submitted_at: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  type: 'session' | 'event' | 'deadline' | 'test' | 'assignment';
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  instructor?: {
    id: number;
    name: string;
    avatar?: string;
  };
  course?: {
    id: number;
    name: string;
    color: string;
  };
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  requires_attendance?: boolean;
  attendance_sheet_id?: number;
  is_past?: boolean;
  recording_url?: string;
}

export interface CatalogCourse {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  cover_image?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  price: number;
  currency: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  instructor?: {
    id: number;
    name: string;
    avatar?: string;
    bio?: string;
  };
  start_date?: string;
  end_date?: string;
  type: 'synchronous' | 'asynchronous' | 'e-learning' | 'hybrid';
  sessions?: Array<{
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    available_spots: number;
    total_spots: number;
    is_available: boolean;
  }>;
  has_available_sessions: boolean;
  rating?: number;
  reviews_count?: number;
  students_count?: number;
  is_enrolled: boolean;
  is_in_cart: boolean;
}

// Messaging - Updated according to mesg.md documentation
export interface Conversation {
  id: number;
  uuid: string;
  type: 'individual' | 'group';
  participant?: {
    id: number;
    name: string;
    email: string;
    role: number;
    avatar: string | null;
    is_online: boolean;
  };
  name?: string; // For groups
  avatar?: string; // For groups
  participants_count?: number; // For groups
  last_message?: {
    id: number;
    uuid: string;
    content: string;
    sender_id: number;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  uuid: string;
  content: string;
  sender: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  reply_to?: {
    id: number;
    uuid: string;
    content: string;
  };
  attachments: Array<{
    id: number;
    filename: string;
    url: string;
    size: number;
    mime_type: string;
  }>;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

export interface ChatParticipant {
  id: number;
  name: string;
  email: string;
  role: number;
  avatar: string | null;
  is_online: boolean;
  role_in_conversation?: 'admin' | 'member';
  joined_at?: string;
}

export interface AvailableUser {
  id: number;
  name: string;
  email: string;
  role: number;
  avatar: string | null;
  is_online: boolean;
}

// Legacy Message interface for backward compatibility
export interface Message extends ChatMessage {}

export interface SharedFolder {
  id: number;
  name: string;
  type: 'course' | 'administrative' | 'custom';
  course?: {
    id: number;
    name: string;
  };
  is_deletable: boolean;
  files_count: number;
  subfolders_count: number;
  created_at: string;
  updated_at: string;
}

export interface SharedFile {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  folder_id: number;
  uploaded_by: {
    id: number;
    name: string;
    role: string;
  };
  can_download: boolean;
  can_view: boolean;
  created_at: string;
}

export interface CourseResult {
  course: {
    id: number;
    name: string;
  };
  overall_grade: number;
  status: 'passed' | 'failed' | 'in_progress';
  modules: Array<{
    module_id: number;
    module_name: string;
    grade: number;
    quizzes: Array<{
      quiz_id: number;
      quiz_name: string;
      score: number;
      max_score: number;
      percentage: number;
      completed_at: string;
    }>;
    assignments: Array<{
      assignment_id: number;
      assignment_name: string;
      grade: number;
      max_grade: number;
      percentage: number;
      submitted_at: string;
      graded_at?: string;
    }>;
  }>;
  certificate?: {
    id: number;
    issued_at: string;
    certificate_url: string;
  };
}

export interface NewsItem {
  id: number;
  type: 'news' | 'event';
  title: string;
  content?: string;
  description?: string;
  image?: string;
  author?: {
    id: number;
    name: string;
  };
  start_date?: string;
  end_date?: string;
  location?: string;
  is_past?: boolean;
  recording_url?: string;
  registration_required?: boolean;
  is_registered?: boolean;
  published_at: string;
  created_at: string;
}

// API Functions

// Profile
export const getLearnerProfile = async (): Promise<{ success: boolean; data: LearnerProfile }> => {
  const response = await api.get('/api/learner/profile');
  return response.data;
};

export const updateLearnerProfile = async (data: Partial<LearnerProfile>): Promise<{ success: boolean; data: LearnerProfile }> => {
  const response = await api.put('/api/learner/profile', data);
  return response.data;
};

export const changePassword = async (data: { current_password: string; new_password: string; confirmation_code: string }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/api/learner/profile/change-password', data);
  return response.data;
};

export const requestPasswordChangeCode = async (method: 'email' | 'sms'): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/api/learner/profile/request-password-change-code', { method });
  return response.data;
};

export const updateNotificationPreferences = async (preferences: LearnerProfile['notification_preferences']): Promise<{ success: boolean; data: { notification_preferences: LearnerProfile['notification_preferences'] } }> => {
  const response = await api.put('/api/learner/profile/notification-preferences', preferences);
  return response.data;
};

// Dashboard
export const getLearnerDashboardStats = async (): Promise<{ success: boolean; data: DashboardStats }> => {
  const response = await api.get('/api/learner/dashboard/stats');
  return response.data;
};

export const getLearnerDashboardStatsDetailed = async (params?: { period?: 'week' | 'month' | 'year' | 'all'; type?: 'learning_time' | 'activity' | 'all' }): Promise<{ success: boolean; data: any }> => {
  const response = await api.get('/api/learner/dashboard/stats/detailed', { params });
  return response.data;
};

export const getUpcomingEvents = async (limit: number = 3): Promise<{ success: boolean; data: DashboardStats['upcoming_deadlines'] }> => {
  const response = await api.get('/api/learner/dashboard/upcoming-events', { params: { limit } });
  return response.data;
};

export const getNews = async (limit: number = 3): Promise<{ success: boolean; data: NewsItem[] }> => {
  const response = await api.get('/api/learner/dashboard/news', { params: { limit } });
  return response.data;
};

export const getRecentActivities = async (limit: number = 3): Promise<{ success: boolean; data: NewsItem[] }> => {
  const response = await api.get('/api/learner/dashboard/recent-activities', { params: { limit } });
  return response.data;
};

// New endpoint that combines events and news
export interface EventsAndNewsResponse {
  success: boolean;
  data: {
    news: NewsItem[];
    events: NewsItem[];
    all: NewsItem[];
  };
  meta: {
    news_count: number;
    events_count: number;
    total: number;
  };
}

export const getEventsAndNews = async (
  limit: number = 10,
  type: 'all' | 'news' | 'events' = 'all'
): Promise<EventsAndNewsResponse> => {
  const response = await api.get('/api/learner/dashboard/events-and-news', { 
    params: { limit, type } 
  });
  return response.data;
};

// Courses
export const getLearnerCourses = async (params?: {
  status?: 'all' | 'in_progress' | 'completed' | 'not_started';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'progress' | 'name' | 'start_date' | 'end_date';
}): Promise<{ success: boolean; data: { courses: LearnerCourse[]; pagination: any } }> => {
  const response = await api.get('/api/learner/courses', { params });
  return response.data;
};

export const getLearnerCourse = async (courseId: number): Promise<{ success: boolean; data: any }> => {
  const response = await api.get(`/api/learner/courses/${courseId}`);
  return response.data;
};

export const getLearnerChapter = async (courseId: number, chapterId: number): Promise<{ success: boolean; data: any }> => {
  const response = await api.get(`/api/learner/courses/${courseId}/chapters/${chapterId}`);
  return response.data;
};

export const completeChapter = async (courseId: number, chapterId: number, data: { progress: number; time_spent: number }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/learner/courses/${courseId}/chapters/${chapterId}/complete`, data);
  return response.data;
};

export const saveVideoPosition = async (courseId: number, chapterId: number, position: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`/api/learner/courses/${courseId}/chapters/${chapterId}/video/position`, { position });
  return response.data;
};

export const createVideoNote = async (courseId: number, chapterId: number, data: { content: string; timestamp: number }): Promise<{ success: boolean; data: any }> => {
  const response = await api.post(`/api/learner/courses/${courseId}/chapters/${chapterId}/notes`, data);
  return response.data;
};

export const updateVideoNote = async (courseId: number, chapterId: number, noteId: number, data: { content: string; timestamp: number }): Promise<{ success: boolean; data: any }> => {
  const response = await api.put(`/api/learner/courses/${courseId}/chapters/${chapterId}/notes/${noteId}`, data);
  return response.data;
};

export const deleteVideoNote = async (courseId: number, chapterId: number, noteId: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/api/learner/courses/${courseId}/chapters/${chapterId}/notes/${noteId}`);
  return response.data;
};

export const getCourseNotes = async (courseId: number): Promise<{ success: boolean; data: any[] }> => {
  const response = await api.get(`/api/learner/courses/${courseId}/notes`);
  return response.data;
};

export const updateVideoSpeed = async (speed: number): Promise<{ success: boolean }> => {
  const response = await api.put('/api/learner/preferences/video-speed', { speed });
  return response.data;
};

// Documents
export const getLearnerDocuments = async (params?: {
  type?: 'all' | 'session_documents' | 'questionnaires';
  session_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: { documents: LearnerDocument[]; pagination: any } }> => {
  const response = await api.get('/api/learner/documents', { params });
  return response.data;
};

// Questionnaires
export const getLearnerQuestionnaires = async (params?: {
  status?: 'all' | 'pending' | 'completed' | 'overdue';
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: { questionnaires: Questionnaire[]; pagination: any } }> => {
  const response = await api.get('/api/learner/questionnaires', { params });
  return response.data;
};

export const getLearnerQuestionnaire = async (questionnaireId: number): Promise<{ success: boolean; data: any }> => {
  const response = await api.get(`/api/learner/questionnaires/${questionnaireId}`);
  return response.data;
};

export const submitQuestionnaire = async (questionnaireId: number, answers: any[]): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/learner/questionnaires/${questionnaireId}/submit`, { answers });
  return response.data;
};

// Attendance
export const getLearnerAttendanceSheets = async (params?: {
  status?: 'all' | 'pending' | 'signed' | 'missed';
  session_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: { attendance_sheets: AttendanceSheet[]; pagination: any } }> => {
  const response = await api.get('/api/learner/attendance-sheets', { params });
  return response.data;
};

export const signAttendanceWithCode = async (sheetId: number, data: { code: string; signature: string }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/learner/attendance-sheets/${sheetId}/sign-with-code`, data);
  return response.data;
};

export const signAttendanceWithQR = async (sheetId: number, data: { qr_code_data: string; signature: string }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/learner/attendance-sheets/${sheetId}/sign-with-qr`, data);
  return response.data;
};

export const getAttendanceQRCode = async (sheetId: number): Promise<{ success: boolean; data: { qr_code_url: string; qr_code_data: string } }> => {
  const response = await api.get(`/api/learner/attendance-sheets/${sheetId}/qr-code`);
  return response.data;
};

// Absences
export const getLearnerAbsences = async (params?: {
  status?: 'all' | 'justified' | 'unjustified' | 'pending';
  session_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: { absences: Absence[]; pagination: any } }> => {
  const response = await api.get('/api/learner/absences', { params });
  return response.data;
};

export const addAbsenceJustification = async (absenceId: number, formData: FormData): Promise<{ success: boolean; data: { justification: any } }> => {
  const response = await api.post(`/api/learner/absences/${absenceId}/justification`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateAbsenceJustification = async (absenceId: number, justificationId: number, formData: FormData): Promise<{ success: boolean; data: { justification: any } }> => {
  const response = await api.put(`/api/learner/absences/${absenceId}/justification/${justificationId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Calendar
export const getLearnerCalendar = async (params?: {
  start_date?: string;
  end_date?: string;
  type?: 'all' | 'sessions' | 'events' | 'deadlines';
  course_id?: number;
  period?: 'week' | 'month' | 'year';
}): Promise<{ success: boolean; data: { events: CalendarEvent[]; period: { start: string; end: string } } }> => {
  const response = await api.get('/api/learner/calendar', { params });
  return response.data;
};

export const getCalendarEvent = async (eventId: number): Promise<{ success: boolean; data: CalendarEvent }> => {
  const response = await api.get(`/api/learner/calendar/events/${eventId}`);
  return response.data;
};

// Catalog
export const getCatalogCourses = async (params?: {
  category?: string;
  search?: string;
  instructor_id?: number;
  type?: 'all' | 'synchronous' | 'asynchronous' | 'e-learning';
  price_min?: number;
  price_max?: number;
  has_available_sessions?: boolean;
  page?: number;
  limit?: number;
  sort?: 'popularity' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'name';
}): Promise<{ success: boolean; data: { courses: CatalogCourse[]; categories: any[]; pagination: any } }> => {
  const response = await api.get('/api/learner/catalog/courses', { params });
  return response.data;
};

export const getCatalogCourse = async (courseId: number): Promise<{ success: boolean; data: CatalogCourse }> => {
  const response = await api.get(`/api/learner/catalog/courses/${courseId}`);
  return response.data;
};

export const addToCart = async (data: { course_id: number; session_id?: number }): Promise<{ success: boolean; data: { cart_item: any } }> => {
  const response = await api.post('/api/learner/cart/add', data);
  return response.data;
};

export const getCart = async (): Promise<{ success: boolean; data: { items: any[]; total: number; currency: string } }> => {
  const response = await api.get('/api/learner/cart');
  return response.data;
};

export const removeFromCart = async (itemId: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/api/learner/cart/items/${itemId}`);
  return response.data;
};

export const addToWaitlist = async (courseId: number, data: { message?: string; preferred_session_dates?: string[] }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/learner/catalog/courses/${courseId}/waitlist`, data);
  return response.data;
};

// Messaging - Updated according to mesg.md documentation
export const getLearnerConversations = async (params?: {
  page?: number;
  per_page?: number;
  type?: 'all' | 'individual' | 'group';
  search?: string;
}): Promise<{
  success: boolean;
  data: {
    conversations: Conversation[];
    pagination: NotificationPagination;
  };
}> => {
  const response = await api.get('/api/learner/conversations', { params });
  return response.data;
};

export const createLearnerConversation = async (data: {
  type: 'individual' | 'group';
  participant_ids: number[];
  name?: string; // Required if type is 'group'
}): Promise<{
  success: boolean;
  message: string;
  data: Conversation;
}> => {
  const response = await api.post('/api/learner/conversations', data);
  return response.data;
};

export const getLearnerConversation = async (conversationId: string | number): Promise<{
  success: boolean;
  data: Conversation;
}> => {
  const response = await api.get(`/api/learner/conversations/${conversationId}`);
  return response.data;
};

export const getLearnerConversationMessages = async (
  conversationId: string | number,
  params?: {
    page?: number;
    per_page?: number;
    before?: string; // ISO 8601 date
  }
): Promise<{
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination: NotificationPagination;
  };
}> => {
  const response = await api.get(`/api/learner/conversations/${conversationId}/messages`, { params });
  return response.data;
};

export const sendLearnerMessage = async (
  conversationId: string | number,
  data: {
    message: string;
    reply_to_id?: number;
    attachments?: File[];
  }
): Promise<{
  success: boolean;
  message: string;
  data: ChatMessage;
}> => {
  const formData = new FormData();
  formData.append('message', data.message);
  if (data.reply_to_id) {
    formData.append('reply_to_id', data.reply_to_id.toString());
  }
  if (data.attachments) {
    data.attachments.forEach((file) => {
      formData.append('attachments[]', file);
    });
  }

  const response = await api.post(`/api/learner/conversations/${conversationId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const markLearnerConversationAsRead = async (conversationId: string | number): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.put(`/api/learner/conversations/${conversationId}/mark-read`);
  return response.data;
};

export const getLearnerConversationParticipants = async (conversationId: string | number): Promise<{
  success: boolean;
  data: {
    participants: ChatParticipant[];
  };
}> => {
  const response = await api.get(`/api/learner/conversations/${conversationId}/participants`);
  return response.data;
};

export const getLearnerChatUsers = async (params?: {
  search?: string;
}): Promise<{
  success: boolean;
  data: {
    users: AvailableUser[];
  };
}> => {
  const response = await api.get('/api/learner/chat/users', { params });
  return response.data;
};

// Legacy functions for backward compatibility
export const getConversations = getLearnerConversations;
export const getConversationMessages = getLearnerConversationMessages;
export const sendMessage = async (conversationId: number, formData: FormData): Promise<{ success: boolean; data: { message: Message } }> => {
  const message = formData.get('message') as string;
  const replyToId = formData.get('reply_to_id') as string | null;
  const attachments: File[] = [];
  
  // Extract attachments from FormData
  formData.forEach((value, key) => {
    if (key.startsWith('attachments') && value instanceof File) {
      attachments.push(value);
    }
  });

  const response = await sendLearnerMessage(conversationId, {
    message,
    reply_to_id: replyToId ? parseInt(replyToId) : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
  
  return {
    success: response.success,
    data: { message: response.data as Message }
  };
};

export const createConversation = async (data: { recipient_id: number; subject?: string; content: string; course_id?: number }): Promise<{ success: boolean; data: { conversation: Conversation } }> => {
  const response = await createLearnerConversation({
    type: 'individual',
    participant_ids: [data.recipient_id],
  });
  
  // If conversation was created and content is provided, send the initial message
  if (response.success && data.content) {
    await sendLearnerMessage(response.data.id, {
      message: data.content,
    });
  }
  
  return {
    success: response.success,
    data: { conversation: response.data }
  };
};

export const markMessagesAsRead = async (conversationId: number, messageIds?: number[]): Promise<{ success: boolean }> => {
  const response = await markLearnerConversationAsRead(conversationId);
  return { success: response.success };
};

export const getRecipients = async (params?: { search?: string; role?: 'all' | 'instructor' | 'admin' | 'learner'; course_id?: number }): Promise<{ success: boolean; data: { recipients: any[] } }> => {
  const response = await getLearnerChatUsers({ search: params?.search });
  return {
    success: response.success,
    data: { recipients: response.data.users }
  };
};

export const pinConversation = async (conversationId: number, isPinned: boolean): Promise<{ success: boolean }> => {
  // Note: Pin functionality is not in the new API, keeping for backward compatibility
  return { success: true };
};

// Shared Folders
export const getSharedFolders = async (params?: { folder_id?: number; course_id?: number }): Promise<{ success: boolean; data: { folders: SharedFolder[]; files: SharedFile[]; recent_activity: any[] } }> => {
  const response = await api.get('/api/learner/shared-folders', { params });
  return response.data;
};

export const getRecentFiles = async (limit?: number): Promise<{ success: boolean; data: { files: SharedFile[] } }> => {
  const response = await api.get('/api/learner/shared-folders/recent', { params: { limit } });
  return response.data;
};

export const createFolder = async (data: { name: string; parent_folder_id?: number }): Promise<{ success: boolean; data: { folder: SharedFolder } }> => {
  const response = await api.post('/api/learner/shared-folders/folders', data);
  return response.data;
};

export const uploadFile = async (formData: FormData): Promise<{ success: boolean; data: { file: SharedFile } }> => {
  const response = await api.post('/api/learner/shared-folders/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteFile = async (fileId: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/api/learner/shared-folders/files/${fileId}`);
  return response.data;
};

export const deleteFolder = async (folderId: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/api/learner/shared-folders/folders/${folderId}`);
  return response.data;
};

export const downloadFile = async (fileId: number): Promise<any> => {
  const response = await api.get(`/api/learner/shared-folders/files/${fileId}/download`);
  return response.data;
};

export const viewFile = async (fileId: number): Promise<any> => {
  const response = await api.get(`/api/learner/shared-folders/files/${fileId}/view`);
  return response.data;
};

export const getFolderActivity = async (params?: { limit?: number; type?: 'all' | 'uploads' | 'deletions' | 'folder_operations' }): Promise<{ success: boolean; data: any[] }> => {
  const response = await api.get('/api/learner/shared-folders/activity', { params });
  return response.data;
};

// Results
export const getLearnerResults = async (params?: { course_id?: number; format?: 'summary' | 'detailed' }): Promise<{ success: boolean; data: { courses: CourseResult[] } }> => {
  const response = await api.get('/api/learner/results', { params });
  return response.data;
};

export const generateBulletin = async (data: { course_id?: number; format?: string }): Promise<{ success: boolean; data: { bulletin_url: string; download_url: string; generated_at: string } }> => {
  const response = await api.post('/api/learner/results/bulletins/generate', data);
  return response.data;
};

export const generateCertificate = async (courseId: number): Promise<{ success: boolean; data: { certificate: any } }> => {
  const response = await api.post('/api/learner/results/certificates/generate', { course_id: courseId });
  return response.data;
};

export const generateSchoolCertificate = async (): Promise<{ success: boolean; data: { certificate_url: string; download_url: string; generated_at: string } }> => {
  const response = await api.post('/api/learner/results/school-certificates/generate');
  return response.data;
};

export const getCertificates = async (params?: { type?: 'all' | 'course' | 'school'; course_id?: number }): Promise<{ success: boolean; data: { certificates: any[] } }> => {
  const response = await api.get('/api/learner/results/certificates', { params });
  return response.data;
};

// News & Events
export const getLearnerNews = async (params?: {
  type?: 'all' | 'news' | 'events';
  status?: 'all' | 'upcoming' | 'past';
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: { items: NewsItem[]; pagination: any } }> => {
  const response = await api.get('/api/learner/news', { params });
  return response.data;
};

export const getLearnerNewsItem = async (itemId: number): Promise<{ success: boolean; data: NewsItem }> => {
  const response = await api.get(`/api/learner/news/${itemId}`);
  return response.data;
};

export const registerToEvent = async (eventId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/learner/events/${eventId}/register`);
  return response.data;
};

export const getPastEvents = async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: { events: NewsItem[]; pagination: any } }> => {
  const response = await api.get('/api/learner/events/past', { params });
  return response.data;
};

// Notifications
export interface LearnerNotification {
  id: number;
  uuid: string;
  text: string;
  target_url: string | null;
  is_seen: boolean;
  sender: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface NotificationCount {
  unread_count: number;
  total_count: number;
}

export const getLearnerNotifications = async (params?: {
  page?: number;
  per_page?: number;
  status?: 'all' | 'read' | 'unread';
}): Promise<{
  success: boolean;
  data: {
    notifications: LearnerNotification[];
    pagination: NotificationPagination;
    unread_count: number;
  };
}> => {
  const response = await api.get('/api/learner/notifications', { params });
  return response.data;
};

export const getLearnerNotificationCount = async (): Promise<{
  success: boolean;
  data: NotificationCount;
}> => {
  const response = await api.get('/api/learner/notifications/count');
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string | number): Promise<{
  success: boolean;
  message: string;
  data: {
    id: number;
    uuid: string;
    is_seen: boolean;
  };
}> => {
  const response = await api.put(`/api/learner/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
  message: string;
  data: {
    updated_count: number;
  };
}> => {
  const response = await api.put('/api/learner/notifications/read-all');
  return response.data;
};

// About
export const getAboutInfo = async (): Promise<{ success: boolean; data: { organization: any; tutorial: any } }> => {
  const response = await api.get('/api/learner/about');
  return response.data;
};

