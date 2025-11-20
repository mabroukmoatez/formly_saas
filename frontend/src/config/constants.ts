/**
 * Application Configuration Constants
 * Centralized configuration for all platforms
 */

export const CONFIG = {
  // Base URL for all API calls and asset URLs
  BASE_URL: 'http://localhost/form.fr',
  
  // API Endpoints
  API: {
    ORGANIZATION_BY_SUBDOMAIN: '/api/organization/by-subdomain',
    LOGIN: '/api/login', // Students (role 3) and Instructors (role 2) - DEFAULT
    ORGANIZATION_LOGIN: '/api/auth/login', // Organization users (role 4)
    SUPERADMIN_LOGIN: '/api/superadmin/auth/login',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    REFRESH_TOKEN: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    CHECK_PERMISSION: '/api/auth/check-permission',
    PERMISSIONS: '/api/auth/permissions',
    // User Profile APIs
    USER_PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/update-profile',
    CHANGE_PASSWORD: '/api/user/change-password',
    UPLOAD_AVATAR: '/api/user/upload-avatar',
    // Notification APIs
    NOTIFICATIONS: '/api/organization/notifications',
    NOTIFICATION_COUNT: '/api/organization/notifications/count',
    MARK_NOTIFICATION_READ: '/api/organization/notifications/mark-read',
    MARK_MULTIPLE_READ: '/api/organization/notifications/mark-multiple-read',
    MARK_ALL_READ: '/api/organization/notifications/mark-all-read',
    DELETE_NOTIFICATION: '/api/organization/notifications/delete',
    
    // White Label API endpoints
    WHITE_LABEL_SETTINGS: '/api/organization/whitelabel',
    WHITE_LABEL_RESET: '/api/organization/whitelabel/reset',
    WHITE_LABEL_UPLOAD_LOGO: '/api/organization/whitelabel/upload-logo',
    WHITE_LABEL_UPLOAD_FAVICON: '/api/organization/whitelabel/upload-favicon',
    WHITE_LABEL_UPLOAD_BACKGROUND: '/api/organization/whitelabel/upload-background',
    
    // Subdomain Management API endpoints
    SUBDOMAIN_UPDATE: '/api/organization/subdomain/update',
    SUBDOMAIN_TEST: '/api/organization/subdomain/test',
    CUSTOM_DOMAIN_TEST: '/api/organization/custom-domain/test',
  },
  
  // Asset URLs
  ASSETS: {
    ORGANIZATIONS: '/uploads/organizations',
    SETTINGS: '/uploads/setting',
    DEFAULT_LOGO: '/uploads/setting/logo.png',
    DEFAULT_BACKGROUND: '/uploads/setting/default-login-bg.jpg',
  },
  
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student',
    MANAGER: 'manager',
  },
  
  // Dashboard Routes
  DASHBOARD_ROUTES: {
    admin: '/gestion-commercial',
    instructor: '/gestion-commercial',
    student: '/student/dashboard', // Students go to their own dashboard
    manager: '/gestion-commercial',
  },
  
  // Supported Languages
  LANGUAGES: {
    FR: 'fr',
    EN: 'en',
  },
  
  // Default Language
  DEFAULT_LANGUAGE: 'fr',
  
  // Theme Options
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
  },
  
  // Default Theme
  DEFAULT_THEME: 'system',
  
  // Local Storage Keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    ORGANIZATION_DATA: 'organization_data',
    LANGUAGE: 'language',
    THEME: 'theme',
  },
  
  // Token Configuration
  TOKEN: {
    ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
} as const;

// Type definitions for better TypeScript support
export type UserRole = typeof CONFIG.ROLES[keyof typeof CONFIG.ROLES];
export type Language = typeof CONFIG.LANGUAGES[keyof typeof CONFIG.LANGUAGES];
export type Theme = typeof CONFIG.THEMES[keyof typeof CONFIG.THEMES];

// User interface based on actual API
export interface User {
  id: number;
  name: string;
  email: string;
  mobile_number?: string;
  role: number;
  role_name: string;
  organization_id: number;
  is_organization_admin: boolean;
  organization_roles: string[];
  permissions: string[];
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  // Profile image fields
  image?: string;
  image_url?: string;
}

// Organization interface based on actual API
export interface Organization {
  id: number;
  uuid: string;
  organization_name: string;
  organization_tagline: string;
  organization_description: string;
  custom_domain: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  organization_logo?: string;
  organization_logo_url?: string;
  organization_favicon?: string;
  organization_favicon_url?: string;
  login_background_image?: string;
  login_background_image_url?: string;
  login_banner_url?: string;
  login_template?: string;
  whitelabel_enabled: boolean;
  subscription_plan: string;
  max_users: number;
  max_courses: number;
  max_certificates: number;
  status: number;
  created_at: string;
  updated_at: string;
}

// Auth response interface based on actual API
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    organization: Organization;
  };
}

// Organization response interface
export interface OrganizationResponse {
  success: boolean;
  data: {
    organization: Organization;
  };
  message?: string;
}
