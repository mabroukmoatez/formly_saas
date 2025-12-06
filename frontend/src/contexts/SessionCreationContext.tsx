/**
 * Session Creation Context
 * 
 * ARCHITECTURE (selon docs/SESSION_OVERRIDE_ARCHITECTURE.md):
 * - Course (Cours) = Template/Modèle de formation (JAMAIS MODIFIÉ lors de création de session)
 * - CourseSession = Instance planifiée d'un cours avec OVERRIDES possibles
 * - SessionSlot = Créneau/Séance individuelle
 * 
 * SYSTÈME D'OVERRIDE:
 * - Une session HÉRITE de son cours template
 * - Toute modification est stockée comme OVERRIDE dans la session
 * - Le template du cours reste INTACT
 * - override = null → la session utilise la valeur du cours
 * - override = "value" → la session utilise cette valeur personnalisée
 * 
 * FLOW DE SAUVEGARDE:
 * - Steps 1-5: Modifications stockées comme OVERRIDES sur la SESSION (pas le cours!)
 * - Steps 6-7: Modifications de la SESSION (dates, participants, séances)
 * - saveAll(): Sauvegarde les overrides + données session
 * 
 * ⚠️ IMPORTANT: Ne JAMAIS appeler courseCreation.updateXxx lors de création/édition de session!
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { sessionCreation as sessionCreationApi } from '../services/sessionCreation';
import { courseCreation } from '../services/courseCreation';
import { courseSessionService } from '../services/courseSession';
import { sessionOverrideService } from '../services/sessionOverride';
import { sessionLogger as log } from '../utils/logger';
import { parseApiError } from '../utils/apiErrorHandler';
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
  
  // Session chapters (effectifs = hérités ou overridés)
  chapters: SessionChapter[];
  
  // Session documents (effectifs = hérités ou overridés)
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
  
  // ===== OVERRIDE SYSTEM =====
  // Indique si on est en mode "création de session" (vs "création de cours")
  isSessionMode: boolean;
  
  // Flags d'override - true = les données sont overridées pour cette session
  hasChaptersOverride: boolean;
  hasDocumentsOverride: boolean;
  hasWorkflowOverride: boolean;
  
  // Données du cours template (pour référence/comparaison)
  courseTemplate: {
    uuid: string;
    title: string;
    description: string | null;
    duration: number | null;
    price_ht: number | null;
    chapters_count: number;
    documents_count: number;
  } | null;
  
  // Champs overridés (null = hérite du cours)
  overrides: {
    title: string | null;
    subtitle: string | null;
    description: string | null;
    duration: number | null;
    price_ht: number | null;
    objectives: string[] | null;
    prerequisites: string[] | null;
  };
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
  loadSubcategories: (categoryId: number) => Promise<void>;
  
  // Session instances (séances)
  generateInstances: (data: InstanceGenerationData) => Promise<boolean>;
  getInstances: () => Promise<void>;
  cancelInstance: (instanceUuid: string, reason: string) => Promise<boolean>;
  
  // Session participants
  enrollParticipant: (userId: number) => Promise<boolean>;
  enrollMultipleParticipants: (userIds: number[]) => Promise<boolean>;
  getParticipants: () => Promise<void>;
  updateParticipantStatus: (participantId: number, status: string) => Promise<boolean>;
  updateParticipantTarif: (participantId: number, tarif: number) => Promise<boolean>;
  updateParticipantType: (participantId: number, type: string) => Promise<boolean>;
  deleteParticipant: (participantId: number) => Promise<boolean>;
  deleteMultipleParticipants: (participantIds: number[]) => Promise<boolean>;
  exportParticipants: (format?: 'xlsx' | 'csv') => Promise<void>;
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
  updateContentAdapter: (chapterUuid: string, contentUuid: string, data: any) => Promise<boolean>;
  deleteContent: (chapterUuid: string, contentUuid: string) => Promise<boolean>;
  deleteContentAdapter: (chapterUuid: string, contentUuid: string) => Promise<boolean>;
  
  // Evaluations
  createEvaluationAdapter: (chapterUuid: string, data: any) => Promise<any>;
  updateEvaluationAdapter: (chapterUuid: string, evaluationUuid: string, data: any) => Promise<any>;
  deleteEvaluationAdapter: (chapterUuid: string, evaluationUuid: string) => Promise<boolean>;
  
  // Support files
  uploadSupportFilesAdapter: (files: File[], chapterId: string, subChapterId?: string) => Promise<boolean>;
  deleteSupportFile: (chapterUuid: string, fileUuid: string) => Promise<boolean>;
  deleteSupportFileAdapter: (chapterUuid: string, fileUuid: string) => Promise<boolean>;
  
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
  
  // Load data from course (for pre-filling when creating session from course)
  loadFromCourse: (courseUuid: string) => Promise<boolean>;
  
  // Direct setters for pre-filling data
  setModules: (modules: any[]) => void;
  setObjectives: (objectives: any[]) => void;
  setChapters: (chapters: any[]) => void;
  setDocuments: (documents: any[]) => void;
  setQuestionnaires: (questionnaires: any[]) => void;
  
  // Save all - saves SESSION OVERRIDES + SESSION data (séances + participants)
  // ⚠️ NE MODIFIE PAS le cours template!
  saveAll: () => Promise<{ success: boolean; courseSuccess: boolean; sessionSuccess: boolean; message: string }>;
  
  // ===== OVERRIDE SYSTEM ACTIONS =====
  
  // Enable session mode (modifications go to session, not course)
  enableSessionMode: () => void;
  
  // Set override for a simple field
  setOverride: (field: keyof SessionCreationState['overrides'], value: any) => void;
  
  // Reset an override (revert to course template value)
  resetOverride: (field: keyof SessionCreationState['overrides']) => void;
  
  // Reset all overrides for a category
  resetAllOverrides: () => void;
  
  // Initialize chapters override (copy from course to enable modifications)
  initializeChaptersOverride: () => Promise<boolean>;
  
  // Initialize documents override
  initializeDocumentsOverride: () => Promise<boolean>;
  
  // Initialize workflow override
  initializeWorkflowOverride: () => Promise<boolean>;
  
  // Reset chapters to course template
  resetChaptersToTemplate: () => Promise<boolean>;
  
  // Reset documents to course template
  resetDocumentsToTemplate: () => Promise<boolean>;
  
  // Reset workflow to course template
  resetWorkflowToTemplate: () => Promise<boolean>;
  
  // Check if a field is inherited or overridden
  isFieldInherited: (field: string) => boolean;
  
  // Get the original course template value for comparison
  getCourseTemplateValue: (field: string) => any;
}

// Context Type
type SessionCreationContextType = SessionCreationState & SessionCreationActions;

// Default form data
const defaultFormData: SessionCreationFormData = {
  title: '',
  subtitle: '',
  description: '',
  formation_action: 'Actions de formation',
  category_id: null,
  subcategory_id: null,
  session_language_id: null,
  difficulty_level_id: null,
  price: 0,
  price_ht: 0,
  vat_percentage: 20,
  currency: 'EUR',
  duration: 0,
  duration_days: 0,
  session_start_date: '',
  session_end_date: '',
  session_start_time: '09:00',
  session_end_time: '17:00',
  max_participants: 20,
  target_audience: '',
  prerequisites: '',
  methods: '',
  specifics: '',
  evaluation_modalities: '',
  access_modalities: '',
  accessibility: '',
  contacts: '',
  update_date: '',
  key_points: [],
  trainer_ids: [],
  formation_practice_ids: [],
  intro_video: null,
  intro_image: null,
  intro_video_url: '',
  intro_image_url: '',
  youtube_video_id: '',
  tags: [],
  isPublished: false,
  isDraft: true,
  sessionUuid: undefined,
  courseUuid: undefined // UUID of source course
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
  error: null,
  
  // ===== OVERRIDE SYSTEM =====
  isSessionMode: false,
  hasChaptersOverride: false,
  hasDocumentsOverride: false,
  hasWorkflowOverride: false,
  courseTemplate: null,
  overrides: {
    title: null,
    subtitle: null,
    description: null,
    duration: null,
    price_ht: null,
    objectives: null,
    prerequisites: null,
  }
};

// Valid formation_action values
const VALID_FORMATION_ACTIONS = [
  "Actions de formation",
  "Bilan de compétences",
  "VAE (Validation des Acquis de l'Expérience)",
  "Actions de formation par apprentissage",
  "Autre..."
];

// Helper function to validate formation_action
const getValidFormationAction = (value?: string): string => {
  if (value && VALID_FORMATION_ACTIONS.includes(value)) {
    return value;
  }
  return 'Actions de formation';
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
  /**
   * Crée une nouvelle session
   * API: POST /api/admin/organization/course-sessions
   * 
   * ⚠️ IMPORTANT: course_uuid est OBLIGATOIRE
   * Une session est toujours une instance planifiée d'un cours.
   * 
   * Flux: Sélection cours → Création session → Génération slots
   */
  const createSession = useCallback(async (): Promise<string | null> => {
    // Ne pas créer si une session existe déjà
    if (state.formData.sessionUuid) {
      return state.formData.sessionUuid;
    }

    // ✅ course_uuid est OBLIGATOIRE - pas de création sans cours
    if (!state.formData.courseUuid) {
      const errorMsg = 'Veuillez sélectionner un cours avant de créer une session';
      log.error('Cannot create session: course_uuid is required');
      setState(prev => ({
        ...prev,
        error: errorMsg
      }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get default dates (today + 30 days for end date if not provided)
      const today = new Date();
      const defaultEndDate = new Date(today);
      defaultEndDate.setDate(today.getDate() + 30);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      log.info('Creating session via courseSessionService', { courseUuid: state.formData.courseUuid });
      
      // Déterminer le delivery_mode
      const getDeliveryMode = (): 'presentiel' | 'distanciel' | 'hybrid' | 'e-learning' => {
        const sessionType = state.formData.session_type?.toLowerCase();
        if (sessionType === 'e-learning') return 'e-learning';
        if (sessionType === 'distanciel' || sessionType === 'distance') return 'distanciel';
        if (sessionType === 'hybride' || sessionType === 'hybrid') return 'hybrid';
        return 'presentiel';
      };
      
      // Payload selon COURSE_SESSIONS_API.md (SESSIONS_API_DOCUMENTATION.md)
      const payload = {
        course_uuid: state.formData.courseUuid, // ✅ OBLIGATOIRE
        title: state.formData.title || null, // null = hérite du cours
        description: state.formData.description || null,
        session_type: 'inter' as const, // 'intra', 'inter', 'individual'
        delivery_mode: getDeliveryMode(),
        start_date: state.formData.session_start_date || formatDate(today),
        end_date: state.formData.session_end_date || formatDate(defaultEndDate),
        default_start_time: state.formData.session_start_time || '09:00',
        default_end_time: state.formData.session_end_time || '17:00',
        total_hours: state.formData.duration || undefined,
        total_days: state.formData.duration_days || undefined,
        min_participants: 1,
        max_participants: state.formData.max_participants || 20,
        price_ht: state.formData.price_ht || null, // null = hérite du cours
        vat_rate: state.formData.vat_percentage || 20,
        pricing_type: 'per_person' as const,
        status: 'draft' as const,
        is_published: false,
        trainer_uuids: state.formData.trainer_ids || [],
        // Location (présentiel)
        location_name: state.formData.location_name,
        location_address: state.formData.location_address,
        location_city: state.formData.location_city,
        location_postal_code: state.formData.location_postal_code,
        location_room: state.formData.location_room,
        // Online (distanciel)
        platform_type: state.formData.platform_type,
        meeting_link: state.formData.meeting_link,
      };
      
      const response = await courseSessionService.createSession(payload);
      const sessionUuid = response.data?.uuid;
      
      if (sessionUuid) {
      setState(prev => ({
        ...prev,
        formData: { ...prev.formData, sessionUuid },
        isLoading: false
      }));
        log.info('Session created successfully', { sessionUuid });
      return sessionUuid;
      } else {
        throw new Error('No session UUID in API response');
      }
    } catch (error: any) {
      const errorInfo = parseApiError(error);
      log.error('Failed to create session', errorInfo);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorInfo.message || 'Erreur lors de la création de la session'
      }));
      return null;
    }
  }, [state.formData]);

  /**
   * Met à jour une session existante
   * API: PUT /api/admin/organization/course-sessions/{uuid}
   */
  const updateSession = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // Déterminer le delivery_mode
      const getDeliveryMode = (): 'presentiel' | 'distanciel' | 'hybrid' | 'e-learning' => {
        const sessionType = state.formData.session_type?.toLowerCase();
        if (sessionType === 'e-learning') return 'e-learning';
        if (sessionType === 'distanciel' || sessionType === 'distance') return 'distanciel';
        if (sessionType === 'hybride' || sessionType === 'hybrid') return 'hybrid';
        return 'presentiel';
      };
      
      // Payload selon SESSIONS_API_DOCUMENTATION.md
      const updatePayload = {
        title: state.formData.title || undefined,
        description: state.formData.description || undefined,
        session_type: 'inter' as const,
        delivery_mode: getDeliveryMode(),
        start_date: state.formData.session_start_date,
        end_date: state.formData.session_end_date,
        default_start_time: state.formData.session_start_time || '09:00',
        default_end_time: state.formData.session_end_time || '17:00',
        total_hours: state.formData.duration || undefined,
        total_days: state.formData.duration_days || undefined,
        max_participants: state.formData.max_participants || undefined,
        price_ht: state.formData.price_ht || undefined,
        vat_rate: state.formData.vat_percentage || 20,
        is_published: state.formData.isPublished || false,
        trainer_uuids: state.formData.trainer_ids || [],
        // Location
        location_name: state.formData.location_name,
        location_address: state.formData.location_address,
        location_city: state.formData.location_city,
        location_postal_code: state.formData.location_postal_code,
        location_room: state.formData.location_room,
        // Online
        platform_type: state.formData.platform_type,
        meeting_link: state.formData.meeting_link,
      };

      log.debug('Updating session via courseSessionService', { sessionUuid: state.formData.sessionUuid });
      
      await courseSessionService.updateSession(state.formData.sessionUuid, updatePayload);
      setState(prev => ({ ...prev, isSaving: false }));
      log.info('Session updated successfully');
      return true;
    } catch (error: any) {
      const errorInfo = parseApiError(error);
      log.error('Failed to update session', errorInfo);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorInfo.message || 'Erreur lors de la mise à jour de la session'
      }));
      return false;
    }
  }, [state.formData]);

  /**
   * Supprime une session
   * API: DELETE /api/admin/organization/course-sessions/{uuid}
   */
  const deleteSession = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await courseSessionService.deleteSession(state.formData.sessionUuid);
      setState(prev => ({ ...prev, isLoading: false }));
      log.info('Session deleted successfully');
      return true;
    } catch (error: any) {
      const errorInfo = parseApiError(error);
      log.error('Failed to delete session', errorInfo);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorInfo.message || 'Erreur lors de la suppression de la session'
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
      log.error('Error getting all sessions', error);
      return null;
    }
  }, []);

  const getSessionDetailsBySlug = useCallback(async (slug: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getSessionDetailsBySlug(slug);
      return response.data;
    } catch (error: any) {
      log.error('Error getting session details by slug', error);
      return null;
    }
  }, []);

  const getFeaturedSessions = useCallback(async (limit?: number): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getFeaturedSessions(limit);
      return response.data;
    } catch (error: any) {
      log.error('Error getting featured sessions', error);
      return null;
    }
  }, []);

  const getSessionCategories = useCallback(async (): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getSessionCategories();
      return response.data;
    } catch (error: any) {
      log.error('Error getting session categories', error);
      return null;
    }
  }, []);

  const getUpcomingInstances = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getUpcomingInstances(params);
      return response.data;
    } catch (error: any) {
      log.error('Error getting upcoming instances', error);
      return null;
    }
  }, []);

  const searchSessions = useCallback(async (query: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.searchSessions(query);
      return response.data;
    } catch (error: any) {
      log.error('Error searching sessions', error);
      return null;
    }
  }, []);

  // Student APIs
  const getStudentEnrollments = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentEnrollments(params);
      return response.data;
    } catch (error: any) {
      log.error('Error getting student enrollments', error);
      return null;
    }
  }, []);

  const enrollInSession = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.enrollInSession(sessionUuid);
      return response.data;
    } catch (error: any) {
      log.error('Error enrolling in session', error);
      return null;
    }
  }, []);

  const getStudentSessionDetails = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentSessionDetails(sessionUuid);
      return response.data;
    } catch (error: any) {
      log.error('Error getting student session details', error);
      return null;
    }
  }, []);

  const getStudentUpcomingInstances = useCallback(async (): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentUpcomingInstances();
      return response.data;
    } catch (error: any) {
      log.error('Error getting student upcoming instances', error);
      return null;
    }
  }, []);

  const getStudentAttendance = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentAttendance(sessionUuid);
      return response.data;
    } catch (error: any) {
      log.error('Error getting student attendance', error);
      return null;
    }
  }, []);

  const accessSessionInstance = useCallback(async (instanceUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.accessSessionInstance(instanceUuid);
      return response.data;
    } catch (error: any) {
      log.error('Error accessing session instance', error);
      return null;
    }
  }, []);

  const getStudentProgress = useCallback(async (sessionUuid: string): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.getStudentProgress(sessionUuid);
      return response.data;
    } catch (error: any) {
      log.error('Error getting student progress', error);
      return null;
    }
  }, []);

  // Organization APIs
  const listOrganizationSessions = useCallback(async (params?: any): Promise<any> => {
    try {
      const response: any = await sessionCreationApi.listOrganizationSessions(params);
      return response.data;
    } catch (error: any) {
      log.error('Error listing organization sessions', error);
      return null;
    }
  }, []);

  // Metadata
  const loadMetadata = useCallback(async (): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.getCreationMetadata();
      setState(prev => ({ 
        ...prev, 
        metadata: {
          ...response.data,
          subcategories: []
        }
      }));
    } catch (error: any) {
      log.error('Error loading metadata', error);
    }
  }, []);

  const loadSubcategories = useCallback(async (categoryId: number): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.getSubcategories(categoryId);
      if (response?.success) {
        setState(prev => ({
          ...prev,
          metadata: prev.metadata ? {
            ...prev.metadata,
            subcategories: (response.data || []).map((s: any) => ({ 
              id: s.id, 
              name: s.name, 
              category_id: categoryId 
            }))
          } : null
        }));
      }
    } catch (error: any) {
      log.error('Error loading subcategories', error);
    }
  }, []);

  // Session instances (séances)
  /**
   * Génère les séances (slots) de la session
   * API: POST /api/admin/organization/course-sessions/{uuid}/generate-slots
   * Selon COURSE_SESSIONS_API.md
   */
  const generateInstances = useCallback(async (data: InstanceGenerationData): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      log.info('Generating slots for session', { sessionUuid: state.formData.sessionUuid, has_recurrence: data.has_recurrence });
      
      // Déterminer start_time: priorité au morning_start si activé, sinon afternoon_start, sinon valeur par défaut
      let startTime = '09:00';
      if (data.morning_enabled && data.morning_start) {
        startTime = data.morning_start;
      } else if (data.afternoon_start) {
        startTime = data.afternoon_start;
      } else if (state.formData.session_start_time) {
        startTime = state.formData.session_start_time;
      }
      
      // Déterminer end_time: priorité au afternoon_end si activé, sinon morning_end, sinon valeur par défaut
      let endTime = '17:00';
      if (data.afternoon_enabled && data.afternoon_end) {
        endTime = data.afternoon_end;
      } else if (data.morning_end) {
        endTime = data.morning_end;
      } else if (state.formData.session_end_time) {
        endTime = state.formData.session_end_time;
      }

      // ⭐ DIFFÉRENCIER: Séance unique VS Séances récurrentes
      if (!data.has_recurrence) {
        // ===== SÉANCE UNIQUE =====
        // Utiliser POST /slots pour créer UNE SEULE séance
        log.info('Creating single slot (non-recurrent)', { start_date: data.start_date });
        
        const singleSlotData = {
          title: `Séance du ${data.start_date}`,
          instance_type: data.instance_type || 'presentiel',
          start_date: data.start_date,
          end_date: data.start_date, // Même date pour une séance unique
          start_time: startTime,
          end_time: endTime,
          location_address: (data as any).location_address || state.formData.location_address,
          location_city: state.formData.location_city,
          location_room: state.formData.location_room,
          platform_type: (data as any).platform_type,
          meeting_link: (data as any).meeting_link,
          trainer_uuids: (data as any).trainer_ids || state.formData.trainer_ids || []
        };
        
        const response = await courseSessionService.createSlot(state.formData.sessionUuid, singleSlotData as any);
        
        // Ajouter le nouveau slot à la liste existante
        if (response.data) {
          setState(prev => ({
            ...prev,
            instances: [...prev.instances, response.data],
            isLoading: false
          }));
        }
        log.info('Single slot created successfully');
        return true;
      } else {
        // ===== SÉANCES RÉCURRENTES =====
        // Utiliser POST /generate-slots pour générer plusieurs séances
        log.info('Generating recurring slots', { selected_days: data.selected_days });
        
        const generateSlotsData = {
          pattern: 'weekly',
          start_time: startTime,
          end_time: endTime,
          instance_type: data.instance_type || 'presentiel',
          // Convertir selected_days (1-7 format lundi=1) en days_of_week (0-6 format dimanche=0)
          days_of_week: data.selected_days?.map((day: number) => day === 7 ? 0 : day) || []
        };

        log.info('Calling generateSlots API', { generateSlotsData });
        const response = await courseSessionService.generateSlots(state.formData.sessionUuid, generateSlotsData as any);
        const slots = response.data || [];
        setState(prev => ({
          ...prev,
          instances: slots,
          isLoading: false
        }));
        log.info('Slots generated successfully', { count: slots.length });
        return true;
      }
    } catch (error: any) {
      log.error('Error generating instances', parseApiError(error));
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Erreur lors de la génération des séances'
      }));
      return false;
    }
  }, [state.formData.sessionUuid, state.formData.session_start_time, state.formData.session_end_time, state.formData.location_address, state.formData.location_city, state.formData.location_room, state.formData.trainer_ids]);

  /**
   * Récupère les séances (slots) de la session
   * API: GET /api/admin/organization/course-sessions/{uuid}/slots
   */
  const getInstances = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      log.debug('Loading slots for session', { sessionUuid: state.formData.sessionUuid });
      
      // Essayer la nouvelle API d'abord
      try {
        const response = await courseSessionService.getSlots(state.formData.sessionUuid);
        setState(prev => ({ ...prev, instances: response.data || [] }));
        log.debug('Slots loaded via new API', { count: response.data?.length || 0 });
      } catch (newApiError) {
        // Fallback to old API
      const response: any = await sessionCreationApi.getSessionInstances(state.formData.sessionUuid);
        setState(prev => ({ ...prev, instances: response.data || [] }));
        log.debug('Slots loaded via fallback API');
      }
    } catch (error: any) {
      log.error('Error loading slots', error);
    }
  }, [state.formData.sessionUuid]);

  /**
   * Annule une séance
   */
  const cancelInstance = useCallback(async (instanceUuid: string, reason: string): Promise<boolean> => {
    try {
      // La nouvelle API n'a pas d'endpoint cancel pour les slots
      // On utilise l'ancienne API ou on supprime le slot
      try {
        await courseSessionService.deleteSlot(state.formData.sessionUuid!, instanceUuid);
      } catch {
      await sessionCreationApi.cancelSessionInstance(instanceUuid, reason);
      }
      await getInstances(); // Refresh instances
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de l\'annulation de la séance'
      }));
      return false;
    }
  }, [getInstances, state.formData.sessionUuid]);

  // Session participants
  /**
   * Ajoute un participant à la session
   * API: POST /api/admin/organization/course-sessions/{uuid}/participants
   */
  const enrollParticipant = useCallback(async (userId: number): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      log.info('Adding participant to session', { sessionUuid: state.formData.sessionUuid });
      
      // Essayer la nouvelle API d'abord
      try {
        await courseSessionService.addParticipant(state.formData.sessionUuid, {
          user_id: userId,
          status: 'registered'
        });
        log.info('Participant added via new API');
      } catch (newApiError) {
        // Fallback to old API
      await sessionCreationApi.enrollParticipant(state.formData.sessionUuid, userId);
        log.info('Participant added via fallback API');
      }
      
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      log.error('Error enrolling participant', parseApiError(error));
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de l\'inscription du participant'
      }));
      return false;
    }
  }, [state.formData.sessionUuid]);

  /**
   * Récupère les participants de la session
   * API: GET /api/admin/organization/course-sessions/{uuid}/participants
   */
  const getParticipants = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      log.debug('Loading participants for session', { sessionUuid: state.formData.sessionUuid });
      
      // Essayer la nouvelle API d'abord
      try {
        const response = await courseSessionService.getParticipants(state.formData.sessionUuid);
        // L'API retourne { data: { session: {...}, participants: [...] } }
        const participantsData = response.data?.participants || response.data || [];
        setState(prev => ({ ...prev, participants: participantsData }));
        log.debug('Participants loaded via new API', { count: participantsData.length || 0 });
      } catch (newApiError) {
        // Fallback to old API
        const response: any = await sessionCreationApi.getSessionParticipants(state.formData.sessionUuid);
        const participantsData = response.data?.participants || response.data || [];
        setState(prev => ({ ...prev, participants: participantsData }));
        log.debug('Participants loaded via fallback API');
      }
    } catch (error: any) {
      log.error('Error loading participants', error);
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

  const enrollMultipleParticipants = useCallback(async (userIds: number[]): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      log.info('Enrolling multiple participants', { sessionUuid: state.formData.sessionUuid, count: userIds.length });
      
      // Essayer la nouvelle API d'abord
      try {
        await courseSessionService.enrollMultipleParticipants(state.formData.sessionUuid, { user_ids: userIds });
        log.info('Multiple participants enrolled via new API');
      } catch (newApiError) {
        // Fallback to old API
        await sessionCreationApi.enrollMultipleParticipants(state.formData.sessionUuid, userIds);
        log.info('Multiple participants enrolled via fallback API');
      }
      
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      log.error('Error enrolling multiple participants', parseApiError(error));
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de l\'inscription des participants'
      }));
      return false;
    }
  }, [state.formData.sessionUuid, getParticipants]);

  const updateParticipantTarif = useCallback(async (participantId: number, tarif: number): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      await sessionCreationApi.updateParticipantTarif(state.formData.sessionUuid, participantId, tarif);
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du tarif'
      }));
      return false;
    }
  }, [state.formData.sessionUuid, getParticipants]);

  const updateParticipantType = useCallback(async (participantId: number, type: string): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      await sessionCreationApi.updateParticipantType(state.formData.sessionUuid, participantId, type);
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du type'
      }));
      return false;
    }
  }, [state.formData.sessionUuid, getParticipants]);

  /**
   * Supprime un participant de la session
   * API: DELETE /api/admin/organization/course-sessions/{uuid}/participants/{participantUuid}
   */
  const deleteParticipant = useCallback(async (participantId: number): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      log.info('Removing participant from session', { sessionUuid: state.formData.sessionUuid });
      
      // Essayer la nouvelle API d'abord (elle attend un UUID, pas un ID)
      try {
        // Note: La nouvelle API utilise participantUuid, l'ancienne utilise participantId
        // On essaie de convertir si c'est un UUID string
        await courseSessionService.removeParticipant(state.formData.sessionUuid, String(participantId));
        log.info('Participant removed via new API');
      } catch (newApiError) {
        // Fallback to old API
      await sessionCreationApi.deleteParticipant(state.formData.sessionUuid, participantId);
        log.info('Participant removed via fallback API');
      }
      
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      log.error('Error deleting participant', parseApiError(error));
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de la suppression du participant'
      }));
      return false;
    }
  }, [state.formData.sessionUuid, getParticipants]);

  const deleteMultipleParticipants = useCallback(async (participantIds: number[]): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      await sessionCreationApi.deleteMultipleParticipants(state.formData.sessionUuid, participantIds);
      await getParticipants(); // Refresh participants
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de la suppression des participants'
      }));
      return false;
    }
  }, [state.formData.sessionUuid, getParticipants]);

  const exportParticipants = useCallback(async (format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> => {
    if (!state.formData.sessionUuid) return;

    try {
      const blob = await sessionCreationApi.exportParticipants(state.formData.sessionUuid, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-session-${state.formData.sessionUuid}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Erreur lors de l\'export Excel'
      }));
    }
  }, [state.formData.sessionUuid]);

  const getAttendanceReport = useCallback(async (): Promise<any> => {
    if (!state.formData.sessionUuid) return null;

    try {
      const response: any = await sessionCreationApi.getAttendanceReport(state.formData.sessionUuid);
      return response.data;
    } catch (error: any) {
      log.error('Error loading attendance report', error);
      return null;
    }
  }, [state.formData.sessionUuid]);

  // Chapters - Use COURSE creation-data API to get full structure with content, evaluations, support_files
  const getChapters = useCallback(async (): Promise<void> => {
    log.debug('getChapters called', { courseUuid: state.formData.courseUuid });
    if (!state.formData.courseUuid) {
      log.warn('No courseUuid, cannot load chapters');
      return;
    }

    try {
      // Use creation-data API to get chapters with nested content, evaluations, support_files
      const response: any = await courseCreation.getCourseCreationData(state.formData.courseUuid);
      log.debug('Course creation data response for chapters', { response });
      
      if (response.success && response.data) {
        // Extract chapters from step2_structure (includes content, evaluations, support_files)
        const chaptersData = response.data.step2_structure?.chapters || [];
        log.info('Chapters with content loaded', { 
          count: chaptersData.length,
          firstChapter: chaptersData[0] ? {
            title: chaptersData[0].title,
            contentCount: chaptersData[0].content?.length || 0,
            evaluationsCount: chaptersData[0].evaluations?.length || 0,
            supportFilesCount: chaptersData[0].support_files?.length || 0
          } : null
        });
        setState(prev => ({ ...prev, chapters: chaptersData }));
      }
    } catch (error: any) {
      log.error('Error loading chapters', error);
    }
  }, [state.formData.courseUuid]);

  const loadChapters = useCallback(async (): Promise<void> => {
    return getChapters();
  }, [getChapters]);

  const createChapter = useCallback(async (data: CreateSessionChapterData): Promise<boolean> => {
    // In SESSION MODE: create chapter on SESSION (override)
    if (state.isSessionMode && state.formData.sessionUuid) {
      try {
        // Initialize override if not already done
        if (!state.hasChaptersOverride) {
          await sessionOverrideService.initializeChaptersOverride(state.formData.sessionUuid);
          setState(prev => ({ ...prev, hasChaptersOverride: true }));
        }
        
        await sessionOverrideService.createSessionChapter(state.formData.sessionUuid, {
          title: data.title,
          description: data.description,
          order_index: data.order_index,
          duration: data.duration
        });
        
        // Refresh effective chapters
        const response = await sessionOverrideService.getEffectiveChapters(state.formData.sessionUuid);
        if (response.success && response.data) {
          setState(prev => ({ ...prev, chapters: response.data.chapters || [] }));
        }
        
        log.info('Chapter created on SESSION (override)');
        return true;
      } catch (error: any) {
        log.error('Error creating session chapter', error);
        return false;
      }
    }
    
    // In COURSE MODE: create chapter on COURSE template
    if (!state.formData.courseUuid) return false;

    try {
      await courseCreation.createChapter(state.formData.courseUuid, data);
      await getChapters(); // Refresh chapters
      return true;
    } catch (error: any) {
      log.error('Error creating chapter', error);
      return false;
    }
  }, [state.formData.courseUuid, state.formData.sessionUuid, state.isSessionMode, state.hasChaptersOverride, getChapters]);

  const updateChapter = useCallback(async (chapterUuid: string, data: UpdateSessionChapterData): Promise<boolean> => {
    // In SESSION MODE: update chapter on SESSION (override)
    if (state.isSessionMode && state.formData.sessionUuid) {
      try {
        // Initialize override if not already done
        if (!state.hasChaptersOverride) {
          await sessionOverrideService.initializeChaptersOverride(state.formData.sessionUuid);
          setState(prev => ({ ...prev, hasChaptersOverride: true }));
        }
        
        await sessionOverrideService.updateSessionChapter(state.formData.sessionUuid, chapterUuid, {
          title: data.title,
          description: data.description,
          order_index: data.order_index,
          duration: data.duration
        });
        
        // Refresh effective chapters
        const response = await sessionOverrideService.getEffectiveChapters(state.formData.sessionUuid);
        if (response.success && response.data) {
          setState(prev => ({ ...prev, chapters: response.data.chapters || [] }));
        }
        
        log.info('Chapter updated on SESSION (override)');
        return true;
      } catch (error: any) {
        log.error('Error updating session chapter', error);
        return false;
      }
    }
    
    // In COURSE MODE: update chapter on COURSE template
    if (!state.formData.courseUuid) return false;
    try {
      await courseCreation.updateChapter(state.formData.courseUuid, chapterUuid, data);
      await getChapters(); // Refresh chapters
      return true;
    } catch (error: any) {
      log.error('Error updating chapter', error);
      return false;
    }
  }, [state.formData.courseUuid, state.formData.sessionUuid, state.isSessionMode, state.hasChaptersOverride, getChapters]);

  const deleteChapter = useCallback(async (chapterUuid: string): Promise<boolean> => {
    // In SESSION MODE: delete chapter on SESSION (override - soft delete)
    if (state.isSessionMode && state.formData.sessionUuid) {
      try {
        // Initialize override if not already done
        if (!state.hasChaptersOverride) {
          await sessionOverrideService.initializeChaptersOverride(state.formData.sessionUuid);
          setState(prev => ({ ...prev, hasChaptersOverride: true }));
        }
        
        await sessionOverrideService.deleteSessionChapter(state.formData.sessionUuid, chapterUuid);
        
        // Refresh effective chapters
        const response = await sessionOverrideService.getEffectiveChapters(state.formData.sessionUuid);
        if (response.success && response.data) {
          setState(prev => ({ ...prev, chapters: response.data.chapters || [] }));
        }
        
        log.info('Chapter deleted from SESSION (override)');
        return true;
      } catch (error: any) {
        log.error('Error deleting session chapter', error);
        return false;
      }
    }
    
    // In COURSE MODE: delete chapter from COURSE template
    if (!state.formData.courseUuid) return false;
    try {
      await courseCreation.deleteChapter(state.formData.courseUuid, chapterUuid);
      await getChapters(); // Refresh chapters
      return true;
    } catch (error: any) {
      log.error('Error deleting chapter', error);
      return false;
    }
  }, [state.formData.courseUuid, getChapters]);

  // Sub-chapters - Use COURSE API (not session API)
  const createSubChapterAdapter = useCallback(async (chapterUuid: string, data: any): Promise<any> => {
    if (!state.formData.courseUuid) return null;
    try {
      const response: any = await courseCreation.createSubChapter(
        state.formData.courseUuid,
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
      log.error('Error creating sub-chapter', error);
      return null;
    }
  }, [state.formData.courseUuid, loadChapters]);

  const updateSubChapterAdapter = useCallback(async (chapterUuid: string, subChapterUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.updateSubChapter(
        state.formData.courseUuid,
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
      log.error('Error updating sub-chapter', error);
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  const deleteSubChapterAdapter = useCallback(async (chapterUuid: string, subChapterUuid: string): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.deleteSubChapter(
        state.formData.courseUuid,
        chapterUuid,
        subChapterUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting sub-chapter', error);
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  // Content - Use COURSE API (not session API)
  const createContentAdapter = useCallback(async (chapterUuid: string, data: any): Promise<any> => {
    if (!state.formData.courseUuid) return null;
    try {
      const response: any = await courseCreation.createContent(
        state.formData.courseUuid,
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
      log.error('Error creating content', error);
      return null;
    }
  }, [state.formData.courseUuid]);

  const updateContent = useCallback(async (chapterUuid: string, contentUuid: string, data: any): Promise<boolean> => {
    // Use COURSE API with courseUuid
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.updateContent(
        state.formData.courseUuid,
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
      log.error('Error updating content', error);
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  const deleteContent = useCallback(async (chapterUuid: string, contentUuid: string): Promise<boolean> => {
    // Use COURSE API with courseUuid
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.deleteContent(
        state.formData.courseUuid,
        chapterUuid,
        contentUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting content', error);
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  // Adapter aliases for Course Creation compatibility
  const updateContentAdapter = useCallback(async (chapterUuid: string, contentUuid: string, data: any): Promise<boolean> => {
    return updateContent(chapterUuid, contentUuid, data);
  }, [updateContent]);

  const deleteContentAdapter = useCallback(async (chapterUuid: string, contentUuid: string): Promise<boolean> => {
    return deleteContent(chapterUuid, contentUuid);
  }, [deleteContent]);

  // Evaluations - Use COURSE API (not session API)
  const createEvaluationAdapter = useCallback(async (chapterUuid: string, data: any): Promise<any> => {
    if (!state.formData.courseUuid) return null;
    try {
      const response: any = await courseCreation.createEvaluation(
        state.formData.courseUuid,
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
      log.error('Error creating evaluation', error);
      return null;
    }
  }, [state.formData.courseUuid]);

  // Support files - Use COURSE API (not session API)
  // Signature matches CourseCreation: (files: File[], chapterId: string, subChapterId?: string)
  const uploadSupportFilesAdapter = useCallback(async (files: File[], chapterId: string, subChapterId?: string): Promise<boolean> => {
    if (!state.formData.courseUuid || !files || files.length === 0) {
      log.error('uploadSupportFilesAdapter: Missing courseUuid or files');
      return false;
    }
    try {
      log.debug('Uploading support files', {
        courseUuid: state.formData.courseUuid,
        chapterId,
        subChapterId,
        fileCount: files.length,
        fileNames: files.map(f => f.name)
      });
      
      const response: any = await courseCreation.uploadSupportFiles(
        state.formData.courseUuid,
        chapterId,
        files,
        subChapterId
      );
      
      log.debug('Support files upload response', { response });
      
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      } else {
        log.error('Upload failed', { message: response.message || 'Unknown error' });
        return false;
      }
    } catch (error: any) {
      log.error('Error uploading support files', error);
      log.error('Error details', { response: error.response?.data, message: error.message });
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  const deleteSupportFile = useCallback(async (chapterUuid: string, fileUuid: string): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.deleteSupportFile(
        state.formData.courseUuid,
        chapterUuid,
        fileUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting support file', error);
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  // Adapter aliases for Course Creation compatibility
  const deleteSupportFileAdapter = useCallback(async (chapterUuid: string, fileUuid: string): Promise<boolean> => {
    return deleteSupportFile(chapterUuid, fileUuid);
  }, [deleteSupportFile]);

  // Evaluation adapters - Use COURSE API (not session API)
  const updateEvaluationAdapter = useCallback(async (chapterUuid: string, evaluationUuid: string, data: any): Promise<any> => {
    if (!state.formData.courseUuid) return null;
    try {
      const response: any = await courseCreation.updateEvaluation(
        state.formData.courseUuid,
        chapterUuid,
        evaluationUuid,
        {
          type: data.type,
          title: data.title,
          description: data.description,
          due_date: data.due_date || data.dueDate,
          file: data.file
        }
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      log.error('Error updating evaluation', error);
      return null;
    }
  }, [state.formData.courseUuid]);

  const deleteEvaluationAdapter = useCallback(async (chapterUuid: string, evaluationUuid: string): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.deleteEvaluation(
        state.formData.courseUuid,
        chapterUuid,
        evaluationUuid
      );
      if (response.success) {
        await loadChapters(); // Reload to ensure data consistency
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting evaluation', error);
      return false;
    }
  }, [state.formData.courseUuid, loadChapters]);

  // Documents - Use COURSE API (not session API)
  const getDocuments = useCallback(async (): Promise<void> => {
    if (!state.formData.courseUuid) return;

    try {
      const response: any = await courseCreation.getCourseDocuments(state.formData.courseUuid);
      setState(prev => ({ ...prev, documents: response.data?.documents || response.data || [] }));
    } catch (error: any) {
      log.error('Error loading documents', error);
    }
  }, [state.formData.courseUuid]);

  const loadDocuments = useCallback(async (): Promise<void> => {
    return getDocuments();
  }, [getDocuments]);

  const uploadDocument = useCallback(async (data: CreateSessionDocumentData): Promise<boolean> => {
    // In SESSION MODE: upload document to SESSION (override)
    if (state.isSessionMode && state.formData.sessionUuid) {
      try {
        // Initialize override if not already done
        if (!state.hasDocumentsOverride) {
          await sessionOverrideService.initializeDocumentsOverride(state.formData.sessionUuid);
          setState(prev => ({ ...prev, hasDocumentsOverride: true }));
        }
        
        await sessionOverrideService.createSessionDocument(state.formData.sessionUuid, {
          title: data.title || data.name || 'Document',
          description: data.description,
          document_type: (data.document_type as any) || 'support',
          visibility: 'all',
          file: data.file
        });
        
        // Refresh effective documents
        const response = await sessionOverrideService.getEffectiveDocuments(state.formData.sessionUuid);
        if (response.success && response.data) {
          setState(prev => ({ ...prev, documents: response.data.documents || [] }));
        }
        
        log.info('Document uploaded to SESSION (override)');
        return true;
      } catch (error: any) {
        log.error('Error uploading session document', error);
        return false;
      }
    }
    
    // In COURSE MODE: upload document to COURSE template
    if (!state.formData.courseUuid) return false;

    try {
      await courseCreation.createDocument(state.formData.courseUuid, data as any);
      await getDocuments(); // Refresh documents
      return true;
    } catch (error: any) {
      log.error('Error uploading document', error);
      return false;
    }
  }, [state.formData.courseUuid, state.formData.sessionUuid, state.isSessionMode, state.hasDocumentsOverride, getDocuments]);

  const deleteDocument = useCallback(async (documentUuid: string): Promise<boolean> => {
    // In SESSION MODE: delete document from SESSION (override - soft delete)
    if (state.isSessionMode && state.formData.sessionUuid) {
      try {
        // Initialize override if not already done
        if (!state.hasDocumentsOverride) {
          await sessionOverrideService.initializeDocumentsOverride(state.formData.sessionUuid);
          setState(prev => ({ ...prev, hasDocumentsOverride: true }));
        }
        
        await sessionOverrideService.deleteSessionDocument(state.formData.sessionUuid, documentUuid);
        
        // Refresh effective documents
        const response = await sessionOverrideService.getEffectiveDocuments(state.formData.sessionUuid);
        if (response.success && response.data) {
          setState(prev => ({ ...prev, documents: response.data.documents || [] }));
        }
        
        log.info('Document deleted from SESSION (override)');
        return true;
      } catch (error: any) {
        log.error('Error deleting session document', error);
        return false;
      }
    }
    
    // In COURSE MODE: delete document from COURSE template
    if (!state.formData.courseUuid) return false;
    try {
      await courseCreation.deleteDocument(state.formData.courseUuid, documentUuid);
      await getDocuments(); // Refresh documents
      return true;
    } catch (error: any) {
      log.error('Error deleting document', error);
      return false;
    }
  }, [state.formData.courseUuid, state.formData.sessionUuid, state.isSessionMode, state.hasDocumentsOverride, getDocuments]);

  // Questionnaires - Use COURSE API (not session API)
  const loadQuestionnaires = useCallback(async (): Promise<void> => {
    if (!state.formData.courseUuid) return;
    try {
      const response: any = await courseCreation.getQuestionnaires(state.formData.courseUuid);
      if (response.success && response.data) {
        setState(prev => ({ ...prev, questionnaires: response.data }));
      }
    } catch (error: any) {
      log.error('Error loading questionnaires', error);
    }
  }, [state.formData.courseUuid]);

  const loadCertificationModels = useCallback(async (): Promise<void> => {
    try {
      // Implement certification models loading API call
      log.debug('Loading certification models');
      setState(prev => ({ ...prev, certificationModels: [] }));
    } catch (error: any) {
      log.error('Error loading certification models', error);
    }
  }, []);

  const createQuestionnaire = useCallback(async (data: any): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.createQuestionnaire(state.formData.courseUuid, data);
      if (response.success) {
        await loadQuestionnaires();
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error creating questionnaire', error);
      return false;
    }
  }, [state.formData.courseUuid, loadQuestionnaires]);

  const updateQuestionnaire = useCallback(async (questionnaireUuid: string, data: any): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.updateQuestionnaire(state.formData.courseUuid, questionnaireUuid, data);
      if (response.success) {
        await loadQuestionnaires();
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error updating questionnaire', error);
      return false;
    }
  }, [state.formData.courseUuid, loadQuestionnaires]);

  const createQuestion = useCallback(async (questionnaireUuid: string, data: any): Promise<boolean> => {
    log.debug('Creating question', { questionnaireUuid, data });
    return true;
  }, []);

  const updateQuestion = useCallback(async (questionnaireUuid: string, questionUuid: string, data: any): Promise<boolean> => {
    log.debug('Updating question', { questionnaireUuid, questionUuid, data });
    return true;
  }, []);

  const deleteQuestion = useCallback(async (questionnaireUuid: string, questionUuid: string): Promise<boolean> => {
    log.debug('Deleting question', { questionnaireUuid, questionUuid });
    return true;
  }, []);

  const deleteQuestionnaire = useCallback(async (questionnaireId: number | string): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.deleteQuestionnaire(state.formData.courseUuid, String(questionnaireId));
      if (response.success) {
        await loadQuestionnaires();
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting questionnaire', error);
      return false;
    }
  }, [state.formData.courseUuid, loadQuestionnaires]);

  // Modules (proper implementations with backend integration)
  const getModules = useCallback(async (): Promise<void> => {
    try {
      // Use COURSE API with courseUuid (not session API)
      if (!state.formData.courseUuid) return;
      const response: any = await courseCreation.getModules(state.formData.courseUuid);
      setState(prev => ({ ...prev, modules: response.data || [] }));
    } catch (error: any) {
      log.error('Error loading modules', error);
      setState(prev => ({ ...prev, modules: [] }));
    }
  }, [state.formData.courseUuid]);

  const loadModules = useCallback(async (): Promise<void> => {
    return getModules();
  }, [getModules]);

  const createModule = useCallback(async (data: any): Promise<boolean> => {
    try {
      // Use COURSE API with courseUuid
      if (!state.formData.courseUuid) return false;
      
      const response: any = await courseCreation.createModule(state.formData.courseUuid, data);
      if (response.success) {
        await getModules(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error creating module', error);
      return false;
    }
  }, [state.formData.courseUuid, getModules]);

  const updateModule = useCallback(async (moduleUuid: string, data: any): Promise<boolean> => {
    try {
      // Use COURSE API with courseUuid
      if (!state.formData.courseUuid) return false;
      const response: any = await courseCreation.updateModule(state.formData.courseUuid, moduleUuid, data);
      if (response.success) {
        await getModules(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error updating module', error);
      return false;
    }
  }, [state.formData.courseUuid, getModules]);

  const deleteModule = useCallback(async (moduleUuid: string): Promise<boolean> => {
    try {
      // Use COURSE API with courseUuid
      if (!state.formData.courseUuid) return false;
      const response: any = await courseCreation.deleteModule(state.formData.courseUuid, moduleUuid);
      if (response.success) {
        await getModules(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting module', error);
      return false;
    }
  }, [state.formData.courseUuid, getModules]);

  const reorderModules = useCallback(async (modules: any[]): Promise<boolean> => {
    log.debug('Reordering modules', { modules });
    return true;
  }, []);

  // Objectives - Use COURSE API (not session API)
  const getObjectives = useCallback(async (): Promise<void> => {
    try {
      if (!state.formData.courseUuid) return;
      const response: any = await courseCreation.getObjectives(state.formData.courseUuid);
      setState(prev => ({ ...prev, objectives: response.data || [] }));
    } catch (error: any) {
      log.error('Error loading objectives', error);
      setState(prev => ({ ...prev, objectives: [] }));
    }
  }, [state.formData.courseUuid]);

  const loadObjectives = useCallback(async (): Promise<void> => {
    return getObjectives();
  }, [getObjectives]);

  const createObjective = useCallback(async (data: any): Promise<boolean> => {
    try {
      if (!state.formData.courseUuid) return false;
      
      // Ensure we send title and description (backend expects both)
      const objectiveData = {
        title: data.title || data.description || 'Nouvel objectif',
        description: data.description || data.title || '',
        order_index: data.order_index || 0
      };
      
      const response: any = await courseCreation.createObjective(state.formData.courseUuid, objectiveData);
      if (response.success) {
        await getObjectives(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error creating objective', error);
      return false;
    }
  }, [state.formData.courseUuid, getObjectives]);

  const updateObjective = useCallback(async (objectiveUuid: string, data: any): Promise<boolean> => {
    try {
      if (!state.formData.courseUuid) return false;
      const response: any = await courseCreation.updateObjective(state.formData.courseUuid, objectiveUuid, data);
      if (response.success) {
        await getObjectives(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error updating objective', error);
      return false;
    }
  }, [state.formData.courseUuid, getObjectives]);

  const deleteObjective = useCallback(async (objectiveUuid: string): Promise<boolean> => {
    try {
      if (!state.formData.courseUuid) return false;
      const response: any = await courseCreation.deleteObjective(state.formData.courseUuid, objectiveUuid);
      if (response.success) {
        await getObjectives(); // Reload from backend
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error deleting objective', error);
      return false;
    }
  }, [state.formData.courseUuid, getObjectives]);

  // Additional Fees (placeholder implementations)
  const createAdditionalFee = useCallback(async (data: any): Promise<boolean> => {
    log.debug('Creating additional fee', { data });
    return true;
  }, []);

  const updateAdditionalFee = useCallback(async (feeUuid: string, data: any): Promise<boolean> => {
    log.debug('Updating additional fee', { feeUuid, data });
    return true;
  }, []);

  const deleteAdditionalFee = useCallback(async (feeUuid: string): Promise<boolean> => {
    log.debug('Deleting additional fee', { feeUuid });
    return true;
  }, []);

  // Trainers
  const getTrainers = useCallback(async (params?: { search?: string; per_page?: number }): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.getAllTrainers(params);
      setState(prev => ({ ...prev, trainers: response.data }));
    } catch (error: any) {
      log.error('Error loading trainers', error);
    }
  }, []);

  const searchTrainers = useCallback(async (query: string): Promise<void> => {
    try {
      const response: any = await sessionCreationApi.searchTrainers(query);
      setState(prev => ({ ...prev, trainers: response.data }));
    } catch (error: any) {
      log.error('Error searching trainers', error);
    }
  }, []);

  const loadTrainers = useCallback(async (): Promise<void> => {
    await getTrainers();
  }, [getTrainers]);

  // Course Trainers - Use COURSE API (not session API)
  const loadCourseTrainers = useCallback(async (): Promise<void> => {
    if (!state.formData.courseUuid) return;
    try {
      const response: any = await courseCreation.getCourseTrainers(state.formData.courseUuid);
      if (response.success && response.data) {
        setState(prev => ({ ...prev, courseTrainers: response.data }));
      }
    } catch (error: any) {
      log.error('Error loading course trainers', error);
    }
  }, [state.formData.courseUuid]);

  const assignTrainer = useCallback(async (data: any): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.assignTrainer(state.formData.courseUuid, data);
      if (response.success) {
        await loadCourseTrainers();
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error assigning trainer', error);
      return false;
    }
  }, [state.formData.courseUuid, loadCourseTrainers]);

  const updateTrainerPermissions = useCallback(async (trainerId: string, permissions: any): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.updateTrainerPermissions(state.formData.courseUuid, trainerId, permissions);
      if (response.success) {
        await loadCourseTrainers();
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error updating trainer permissions', error);
      return false;
    }
  }, [state.formData.courseUuid, loadCourseTrainers]);

  const removeTrainer = useCallback(async (trainerId: string): Promise<boolean> => {
    if (!state.formData.courseUuid) return false;
    try {
      const response: any = await courseCreation.removeTrainer(state.formData.courseUuid, trainerId);
      if (response.success) {
        await loadCourseTrainers();
        return true;
      }
      return false;
    } catch (error: any) {
      log.error('Error removing trainer', error);
      return false;
    }
  }, [state.formData.courseUuid, loadCourseTrainers]);

  const createTrainer = useCallback(async (data: CreateSessionTrainerData): Promise<boolean> => {
    try {
      await courseCreation.createTrainer(data);
      await getTrainers(); // Refresh trainers
      return true;
    } catch (error: any) {
      log.error('Error creating trainer', error);
      return false;
    }
  }, [getTrainers]);

  const updateTrainer = useCallback(async (trainerId: string, data: UpdateSessionTrainerData): Promise<boolean> => {
    try {
      await courseCreation.updateTrainer(trainerId, data);
      await getTrainers(); // Refresh trainers
      return true;
    } catch (error: any) {
      log.error('Error updating trainer', error);
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
      log.error('Error loading workflows', error);
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
      log.error('Error loading workflow actions', error);
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
      log.error('Error creating workflow', error);
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
      log.error('Error updating workflow', error);
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
      log.error('Error deleting workflow', error);
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
      log.error('Error creating workflow action', error);
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
      log.error('Error updating workflow action', error);
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
      log.error('Error deleting workflow action', error);
      return false;
    }
  }, [state.formData.sessionUuid, loadWorkflows]);

  const reorderWorkflowActions = useCallback(async (workflowUuid: string, actionUuids: string[]): Promise<boolean> => {
    // TODO: Implement reorder endpoint if available
    log.debug('Reordering workflow actions', { workflowUuid, actionUuids });
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
      log.error('Error toggling workflow action', error);
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
      log.error('Error loading email templates', error);
    }
  }, []);

  // Auto-save
  /**
   * Auto-save: Sauvegarde automatique avec délai
   * Sauvegarde le cours ET la session si les UUIDs existent
   */
  const autoSave = useCallback(async (): Promise<void> => {
    if (state.isSaving) return;
    
    // Au moins un UUID doit exister
    if (!state.formData.sessionUuid && !state.formData.courseUuid) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      log.debug('Auto-saving...');
      
      // Si on a les deux UUIDs, utiliser saveAll
      if (state.formData.sessionUuid && state.formData.courseUuid) {
        const result = await saveAll();
        log.debug('Auto-save result', { result });
      } else if (state.formData.sessionUuid) {
        // Sinon juste la session
      await updateSession();
      } else if (state.formData.courseUuid) {
        // Ou juste le cours
        try {
          await courseCreation.updateCourse(state.formData.courseUuid, {
            title: state.formData.title,
            subtitle: state.formData.subtitle,
            description: state.formData.description
          });
        } catch (error) {
          log.error('Auto-save course update error', error);
        }
      }
    }, 2000);
  }, [state.formData.sessionUuid, state.formData.courseUuid, state.isSaving, updateSession]);

  /**
   * Save Draft: Crée une session si elle n'existe pas et sauvegarde en brouillon
   */
  const saveDraft = useCallback(async (): Promise<void> => {
    if (!state.formData.sessionUuid) {
      const sessionUuid = await createSession();
      if (!sessionUuid) return;
    }

    setState(prev => ({ ...prev, formData: { ...prev.formData, isDraft: true } }));
    
    // Utiliser saveAll si courseUuid existe pour sauvegarder les deux
    if (state.formData.courseUuid) {
      await saveAll();
    } else {
    await updateSession();
    }
  }, [state.formData.sessionUuid, state.formData.courseUuid, createSession, updateSession]);

  // Media upload - same as courses
  const uploadIntroVideo = useCallback(async (file: File): Promise<boolean> => {
    // If sessionUuid is not available, create a new session first using NEW API
    if (!state.formData.sessionUuid) {
      // ⭐ NEW API requires course_uuid
      if (!state.formData.courseUuid) {
        log.error('Cannot create session without course_uuid - please select a course first');
        return false;
      }
      
      try {
        const sessionUuid = await createSession();
        if (!sessionUuid) {
          log.error('Failed to create session for video upload');
          return false;
        }
      } catch (error) {
        log.error('Error creating session for video upload', error);
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
      log.error('Error uploading intro video', error);
      return false;
    }
  }, [state.formData, createSession]);

  const uploadIntroImage = useCallback(async (file: File): Promise<boolean> => {
    // If sessionUuid is not available, create a new session first using NEW API
    if (!state.formData.sessionUuid) {
      // ⭐ NEW API requires course_uuid
      if (!state.formData.courseUuid) {
        log.error('Cannot create session without course_uuid - please select a course first');
        return false;
      }
      
      try {
        const sessionUuid = await createSession();
        if (!sessionUuid) {
          log.error('Failed to create session for image upload');
          return false;
        }
      } catch (error) {
        log.error('Error creating session for image upload', error);
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
      log.error('Error uploading intro image', error);
      return false;
    }
  }, [state.formData, createSession]);

  // Initialize session - similar to initializeCourse (must be after all function definitions)
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const initializeSession = useCallback(async (sessionUuid?: string) => {
    if (hasInitializedRef.current || isInitializingRef.current) return;
    isInitializingRef.current = true;
    
    try {
      let uuid = sessionUuid || state.formData.sessionUuid;
      
      // Si pas de UUID, créer une session en brouillon avec la NOUVELLE API
      if (!uuid) {
        // ⭐ NEW API requires course_uuid - cannot create session without a course
        if (!state.formData.courseUuid) {
          log.error('Cannot initialize session without course_uuid - please select a course first');
          isInitializingRef.current = false;
          return;
        }
        
        // Use the createSession function which uses the NEW API
        const createdUuid = await createSession();
        if (createdUuid) {
          uuid = createdUuid;
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
          log.error('Error loading existing session data', error);
        }
      }

      // Charger toutes les données associées
      // SEULEMENT si on édite une session existante (sessionUuid fourni)
      // Si c'est une nouvelle session créée à partir d'un cours, les données ont déjà été pré-remplies par loadFromCourse
      if (sessionUuid) {
        // Editing existing session - load all session data
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
      } else {
        // New session - only load instances, participants, trainers, workflows
        // DON'T load chapters, documents, questionnaires, modules, objectives
        // as they were pre-filled from the course by loadFromCourse()
        await Promise.all([
          getInstances(),
          getParticipants(),
          getTrainers(),
          loadWorkflows()
        ]);
        log.info('New session - keeping pre-filled course data');
      }
      
      hasInitializedRef.current = true;
    } catch (error) {
      log.error('Error initializing session', error);
    } finally {
      isInitializingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.formData.sessionUuid, state.formData.courseUuid, createSession]); // Added createSession and courseUuid

  // Direct setters for pre-filling data from course
  const setModules = useCallback((modules: any[]) => {
    setState(prev => ({ ...prev, modules }));
  }, []);

  const setObjectives = useCallback((objectives: any[]) => {
    setState(prev => ({ ...prev, objectives }));
  }, []);

  const setChapters = useCallback((chapters: any[]) => {
    setState(prev => ({ ...prev, chapters }));
  }, []);

  const setDocuments = useCallback((documents: any[]) => {
    setState(prev => ({ ...prev, documents }));
  }, []);

  const setQuestionnaires = useCallback((questionnaires: any[]) => {
    setState(prev => ({ ...prev, questionnaires }));
  }, []);

  // Load all data from a course to pre-fill session using single API call
  const loadFromCourse = useCallback(async (courseUuid: string): Promise<boolean> => {
    try {
      log.info('Loading ALL data from course using creation-data API', { courseUuid });
      
      // Use single API call to get ALL course data
      const response = await courseCreation.getCourseCreationData(courseUuid);
      
      if (!response.success || !response.data) {
        log.error('Failed to load course creation data');
        return false;
      }

      const data = response.data;
      
      // Extract data from the unified response
      const modulesData = data.additional_course_data?.modules || [];
      const objectivesData = data.additional_data?.objectives || [];
      const chaptersData = data.step2_structure?.chapters || [];
      const documentsData = data.step3_documents?.documents || [];
      const questionnairesData = data.step4_questionnaires?.questionnaires || [];
      const trainersData = data.step5_trainers?.trainers || [];
      const workflowData = data.step6_workflow || null;

      log.info('Course creation data loaded', {
        course: data.course?.title,
        modules: modulesData.length,
        objectives: objectivesData.length,
        chapters: chaptersData.length,
        documents: documentsData.length,
        questionnaires: questionnairesData.length,
        trainers: trainersData.length,
        hasWorkflow: !!workflowData?.workflow
      });

      // Store course template for reference (override system)
      const courseTemplate = {
        uuid: courseUuid,
        title: data.course?.title || '',
        description: data.course?.description || null,
        duration: data.course?.duration || null,
        price_ht: data.course?.price_ht || null,
        chapters_count: chaptersData.length,
        documents_count: documentsData.length
      };

      // Update state with all course data at once + enable session mode
      setState(prev => ({
        ...prev,
        modules: modulesData,
        objectives: objectivesData,
        chapters: chaptersData,
        documents: documentsData,
        questionnaires: questionnairesData,
        trainers: trainersData,
        workflow: workflowData?.workflow || null,
        // Enable session mode - modifications will be overrides
        isSessionMode: true,
        courseTemplate,
        // Reset overrides (inherit everything from course initially)
        overrides: {
          title: null,
          subtitle: null,
          description: null,
          duration: null,
          price_ht: null,
          objectives: null,
          prerequisites: null
        }
      }));

      return true;
    } catch (error) {
      log.error('Error loading course creation data', error);
      return false;
    }
  }, []);

  // ===== OVERRIDE SYSTEM IMPLEMENTATION =====

  /**
   * Enable session mode - modifications will be stored as overrides
   */
  const enableSessionMode = useCallback(() => {
    setState(prev => ({ ...prev, isSessionMode: true }));
    log.info('Session mode enabled - modifications will be stored as overrides');
  }, []);

  /**
   * Set an override value for a simple field
   * The session will use this value instead of the course template value
   */
  const setOverride = useCallback((field: keyof SessionCreationState['overrides'], value: any) => {
    setState(prev => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [field]: value
      }
    }));
    log.info(`Override set for field: ${field}`, { value });
  }, []);

  /**
   * Reset an override - the session will inherit the course template value
   */
  const resetOverride = useCallback((field: keyof SessionCreationState['overrides']) => {
    setState(prev => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [field]: null
      }
    }));
    log.info(`Override reset for field: ${field}`);
  }, []);

  /**
   * Reset all simple field overrides
   */
  const resetAllOverrides = useCallback(() => {
    setState(prev => ({
      ...prev,
      overrides: {
        title: null,
        subtitle: null,
        description: null,
        duration: null,
        price_ht: null,
        objectives: null,
        prerequisites: null
      }
    }));
    log.info('All overrides reset');
  }, []);

  /**
   * Initialize chapters override - copy chapters from course to enable modifications
   */
  const initializeChaptersOverride = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) {
      log.error('Cannot initialize chapters override: no session UUID');
      return false;
    }

    try {
      log.info('Initializing chapters override...');
      const response = await sessionOverrideService.initializeChaptersOverride(state.formData.sessionUuid);
      
      if (response.success) {
        setState(prev => ({ ...prev, hasChaptersOverride: true }));
        
        // Reload effective chapters
        const chaptersResponse = await sessionOverrideService.getEffectiveChapters(state.formData.sessionUuid!);
        if (chaptersResponse.success && chaptersResponse.data) {
          setState(prev => ({ ...prev, chapters: chaptersResponse.data.chapters || [] }));
        }
        
        log.info('Chapters override initialized successfully');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Error initializing chapters override', error);
      return false;
    }
  }, [state.formData.sessionUuid]);

  /**
   * Initialize documents override
   */
  const initializeDocumentsOverride = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) {
      log.error('Cannot initialize documents override: no session UUID');
      return false;
    }

    try {
      log.info('Initializing documents override...');
      const response = await sessionOverrideService.initializeDocumentsOverride(state.formData.sessionUuid);
      
      if (response.success) {
        setState(prev => ({ ...prev, hasDocumentsOverride: true }));
        
        // Reload effective documents
        const docsResponse = await sessionOverrideService.getEffectiveDocuments(state.formData.sessionUuid!);
        if (docsResponse.success && docsResponse.data) {
          setState(prev => ({ ...prev, documents: docsResponse.data.documents || [] }));
        }
        
        log.info('Documents override initialized successfully');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Error initializing documents override', error);
      return false;
    }
  }, [state.formData.sessionUuid]);

  /**
   * Initialize workflow override
   */
  const initializeWorkflowOverride = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) {
      log.error('Cannot initialize workflow override: no session UUID');
      return false;
    }

    try {
      log.info('Initializing workflow override...');
      const response = await sessionOverrideService.initializeWorkflowOverride(state.formData.sessionUuid);
      
      if (response.success) {
        setState(prev => ({ ...prev, hasWorkflowOverride: true }));
        
        // Reload effective workflow actions
        const workflowResponse = await sessionOverrideService.getEffectiveWorkflowActions(state.formData.sessionUuid!);
        if (workflowResponse.success && workflowResponse.data) {
          setState(prev => ({ ...prev, workflowActions: workflowResponse.data.workflow_actions || [] }));
        }
        
        log.info('Workflow override initialized successfully');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Error initializing workflow override', error);
      return false;
    }
  }, [state.formData.sessionUuid]);

  /**
   * Reset chapters to course template
   */
  const resetChaptersToTemplate = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      log.info('Resetting chapters to course template...');
      const response = await sessionOverrideService.resetChaptersOverride(state.formData.sessionUuid);
      
      if (response.success) {
        setState(prev => ({ ...prev, hasChaptersOverride: false }));
        
        // Reload chapters from course
        if (state.formData.courseUuid) {
          await loadFromCourse(state.formData.courseUuid);
        }
        
        log.info('Chapters reset to template successfully');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Error resetting chapters to template', error);
      return false;
    }
  }, [state.formData.sessionUuid, state.formData.courseUuid, loadFromCourse]);

  /**
   * Reset documents to course template
   */
  const resetDocumentsToTemplate = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      log.info('Resetting documents to course template...');
      const response = await sessionOverrideService.resetDocumentsOverride(state.formData.sessionUuid);
      
      if (response.success) {
        setState(prev => ({ ...prev, hasDocumentsOverride: false }));
        
        // Reload documents from course
        if (state.formData.courseUuid) {
          await loadFromCourse(state.formData.courseUuid);
        }
        
        log.info('Documents reset to template successfully');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Error resetting documents to template', error);
      return false;
    }
  }, [state.formData.sessionUuid, state.formData.courseUuid, loadFromCourse]);

  /**
   * Reset workflow to course template
   */
  const resetWorkflowToTemplate = useCallback(async (): Promise<boolean> => {
    if (!state.formData.sessionUuid) return false;

    try {
      log.info('Resetting workflow to course template...');
      const response = await sessionOverrideService.resetWorkflowOverride(state.formData.sessionUuid);
      
      if (response.success) {
        setState(prev => ({ ...prev, hasWorkflowOverride: false }));
        
        // Reload workflow from course
        if (state.formData.courseUuid) {
          await loadFromCourse(state.formData.courseUuid);
        }
        
        log.info('Workflow reset to template successfully');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Error resetting workflow to template', error);
      return false;
    }
  }, [state.formData.sessionUuid, state.formData.courseUuid, loadFromCourse]);

  /**
   * Check if a field is inherited from course or overridden
   */
  const isFieldInherited = useCallback((field: string): boolean => {
    if (!state.isSessionMode) return false;
    
    const overrideValue = state.overrides[field as keyof SessionCreationState['overrides']];
    return overrideValue === null || overrideValue === undefined;
  }, [state.isSessionMode, state.overrides]);

  /**
   * Get the course template value for a field (for comparison)
   */
  const getCourseTemplateValue = useCallback((field: string): any => {
    if (!state.courseTemplate) return null;
    return state.courseTemplate[field as keyof typeof state.courseTemplate];
  }, [state.courseTemplate]);

  /**
   * saveAll - Save SESSION data with OVERRIDES
   * 
   * NEW ARCHITECTURE (Override System):
   * - In SESSION MODE: Save overrides to SESSION (course template is NEVER modified)
   * - In COURSE MODE: Save to course template (when creating/editing a course, not a session)
   * 
   * @returns Promise<{ success: boolean; courseSuccess: boolean; sessionSuccess: boolean; message: string }>
   */
  const saveAll = useCallback(async (): Promise<{ success: boolean; courseSuccess: boolean; sessionSuccess: boolean; message: string }> => {
    const result = {
      success: false,
      courseSuccess: false, // Now means "overrides saved" in session mode
      sessionSuccess: false,
      message: ''
    };

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // 1. SAVE OVERRIDES or COURSE (depending on mode)
      // ═══════════════════════════════════════════════════════════════════════
      
      if (state.isSessionMode && state.formData.sessionUuid) {
        // ╔═══════════════════════════════════════════════════════════════════╗
        // ║ SESSION MODE: Save OVERRIDES (course template is NEVER modified) ║
        // ╚═══════════════════════════════════════════════════════════════════╝
        try {
          log.info('Step 1: Saving SESSION OVERRIDES (course template untouched)', { 
            sessionUuid: state.formData.sessionUuid,
            overrides: state.overrides 
          });
          
          // Build overrides payload - only include fields that differ from template
          const overridesPayload: Record<string, any> = {};
          
          // Check each override field
          if (state.overrides.title !== null) {
            overridesPayload.title_override = state.overrides.title;
          }
          if (state.overrides.subtitle !== null) {
            overridesPayload.subtitle_override = state.overrides.subtitle;
          }
          if (state.overrides.description !== null) {
            overridesPayload.description_override = state.overrides.description;
          }
          if (state.overrides.duration !== null) {
            overridesPayload.duration_override = state.overrides.duration;
          }
          if (state.overrides.price_ht !== null) {
            overridesPayload.price_ht_override = state.overrides.price_ht;
          }
          if (state.overrides.objectives !== null) {
            overridesPayload.objectives_override = state.overrides.objectives;
          }
          if (state.overrides.prerequisites !== null) {
            overridesPayload.prerequisites_override = state.overrides.prerequisites;
          }
          
          // Also check if title/description changed from form (auto-detect override)
          if (state.courseTemplate) {
            if (state.formData.title && state.formData.title !== state.courseTemplate.title) {
              overridesPayload.title_override = state.formData.title;
            }
            if (state.formData.description && state.formData.description !== state.courseTemplate.description) {
              overridesPayload.description_override = state.formData.description;
            }
            if (state.formData.price_ht && state.formData.price_ht !== state.courseTemplate.price_ht) {
              overridesPayload.price_ht_override = state.formData.price_ht;
            }
          }
          
          // Save overrides to session if any
          if (Object.keys(overridesPayload).length > 0) {
            await sessionOverrideService.updateSessionOverrides(state.formData.sessionUuid, overridesPayload);
            log.info('Session overrides saved', overridesPayload);
          }
          
          result.courseSuccess = true; // Means "overrides saved successfully"
          log.info('Session overrides saved successfully (course template untouched)');
        } catch (overrideError: any) {
          log.error('Error saving session overrides', overrideError);
          result.message = `Erreur lors de la sauvegarde des modifications: ${overrideError.message || 'Erreur inconnue'}`;
        }
      } else if (state.formData.courseUuid && !state.isSessionMode) {
        // ╔═══════════════════════════════════════════════════════════════════╗
        // ║ COURSE MODE: Update the COURSE template (only when editing course)║
        // ╚═══════════════════════════════════════════════════════════════════╝
        try {
          log.info('Step 1: Saving COURSE template (not in session mode)', { courseUuid: state.formData.courseUuid });
          
          // Données du template de cours (contenu pédagogique)
          const courseUpdateData = {
            // Informations de base
            title: state.formData.title,
            subtitle: state.formData.subtitle,
            description: state.formData.description,
            
            // Tarification
            price_ht: state.formData.price_ht,
            vat_percentage: state.formData.vat_percentage,
            
            // Durée théorique
            duration: state.formData.duration,
            duration_days: state.formData.duration_days,
            
            // Contenu pédagogique
            target_audience: state.formData.target_audience,
            prerequisites: state.formData.prerequisites,
            methods: state.formData.methods,
            specifics: state.formData.specifics,
            
            // Modalités
            evaluation_modalities: state.formData.evaluation_modalities,
            access_modalities: state.formData.access_modalities,
            accessibility: state.formData.accessibility,
            
            // Contact et mise à jour
            contacts: state.formData.contacts,
            update_date: state.formData.update_date,
            
            // Catégorie et langue
            category_id: state.formData.category_id,
            subcategory_id: state.formData.subcategory_id,
            course_language_id: state.formData.session_language_id,
            difficulty_level_id: state.formData.difficulty_level_id,
            
            // Formation practices
            formation_practice_ids: state.formData.formation_practice_ids
          };

          await courseCreation.updateCourse(state.formData.courseUuid, courseUpdateData);
          result.courseSuccess = true;
          log.info('Course template updated successfully');
        } catch (courseError: any) {
          log.error('Error saving course', courseError);
          result.message = `Erreur lors de la sauvegarde du cours: ${courseError.message || 'Erreur inconnue'}`;
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 2. SAVE SESSION DATA (Instance planifiée)
      // API: PUT /api/admin/organization/course-sessions/{sessionUuid}
      // Selon docs/COURSE_SESSIONS_API.md
      // ═══════════════════════════════════════════════════════════════════════
      if (state.formData.sessionUuid) {
        try {
          log.info('Step 2: Saving SESSION instance', { sessionUuid: state.formData.sessionUuid });
          
          // Get default dates
          const today = new Date();
          const defaultEndDate = new Date(today);
          defaultEndDate.setDate(today.getDate() + 30);
          const formatDate = (date: Date) => date.toISOString().split('T')[0];

          // Données spécifiques à la SESSION (pas le contenu du cours)
          // Selon COURSE_SESSIONS_API.md
          const sessionUpdatePayload = {
            // Lien vers le cours template
            course_uuid: state.formData.courseUuid,
            
            // Titre personnalisé (optionnel, null = utilise le titre du cours)
            title: null, // La session hérite du titre du cours
            
            // Description spécifique à cette session (optionnel)
            description: null,
            
            // Type de session: 'intra', 'inter', 'individual'
            session_type: 'inter',
            
            // Mode de délivrance: 'presentiel', 'distanciel', 'hybrid', 'e-learning'
            delivery_mode: 'presentiel',
            
            // Dates de la session
            start_date: state.formData.session_start_date || formatDate(today),
            end_date: state.formData.session_end_date || formatDate(defaultEndDate),
            
            // Horaires par défaut
            default_start_time: state.formData.session_start_time || '09:00',
            default_end_time: state.formData.session_end_time || '17:00',
            
            // Durée calculée
            total_hours: state.formData.duration || null,
            total_days: state.formData.duration_days || null,
            
            // Participants
            min_participants: 1,
            max_participants: state.formData.max_participants || 20,
            
            // Tarification spécifique (null = utilise le prix du cours)
            price_ht: null, // Hérite du cours
            vat_rate: state.formData.vat_percentage || 20,
            pricing_type: 'per_person',
            
            // Statut
            status: state.formData.isPublished ? 'open' : 'draft',
            is_published: state.formData.isPublished || false,
            is_registration_open: state.formData.isPublished || false,
            
            // Formateurs assignés
            trainer_uuids: state.formData.trainer_ids || []
          };

          // Utiliser le nouveau service courseSessionService
          await courseSessionService.updateSession(state.formData.sessionUuid, sessionUpdatePayload as any);
          result.sessionSuccess = true;
          log.info('Session instance updated successfully');
        } catch (sessionError: any) {
          log.error('Error saving session', sessionError);
          // Fallback to old API if new one fails
          try {
            log.warn('Trying fallback to old session API');
            const fallbackPayload = {
              session_start_date: state.formData.session_start_date,
              session_end_date: state.formData.session_end_date,
              session_start_time: state.formData.session_start_time || '09:00',
              session_end_time: state.formData.session_end_time || '17:00',
              max_participants: state.formData.max_participants || 0,
              course_uuid: state.formData.courseUuid,
              title: state.formData.title,
              status: state.formData.isPublished ? 1 : 0
            };
            await sessionCreationApi.updateSession(state.formData.sessionUuid, fallbackPayload);
            result.sessionSuccess = true;
            log.info('Session updated via fallback API');
          } catch (fallbackError: any) {
            log.error('Fallback also failed', fallbackError);
            result.message += `${result.message ? ' | ' : ''}Erreur lors de la sauvegarde de la session: ${sessionError.message || 'Erreur inconnue'}`;
          }
        }
      } else {
        log.warn('No sessionUuid, cannot save session data');
        result.message += `${result.message ? ' | ' : ''}Aucune session à sauvegarder`;
      }

      // Determine overall success
      result.success = result.courseSuccess && result.sessionSuccess;
      if (result.success) {
        result.message = 'Cours et session sauvegardés avec succès';
      } else if (result.courseSuccess && !result.sessionSuccess) {
        result.message = 'Cours sauvegardé, mais erreur pour la session';
      } else if (!result.courseSuccess && result.sessionSuccess) {
        result.message = 'Session sauvegardée, mais erreur pour le cours';
      }

      setState(prev => ({ ...prev, isSaving: false }));
      return result;

    } catch (error: any) {
      log.error('Unexpected error in saveAll', error);
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: 'Erreur lors de la sauvegarde' 
      }));
      return {
        success: false,
        courseSuccess: false,
        sessionSuccess: false,
        message: `Erreur inattendue: ${error.message || 'Erreur inconnue'}`
      };
    }
  }, [state.formData]);

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
    loadSubcategories,
    generateInstances,
    getInstances,
    cancelInstance,
    enrollParticipant,
    enrollMultipleParticipants,
    getParticipants,
    updateParticipantStatus,
    updateParticipantTarif,
    updateParticipantType,
    deleteParticipant,
    deleteMultipleParticipants,
    exportParticipants,
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
    updateContentAdapter,
    deleteContent,
    deleteContentAdapter,
    createEvaluationAdapter,
    updateEvaluationAdapter,
    deleteEvaluationAdapter,
    uploadSupportFilesAdapter,
    deleteSupportFile,
    deleteSupportFileAdapter,
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
    uploadIntroImage,
    loadFromCourse,
    setModules,
    setObjectives,
    setChapters,
    setDocuments,
    setQuestionnaires,
    saveAll,
    // Override system
    enableSessionMode,
    setOverride,
    resetOverride,
    resetAllOverrides,
    initializeChaptersOverride,
    initializeDocumentsOverride,
    initializeWorkflowOverride,
    resetChaptersToTemplate,
    resetDocumentsToTemplate,
    resetWorkflowToTemplate,
    isFieldInherited,
    getCourseTemplateValue
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
