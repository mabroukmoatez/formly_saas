import apiClient from './api';

const API_BASE = '/api/student/dashboard';

export interface StudentStatistics {
  active_courses: number;
  completed_courses: number;
  hours_learned: number;
  average_score: number;
}

export interface CourseProgress {
  id: number;
  course: {
    id: number;
    uuid: string;
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    average_rating?: number;
    slug: string;
    price?: number;
    old_price?: number;
  };
  progress: number;
  enrolled_at: string;
  status: number;
}

export interface RecentCoursesResponse {
  enrollments: CourseProgress[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CourseProgressSummary {
  course_id: number;
  course_title: string;
  progress_percentage: number;
}

export interface UpcomingSession {
  id: number;
  course_id: number;
  title: string;
  date: string;
  time: string;
  duration?: number;
  instructor?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const studentDashboardService = {
  /**
   * Get student dashboard statistics
   */
  getStatistics: async (): Promise<ApiResponse<StudentStatistics>> => {
    const response = await apiClient.get(`${API_BASE}/statistics`);
    return response;
  },

  /**
   * Get student's recent courses with pagination
   */
  getRecentCourses: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<RecentCoursesResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}/recent-courses?${queryString}` : `${API_BASE}/recent-courses`;

    const response = await apiClient.get(url);
    return response;
  },

  /**
   * Get student's progress summary for all courses
   */
  getProgressSummary: async (): Promise<ApiResponse<{ courses_progress: CourseProgressSummary[] }>> => {
    const response = await apiClient.get(`${API_BASE}/progress-summary`);
    return response;
  },

  /**
   * Get student's upcoming sessions
   */
  getUpcomingSessions: async (): Promise<ApiResponse<{ upcoming_sessions: UpcomingSession[] }>> => {
    const response = await apiClient.get(`${API_BASE}/upcoming-sessions`);
    return response;
  },
};
