/**
 * Course Session Context
 * 
 * Contexte pour la création et gestion des sessions de cours.
 * 
 * Flux de création:
 * 1. Sélectionner un cours (Course)
 * 2. Configurer la session (dates, lieu, type, etc.)
 * 3. Générer les séances (slots)
 * 4. Ajouter les participants
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { courseSessionService } from '../services/courseSession';
import type {
  AvailableCourse,
  CourseSession,
  CourseSessionListItem,
  CreateCourseSessionData,
  UpdateCourseSessionData,
  SessionSlot,
  CreateSlotData,
  GenerateSlotsData,
  SessionParticipant,
  AddParticipantData,
  CourseSessionFilters,
  SessionType,
  DeliveryMode,
  SessionStatus,
} from '../services/courseSession.types';

// ==================== FORM DATA ====================

export interface CourseSessionFormData {
  // Step 1: Course Selection
  course_uuid: string;
  selectedCourse: AvailableCourse | null;
  
  // Step 2: Session Configuration
  title: string;
  description: string;
  session_type: SessionType;
  delivery_mode: DeliveryMode;
  start_date: string;
  end_date: string;
  default_start_time: string;
  default_end_time: string;
  
  // Location (présentiel)
  location_name: string;
  location_address: string;
  location_city: string;
  location_postal_code: string;
  location_room: string;
  
  // Online (distanciel)
  platform_type: string;
  meeting_link: string;
  
  // Participants
  min_participants: number;
  max_participants: number;
  
  // Pricing
  price_ht: number | null;
  vat_rate: number;
  pricing_type: 'per_person' | 'per_session';
  
  // Status
  status: SessionStatus;
  is_published: boolean;
  is_registration_open: boolean;
  registration_deadline: string;
  
  // Notes
  internal_notes: string;
  
  // Trainers
  trainer_uuids: string[];
  primary_trainer_uuid: string;
}

const initialFormData: CourseSessionFormData = {
  course_uuid: '',
  selectedCourse: null,
  title: '',
  description: '',
  session_type: 'inter',
  delivery_mode: 'presentiel',
  start_date: '',
  end_date: '',
  default_start_time: '09:00',
  default_end_time: '17:00',
  location_name: '',
  location_address: '',
  location_city: '',
  location_postal_code: '',
  location_room: '',
  platform_type: '',
  meeting_link: '',
  min_participants: 4,
  max_participants: 12,
  price_ht: null,
  vat_rate: 20,
  pricing_type: 'per_person',
  status: 'draft',
  is_published: false,
  is_registration_open: false,
  registration_deadline: '',
  internal_notes: '',
  trainer_uuids: [],
  primary_trainer_uuid: '',
};

// ==================== CONTEXT STATE ====================

interface CourseSessionState {
  // Form data
  formData: CourseSessionFormData;
  
  // Current session (for editing)
  currentSession: CourseSession | null;
  sessionUuid: string | null;
  
  // Available courses for selection
  availableCourses: AvailableCourse[];
  
  // Session slots (séances)
  slots: SessionSlot[];
  
  // Participants
  participants: SessionParticipant[];
  
  // Available trainers
  trainers: any[];
  
  // UI State
  currentStep: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

// ==================== CONTEXT ACTIONS ====================

interface CourseSessionActions {
  // Form management
  updateFormField: <K extends keyof CourseSessionFormData>(field: K, value: CourseSessionFormData[K]) => void;
  updateMultipleFields: (updates: Partial<CourseSessionFormData>) => void;
  resetForm: () => void;
  
  // Step management
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Course selection
  loadAvailableCourses: () => Promise<void>;
  selectCourse: (course: AvailableCourse) => void;
  
  // Session CRUD
  createSession: () => Promise<string | null>;
  updateSession: () => Promise<boolean>;
  loadSession: (uuid: string) => Promise<boolean>;
  deleteSession: () => Promise<boolean>;
  cancelSession: (reason: string) => Promise<boolean>;
  
  // Slots (Séances)
  loadSlots: () => Promise<void>;
  createSlot: (data: CreateSlotData) => Promise<boolean>;
  updateSlot: (slotUuid: string, data: Partial<CreateSlotData>) => Promise<boolean>;
  deleteSlot: (slotUuid: string) => Promise<boolean>;
  generateSlots: (data: GenerateSlotsData) => Promise<boolean>;
  
  // Participants
  loadParticipants: () => Promise<void>;
  addParticipant: (data: AddParticipantData) => Promise<boolean>;
  updateParticipant: (participantUuid: string, data: Partial<AddParticipantData>) => Promise<boolean>;
  removeParticipant: (participantUuid: string) => Promise<boolean>;
  
  // Trainers
  loadTrainers: (search?: string) => Promise<void>;
  assignTrainer: (trainerUuid: string, isPrimary?: boolean) => Promise<boolean>;
  removeTrainer: (trainerUuid: string) => Promise<boolean>;
}

// ==================== CONTEXT ====================

const CourseSessionContext = createContext<(CourseSessionState & CourseSessionActions) | null>(null);

// ==================== PROVIDER ====================

interface CourseSessionProviderProps {
  children: ReactNode;
}

export const CourseSessionProvider: React.FC<CourseSessionProviderProps> = ({ children }) => {
  // State
  const [formData, setFormData] = useState<CourseSessionFormData>(initialFormData);
  const [currentSession, setCurrentSession] = useState<CourseSession | null>(null);
  const [sessionUuid, setSessionUuid] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== FORM MANAGEMENT ====================

  const updateFormField = useCallback(<K extends keyof CourseSessionFormData>(
    field: K, 
    value: CourseSessionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMultipleFields = useCallback((updates: Partial<CourseSessionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentSession(null);
    setSessionUuid(null);
    setSlots([]);
    setParticipants([]);
    setCurrentStep(0);
    setError(null);
  }, []);

  // ==================== STEP MANAGEMENT ====================

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 3)); // 4 steps: 0-3
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // ==================== COURSE SELECTION ====================

  const loadAvailableCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await courseSessionService.getAvailableCourses();
      if (response.success && response.data) {
        setAvailableCourses(response.data);
      }
    } catch (err) {
      console.error('Error loading available courses:', err);
      setError('Erreur lors du chargement des cours');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectCourse = useCallback((course: AvailableCourse) => {
    setFormData(prev => ({
      ...prev,
      course_uuid: course.uuid,
      selectedCourse: course,
      // Pré-remplir avec les valeurs du cours
      price_ht: course.price_ht || course.price || null,
    }));
  }, []);

  // ==================== SESSION CRUD ====================

  const createSession = useCallback(async (): Promise<string | null> => {
    if (!formData.course_uuid) {
      setError('Veuillez sélectionner un cours');
      return null;
    }

    try {
      setIsSaving(true);
      setError(null);

      const createData: CreateCourseSessionData = {
        course_uuid: formData.course_uuid,
        title: formData.title || undefined,
        description: formData.description || undefined,
        session_type: formData.session_type,
        delivery_mode: formData.delivery_mode,
        start_date: formData.start_date,
        end_date: formData.end_date,
        default_start_time: formData.default_start_time,
        default_end_time: formData.default_end_time,
        location_name: formData.location_name || undefined,
        location_address: formData.location_address || undefined,
        location_city: formData.location_city || undefined,
        location_postal_code: formData.location_postal_code || undefined,
        location_room: formData.location_room || undefined,
        platform_type: formData.platform_type || undefined,
        meeting_link: formData.meeting_link || undefined,
        min_participants: formData.min_participants,
        max_participants: formData.max_participants,
        price_ht: formData.price_ht,
        vat_rate: formData.vat_rate,
        pricing_type: formData.pricing_type,
        status: formData.status,
        is_published: formData.is_published,
        is_registration_open: formData.is_registration_open,
        registration_deadline: formData.registration_deadline || undefined,
        trainer_uuids: formData.trainer_uuids.length > 0 ? formData.trainer_uuids : undefined,
        primary_trainer_uuid: formData.primary_trainer_uuid || undefined,
        internal_notes: formData.internal_notes || undefined,
      };

      const response = await courseSessionService.createSession(createData);
      
      if (response.success && response.data) {
        setCurrentSession(response.data);
        setSessionUuid(response.data.uuid);
        return response.data.uuid;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || 'Erreur lors de la création de la session');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

  const updateSession = useCallback(async (): Promise<boolean> => {
    if (!sessionUuid) {
      setError('Aucune session à mettre à jour');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updateData: UpdateCourseSessionData = {
        title: formData.title || undefined,
        description: formData.description || undefined,
        session_type: formData.session_type,
        delivery_mode: formData.delivery_mode,
        start_date: formData.start_date,
        end_date: formData.end_date,
        default_start_time: formData.default_start_time,
        default_end_time: formData.default_end_time,
        location_name: formData.location_name || undefined,
        location_address: formData.location_address || undefined,
        location_city: formData.location_city || undefined,
        location_postal_code: formData.location_postal_code || undefined,
        location_room: formData.location_room || undefined,
        platform_type: formData.platform_type || undefined,
        meeting_link: formData.meeting_link || undefined,
        min_participants: formData.min_participants,
        max_participants: formData.max_participants,
        price_ht: formData.price_ht,
        vat_rate: formData.vat_rate,
        pricing_type: formData.pricing_type,
        status: formData.status,
        is_published: formData.is_published,
        is_registration_open: formData.is_registration_open,
        registration_deadline: formData.registration_deadline || undefined,
        internal_notes: formData.internal_notes || undefined,
      };

      const response = await courseSessionService.updateSession(sessionUuid, updateData);
      
      if (response.success && response.data) {
        setCurrentSession(response.data);
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error updating session:', err);
      setError(err.message || 'Erreur lors de la mise à jour de la session');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [sessionUuid, formData]);

  const loadSession = useCallback(async (uuid: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await courseSessionService.getSession(uuid);
      
      if (response.success && response.data) {
        const session = response.data;
        setCurrentSession(session);
        setSessionUuid(session.uuid);
        setSlots(session.slots || []);
        
        // Populate form data from session
        setFormData({
          course_uuid: session.course?.uuid || '',
          selectedCourse: session.course ? {
            id: session.course.id,
            uuid: session.course.uuid,
            title: session.course.title,
            subtitle: session.course.subtitle,
            image_url: session.course.image_url,
            duration: session.course.duration || 0,
            price: 0,
            sessions_count: 0,
            upcoming_sessions_count: 0,
          } : null,
          title: session.title || '',
          description: session.description || '',
          session_type: session.session_type,
          delivery_mode: session.delivery_mode,
          start_date: session.start_date,
          end_date: session.end_date,
          default_start_time: session.default_start_time || '09:00',
          default_end_time: session.default_end_time || '17:00',
          location_name: session.location.name || '',
          location_address: session.location.address || '',
          location_city: session.location.city || '',
          location_postal_code: session.location.postal_code || '',
          location_room: session.location.room || '',
          platform_type: session.online.platform_type || '',
          meeting_link: session.online.meeting_link || '',
          min_participants: session.participants.min,
          max_participants: session.participants.max,
          price_ht: session.pricing.price_ht || null,
          vat_rate: session.pricing.vat_rate || 20,
          pricing_type: session.pricing.pricing_type || 'per_person',
          status: session.status,
          is_published: session.is_published,
          is_registration_open: session.is_registration_open,
          registration_deadline: session.registration_deadline || '',
          internal_notes: session.internal_notes || '',
          trainer_uuids: session.trainers.map(t => t.uuid),
          primary_trainer_uuid: session.trainers.find(t => t.is_primary)?.uuid || '',
        });
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Erreur lors du chargement de la session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      setIsLoading(true);
      const response = await courseSessionService.deleteSession(sessionUuid);
      
      if (response.success) {
        resetForm();
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError(err.message || 'Erreur lors de la suppression');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionUuid, resetForm]);

  const cancelSession = useCallback(async (reason: string): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      setIsLoading(true);
      const response = await courseSessionService.cancelSession(sessionUuid, reason);
      
      if (response.success && response.data) {
        setCurrentSession(response.data);
        setFormData(prev => ({ ...prev, status: 'cancelled' }));
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error cancelling session:', err);
      setError(err.message || 'Erreur lors de l\'annulation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionUuid]);

  // ==================== SLOTS (SÉANCES) ====================

  const loadSlots = useCallback(async () => {
    if (!sessionUuid) return;

    try {
      setIsLoading(true);
      const response = await courseSessionService.getSlots(sessionUuid);
      
      if (response.success && response.data) {
        setSlots(response.data);
      }
    } catch (err) {
      console.error('Error loading slots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionUuid]);

  const createSlot = useCallback(async (data: CreateSlotData): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.createSlot(sessionUuid, data);
      
      if (response.success && response.data) {
        setSlots(prev => [...prev, response.data]);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error creating slot:', err);
      return false;
    }
  }, [sessionUuid]);

  const updateSlot = useCallback(async (slotUuid: string, data: Partial<CreateSlotData>): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.updateSlot(sessionUuid, slotUuid, data);
      
      if (response.success && response.data) {
        setSlots(prev => prev.map(s => s.uuid === slotUuid ? response.data : s));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating slot:', err);
      return false;
    }
  }, [sessionUuid]);

  const deleteSlot = useCallback(async (slotUuid: string): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.deleteSlot(sessionUuid, slotUuid);
      
      if (response.success) {
        setSlots(prev => prev.filter(s => s.uuid !== slotUuid));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error deleting slot:', err);
      return false;
    }
  }, [sessionUuid]);

  const generateSlots = useCallback(async (data: GenerateSlotsData): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      setIsLoading(true);
      const response = await courseSessionService.generateSlots(sessionUuid, data);
      
      if (response.success && response.data) {
        setSlots(response.data);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error generating slots:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionUuid]);

  // ==================== PARTICIPANTS ====================

  const loadParticipants = useCallback(async () => {
    if (!sessionUuid) return;

    try {
      setIsLoading(true);
      const response = await courseSessionService.getParticipants(sessionUuid);
      
      if (response.success && response.data) {
        setParticipants(response.data);
      }
    } catch (err) {
      console.error('Error loading participants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionUuid]);

  const addParticipant = useCallback(async (data: AddParticipantData): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.addParticipant(sessionUuid, data);
      
      if (response.success && response.data) {
        setParticipants(prev => [...prev, response.data]);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error adding participant:', err);
      return false;
    }
  }, [sessionUuid]);

  const updateParticipant = useCallback(async (
    participantUuid: string, 
    data: Partial<AddParticipantData>
  ): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.updateParticipant(sessionUuid, participantUuid, data);
      
      if (response.success && response.data) {
        setParticipants(prev => prev.map(p => p.uuid === participantUuid ? response.data : p));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating participant:', err);
      return false;
    }
  }, [sessionUuid]);

  const removeParticipant = useCallback(async (participantUuid: string): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.removeParticipant(sessionUuid, participantUuid);
      
      if (response.success) {
        setParticipants(prev => prev.filter(p => p.uuid !== participantUuid));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error removing participant:', err);
      return false;
    }
  }, [sessionUuid]);

  // ==================== TRAINERS ====================

  const loadTrainers = useCallback(async (search?: string) => {
    try {
      const response = await courseSessionService.getAvailableTrainers({ search, per_page: 50 });
      
      if (response.success && response.data) {
        setTrainers(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error loading trainers:', err);
    }
  }, []);

  const assignTrainer = useCallback(async (trainerUuid: string, isPrimary: boolean = false): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.assignTrainer(sessionUuid, trainerUuid, isPrimary);
      
      if (response.success) {
        // Update form data
        setFormData(prev => ({
          ...prev,
          trainer_uuids: [...prev.trainer_uuids, trainerUuid],
          primary_trainer_uuid: isPrimary ? trainerUuid : prev.primary_trainer_uuid,
        }));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error assigning trainer:', err);
      return false;
    }
  }, [sessionUuid]);

  const removeTrainer = useCallback(async (trainerUuid: string): Promise<boolean> => {
    if (!sessionUuid) return false;

    try {
      const response = await courseSessionService.removeTrainer(sessionUuid, trainerUuid);
      
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          trainer_uuids: prev.trainer_uuids.filter(id => id !== trainerUuid),
          primary_trainer_uuid: prev.primary_trainer_uuid === trainerUuid ? '' : prev.primary_trainer_uuid,
        }));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error removing trainer:', err);
      return false;
    }
  }, [sessionUuid]);

  // ==================== CONTEXT VALUE ====================

  const value: CourseSessionState & CourseSessionActions = {
    // State
    formData,
    currentSession,
    sessionUuid,
    availableCourses,
    slots,
    participants,
    trainers,
    currentStep,
    isLoading,
    isSaving,
    error,
    
    // Actions
    updateFormField,
    updateMultipleFields,
    resetForm,
    setCurrentStep,
    nextStep,
    previousStep,
    loadAvailableCourses,
    selectCourse,
    createSession,
    updateSession,
    loadSession,
    deleteSession,
    cancelSession,
    loadSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    generateSlots,
    loadParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
    loadTrainers,
    assignTrainer,
    removeTrainer,
  };

  return (
    <CourseSessionContext.Provider value={value}>
      {children}
    </CourseSessionContext.Provider>
  );
};

// ==================== HOOK ====================

export const useCourseSession = () => {
  const context = useContext(CourseSessionContext);
  
  if (!context) {
    throw new Error('useCourseSession must be used within a CourseSessionProvider');
  }
  
  return context;
};

export default CourseSessionContext;






