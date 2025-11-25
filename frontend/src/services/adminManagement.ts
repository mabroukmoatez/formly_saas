import { apiService } from './api';
import type {
  OrganizationSettings,
  AdminMessage,
  MessagesResponse,
  SendMessageData,
  AdminMailingList,
  AdminNews,
  CreateNewsData,
  AdminEvent,
  CreateEventData,
  CalendarData,
  AdminDashboardStats,
  AdminReportConnections,
  AdminReportExport
} from './adminManagement.types';

// ===================================
// 1. ORGANIZATION SETTINGS
// ===================================

/**
 * Get organization settings
 */
export const getOrganizationSettings = async (): Promise<OrganizationSettings> => {
  const response = await apiService.get<{ success: boolean; data: OrganizationSettings }>('/api/admin/organization/settings');
  return response.data;
};

/**
 * Update organization settings
 */
export const updateOrganizationSettings = async (data: FormData): Promise<OrganizationSettings> => {
  // Check if _method is already appended
  let hasMethod = false;
  for (const [key] of data.entries()) {
    if (key === '_method') {
      hasMethod = true;
      break;
    }
  }
  if (!hasMethod) {
    data.append('_method', 'PUT');
  }
  
  // Log FormData for debugging
  console.log('📤 Sending FormData to updateOrganizationSettings:');
  for (const [key, value] of data.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  const response = await apiService.post<{ success: boolean; data: OrganizationSettings }>(
    '/api/admin/organization/settings',
    data,
    {
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary automatically
      },
    }
  );

  console.log('🔍 Backend response:', response);
  
  // Backend returns the organization object directly
  return response.data.data;
};

// ===================================
// ORGANIZATION DOCUMENTS
// ===================================

export interface OrganizationDocument {
  id?: number;
  name: string;
  path?: string;
  url?: string;
  size?: number;
  mime_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationDocumentsResponse {
  cgv: OrganizationDocument | null;
  internal_regulations: OrganizationDocument | null;
  custom_documents: OrganizationDocument[];
}

/**
 * Get all organization documents
 */
export const getOrganizationDocuments = async (): Promise<OrganizationDocumentsResponse> => {
  const response = await apiService.get<{ success: boolean; data: OrganizationDocumentsResponse }>('/api/admin/organization/documents');
  // Handle both wrapped and direct responses
  const responseData = response.data?.data || response.data;
  return responseData || {
    cgv: null,
    internal_regulations: null,
    custom_documents: [],
  };
};

/**
 * Rename a custom document
 */
export const renameOrganizationDocument = async (documentId: number, name: string): Promise<OrganizationDocument> => {
  const response = await apiService.patch<{ success: boolean; data: OrganizationDocument }>(
    `/api/admin/organization/documents/${documentId}/rename`,
    { name }
  );
  return response.data.data;
};

/**
 * Delete a custom document
 */
export const deleteOrganizationDocument = async (documentId: number): Promise<void> => {
  await apiService.delete(`/api/admin/organization/documents/${documentId}`);
};

/**
 * Get document view URL
 */
export const getOrganizationDocumentViewUrl = async (documentId: number): Promise<string> => {
  const response = await apiService.get<{ success: boolean; data: { url: string; mime_type: string } }>(
    `/api/admin/organization/documents/${documentId}/view`
  );
  return response.data.data.url;
};

/**
 * Download a document
 */
export const downloadOrganizationDocument = async (documentId: number, filename: string): Promise<void> => {
  const response = await apiService.get(
    `/api/admin/organization/documents/${documentId}/download`,
    {
      responseType: 'blob',
    }
  );
  
  // Create blob and download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ===================================
// 2. MESSAGING
// ===================================

/**
 * Get messages (inbox, sent, archived)
 */
export const getMessages = async (params: {
  type?: 'inbox' | 'sent' | 'archived';
  page?: number;
  per_page?: number;
}): Promise<MessagesResponse> => {
  const response = await apiService.get<{ success: boolean; data: MessagesResponse }>('/api/admin/messages', { params });
  return response.data;
};

/**
 * Send a new message
 */
export const sendMessage = async (data: SendMessageData): Promise<{ message: AdminMessage; recipients_count: number }> => {
  const formData = new FormData();
  
  if (data.recipient_id) {
    formData.append('recipient_id', data.recipient_id.toString());
  }
  if (data.recipient_type) {
    formData.append('recipient_type', data.recipient_type);
  }
  if (data.mailing_list_id) {
    formData.append('mailing_list_id', data.mailing_list_id.toString());
  }
  formData.append('subject', data.subject);
  formData.append('message', data.message);
  
  if (data.reply_to) {
    formData.append('reply_to', data.reply_to.toString());
  }
  
  if (data.attachments && data.attachments.length > 0) {
    data.attachments.forEach((file) => {
      formData.append('attachments[]', file);
    });
  }

  const response = await apiService.post<{ success: boolean; data: { message: AdminMessage; recipients_count: number } }>(
    '/api/admin/messages',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: number): Promise<void> => {
  await apiService.put(`/api/admin/messages/${messageId}/read`);
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: number): Promise<void> => {
  await apiService.delete(`/api/admin/messages/${messageId}`);
};

/**
 * Archive a message
 */
export const archiveMessage = async (messageId: number): Promise<void> => {
  await apiService.post(`/api/admin/messages/${messageId}/archive`);
};

// ===================================
// 3. MAILING LISTS
// ===================================

/**
 * Get all mailing lists
 */
export const getMailingLists = async (params?: {
  type?: 'course' | 'session' | 'custom' | 'all_students' | 'all_instructors';
  editable_only?: boolean;
  course_id?: number;
}): Promise<AdminMailingList[]> => {
  const response = await apiService.get<{ success: boolean; data: AdminMailingList[] }>('/api/admin/mailing-lists', { params });
  return response.data;
};

/**
 * Create a new mailing list
 */
export const createMailingList = async (data: {
  name: string;
  description?: string;
  type: 'custom';
  recipients: number[];
}): Promise<AdminMailingList> => {
  const response = await apiService.post<{ success: boolean; data: AdminMailingList }>('/api/admin/mailing-lists', data);
  return response.data;
};

/**
 * Update a mailing list
 */
export const updateMailingList = async (id: number, data: {
  name?: string;
  recipients?: number[];
}): Promise<AdminMailingList> => {
  const response = await apiService.put<{ success: boolean; data: AdminMailingList }>(`/api/admin/mailing-lists/${id}`, data);
  return response.data;
};

/**
 * Add recipients to a mailing list
 */
export const addMailingListRecipients = async (id: number, recipients: number[]): Promise<void> => {
  await apiService.post(`/api/admin/mailing-lists/${id}/recipients/add`, { recipients });
};

/**
 * Remove recipients from a mailing list
 */
export const removeMailingListRecipients = async (id: number, recipients: number[]): Promise<void> => {
  await apiService.post(`/api/admin/mailing-lists/${id}/recipients/remove`, { recipients });
};

/**
 * Delete a mailing list
 */
export const deleteMailingList = async (id: number): Promise<void> => {
  await apiService.delete(`/api/admin/mailing-lists/${id}`);
};

// ===================================
// 4. NEWS
// ===================================

/**
 * Get all news articles
 */
export const getNews = async (params?: {
  status?: 'published' | 'draft' | 'archived';
  page?: number;
}): Promise<{ news: AdminNews[]; pagination: any }> => {
  const response = await apiService.get<{ success: boolean; data: { news: AdminNews[]; pagination: any } }>('/api/admin/news', { params });
  return response.data;
};

/**
 * Create a news article
 */
export const createNews = async (data: CreateNewsData): Promise<AdminNews> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('status', data.status);
  formData.append('is_visible_to_students', data.is_visible_to_students ? '1' : '0');
  
  if (data.image) {
    formData.append('image', data.image);
  }
  if (data.external_link) {
    formData.append('external_link', data.external_link);
  }
  if (data.published_at) {
    formData.append('published_at', data.published_at);
  }

  const response = await apiService.post<{ success: boolean; data: AdminNews }>('/api/admin/news', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Update a news article
 */
export const updateNews = async (id: number, data: Partial<CreateNewsData>): Promise<AdminNews> => {
  const formData = new FormData();
  
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.status) formData.append('status', data.status);
  if (typeof data.is_visible_to_students !== 'undefined') {
    formData.append('is_visible_to_students', data.is_visible_to_students ? '1' : '0');
  }
  if (data.image) formData.append('image', data.image);
  if (data.external_link) formData.append('external_link', data.external_link);
  if (data.published_at) formData.append('published_at', data.published_at);

  const response = await apiService.post<{ success: boolean; data: AdminNews }>(`/api/admin/news/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Delete a news article
 */
export const deleteNews = async (id: number): Promise<void> => {
  await apiService.delete(`/api/admin/news/${id}`);
};

/**
 * Publish a news article
 */
export const publishNews = async (id: number): Promise<void> => {
  await apiService.post(`/api/admin/news/${id}/publish`);
};

/**
 * Archive a news article
 */
export const archiveNews = async (id: number): Promise<void> => {
  await apiService.post(`/api/admin/news/${id}/archive`);
};

/**
 * Toggle news visibility
 */
export const toggleNewsVisibility = async (id: number): Promise<void> => {
  await apiService.post(`/api/admin/news/${id}/toggle-visibility`);
};

// ===================================
// 5. EVENTS
// ===================================

/**
 * Get all events
 */
export const getEvents = async (params?: {
  status?: 'upcoming' | 'past' | 'cancelled';
  page?: number;
}): Promise<{ events: AdminEvent[]; pagination: any }> => {
  const response = await apiService.get<{ success: boolean; data: { events: AdminEvent[]; pagination: any } }>('/api/admin/events', { params });
  return response.data;
};

/**
 * Create an event
 */
export const createEvent = async (data: CreateEventData): Promise<AdminEvent> => {
  const response = await apiService.post<{ success: boolean; data: AdminEvent }>('/api/admin/events', data);
  return response.data;
};

/**
 * Update an event
 */
export const updateEvent = async (id: number, data: Partial<CreateEventData>): Promise<AdminEvent> => {
  const response = await apiService.put<{ success: boolean; data: AdminEvent }>(`/api/admin/events/${id}`, data);
  return response.data;
};

/**
 * Delete an event
 */
export const deleteEvent = async (id: number): Promise<void> => {
  await apiService.delete(`/api/admin/events/${id}`);
};

/**
 * Cancel an event
 */
export const cancelEvent = async (id: number, reason?: string): Promise<void> => {
  await apiService.post(`/api/admin/events/${id}/cancel`, { reason });
};

/**
 * Toggle event visibility
 */
export const toggleEventVisibility = async (id: number): Promise<void> => {
  await apiService.post(`/api/admin/events/${id}/toggle-visibility`);
};

// ===================================
// 6. CALENDAR
// ===================================

/**
 * Get calendar data
 */
export const getCalendarData = async (params?: {
  start_date?: string;
  end_date?: string;
  type?: 'courses' | 'sessions' | 'events' | 'all';
}): Promise<CalendarData> => {
  const response = await apiService.get<{ success: boolean; data: CalendarData }>('/api/admin/calendar', { params });
  return response.data;
};

// ===================================
// 7. REPORTS & STATISTICS
// ===================================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (period?: 'week' | 'month' | 'year'): Promise<AdminDashboardStats> => {
  const response = await apiService.get<{ success: boolean; data: AdminDashboardStats }>('/api/admin/organization/reports/dashboard', {
    params: period ? { period } : undefined
  });
  return response.data;
};

/**
 * Get connection report
 */
export const getConnectionReport = async (params?: {
  start_date?: string;
  end_date?: string;
  role?: 'student' | 'instructor';
}): Promise<AdminReportConnections> => {
  const response = await apiService.get<{ success: boolean; data: AdminReportConnections }>('/api/admin/organization/reports/connections', { params });
  return response.data;
};

/**
 * Get revenue report
 */
export const getRevenueReport = async (params?: {
  start_date?: string;
  end_date?: string;
  course_id?: number;
}): Promise<any> => {
  const response = await apiService.get<{ success: boolean; data: any }>('/api/admin/organization/reports/revenue', { params });
  return response.data;
};

/**
 * Get courses report
 */
export const getCoursesReport = async (params?: {
  status?: 'active' | 'completed' | 'upcoming';
  instructor_id?: number;
}): Promise<any> => {
  const response = await apiService.get<{ success: boolean; data: any }>('/api/admin/organization/reports/courses', { params });
  return response.data;
};

/**
 * Get students report
 */
export const getStudentsReport = async (params?: {
  course_id?: number;
  status?: 'active' | 'completed' | 'dropped';
}): Promise<any> => {
  const response = await apiService.get<{ success: boolean; data: any }>('/api/admin/organization/reports/students', { params });
  return response.data;
};

/**
 * Export report
 */
export const exportReport = async (data: {
  type: 'connections' | 'revenue' | 'courses' | 'students';
  format: 'excel' | 'pdf';
  start_date?: string;
  end_date?: string;
  filters?: Record<string, any>;
}): Promise<AdminReportExport> => {
  const response = await apiService.post<{ success: boolean; data: AdminReportExport }>('/api/admin/organization/reports/export', data);
  return response.data;
};

