// This file contains the remaining step implementations for CourseCreationContext
// Due to length constraints, these are separated from the main context file

import { courseCreationApi, SubChapter, CourseContent, Evaluation, SupportFile, Document, CertificationModel, Questionnaire, Question, Trainer, CourseTrainer, Workflow, WorkflowAction, EmailTemplate } from '../services/courseCreationApi';

// Step 2: Content Management Extensions
export const createStep2Actions = (courseUuid: string | null, handleApiCall: any, updateFormField: any) => ({
  // Sub-Chapters
  loadSubChapters: async (chapterId: string): Promise<SubChapter[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getSubChapters(courseUuid, chapterId),
      undefined,
      'Failed to load sub-chapters'
    );
    return result?.data || [];
  },

  createSubChapter: async (chapterId: string, data: { title: string; description: string; order: number }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createSubChapter(courseUuid, chapterId, data),
      'Sub-chapter created successfully',
      'Failed to create sub-chapter'
    );
    if (result) {
      // Reload chapters to get updated sub-chapters
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  updateSubChapter: async (chapterId: string, subChapterId: string, data: { title?: string; description?: string; order?: number }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateSubChapter(courseUuid, chapterId, subChapterId, data),
      'Sub-chapter updated successfully',
      'Failed to update sub-chapter'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  deleteSubChapter: async (chapterId: string, subChapterId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteSubChapter(courseUuid, chapterId, subChapterId),
      'Sub-chapter deleted successfully',
      'Failed to delete sub-chapter'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  reorderSubChapters: async (chapterId: string, subChapterIds: string[]) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.reorderSubChapters(courseUuid, chapterId, subChapterIds),
      'Sub-chapters reordered successfully',
      'Failed to reorder sub-chapters'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  // Content Management
  loadChapterContent: async (chapterId: string): Promise<CourseContent[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getChapterContent(courseUuid, chapterId),
      undefined,
      'Failed to load chapter content'
    );
    return result?.data || [];
  },

  loadSubChapterContent: async (chapterId: string, subChapterId: string): Promise<CourseContent[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getSubChapterContent(courseUuid, chapterId, subChapterId),
      undefined,
      'Failed to load sub-chapter content'
    );
    return result?.data || [];
  },

  createContent: async (chapterId: string, data: { type: 'video' | 'text' | 'image'; content: string; file?: File; order: number; sub_chapter_id?: string }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createContent(courseUuid, chapterId, data),
      'Content created successfully',
      'Failed to create content'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  updateContent: async (chapterId: string, contentId: string, data: { type?: 'video' | 'text' | 'image'; content?: string; file?: File; order?: number }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateContent(courseUuid, chapterId, contentId, data),
      'Content updated successfully',
      'Failed to update content'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  deleteContent: async (chapterId: string, contentId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteContent(courseUuid, chapterId, contentId),
      'Content deleted successfully',
      'Failed to delete content'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  reorderContent: async (chapterId: string, contentIds: string[]) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.reorderContent(courseUuid, chapterId, contentIds),
      'Content reordered successfully',
      'Failed to reorder content'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  // Evaluations
  loadChapterEvaluations: async (chapterId: string): Promise<Evaluation[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getChapterEvaluations(courseUuid, chapterId),
      undefined,
      'Failed to load chapter evaluations'
    );
    return result?.data || [];
  },

  loadSubChapterEvaluations: async (chapterId: string, subChapterId: string): Promise<Evaluation[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getSubChapterEvaluations(courseUuid, chapterId, subChapterId),
      undefined,
      'Failed to load sub-chapter evaluations'
    );
    return result?.data || [];
  },

  createEvaluation: async (chapterId: string, data: { type: 'devoir' | 'examen'; title: string; description: string; due_date?: string; file?: File; sub_chapter_id?: string }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createEvaluation(courseUuid, chapterId, data),
      'Evaluation created successfully',
      'Failed to create evaluation'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  updateEvaluation: async (chapterId: string, evaluationId: string, data: { type?: 'devoir' | 'examen'; title?: string; description?: string; due_date?: string; file?: File }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateEvaluation(courseUuid, chapterId, evaluationId, data),
      'Evaluation updated successfully',
      'Failed to update evaluation'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  deleteEvaluation: async (chapterId: string, evaluationId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteEvaluation(courseUuid, chapterId, evaluationId),
      'Evaluation deleted successfully',
      'Failed to delete evaluation'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  // Support Files
  loadChapterSupportFiles: async (chapterId: string): Promise<SupportFile[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getChapterSupportFiles(courseUuid, chapterId),
      undefined,
      'Failed to load chapter support files'
    );
    return result?.data || [];
  },

  loadSubChapterSupportFiles: async (chapterId: string, subChapterId: string): Promise<SupportFile[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getSubChapterSupportFiles(courseUuid, chapterId, subChapterId),
      undefined,
      'Failed to load sub-chapter support files'
    );
    return result?.data || [];
  },

  uploadSupportFiles: async (chapterId: string, files: File[], subChapterId?: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.uploadSupportFiles(courseUuid, chapterId, files, subChapterId),
      'Support files uploaded successfully',
      'Failed to upload support files'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },

  deleteSupportFile: async (chapterId: string, fileId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteSupportFile(courseUuid, chapterId, fileId),
      'Support file deleted successfully',
      'Failed to delete support file'
    );
    if (result) {
      const chaptersResult = await courseCreationApi.getCourseChapters(courseUuid);
      if (chaptersResult.success) {
        updateFormField('chapters', chaptersResult.data);
      }
    }
  },
});

// Step 3: Documents Extensions
export const createStep3Actions = (courseUuid: string | null, handleApiCall: any, updateFormField: any, setDocuments: any, setCertificationModels: any) => ({
  loadDocuments: async (category?: 'apprenant' | 'formateur' | 'entreprise') => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.getCourseDocuments(courseUuid, category),
      undefined,
      'Failed to load documents'
    );
    if (result) {
      setDocuments(result.data);
      updateFormField('documents', result.data);
    }
  },

  createDocument: async (data: { name: string; description: string; category: 'apprenant' | 'formateur' | 'entreprise'; file: File; is_required: boolean }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createDocument(courseUuid, data),
      'Document created successfully',
      'Failed to create document'
    );
    if (result) {
      await createStep3Actions(courseUuid, handleApiCall, updateFormField, setDocuments, setCertificationModels).loadDocuments();
    }
  },

  updateDocument: async (documentId: string, data: { name?: string; description?: string; category?: 'apprenant' | 'formateur' | 'entreprise'; file?: File; is_required?: boolean }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateDocument(courseUuid, documentId, data),
      'Document updated successfully',
      'Failed to update document'
    );
    if (result) {
      await createStep3Actions(courseUuid, handleApiCall, updateFormField, setDocuments, setCertificationModels).loadDocuments();
    }
  },

  deleteDocument: async (documentId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteDocument(courseUuid, documentId),
      'Document deleted successfully',
      'Failed to delete document'
    );
    if (result) {
      await createStep3Actions(courseUuid, handleApiCall, updateFormField, setDocuments, setCertificationModels).loadDocuments();
    }
  },

  assignCertificationModel: async (certificationModelId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.assignCertificationModel(courseUuid, certificationModelId),
      'Certification model assigned successfully',
      'Failed to assign certification model'
    );
    if (result) {
      updateFormField('certification_model_id', certificationModelId);
    }
  },

  loadCertificationModels: async () => {
    const result = await handleApiCall(
      () => courseCreationApi.getAllCertificationModels(),
      undefined,
      'Failed to load certification models'
    );
    if (result) {
      setCertificationModels(result.data);
    }
  },

  loadMyCertificationModels: async () => {
    const result = await handleApiCall(
      () => courseCreationApi.getMyCertificationModels(),
      undefined,
      'Failed to load my certification models'
    );
    if (result) {
      setCertificationModels(result.data);
    }
  },

  loadFormlyCertificationModels: async () => {
    const result = await handleApiCall(
      () => courseCreationApi.getFormlyCertificationModels(),
      undefined,
      'Failed to load Formly certification models'
    );
    if (result) {
      setCertificationModels(result.data);
    }
  },

  createCertificationModel: async (data: { name: string; description: string; file: File; is_template: boolean }) => {
    const result = await handleApiCall(
      () => courseCreationApi.createCertificationModel(data),
      'Certification model created successfully',
      'Failed to create certification model'
    );
    if (result) {
      await createStep3Actions(courseUuid, handleApiCall, updateFormField, setDocuments, setCertificationModels).loadCertificationModels();
    }
  },

  updateCertificationModel: async (modelId: string, data: { name?: string; description?: string; file?: File; is_template?: boolean }) => {
    const result = await handleApiCall(
      () => courseCreationApi.updateCertificationModel(modelId, data),
      'Certification model updated successfully',
      'Failed to update certification model'
    );
    if (result) {
      await createStep3Actions(courseUuid, handleApiCall, updateFormField, setDocuments, setCertificationModels).loadCertificationModels();
    }
  },

  deleteCertificationModel: async (modelId: string) => {
    const result = await handleApiCall(
      () => courseCreationApi.deleteCertificationModel(modelId),
      'Certification model deleted successfully',
      'Failed to delete certification model'
    );
    if (result) {
      await createStep3Actions(courseUuid, handleApiCall, updateFormField, setDocuments, setCertificationModels).loadCertificationModels();
    }
  },
});

// Step 4: Questionnaires Extensions
export const createStep4Actions = (courseUuid: string | null, handleApiCall: any, updateFormField: any, setQuestionnaires: any) => ({
  loadQuestionnaires: async (category?: 'apprenant' | 'formateur' | 'entreprise') => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.getCourseQuestionnaires(courseUuid, category),
      undefined,
      'Failed to load questionnaires'
    );
    if (result) {
      setQuestionnaires(result.data);
      updateFormField('questionnaires', result.data);
    }
  },

  createQuestionnaire: async (data: { title: string; description: string; category: 'apprenant' | 'formateur' | 'entreprise'; type: 'survey' | 'evaluation' | 'feedback'; questions: any[] }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createQuestionnaire(courseUuid, data),
      'Questionnaire created successfully',
      'Failed to create questionnaire'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  updateQuestionnaire: async (questionnaireId: string, data: { title?: string; description?: string; category?: 'apprenant' | 'formateur' | 'entreprise'; type?: 'survey' | 'evaluation' | 'feedback'; questions?: any[] }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateQuestionnaire(courseUuid, questionnaireId, data),
      'Questionnaire updated successfully',
      'Failed to update questionnaire'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  deleteQuestionnaire: async (questionnaireId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteQuestionnaire(courseUuid, questionnaireId),
      'Questionnaire deleted successfully',
      'Failed to delete questionnaire'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  duplicateQuestionnaire: async (questionnaireId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.duplicateQuestionnaire(courseUuid, questionnaireId),
      'Questionnaire duplicated successfully',
      'Failed to duplicate questionnaire'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  loadQuestions: async (questionnaireId: string, params?: { per_page?: number; search?: string }): Promise<Question[]> => {
    if (!courseUuid) return [];
    const result = await handleApiCall(
      () => courseCreationApi.getQuestions(courseUuid, questionnaireId, params),
      undefined,
      'Failed to load questions'
    );
    return result?.data || [];
  },

  addQuestion: async (questionnaireId: string, data: { type: 'multiple_choice' | 'true_false' | 'text' | 'rating'; question: string; options?: string[]; correct_answer?: string | boolean; required: boolean; order: number }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.addQuestion(courseUuid, questionnaireId, data),
      'Question added successfully',
      'Failed to add question'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  updateQuestion: async (questionnaireId: string, questionId: string, data: { type?: 'multiple_choice' | 'true_false' | 'text' | 'rating'; question?: string; options?: string[]; correct_answer?: string | boolean; required?: boolean; order?: number }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateQuestion(courseUuid, questionnaireId, questionId, data),
      'Question updated successfully',
      'Failed to update question'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  deleteQuestion: async (questionnaireId: string, questionId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteQuestion(courseUuid, questionnaireId, questionId),
      'Question deleted successfully',
      'Failed to delete question'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  reorderQuestions: async (questionnaireId: string, questionIds: string[]) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.reorderQuestions(courseUuid, questionnaireId, questionIds),
      'Questions reordered successfully',
      'Failed to reorder questions'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },

  duplicateQuestion: async (questionnaireId: string, questionId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.duplicateQuestion(courseUuid, questionnaireId, questionId),
      'Question duplicated successfully',
      'Failed to duplicate question'
    );
    if (result) {
      await createStep4Actions(courseUuid, handleApiCall, updateFormField, setQuestionnaires).loadQuestionnaires();
    }
  },
});

// Step 5: Trainers Extensions
export const createStep5Actions = (courseUuid: string | null, handleApiCall: any, updateFormField: any, setTrainers: any, setCourseTrainers: any) => ({
  loadCourseTrainers: async () => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.getCourseTrainers(courseUuid),
      undefined,
      'Failed to load course trainers'
    );
    if (result) {
      setCourseTrainers(result.data);
      updateFormField('trainers', result.data);
    }
  },

  assignTrainer: async (data: { trainer_id: string; permissions: { can_modify_course: boolean; can_manage_students: boolean; can_view_analytics: boolean } }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.assignTrainer(courseUuid, data),
      'Trainer assigned successfully',
      'Failed to assign trainer'
    );
    if (result) {
      await createStep5Actions(courseUuid, handleApiCall, updateFormField, setTrainers, setCourseTrainers).loadCourseTrainers();
    }
  },

  updateTrainerPermissions: async (trainerId: string, permissions: { can_modify_course: boolean; can_manage_students: boolean; can_view_analytics: boolean }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateTrainerPermissions(courseUuid, trainerId, permissions),
      'Trainer permissions updated successfully',
      'Failed to update trainer permissions'
    );
    if (result) {
      await createStep5Actions(courseUuid, handleApiCall, updateFormField, setTrainers, setCourseTrainers).loadCourseTrainers();
    }
  },

  removeTrainer: async (trainerId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.removeTrainer(courseUuid, trainerId),
      'Trainer removed successfully',
      'Failed to remove trainer'
    );
    if (result) {
      await createStep5Actions(courseUuid, handleApiCall, updateFormField, setTrainers, setCourseTrainers).loadCourseTrainers();
    }
  },

  loadTrainers: async (params?: { search?: string }) => {
    const result = await handleApiCall(
      () => courseCreationApi.getAllTrainers(params),
      undefined,
      'Failed to load trainers'
    );
    if (result) {
      setTrainers(result.data);
    }
  },

  searchTrainers: async (query: string) => {
    const result = await handleApiCall(
      () => courseCreationApi.searchTrainers(query),
      undefined,
      'Failed to search trainers'
    );
    if (result) {
      setTrainers(result.data);
    }
  },

  getTrainerDetails: async (trainerId: string): Promise<Trainer> => {
    const result = await handleApiCall(
      () => courseCreationApi.getTrainerDetails(trainerId),
      undefined,
      'Failed to get trainer details'
    );
    return result?.data || ({} as Trainer);
  },

  createTrainer: async (data: { name: string; email: string; phone?: string; specialization?: string; experience_years: number; description?: string; competencies: string[]; avatar?: File }) => {
    const result = await handleApiCall(
      () => courseCreationApi.createTrainer(data),
      'Trainer created successfully',
      'Failed to create trainer'
    );
    if (result) {
      await createStep5Actions(courseUuid, handleApiCall, updateFormField, setTrainers, setCourseTrainers).loadTrainers();
    }
  },

  updateTrainer: async (trainerId: string, data: { name?: string; email?: string; phone?: string; specialization?: string; experience_years?: number; description?: string; competencies?: string[]; avatar?: File }) => {
    const result = await handleApiCall(
      () => courseCreationApi.updateTrainer(trainerId, data),
      'Trainer updated successfully',
      'Failed to update trainer'
    );
    if (result) {
      await createStep5Actions(courseUuid, handleApiCall, updateFormField, setTrainers, setCourseTrainers).loadTrainers();
    }
  },
});

// Step 6: Workflow Extensions
export const createStep6Actions = (courseUuid: string | null, handleApiCall: any, updateFormField: any, setWorkflow: any, setWorkflowActions: any, setEmailTemplates: any) => ({
  loadWorkflow: async () => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.getWorkflow(courseUuid),
      undefined,
      'Failed to load workflow'
    );
    if (result) {
      setWorkflow(result.data);
      updateFormField('workflow', result.data);
    }
  },

  createWorkflow: async (data: { name: string; description: string; is_active: boolean }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createWorkflow(courseUuid, data),
      'Workflow created successfully',
      'Failed to create workflow'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflow();
    }
  },

  updateWorkflow: async (data: { name?: string; description?: string; is_active?: boolean }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateWorkflow(courseUuid, data),
      'Workflow updated successfully',
      'Failed to update workflow'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflow();
    }
  },

  toggleWorkflowStatus: async (isActive: boolean) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.toggleWorkflowStatus(courseUuid, isActive),
      'Workflow status updated successfully',
      'Failed to update workflow status'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflow();
    }
  },

  loadWorkflowActions: async () => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.getWorkflowActions(courseUuid),
      undefined,
      'Failed to load workflow actions'
    );
    if (result) {
      setWorkflowActions(result.data);
      updateFormField('workflow_actions', result.data);
    }
  },

  createWorkflowAction: async (data: { title: string; type: 'email' | 'notification' | 'document' | 'assignment' | 'reminder' | 'certificate' | 'payment' | 'enrollment' | 'completion' | 'feedback' | 'meeting' | 'resource'; recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin'; timing?: string; scheduled_time?: string; is_active: boolean; order: number; config: any }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.createWorkflowAction(courseUuid, data),
      'Workflow action created successfully',
      'Failed to create workflow action'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflowActions();
    }
  },

  updateWorkflowAction: async (actionId: string, data: { title?: string; type?: 'email' | 'notification' | 'document' | 'assignment' | 'reminder' | 'certificate' | 'payment' | 'enrollment' | 'completion' | 'feedback' | 'meeting' | 'resource'; recipient?: 'formateur' | 'apprenant' | 'entreprise' | 'admin'; timing?: string; scheduled_time?: string; is_active?: boolean; order?: number; config?: any }) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.updateWorkflowAction(courseUuid, actionId, data),
      'Workflow action updated successfully',
      'Failed to update workflow action'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflowActions();
    }
  },

  deleteWorkflowAction: async (actionId: string) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.deleteWorkflowAction(courseUuid, actionId),
      'Workflow action deleted successfully',
      'Failed to delete workflow action'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflowActions();
    }
  },

  reorderWorkflowActions: async (actionIds: string[]) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.reorderWorkflowActions(courseUuid, actionIds),
      'Workflow actions reordered successfully',
      'Failed to reorder workflow actions'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflowActions();
    }
  },

  toggleWorkflowAction: async (actionId: string, isActive: boolean) => {
    if (!courseUuid) return;
    const result = await handleApiCall(
      () => courseCreationApi.toggleWorkflowAction(courseUuid, actionId, isActive),
      'Workflow action status updated successfully',
      'Failed to update workflow action status'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadWorkflowActions();
    }
  },

  loadEmailTemplates: async () => {
    const result = await handleApiCall(
      () => courseCreationApi.getEmailTemplates(),
      undefined,
      'Failed to load email templates'
    );
    if (result) {
      setEmailTemplates(result.data);
    }
  },

  createEmailTemplate: async (data: { name: string; subject: string; body: string; placeholders: string[]; is_default: boolean }) => {
    const result = await handleApiCall(
      () => courseCreationApi.createEmailTemplate(data),
      'Email template created successfully',
      'Failed to create email template'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadEmailTemplates();
    }
  },

  updateEmailTemplate: async (templateId: string, data: { name?: string; subject?: string; body?: string; placeholders?: string[]; is_default?: boolean }) => {
    const result = await handleApiCall(
      () => courseCreationApi.updateEmailTemplate(templateId, data),
      'Email template updated successfully',
      'Failed to update email template'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadEmailTemplates();
    }
  },

  deleteEmailTemplate: async (templateId: string) => {
    const result = await handleApiCall(
      () => courseCreationApi.deleteEmailTemplate(templateId),
      'Email template deleted successfully',
      'Failed to delete email template'
    );
    if (result) {
      await createStep6Actions(courseUuid, handleApiCall, updateFormField, setWorkflow, setWorkflowActions, setEmailTemplates).loadEmailTemplates();
    }
  },
});
