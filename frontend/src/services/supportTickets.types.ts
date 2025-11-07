/**
 * Support Tickets Types
 * Types for Support Tickets Management System
 */

export interface TicketDepartment {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TicketPriority {
  id: number;
  name: string;
  level?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TicketRelatedService {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  message: string;
  send_user_id?: number;
  reply_user_id?: number;
  is_admin_reply: boolean;
  created_at: string;
  updated_at: string;
  sendUser?: {
    id: number;
    name: string;
    email: string;
  };
  replyUser?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SupportTicket {
  uuid: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 1 | 2; // 1 = ouvert, 2 = fermé
  organization_id: number;
  user_id: number;
  department_id: number;
  priority_id: number;
  related_service_id?: number;
  created_at: string;
  updated_at: string;
  department?: TicketDepartment;
  priority?: TicketPriority;
  service?: TicketRelatedService;
  organization?: {
    id: number;
    organization_name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  messages?: TicketMessage[];
  messages_count?: number;
}

export interface SupportTicketsMetadata {
  departments: TicketDepartment[];
  priorities: TicketPriority[];
  services: TicketRelatedService[];
}

export interface CreateTicketData {
  subject: string;
  description: string;
  department_id: number;
  priority_id: number;
  related_service_id?: number;
}

export interface ReplyTicketData {
  message: string;
}

export interface UpdateTicketStatusData {
  status: 1 | 2;
}

export interface AssignDepartmentData {
  department_id: number;
}

export interface SupportTicketsListParams {
  page?: number;
  per_page?: number;
  status?: 1 | 2;
  department_id?: number;
  search?: string;
}

export interface SupportTicketsListResponse {
  success: boolean;
  data: {
    data: SupportTicket[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message?: string;
}

export interface SupportTicketDetailsResponse {
  success: boolean;
  data: SupportTicket;
  message?: string;
}

export interface SupportTicketCreateResponse {
  success: boolean;
  data: SupportTicket;
  message?: string;
}

export interface SupportTicketReplyResponse {
  success: boolean;
  data: TicketMessage;
  message?: string;
}

export interface SupportTicketMetadataResponse {
  success: boolean;
  data: SupportTicketsMetadata;
  message?: string;
}

export interface SupportTicketStatistics {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  tickets_by_department: Array<{
    department_id: number;
    department_name: string;
    count: number;
  }>;
  tickets_by_organization: Array<{
    organization_id: number;
    organization_name: string;
    count: number;
  }>;
}

export interface SupportTicketStatisticsResponse {
  success: boolean;
  data: SupportTicketStatistics;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

