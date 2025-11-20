/**
 * Types TypeScript pour l'API Templates Email Système & Notifications
 * À utiliser dans votre projet frontend TypeScript/React/Vue
 */

// ============================================
// Types de Base
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  data: [];
}

// ============================================
// Templates Email Système
// ============================================

export type EmailTemplateType =
  | 'welcome'
  | 'password_reset'
  | 'user_created'
  | 'password_changed'
  | 'course_enrolled'
  | 'course_completed'
  | 'certificate_issued'
  | 'session_reminder';

export interface EmailTemplate {
  id: number;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[];
}

export interface EmailTemplateUpdateRequest {
  subject?: string;
  body?: string;
  is_active?: boolean;
  variables?: string[];
}

export interface EmailTemplatePreviewRequest {
  data: Record<string, any>;
}

export interface EmailTemplatePreviewResponse {
  subject: string;
  body: string;
}

// ============================================
// Notifications Système
// ============================================

export type NotificationType =
  | 'user_registered'
  | 'course_enrolled'
  | 'course_completed'
  | 'certificate_issued'
  | 'session_reminder'
  | 'assignment_due'
  | 'new_message'
  | 'system_update';

export interface EmailTemplateReference {
  id: number;
  type: EmailTemplateType;
  name: string;
}

export interface SystemNotification {
  id: number;
  type: NotificationType;
  name: string;
  description: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  email_template_id: number | null;
  email_template: EmailTemplateReference | null;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemNotificationListResponse {
  notifications: SystemNotification[];
}

export interface SystemNotificationUpdateRequest {
  email_enabled?: boolean;
  push_enabled?: boolean;
  sms_enabled?: boolean;
  in_app_enabled?: boolean;
  email_template_id?: number | null;
  message?: string | null;
  is_active?: boolean;
}

// ============================================
// Filtres de Requête
// ============================================

export interface EmailTemplateFilters {
  is_active?: boolean;
  type?: EmailTemplateType;
  search?: string;
}

export interface SystemNotificationFilters {
  is_active?: boolean;
  type?: NotificationType;
  email_enabled?: boolean;
  push_enabled?: boolean;
  sms_enabled?: boolean;
  in_app_enabled?: boolean;
  search?: string;
}

// ============================================
// Constantes
// ============================================

export const EMAIL_TEMPLATE_TYPES: Record<string, EmailTemplateType> = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  USER_CREATED: 'user_created',
  PASSWORD_CHANGED: 'password_changed',
  COURSE_ENROLLED: 'course_enrolled',
  COURSE_COMPLETED: 'course_completed',
  CERTIFICATE_ISSUED: 'certificate_issued',
  SESSION_REMINDER: 'session_reminder',
};

export const NOTIFICATION_TYPES: Record<string, NotificationType> = {
  USER_REGISTERED: 'user_registered',
  COURSE_ENROLLED: 'course_enrolled',
  COURSE_COMPLETED: 'course_completed',
  CERTIFICATE_ISSUED: 'certificate_issued',
  SESSION_REMINDER: 'session_reminder',
  ASSIGNMENT_DUE: 'assignment_due',
  NEW_MESSAGE: 'new_message',
  SYSTEM_UPDATE: 'system_update',
};

// ============================================
// Exemple d'utilisation avec Axios
// ============================================

/*
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Service pour Templates Email
export class EmailTemplateService {
  private static getHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    };
  }

  static async getAll(filters?: EmailTemplateFilters): Promise<ApiResponse<EmailTemplateListResponse>> {
    const response = await axios.get(`${API_BASE_URL}/superadmin/system-email-templates`, {
      params: filters,
      headers: this.getHeaders(),
    });
    return response.data;
  }

  static async getById(id: number): Promise<ApiResponse<EmailTemplate>> {
    const response = await axios.get(
      `${API_BASE_URL}/superadmin/system-email-templates/${id}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async update(
    id: number,
    data: EmailTemplateUpdateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    const response = await axios.put(
      `${API_BASE_URL}/superadmin/system-email-templates/${id}`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async delete(id: number): Promise<ApiResponse<[]>> {
    const response = await axios.delete(
      `${API_BASE_URL}/superadmin/system-email-templates/${id}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async preview(
    id: number,
    sampleData: Record<string, any>
  ): Promise<ApiResponse<EmailTemplatePreviewResponse>> {
    const response = await axios.post(
      `${API_BASE_URL}/superadmin/system-email-templates/${id}/preview`,
      { data: sampleData },
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

// Service pour Notifications
export class SystemNotificationService {
  private static getHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    };
  }

  static async getAll(filters?: SystemNotificationFilters): Promise<ApiResponse<SystemNotificationListResponse>> {
    const response = await axios.get(`${API_BASE_URL}/superadmin/system-notifications`, {
      params: filters,
      headers: this.getHeaders(),
    });
    return response.data;
  }

  static async getById(id: number): Promise<ApiResponse<SystemNotification>> {
    const response = await axios.get(
      `${API_BASE_URL}/superadmin/system-notifications/${id}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  static async update(
    id: number,
    data: SystemNotificationUpdateRequest
  ): Promise<ApiResponse<SystemNotification>> {
    const response = await axios.put(
      `${API_BASE_URL}/superadmin/system-notifications/${id}`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}
*/

