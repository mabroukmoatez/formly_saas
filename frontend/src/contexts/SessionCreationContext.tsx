import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { sessionCreation as sessionCreationApi } from '../services/sessionCreation';
import type {
  SessionCreationFormData,
  SessionInstance,
  SessionParticipant,
  SessionChapter,
  SessionDocument,
  SessionTrainer,
  SessionMetadata,
  CreateSessionChapterData,
  UpdateSessionChapterData,
  CreateSessionDocumentData,
  CreateSessionTrainerData,
  UpdateSessionTrainerData,
  InstanceGenerationData
} from '../services/sessionCreation.types';

// Context State Interface
interface SessionCreationState {
  // Form data
  formData: SessionCreationFormData;
  
  // Metadata
  metadata: SessionMetadata | null;
  
  // Session instances (séances)
  instances: SessionInstance[];
  
  // Session participants
  participants: SessionParticipant[];
  
  // Session chapters
  chapters: SessionChapter[];
  
  // Session documents
  documents: SessionDocument[];
  
  // Trainers
  trainers: SessionTrainer[];
  courseTrainers: any[];
  
  // Questionnaires
  questionnaires: any[];
  certificationModels: any[];
  
  // Modules
  modules: any[];
  
  // Objectives
  objectives: any[];
  
  // Additional Fees
  additionalFees: any[];
  
  // Workflow
  workflow: any | null;
  workflowActions: any[];
  emailTemplates: any[];
  
  // UI state
  currentStep: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

// Context Actions Interface
interface SessionCreationActions {
  // Form management
  updateFormField: (field: keyof SessionCreationFormData, value: any) => void;
  resetForm: () => void;
  
  // Step management
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Session CRUD
  createSession: () => Promise<string | null>;
  updateSession: () => Promise<boolean>;
  deleteSession: () => Promise<boolean>;
  loadSession: (sessionUuid: string) => Promise<boolean>;
  initializeSession: (sessionUuid?: string) => Promise<void>;
  
  // Public APIs
  getAllSessions: (params?: any) => Promise<any>;
  getSessionDetailsBySlug: (slug: string) => Promise<any>;
  getFeaturedSessions: (limit?: number) => Promise<any>;
  getSessionCategories: () => Promise<any>;
  getUpcomingInstances: (params?: any) => Promise<any>;
  searchSessions: (query: string) => Promise<any>;
  
  // Student APIs
  getStudentEnrollments: (params?: any) => Promise<any>;
  enrollInSession: (sessionUuid: string) => Promise<any>;
  getStudentSessionDetails: (sessionUuid: string) => Promise<any>;
  getStudentUpcomingInstances: () => Promise<any>;
  getStudentAttendance: (sessionUuid: string) => Promise<any>;
  accessSessionInstance: (instanceUuid: string) => Promise<any>;
  getStudentProgress: (sessionUuid: string) => Promise<any>;
  
  // Organization APIs
  listOrganizationSessions: (params?: any) => Promise<any>;
  
  // Metadata
  loadMetadata: () => Promise<void>;
  
  // Session instances (séances)
  generateInstances: (data: InstanceGenerationData) => Promise<boolean>;
  getInstances: () => Promise<void>;
  cancelInstance: (instanceUuid: string, reason: string) => Promise<boolean>;
  
  // Session participants
  enrollParticipant: (userId: number) => Promise<boolean>;
  getParticipants: () => Promise<void>;
  updateParticipantStatus: (participantId: number, status: string) => Promise<boolean>;
  markAttendance: (instanceUuid: string, data: any) => Promise<boolean>;
  getAttendanceReport: () => Promise<any>;
  
  // Session chapters
  getChapters: () => Promise<void>;
  loadChapters: () => Promise<void>;
  createChapter: (data: CreateSessionChapterData) => Promise<boolean>;
  updateChapter: (chapterUuid: string, data: UpdateSessionChapterData) => Promise<boolean>;
  deleteChapter: (chapterUuid: string) => Promise<boolean>;
  
  // Sub-chapters
  createSubChapterAdapter: (chapterUuid: string, data: any) => Promise<any>;
  updateSubChapterAdapter: (chapterUuid: string, subChapterUuid: string, data: any) => Promise<boolean>;
  deleteSubChapterAdapter: (chapterUuid: string, subChapterUuid: string) => Promise<boolean>;
  
  // Content
  createContentAdapter: (chapterUuid: string, data: any) => Promise<any>;
  updateContent: (chapterUuid: string, contentUuid: string, data: any) => Promise<boolean>;
  deleteContent: (chapterUuid: string, contentUuid: string) => Promise<boolean>;
  
  // Evaluations
  createEvaluationAdapter: (chapterUuid: string, data: any) => Promise<any>;
  
  // Support files
  uploadSupportFilesAdapter: (chapterUuid: string, files: File[]) => Promise<boolean>;
  deleteSupportFile: (chapterUuid: string, fileUuid: string) => Promise<boolean>;
  
  // Session documents
  getDocuments: () => Promise<void>;
  loadDocuments: () => Promise<void>;
  uploadDocument: (data: CreateSessionDocumentData) => Promise<boolean>;
  deleteDocument: (documentUuid: string) => Promise<boolean>;
  loadCertificationModels: () => Promise<void>;
  
  // Questionnaires
  loadQuestionnaires: () => Promise<void>;
  createQuestionnaire: (data: any) => Promise<boolean>;
  updateQuestionnaire: (questionnaireUuid: string, data: any) => Promise<boolean>;
  createQuestion: (questionnaireUuid: string, data: any) => Promise<boolean>;
  updateQuestion: (questionnaireUuid: string, questionUuid: string, data: any) => Promise<boolean>;
  deleteQuestion: (questionnaireUuid: string, questionUuid: string) => Promise<boolean>;
  deleteQuestionnaire: (questionnaireId: number) => Promise<boolean>;
  
  // Modules
  getModules: () => Promise<void>;
  loadModules: () => Promise<void>;
  createModule: (data: any) => Promise<boolean>;
  updateModule: (moduleUuid: string, data: any) => Promise<boolean>;
  deleteModule: (moduleUuid: string) => Promise<boolean>;
  reorderModules: (modules: any[]) => Promise<boolean>;
  
  // Objectives
  getObjectives: () => Promise<void>;
  loadObjectives: () => Promise<void>;
  createObjective: (data: any) => Promise<boolean>;
  updateObjective: (objectiveUuid: string, data: any) => Promise<boolean>;
  deleteObjective: (objectiveUuid: string) => Promise<boolean>;
  
  // Additional Fees
  createAdditionalFee: (data: any) => Promise<boolean>;
  updateAdditionalFee: (feeUuid: string, data: any) => Promise<boolean>;
  deleteAdditionalFee: (feeUuid: string) => Promise<boolean>;
  
  // Trainers
  getTrainers: (params?: { search?: string; per_page?: number }) => Promise<void>;
  loadTrainers: () => Promise<void>;
  searchTrainers: (query: string) => Promise<void>;
  loadCourseTrainers: () => Promise<void>;
  assignTrainer: (data: any) => Promise<boolean>;
  updateTrainerPermissions: (trainerId: string, permissions: any) => Promise<boolean>;
  removeTrainer: (trainerId: string) => Promise<boolean>;
  createTrainer: (data: CreateSessionTrainerData) => Promise<boolean>;
  updateTrainer: (trainerId: string, data: UpdateSessionTrainerData) => Promise<boolean>;
  
  // Workflows (for Step8Deroulement)
  workflow: any | null;
  workflowActions: any[];
  loadWorkflows: () => Promise<void>;
  loadWorkflowActions: () => Promise<void>;
  createWorkflow: (data: any) => Promise<boolean>;
  updateWorkflow: (workflowUuid: string, data: any) => Promise<boolean>;
  deleteWorkflow: (workflowUuid: string, data: any) => Promise<boolean>;
  createWorkflowAction: (workflowUuid: string, data: any) => Promise<boolean>;
  updateWorkflowAction: (workflowUuid: string, actionUuid: string, data: any) => Promise<boolean>;
  deleteWorkflowAction: (workflowUuid: string, actionUuid: string) => Promise<boolean>;
  reorderWorkflowActions: (workflowUuid: string, actionUuids: string[]) => Promise<boolean>;
  toggleWorkflowAction: (workflowUuid: string, actionUuid: string, enabled: boolean) => Promise<boolean>;
  loadEmailTemplates: () => Promise<void>;
  
  // Auto-save
  autoSave: () => Promise<void>;
  saveDraft: () => Promise<void>;
  
  // Media upload
  uploadIntroVideo?: (file: File) => Promise<boolean>;
  uploadIntroImage?: (file: File) => Promise<boolean>;
}

// Context Type
type SessionCreationContextType = SessionCreationState & SessionCreationActions;

// Default form data
const defaultFormData: SessionCreationFormData = {
  title: '',
  subtitle: '',
  description: '',
  category_id: null,
  session_language_id: null,
  difficulty_level_id: null,
  price: 0,
  price_ht: 0,
  vat_percentage: 20,
  currency: 'EUR',
  duration: '',
  duration_days: 0,
  session_start_date: '',
  session_end_date: '',
  session_start_time: '09:00',
  session_end_time: '17:00',
  max_participants: 20,
  target_audience: '',
  prerequisites: '',
  key_points: [],
  trainer_ids: [],
  isPublished: false,
  isDraft: true,
  sessionUuid: undefined
};

// Default state
const defaultState: SessionCreationState = {
  formData: defaultFormData,
  metadata: null,
  instances: [],
  participants: [],
  chapters: [],
  documents: [],
  trainers: [],
  courseTrainers: [],
  questionnaires: [],
  certificationModels: [],
  modules: [],
  objectives: [],
  additionalFees: [],
  workflow: null,
  workflowActions: [],
  emailTemplates: [],
  currentStep: 1,
  isLoading: false,
  isSaving: false,
  error: null
};

// Create context
const SessionCreationContext = createContext<SessionCreationContextType | undefined>(undefined);

// Provider component
export const SessionCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionCreationState>(defaultState);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form management
  const updateFormField = useCallback((field: keyof SessionCreationFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState(defaultState);
  }, []);

  // Step management
  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 7) }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, []);

  // Session CRUD
  const createSession = useCallback(async (): Promise<string | null> => {
    // Ne pas créer si une session existe déjà
    if (state.formData.sessionUuid) {
      return state.formData.sessionUuid;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: any = await sessionCreationApi.createSession({
        ...state.formData,
        title: state.formData.title || 'Nouvelle session',
        description: state.formData.description || 'Brouillon de la session',
        isPublished: false,
        isDraft: true
      });
      const sessionUuid = response.data.uuid;
      
      setState(prev => ({
        ...prev,
        formData: { ...prev.formData, sessionUuid },
        isLoading: false
      }));

      return sessionUuid;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Erreur lors de la création de la session'
      }));
      return null;
    }
  }, [state.formData]);

  const updateSession = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // Extract only the fields that should be sent to the backend
      // Exclude internal fields like sessionUuid, isDraft, etc.
      const updatePayload: any = {
        title: state.formData.title,
        subtitle: state.formData.subtitle,
        description: state.formData.description,
        category_id: state.formData.category_id,
        subcategory_id: state.formData.subcategory_id || null,
        session_language_id: state.formData.session_language_id,
        difficulty_level_id: state.formData.difficulty_level_id,
        price: state.formData.price,
        price_ht: state.formData.price_ht,
        vat_percentage: state.formData.vat_percentage,
        currency: state.formData.currency,
        duration: state.formData.duration,
        duration_days: state.formData.duration_days,
        session_start_date: state.formData.session_start_date || null,
        session_end_date: state.formData.session_end_date || null,
        session_start_time: state.formData.session_start_time || null,
        session_end_time: state.formData.session_end_time || null,
        max_participants: state.formData.max_participants,
        target_audience: state.formData.target_audience,
        prerequisites: state.formData.prerequisites,
        key_points: state.formData.key_points,
        tags: state.formData.tags || [],
        youtube_video_id: state.formData.youtube_video_id || null,
        trainer_ids: state.formData.trainer_ids,
        isPublished: state.formData.isPublished
      };

      console.log('💾 Updating session with payload:', updatePayload);
      
      await sessionCreationApi.updateSession(state.formData.sessionUuid, updatePayload);
      setState(prev => ({ ...prev, isSaving: false }));
      console.log('✅ Session updated successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error updating session:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour de la session'
      }));
      return false;
    }
  }, [state.formData]);

  const deleteSession = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await sessionCreationApi.deleteSession(state.formData.sessionUuid);
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression de la session'
      }));
      return false;
    }
  }, [state.formData.sessionUuid]);

  const loadSession = useCallback(async (sessionUuid: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: any = await sessionCreationApi.getSessionDetails(sessionUuid);
      const sessionData = response.data;
      
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          ...sessionData,
          sessionUuid
        },
        isLoading: false
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Erreur lors du chargement de la session'
      }));
      return false;
    }
  }, []);

  // Public APIs
  const getAllSessions = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getAllSessions(params);
      return response.data;
    } catch (error: any) {
      console.error('Error getting all sessions:', error);
      return null;
    }
  }, []);

  const getSessionDetailsBySlug = useCallback(async (slug: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getSessionDetailsBySlug(slug);
      return response.data;
    } catch (error: any) {
      console.error('Error getting session details by slug:', error);
      return null;
    }
  }, []);

  const getFeaturedSessions = useCallback(async (limit?: number): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getFeaturedSessions(limit);
      return response.data;
    } catch (error: any) {
      console.error('Error getting featured sessions:', error);
      return null;
    }
  }, []);

  const getSessionCategories = useCallback(async (): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getSessionCategories();
      return response.data;
    } catch (error: any) {
      console.error('Error getting session categories:', error);
      return null;
    }
  }, []);

  const getUpcomingInstances = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getUpcomingInstances(params);
      return response.data;
    } catch (error: any) {
      console.error('Error getting upcoming instances:', error);
      return null;
    }
  }, []);

  const searchSessions = useCallback(async (query: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.searchSessions(query);
      return response.data;
    } catch (error: any) {
      console.error('Error searching sessions:', error);
      return null;
    }
  }, []);

  // Student APIs
  const getStudentEnrollments = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentEnrollments(params);
      return response.data;
    } catch (error: any) {
      console.error('Error getting student enrollments:', error);
      return null;
    }
  }, []);

  const enrollInSession = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.enrollInSession(sessionUuid);
      return response.data;
    } catch (error: any) {
      console.error('Error enrolling in session:', error);
      return null;
    }
  }, []);

  const getStudentSessionDetails = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentSessionDetails(sessionUuid);
      return response.data;
    } catch (error: any) {
      console.error('Error getting student session details:', error);
      return null;
    }
  }, []);

  const getStudentUpcomingInstances = useCallback(async (): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentUpcomingInstances();
      return response.data;
    } catch (error: any) {
      console.error('Error getting student upcoming instances:', error);
      return null;
    }
  }, []);

  const getStudentAttendance = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentAttendance(sessionUuid);
      return response.data;
    } catch (error: any) {
      console.error('Error getting student attendance:', error);
      return null;
    }
  }, []);

  const accessSessionInstance = useCallback(async (instanceUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.accessSessionInstance(instanceUuid);
      return response.data;
    } catch (error: any) {
      console.error('Error accessing session instance:', error);
      return null;
    }
  }, []);

  const getStudentProgress = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentProgress(sessionUuid);
      return response.data;
    } catch (error: any) {
      console.error('Error getting student progress:', error);
      return null;
    }
  }, []);

  // Organization APIs
  const listOrganizationSessions = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.listOrganizationSessions(params);
      return response.data;
    } catch (error: any) {
      console.error('Error listing organization sessions:', error);
      return null;
    }
  }, []);

  // Metadata
  const loadMetadata = useCallback(async (): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.getCreationMetadata();
      setState(prev => ({ ...prev, metadata: response.data }));
    } catch (error: any) {
      console.error('Error loading metadata:', error);
    }
  }, []);

  // Session instances (séances)
  const generateInstances = useCallback(async (data: InstanceGenerationData): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: any = await sessionCreationApi.generateSessionInstances(state.formData.sessionUuid, data);
      setState(prev => ({
        ...prev,
        instances: response.data.instances || [],
        isLoading: false
      }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Erreur lors de la génération des instances'
      }));
      return false;
    }
  }, [state.formData.sessionUuid]);

  const getInstances = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      const response: any = await sessionCreationApi.getSessionInstances(state.formData.sessionUuid);
      setState(prev => ({ ...prev, instances: response.data }));
    } catch (error: any) {
      console.error('Error loading instances:', error);
    }
  }, [state.formData.sessionUuid]);

  const cancelInstance = useCallback(async (instanceUuid: string, reason: string): Promise<boolean> => {
    try {
      await sessionCreationApi.cancelSessionInstance(instanceUuid, reason);
      await getInstances(); // Refresh instances
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de l\'annulation de l\'instance'
      }));
      return false;
    }
  }, [getInstances]);

  // Session participants
  const enrollParticipant = useCallback(async (userId: number): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      await sessionCreationApi.enrollParticipant(state.formData.sessionUuid, userId);
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de l\'inscription du participant'
      }));
      return false;
    }
  }, [state.formData.sessionUuid]);

  const getParticipants = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      const response: any = await sessionCreationApi.getSessionParticipants(state.formData.sessionUuid);
      setState(prev => ({ ...prev, participants: response.data }));
    } catch (error: any) {
      console.error('Error loading participants:', error);
    }
  }, [state.formData.sessionUuid]);

  const updateParticipantStatus = useCallback(async (participantId: number, status: string): Promise<boolean> => {
    try {
      await sessionCreationApi.updateParticipantStatus(participantId, status as any);
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du statut'
      }));
      return false;
    }
  }, [getParticipants]);

  const markAttendance = useCallback(async (instanceUuid: string, data: any): Promise<boolean> => {
    try {
      await sessionCreationApi.markAttendance(instanceUuid, data);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de la prise de présence'
      }));
      return false;
    }
  }, []);

  const getAttendanceReport = useCallback(async (): Promise<any> => {
    if (!state.formData.sessionUuid) return null;

    try {
      const response: any = await sessionCreationApi.getAttendanceReport(state.formData.sessionUuid);
      return response.data;
    } catch (error: any) {
      console.error('Error loading attendance report:', error);
      return null;
    }
  }, [state.formData.sessionUuid]);

  // Session chapters
  const getChapters = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      const response: any = await sessionCreationApi.getSessionChapters(state.formData.sessionUuid);
      setState(prev => ({ ...prev, chapters: response.data }));
    } catch (error: any) {
      console.error('Error loading chapters:', error);
    }
  }, [state.formData.sessionUuid]);

  const loadChapters = useCallback(async (): Promise<void> => {
    return getChapters();
  }, [getChapters]);

  const createChapter = useCallback(async (data: CreateSessionChapterData): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      await sessionCreationApi.createSessionChapter(state.formData.sessionUuid, data);
      await getChapters(); // Refresh chapters
      return true;
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getChapters]);

  const updateChapter = useCallback(async (chapterUuid: string, data: UpdateSessionChapterData): Promise<boolean> => {
    try {
      await sessionCreationApi.updateSessionChapter(chapterUuid, data);
      await getChapters(); // Refresh chapters
      return true;
    } catch (error: any) {
      console.error('Error updating chapter:', error);
      return false;
    }
  }, [getChapters]);

  const deleteChapter = useCallback(async (chapterUuid: string): Promise<boolean> => {
    try {
      await sessionCreationApi.deleteSessionChapter(chapterUuid);
      await getChapters(); // Refresh chapters
      return true;
    } catch (error: any) {
      console.error('Error deleting chapter:', error);
      return false;
    }
  }, [getChapters]);

  // Sub-chapters (proper implementations)
  const createSubChapterAdapter = useCallback(async (chapterUuid: string, data: any): Promise<any> => {
    if (!state.formData.sessionUuid) return null;
    try {
      const response: any = await sessionCreationApi.createSessionSubChapter(
        state.formData.sessionUuid,
        chapterUuid,
        {
          title: data.title,
          description: data.description,
          order: data.order
        }
      );
      if (response.success && response.data) {
        await loadChapters(); // Reload to ensure data consistency
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating sub-chapter:', error);
      return null;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  const updateSubChapterAdapter = useCallback(async (chapterUuid: string, subChapterUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.updateSessionSubChapter(
        state.formData.sessionUuid,
        chapterUuid,
        subChapterUuid,
        {
          title: data.title,
          description: data.description,
          order: data.order
        }
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating sub-chapter:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  const deleteSubChapterAdapter = useCallback(async (chapterUuid: string, subChapterUuid: string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.deleteSessionSubChapter(
        state.formData.sessionUuid,
        chapterUuid,
        subChapterUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting sub-chapter:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  // Content (proper implementations)
  const createContentAdapter = useCallback(async (chapterUuid: string, data: any): Promise<any> => {
    if (!state.formData.sessionUuid) return null;
    try {
      const response: any = await sessionCreationApi.createSessionContent(
        state.formData.sessionUuid,
        chapterUuid,
        {
          type: data.type,
          title: data.title,
          content: data.content,
          file: data.file,
          order: data.order,
          sub_chapter_id: data.sub_chapter_id || null
        }
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating content:', error);
      return null;
    }
  }, [state.formData.sessionUuid]);

  const updateContent = useCallback(async (chapterUuid: string, contentUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.updateSessionContent(
        state.formData.sessionUuid,
        chapterUuid,
        contentUuid,
        {
          title: data.title,
          content: data.content,
          file: data.file,
          order: data.order
        }
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating content:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  const deleteContent = useCallback(async (chapterUuid: string, contentUuid: string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.deleteSessionContent(
        state.formData.sessionUuid,
        chapterUuid,
        contentUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting content:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  // Evaluations (proper implementation)
  const createEvaluationAdapter = useCallback(async (chapterUuid: string, data: any): Promise<any> => {
    if (!state.formData.sessionUuid) return null;
    try {
      const response: any = await sessionCreationApi.createSessionEvaluation(
        state.formData.sessionUuid,
        chapterUuid,
        {
          type: data.type,
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          file: data.file,
          sub_chapter_id: data.sub_chapter_id || null
        }
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating evaluation:', error);
      return null;
    }
  }, [state.formData.sessionUuid]);

  // Support files (proper implementations)
  const uploadSupportFilesAdapter = useCallback(async (chapterUuid: string, files: File[]): Promise<boolean> => {
    if (!state.formData.sessionUuid || !files || files.length === 0) return false;
    try {
      const response: any = await sessionCreationApi.uploadSessionSupportFiles(
        state.formData.sessionUuid,
        chapterUuid,
        files
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error uploading support files:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  const deleteSupportFile = useCallback(async (chapterUuid: string, fileUuid: string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.deleteSessionSupportFile(
        state.formData.sessionUuid,
        chapterUuid,
        fileUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting support file:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadChapters]);

  // Session documents
  const getDocuments = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      const response: any = await sessionCreationApi.getSessionDocuments(state.formData.sessionUuid);
      setState(prev => ({ ...prev, documents: response.data }));
    } catch (error: any) {
      console.error('Error loading documents:', error);
    }
  }, [state.formData.sessionUuid]);

  const loadDocuments = useCallback(async (): Promise<void> => {
    return getDocuments();
  }, [getDocuments]);

  const uploadDocument = useCallback(async (data: CreateSessionDocumentData): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      await sessionCreationApi.uploadSessionDocument(state.formData.sessionUuid, data);
      await getDocuments(); // Refresh documents
      return true;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getDocuments]);

  const deleteDocument = useCallback(async (documentUuid: string): Promise<boolean> => {
    try {
      await sessionCreationApi.deleteSessionDocument(documentUuid);
      await getDocuments(); // Refresh documents
      return true;
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return false;
    }
  }, [getDocuments]);

  // Questionnaires
  const loadQuestionnaires = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;
    try {
      const response: any = await sessionCreationApi.getSessionQuestionnaires(state.formData.sessionUuid);
      if (response.success && response.data) {
        setState(prev => ({ ...prev, questionnaires: response.data }));
      }
    } catch (error: any) {
      console.error('Error loading questionnaires:', error);
    }
  }, [state.formData.sessionUuid]);

  const loadCertificationModels = useCallback(async (): Promise<void> => {
    try {
      // Implement certification models loading API call
      console.log('Loading certification models');
      setState(prev => ({ ...prev, certificationModels: [] }));
    } catch (error: any) {
      console.error('Error loading certification models:', error);
    }
  }, []);

  const createQuestionnaire = useCallback(async (data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.createSessionQuestionnaire(state.formData.sessionUuid, data);
      if (response.success) {
        await loadQuestionnaires();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating questionnaire:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadQuestionnaires]);

  const updateQuestionnaire = useCallback(async (questionnaireUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.updateSessionQuestionnaire(state.formData.sessionUuid, questionnaireUuid, data);
      if (response.success) {
        await loadQuestionnaires();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating questionnaire:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadQuestionnaires]);

  const createQuestion = useCallback(async (questionnaireUuid: string, data: any): Promise<boolean> => {
    console.log('Creating question:', questionnaireUuid, data);
    return true;
  }, []);

  const updateQuestion = useCallback(async (questionnaireUuid: string, questionUuid: string, data: any): Promise<boolean> => {
    console.log('Updating question:', questionnaireUuid, questionUuid, data);
    return true;
  }, []);

  const deleteQuestion = useCallback(async (questionnaireUuid: string, questionUuid: string): Promise<boolean> => {
    console.log('Deleting question:', questionnaireUuid, questionUuid);
    return true;
  }, []);

  const deleteQuestionnaire = useCallback(async (questionnaireId: number | string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.deleteSessionQuestionnaire(state.formData.sessionUuid, String(questionnaireId));
      if (response.success) {
        await loadQuestionnaires();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting questionnaire:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadQuestionnaires]);

  // Modules (proper implementations with backend integration)
  const getModules = useCallback(async (): Promise<void> => {
    try {
      if (!state.formData.sessionUuid) return;
      const response: any = await sessionCreationApi.getSessionModules(state.formData.sessionUuid);
      setState(prev => ({ ...prev, modules: response.data || [] }));
    } catch (error: any) {
      console.error('Error loading modules:', error);
      setState(prev => ({ ...prev, modules: [] }));
    }
  }, [state.formData.sessionUuid]);

  const loadModules = useCallback(async (): Promise<void> => {
    return getModules();
  }, [getModules]);

  const createModule = useCallback(async (data: any): Promise<boolean> => {
    try {
      if (!state.formData.sessionUuid) return false;
      
      const response: any = await sessionCreationApi.createSessionModule(state.formData.sessionUuid, data);
      if (response.success) {
        await getModules(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating module:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getModules]);

  const updateModule = useCallback(async (moduleUuid: string, data: any): Promise<boolean> => {
    try {
      if (!state.formData.sessionUuid) return false;
      const response: any = await sessionCreationApi.updateSessionModule(state.formData.sessionUuid, moduleUuid, data);
      if (response.success) {
        await getModules(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating module:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getModules]);

  const deleteModule = useCallback(async (moduleUuid: string): Promise<boolean> => {
    try {
      if (!state.formData.sessionUuid) return false;
      const response: any = await sessionCreationApi.deleteSessionModule(state.formData.sessionUuid, moduleUuid);
      if (response.success) {
        await getModules(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting module:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getModules]);

  const reorderModules = useCallback(async (modules: any[]): Promise<boolean> => {
    console.log('Reordering modules:', modules);
    return true;
  }, []);

  // Objectives (proper implementations with backend integration)
  const getObjectives = useCallback(async (): Promise<void> => {
    try {
      if (!state.formData.sessionUuid) return;
      const response: any = await sessionCreationApi.getSessionObjectives(state.formData.sessionUuid);
      setState(prev => ({ ...prev, objectives: response.data || [] }));
    } catch (error: any) {
      console.error('Error loading objectives:', error);
      setState(prev => ({ ...prev, objectives: [] }));
    }
  }, [state.formData.sessionUuid]);

  const loadObjectives = useCallback(async (): Promise<void> => {
    return getObjectives();
  }, [getObjectives]);

  const createObjective = useCallback(async (data: any): Promise<boolean> => {
    try {
      if (!state.formData.sessionUuid) return false;
      
      // Ensure we send title and description (backend expects both)
      const objectiveData = {
        title: data.title || data.description || 'Nouvel objectif',
        description: data.description || data.title || '',
        order_index: data.order_index || 0
      };
      
      const response: any = await sessionCreationApi.createSessionObjective(state.formData.sessionUuid, objectiveData);
      if (response.success) {
        await getObjectives(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating objective:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getObjectives]);

  const updateObjective = useCallback(async (objectiveUuid: string, data: any): Promise<boolean> => {
    try {
      if (!state.formData.sessionUuid) return false;
      const response: any = await sessionCreationApi.updateSessionObjective(state.formData.sessionUuid, objectiveUuid, data);
      if (response.success) {
        await getObjectives(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating objective:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getObjectives]);

  const deleteObjective = useCallback(async (objectiveUuid: string): Promise<boolean> => {
    try {
      if (!state.formData.sessionUuid) return false;
      const response: any = await sessionCreationApi.deleteSessionObjective(state.formData.sessionUuid, objectiveUuid);
      if (response.success) {
        await getObjectives(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting objective:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getObjectives]);

  // Additional Fees (placeholder implementations)
  const createAdditionalFee = useCallback(async (data: any): Promise<boolean> => {
    console.log('Creating additional fee:', data);
    return true;
  }, []);

  const updateAdditionalFee = useCallback(async (feeUuid: string, data: any): Promise<boolean> => {
    console.log('Updating additional fee:', feeUuid, data);
    return true;
  }, []);

  const deleteAdditionalFee = useCallback(async (feeUuid: string): Promise<boolean> => {
    console.log('Deleting additional fee:', feeUuid);
    return true;
  }, []);

  // Trainers
  const getTrainers = useCallback(async (params?: { search?: string; per_page?: number }): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.getAllTrainers(params);
      setState(prev => ({ ...prev, trainers: response.data }));
    } catch (error: any) {
      console.error('Error loading trainers:', error);
    }
  }, []);

  const searchTrainers = useCallback(async (query: string): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.searchTrainers(query);
      setState(prev => ({ ...prev, trainers: response.data }));
    } catch (error: any) {
      console.error('Error searching trainers:', error);
    }
  }, []);

  const loadTrainers = useCallback(async (): Promise<void> => {
    await getTrainers();
  }, [getTrainers]);

  const loadCourseTrainers = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;
    try {
      const response: any = await sessionCreationApi.getSessionTrainers(state.formData.sessionUuid);
      if (response.success && response.data) {
        setState(prev => ({ ...prev, courseTrainers: response.data }));
      }
    } catch (error: any) {
      console.error('Error loading course trainers:', error);
    }
  }, [state.formData.sessionUuid]);

  const assignTrainer = useCallback(async (data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.assignSessionTrainer(state.formData.sessionUuid, data);
      if (response.success) {
        await getTrainers();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error assigning trainer:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getTrainers]);

  const updateTrainerPermissions = useCallback(async (trainerId: string, permissions: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.updateSessionTrainerPermissions(state.formData.sessionUuid, trainerId, permissions);
      if (response.success) {
        await getTrainers();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating trainer permissions:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getTrainers]);

  const removeTrainer = useCallback(async (trainerId: string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.removeSessionTrainer(state.formData.sessionUuid, trainerId);
      if (response.success) {
        await getTrainers();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error removing trainer:', error);
      return false;
    }
  }, [state.formData.sessionUuid, getTrainers]);

  const createTrainer = useCallback(async (data: CreateSessionTrainerData): Promise<boolean> => {
    try {
      await sessionCreationApi.createTrainer(data);
      await getTrainers(); // Refresh trainers
      return true;
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      return false;
    }
  }, [getTrainers]);

  const updateTrainer = useCallback(async (trainerId: string, data: UpdateSessionTrainerData): Promise<boolean> => {
    try {
      await sessionCreationApi.updateTrainer(trainerId, data);
      await getTrainers(); // Refresh trainers
      return true;
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      return false;
    }
  }, [getTrainers]);

  // Workflows
  const loadWorkflows = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;
    try {
      const response: any = await sessionCreationApi.getSessionWorkflow(state.formData.sessionUuid);
      if (response.success && response.data) {
        setState(prev => ({ ...prev, workflow: response.data }));
      }
    } catch (error: any) {
      console.error('Error loading workflows:', error);
    }
  }, [state.formData.sessionUuid]);

  const loadWorkflowActions = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;
    try {
      const response: any = await sessionCreationApi.getSessionWorkflow(state.formData.sessionUuid);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          workflow: response.data,
          workflowActions: response.data.actions || []
        }));
      }
    } catch (error: any) {
      console.error('Error loading workflow actions:', error);
    }
  }, [state.formData.sessionUuid]);

  const createWorkflow = useCallback(async (data: any): Promise<boolean> => {
    // Workflow is created automatically, we just toggle it
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.toggleSessionWorkflow(state.formData.sessionUuid, true);
      if (response.success) {
        await loadWorkflows();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const updateWorkflow = useCallback(async (workflowUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      if (data.is_active !== undefined) {
        const response: any = await sessionCreationApi.toggleSessionWorkflow(state.formData.sessionUuid, data.is_active);
        if (response.success) {
          await loadWorkflows();
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error('Error updating workflow:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const deleteWorkflow = useCallback(async (workflowUuid: string): Promise<boolean> => {
    // Workflow cannot be deleted, only deactivated
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.toggleSessionWorkflow(state.formData.sessionUuid, false);
      if (response.success) {
        await loadWorkflows();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const createWorkflowAction = useCallback(async (workflowUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.createSessionWorkflowAction(state.formData.sessionUuid, data);
      if (response.success) {
        await loadWorkflows();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating workflow action:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const updateWorkflowAction = useCallback(async (workflowUuid: string, actionUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.updateSessionWorkflowAction(state.formData.sessionUuid, actionUuid, data);
      if (response.success) {
        await loadWorkflows();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating workflow action:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const deleteWorkflowAction = useCallback(async (workflowUuid: string, actionUuid: string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.deleteSessionWorkflowAction(state.formData.sessionUuid, actionUuid);
      if (response.success) {
        await loadWorkflows();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting workflow action:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const reorderWorkflowActions = useCallback(async (workflowUuid: string, actionUuids: string[]): Promise<boolean> => {
    // TODO: Implement reorder endpoint if available
    console.log('Reordering workflow actions:', workflowUuid, actionUuids);
    return true;
  }, []);

  const toggleWorkflowAction = useCallback(async (workflowUuid: string, actionUuid: string, enabled: boolean): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;
    try {
      const response: any = await sessionCreationApi.updateSessionWorkflowAction(state.formData.sessionUuid, actionUuid, { is_active: enabled });
      if (response.success) {
        await loadWorkflows();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error toggling workflow action:', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const loadEmailTemplates = useCallback(async (): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.getEmailTemplates();
      if (response.success && response.data) {
        setState(prev => ({ ...prev, emailTemplates: response.data }));
      }
    } catch (error: any) {
      console.error('Error loading email templates:', error);
    }
  }, []);

  // Auto-save
  const autoSave = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid || state.isSaving) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await updateSession();
    }, 2000);
  }, [state.formData.sessionUuid, state.isSaving, updateSession]);

  const saveDraft = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) {
      const sessionUuid = await createSession();
      if (!sessionUuid) return;
    }

    setState(prev => ({ ...prev, formData: { ...prev.formData, isDraft: true } }));
    await updateSession();
  }, [state.formData.sessionUuid, createSession, updateSession]);

  // Media upload - same as courses
  const uploadIntroVideo = useCallback(async (file: File): Promise<boolean> => {
    // If sessionUuid is not available, create a new session first
    if (!state.formData.sessionUuid) {
      try {
        const result = await sessionCreationApi.createSession({
          title: state.formData.title || 'Nouvelle session',
          description: state.formData.description || 'Brouillon de la session',
          isPublished: false,
          isDraft: true
        });
        
        if (result.success && result.data?.uuid) {
          setState(prev => ({
            ...prev,
            formData: { ...prev.formData, sessionUuid: result.data.uuid }
          }));
        } else {
          return false;
        }
      } catch (error) {
        console.error('Error creating session for video upload:', error);
        return false;
      }
    }
    
    try {
      const result = await sessionCreationApi.uploadIntroVideo(state.formData.sessionUuid!, file);
      if (result.success) {
        setState(prev => ({
          ...prev,
          formData: {
            ...prev.formData,
            intro_video_url: result.data.file_url,
            intro_video: file
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error uploading intro video:', error);
      return false;
    }
  }, [state.formData]);

  const uploadIntroImage = useCallback(async (file: File): Promise<boolean> => {
    // If sessionUuid is not available, create a new session first
    if (!state.formData.sessionUuid) {
      try {
        const result = await sessionCreationApi.createSession({
          title: state.formData.title || 'Nouvelle session',
          description: state.formData.description || 'Brouillon de la session',
          isPublished: false,
          isDraft: true
        });
        
        if (result.success && result.data?.uuid) {
          setState(prev => ({
            ...prev,
            formData: { ...prev.formData, sessionUuid: result.data.uuid }
          }));
        } else {
          return false;
        }
      } catch (error) {
        console.error('Error creating session for image upload:', error);
        return false;
      }
    }
    
    try {
      const result = await sessionCreationApi.uploadIntroImage(state.formData.sessionUuid!, file);
      if (result.success) {
        setState(prev => ({
          ...prev,
          formData: {
            ...prev.formData,
            intro_image_url: result.data.file_url,
            intro_image: file
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error uploading intro image:', error);
      return false;
    }
  }, [state.formData]);

  // Initialize session - similar to initializeCourse (must be after all function definitions)
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const initializeSession = useCallback(async (sessionUuid?: string) => {
    if (hasInitializedRef.current || isInitializingRef.current) return;
    isInitializingRef.current = true;
    
    try {
      let uuid = sessionUuid || state.formData.sessionUuid;
      
      // Si pas de UUID, créer une session en brouillon
      if (!uuid) {
        const result = await sessionCreationApi.createSession({
          title: state.formData.title || 'Nouvelle session',
          description: state.formData.description || 'Brouillon de la session',
          isPublished: false,
          isDraft: true
        });
        
        if (result.success && result.data?.uuid) {
          uuid = result.data.uuid;
          setState(prev => ({
            ...prev,
            formData: { ...prev.formData, sessionUuid: uuid }
          }));
        } else {
          isInitializingRef.current = false;
          return;
        }
      } else {
        // Mettre à jour le formData avec l'UUID
        setState(prev => ({
          ...prev,
          formData: { ...prev.formData, sessionUuid: uuid }
        }));
      }

      // Charger les données existantes si on édite une session
      if (sessionUuid) {
        try {
          const sessionResult = await sessionCreationApi.getSessionDetails(sessionUuid);
          if (sessionResult.success) {
            const session = sessionResult.data;
            setState(prev => ({
              ...prev,
              formData: {
                ...prev.formData,
                ...session,
                sessionUuid: uuid
              }
            }));
          }
        } catch (error) {
          console.error('Error loading existing session data:', error);
        }
      }

      // Charger toutes les données associées
      await Promise.all([
        getInstances(),
        getParticipants(),
        getChapters(),
        getDocuments(),
        getTrainers(),
        loadQuestionnaires(),
        loadWorkflows(),
        getModules(),
        getObjectives()
      ]);
      
      hasInitializedRef.current = true;
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      isInitializingRef.current = false;
    }
  }, [state.formData, getInstances, getParticipants, getChapters, getDocuments, getTrainers, loadQuestionnaires, loadWorkflows, getModules, getObjectives]);

  // Context value
  const contextValue: SessionCreationContextType = {
    ...state,
    updateFormField,
    resetForm,
    setCurrentStep,
    nextStep,
    previousStep,
    createSession,
    updateSession,
    deleteSession,
    loadSession,
    initializeSession,
    getAllSessions,
    getSessionDetailsBySlug,
    getFeaturedSessions,
    getSessionCategories,
    getUpcomingInstances,
    searchSessions,
    getStudentEnrollments,
    enrollInSession,
    getStudentSessionDetails,
    getStudentUpcomingInstances,
    getStudentAttendance,
    accessSessionInstance,
    getStudentProgress,
    listOrganizationSessions,
    loadMetadata,
    generateInstances,
    getInstances,
    cancelInstance,
    enrollParticipant,
    getParticipants,
    updateParticipantStatus,
    markAttendance,
    getAttendanceReport,
    getChapters,
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    createSubChapterAdapter,
    updateSubChapterAdapter,
    deleteSubChapterAdapter,
    createContentAdapter,
    updateContent,
    deleteContent,
    createEvaluationAdapter,
    uploadSupportFilesAdapter,
    deleteSupportFile,
    getDocuments,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    loadCertificationModels,
    loadQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deleteQuestionnaire,
    getModules,
    loadModules,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    getObjectives,
    loadObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
    createAdditionalFee,
    updateAdditionalFee,
    deleteAdditionalFee,
    getTrainers,
    loadTrainers,
    searchTrainers,
    loadCourseTrainers,
    assignTrainer,
    updateTrainerPermissions,
    removeTrainer,
    createTrainer,
    updateTrainer,
    workflow: state.workflow,
    workflowActions: state.workflowActions,
    loadWorkflows,
    loadWorkflowActions,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    createWorkflowAction,
    updateWorkflowAction,
    deleteWorkflowAction,
    reorderWorkflowActions,
    toggleWorkflowAction,
    loadEmailTemplates,
    autoSave,
    saveDraft,
    uploadIntroVideo,
    uploadIntroImage
  };

  return (
    <SessionCreationContext.Provider value={contextValue}>
      {children}
    </SessionCreationContext.Provider>
  );
};

// Hook to use the context
export const useSessionCreation = (): SessionCreationContextType => {
  const context = useContext(SessionCreationContext);
  if (context === undefined) {
    throw new Error('useSessionCreation must be used within a SessionCreationProvider');
  }
  return context;
};

export default SessionCreationContext;
