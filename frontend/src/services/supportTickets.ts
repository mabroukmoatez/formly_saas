import { apiService } from './api';
import {
  SupportTicket,
  SupportTicketsListParams,
  SupportTicketsListResponse,
  SupportTicketDetailsResponse,
  SupportTicketCreateResponse,
  SupportTicketReplyResponse,
  SupportTicketMetadataResponse,
  SupportTicketStatisticsResponse,
  CreateTicketData,
  ReplyTicketData,
  UpdateTicketStatusData,
  AssignDepartmentData,
} from './supportTickets.types';

/**
 * Service for Support Tickets Management
 */
class SupportTicketsService {
  // ============ ORGANIZATION ENDPOINTS ============

  /**
   * Get list of support tickets for the organization
   */
  async getTickets(params?: SupportTicketsListParams): Promise<SupportTicketsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status.toString());
    if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = '/api/organization/support-tickets' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<SupportTicketsListResponse>(endpoint);
  }

  /**
   * Get metadata (departments, priorities, services)
   */
  async getMetadata(): Promise<SupportTicketMetadataResponse> {
    return await apiService.get<SupportTicketMetadataResponse>('/api/organization/support-tickets/metadata');
  }

  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketData): Promise<SupportTicketCreateResponse> {
    return await apiService.post<SupportTicketCreateResponse>('/api/organization/support-tickets', data);
  }

  /**
   * Get ticket details by UUID
   */
  async getTicketById(uuid: string): Promise<SupportTicketDetailsResponse> {
    return await apiService.get<SupportTicketDetailsResponse>(`/api/organization/support-tickets/${uuid}`);
  }

  /**
   * Reply to a ticket
   */
  async replyToTicket(uuid: string, data: ReplyTicketData): Promise<SupportTicketReplyResponse> {
    return await apiService.post<SupportTicketReplyResponse>(`/api/organization/support-tickets/${uuid}/reply`, data);
  }

  /**
   * Close a ticket
   */
  async closeTicket(uuid: string): Promise<{ success: boolean; message?: string }> {
    return await apiService.post<{ success: boolean; message?: string }>(`/api/organization/support-tickets/${uuid}/close`, {});
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all tickets (admin only)
   */
  async getAllTickets(params?: SupportTicketsListParams & { organization_id?: number }): Promise<SupportTicketsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status.toString());
    if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = '/api/admin/support-tickets' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<SupportTicketsListResponse>(endpoint);
  }

  /**
   * Get ticket statistics (admin only)
   */
  async getStatistics(): Promise<SupportTicketStatisticsResponse> {
    return await apiService.get<SupportTicketStatisticsResponse>('/api/admin/support-tickets/statistics');
  }

  /**
   * Get ticket details by UUID (admin)
   */
  async getTicketByIdAdmin(uuid: string): Promise<SupportTicketDetailsResponse> {
    return await apiService.get<SupportTicketDetailsResponse>(`/api/admin/support-tickets/${uuid}`);
  }

  /**
   * Reply to a ticket as admin
   */
  async replyToTicketAdmin(uuid: string, data: ReplyTicketData): Promise<SupportTicketReplyResponse> {
    return await apiService.post<SupportTicketReplyResponse>(`/api/admin/support-tickets/${uuid}/reply`, data);
  }

  /**
   * Update ticket status (admin)
   */
  async updateTicketStatus(uuid: string, data: UpdateTicketStatusData): Promise<{ success: boolean; message?: string }> {
    return await apiService.post<{ success: boolean; message?: string }>(`/api/admin/support-tickets/${uuid}/status`, data);
  }

  /**
   * Assign department to ticket (admin)
   */
  async assignDepartment(uuid: string, data: AssignDepartmentData): Promise<{ success: boolean; message?: string }> {
    return await apiService.post<{ success: boolean; message?: string }>(`/api/admin/support-tickets/${uuid}/assign-department`, data);
  }
}

export const supportTicketsService = new SupportTicketsService();

