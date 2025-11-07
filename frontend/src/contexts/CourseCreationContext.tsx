import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { courseCreation as courseCreationApi } from '../services/courseCreation';
import type {
  CourseModule,
  CourseObjective,
  AdditionalFee,
  CourseChapter,
  SubChapter,
  CourseContent,
  Evaluation,
  Document,
  CertificationModel,
  Questionnaire,
  Trainer,
  CourseTrainer,
  Workflow,
  WorkflowAction,
  EmailTemplate
} from '../services/courseCreation.types';

// Form Data Interface
export interface CourseCreationFormData {
  // Step 1: Course Information
  title: string;
  subtitle: string;
  description: string;
  course_type: number; // 1 = online, 2 = offline
  category_id: number | null;
  subcategory_id: number | null;
  course_language_id: number | null;
  difficulty_level_id: number | null;
  duration: number;
  duration_days: number;
  target_audience: string;
  prerequisites: string;
  tags: string[];
  youtube_video_id: string;
  intro_video: File | null;
  intro_image: File | null;
  intro_video_url?: string;
  intro_image_url?: string;
  price: number;
  price_ht: number;
  vat_percentage: number;
  currency: string;
  isPublished: boolean;
  isDraft: boolean;
  learningOutcomes: string[];
  methods: string;
  specifics: string;
  courseUuid?: string;
}

// Create/Update Data Types
export type CreateModuleData = Omit<CourseModule, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'>;
export type UpdateModuleData = Partial<CreateModuleData>;

export type CreateObjectiveData = Omit<CourseObjective, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'>;
export type UpdateObjectiveData = Partial<CreateObjectiveData>;

export type CreateAdditionalFeeData = Omit<AdditionalFee, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'>;
export type UpdateAdditionalFeeData = Partial<CreateAdditionalFeeData>;

export type CreateChapterData = Omit<CourseChapter, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'>;
export type UpdateChapterData = Partial<CreateChapterData>;

export type CreateSubChapterData = Omit<SubChapter, 'uuid' | 'created_at' | 'updated_at'> & { chapter_id?: string };
export type UpdateSubChapterData = Partial<CreateSubChapterData>;

export type CreateContentData = Omit<CourseContent, 'uuid' | 'created_at' | 'updated_at'> & { chapter_id?: string; sub_chapter_id?: string };
export type UpdateContentData = Partial<CreateContentData>;

export type CreateEvaluationData = Omit<Evaluation, 'uuid' | 'created_at' | 'updated_at'> & { chapter_id?: string; sub_chapter_id?: string };
export type UpdateEvaluationData = Partial<CreateEvaluationData>;

export type CreateDocumentData = Omit<Document, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'> & { file: File };
export type UpdateDocumentData = Partial<CreateDocumentData>;

export type CreateCertificationModelData = Omit<CertificationModel, 'uuid' | 'created_at' | 'updated_at'> & { file: File };
export type UpdateCertificationModelData = Partial<CreateCertificationModelData>;

export type CreateQuestionnaireData = Omit<Questionnaire, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'>;
export type UpdateQuestionnaireData = Partial<CreateQuestionnaireData>;

// Align trainer create/update types with API shapes (supports avatar File upload)
export type CreateTrainerData = {
  name: string;
  email: string;
  phone?: string | null;
  specialization?: string;
  experience_years: number;
  description?: string;
  competencies: string[];
  avatar?: File;
};
export type UpdateTrainerData = Partial<CreateTrainerData>;

export type CreateWorkflowData = Omit<Workflow, 'uuid' | 'course_uuid' | 'created_at' | 'updated_at'>;
export type UpdateWorkflowData = Partial<CreateWorkflowData>;

export type CreateWorkflowActionData = Omit<WorkflowAction, 'uuid' | 'workflow_id' | 'created_at' | 'updated_at'>;
export type UpdateWorkflowActionData = Partial<CreateWorkflowActionData>;

export type CreateEmailTemplateData = Omit<EmailTemplate, 'uuid' | 'created_at' | 'updated_at'>;
export type UpdateEmailTemplateData = Partial<CreateEmailTemplateData>;

// Context Type
export interface CourseCreationContextType {
  // Current Step
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Form Data
  formData: CourseCreationFormData;
  updateFormData: (data: Partial<CourseCreationFormData>) => void;
  updateFormField: (field: keyof CourseCreationFormData, value: any) => void;
  
  // Loading State
  isLoading: boolean;
  isSaving: boolean;
  
  // Error states
  error: string | null;
  clearError: () => void;
  
  // Step 1: Course Information
  categories: Array<{ id: number; name: string }>;
  subcategories: Array<{ id: number; name: string; category_id: number }>;
  languages: Array<{ id: number; name: string; code: string }>;
  difficultyLevels: Array<{ id: number; name: string; level: number }>;
  
  // Step 2: Content
  modules: CourseModule[];
  objectives: CourseObjective[];
  additionalFees: AdditionalFee[];
  chapters: CourseChapter[];
  subChapters: SubChapter[];
  content: CourseContent[];
  evaluations: Evaluation[];
  supportFiles: File[];
  
  // Step 3: Documents
  documents: Document[];
  certificationModels: CertificationModel[];
  selectedCertification: CertificationModel | null;
  
  // Step 4: Questionnaire
  questionnaires: Questionnaire[];
  
  // Step 5: Trainers
  trainers: Trainer[];
  courseTrainers: CourseTrainer[];
  
  // Step 6: Workflow
  workflow: Workflow | null;
  workflowActions: WorkflowAction[];
  emailTemplates: EmailTemplate[];
  
  // Step 1 Actions
  loadCategories: () => Promise<void>;
  loadSubcategories: (categoryId: number) => Promise<void>;
  loadLanguages: () => Promise<void>;
  loadDifficultyLevels: () => Promise<void>;
  uploadIntroVideo: (file: File) => Promise<boolean>;
  uploadIntroImage: (file: File) => Promise<boolean>;
  updateMediaUrls: (data: { intro_video_url?: string; intro_image_url?: string }) => Promise<boolean>;
  deleteIntroVideo: () => Promise<boolean>;
  deleteIntroImage: () => Promise<boolean>;
  updateCoursePricing: (data: { price?: number; price_ht?: number; vat_percentage?: number; currency?: string }) => Promise<boolean>;
  updateCourseDuration: (data: { duration?: number; duration_days?: number }) => Promise<boolean>;
  updateCourseTargetAudience: (data: { target_audience?: string; prerequisites?: string; tags?: string[] }) => Promise<boolean>;
  updateCourseLearningOutcomes: (data: { learningOutcomes?: string[] }) => Promise<boolean>;
  updateCourseMethods: (data: { methods?: string }) => Promise<boolean>;
  updateCourseSpecifics: (data: { specifics?: string }) => Promise<boolean>;
  updateCourseYouTubeVideo: (data: { youtube_video_id?: string }) => Promise<boolean>;
  updateCourseStatus: (status: string) => Promise<boolean>;
  updateFieldAndSave: (field: keyof CourseCreationFormData, value: any) => Promise<boolean>;
  
  // Step 2 Actions
  loadModules: () => Promise<void>;
  createModule: (data: CreateModuleData) => Promise<CourseModule | null>;
  updateModule: (uuid: string, data: UpdateModuleData) => Promise<CourseModule | null>;
  deleteModule: (uuid: string) => Promise<boolean>;
  reorderModules: (moduleUuids: string[]) => Promise<boolean>;
  
  loadObjectives: () => Promise<void>;
  createObjective: (data: CreateObjectiveData) => Promise<CourseObjective | null>;
  updateObjective: (uuid: string, data: UpdateObjectiveData) => Promise<CourseObjective | null>;
  deleteObjective: (uuid: string) => Promise<boolean>;
  reorderObjectives: (objectiveUuids: string[]) => Promise<boolean>;
  
  loadAdditionalFees: () => Promise<void>;
  createAdditionalFee: (data: CreateAdditionalFeeData) => Promise<AdditionalFee | null>;
  updateAdditionalFee: (uuid: string, data: UpdateAdditionalFeeData) => Promise<AdditionalFee | null>;
  deleteAdditionalFee: (uuid: string) => Promise<boolean>;
  
  loadChapters: () => Promise<void>;
  createChapter: (data: CreateChapterData) => Promise<CourseChapter | null>;
  updateChapter: (id: string, data: UpdateChapterData) => Promise<CourseChapter | null>;
  deleteChapter: (id: string) => Promise<boolean>;
  reorderChapters: (chapterIds: string[]) => Promise<boolean>;
  
  loadSubChapters: (chapterId: string) => Promise<void>;
  createSubChapter: (data: CreateSubChapterData) => Promise<SubChapter | null>;
  createSubChapterAdapter: (chapterId: string, data: { title: string; description: string; order: number }) => Promise<SubChapter | null>;
  updateSubChapter: (id: string, data: UpdateSubChapterData) => Promise<SubChapter | null>;
  updateSubChapterAdapter: (chapterId: string, subChapterId: string, data: { title?: string; description?: string; order?: number }) => Promise<SubChapter | null>;
  deleteSubChapter: (id: string) => Promise<boolean>;
  deleteSubChapterAdapter: (chapterId: string, subChapterId: string) => Promise<boolean>;
  reorderSubChapters: (subChapterIds: string[]) => Promise<boolean>;
  
  loadContent: (chapterId: string) => Promise<void>;
  loadChapterContent: (chapterId: string) => Promise<void>;
  createContent: (data: CreateContentData) => Promise<CourseContent | null>;
  createContentAdapter: (chapterId: string, data: { type: 'video' | 'text' | 'image'; content: string; order: number; sub_chapter_id?: string; file?: File }) => Promise<CourseContent | null>;
  updateContent: (chapterId: string, id: string, data: UpdateContentData) => Promise<CourseContent | null>;
  deleteContent: (id: string) => Promise<boolean>;
  reorderContent: (contentIds: string[]) => Promise<boolean>;
  
  loadEvaluations: (chapterId: string) => Promise<void>;
  loadChapterEvaluations: (chapterId: string) => Promise<void>;
  createEvaluation: (data: CreateEvaluationData) => Promise<Evaluation | null>;
  createEvaluationAdapter: (chapterId: string, data: { type: 'devoir' | 'examen'; title: string; description: string; due_date?: string; file?: File; sub_chapter_id?: string }) => Promise<Evaluation | null>;
  updateEvaluation: (id: string, data: UpdateEvaluationData) => Promise<Evaluation | null>;
  deleteEvaluation: (id: string) => Promise<boolean>;
  reorderEvaluations: (evaluationIds: string[]) => Promise<boolean>;
  
  loadChapterSupportFiles: (chapterId: string) => Promise<void>;
  uploadSupportFiles: (files: File[], chapterId: string, subChapterId?: string) => Promise<boolean>;
  uploadSupportFilesAdapter: (files: File[], chapterId: string, subChapterId?: string) => Promise<boolean>;
  deleteSupportFile: (fileId: string) => Promise<boolean>;
  
  // Step 3 Actions
  loadDocuments: () => Promise<void>;
  createDocument: (data: CreateDocumentData) => Promise<Document | null>;
  updateDocument: (id: number, data: UpdateDocumentData) => Promise<Document | null>;
  deleteDocument: (id: number) => Promise<boolean>;
  
  loadCertificationModels: () => Promise<void>;
  loadMyCertificationModels: () => Promise<void>;
  loadFormlyCertificationModels: () => Promise<void>;
  createCertificationModel: (data: CreateCertificationModelData) => Promise<CertificationModel | null>;
  updateCertificationModel: (id: number, data: UpdateCertificationModelData) => Promise<CertificationModel | null>;
  deleteCertificationModel: (id: number) => Promise<boolean>;
  assignCertificationModel: (modelId: number) => Promise<boolean>;
  
  // Step 4 Actions
  loadQuestionnaires: () => Promise<void>;
  createQuestionnaire: (data: CreateQuestionnaireData) => Promise<Questionnaire | null>;
  updateQuestionnaire: (id: string, data: UpdateQuestionnaireData) => Promise<Questionnaire | null>;
  deleteQuestionnaire: (id: number) => Promise<boolean>;
  duplicateQuestionnaire: (id: number) => Promise<Questionnaire | null>;
  
  // Questionnaire Questions
  loadQuestions: (questionnaireId: string) => Promise<void>;
  createQuestion: (questionnaireId: string, data: any) => Promise<any>;
  updateQuestion: (questionnaireId: string, questionId: string, data: any) => Promise<any>;
  deleteQuestion: (questionnaireId: string, questionId: string) => Promise<boolean>;
  reorderQuestions: (questionnaireId: string, questionIds: string[]) => Promise<boolean>;
  duplicateQuestion: (questionnaireId: string, questionId: string) => Promise<any>;
  
  // Step 5 Actions
  loadTrainers: () => Promise<void>;
  loadCourseTrainers: () => Promise<void>;
  assignTrainer: (trainerId: number) => Promise<boolean>;
  updateTrainerPermissions: (trainerId: number, permissions: any) => Promise<boolean>;
  removeTrainer: (trainerId: string) => Promise<boolean>;
  createTrainer: (data: CreateTrainerData) => Promise<Trainer | null>;
  updateTrainer: (id: number, data: UpdateTrainerData) => Promise<Trainer | null>;
  
  // Step 6 Actions
  loadWorkflow: () => Promise<void>;
  createWorkflow: (data: CreateWorkflowData) => Promise<Workflow | null>;
  updateWorkflow: (id: number, data: UpdateWorkflowData) => Promise<Workflow | null>;
  toggleWorkflowStatus: (isActive: boolean) => Promise<boolean>;
  
  loadWorkflowActions: () => Promise<void>;
  createWorkflowAction: (data: CreateWorkflowActionData) => Promise<WorkflowAction | null>;
  updateWorkflowAction: (id: number, data: UpdateWorkflowActionData) => Promise<WorkflowAction | null>;
  deleteWorkflowAction: (id: number) => Promise<boolean>;
  reorderWorkflowActions: (actionIds: number[]) => Promise<boolean>;
  toggleWorkflowAction: (id: number) => Promise<boolean>;
  
  loadEmailTemplates: () => Promise<void>;
  createEmailTemplate: (data: CreateEmailTemplateData) => Promise<EmailTemplate | null>;
  updateEmailTemplate: (id: number, data: UpdateEmailTemplateData) => Promise<EmailTemplate | null>;
  deleteEmailTemplate: (id: number) => Promise<boolean>;
  
  // Utility Actions
  saveDraft: () => Promise<boolean>;
  autoSave: () => Promise<boolean>;
  initializeCourse: (courseUuid?: string) => Promise<void>;
  resetForm: () => void;
}

// Create Context
const CourseCreationContext = createContext<CourseCreationContextType | undefined>(undefined);

// Initial Form Data
const initialFormData: CourseCreationFormData = {
  title: '',
  subtitle: 'Sous-titre du cours',
  description: '',
  course_type: 1, // Default to online course
  category_id: null,
  subcategory_id: null,
  course_language_id: null,
  difficulty_level_id: null,
  duration: 0,
  duration_days: 0,
  target_audience: '',
  prerequisites: '',
  tags: [],
  youtube_video_id: '',
  intro_video: null,
  intro_image: null,
  intro_video_url: '',
  intro_image_url: '',
  price: 0,
  price_ht: 0,
  vat_percentage: 20,
  currency: 'EUR',
  isPublished: false,
  isDraft: true,
  learningOutcomes: [],
  methods: '',
  specifics: '',
  courseUuid: undefined,
};

// Provider Component
export const CourseCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current Step
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form Data
  const [formData, setFormData] = useState<CourseCreationFormData>(initialFormData);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Course Information
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string; category_id: number }>>([]);
  const [languages, setLanguages] = useState<Array<{ id: number; name: string; code: string }>>([
    { id: 1, name: 'Français', code: 'fr' },
    { id: 2, name: 'English', code: 'en' },
    { id: 3, name: 'Español', code: 'es' }
  ]);
  const [difficultyLevels, setDifficultyLevels] = useState<Array<{ id: number; name: string; level: number }>>([
    { id: 1, name: 'Débutant', level: 1 },
    { id: 2, name: 'Intermédiaire', level: 2 },
    { id: 3, name: 'Avancé', level: 3 },
    { id: 4, name: 'Expert', level: 4 }
  ]);
  
  // Step 2: Content
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [objectives, setObjectives] = useState<CourseObjective[]>([]);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>([]);
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [subChapters, setSubChapters] = useState<SubChapter[]>([]);
  const [content, setContent] = useState<CourseContent[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  
  // Step 3: Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [certificationModels, setCertificationModels] = useState<CertificationModel[]>([]);
  const [selectedCertification, setSelectedCertification] = useState<CertificationModel | null>(null);
  
  // Step 4: Questionnaire
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  
  // Step 5: Trainers
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [courseTrainers, setCourseTrainers] = useState<CourseTrainer[]>([]);
  
  // Step 6: Workflow
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflowActions, setWorkflowActions] = useState<WorkflowAction[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  // Utility Functions
  const handleApiCall = useCallback(async <T extends any>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      const result = await apiCall();
      if (successMessage) {
        // Success message handled
      }
      return result;
    } catch (err) {
      // API call failed
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // Form Data Management
  const updateFormData = useCallback((data: Partial<CourseCreationFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const updateFormField = useCallback((field: keyof CourseCreationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Step 1 Actions
  const loadCategories = useCallback(async () => {
    try {
      const meta = await courseCreationApi.getCreationMetadata();
      if (meta.success) {
        setCategories(meta.data.categories || []);
        // Keep existing shape; if backend lacks code/level, preserve initial defaults
        if (meta.data.course_languages?.length) {
          setLanguages(meta.data.course_languages.map((l: any, i: number) => ({ id: l.id, name: l.name, code: ['fr','en','es'][i % 3] })));
        }
        if (meta.data.difficulty_levels?.length) {
          setDifficultyLevels(meta.data.difficulty_levels.map((d: any, i: number) => ({ id: d.id, name: d.name, level: (i+1) })));
        }
      }
    } catch (e) {
      // Failed to load creation metadata
    }
  }, []);

  const loadSubcategories = useCallback(async (categoryId: number) => {
    try {
      const res = await courseCreationApi.getSubcategories(categoryId);
      if (res.success) {
        setSubcategories((res.data || []).map(s => ({ id: s.id, name: s.name, category_id: categoryId })));
      }
    } catch (e) {
      // Failed to load subcategories
    }
  }, []);

  const loadLanguages = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  const loadDifficultyLevels = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  const uploadIntroVideo = useCallback(async (file: File): Promise<boolean> => {
    // If courseUuid is not available, create a new course first
    if (!formData.courseUuid) {
      try {
        const result = await courseCreationApi.createCourse({
          title: formData.title || 'Nouveau cours',
          description: formData.description || 'Draft course',
          category_id: formData.category_id || 1,
          price: formData.price || 0,
          currency: formData.currency || 'EUR',
          isPublished: false,
          isDraft: true,
        });
        
        if (result.success && result.data?.uuid) {
          updateFormField('courseUuid', result.data.uuid);
        } else {
          // Failed to create course for video upload
          return false;
        }
      } catch (error) {
        // Error creating course for video upload
        return false;
      }
    }
    
    try {
      const result = await courseCreationApi.uploadIntroVideo(formData.courseUuid, file);
      if (result.success) {
        updateFormField('intro_video_url', result.data.file_url);
        updateFormField('intro_video', file);
        return true;
      }
      return false;
    } catch (error) {
      // Error uploading intro video
      return false;
    }
  }, [formData.courseUuid, formData.title, formData.description, formData.category_id, formData.price, formData.currency, updateFormField]);

  const uploadIntroImage = useCallback(async (file: File): Promise<boolean> => {
    // If courseUuid is not available, create a new course first
    if (!formData.courseUuid) {
      try {
        const result = await courseCreationApi.createCourse({
          title: formData.title || 'Nouveau cours',
          description: formData.description || 'Draft course',
          category_id: formData.category_id || 1,
          price: formData.price || 0,
          currency: formData.currency || 'EUR',
          isPublished: false,
          isDraft: true,
        });
        
        if (result.success && result.data?.uuid) {
          updateFormField('courseUuid', result.data.uuid);
        } else {
          // Failed to create course for image upload
          return false;
        }
      } catch (error) {
        // Error creating course for image upload
        return false;
      }
    }
    
    try {
      const result = await courseCreationApi.uploadIntroImage(formData.courseUuid, file);
      if (result.success) {
        updateFormField('intro_image_url', result.data.file_url);
        updateFormField('intro_image', file);
        return true;
      }
      return false;
    } catch (error) {
      // Error uploading intro image
      return false;
    }
  }, [formData.courseUuid, formData.title, formData.description, formData.category_id, formData.price, formData.currency, updateFormField]);

  const updateMediaUrls = useCallback(async (data: { intro_video_url?: string; intro_image_url?: string }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateMediaUrls(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating media URLs
      return false;
    }
  }, [formData.courseUuid]);

  const deleteIntroVideo = useCallback(async (): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteIntroVideo(formData.courseUuid);
      if (result.success) {
        updateFormField('intro_video_url', '');
        updateFormField('intro_video', null);
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting intro video
      return false;
    }
  }, [formData.courseUuid, updateFormField]);

  const deleteIntroImage = useCallback(async (): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteIntroImage(formData.courseUuid);
      if (result.success) {
        updateFormField('intro_image_url', '');
        updateFormField('intro_image', null);
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting intro image
      return false;
    }
  }, [formData.courseUuid, updateFormField]);

  // Additional course field update functions
  const updateCoursePricing = useCallback(async (data: { price?: number; price_ht?: number; vat_percentage?: number; currency?: string }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateCoursePricing(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating course pricing:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseDuration = useCallback(async (data: { duration?: number; duration_days?: number }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      // Convert decimal days to integer days if present
      const processedData = { ...data };
      if (processedData.duration_days !== undefined) {
        processedData.duration_days = Math.ceil(processedData.duration_days);
      }
      
      
      const result = await courseCreationApi.updateCourseDuration(formData.courseUuid, processedData);
      
      
      return result.success;
    } catch (error: any) {
      // Error updating course duration:', error);
      if (import.meta.env.DEV) {
        // Duration update error details
      }
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseTargetAudience = useCallback(async (data: { target_audience?: string; prerequisites?: string; tags?: string[] }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateCourseTargetAudience(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating course target audience:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseLearningOutcomes = useCallback(async (data: { learningOutcomes?: string[] }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateCourseLearningOutcomes(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating course learning outcomes:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseMethods = useCallback(async (data: { methods?: string }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateCourseMethods(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating course methods:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseSpecifics = useCallback(async (data: { specifics?: string }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateCourseSpecifics(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating course specifics:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseYouTubeVideo = useCallback(async (data: { youtube_video_id?: string }): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateCourseYouTubeVideo(formData.courseUuid, data);
      return result.success;
    } catch (error) {
      // Error updating course YouTube video:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const updateCourseStatus = useCallback(async (status: string): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      // Convert status string to number (active = 1, draft = 0, etc.)
      const statusNumber = status === 'active' ? 1 : 0;
      const result = await courseCreationApi.updateCourseStatus(formData.courseUuid, statusNumber);
      return result.success;
    } catch (error) {
      // Error updating course status:', error);
      return false;
    }
  }, [formData.courseUuid]);

  // Field-specific update handlers for immediate updates
  const updateFieldAndSave = useCallback(async (field: keyof CourseCreationFormData, value: any): Promise<boolean> => {
    // Update local state immediately
    updateFormField(field, value);
    
    // Save to backend using appropriate endpoint
    if (!formData.courseUuid) return false;
    
    try {
      switch (field) {
        case 'price':
        case 'price_ht':
        case 'vat_percentage':
        case 'currency':
          return await updateCoursePricing({
            price: field === 'price' ? value : formData.price,
            price_ht: field === 'price_ht' ? value : formData.price_ht,
            vat_percentage: field === 'vat_percentage' ? value : formData.vat_percentage,
            currency: field === 'currency' ? value : formData.currency
          });
          
        case 'duration':
        case 'duration_days':
          return await updateCourseDuration({
            duration: field === 'duration' ? value : formData.duration,
            duration_days: field === 'duration_days' ? Math.ceil(value) : Math.ceil(formData.duration_days)
          });
          
        case 'target_audience':
        case 'prerequisites':
        case 'tags':
          return await updateCourseTargetAudience({
            target_audience: field === 'target_audience' ? value : formData.target_audience,
            prerequisites: field === 'prerequisites' ? value : formData.prerequisites,
            tags: field === 'tags' ? value : formData.tags
          });
          
        case 'learningOutcomes':
          return await updateCourseLearningOutcomes({
            learningOutcomes: value
          });
          
        case 'methods':
          return await updateCourseMethods({
            methods: value
          });
          
        case 'specifics':
          return await updateCourseSpecifics({
            specifics: value
          });
          
        case 'youtube_video_id':
          return await updateCourseYouTubeVideo({
            youtube_video_id: value
          });
          
        default:
          // For other fields, use the general overview update
          const overviewData = { [field]: value };
          const result = await courseCreationApi.updateCourseOverview(formData.courseUuid, overviewData);
          return result.success;
      }
    } catch (error) {
      // (`Error updating ${field}:`, error);
      return false;
    }
  }, [formData.courseUuid, updateFormField, updateCoursePricing, updateCourseDuration, updateCourseTargetAudience, updateCourseLearningOutcomes, updateCourseMethods, updateCourseSpecifics, updateCourseYouTubeVideo]);

  // Step 2 Adapters (defined after all base functions to avoid hoist issues)
  const loadChapterContent = useCallback(async (chapterId: string) => {
    if (!formData.courseUuid) return;
    try {
      const res = await courseCreationApi.getChapterContent(formData.courseUuid, chapterId);
      if (res.success) setContent(res.data);
    } catch (e) {
      // Error loading chapter content:', e);
    }
  }, [formData.courseUuid]);

  const createChapterAdapter = useCallback(async (data: { title: string; description: string; order: number }) => {
    if (!formData.courseUuid) return null;
    const res = await courseCreationApi.createChapter(formData.courseUuid, { title: data.title, description: data.description, order: data.order });
    if (res.success) {
      setChapters(prev => [...prev, res.data]);
      return res.data;
    }
    return null;
  }, [formData.courseUuid]);

  const updateChapterAdapter = useCallback(async (chapterId: string, data: { title?: string; description?: string; order?: number }) => {
    if (!formData.courseUuid) return null;
    const res = await courseCreationApi.updateChapter(formData.courseUuid, chapterId, { title: data.title, description: data.description, order: data.order });
    if (res.success) {
      setChapters(prev => prev.map(c => c.uuid === chapterId ? res.data : c));
      return res.data;
    }
    return null;
  }, [formData.courseUuid]);

  const deleteChapterAdapter = useCallback(async (chapterId: string) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.deleteChapter(formData.courseUuid, chapterId);
    if (res.success) {
      setChapters(prev => prev.filter(c => c.uuid !== chapterId));
      return true;
    }
    return false;
  }, [formData.courseUuid]);

  const reorderChaptersAdapter = useCallback(async (chapterIds: string[]) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.reorderChapters(formData.courseUuid, chapterIds);
    return !!res.success;
  }, [formData.courseUuid]);

  const loadChapters = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getCourseChapters(formData.courseUuid);
      if (result.success) {
        // Load comprehensive data for each chapter
        const chaptersWithFullData = await Promise.all(
          result.data.map(async (chapter: any) => {
            try {
              // Load sub-chapters
              const subChaptersResult = await courseCreationApi.getSubChapters(formData.courseUuid!, chapter.uuid);
              const subChapters = subChaptersResult.success ? subChaptersResult.data : [];
              
              // Load content for each sub-chapter
              const subChaptersWithContent = await Promise.all(
                subChapters.map(async (subChapter: any) => {
                  try {
                    // Load content
                    const contentResult = await courseCreationApi.getSubChapterContent(formData.courseUuid!, chapter.uuid, subChapter.uuid);
                    const content = contentResult.success ? contentResult.data : [];
                    
                    // Load evaluations
                    const evaluationsResult = await courseCreationApi.getSubChapterEvaluations(formData.courseUuid!, chapter.uuid, subChapter.uuid);
                    const evaluations = evaluationsResult.success ? evaluationsResult.data : [];
                    
                    // Load support files
                    const supportFilesResult = await courseCreationApi.getChapterSupportFiles(formData.courseUuid!, chapter.uuid);
                    const supportFiles = supportFilesResult.success ? supportFilesResult.data : [];
                    
                    return {
                      ...subChapter,
                      content,
                      evaluations,
                      support_files: supportFiles
                    };
                  } catch (error) {
                    // (`Error loading data for sub-chapter ${subChapter.uuid}:`, error);
                    return {
                      ...subChapter,
                      content: [],
                      evaluations: [],
                      support_files: []
                    };
                  }
                })
              );
              
              // Load chapter-level content and evaluations
              const chapterContentResult = await courseCreationApi.getChapterContent(formData.courseUuid!, chapter.uuid);
              const chapterContent = chapterContentResult.success ? chapterContentResult.data : [];
              
              const chapterEvaluationsResult = await courseCreationApi.getChapterEvaluations(formData.courseUuid!, chapter.uuid);
              const chapterEvaluations = chapterEvaluationsResult.success ? chapterEvaluationsResult.data : [];
              
              // Load chapter quiz associations
              let chapterQuizzes = [];
              try {
                const quizzesResult = await courseCreationApi.getChapterQuizzes(formData.courseUuid!, chapter.uuid);
                console.log(`🎯 Chapter ${chapter.uuid} quizzes API result:`, quizzesResult);
                if (quizzesResult.success && quizzesResult.data) {
                  chapterQuizzes = Array.isArray(quizzesResult.data) ? quizzesResult.data : (quizzesResult.data.data || []);
                  console.log(`✅ Chapter ${chapter.uuid} loaded ${chapterQuizzes.length} quiz(zes)`);
                }
              } catch (error) {
                console.log(`⚠️ Chapter ${chapter.uuid} quiz endpoint not available (404 expected), using fallback`, error);
                // Fallback: use data from chapter object if available
                chapterQuizzes = chapter.quizzes || chapter.quiz_assignments || [];
              }
              
              console.log(`🔍 Chapter ${chapter.uuid} final quizzes:`, chapterQuizzes);
              
              return {
                ...chapter,
                sub_chapters: subChaptersWithContent,
                content: chapterContent,
                evaluations: chapterEvaluations,
                // Include quiz associations from API call or fallback
                quizzes: chapterQuizzes,
                quiz_assignments: chapterQuizzes
              };
            } catch (error) {
              // (`Error loading data for chapter ${chapter.uuid}:`, error);
              return {
                ...chapter,
                sub_chapters: [],
                content: [],
                evaluations: [],
                quizzes: [],
                quiz_assignments: []
              };
            }
          })
        );
        
        setChapters(chaptersWithFullData);
      }
    } catch (error) {
      // Error loading chapters:', error);
    }
  }, [formData.courseUuid]);

  const createSubChapterAdapter = useCallback(async (chapterId: string, data: { title: string; description: string; order: number }) => {
    if (!formData.courseUuid) return null;
    const res = await courseCreationApi.createSubChapter(formData.courseUuid, chapterId, { title: data.title, description: data.description, order: data.order } as any);
    if (res.success) {
      setSubChapters(prev => [...prev, res.data]);
      // Reload chapters to ensure data consistency
      await loadChapters();
      return res.data;
    }
    return null;
  }, [formData.courseUuid, loadChapters]);

  const updateSubChapterAdapter = useCallback(async (chapterId: string, subChapterId: string, data: { title?: string; description?: string; order?: number }) => {
    if (!formData.courseUuid) return null;
    const res = await courseCreationApi.updateSubChapter(formData.courseUuid, chapterId, subChapterId, { title: data.title, description: data.description, order: data.order } as any);
    if (res.success) {
      setSubChapters(prev => prev.map(sc => sc.uuid === subChapterId ? res.data : sc));
      return res.data;
    }
    return null;
  }, [formData.courseUuid]);

  const deleteSubChapterAdapter = useCallback(async (chapterId: string, subChapterId: string) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.deleteSubChapter(formData.courseUuid, chapterId, subChapterId);
    if (res.success) {
      setSubChapters(prev => prev.filter(sc => sc.uuid !== subChapterId));
      return true;
    }
    return false;
  }, [formData.courseUuid]);

  const reorderSubChaptersAdapter = useCallback(async (chapterId: string, subChapterIds: string[]) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.reorderSubChapters(formData.courseUuid, chapterId, subChapterIds);
    return !!res.success;
  }, [formData.courseUuid]);

  const createContentAdapter = useCallback(async (chapterId: string, data: { type: 'video' | 'text' | 'image'; content: string; order: number; sub_chapter_id?: string; file?: File }) => {
    if (!formData.courseUuid) return null;
    const payload = {
      type: data.type,
      content: data.content,
      order: data.order,
      sub_chapter_id: data.sub_chapter_id || undefined,
      file: data.file || undefined
    };
    const res = await courseCreationApi.createContent(formData.courseUuid, chapterId, payload);
    if (res.success) {
      setContent(prev => [...prev, res.data]);
      // Reload chapters to ensure data consistency
      await loadChapters();
      return res.data;
    }
    return null;
  }, [formData.courseUuid, loadChapters]);

  const updateContentAdapter = useCallback(async (chapterId: string, contentId: string, data: { type?: 'video' | 'text' | 'image'; content?: string; order?: number; file?: File }) => {
    if (!formData.courseUuid) return null;
    const payload: any = {};
    if (data.type) payload.type = data.type;
    if (data.content !== undefined) payload.content = data.content;
    if (data.order !== undefined) payload.order = data.order;
    const res = await courseCreationApi.updateContent(formData.courseUuid, chapterId, contentId, payload);
    if (res.success) {
      setContent(prev => prev.map(c => c.uuid === contentId ? res.data : c));
      return res.data;
    }
    return null;
  }, [formData.courseUuid]);

  const deleteContentAdapter = useCallback(async (chapterId: string, contentId: string) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.deleteContent(formData.courseUuid, chapterId, contentId);
    if (res.success) {
      setContent(prev => prev.filter(c => c.uuid !== contentId));
      return true;
    }
    return false;
  }, [formData.courseUuid]);

  const reorderContentAdapter = useCallback(async (chapterId: string, contentIds: string[]) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.reorderContent(formData.courseUuid, chapterId, contentIds);
    return !!res.success;
  }, [formData.courseUuid]);

  const loadChapterEvaluations = useCallback(async (chapterId: string) => {
    if (!formData.courseUuid) return;
    try {
      const res = await courseCreationApi.getChapterEvaluations(formData.courseUuid, chapterId);
      if (res.success) {
        // Merge evaluations instead of replacing them
        setEvaluations(prev => {
          // Remove existing evaluations for this chapter
          const otherEvaluations = prev.filter(evaluation => evaluation.chapter_id !== chapterId);
          // Add new evaluations for this chapter, but avoid duplicates
          const newEvaluations = res.data.filter(newEval => 
            !otherEvaluations.some(existingEval => existingEval.uuid === newEval.uuid)
          );
          const merged = [...otherEvaluations, ...newEvaluations];
          return merged;
        });
      }
    } catch (e) {
      // Error loading evaluations:', e);
    }
  }, [formData.courseUuid]);

  const createEvaluationAdapter = useCallback(async (chapterId: string, data: { type: 'devoir' | 'examen'; title: string; description: string; due_date?: string; file?: File; sub_chapter_id?: string }) => {
    if (!formData.courseUuid) return null;
    const payload: any = { type: data.type, title: data.title, description: data.description };
    if (data.due_date) payload.due_date = data.due_date;
    if (data.sub_chapter_id) payload.sub_chapter_id = data.sub_chapter_id;
    const res = await courseCreationApi.createEvaluation(formData.courseUuid, chapterId, payload);
    if (res.success) {
      setEvaluations(prev => {
        // Check if evaluation already exists to avoid duplicates
        const exists = prev.some(existingEval => existingEval.uuid === res.data.uuid);
        if (exists) {
          return prev;
        }
        const updated = [...prev, res.data];
        return updated;
      });
      // Reload chapters to ensure data consistency
      await loadChapters();
      return res.data;
    }
    return null;
  }, [formData.courseUuid, loadChapters]);

  const updateEvaluationAdapter = useCallback(async (chapterId: string, evaluationId: string, data: { type?: 'devoir' | 'examen'; title?: string; description?: string; due_date?: string; file?: File }) => {
    if (!formData.courseUuid) return null;
    const payload: any = {};
    if (data.type) payload.type = data.type;
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.due_date !== undefined) payload.due_date = data.due_date;
    const res = await courseCreationApi.updateEvaluation(formData.courseUuid, chapterId, evaluationId, payload);
    if (res.success) {
      setEvaluations(prev => prev.map(e => e.uuid === evaluationId ? res.data : e));
      return res.data;
    }
    return null;
  }, [formData.courseUuid]);

  const deleteEvaluationAdapter = useCallback(async (chapterId: string, evaluationId: string) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.deleteEvaluation(formData.courseUuid, chapterId, evaluationId);
    if (res.success) {
      setEvaluations(prev => prev.filter(e => e.uuid !== evaluationId));
      return true;
    }
    return false;
  }, [formData.courseUuid]);

  const reorderEvaluationsAdapter = useCallback(async (chapterId: string, _evaluationIds: string[]) => {
    await loadChapterEvaluations(chapterId);
    return true;
  }, [loadChapterEvaluations]);

  const loadChapterSupportFiles = useCallback(async (chapterId: string) => {
    if (!formData.courseUuid) return;
    try {
      const res = await courseCreationApi.getChapterSupportFiles(formData.courseUuid, chapterId);
      if (res.success) {
        // Update support files in the appropriate chapter
        setChapters(prev => prev.map(chapter => 
          chapter.uuid === chapterId 
            ? { ...chapter, supportFiles: res.data || [] }
            : chapter
        ));
      }
    } catch (e) {
      // Error loading support files:', e);
    }
  }, [formData.courseUuid]);

  const uploadSupportFilesAdapter = useCallback(async (files: File[], chapterId: string, subChapterId?: string) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.uploadSupportFiles(formData.courseUuid, chapterId, files, subChapterId);
    if (res.success) {
      setSupportFiles(prev => [...prev, ...files]);
      // Reload support files for the chapter
      await loadChapterSupportFiles(chapterId);
      return true;
    }
    return false;
  }, [formData.courseUuid, loadChapterSupportFiles]);

  const deleteSupportFileAdapter = useCallback(async (chapterId: string, fileId: string) => {
    if (!formData.courseUuid) return false;
    const res = await courseCreationApi.deleteSupportFile(formData.courseUuid, chapterId, fileId);
    if (res.success) {
      return true;
    }
    return false;
  }, [formData.courseUuid]);
  const loadModules = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await courseCreationApi.getCourseModules(formData.courseUuid);
      if (result.success) {
        setModules(result.data);
      } else {
        setError('Failed to load modules');
      }
    } catch (error) {
      // Error loading modules:', error);
      setError('Error loading modules');
    } finally {
      setIsLoading(false);
    }
  }, [formData.courseUuid]);

  const createModule = useCallback(async (data: CreateModuleData): Promise<CourseModule | null> => {
    if (!formData.courseUuid) {
      // ('No course UUID available for creating module');
      return null;
    }
    try {
      // Creating module with data:', data);
      const result = await courseCreationApi.createModule(formData.courseUuid, {
        title: data.title,
        description: data.description,
        order: data.order_index
      });
      // Module creation result:', result);
      if (result.success) {
        setModules(prev => [...prev, result.data]);
        // Module created successfully:', result.data);
        return result.data;
      }
      // ('Module creation failed:', result);
      return null;
    } catch (error) {
      // Error creating module:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateModule = useCallback(async (uuid: string, data: UpdateModuleData): Promise<CourseModule | null> => {
    if (!formData.courseUuid) return null;
    try {
      // Filter out empty values to avoid validation errors
      const updateData: any = {};
      if (data.title && data.title.trim() !== '') {
        updateData.title = data.title;
      }
      if (data.description && data.description.trim() !== '') {
        updateData.description = data.description;
      }
      if (data.order_index !== undefined) {
        updateData.order = data.order_index;
      }
      
      const result = await courseCreationApi.updateModule(formData.courseUuid, uuid, updateData);
      if (result.success) {
        setModules(prev => prev.map(m => m.uuid === uuid ? result.data : m));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating module:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteModule = useCallback(async (uuid: string): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteModule(formData.courseUuid, uuid);
      if (result.success) {
        setModules(prev => prev.filter(m => m.uuid !== uuid));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting module:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const reorderModules = useCallback(async (moduleUuids: string[]): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.reorderModules(formData.courseUuid, moduleUuids);
      if (result.success) {
        loadModules();
        return true;
      }
      return false;
    } catch (error) {
      // Error reordering modules:', error);
      return false;
    }
  }, [formData.courseUuid, loadModules]);

  const loadObjectives = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getCourseObjectives(formData.courseUuid);
      if (result.success) setObjectives(result.data);
    } catch (error) {
      // Error loading objectives:', error);
    }
  }, [formData.courseUuid]);

  const createObjective = useCallback(async (data: CreateObjectiveData): Promise<CourseObjective | null> => {
    if (!formData.courseUuid) {
      // ('No course UUID available for creating objective');
      return null;
    }
    try {
      // Creating objective with data:', data);
      const result = await courseCreationApi.createObjective(formData.courseUuid, {
        title: data.title,
        description: data.description,
        order: data.order_index
      });
      // Objective creation result:', result);
      if (result.success) {
        setObjectives(prev => [...prev, result.data]);
        // Objective created successfully:', result.data);
        return result.data;
      }
      // ('Objective creation failed:', result);
      return null;
    } catch (error) {
      // Error creating objective:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateObjective = useCallback(async (uuid: string, data: UpdateObjectiveData): Promise<CourseObjective | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateObjective(formData.courseUuid, uuid, {
        title: data.title,
        description: data.description,
        order: data.order_index
      });
      if (result.success) {
        setObjectives(prev => prev.map(o => o.uuid === uuid ? result.data : o));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating objective:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteObjective = useCallback(async (uuid: string): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteObjective(formData.courseUuid, uuid);
      if (result.success) {
        setObjectives(prev => prev.filter(o => o.uuid !== uuid));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting objective:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const reorderObjectives = useCallback(async (objectiveUuids: string[]): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.reorderObjectives(formData.courseUuid, objectiveUuids);
      if (result.success) {
        loadObjectives();
        return true;
      }
      return false;
    } catch (error) {
      // Error reordering objectives:', error);
      return false;
    }
  }, [formData.courseUuid, loadObjectives]);

  const loadAdditionalFees = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getAdditionalFees(formData.courseUuid);
      if (result.success) setAdditionalFees(result.data);
    } catch (error) {
      // Error loading additional fees:', error);
    }
  }, [formData.courseUuid]);

  const createAdditionalFee = useCallback(async (data: CreateAdditionalFeeData): Promise<AdditionalFee | null> => {
    if (!formData.courseUuid) {
      // ('No course UUID available for creating additional fee');
      return null;
    }
    try {
      // Creating additional fee with data:', data);
      const result = await courseCreationApi.createAdditionalFee(formData.courseUuid, {
        name: data.name,
        amount: data.amount,
        description: data.description,
        order: data.order_index
      });
      // Additional fee creation result:', result);
      if (result.success) {
        setAdditionalFees(prev => [...prev, result.data]);
        // Additional fee created successfully:', result.data);
        return result.data;
      }
      // ('Additional fee creation failed:', result);
      return null;
    } catch (error) {
      // Error creating additional fee:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateAdditionalFee = useCallback(async (uuid: string, data: UpdateAdditionalFeeData): Promise<AdditionalFee | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateAdditionalFee(formData.courseUuid, uuid, {
        name: data.name,
        amount: data.amount,
        description: data.description,
        order: data.order_index
      });
      if (result.success) {
        setAdditionalFees(prev => prev.map(f => f.uuid === uuid ? result.data : f));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating additional fee:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteAdditionalFee = useCallback(async (uuid: string): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteAdditionalFee(formData.courseUuid, uuid);
      if (result.success) {
        setAdditionalFees(prev => prev.filter(f => f.uuid !== uuid));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting additional fee:', error);
      return false;
    }
  }, [formData.courseUuid]);


  const createChapter = useCallback(async (data: CreateChapterData): Promise<CourseChapter | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.createChapter(formData.courseUuid, {
        title: data.title,
        description: data.description,
        order: data.order_index
      });
      if (result.success) {
        setChapters(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating chapter:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateChapter = useCallback(async (id: string, data: UpdateChapterData): Promise<CourseChapter | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateChapter(formData.courseUuid, id, {
        title: data.title,
        description: data.description,
        order: data.order_index
      });
      if (result.success) {
        setChapters(prev => prev.map(c => c.uuid === id ? result.data : c));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating chapter:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteChapter = useCallback(async (id: string): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteChapter(formData.courseUuid, id);
      if (result.success) {
        setChapters(prev => prev.filter(c => c.uuid !== id));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting chapter:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const reorderChapters = useCallback(async (chapterIds: string[]): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.reorderChapters(formData.courseUuid, chapterIds);
      if (result.success) {
        loadChapters();
        return true;
      }
      return false;
    } catch (error) {
      // Error reordering chapters:', error);
      return false;
    }
  }, [formData.courseUuid, loadChapters]);

  const loadSubChapters = useCallback(async (chapterId: string) => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getSubChapters(formData.courseUuid, chapterId);
      if (result.success) setSubChapters(result.data);
    } catch (error) {
      // Error loading sub-chapters:', error);
    }
  }, [formData.courseUuid]);

  const createSubChapter = useCallback(async (data: CreateSubChapterData): Promise<SubChapter | null> => {
    if (!formData.courseUuid || !data.chapter_id) return null;
    try {
      const result = await courseCreationApi.createSubChapter(
        formData.courseUuid,
        String(data.chapter_id),
        {
          title: data.title!,
          description: data.description!,
          order: (data as any).order_index,
        } as any
      );
      if (result.success) {
        setSubChapters(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating sub-chapter:', error);
      return null;
    }
  }, [formData.courseUuid]);

  // Removed incorrect non-adapter updateSubChapter (use adapter version instead)

  // Removed incorrect non-adapter deleteSubChapter (use adapter version instead)

  // Removed incorrect non-adapter reorderSubChapters (use adapter version instead)

  const loadContent = useCallback(async (chapterId: number) => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getChapterContent(formData.courseUuid, chapterId.toString());
      if (result.success) setContent(result.data);
    } catch (error) {
      // Error loading content:', error);
    }
  }, [formData.courseUuid]);

  const createContent = useCallback(async (data: CreateContentData): Promise<CourseContent | null> => {
    if (!formData.courseUuid || !data.chapter_id) return null;
    try {
      const result = await courseCreationApi.createContent(
        formData.courseUuid,
        String(data.chapter_id),
        {
          type: data.type,
          content: data.content as any,
          order: (data as any).order_index,
          sub_chapter_id: (data as any).sub_chapter_id as any,
          file: (data as any).file,
        } as any
      );
      if (result.success) {
        setContent(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating content:', error);
      return null;
    }
  }, [formData.courseUuid]);

  // Removed incorrect non-adapter updateContent (use adapter version instead)

  // Removed incorrect non-adapter deleteContent (use adapter version instead)

  // Removed incorrect non-adapter reorderContent (use adapter version instead)

  const loadEvaluations = useCallback(async (chapterId: number) => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getChapterEvaluations(formData.courseUuid, chapterId.toString());
      if (result.success) setEvaluations(result.data);
    } catch (error) {
      // Error loading evaluations:', error);
    }
  }, [formData.courseUuid]);

  const createEvaluation = useCallback(async (data: CreateEvaluationData): Promise<Evaluation | null> => {
    if (!formData.courseUuid || !data.chapter_id) return null;
    try {
      const result = await courseCreationApi.createEvaluation(
        formData.courseUuid,
        String(data.chapter_id),
        {
          type: data.type as any,
          title: (data as any).title,
          description: (data as any).description,
          due_date: (data as any).due_date,
          sub_chapter_id: (data as any).sub_chapter_id as any,
        } as any
      );
      if (result.success) {
        setEvaluations(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating evaluation:', error);
      return null;
    }
  }, [formData.courseUuid]);

  // Removed incorrect non-adapter updateEvaluation (use adapter version instead)

  // Removed incorrect non-adapter deleteEvaluation (use adapter version instead)

  // Removed incorrect non-adapter reorderEvaluations (use adapter version instead)

  const uploadSupportFiles = useCallback(async (files: File[], chapterId: number, subChapterId?: number): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.uploadSupportFiles(formData.courseUuid, chapterId.toString(), files, subChapterId?.toString());
      if (result.success) {
        setSupportFiles(prev => [...prev, ...files]);
        return true;
      }
      return false;
    } catch (error) {
      // Error uploading support files:', error);
      return false;
    }
  }, [formData.courseUuid]);

  // Removed incorrect non-adapter deleteSupportFile (use adapter version instead)

  // Step 3 Actions
  const loadDocuments = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getCourseDocuments(formData.courseUuid);
      if (result.success) setDocuments(result.data);
    } catch (error) {
      // Error loading documents:', error);
    }
  }, [formData.courseUuid]);

  const createDocument = useCallback(async (data: CreateDocumentData): Promise<Document | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.createDocument(formData.courseUuid, {
        name: data.name,
        description: data.description,
        category: data.category,
        file: data.file,
        is_required: data.is_required
      });
      if (result.success) {
        setDocuments(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating document:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateDocument = useCallback(async (id: number, data: UpdateDocumentData): Promise<Document | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateDocument(formData.courseUuid, id.toString(), {
        name: data.name,
        description: data.description,
        category: data.category,
        is_required: data.is_required
      });
      if (result.success) {
        setDocuments(prev => prev.map(d => d.uuid === id.toString() ? result.data : d));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating document:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteDocument = useCallback(async (id: number): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteDocument(formData.courseUuid, id.toString());
      if (result.success) {
        setDocuments(prev => prev.filter(d => d.uuid !== id.toString()));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting document:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const loadCertificationModels = useCallback(async () => {
    try {
      const result = await courseCreationApi.getMyCertificationModels();
      if (result.success) setCertificationModels(result.data);
    } catch (error) {
      // Error loading certification models:', error);
    }
  }, []);

  const loadMyCertificationModels = useCallback(async () => {
    try {
      const result = await courseCreationApi.getMyCertificationModels();
      if (result.success) setCertificationModels(result.data);
    } catch (error) {
      // Error loading my certification models:', error);
    }
  }, []);

  const loadFormlyCertificationModels = useCallback(async () => {
    try {
      const result = await courseCreationApi.getFormlyCertificationModels();
      if (result.success) setCertificationModels(result.data);
    } catch (error) {
      // Error loading Formly certification models:', error);
    }
  }, []);

  const createCertificationModel = useCallback(async (data: CreateCertificationModelData): Promise<CertificationModel | null> => {
    try {
      const result = await courseCreationApi.createCertificationModel({
        name: data.name,
        description: data.description,
        file: data.file,
        is_template: data.is_template
      });
      if (result.success) {
        setCertificationModels(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating certification model:', error);
      return null;
    }
  }, []);

  const updateCertificationModel = useCallback(async (id: number, data: UpdateCertificationModelData): Promise<CertificationModel | null> => {
    try {
      const result = await courseCreationApi.updateCertificationModel(id.toString(), {
        name: data.name,
        description: data.description,
        is_template: data.is_template
      });
      if (result.success) {
        setCertificationModels(prev => prev.map(cm => cm.uuid === id.toString() ? result.data : cm));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating certification model:', error);
      return null;
    }
  }, []);

  const deleteCertificationModel = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await courseCreationApi.deleteCertificationModel(id.toString());
      if (result.success) {
        setCertificationModels(prev => prev.filter(cm => cm.uuid !== id.toString()));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting certification model:', error);
      return false;
    }
  }, []);

  const assignCertificationModel = useCallback(async (modelId: number): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.assignCertificationModel(formData.courseUuid, modelId.toString());
      if (result.success) {
        const model = certificationModels.find(cm => cm.uuid === modelId.toString());
        if (model) setSelectedCertification(model);
        return true;
      }
      return false;
    } catch (error) {
      // Error assigning certification model:', error);
      return false;
    }
  }, [formData.courseUuid, certificationModels]);

  // Step 4 Actions
  const loadQuestionnaires = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getCourseQuestionnaires(formData.courseUuid);
      if (result.success) setQuestionnaires(result.data);
    } catch (error) {
      // Error loading questionnaires:', error);
    }
  }, [formData.courseUuid]);

  const createQuestionnaire = useCallback(async (data: CreateQuestionnaireData): Promise<Questionnaire | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.createQuestionnaire(formData.courseUuid, {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type as any,
        questions: data.questions,
      });
      if (result.success) {
        setQuestionnaires(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating questionnaire:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateQuestionnaire = useCallback(async (id: string, data: UpdateQuestionnaireData): Promise<Questionnaire | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateQuestionnaire(formData.courseUuid, id, {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type as any,
        questions: data.questions,
      });
      if (result.success) {
        setQuestionnaires(prev => prev.map(q => q.uuid === id ? result.data : q));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating questionnaire:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteQuestionnaire = useCallback(async (id: number): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteQuestionnaire(formData.courseUuid, id.toString());
      if (result.success) {
        setQuestionnaires(prev => prev.filter(q => q.uuid !== id.toString()));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting questionnaire:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const duplicateQuestionnaire = useCallback(async (id: number): Promise<Questionnaire | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.duplicateQuestionnaire(formData.courseUuid, id.toString());
      if (result.success) {
        setQuestionnaires(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error duplicating questionnaire:', error);
      return null;
    }
  }, [formData.courseUuid]);

  // Questionnaire Questions Management
  const loadQuestions = useCallback(async (questionnaireId: string) => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getQuestions(formData.courseUuid, questionnaireId);
      if (result.success) {
        // Update the questionnaire with its questions
        setQuestionnaires(prev => prev.map(q => 
          q.uuid === questionnaireId 
            ? { ...q, questions: result.data || [] }
            : q
        ));
      }
    } catch (error) {
      // Error loading questions:', error);
    }
  }, [formData.courseUuid]);

  const createQuestion = useCallback(async (questionnaireId: string, data: any) => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.addQuestion(formData.courseUuid, questionnaireId, data);
      if (result.success) {
        await loadQuestions(questionnaireId); // Reload questions
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating question:', error);
      return null;
    }
  }, [formData.courseUuid, loadQuestions]);

  const updateQuestion = useCallback(async (questionnaireId: string, questionId: string, data: any) => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateQuestion(formData.courseUuid, questionnaireId, questionId, data);
      if (result.success) {
        await loadQuestions(questionnaireId); // Reload questions
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating question:', error);
      return null;
    }
  }, [formData.courseUuid, loadQuestions]);

  const deleteQuestion = useCallback(async (questionnaireId: string, questionId: string) => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteQuestion(formData.courseUuid, questionnaireId, questionId);
      if (result.success) {
        await loadQuestions(questionnaireId); // Reload questions
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting question:', error);
      return false;
    }
  }, [formData.courseUuid, loadQuestions]);

  const reorderQuestions = useCallback(async (questionnaireId: string, questionIds: string[]) => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.reorderQuestions(formData.courseUuid, questionnaireId, questionIds);
      if (result.success) {
        await loadQuestions(questionnaireId); // Reload questions
        return true;
      }
      return false;
    } catch (error) {
      // Error reordering questions:', error);
      return false;
    }
  }, [formData.courseUuid, loadQuestions]);

  const duplicateQuestion = useCallback(async (questionnaireId: string, questionId: string) => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.duplicateQuestion(formData.courseUuid, questionnaireId, questionId);
      if (result.success) {
        await loadQuestions(questionnaireId); // Reload questions
        return result.data;
      }
      return null;
    } catch (error) {
      // Error duplicating question:', error);
      return null;
    }
  }, [formData.courseUuid, loadQuestions]);

  // Step 5 Actions
  const loadTrainers = useCallback(async () => {
    try {
      const result = await courseCreationApi.getAllTrainers();
      if (result.success) {
        // According to documentation, result.data is an array of trainers
        setTrainers(result.data);
      }
    } catch (error) {
      // Error loading trainers:', error);
    }
  }, []);

  const loadCourseTrainers = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getCourseTrainers(formData.courseUuid);
      if (result.success) {
        // According to documentation, result.data is an array of course trainers with permissions
        // Course trainers API response:', result.data);
        setCourseTrainers(result.data);
      }
    } catch (error) {
      // Error loading course trainers:', error);
    }
  }, [formData.courseUuid]);

  const assignTrainer = useCallback(async (input: any): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      if (typeof input === 'number' || typeof input === 'string') {
        const result = await courseCreationApi.assignTrainer(formData.courseUuid, { trainer_id: String(input), permissions: { can_modify_course: true, can_manage_students: false, can_view_analytics: true } });
        if (result.success) { 
          await loadCourseTrainers(); 
          return true; 
        }
        return false;
      }
      const result = await courseCreationApi.assignTrainer(formData.courseUuid, input);
      if (result.success) { 
        await loadCourseTrainers(); 
        return true; 
      }
      return false;
    } catch (error) {
      // Error assigning trainer:', error);
      return false;
    }
  }, [formData.courseUuid, loadCourseTrainers]);

  const updateTrainerPermissions = useCallback(async (trainerId: number, permissions: any): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.updateTrainerPermissions(formData.courseUuid, trainerId.toString(), permissions);
      if (result.success) {
        loadCourseTrainers();
        return true;
      }
      return false;
    } catch (error) {
      // Error updating trainer permissions:', error);
      return false;
    }
  }, [formData.courseUuid, loadCourseTrainers]);

  const removeTrainer = useCallback(async (trainerId: string): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.removeTrainer(formData.courseUuid, trainerId);
      if (result.success) {
        setCourseTrainers(prev => prev.filter(ct => ct.trainer_id !== trainerId));
        await loadCourseTrainers(); // Reload to ensure consistency
        return true;
      }
      return false;
    } catch (error) {
      // Error removing trainer:', error);
      return false;
    }
  }, [formData.courseUuid, loadCourseTrainers]);

  const createTrainer = useCallback(async (data: CreateTrainerData): Promise<Trainer | null> => {
    try {
      const result = await courseCreationApi.createTrainer({
        name: data.name,
        email: data.email,
        phone: data.phone ?? undefined,
        specialization: data.specialization,
        experience_years: data.experience_years,
        description: data.description,
        competencies: data.competencies,
        avatar: data.avatar,
      });
      if (result.success) {
        setTrainers(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating trainer:', error);
      return null;
    }
  }, []);

  const updateTrainer = useCallback(async (id: number, data: UpdateTrainerData): Promise<Trainer | null> => {
    try {
      const result = await courseCreationApi.updateTrainer(id.toString(), {
        name: data.name,
        email: data.email,
        phone: data.phone ?? undefined,
        specialization: data.specialization,
        experience_years: data.experience_years,
        description: data.description,
        competencies: data.competencies,
        avatar: data.avatar,
      });
      if (result.success) {
        setTrainers(prev => prev.map(t => t.uuid === id.toString() ? result.data : t));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating trainer:', error);
      return null;
    }
  }, []);

  // Step 6 Actions
  const loadWorkflow = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getWorkflow(formData.courseUuid);
      if (result.success) {
        setWorkflow(result.data);
      } else {
        // 🔍 No workflow found for course, this is normal for new courses');
        setWorkflow(null);
      }
    } catch (error) {
      // Error loading workflow:', error);
      // Don't throw error, just set workflow to null for new courses
      setWorkflow(null);
    }
  }, [formData.courseUuid]);

  const createWorkflow = useCallback(async (data: CreateWorkflowData): Promise<Workflow | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.createWorkflow(formData.courseUuid, {
        name: data.name,
        description: data.description,
        is_active: data.is_active
      });
      if (result.success) {
        setWorkflow(result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating workflow:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateWorkflow = useCallback(async (_id: number, data: UpdateWorkflowData): Promise<Workflow | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateWorkflow(formData.courseUuid, {
        name: data.name,
        description: data.description,
        is_active: (data as any).is_active,
      });
      if (result.success) {
        setWorkflow(result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating workflow:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const toggleWorkflowStatus = useCallback(async (isActive: boolean): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.toggleWorkflowStatus(formData.courseUuid, isActive);
      if (result.success) {
        loadWorkflow();
        return true;
      }
      return false;
    } catch (error) {
      // Error toggling workflow status:', error);
      return false;
    }
  }, [formData.courseUuid, loadWorkflow]);

  const loadWorkflowActions = useCallback(async () => {
    if (!formData.courseUuid) return;
    try {
      const result = await courseCreationApi.getWorkflowActions(formData.courseUuid);
      if (result.success) setWorkflowActions(result.data);
    } catch (error) {
      // Error loading workflow actions:', error);
    }
  }, [formData.courseUuid]);

  const createWorkflowAction = useCallback(async (data: CreateWorkflowActionData): Promise<WorkflowAction | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.createWorkflowAction(formData.courseUuid, {
        title: (data as any).title || (data as any).name,
        type: data.type,
        recipient: (data as any).recipient || 'apprenant',
        config: data.config,
        order: data.order_index,
        is_active: data.is_active,
        timing: data.timing,
        scheduled_time: data.scheduled_time
      });
      if (result.success) {
        setWorkflowActions(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating workflow action:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const updateWorkflowAction = useCallback(async (id: number, data: UpdateWorkflowActionData): Promise<WorkflowAction | null> => {
    if (!formData.courseUuid) return null;
    try {
      const result = await courseCreationApi.updateWorkflowAction(formData.courseUuid, id.toString(), {
        title: (data as any).title || (data as any).name,
        type: data.type,
        recipient: (data as any).recipient,
        config: data.config,
        order: data.order_index,
        is_active: data.is_active,
        timing: data.timing,
        scheduled_time: data.scheduled_time
      });
      if (result.success) {
        setWorkflowActions(prev => prev.map(wa => wa.uuid === id.toString() ? result.data : wa));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating workflow action:', error);
      return null;
    }
  }, [formData.courseUuid]);

  const deleteWorkflowAction = useCallback(async (id: number): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.deleteWorkflowAction(formData.courseUuid, id.toString());
      if (result.success) {
        setWorkflowActions(prev => prev.filter(wa => wa.uuid !== id.toString()));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting workflow action:', error);
      return false;
    }
  }, [formData.courseUuid]);

  const reorderWorkflowActions = useCallback(async (actionIds: number[]): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.reorderWorkflowActions(formData.courseUuid, actionIds.map(id => id.toString()));
      if (result.success) {
        loadWorkflowActions();
        return true;
      }
      return false;
    } catch (error) {
      // Error reordering workflow actions:', error);
      return false;
    }
  }, [formData.courseUuid, loadWorkflowActions]);

  const toggleWorkflowAction = useCallback(async (id: number): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      const result = await courseCreationApi.toggleWorkflowAction(formData.courseUuid, id.toString(), true);
      if (result.success) {
        loadWorkflowActions();
        return true;
      }
      return false;
    } catch (error) {
      // Error toggling workflow action:', error);
      return false;
    }
  }, [formData.courseUuid, loadWorkflowActions]);

  const loadEmailTemplates = useCallback(async () => {
    try {
      const result = await courseCreationApi.getEmailTemplates();
      if (result.success) setEmailTemplates(result.data);
    } catch (error) {
      // Error loading email templates:', error);
    }
  }, []);

  const createEmailTemplate = useCallback(async (data: CreateEmailTemplateData): Promise<EmailTemplate | null> => {
    try {
      const result = await courseCreationApi.createEmailTemplate({
        name: data.name,
        subject: data.subject,
        body: data.body,
        placeholders: data.placeholders,
        is_default: (data as any).is_default ?? false,
      });
      if (result.success) {
        setEmailTemplates(prev => [...prev, result.data]);
        return result.data;
      }
      return null;
    } catch (error) {
      // Error creating email template:', error);
      return null;
    }
  }, []);

  const updateEmailTemplate = useCallback(async (id: number, data: UpdateEmailTemplateData): Promise<EmailTemplate | null> => {
    try {
      const result = await courseCreationApi.updateEmailTemplate(id.toString(), {
        name: data.name,
        subject: data.subject,
        body: data.body,
        placeholders: data.placeholders,
        is_default: (data as any).is_default,
      });
      if (result.success) {
        setEmailTemplates(prev => prev.map(et => et.uuid === id.toString() ? result.data : et));
        return result.data;
      }
      return null;
    } catch (error) {
      // Error updating email template:', error);
      return null;
    }
  }, []);

  const deleteEmailTemplate = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await courseCreationApi.deleteEmailTemplate(id.toString());
      if (result.success) {
        setEmailTemplates(prev => prev.filter(et => et.uuid !== id.toString()));
        return true;
      }
      return false;
    } catch (error) {
      // Error deleting email template:', error);
      return false;
    }
  }, []);

  // Utility Actions
  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    try {
      setIsSaving(true);
      const result = await courseCreationApi.updateCourseOverview(formData.courseUuid, formData);
      return result.success;
    } catch (error) {
      // Error saving draft:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

  const autoSave = useCallback(async (): Promise<boolean> => {
    if (!formData.courseUuid) return false;
    
    // Prevent multiple simultaneous auto-save calls
    if (isSaving) return false;
    
    try {
      setIsSaving(true);
      
      // Use specific endpoints for different field types
      const promises: Promise<any>[] = [];
      
      // 1. Basic course overview (title, subtitle, description, category, etc.)
      const overviewData = {
        title: formData.title || 'Nouveau cours',
        subtitle: formData.subtitle || 'Sous-titre du cours',
        description: formData.description || '',
        course_type: formData.course_type || 1,
        category_id: formData.category_id || 1,
        subcategory_id: formData.subcategory_id,
        course_language_id: formData.course_language_id,
        difficulty_level_id: formData.difficulty_level_id,
        intro_video_url: formData.intro_video_url || '',
        intro_image_url: formData.intro_image_url || '',
        isDraft: true,
        isPublished: false
      };
      promises.push(courseCreationApi.updateCourseOverview(formData.courseUuid, overviewData));
      
      // 2. Pricing information
      if (formData.price !== undefined || formData.price_ht !== undefined || formData.vat_percentage !== undefined || formData.currency !== undefined) {
        promises.push(updateCoursePricing({
          price: formData.price,
          price_ht: formData.price_ht,
          vat_percentage: formData.vat_percentage,
          currency: formData.currency
        }));
      }
      
      // 3. Duration information
      if (formData.duration !== undefined || formData.duration_days !== undefined) {
        const durationData: { duration?: number; duration_days?: number } = {};
        if (formData.duration !== undefined && formData.duration >= 0) {
          durationData.duration = formData.duration;
        }
        if (formData.duration_days !== undefined && formData.duration_days >= 0) {
          // Convert decimal days to integer days (round up to nearest day)
          durationData.duration_days = Math.ceil(formData.duration_days);
        }
        if (Object.keys(durationData).length > 0) {
          promises.push(updateCourseDuration(durationData));
        }
      }
      
      // 4. Target audience information
      if (formData.target_audience !== undefined || formData.prerequisites !== undefined || formData.tags !== undefined) {
        promises.push(updateCourseTargetAudience({
          target_audience: formData.target_audience,
          prerequisites: formData.prerequisites,
          tags: formData.tags
        }));
      }
      
      // 5. Learning outcomes
      if (formData.learningOutcomes !== undefined) {
        promises.push(updateCourseLearningOutcomes({
          learningOutcomes: formData.learningOutcomes
        }));
      }
      
      // 6. Teaching methods
      if (formData.methods !== undefined) {
        promises.push(updateCourseMethods({
          methods: formData.methods
        }));
      }
      
      // 7. Course specifics
      if (formData.specifics !== undefined) {
        promises.push(updateCourseSpecifics({
          specifics: formData.specifics
        }));
      }
      
      // 8. YouTube video
      if (formData.youtube_video_id !== undefined) {
        promises.push(updateCourseYouTubeVideo({
          youtube_video_id: formData.youtube_video_id
        }));
      }
      
      // Execute all updates in parallel
      const results = await Promise.allSettled(promises);
      
      // Check if all updates were successful and log failures
      const allSuccessful = results.every((result, index) => {
        if (result.status === 'rejected') {
          // (`🔍 Auto-save failed for promise ${index}:`, result.reason);
          return false;
        }
        if (result.status === 'fulfilled' && result.value === false) {
          // (`🔍 Auto-save returned false for promise ${index}`);
          return false;
        }
        return true;
      });
      
      
      return allSuccessful;
    } catch (error: any) {
      // Error auto-saving:', error);
      if (import.meta.env.DEV) {
        // ('🔍 Validation error details:', error.details);
        // ('🔍 Validation errors object:', JSON.stringify(error.details?.errors, null, 2));
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, isSaving, updateCoursePricing, updateCourseDuration, updateCourseTargetAudience, updateCourseLearningOutcomes, updateCourseMethods, updateCourseSpecifics, updateCourseYouTubeVideo]);

  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const initializeCourse = useCallback(async (courseUuid?: string) => {
    if (hasInitializedRef.current || isInitializingRef.current) return;
    isInitializingRef.current = true;
    try {
      let uuid = courseUuid || formData.courseUuid;
      if (!uuid) {
        const result = await courseCreationApi.createCourse({
          title: formData.title || 'Nouveau cours',
          description: formData.description || 'Brouillon du cours',
          category_id: formData.category_id || (categories && categories.length > 0 ? categories[0].id : 1),
          price: formData.price || 0,
          currency: formData.currency || 'EUR',
          isPublished: false,
          isDraft: true
        });
        if (result.success && result.data?.uuid) {
          uuid = result.data.uuid;
        } else {
          // ('🔍 Failed to create course:', result);
          return;
        }
      }

      updateFormData({ courseUuid: uuid });

      // Load existing course data if editing
      if (courseUuid) {
        try {
          const courseResult = await courseCreationApi.getCourse(courseUuid);
          if (courseResult.success) {
            const course = courseResult.data;
            updateFormData({
              title: course.title || '',
              subtitle: course.subtitle || 'Sous-titre du cours',
              description: course.description || '',
              course_type: course.course_type || 1,
              category_id: course.category_id,
              subcategory_id: course.subcategory_id,
              course_language_id: course.course_language_id,
              difficulty_level_id: course.difficulty_level_id,
              duration: course.duration || 0,
              duration_days: course.duration_days || 0,
              target_audience: course.target_audience || '',
              prerequisites: course.prerequisites || '',
              tags: course.tags || [],
              youtube_video_id: course.youtube_video_id || '',
              intro_video_url: course.video_url || '',
              intro_image_url: course.image_url || '',
              price: course.price || 0,
              price_ht: course.price_ht || 0,
              vat_percentage: course.vat_percentage || 20,
              currency: course.currency || 'EUR',
              learningOutcomes: course.learning_outcomes || [],
              methods: course.methods || '',
              specifics: course.specifics || '',
            });
          }
        } catch (error) {
          // Error loading existing course data:', error);
        }
      }

      await Promise.all([
        loadCategories(),
        loadModules(),
        loadObjectives(),
        loadAdditionalFees(),
        loadChapters(),
        loadDocuments(),
        loadCertificationModels(),
        loadQuestionnaires(),
        loadTrainers(),
        loadCourseTrainers(),
        loadWorkflow(),
        loadWorkflowActions(),
        loadEmailTemplates(),
      ]);
      hasInitializedRef.current = true;
    } catch (error) {
      // Error initializing course:', error);
    } finally {
      isInitializingRef.current = false;
    }
  }, [formData.courseUuid, updateFormData, loadCategories, loadModules, loadObjectives, loadAdditionalFees, loadChapters, loadDocuments, loadCertificationModels, loadQuestionnaires, loadTrainers, loadCourseTrainers, loadWorkflow, loadWorkflowActions, loadEmailTemplates, categories]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setModules([]);
    setObjectives([]);
    setAdditionalFees([]);
    setChapters([]);
    setSubChapters([]);
    setContent([]);
    setEvaluations([]);
    setSupportFiles([]);
    setDocuments([]);
    setCertificationModels([]);
    setSelectedCertification(null);
    setQuestionnaires([]);
    setTrainers([]);
    setCourseTrainers([]);
    setWorkflow(null);
    setWorkflowActions([]);
    setEmailTemplates([]);
  }, []);

  // Context Value
  const contextValue: CourseCreationContextType = {
    // Current Step
    currentStep,
    setCurrentStep,
    
    // Form Data
    formData,
    updateFormData,
    updateFormField,
    
    // Loading State
    isLoading,
    isSaving,
    
    // Error states
    error,
    clearError,
    
    // Step 1: Course Information
    categories,
    subcategories,
    languages,
    difficultyLevels,
    
    // Step 2: Content
    modules,
    objectives,
    additionalFees,
    chapters,
    subChapters,
    content,
    evaluations,
    supportFiles,
    
    // Step 3: Documents
    documents,
    certificationModels,
    selectedCertification,
    
    // Step 4: Questionnaire
    questionnaires,
    
    // Step 5: Trainers
    trainers,
    courseTrainers,
    
    // Step 6: Workflow
    workflow,
    workflowActions,
    emailTemplates,
    
    // Step 1 Actions
    loadCategories,
    loadSubcategories,
    loadLanguages,
    loadDifficultyLevels,
    uploadIntroVideo,
    uploadIntroImage,
    updateMediaUrls,
    deleteIntroVideo,
    deleteIntroImage,
    updateCoursePricing,
    updateCourseDuration,
    updateCourseTargetAudience,
    updateCourseLearningOutcomes,
    updateCourseMethods,
    updateCourseSpecifics,
    updateCourseYouTubeVideo,
    updateCourseStatus,
    updateFieldAndSave,
    
    // Step 2 Actions
    loadModules,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,

    loadObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
    reorderObjectives,

    loadAdditionalFees,
    createAdditionalFee,
    updateAdditionalFee,
    deleteAdditionalFee,

    loadChapters,
    createChapter: createChapterAdapter as any,
    updateChapter: updateChapterAdapter as any,
    deleteChapter: deleteChapterAdapter as any,
    reorderChapters: reorderChaptersAdapter as any,

    loadSubChapters,
    createSubChapter: createSubChapterAdapter as any,
    createSubChapterAdapter,
    updateSubChapter: updateSubChapterAdapter as any,
    updateSubChapterAdapter,
    deleteSubChapter: deleteSubChapterAdapter as any,
    deleteSubChapterAdapter,
    reorderSubChapters: reorderSubChaptersAdapter as any,

    loadContent: (chapterId: number) => loadContent(chapterId),
    loadChapterContent,
    createContent: createContentAdapter as any,
    createContentAdapter,
    updateContent: updateContentAdapter as any,
    updateContentAdapter,
    deleteContent: deleteContentAdapter as any,
    deleteContentAdapter,
    reorderContent: reorderContentAdapter as any,

    loadEvaluations: loadChapterEvaluations as any,
    loadChapterEvaluations,
    createEvaluation: createEvaluationAdapter as any,
    createEvaluationAdapter,
    updateEvaluation: updateEvaluationAdapter as any,
    updateEvaluationAdapter,
    deleteEvaluation: deleteEvaluationAdapter as any,
    deleteEvaluationAdapter,
    reorderEvaluations: reorderEvaluationsAdapter as any,

    loadChapterSupportFiles,
    uploadSupportFiles: uploadSupportFilesAdapter as any,
    uploadSupportFilesAdapter,
    deleteSupportFile: deleteSupportFileAdapter as any,
    deleteSupportFileAdapter,
    
    // Step 3 Actions
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    
    loadCertificationModels,
    loadMyCertificationModels,
    loadFormlyCertificationModels,
    createCertificationModel,
    updateCertificationModel,
    deleteCertificationModel,
    assignCertificationModel,
    
    // Step 4 Actions
    loadQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    duplicateQuestionnaire,
    
    // Questionnaire Questions
    loadQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    duplicateQuestion,
    
    // Step 5 Actions
    loadTrainers,
    loadCourseTrainers,
    assignTrainer,
    updateTrainerPermissions,
    removeTrainer,
    createTrainer,
    updateTrainer,
    
    // Step 6 Actions
    loadWorkflow,
    createWorkflow,
    updateWorkflow,
    toggleWorkflowStatus,
    
    loadWorkflowActions,
    createWorkflowAction,
    updateWorkflowAction,
    deleteWorkflowAction,
    reorderWorkflowActions,
    toggleWorkflowAction,
    
    loadEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    
    // Utility Actions
    saveDraft,
    autoSave,
    initializeCourse,
    resetForm,
  };

  // Validate that all required methods are defined
  const validateContextValue = (value: CourseCreationContextType) => {
    const requiredMethods = [
      'setCurrentStep', 'updateFormData', 'updateFormField', 'clearError',
      'loadCategories', 'loadSubcategories', 'createModule', 'updateModule', 'deleteModule',
      'createObjective', 'updateObjective', 'deleteObjective', 'createAdditionalFee',
      'loadChapters', 'createChapter', 'updateChapter', 'deleteChapter',
      'loadContent', 'createContent', 'updateContent', 'deleteContent',
      'loadEvaluations', 'createEvaluation', 'updateEvaluation', 'deleteEvaluation',
      'loadDocuments', 'createDocument', 'updateDocument', 'deleteDocument',
      'loadQuestionnaires', 'createQuestionnaire', 'updateQuestionnaire', 'deleteQuestionnaire',
      'loadTrainers', 'loadCourseTrainers', 'assignTrainer', 'removeTrainer',
      'loadWorkflow', 'createWorkflow', 'updateWorkflow',
      'loadWorkflowActions', 'createWorkflowAction', 'updateWorkflowAction', 'deleteWorkflowAction',
      'loadEmailTemplates', 'createEmailTemplate', 'updateEmailTemplate', 'deleteEmailTemplate',
      'saveDraft', 'autoSave', 'initializeCourse'
    ];
    
    const missingMethods = requiredMethods.filter(method => typeof value[method as keyof CourseCreationContextType] !== 'function');
    if (missingMethods.length > 0) {
      // ('Missing required methods in context value:', missingMethods);
    }
    
    return value;
  };

  return (
    <CourseCreationContext.Provider value={validateContextValue(contextValue)}>
      {children}
    </CourseCreationContext.Provider>
  );
};

// Hook to use the context
export const useCourseCreation = (): CourseCreationContextType => {
  const context = useContext(CourseCreationContext);
  if (context === undefined) {
    // ('CourseCreationContext is undefined. Make sure the component is wrapped in CourseCreationProvider.');
    throw new Error('useCourseCreation must be used within a CourseCreationProvider');
  }
  return context;
};