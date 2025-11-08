import { CONFIG, Organization, OrganizationResponse, AuthResponse, User } from '../config/constants';

/**
 * API Service Layer
 * Handles all API communications with proper error handling
 */

class ApiService {
  private baseURL: string;

  constructor() {
    // Use relative URLs to leverage Vite proxy in development
    // The proxy will handle routing to the correct backend server
    this.baseURL = '';
  }

  /**
   * Get the current API base URL based on the current context
   */
  private getApiBaseUrl(): string {
    // In development, call the backend server directly
    // In production, use relative URLs (same domain)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:8000';
    }
    return '';
  }

  /**
   * Generic API request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & { responseType?: 'blob' | 'json' } = {}
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    const { responseType, ...requestOptions } = options;
    
    const defaultHeaders: Record<string, string> = {
      'Accept': responseType === 'blob' ? 'application/pdf' : 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Only set Content-Type for non-FormData requests
    if (!(requestOptions.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Add authorization header if token exists
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      // Try alternative token key in case of storage issues
      const altToken = localStorage.getItem('access_token');
      if (altToken) {
        defaultHeaders['Authorization'] = `Bearer ${altToken}`;
      }
    }

    const config: RequestInit = {
      ...requestOptions,
      headers: {
        ...defaultHeaders,
        ...requestOptions.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle blob responses
      if (responseType === 'blob') {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.blob()) as T;
      }
      
      // Parse response body once (can only be read once)
      const contentType = response.headers.get('content-type');
      let responseData: any;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          responseData = { message: text };
        }
      } else {
        responseData = await response.text();
      }
      
      if (!response.ok) {
        // Use already parsed responseData as errorBody
        const errorBody = responseData || {};

        // Build a human-friendly message, especially for validation errors (422)
        let validationMessage = '';
        const errors = (errorBody && (errorBody.errors || errorBody.data?.errors)) || null;
        if (errors && typeof errors === 'object') {
          const parts: string[] = [];
          Object.entries(errors).forEach(([field, msgs]) => {
            if (Array.isArray(msgs)) {
              parts.push(`${field}: ${msgs.join(', ')}`);
            } else if (typeof msgs === 'string') {
              parts.push(`${field}: ${msgs}`);
            }
          });
          validationMessage = parts.join(' | ');
        }

        const message = errorBody?.message 
          || errorBody?.error 
          || (validationMessage ? `Validation échouée: ${validationMessage}` : '')
          || `HTTP error! status: ${response.status}`;

        const err = new Error(message) as Error & { status?: number; details?: any };
        err.status = response.status;
        err.details = errorBody;

        // Log rich context for debugging in dev tools
        console.error('API request failed:', {
          url,
          status: response.status,
          method: config.method || 'GET',
          message,
          details: errorBody,
        });

        throw err;
      }
      
      // responseData is already parsed above
      // For 201 Created responses, ensure we wrap them properly if they're not already
      if (response.status === 201 && responseData && !responseData.success) {
        return {
          success: true,
          message: responseData.message || 'Created successfully',
          data: responseData.data || responseData
        } as T;
      }
      
      return responseData as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get organization by subdomain
   */
  async getOrganizationBySubdomain(subdomain: string): Promise<Organization> {
    const response = await this.request<OrganizationResponse>(
      `${CONFIG.API.ORGANIZATION_BY_SUBDOMAIN}/${subdomain}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch organization');
    }
    
    return response.data.organization;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      // Test connection successful
      return response;
    } catch (error) {
      console.error('Test connection failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string, organizationSubdomain: string): Promise<AuthResponse> {
    const requestBody = {
      email,
      password,
      organization_subdomain: organizationSubdomain,
    };
    
    return await this.request<AuthResponse>(CONFIG.API.LOGIN, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    
    if (refreshToken) {
      await this.request(CONFIG.API.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
    
    // Clear local storage regardless of API response
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    return await this.request(`${CONFIG.API.FORGOT_PASSWORD}`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        organization_id: organizationId,
      }),
    });
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return await this.request(`${CONFIG.API.RESET_PASSWORD}`, {
      method: 'POST',
      body: JSON.stringify({
        token,
        password,
      }),
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access_token: string; expires_in: number }> {
    const refreshToken = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ access_token: string; expires_in: number }>(
      CONFIG.API.REFRESH_TOKEN,
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    return response;
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{ success: boolean; data: any; message: string }> {
    return await this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.USER_PROFILE
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const altToken = localStorage.getItem('access_token');
    return !!(token || altToken);
  }

  /**
   * Check user permission
   */
  async checkPermission(permission: string): Promise<{ success: boolean; data: { permission: string; has_permission: boolean } }> {
    return this.request<{ success: boolean; data: { permission: string; has_permission: boolean } }>(
      CONFIG.API.CHECK_PERMISSION,
      {
        method: 'POST',
        body: JSON.stringify({ permission }),
      }
    );
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<{ success: boolean; data: { user_permissions: string[]; user_roles: any[]; is_organization_admin: boolean } }> {
    return this.request<{ success: boolean; data: { user_permissions: string[]; user_roles: any[]; is_organization_admin: boolean } }>(
      CONFIG.API.PERMISSIONS
    );
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store user data and tokens
   */
  storeAuthData(authResponse: AuthResponse): void {
    if (authResponse.success && authResponse.data.token) {
      // Store token with both keys to ensure compatibility
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, authResponse.data.token);
      localStorage.setItem('access_token', authResponse.data.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(authResponse.data.user));
      localStorage.setItem(CONFIG.STORAGE_KEYS.ORGANIZATION_DATA, JSON.stringify(authResponse.data.organization));
    }
  }


  /**
   * Update user profile
   */
  async updateProfile(profileData: any): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      CONFIG.API.UPDATE_PROFILE,
      {
        method: 'POST',
        body: JSON.stringify(profileData),
      }
    );
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      CONFIG.API.CHANGE_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify(passwordData),
      }
    );
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(imageFile: File): Promise<{ success: boolean; message: string; data: { image: string; image_url: string } }> {
    const formData = new FormData();
    formData.append('avatar', imageFile);

    return this.request<{ success: boolean; message: string; data: { image: string; image_url: string } }>(
      CONFIG.API.UPLOAD_AVATAR,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type for FormData, let browser set it with boundary
      }
    );
  }

  /**
   * Get notifications
   */
  async getNotifications(params?: { page?: number; per_page?: number; type?: string; category?: string }): Promise<{ success: boolean; data: { notifications: any[]; pagination: any; counts: any } }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);

    const endpoint = CONFIG.API.NOTIFICATIONS + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return this.request<{ success: boolean; data: { notifications: any[]; pagination: any; counts: any } }>(
      endpoint
    );
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<{ success: boolean; data: { counts: any } }> {
    return this.request<{ success: boolean; data: { counts: any } }>(
      CONFIG.API.NOTIFICATION_COUNT
    );
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: number | string): Promise<{ success: boolean; message: string; data: { notification_id: number; is_seen: boolean } }> {
    // Try with ID in URL first (standard REST pattern)
    try {
      return await this.request<{ success: boolean; message: string; data: { notification_id: number; is_seen: boolean } }>(
        `${CONFIG.API.NOTIFICATIONS}/${notificationId}/read`,
        {
          method: 'POST',
        }
      );
    } catch (error: any) {
      // Fallback to mark-read endpoint with ID in body if URL-based doesn't work
      return this.request<{ success: boolean; message: string; data: { notification_id: number; is_seen: boolean } }>(
        CONFIG.API.MARK_NOTIFICATION_READ,
        {
          method: 'POST',
          body: JSON.stringify({ notification_id: notificationId }),
        }
      );
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleNotificationsRead(notificationIds: number[]): Promise<{ success: boolean; message: string; data: { updated_count: number; notification_ids: number[] } }> {
    return this.request<{ success: boolean; message: string; data: { updated_count: number; notification_ids: number[] } }>(
      CONFIG.API.MARK_MULTIPLE_READ,
      {
        method: 'POST',
        body: JSON.stringify({ notification_ids: notificationIds }),
      }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<{ success: boolean; message: string; data: { updated_count: number } }> {
    return this.request<{ success: boolean; message: string; data: { updated_count: number } }>(
      CONFIG.API.MARK_ALL_READ,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number | string): Promise<{ success: boolean; message: string }> {
    // Try with UUID/ID in URL first (standard REST pattern)
    try {
      return await this.request<{ success: boolean; message: string }>(
        `${CONFIG.API.NOTIFICATIONS}/${notificationId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error: any) {
      // Fallback to delete endpoint - try with UUID if it's a string, otherwise use ID
      const bodyData = typeof notificationId === 'string' 
        ? { notification_uuid: notificationId }
        : { notification_id: notificationId };
      
      return this.request<{ success: boolean; message: string }>(
        CONFIG.API.DELETE_NOTIFICATION,
        {
          method: 'DELETE',
          body: JSON.stringify(bodyData),
        }
      );
    }
  }

  // ==================== WHITE LABEL API METHODS ====================

  /**
   * Get white label settings
   */
  async getWhiteLabelSettings(): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.WHITE_LABEL_SETTINGS
    );
  }

  /**
   * Update white label settings
   */
  async updateWhiteLabelSettings(settings: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.WHITE_LABEL_SETTINGS,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
  }

  /**
   * Reset white label settings
   */
  async resetWhiteLabelSettings(): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.WHITE_LABEL_RESET,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Upload white label asset (logo, favicon, background)
   */
  async uploadWhiteLabelAsset(formData: FormData, type: 'logo' | 'favicon' | 'background'): Promise<{ success: boolean; data: any; message: string }> {
    const endpoint = type === 'logo' 
      ? CONFIG.API.WHITE_LABEL_UPLOAD_LOGO
      : type === 'favicon'
      ? CONFIG.API.WHITE_LABEL_UPLOAD_FAVICON
      : CONFIG.API.WHITE_LABEL_UPLOAD_BACKGROUND;

    return this.request<{ success: boolean; data: any; message: string }>(
      endpoint,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type header to let browser set it with boundary for FormData
      }
    );
  }

  /**
   * Update subdomain settings
   */
  async updateSubdomainSettings(subdomain: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.SUBDOMAIN_UPDATE,
      {
        method: 'PUT',
        body: JSON.stringify({ subdomain }),
      }
    );
  }

  /**
   * Test subdomain availability
   */
  async testSubdomainAvailability(subdomain: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.SUBDOMAIN_TEST,
      {
        method: 'POST',
        body: JSON.stringify({ subdomain }),
      }
    );
  }

  /**
   * Test custom domain connectivity
   */
  async testCustomDomain(domain: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(
      CONFIG.API.CUSTOM_DOMAIN_TEST,
      {
        method: 'POST',
        body: JSON.stringify({ domain }),
      }
    );
  }

  // ==================== USER MANAGEMENT API METHODS ====================

  /**
   * Get organization users
   */
  async getOrganizationUsers(params?: { 
    per_page?: number; 
    search?: string; 
    status?: number; 
    role?: string; 
    page?: number;
  }): Promise<{ success: boolean; data: { users: any; stats: any; organization: any } }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());

    const endpoint = '/api/organization/users' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return this.request<{ success: boolean; data: { users: any; stats: any; organization: any } }>(
      endpoint
    );
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: number): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(
      `/api/organization/users/${userId}`
    );
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role_id: number;
    organization_id: number;
    status: number;
    phone?: string;
    address?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      '/api/organization/users',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  }

  /**
   * Update user
   */
  async updateUser(userId: number, userData: {
    name?: string;
    email?: string;
    password?: string;
    role_id?: number;
    status?: number;
    phone?: string;
    address?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/api/organization/users/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(userData),
      }
    );
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/organization/users/${userId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Toggle user status
   */
  async toggleUserStatus(userId: number): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/api/organization/users/${userId}/toggle-status`,
      {
        method: 'PATCH',
      }
    );
  }

  /**
   * Bulk user actions
   */
  async bulkUserAction(action: string, userIds: number[]): Promise<{ success: boolean; message: string; processed_count: number }> {
    return this.request<{ success: boolean; message: string; processed_count: number }>(
      '/api/organization/users/bulk-action',
      {
        method: 'POST',
        body: JSON.stringify({ action, user_ids: userIds }),
      }
    );
  }

  /**
   * Export users to CSV
   */
  async exportUsersCSV(): Promise<{ success: boolean; data: { csv_content: string; filename: string; total_records: number } }> {
    return this.request<{ success: boolean; data: { csv_content: string; filename: string; total_records: number } }>(
      '/api/organization/users/export/csv'
    );
  }

  // ==================== ROLE MANAGEMENT API METHODS ====================

  /**
   * Get organization roles
   */
  async getOrganizationRoles(params?: { 
    per_page?: number; 
    search?: string; 
    status?: number; 
    page?: number;
  }): Promise<{ success: boolean; data: { roles: any; stats: any; organization: any } }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const endpoint = '/api/organization/roles' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return this.request<{ success: boolean; data: { roles: any; stats: any; organization: any } }>(
      endpoint
    );
  }

  /**
   * Get role details
   */
  async getRoleDetails(roleId: number): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(
      `/api/organization/roles/${roleId}`
    );
  }

  /**
   * Create new role
   */
  async createRole(roleData: {
    name: string;
    description?: string;
    permissions: string[];
    is_active?: boolean;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      '/api/organization/roles',
      {
        method: 'POST',
        body: JSON.stringify(roleData),
      }
    );
  }

  /**
   * Update role
   */
  async updateRole(roleId: number, roleData: {
    name?: string;
    description?: string;
    permissions?: string[];
    is_active?: boolean;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/api/organization/roles/${roleId}`,
      {
        method: 'PUT',
        body: JSON.stringify(roleData),
      }
    );
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/organization/roles/${roleId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Toggle role status
   */
  async toggleRoleStatus(roleId: number): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/api/organization/roles/${roleId}/toggle-status`,
      {
        method: 'PATCH',
      }
    );
  }

  /**
   * Get available permissions
   */
  async getAvailablePermissions(): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(
      '/api/organization/roles/permissions/available'
    );
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: number, roleId: number): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      '/api/organization/roles/assign',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role_id: roleId }),
      }
    );
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: number, roleId: number): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(
      '/api/organization/roles/remove',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role_id: roleId }),
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, options?: RequestInit & { responseType?: 'blob' | 'json' }): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }


  // Course Management APIs
  async getCourses(params?: { 
    per_page?: number; 
    page?: number;
    search?: string; 
    status?: number; 
    category?: number; 
  }): Promise<{ success: boolean; data: any; message: string }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.category) queryParams.append('category', params.category.toString());
    
    const endpoint = `/api/organization/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<{ success: boolean; data: any; message: string }>(endpoint);
  }

  async getCourse(courseUuid: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.get<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}`);
  }

  async updateCourseOverview(courseUuid: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.put<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/overview`, data);
  }

  async updateCourseCategory(courseUuid: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.put<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/category`, data);
  }

  async updateCourseStatus(courseUuid: string, status: number): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteCourse(courseUuid: string): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/api/organization/courses/${courseUuid}`);
  }

  // Lesson Management APIs
  async getLessons(courseUuid: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.get<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/lessons`);
  }

  async createLesson(courseUuid: string, data: { name: string; short_description: string }): Promise<{ success: boolean; data: any; message: string }> {
    return this.post<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/lessons`, data);
  }

  async updateLesson(courseUuid: string, lessonUuid: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.put<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/lessons/${lessonUuid}`, data);
  }

  async deleteLesson(courseUuid: string, lessonUuid: string): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/api/organization/courses/${courseUuid}/lessons/${lessonUuid}`);
  }

  // Lecture Management APIs
  async getLectures(courseUuid: string, lessonUuid: string, params?: { 
    per_page?: number; 
    lesson_id?: number; 
    type?: string; 
  }): Promise<{ success: boolean; data: any; message: string }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.lesson_id) queryParams.append('lesson_id', params.lesson_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    
    const endpoint = `/api/organization/courses/${courseUuid}/lessons/${lessonUuid}/lectures${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<{ success: boolean; data: any; message: string }>(endpoint);
  }

  async createLecture(courseUuid: string, lessonUuid: string, data: FormData): Promise<{ success: boolean; data: any; message: string }> {
    return this.post<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/lessons/${lessonUuid}/lectures`, data, {
      headers: {},
    });
  }

  async updateLecture(courseUuid: string, lessonUuid: string, lectureUuid: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.put<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/lessons/${lessonUuid}/lectures/${lectureUuid}`, data);
  }

  async deleteLecture(courseUuid: string, lessonUuid: string, lectureUuid: string): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/api/organization/courses/${courseUuid}/lessons/${lessonUuid}/lectures/${lectureUuid}`);
  }

  // Quiz/Exam Management APIs
  async getExams(courseUuid: string, params?: { 
    per_page?: number; 
    type?: string; 
    status?: number; 
  }): Promise<{ success: boolean; data: any; message: string }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    
    const endpoint = `/api/organization/courses/${courseUuid}/exams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<{ success: boolean; data: any; message: string }>(endpoint);
  }

  async createExam(courseUuid: string, data: {
    name: string;
    short_description: string;
    marks_per_question: number;
    duration: number;
    type: string;
    status: number;
  }): Promise<{ success: boolean; data: any; message: string }> {
    return this.post<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/exams`, data);
  }

  async updateExam(courseUuid: string, examUuid: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.put<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}`, data);
  }

  async deleteExam(courseUuid: string, examUuid: string): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}`);
  }

  async toggleExamStatus(courseUuid: string, examUuid: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // Question Management APIs
  async getQuestions(courseUuid: string, examUuid: string, params?: { 
    per_page?: number; 
    search?: string; 
  }): Promise<{ success: boolean; data: any; message: string }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `/api/organization/courses/${courseUuid}/exams/${examUuid}/questions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<{ success: boolean; data: any; message: string }>(endpoint);
  }

  async createMCQQuestion(courseUuid: string, examUuid: string, data: {
    name: string;
    options: string[];
    is_correct_answer: number;
  }): Promise<{ success: boolean; data: any; message: string }> {
    return this.post<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}/questions/mcq`, data);
  }

  async createTrueFalseQuestion(courseUuid: string, examUuid: string, data: {
    name: string;
    is_correct_answer: boolean;
  }): Promise<{ success: boolean; data: any; message: string }> {
    return this.post<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}/questions/true-false`, data);
  }

  async updateQuestion(courseUuid: string, examUuid: string, questionUuid: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.put<{ success: boolean; data: any; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}/questions/${questionUuid}`, data);
  }

  async deleteQuestion(courseUuid: string, examUuid: string, questionUuid: string): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/api/organization/courses/${courseUuid}/exams/${examUuid}/questions/${questionUuid}`);
  }

  // File Upload APIs
  async uploadFile(file: File, type: string, purpose: string = 'general'): Promise<{ success: boolean; data: any; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('purpose', purpose);
    
    return this.post<{ success: boolean; data: any; message: string }>('/api/organization/files/upload', formData, {
      headers: {
        // Don't set Content-Type for FormData, let browser handle it
      },
    });
  }

  async uploadMultipleFiles(files: File[], type: string, purpose: string = 'general'): Promise<{ success: boolean; data: any; message: string }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files[]', file));
    formData.append('type', type);
    formData.append('purpose', purpose);
    
    return this.post<{ success: boolean; data: any; message: string }>('/api/organization/files/upload-multiple', formData, {
      headers: {},
    });
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>('/api/organization/files/delete', { file_path: filePath });
  }

  async getFileInfo(filePath: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.get<{ success: boolean; data: any; message: string }>(`/api/organization/files/info?file_path=${encodeURIComponent(filePath)}`);
  }

  async listFiles(params?: { 
    directory?: string; 
    type?: string; 
    per_page?: number; 
    page?: number; 
  }): Promise<{ success: boolean; data: any; message: string }> {
    const queryParams = new URLSearchParams();
    if (params?.directory) queryParams.append('directory', params.directory);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = `/api/organization/files/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<{ success: boolean; data: any; message: string }>(endpoint);
  }

  async getUploadLimits(): Promise<{ success: boolean; data: any; message: string }> {
    return this.get<{ success: boolean; data: any; message: string }>('/api/organization/files/limits');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
