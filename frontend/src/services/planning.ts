import { apiService } from './api';

// ===================================
// TYPES
// ===================================

export interface SessionTrainer {
  id: string;
  uuid: string;
  name: string;
  email: string;
  role?: string;
  is_primary: boolean;
}

export interface SessionCategory {
  id: number;
  name: string;
}

export interface Session {
  id: number;
  uuid: string;
  title: string;
  description: string;
  status: string;
  price: number;
  duration: string;
  max_participants: number;
  current_participants: number;
  session_start_date: string;
  session_end_date: string;
  category?: SessionCategory;
  trainers: SessionTrainer[];
  instances_count: number;
  upcoming_instances: number;
  participants_count: number;
}

export interface SessionInstance {
  id: number | string;
  uuid: string;
  title: string;
  description?: string;
  instance_type: 'presentiel' | 'distanciel' | 'e-learning';
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_type?: 'physical' | 'online';
  location_address?: string;
  location_city?: string;
  location_room?: string;
  meeting_link?: string;
  platform_type?: 'zoom' | 'google_meet' | 'teams' | 'custom';
  meeting_id?: string;
  meeting_password?: string;
  max_participants: number;
  current_participants: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  is_active: boolean;
  is_cancelled: boolean;
  trainers: SessionTrainer[];
  participants_count: number;
  attendance_tracked: boolean;
  attendance_required: boolean;
  session?: {
    id: number;
    uuid: string;
    title: string;
    description: string;
  };
}

export interface OrganizationEvent {
  id: number | string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: 'meeting' | 'conference' | 'exam' | 'training' | 'other';
  location?: string;
  meeting_link?: string;
  description?: string;
}

export interface CalendarItem {
  id: string;
  type: 'event' | 'session_instance' | 'course';
  title: string;
  description?: string;
  start: string;
  end: string;
  color?: string;
  location?: string;
  location_city?: string;
  location_room?: string;
  is_online?: boolean;
  meeting_link?: string;
  platform_type?: string;
  status?: string;
  duration_minutes?: number;
  instance_type?: 'presentiel' | 'distanciel' | 'e-learning';
  session?: {
    id: number;
    uuid: string;
    title: string;
    description: string;
  };
  trainers?: SessionTrainer[];
  participants_count?: number;
  max_participants?: number;
  current_participants?: number;
  attendance_tracked?: boolean;
  attendance_required?: boolean;
}

export interface PlanningStats {
  total_sessions: number;
  total_instances: number;
  total_events: number;
  instances_by_type: {
    presentiel: number;
    distanciel: number;
    'e-learning': number;
  };
  instances_by_status: {
    scheduled: number;
    ongoing: number;
    completed: number;
  };
  total_participants: number;
  max_capacity: number;
}

export interface PlanningOverview {
  stats: PlanningStats;
  sessions: Session[];
  courses?: Array<{
    id: number;
    uuid: string;
    title: string;
    subtitle: string;
    description: string;
    status: number;
    price: string;
    duration: number;
    duration_days: number;
    course_type: number;
    created_at: string;
    updated_at: string;
    category?: {
      id: number;
      name: string;
    };
    instructors?: Array<{
      id: number;
      name: string;
      email?: string;
    }>;
  }>;
  upcoming_instances: SessionInstance[];
  events: OrganizationEvent[];
}

export interface CalendarData {
  events: CalendarItem[];
  sessions: CalendarItem[];
}

// ===================================
// API FUNCTIONS
// ===================================

/**
 * Get all sessions for planning
 */
export const getSessions = async (params?: {
  status?: string;
  category_id?: number;
  trainer_id?: string;
  search?: string;
}): Promise<Session[]> => {
  const response = await apiService.get<{ success: boolean; data: Session[] }>(
    '/api/admin/organization/sessions/planning',
    { params }
  );
  return response.data;
};

/**
 * Get session instances
 */
export const getSessionInstances = async (
  sessionId: number,
  params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    instance_type?: string;
  }
): Promise<{ session: Session; instances: SessionInstance[] }> => {
  const response = await apiService.get<{
    success: boolean;
    data: { session: Session; instances: SessionInstance[] };
  }>(`/api/admin/organization/sessions/${sessionId}/instances`, { params });
  return response.data;
};

/**
 * Get planning overview
 */
export const getPlanningOverview = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<PlanningOverview> => {
  const response = await apiService.get<{ success: boolean; data: PlanningOverview }>(
    '/api/admin/organization/planning/overview',
    { params }
  );
  return response.data;
};

/**
 * Get calendar data (enhanced)
 */
export const getCalendarData = async (params?: {
  start_date?: string;
  end_date?: string;
  show_events?: boolean;
  show_sessions?: boolean;
  trainer_id?: string;
  session_id?: number;
  instance_type?: string;
  status?: string;
}): Promise<CalendarData> => {
  const response = await apiService.get<{ success: boolean; data: CalendarData }>(
    '/api/admin/organization/calendar',
    { params }
  );
  return response.data;
};

/**
 * Create session instance
 */
export const createSessionInstance = async (
  sessionId: number,
  data: Partial<SessionInstance>
): Promise<SessionInstance> => {
  const response = await apiService.post<{ success: boolean; data: SessionInstance }>(
    `/api/admin/organization/sessions/${sessionId}/instances`,
    data
  );
  return response.data;
};

/**
 * Update session instance
 */
export const updateSessionInstance = async (
  sessionId: number,
  instanceId: number,
  data: Partial<SessionInstance>
): Promise<SessionInstance> => {
  const response = await apiService.put<{ success: boolean; data: SessionInstance }>(
    `/api/admin/organization/sessions/${sessionId}/instances/${instanceId}`,
    data
  );
  return response.data;
};

/**
 * Cancel session instance
 */
export const cancelSessionInstance = async (
  sessionId: number,
  instanceId: number,
  reason: string
): Promise<void> => {
  await apiService.post(
    `/api/admin/organization/sessions/${sessionId}/instances/${instanceId}/cancel`,
    { cancellation_reason: reason }
  );
};

/**
 * Get instance type color
 */
export const getInstanceTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    presentiel: '#10B981', // Green
    distanciel: '#3B82F6', // Blue
    'e-learning': '#8B5CF6', // Purple
  };
  return colors[type] || '#6B7280';
};

/**
 * Get event type color
 */
export const getEventTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    training: '#3B82F6', // Blue
    conference: '#F59E0B', // Orange
    meeting: '#6B7280', // Gray
    exam: '#EF4444', // Red
    other: '#8B5CF6', // Purple
  };
  return colors[type] || '#6B7280';
};

/**
 * Get status label in French
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Programmée',
    ongoing: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
    postponed: 'Reportée',
  };
  return labels[status] || status;
};

/**
 * Get instance type label in French
 */
export const getInstanceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    presentiel: 'Présentiel',
    distanciel: 'Distanciel',
    'e-learning': 'E-learning',
  };
  return labels[type] || type;
};

