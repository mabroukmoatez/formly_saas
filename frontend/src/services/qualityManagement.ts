import { apiService as api } from './api';

// Types for Quality Management
export interface QualityIndicator {
  id: number;
  number: number;
  title: string;
  description?: string;
  category?: string;
  status: 'completed' | 'in-progress' | 'not-started' | 'in_progress' | 'not_started';
  hasOverlay: boolean;
  overlayColor: string | null;
  overlay_color?: string; // Alternative field name
  hasDocuments?: boolean;
  isApplicable?: boolean;
  documentCounts?: {
    procedures: number;
    models: number;
    evidences: number;
    total: number;
  };
  completionRate?: number;
  lastUpdated?: string | null;
}

export interface QualityDocument {
  id: number;
  name: string;
  type: 'procedure' | 'model' | 'evidence';
  fileType: string;
  size: string; // Formatted string like "9mb"
  sizeBytes: number;
  url?: string;
  indicatorIds: number[];
  showIndicatorCount: boolean;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface QualityAction {
  id: number;
  category: string;
  subcategory?: string;
  priority: 'Low' | 'Medium' | 'High';
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface QualityAudit {
  id: number;
  type: string;
  date: string;
  daysRemaining: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  auditor?: {
    name: string;
    contact: string;
    phone: string;
  };
  location?: string;
  result?: 'passed' | 'failed' | 'conditional';
  score?: number;
  reportUrl?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface QualityBPF {
  id: number;
  year: number;
  status: 'draft' | 'submitted' | 'approved';
  submittedDate?: string;
  data: any;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface QualityArticle {
  id: number;
  image: string | null;
  category: string | null;
  date: string;
  title: string;
  description?: string | null;
  content?: string | null;
  featured: boolean;
  url?: string | null;
  author?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
  createdAt: string;
}

// New types for Tasks (Trello-style)
export interface QualityTask {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  due_date?: string; // Alternative field name from API
  position?: number;
  category?: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
  category_id?: number; // Alternative field name from API
  assignedUser?: {
    id: number;
    name: string;
  };
  assigned_to?: number; // Alternative field name from API
  assigned_members?: Array<{
    id: number;
    name: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  }>; // Multiple assigned members (Trello-style)
  start_date?: string; // Start date for task period
  end_date?: string; // End date for task period
  comments?: Array<{
    id?: number;
    content: string;
    author: {
      id: number;
      name: string;
      avatar_url?: string;
    };
    created_at?: string;
  }>; // Comments on task
  checklist?: Array<{
    text: string;
    completed: boolean;
  }>;
  attachments?: Array<{
    id?: number;
    name: string;
    url: string;
    size?: number;
    type?: string;
    uploaded_at?: string;
  }>; // File attachments
  createdAt?: string;
  created_at?: string; // Alternative field name from API
  updatedAt?: string;
  updated_at?: string; // Alternative field name from API
}

export interface QualityTaskCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  type: 'veille' | 'competence' | 'dysfonctionnement' | 'amelioration' | 'handicap' | 'custom';
  is_system: boolean;
  indicator_id?: number;
  tasks_count?: number;
}

// News (Qualiopi articles)
export interface QualityNews {
  id: number;
  title: string;
  description?: string;
  content?: string;
  external_url?: string;
  image?: string;
  type: 'qualiopi' | 'regulatory' | 'tips' | 'update';
  is_featured: boolean;
  published_at: string;
  views_count?: number;
}

// Services (AD Certif promotional offers)
export interface QualityService {
  id: number;
  name: string;
  description?: string;
  price?: number;
  promo_price?: number;
  external_url?: string;
  image?: string;
  is_featured: boolean;
  display_order?: number;
}

// External Collaborations
export interface QualityInvitation {
  id: number;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token?: string;
  indicator_access: number[];
  expires_at: string;
  accepted_at?: string;
  invited_by?: {
    id: number;
    name: string;
  };
}

// Updated Dashboard structure to match specs
export interface DashboardStats {
  overview: {
    totalDocuments: number;
    procedures: number;
    models: number;
    evidences: number;
    recentlyAdded: number;
  };
  indicators: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
    indicatorsList: QualityIndicator[];
  };
  actions: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    recentActions: QualityAction[];
  };
  // NEW: Tasks section (Trello-style)
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
  };
  // NEW: Task categories
  taskCategories: QualityTaskCategory[];
  // NEW: Audit countdown
  auditCountdown?: {
    days: number;
    is_overdue: boolean;
    date: string;
    formatted_date: string;
    auditor?: string;
  };
  // NEW: Qualiopi news
  qualiopiNews: QualityNews[];
  recentDocuments: QualityDocument[];
  nextAudit: QualityAudit | null;
  articles: QualityArticle[];
  audit?: {
    nextAuditDate: string;
    daysRemaining: number;
    preparedness: number;
  };
  bpf?: {
    currentYear: number;
    status: string;
    completionRate: number;
  };
  statistics?: {
    completion_percentage: number;
    total_documents: number;
    pending_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  };
  recentActivity?: Array<{
    type: string;
    title: string;
    user: string;
    timestamp: string;
  }>;
}

// ==================== HELPER FUNCTION ====================
/**
 * Helper function to preserve success wrapper for 201 Created responses
 * In Quality Management, 201 is ALWAYS considered success
 */
const preserveSuccessWrapper = (response: any): any => {
  // If response already has success wrapper, return as is
  if (response && typeof response === 'object' && 'success' in response) {
    return response;
  }
  // For 201 responses, wrap with success: true
  return {
    success: true,
    data: response?.data || response,
    message: response?.message || 'Opération réussie'
  };
};

// ==================== INITIALIZATION APIs (CRITICAL - CALL FIRST!) ====================

/**
 * Check if the organization's quality system is initialized
 * MUST be called before using any other quality endpoints
 */
export const checkQualityInitialization = async (): Promise<{
  success: boolean;
  data?: {
    initialized: boolean;
    indicators: { count: number; expected: number };
    categories: { count: number; expected: number };
  };
  error?: {
    code?: string;
    message?: string;
  };
}> => {
  try {
    const response = await api.get('/api/quality/initialize/status');
    
    // Check if response or response.data is null
    if (!response) {
      console.error('❌ API response is null for checkQualityInitialization');
      return {
        success: false,
        error: {
          code: 'NULL_RESPONSE',
          message: 'Réponse invalide du serveur'
        }
      };
    }
    
    if (!response.data) {
      console.error('❌ API response.data is null for checkQualityInitialization');
      return {
        success: false,
        error: {
          code: 'NULL_RESPONSE_DATA',
          message: 'Données de réponse invalides'
        }
      };
    }
    
    return response.data;
  } catch (err: any) {
    console.error('❌ Error checking quality initialization:', err);
    
    // Check if error is ALREADY_INITIALIZED (system is initialized)
    const errorCode = err.details?.error?.code || err.error?.code || err.code;
    if (errorCode === 'ALREADY_INITIALIZED' || err.status === 409) {
      // If already initialized, return success with initialized: true
      return {
        success: true,
        data: {
          initialized: true,
          indicators: { count: 32, expected: 32 },
          categories: { count: 5, expected: 5 }
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'CHECK_ERROR',
        message: err.details?.error?.message || err.message || 'Erreur lors de la vérification de l\'initialisation'
      }
    };
  }
};

/**
 * Initialize the quality system for the organization
 * Creates 32 Qualiopi indicators + 5 default action categories
 * ONLY call once per organization
 */
export const initializeQualitySystem = async (): Promise<{
  success: boolean;
  error?: {
    code?: string;
    message?: string;
  };
  data?: {
    message: string;
    indicators: { created: number; total: number };
    categories: { created: number; total: number };
  };
}> => {
  try {
    const response = await api.post('/api/quality/initialize', {});
    
    // Check if response is null
    if (!response) {
      console.error('❌ API response is null');
      return {
        success: false,
        error: {
          code: 'NULL_RESPONSE',
          message: 'Réponse invalide du serveur'
        }
      };
    }
    
    // If api.ts already returned a structured response (e.g., for 409), return it directly
    // This happens when api.ts handles 409 and returns { success: false, error: {...}, data: null }
    if (response.success === false && response.error) {
      console.log('✅ API returned structured error response:', response.error);
      return response;
    }
    
    // Check if response.data exists (for successful responses)
    if (!response.data) {
      console.error('❌ API response.data is null');
      return {
        success: false,
        error: {
          code: 'NULL_RESPONSE_DATA',
          message: 'Données de réponse invalides'
        }
      };
    }
    
    return response.data;
  } catch (err: any) {
    console.error('❌ Error initializing quality system:', err);
    
    // Handle 409 Conflict (already initialized)
    if (err.status === 409 || err.details?.error?.code === 'ALREADY_INITIALIZED') {
      return {
        success: false,
        error: {
          code: 'ALREADY_INITIALIZED',
          message: err.details?.error?.message || 'Le système qualité est déjà initialisé'
        }
      };
    }
    
    // Return error response instead of throwing
    return {
      success: false,
      error: {
        code: 'INITIALIZATION_ERROR',
        message: err.details?.error?.message || err.message || 'Erreur lors de l\'initialisation du système qualité'
      }
    };
  }
};

// Quality System APIs
export const getQualitySystemOverview = async () => {
  const response = await api.get('/api/quality/system/overview');
  return response.data;
};

// Indicators APIs
export const getQualityIndicators = async (params?: {
  status?: string;
  hasDocuments?: boolean;
}) => {
  const response = await api.get('/api/quality/indicators', { params });
  return response.data;
};

export const getQualityIndicator = async (id: number) => {
  const response = await api.get(`/api/quality/indicators/${id}`);
  return response.data;
};

export const updateQualityIndicator = async (
  id: number,
  data: {
    title?: string;
    description?: string;
    requirements?: string[];
    status?: string;
    notes?: string;
    isApplicable?: boolean;
  }
) => {
  const response = await api.put(`/api/quality/indicators/${id}`, data);
  return response.data;
};

export const getIndicatorDocuments = async (
  id: number,
  type?: 'procedure' | 'model' | 'evidence'
) => {
  const response = await api.get(`/api/quality/indicators/${id}/documents`, {
    params: { type },
  });
  return response.data;
};

// Documents APIs
export const getQualityDocuments = async (params?: {
  type?: 'procedure' | 'model' | 'evidence';
  indicatorId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/api/quality/documents', { params });
  return response.data;
};

export const uploadQualityDocument = async (formData: FormData) => {
  // Don't set Content-Type header - browser will set it automatically with boundary for FormData
  const response = await api.post('/api/quality/documents/upload', formData);
  return preserveSuccessWrapper(response);
};

export const getQualityDocument = async (id: number) => {
  const response = await api.get(`/api/quality/documents/${id}`);
  return response.data;
};

export const updateQualityDocument = async (
  id: number,
  data: {
    name?: string;
    type?: 'procedure' | 'model' | 'evidence';
    description?: string;
    indicatorIds?: number[];
  }
) => {
  const response = await api.put(`/api/quality/documents/${id}`, data);
  return response.data;
};

export const deleteQualityDocument = async (id: number) => {
  const response = await api.delete(`/api/quality/documents/${id}`);
  return response.data;
};

export const downloadQualityDocument = async (id: number) => {
  const response = await api.get(`/api/quality/documents/${id}/download`);
  return response.data;
};

// Actions APIs
export const getQualityActions = async (params?: {
  category?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/api/quality/actions', { params });
  return response.data;
};

export const createQualityAction = async (data: {
  category: string;
  subcategory?: string;
  priority: 'Low' | 'Medium' | 'High';
  title: string;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
}) => {
  const response = await api.post('/api/quality/actions', data);
  return preserveSuccessWrapper(response);
};

export const updateQualityAction = async (id: number, data: any) => {
  const response = await api.put(`/api/quality/actions/${id}`, data);
  return response.data;
};

export const deleteQualityAction = async (id: number) => {
  const response = await api.delete(`/api/quality/actions/${id}`);
  return response.data;
};

export const getActionCategories = async () => {
  const response = await api.get('/api/quality/action-categories');
  return response.data;
};

export const createActionCategory = async (data: {
  label: string;
  color: string;
}) => {
  const response = await api.post('/api/quality/action-categories', data);
  return preserveSuccessWrapper(response);
};

// Audits APIs
export const getNextAudit = async () => {
  const response = await api.get('/api/quality/audit/next');
  return response.data;
};

export const createAudit = async (data: {
  type: string;
  date: string;
  auditor?: {
    name: string;
    contact: string;
    phone: string;
  };
  location?: string;
  notes?: string;
}) => {
  const response = await api.post('/api/quality/audit', data);
  return preserveSuccessWrapper(response);
};

export const updateAudit = async (id: number, data: any) => {
  const response = await api.put(`/api/quality/audit/${id}`, data);
  return response.data;
};

export const completeAudit = async (
  id: number,
  data: {
    completionDate: string;
    result: 'passed' | 'failed' | 'conditional';
    score?: number;
    reportUrl?: string;
    notes?: string;
    observations?: string[];
    recommendations?: string[];
  }
) => {
  const response = await api.post(`/api/quality/audit/${id}/complete`, data);
  return preserveSuccessWrapper(response);
};

export const getAuditHistory = async (params?: {
  year?: number;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/api/quality/audit/history', { params });
  return response.data;
};

export const deleteAudit = async (id: number) => {
  const response = await api.delete(`/api/quality/audit/${id}`);
  return response.data;
};

// BPF APIs
export const getQualityBPFs = async (params?: {
  year?: number;
  status?: string;
}) => {
  const response = await api.get('/api/quality/bpf', { params });
  return response.data;
};

export const getQualityBPF = async (id: number) => {
  const response = await api.get(`/api/quality/bpf/${id}`);
  return response.data;
};

export const getBPFHistory = async (id: number) => {
  const response = await api.get(`/api/quality/bpf/${id}/history`);
  return response.data;
};

export const createQualityBPF = async (data: {
  year: number;
  data: any;
}) => {
  const response = await api.post('/api/quality/bpf', data);
  return preserveSuccessWrapper(response);
};

export const updateQualityBPF = async (id: number, data: { data: any }) => {
  const response = await api.put(`/api/quality/bpf/${id}`, data);
  return response.data;
};

export const submitQualityBPF = async (
  id: number,
  data: {
    submittedTo: string;
    submissionMethod: string;
    notes?: string;
  }
) => {
  const response = await api.post(`/api/quality/bpf/${id}/submit`, data);
  return preserveSuccessWrapper(response);
};

export const getBPFArchives = async (params?: {
  fromYear?: number;
  toYear?: number;
}) => {
  const response = await api.get('/api/quality/bpf/archives', { params });
  return response.data;
};

export const exportBPF = async (id: number, format: 'pdf' | 'excel') => {
  const response = await api.get(`/api/quality/bpf/${id}/export`, {
    params: { format },
  });
  return response.data;
};

export const deleteQualityBPF = async (id: number) => {
  const response = await api.delete(`/api/quality/bpf/${id}`);
  return response.data;
};

// Articles APIs
export const getQualityArticles = async (params?: {
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/api/quality/articles', { params });
  // API returns { success: true, data: { articles: [...], pagination: {...} } }
  // Return the full response so the hook can handle it properly
  return response;
};

export const getQualityArticle = async (id: number) => {
  const response = await api.get(`/api/quality/articles/${id}`);
  // API returns { success: true, data: {...} } or direct article object
  // Return the full response so the component can handle it properly
  return response;
};

export const createQualityArticle = async (data: {
  image: string;
  category: string;
  title: string;
  description?: string;
  content?: string;
  featured?: boolean;
  url?: string;
}) => {
  const response = await api.post('/api/quality/articles', data);
  return preserveSuccessWrapper(response);
};

export const updateQualityArticle = async (id: number, data: any) => {
  const response = await api.put(`/api/quality/articles/${id}`, data);
  return response.data;
};

export const deleteQualityArticle = async (id: number) => {
  const response = await api.delete(`/api/quality/articles/${id}`);
  return response.data;
};

// Dashboard & Search APIs
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/api/quality/dashboard/stats');
  return response.data;
};

export const searchQuality = async (params: {
  q: string;
  type?: 'documents' | 'actions' | 'indicators' | 'articles' | 'all';
  limit?: number;
}) => {
  const response = await api.get('/api/quality/search', { params });
  return response.data;
};

// Notifications APIs
export const getQualityNotifications = async (params?: {
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
}) => {
  const response = await api.get('/api/quality/notifications', { params });
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await api.put(`/api/quality/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/api/quality/notifications/read-all');
  return response.data;
};

// Reports APIs
export const exportQualityReport = async (params: {
  format: 'pdf' | 'excel';
  type: 'full' | 'indicators' | 'documents' | 'actions';
  fromDate?: string;
  toDate?: string;
}) => {
  const response = await api.get('/api/quality/reports/export', { params });
  return response.data;
};

export const getReportStatus = async (reportId: string) => {
  const response = await api.get(`/api/quality/reports/${reportId}/status`);
  return response.data;
};

// ==================== TASKS APIs (Trello-style System) ====================

export const getQualityTasks = async (params?: {
  category_id?: number;
  status?: 'todo' | 'in_progress' | 'done' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: number;
  overdue?: boolean;
}) => {
  const response = await api.get('/api/quality/tasks', { params });
  return response.data;
};

export const getTasksByCategory = async (categorySlug: string) => {
  const response = await api.get(`/api/quality/tasks/category/${categorySlug}`);
  return response.data;
};

export const createQualityTask = async (data: {
  category_id: number;
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  start_date?: string; // Start date for task period
  end_date?: string; // End date for task period
  assigned_to?: number; // Single assignee (legacy)
  assigned_member_ids?: number[]; // Multiple assignees (Trello-style)
  checklist?: Array<{ text: string; completed: boolean }>;
  notes?: string;
  comments?: Array<{ content: string; author_id: number }>;
}) => {
  const response = await api.post('/api/quality/tasks', data);
  return preserveSuccessWrapper(response);
};

export const updateQualityTask = async (id: number, data: any) => {
  const response = await api.put(`/api/quality/tasks/${id}`, data);
  return response.data;
};

export const deleteQualityTask = async (id: number) => {
  const response = await api.delete(`/api/quality/tasks/${id}`);
  return response.data;
};

export const updateTaskPositions = async (tasks: Array<{ id: number; position: number }>) => {
  const response = await api.post('/api/quality/tasks/positions', { tasks });
  return response.data;
};

export const uploadTaskAttachment = async (taskId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  // Don't set Content-Type header - browser will set it automatically with boundary for FormData
  const response = await api.post(`/api/quality/tasks/${taskId}/attachments`, formData);
  return preserveSuccessWrapper(response);
};

export const deleteTaskAttachment = async (taskId: number, attachmentId: number) => {
  const response = await api.delete(`/api/quality/tasks/${taskId}/attachments/${attachmentId}`);
  return response.data;
};

export const addTaskComment = async (taskId: number, content: string) => {
  const response = await api.post(`/api/quality/tasks/${taskId}/comments`, { content });
  return preserveSuccessWrapper(response);
};

export const getTaskStatistics = async () => {
  const response = await api.get('/api/quality/tasks/statistics');
  return response.data;
};

// ==================== TASK CATEGORIES APIs ====================

export const getTaskCategories = async (params?: {
  type?: 'veille' | 'competence' | 'dysfonctionnement' | 'amelioration' | 'handicap' | 'custom';
  system_only?: boolean;
  custom_only?: boolean;
}) => {
  const response = await api.get('/api/quality/task-categories', { params });
  return response.data;
};

export const createTaskCategory = async (data: {
  name: string;
  description?: string;
  color: string;
  icon: string;
  type: 'custom';
}) => {
  const response = await api.post('/api/quality/task-categories', data);
  return preserveSuccessWrapper(response);
};

export const updateTaskCategory = async (id: number, data: any) => {
  const response = await api.put(`/api/quality/task-categories/${id}`, data);
  return response.data;
};

export const deleteTaskCategory = async (id: number) => {
  const response = await api.delete(`/api/quality/task-categories/${id}`);
  return preserveSuccessWrapper(response);
};

export const initializeTaskCategories = async () => {
  const response = await api.post('/api/quality/task-categories/initialize', {});
  return response.data;
};

// ==================== NEWS APIs (Public - No auth required) ====================

export const getQualiopiNews = async (params?: {
  type?: 'qualiopi' | 'regulatory' | 'tips' | 'update';
  featured_only?: boolean;
}) => {
  const response = await api.get('/api/quality/public/news', { params });
  return response.data;
};

export const getNewsArticle = async (id: number) => {
  const response = await api.get(`/api/quality/public/news/${id}`);
  return response.data;
};

// ==================== SERVICES APIs (Public - No auth required) ====================

export const getQualityServices = async (params?: {
  featured_only?: boolean;
}) => {
  const response = await api.get('/api/quality/public/services', { params });
  return response.data;
};

export const getService = async (id: number) => {
  const response = await api.get(`/api/quality/public/services/${id}`);
  return response.data;
};

// ==================== INVITATIONS APIs (External Collaborators) ====================

export const getInvitations = async (params?: {
  status?: 'pending' | 'accepted' | 'expired' | 'revoked';
}) => {
  const response = await api.get('/api/quality/invitations', { params });
  return response.data;
};

export const createInvitation = async (data: {
  email: string;
  name: string;
  indicator_access: number[];
}) => {
  const response = await api.post('/api/quality/invitations', data);
  return preserveSuccessWrapper(response);
};

export const revokeInvitation = async (id: number) => {
  const response = await api.post(`/api/quality/invitations/${id}/revoke`, {});
  return response.data;
};

export const resendInvitation = async (id: number) => {
  const response = await api.post(`/api/quality/invitations/${id}/resend`, {});
  return response.data;
};

export const acceptInvitation = async (token: string, data: {
  password: string;
  password_confirmation: string;
}) => {
  const response = await api.post(`/api/quality/invitations/${token}/accept`, data);
  return response.data;
};

// ==================== SESSIONS & PARTICIPANTS APIs ====================

export const getQualitySessions = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  courseUuid?: string;
  course_uuid?: string;
}) => {
  const response = await api.get('/api/quality/sessions', { params });
  return response.data;
};

export const getSessionParticipantsForQuality = async (sessionId: string | number) => {
  const response = await api.get(`/api/quality/sessions/${sessionId}/participants`);
  return response.data;
};

// ==================== STATISTICS APIs ====================

export const getCurrentStatistics = async () => {
  const response = await api.get('/api/quality/statistics/current');
  return response.data;
};

export const getPeriodStatistics = async (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get('/api/quality/statistics/period', { params });
  return response.data;
};

export const getProgressStatistics = async () => {
  const response = await api.get('/api/quality/statistics/progress');
  return response.data;
};

export const regenerateStatistics = async () => {
  const response = await api.post('/api/quality/statistics/regenerate', {});
  return response.data;
};

