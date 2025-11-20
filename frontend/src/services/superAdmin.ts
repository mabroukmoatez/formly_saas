import { apiService } from './api';

/**
 * Super Admin API Service
 * Handles all Super Admin API endpoints
 */

export interface SuperAdminDashboardData {
  period: string;
  date_range: {
    start: string;
    end: string;
  };
  kpis: {
    mrr: {
      value: number;
      trend: number;
      currency: string;
    };
    arr: {
      value: number;
      currency: string;
    };
    churn: {
      value: number;
      count: number;
      period: string;
    };
    arpu: {
      value: number;
      trend: number;
      currency: string;
    };
  };
  new_clients: {
    count: number;
    clients: any[];
  };
  aws_consumption: {
    total: number;
    currency: string;
    by_service: any[];
  };
  top_clients: any[];
  instances: {
    total: number;
    active: number;
    in_error: number;
    over_quota: number;
    suspended: number;
  };
}

export interface Organization {
  id: number;
  uuid: string;
  organization_name: string;
  company_name: string;
  email: string;
  phone?: string;
  siret?: string;
  siren?: string;
  status: number;
  super_admin_status: string;
  super_admin_plan?: Plan;
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  monthly_price: string;
  yearly_price: string;
  currency: string;
  max_storage_gb: number;
  max_users: number;
  max_video_minutes?: number;
  max_compute_hours?: number;
  max_bandwidth_gb?: number;
  sla_level?: string;
  backup_retention_days?: number;
  ssl_included?: boolean;
  support_included?: boolean;
  support_level?: string;
  is_active: boolean;
  is_featured: boolean;
}

export interface Subscription {
  id: number;
  organization_id: number;
  plan_id: number;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: Plan;
  organization?: Organization;
}

export interface Instance {
  id: number;
  organization_id: number;
  status: string;
  health_status: string;
  region: string;
  instance_type: string;
  created_at: string;
  organization?: Organization;
}

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  max_uses?: number;
  max_uses_per_user?: number;
  minimum_amount?: number;
  target_plans?: number[];
  notes?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  action: string;
  module: string;
  severity: string;
  target_type: string;
  target_id: number;
  target_name: string;
  status: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: string;
  level: number;
  is_active: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  description?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

class SuperAdminService {
  /**
   * Dashboard
   */
  async getDashboard(period: string = '30d'): Promise<{ success: boolean; data: SuperAdminDashboardData }> {
    return apiService.get(`/api/superadmin/dashboard?period=${period}`);
  }

  /**
   * Organizations
   */
  async getOrganizations(params?: {
    search?: string;
    status?: string;
    plan_id?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: Organization[]; pagination: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.plan_id) queryParams.append('plan_id', params.plan_id.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/organizations?${queryParams.toString()}`);
  }

  async getOrganization(id: number): Promise<{ success: boolean; data: Organization }> {
    return apiService.get(`/api/superadmin/organizations/${id}`);
  }

  async createOrganization(data: Partial<Organization>): Promise<{ success: boolean; message: string; data: Organization }> {
    return apiService.post('/api/superadmin/organizations', data);
  }

  async updateOrganization(id: number, data: Partial<Organization>): Promise<{ success: boolean; message: string; data: Organization }> {
    return apiService.put(`/api/superadmin/organizations/${id}`, data);
  }

  async deleteOrganization(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/organizations/${id}`);
  }

  async suspendOrganization(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/organizations/${id}/suspend`, { reason });
  }

  async activateOrganization(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/organizations/${id}/activate`, {});
  }

  /**
   * Payment Gateways
   */
  async getPaymentGateways(organizationId: number): Promise<{ success: boolean; data: any[] }> {
    return apiService.get(`/api/superadmin/organizations/${organizationId}/payment-gateways`);
  }

  async createPaymentGateway(organizationId: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post(`/api/superadmin/organizations/${organizationId}/payment-gateways`, data);
  }

  async updatePaymentGateway(organizationId: number, gatewayId: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/organizations/${organizationId}/payment-gateways/${gatewayId}`, data);
  }

  async deletePaymentGateway(organizationId: number, gatewayId: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/organizations/${organizationId}/payment-gateways/${gatewayId}`);
  }

  async testPaymentGateway(organizationId: number, gatewayId: number): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post(`/api/superadmin/organizations/${organizationId}/payment-gateways/${gatewayId}/test`, {});
  }

  async setDefaultPaymentGateway(organizationId: number, gatewayId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/organizations/${organizationId}/payment-gateways/${gatewayId}/set-default`, {});
  }

  /**
   * SMTP Settings
   */
  async getSmtpSettings(organizationId: number): Promise<{ success: boolean; data: any[] }> {
    return apiService.get(`/api/superadmin/organizations/${organizationId}/smtp-settings`);
  }

  async createSmtpSetting(organizationId: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post(`/api/superadmin/organizations/${organizationId}/smtp-settings`, data);
  }

  async updateSmtpSetting(organizationId: number, smtpId: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/organizations/${organizationId}/smtp-settings/${smtpId}`, data);
  }

  async deleteSmtpSetting(organizationId: number, smtpId: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/organizations/${organizationId}/smtp-settings/${smtpId}`);
  }

  async testSmtpSetting(organizationId: number, smtpId: number, testEmail: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/organizations/${organizationId}/smtp-settings/${smtpId}/test`, { test_email: testEmail });
  }

  async setDefaultSmtpSetting(organizationId: number, smtpId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/organizations/${organizationId}/smtp-settings/${smtpId}/set-default`, {});
  }

  /**
   * Plans
   */
  async getPlans(): Promise<{ success: boolean; data: Plan[] }> {
    return apiService.get('/api/superadmin/plans');
  }

  async getPlan(id: number): Promise<{ success: boolean; data: Plan }> {
    return apiService.get(`/api/superadmin/plans/${id}`);
  }

  async createPlan(data: Partial<Plan>): Promise<{ success: boolean; message: string; data: Plan }> {
    return apiService.post('/api/superadmin/plans', data);
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<{ success: boolean; message: string; data: Plan }> {
    return apiService.put(`/api/superadmin/plans/${id}`, data);
  }

  async deletePlan(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/plans/${id}`);
  }

  async clonePlan(id: number): Promise<{ success: boolean; message: string; data: Plan }> {
    return apiService.post(`/api/superadmin/plans/${id}/clone`, {});
  }

  /**
   * Subscriptions
   */
  async getSubscriptions(params?: {
    status?: string;
    organization_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: Subscription[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/subscriptions?${queryParams.toString()}`);
  }

  async getSubscription(id: number): Promise<{ success: boolean; data: Subscription }> {
    return apiService.get(`/api/superadmin/subscriptions/${id}`);
  }

  async createSubscription(data: Partial<Subscription>): Promise<{ success: boolean; message: string; data: Subscription }> {
    return apiService.post('/api/superadmin/subscriptions', data);
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<{ success: boolean; message: string; data: Subscription }> {
    return apiService.put(`/api/superadmin/subscriptions/${id}`, data);
  }

  async upgradeSubscription(id: number): Promise<{ success: boolean; message: string; data: Subscription }> {
    return apiService.post(`/api/superadmin/subscriptions/${id}/upgrade`, {});
  }

  async downgradeSubscription(id: number): Promise<{ success: boolean; message: string; data: Subscription }> {
    return apiService.post(`/api/superadmin/subscriptions/${id}/downgrade`, {});
  }

  async cancelSubscription(id: number, reason: string, reasonType: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/subscriptions/${id}/cancel`, { reason, reason_type: reasonType });
  }

  /**
   * Instances
   */
  async getInstances(params?: {
    status?: string;
    health_status?: string;
    organization_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: Instance[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.health_status) queryParams.append('health_status', params.health_status);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/instances?${queryParams.toString()}`);
  }

  async getInstance(id: number): Promise<{ success: boolean; data: Instance }> {
    return apiService.get(`/api/superadmin/instances/${id}`);
  }

  async createInstance(data: Partial<Instance>): Promise<{ success: boolean; message: string; data: Instance }> {
    return apiService.post('/api/superadmin/instances', data);
  }

  async updateInstance(id: number, data: Partial<Instance>): Promise<{ success: boolean; message: string; data: Instance }> {
    return apiService.put(`/api/superadmin/instances/${id}`, data);
  }

  async deleteInstance(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/instances/${id}`);
  }

  async provisionInstance(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/instances/${id}/provision`, {});
  }

  async snapshotInstance(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/instances/${id}/snapshot`, {});
  }

  async restoreInstance(id: number, snapshotId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/instances/${id}/restore`, { snapshot_id: snapshotId });
  }

  async restartInstance(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/instances/${id}/restart`, {});
  }

  async suspendInstance(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/instances/${id}/suspend`, {});
  }

  async resumeInstance(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/instances/${id}/resume`, {});
  }

  /**
   * Coupons
   */
  async getCoupons(params?: {
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: Coupon[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/coupons?${queryParams.toString()}`);
  }

  async getCoupon(id: number): Promise<{ success: boolean; data: Coupon }> {
    return apiService.get(`/api/superadmin/coupons/${id}`);
  }

  async createCoupon(data: Partial<Coupon>): Promise<{ success: boolean; message: string; data: Coupon }> {
    return apiService.post('/api/superadmin/coupons', data);
  }

  async updateCoupon(id: number, data: Partial<Coupon>): Promise<{ success: boolean; message: string; data: Coupon }> {
    return apiService.put(`/api/superadmin/coupons/${id}`, data);
  }

  async deleteCoupon(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/coupons/${id}`);
  }

  async getCouponUsages(id: number): Promise<{ success: boolean; data: any[] }> {
    return apiService.get(`/api/superadmin/coupons/${id}/usages`);
  }

  async activateCoupon(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/coupons/${id}/activate`, {});
  }

  async deactivateCoupon(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/coupons/${id}/deactivate`, {});
  }

  /**
   * Audit Logs
   */
  async getAuditLogs(params?: {
    module?: string;
    action?: string;
    user_id?: number;
    severity?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: AuditLog[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.module) queryParams.append('module', params.module);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/audit-logs?${queryParams.toString()}`);
  }

  async getAuditLog(id: number): Promise<{ success: boolean; data: AuditLog }> {
    return apiService.get(`/api/superadmin/audit-logs/${id}`);
  }

  async exportAuditLogs(params?: {
    module?: string;
    action?: string;
    user_id?: number;
    severity?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.module) queryParams.append('module', params.module);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    return apiService.get(`/api/superadmin/audit-logs/export?${queryParams.toString()}`, { responseType: 'blob' });
  }

  /**
   * Roles & Permissions
   */
  async getRoles(): Promise<{ success: boolean; data: Role[] }> {
    return apiService.get('/api/superadmin/roles');
  }

  async getRole(id: number): Promise<{ success: boolean; data: Role }> {
    return apiService.get(`/api/superadmin/roles/${id}`);
  }

  async createRole(data: Partial<Role>): Promise<{ success: boolean; message: string; data: Role }> {
    return apiService.post('/api/superadmin/roles', data);
  }

  async updateRole(id: number, data: Partial<Role>): Promise<{ success: boolean; message: string; data: Role }> {
    return apiService.put(`/api/superadmin/roles/${id}`, data);
  }

  async deleteRole(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/roles/${id}`);
  }

  async assignPermission(roleId: number, permissionId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/roles/${roleId}/assign-permission`, { permission_id: permissionId });
  }

  async revokePermission(roleId: number, permissionId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/roles/${roleId}/revoke-permission`, { permission_id: permissionId });
  }

  /**
   * System Settings
   */
  async getSystemSettings(): Promise<{ success: boolean; data: any }> {
    return apiService.get('/api/superadmin/system/settings');
  }

  async getSettingsGroups(): Promise<{ success: boolean; data: string[] }> {
    return apiService.get('/api/superadmin/system/settings/groups');
  }

  async getSettingsByGroup(group: string): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/system/settings/groups/${group}`);
  }

  async getSetting(key: string): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/system/settings/${key}`);
  }

  async updateSetting(key: string, value: any): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/api/superadmin/system/settings/${key}`, { value });
  }

  async bulkUpdateSettings(settings: Record<string, any>): Promise<{ success: boolean; message: string }> {
    return apiService.post('/api/superadmin/system/settings/bulk', { settings });
  }

  /**
   * Global Course Management
   */
  async getCourses(params?: {
    status?: string;
    organization_id?: number;
    instructor_id?: number;
    category_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.instructor_id) queryParams.append('instructor_id', params.instructor_id.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/courses?${queryParams.toString()}`);
  }

  async getCourseStatistics(): Promise<{ success: boolean; data: any }> {
    return apiService.get('/api/superadmin/courses/statistics');
  }

  async getCourse(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/courses/${id}`);
  }

  async approveCourse(id: number, message?: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/courses/${id}/approve`, { message });
  }

  async rejectCourse(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/courses/${id}/reject`, { reason });
  }

  async holdCourse(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/courses/${id}/hold`, { reason });
  }

  async deleteCourse(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/courses/${id}`);
  }

  async getCourseEnrollments(id: number, perPage?: number): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    if (perPage) queryParams.append('per_page', perPage.toString());
    return apiService.get(`/api/superadmin/courses/${id}/enrollments?${queryParams.toString()}`);
  }

  async courseBulkAction(courseIds: number[], action: string): Promise<{ success: boolean; message: string }> {
    return apiService.post('/api/superadmin/courses/bulk-action', { course_ids: courseIds, action });
  }

  /**
   * Support Tickets
   */
  async getSupportTickets(params?: {
    status?: string;
    priority?: string;
    organization_id?: number;
    assigned_to?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/support-tickets?${queryParams.toString()}`);
  }

  async getSupportTicketStatistics(): Promise<{ success: boolean; data: any }> {
    return apiService.get('/api/superadmin/support-tickets/statistics');
  }

  async getSupportTicket(uuid: string): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/support-tickets/${uuid}`);
  }

  async assignTicket(uuid: string, assignedTo: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/support-tickets/${uuid}/assign`, { assigned_to: assignedTo });
  }

  async replyToTicket(uuid: string, message: string, isInternal: boolean = false): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/support-tickets/${uuid}/reply`, { message, is_internal: isInternal });
  }

  async closeTicket(uuid: string, resolution: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/support-tickets/${uuid}/close`, { resolution });
  }

  async setTicketPriority(uuid: string, priority: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/support-tickets/${uuid}/priority`, { priority });
  }

  /**
   * Quality Articles
   */
  async getQualityArticles(params?: {
    featured?: boolean;
    organization_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/quality-articles?${queryParams.toString()}`);
  }

  async getQualityArticle(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/quality-articles/${id}`);
  }

  async createQualityArticle(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/quality-articles', data);
  }

  async updateQualityArticle(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/quality-articles/${id}`, data);
  }

  async deleteQualityArticle(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/quality-articles/${id}`);
  }

  async assignOrganizationsToArticle(id: number, organizationIds: number[]): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/quality-articles/${id}/assign-organizations`, { organization_ids: organizationIds });
  }

  async toggleArticleFeatured(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.post(`/api/superadmin/quality-articles/${id}/toggle-featured`, {});
  }

  /**
   * News (Actualités Qualiopi)
   */
  async getNews(params?: {
    search?: string;
    category?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/news?${queryParams.toString()}`);
  }

  async getNewsItem(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/news/${id}`);
  }

  async createNews(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/news', data);
  }

  async updateNews(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/news/${id}`, data);
  }

  async deleteNews(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/news/${id}`);
  }

  async publishNews(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/news/${id}/publish`, {});
  }

  async distributeNews(id: number, organizationIds: number[], sendEmail: boolean = true): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/news/${id}/distribute`, { organization_ids: organizationIds, send_email: sendEmail });
  }

  async getNewsDistributions(id: number): Promise<{ success: boolean; data: any[] }> {
    return apiService.get(`/api/superadmin/news/${id}/distributions`);
  }

  async getNewsVersions(id: number): Promise<{ success: boolean; data: any[] }> {
    return apiService.get(`/api/superadmin/news/${id}/versions`);
  }

  /**
   * Margin Simulator
   */
  async calculateMargin(data: {
    plan_price: number;
    aws_costs: number;
    support_costs: number;
    other_costs: number;
  }): Promise<{ success: boolean; data: any }> {
    return apiService.post('/api/superadmin/simulator/margin', data);
  }

  /**
   * AWS Costs
   */
  async getAwsCosts(params: {
    start_date: string;
    end_date: string;
    organization_id?: number;
  }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    
    return apiService.get(`/api/superadmin/aws/costs?${queryParams.toString()}`);
  }

  async getAggregatedAwsCosts(period: string = 'monthly'): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/aws/costs/aggregated?period=${period}`);
  }

  async getAwsCostsByClient(): Promise<{ success: boolean; data: any[] }> {
    return apiService.get('/api/superadmin/aws/costs/by-client');
  }

  async importAwsCosts(file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post('/api/superadmin/aws/costs/import', formData);
  }

  async getAwsAlerts(): Promise<{ success: boolean; data: any[] }> {
    return apiService.get('/api/superadmin/aws/alerts');
  }

  async createAwsAlert(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/aws/alerts', data);
  }

  async getInstanceMetrics(id: number, period: string = '24h'): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/instances/${id}/metrics?period=${period}`);
  }

  async getInstanceLogs(id: number, params?: { level?: string; limit?: number }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return apiService.get(`/api/superadmin/instances/${id}/logs?${queryParams.toString()}`);
  }

  async searchLogs(params: {
    query: string;
    level?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.level) queryParams.append('level', params.level);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    
    return apiService.get(`/api/superadmin/logs/search?${queryParams.toString()}`);
  }

  /**
   * Integrations
   */
  async getIntegrations(): Promise<{ success: boolean; data: any[] }> {
    return apiService.get('/api/superadmin/integrations');
  }

  async getIntegration(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/integrations/${id}`);
  }

  async createIntegration(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/integrations', data);
  }

  async updateIntegration(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/integrations/${id}`, data);
  }

  async deleteIntegration(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/integrations/${id}`);
  }

  async testIntegration(id: number): Promise<{ success: boolean; message: string; data?: any }> {
    return apiService.post(`/api/superadmin/integrations/${id}/test`, {});
  }

  async connectIntegration(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/integrations/${id}/connect`, {});
  }

  /**
   * Users Management (Global)
   */
  async getUsers(params?: {
    search?: string;
    role?: string;
    organization_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/users?${queryParams.toString()}`);
  }

  async getUser(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/users/${id}`);
  }

  async createUser(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/users', data);
  }

  async updateUser(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/users/${id}`);
  }

  async suspendUser(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/users/${id}/suspend`, { reason });
  }

  async activateUser(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/users/${id}/activate`, {});
  }

  async resetUserPassword(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/users/${id}/reset-password`, {});
  }

  async getUserActivity(id: number): Promise<{ success: boolean; data: any[] }> {
    return apiService.get(`/api/superadmin/users/${id}/activity`);
  }

  async getStudents(params?: any): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/users/students?${queryParams.toString()}`);
  }

  async getInstructors(params?: any): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/users/instructors?${queryParams.toString()}`);
  }

  async getAdmins(params?: any): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/users/admins?${queryParams.toString()}`);
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/users/${userId}/assign-role`, { role_id: roleId });
  }

  async revokeRoleFromUser(userId: number, roleId: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/users/${userId}/revoke-role`, { role_id: roleId });
  }

  async usersBulkAction(userIds: number[], action: string): Promise<{ success: boolean; message: string }> {
    return apiService.post('/api/superadmin/users/bulk-action', { user_ids: userIds, action });
  }

  /**
   * Billing & Invoices
   */
  async getBillingDashboard(period: string = '30d'): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/billing/dashboard?period=${period}`);
  }

  async getMrrArr(): Promise<{ success: boolean; data: any }> {
    return apiService.get('/api/superadmin/billing/mrr-arr');
  }

  async getRevenueTrends(period: string = '30d'): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/billing/revenue-trends?period=${period}`);
  }

  async getInvoices(params?: {
    status?: string;
    organization_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/invoices?${queryParams.toString()}`);
  }

  async getInvoice(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/invoices/${id}`);
  }

  async generateInvoice(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/invoices/generate', data);
  }

  async sendInvoice(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/invoices/${id}/send`, {});
  }

  /**
   * Organization Operations
   */
  async checkSubdomainAvailability(subdomain: string): Promise<{ success: boolean; available: boolean }> {
    return apiService.get(`/api/superadmin/organizations/check-subdomain/${subdomain}`);
  }

  async createCompleteOrganization(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/organizations/create-complete', data);
  }

  async uploadOrganizationLogo(id: number, file: File): Promise<{ success: boolean; message: string; data: any }> {
    const formData = new FormData();
    formData.append('logo', file);
    return apiService.post(`/api/superadmin/organizations/${id}/upload-logo`, formData);
  }

  async uploadOrganizationFavicon(id: number, file: File): Promise<{ success: boolean; message: string; data: any }> {
    const formData = new FormData();
    formData.append('favicon', file);
    return apiService.post(`/api/superadmin/organizations/${id}/upload-favicon`, formData);
  }

  /**
   * Categories
   */
  async getCategories(params?: {
    search?: string;
    parent_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.parent_id) queryParams.append('parent_id', params.parent_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/categories?${queryParams.toString()}`);
  }

  async createCategory(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/categories', data);
  }

  async updateCategory(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/categories/${id}`, data);
  }

  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/categories/${id}`);
  }

  /**
   * Tags
   */
  async getTags(params?: {
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/tags?${queryParams.toString()}`);
  }

  async createTag(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/tags', data);
  }

  async updateTag(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/tags/${id}`, data);
  }

  async deleteTag(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/tags/${id}`);
  }

  /**
   * Course Languages
   */
  async getCourseLanguages(params?: {
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/course-languages?${queryParams.toString()}`);
  }

  async createCourseLanguage(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/course-languages', data);
  }

  async updateCourseLanguage(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/course-languages/${id}`, data);
  }

  async deleteCourseLanguage(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/course-languages/${id}`);
  }

  /**
   * Difficulty Levels
   */
  async getDifficultyLevels(params?: {
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/difficulty-levels?${queryParams.toString()}`);
  }

  async createDifficultyLevel(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/difficulty-levels', data);
  }

  async updateDifficultyLevel(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/difficulty-levels/${id}`, data);
  }

  async deleteDifficultyLevel(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/difficulty-levels/${id}`);
  }

  /**
   * Certificates
   */
  async getCertificates(params?: {
    search?: string;
    type?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/certificates?${queryParams.toString()}`);
  }

  async createCertificate(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/certificates', data);
  }

  async updateCertificate(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/certificates/${id}`, data);
  }

  async deleteCertificate(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/certificates/${id}`);
  }

  /**
   * Payouts
   */
  async getPayouts(params?: {
    status?: string;
    organization_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/payouts?${queryParams.toString()}`);
  }

  async processPayout(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/payouts/${id}/process`, {});
  }

  /**
   * Promotions
   */
  async getPromotions(params?: {
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/promotions?${queryParams.toString()}`);
  }

  async createPromotion(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/promotions', data);
  }

  async updatePromotion(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/promotions/${id}`, data);
  }

  async deletePromotion(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/promotions/${id}`);
  }

  /**
   * Blogs
   */
  async getBlogs(params?: {
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/blogs?${queryParams.toString()}`);
  }

  async createBlog(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/blogs', data);
  }

  async updateBlog(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/blogs/${id}`, data);
  }

  async deleteBlog(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/blogs/${id}`);
  }

  /**
   * System Email Templates (SuperAdmin)
   */
  async getSystemEmailTemplates(params?: {
    is_active?: boolean;
    type?: string;
    search?: string;
  }): Promise<{ success: boolean; data: { templates: any[] } }> {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    return apiService.get(`/api/superadmin/system-email-templates?${queryParams.toString()}`);
  }

  async getSystemEmailTemplate(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/system-email-templates/${id}`);
  }

  async updateSystemEmailTemplate(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/system-email-templates/${id}`, data);
  }

  async deleteSystemEmailTemplate(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/system-email-templates/${id}`);
  }

  async previewSystemEmailTemplate(id: number, sampleData: any): Promise<{ success: boolean; data: { subject: string; body: string } }> {
    return apiService.post(`/api/superadmin/system-email-templates/${id}/preview`, { data: sampleData });
  }

  /**
   * Email Templates (SuperAdmin) - Legacy
   */
  async getEmailTemplates(params?: {
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/email-templates?${queryParams.toString()}`);
  }

  async createEmailTemplate(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/email-templates', data);
  }

  async updateEmailTemplate(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/email-templates/${id}`, data);
  }

  async deleteEmailTemplate(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/api/superadmin/email-templates/${id}`);
  }

  /**
   * System Notifications (SuperAdmin)
   */
  async getSystemNotifications(params?: {
    is_active?: boolean;
    type?: string;
    email_enabled?: boolean;
    push_enabled?: boolean;
    sms_enabled?: boolean;
    in_app_enabled?: boolean;
    search?: string;
  }): Promise<{ success: boolean; data: { notifications: any[] } }> {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.email_enabled !== undefined) queryParams.append('email_enabled', params.email_enabled.toString());
    if (params?.push_enabled !== undefined) queryParams.append('push_enabled', params.push_enabled.toString());
    if (params?.sms_enabled !== undefined) queryParams.append('sms_enabled', params.sms_enabled.toString());
    if (params?.in_app_enabled !== undefined) queryParams.append('in_app_enabled', params.in_app_enabled.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    return apiService.get(`/api/superadmin/system-notifications?${queryParams.toString()}`);
  }

  async getSystemNotification(id: number): Promise<{ success: boolean; data: any }> {
    return apiService.get(`/api/superadmin/system-notifications/${id}`);
  }

  async updateSystemNotification(id: number, data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/api/superadmin/system-notifications/${id}`, data);
  }

  /**
   * Notifications - Legacy
   */
  async getNotifications(params?: {
    type?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return apiService.get(`/api/superadmin/notifications?${queryParams.toString()}`);
  }

  async sendNotification(data: any): Promise<{ success: boolean; message: string }> {
    return apiService.post('/api/superadmin/notifications/send', data);
  }

  /**
   * Analytics
   */
  async getAnalytics(params?: {
    period?: string;
    organization_id?: number;
  }): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    
    return apiService.get(`/api/superadmin/analytics?${queryParams.toString()}`);
  }

  /**
   * Reports
   */
  async getReports(params?: {
    type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    return apiService.get(`/api/superadmin/reports?${queryParams.toString()}`);
  }

  async generateReport(data: any): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/api/superadmin/reports/generate', data);
  }

  /**
   * Features
   */
  async getFeatures(): Promise<{ success: boolean; data: any[] }> {
    return apiService.get('/api/superadmin/features');
  }

  async toggleFeature(id: number, enabled: boolean): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/features/${id}/toggle`, { enabled });
  }

  /**
   * Localization
   */
  async getLocalizations(): Promise<{ success: boolean; data: any[] }> {
    return apiService.get('/api/superadmin/localization');
  }

  async updateLocalization(locale: string, data: any): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/api/superadmin/localization/${locale}`, data);
  }

  /**
   * Maintenance
   */
  async executeMaintenanceTask(task: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/api/superadmin/maintenance/${task}`, {});
  }

  async getSystemHealth(): Promise<{ success: boolean; data: any }> {
    return apiService.get('/api/superadmin/maintenance/health');
  }
}

export const superAdminService = new SuperAdminService();

