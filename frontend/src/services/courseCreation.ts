import { apiService } from './api';

// Types kept minimal at service layer; richer shapes live in context/models
export type UUID = string;

export interface CreateCoursePayload {
  title: string;
  description?: string;
  category_id?: number | null;
  price: number;
  currency: string;
  isDraft: boolean;
  isPublished: boolean;
  course_type?: string;
  subtitle?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  og_image?: File | string;
}

class CourseCreationService {
  private orgCoursesBase = '/api/organization/courses';
  private ccBase = '/api/organization/course-creation';
  private base = '/api/organization';

  // 4) Courses CRUD + metadata
  getCreationMetadata() {
    return apiService.get(`${this.orgCoursesBase}/metadata`);
  }

  getSubcategories(categoryId: number) {
    return apiService.get(`${this.orgCoursesBase}/subcategories/${categoryId}`);
  }

  createSubcategory(categoryId: number, data: { name: string; description?: string }) {
    return apiService.post(`${this.orgCoursesBase}/subcategories`, {
      category_id: categoryId,
      name: data.name,
      description: data.description
    });
  }

  // Custom categories management
  getCategories(params?: { include_custom?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.include_custom !== undefined) {
      queryParams.append('include_custom', params.include_custom.toString());
    }
    const qs = queryParams.toString();
    return apiService.get(`${this.orgCoursesBase}/categories${qs ? `?${qs}` : ''}`);
  }

  createCustomCategory(data: { name: string; description?: string }) {
    return apiService.post(`${this.orgCoursesBase}/categories/custom`, data);
  }

  updateCustomCategory(categoryId: number, data: { name: string; description?: string }) {
    return apiService.put(`${this.orgCoursesBase}/categories/custom/${categoryId}`, data);
  }

  deleteCustomCategory(categoryId: number) {
    return apiService.delete(`${this.orgCoursesBase}/categories/custom/${categoryId}`);
  }

  // Formation practices management
  getFormationPractices() {
    return apiService.get('/api/courses/formation-practices');
  }

  getCourseFormationPractices(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/formation-practices`);
  }

  updateCourseFormationPractices(courseUuid: UUID, practiceIds: number[]) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/formation-practices`, {
      practice_ids: practiceIds
    });
  }

  getCourses(params?: { per_page?: number; page?: number; search?: string; status?: number; category?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.category) queryParams.append('category', params.category.toString());
    const qs = queryParams.toString();
    return apiService.get(`${this.orgCoursesBase}${qs ? `?${qs}` : ''}`);
  }

  createCourse(data: CreateCoursePayload) {
    return apiService.post(`${this.orgCoursesBase}`, data);
  }

  getCourseDetails(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}`);
  }

  // Generic update course - combines multiple update endpoints
  async updateCourse(courseUuid: UUID, data: any) {
    const promises = [];
    
    // Update overview (title, description, subtitle) - only send non-empty fields
    const overviewData: any = {};
    if (data.title && data.title.trim()) overviewData.title = data.title.trim();
    if (data.description && data.description.trim()) overviewData.description = data.description.trim();
    if (data.subtitle && data.subtitle.trim()) overviewData.subtitle = data.subtitle.trim();
    
    // Add course_type if provided, or use default
    if (data.course_type) {
      overviewData.course_type = data.course_type;
    } else {
      // Default to 'standard' if not provided
      overviewData.course_type = 'standard';
    }
    
    if (Object.keys(overviewData).length > 0) {
      console.log('🔵 Updating overview:', overviewData);
      promises.push(this.updateCourseOverview(courseUuid, overviewData));
    }
    
    // Update pricing
    if (data.price_ht !== undefined && data.price_ht !== null && data.price_ht !== '') {
      console.log('🔵 Updating pricing:', data.price_ht);
      promises.push(this.updateCoursePricing(courseUuid, {
        price_ht: parseFloat(data.price_ht)
      }));
    }
    
    // Update duration
    if (data.duration !== undefined && data.duration !== null && data.duration > 0) {
      console.log('🔵 Updating duration:', data.duration);
      promises.push(this.updateCourseDuration(courseUuid, {
        duration: data.duration
      }));
    }
    
    // Update target audience - only send non-empty fields
    const audienceData: any = {};
    if (data.target_audience && data.target_audience.trim()) audienceData.target_audience = data.target_audience.trim();
    if (data.prerequisites && data.prerequisites.trim()) audienceData.prerequisites = data.prerequisites.trim();
    
    if (Object.keys(audienceData).length > 0) {
      console.log('🔵 Updating audience:', audienceData);
      promises.push(this.updateCourseTargetAudience(courseUuid, audienceData));
    }
    
    // Update methods
    if (data.methods && data.methods.trim()) {
      console.log('🔵 Updating methods:', data.methods);
      promises.push(this.updateCourseMethods(courseUuid, {
        methods: data.methods.trim()
      }));
    }
    
    // Update objectives
    if (data.objectives && Array.isArray(data.objectives)) {
      console.log('🔵 Updating objectives:', data.objectives);
      // For now, skip objectives update - needs proper sync logic
    }
    
    // Update modules
    if (data.modules && Array.isArray(data.modules)) {
      console.log('🔵 Updating modules:', data.modules);
      // For now, skip modules update - needs proper sync logic
    }
    
    try {
      if (promises.length === 0) {
        console.log('⚠️ No data to update');
        return { success: true, message: 'No changes to save' };
      }
      
      console.log(`🔵 Executing ${promises.length} update(s)...`);
      await Promise.all(promises);
      console.log('✅ Course updated successfully');
      return { success: true, message: 'Course updated successfully' };
    } catch (err: any) {
      console.error('❌ Error updating course:', err);
      throw err;
    }
  }

  getCourseCreationData(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/creation-data`);
  }

  updateCourseOverview(courseUuid: UUID, data: any) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/overview`, data);
  }

  updateCourseCategory(courseUuid: UUID, data: any) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/category`, data);
  }

  updateCourseStatus(courseUuid: UUID, status: number) {
    return apiService.patch(`${this.orgCoursesBase}/${courseUuid}/status`, { status });
  }

  // Additional course fields
  updateCoursePricing(courseUuid: UUID, data: { price?: number; price_ht?: number; vat_percentage?: number; currency?: string }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/pricing`, data);
  }

  updateCourseDuration(courseUuid: UUID, data: { duration?: number; duration_days?: number }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/duration`, data);
  }

  updateCourseTargetAudience(courseUuid: UUID, data: { target_audience?: string; prerequisites?: string; tags?: string[] }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/audience`, data);
  }

  updateCourseLearningOutcomes(courseUuid: UUID, data: { learningOutcomes?: string[] }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/learning-outcomes`, data);
  }

  updateCourseMethods(courseUuid: UUID, data: { methods?: string }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/methods`, data);
  }

  updateCourseSpecifics(courseUuid: UUID, data: { specifics?: string }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/specifics`, data);
  }

  updateCourseAdditionalInfo(courseUuid: UUID, data: { 
    evaluation_modalities?: string; 
    access_modalities?: string; 
    accessibility?: string; 
    contacts?: string; 
    update_date?: string;
  }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/additional-info`, data);
  }

  updateCourseYouTubeVideo(courseUuid: UUID, data: { youtube_video_id?: string }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/youtube-video`, data);
  }

  // Get course details (alias for getCourseDetails)
  getCourse(courseUuid: UUID) {
    return this.getCourseDetails(courseUuid);
  }

  // 10.1 Modules
  getModules(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/modules`);
  }
  createModule(courseUuid: UUID, data: { title: string; description?: string; order: number }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/modules`, data);
  }
  updateModule(courseUuid: UUID, moduleId: string, data: { title?: string; description?: string; order?: number }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/modules/${moduleId}`, data);
  }
  deleteModule(courseUuid: UUID, moduleId: string) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/modules/${moduleId}`);
  }
  reorderModules(courseUuid: UUID, moduleIds: string[]) {
    return apiService.patch(`${this.orgCoursesBase}/${courseUuid}/modules/reorder`, { module_ids: moduleIds });
  }

  // 10.2 Objectives
  getObjectives(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/objectives`);
  }
  createObjective(courseUuid: UUID, data: { title: string; description?: string; order: number }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/objectives`, data);
  }
  updateObjective(courseUuid: UUID, objectiveId: string, data: { title?: string; description?: string; order?: number }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/objectives/${objectiveId}`, data);
  }
  deleteObjective(courseUuid: UUID, objectiveId: string) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/objectives/${objectiveId}`);
  }
  reorderObjectives(courseUuid: UUID, objectiveIds: string[]) {
    return apiService.patch(`${this.orgCoursesBase}/${courseUuid}/objectives/reorder`, { objective_ids: objectiveIds });
  }

  // 10.3 Additional Fees
  getAdditionalFees(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/additional-fees`);
  }
  createAdditionalFee(courseUuid: UUID, data: { name: string; amount: number; description?: string; order: number }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/additional-fees`, data);
  }
  updateAdditionalFee(courseUuid: UUID, feeId: string, data: { name?: string; amount?: number; description?: string; order?: number }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/additional-fees/${feeId}`, data);
  }
  deleteAdditionalFee(courseUuid: UUID, feeId: string) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/additional-fees/${feeId}`);
  }

  // 10.4 Media
  uploadIntroVideo(courseUuid: UUID, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/media/intro-video`, formData);
  }
  uploadIntroImage(courseUuid: UUID, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/media/intro-image`, formData);
  }
  updateMediaUrls(courseUuid: UUID, data: { intro_video_url?: string; intro_image_url?: string }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/media/urls`, data);
  }
  deleteIntroVideo(courseUuid: UUID) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/media/intro-video`);
  }
  deleteIntroImage(courseUuid: UUID) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/media/intro-image`);
  }

  // 10.5 Chapters
  getChapters(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters`);
  }
  createChapter(courseUuid: UUID, data: { title: string; description?: string; order: number }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/chapters`, data);
  }
  updateChapter(courseUuid: UUID, chapterId: string, data: { title?: string; description?: string; order?: number }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}`, data);
  }
  deleteChapter(courseUuid: UUID, chapterId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}`);
  }
  reorderChapters(courseUuid: UUID, chapterIds: string[]) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/chapters/reorder`, { chapter_ids: chapterIds });
  }

  // 10.6 Sub-chapters
  getSubChapters(courseUuid: UUID, chapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters`);
  }
  createSubChapter(courseUuid: UUID, chapterId: string, data: { title: string; description?: string; order: number }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters`, data);
  }
  updateSubChapter(courseUuid: UUID, chapterId: string, subChapterId: string, data: { title?: string; description?: string; order?: number }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters/${subChapterId}`, data);
  }
  deleteSubChapter(courseUuid: UUID, chapterId: string, subChapterId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters/${subChapterId}`);
  }
  reorderSubChapters(courseUuid: UUID, chapterId: string, subChapterIds: string[]) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters/reorder`, { sub_chapter_ids: subChapterIds });
  }

  // 10.7 Content (chapter and sub-chapter mirror)
  getChapterContent(courseUuid: UUID, chapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/content`);
  }
  getSubChapterContent(courseUuid: UUID, chapterId: string, subChapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters/${subChapterId}/content`);
  }
  createContent(courseUuid: UUID, chapterId: string, data: { type: 'video' | 'text' | 'image'; title?: string; content?: string; file?: File; order: number; sub_chapter_id?: string }) {
    const formData = new FormData();
    formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', String(data.content));
    if (data.file) formData.append('file', data.file);
    formData.append('order', String(data.order));
    if (data.sub_chapter_id !== null && data.sub_chapter_id !== undefined) formData.append('sub_chapter_id', data.sub_chapter_id);
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/content`, formData);
  }
  updateContent(courseUuid: UUID, chapterId: string, contentId: string, data: { type?: 'video' | 'text' | 'image'; title?: string; content?: string; file?: File; order?: number }) {
    const formData = new FormData();
    if (data.type) formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', String(data.content));
    if (data.file) formData.append('file', data.file);
    if (data.order !== undefined) formData.append('order', String(data.order));
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/content/${contentId}`, formData);
  }
  deleteContent(courseUuid: UUID, chapterId: string, contentId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/content/${contentId}`);
  }
  reorderContent(courseUuid: UUID, chapterId: string, contentIds: string[]) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/content/reorder`, { content_ids: contentIds });
  }

  // 10.8 Evaluations
  getChapterEvaluations(courseUuid: UUID, chapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/evaluations`);
  }
  getSubChapterEvaluations(courseUuid: UUID, chapterId: string, subChapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters/${subChapterId}/evaluations`);
  }
  createEvaluation(courseUuid: UUID, chapterId: string, data: { type: 'devoir' | 'examen'; title: string; description: string; due_date?: string | null; file?: File | null; sub_chapter_id?: string | null }) {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.due_date) formData.append('due_date', data.due_date);
    if (data.sub_chapter_id !== null && data.sub_chapter_id !== undefined) formData.append('sub_chapter_id', data.sub_chapter_id);
    if (data.file) formData.append('file', data.file);
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/evaluations`, formData);
  }
  updateEvaluation(courseUuid: UUID, chapterId: string, evaluationId: string, data: { type?: 'devoir' | 'examen'; title?: string; description?: string; due_date?: string; file?: File }) {
    const formData = new FormData();
    if (data.type) formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.due_date) formData.append('due_date', data.due_date);
    if (data.file) formData.append('file', data.file);
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/evaluations/${evaluationId}`, formData);
  }
  deleteEvaluation(courseUuid: UUID, chapterId: string, evaluationId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/evaluations/${evaluationId}`);
  }

  // 10.9 Support files
  getChapterSupportFiles(courseUuid: UUID, chapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/support-files`);
  }
  getSubChapterSupportFiles(courseUuid: UUID, chapterId: string, subChapterId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/sub-chapters/${subChapterId}/support-files`);
  }
  uploadSupportFiles(courseUuid: UUID, chapterId: string, files: File[], subChapterId?: string) {
    const formData = new FormData();
    files.forEach(f => formData.append('files[]', f));
    if (subChapterId) formData.append('sub_chapter_id', subChapterId);
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/support-files`, formData);
  }
  deleteSupportFile(courseUuid: UUID, chapterId: string, fileId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/chapters/${chapterId}/support-files/${fileId}`);
  }

  // Additional methods for Step 2 content management
  getCourseModules(courseUuid: UUID) {
    return this.getModules(courseUuid);
  }
  
  getCourseObjectives(courseUuid: UUID) {
    return this.getObjectives(courseUuid);
  }
  
  getCourseChapters(courseUuid: UUID) {
    return this.getChapters(courseUuid);
  }

  // 10.10 Documents
  getCourseDocuments(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/documents`);
  }
  createDocument(courseUuid: UUID, data: { name: string; description?: string; category: 'apprenant' | 'formateur' | 'entreprise'; file: File; is_required: boolean }) {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('file', data.file);
    formData.append('is_required', data.is_required ? '1' : '0'); // Laravel expects '1' or '0' for boolean fields
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/documents`, formData);
  }
  updateDocument(courseUuid: UUID, documentId: string, data: { name?: string; description?: string; category?: 'apprenant' | 'formateur' | 'entreprise'; file?: File; is_required?: boolean }) {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.file) formData.append('file', data.file);
    if (data.is_required !== undefined) formData.append('is_required', data.is_required ? '1' : '0'); // Laravel expects '1' or '0' for boolean fields
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/documents/${documentId}`, formData);
  }
  deleteDocument(courseUuid: UUID, documentId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/documents/${documentId}`);
  }
  assignCertificationModel(courseUuid: UUID, certificationModelId: string) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/certification-model`, { certification_model_id: certificationModelId });
  }

  // 10.11 Questionnaires
  getCourseQuestionnaires(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/questionnaires`);
  }
  createQuestionnaire(courseUuid: UUID, data: any) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires`, data);
  }
  updateQuestionnaire(courseUuid: UUID, questionnaireId: string, data: any) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}`, data);
  }
  deleteQuestionnaire(courseUuid: UUID, questionnaireId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}`);
  }
  duplicateQuestionnaire(courseUuid: UUID, questionnaireId: string) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/duplicate`);
  }

  // Questionnaire questions
  getQuestions(courseUuid: UUID, questionnaireId: string, params?: { per_page?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    if (params?.search) queryParams.append('search', params.search);
    const qs = queryParams.toString();
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/questions${qs ? `?${qs}` : ''}`);
  }
  addQuestion(courseUuid: UUID, questionnaireId: string, data: any) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/questions`, data);
  }
  updateQuestion(courseUuid: UUID, questionnaireId: string, questionId: string, data: any) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/questions/${questionId}`, data);
  }
  deleteQuestion(courseUuid: UUID, questionnaireId: string, questionId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/questions/${questionId}`);
  }
  reorderQuestions(courseUuid: UUID, questionnaireId: string, questionIds: string[]) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/questions/reorder`, { question_ids: questionIds });
  }
  duplicateQuestion(courseUuid: UUID, questionnaireId: string, questionId: string) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/questions/${questionId}/duplicate`);
  }

  // 10.12 Trainers per course
  getCourseTrainers(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/trainers`);
  }
  assignTrainer(courseUuid: UUID, data: { trainer_id: string; permissions: { can_modify_course: boolean; can_manage_students: boolean; can_view_analytics: boolean } }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/trainers`, data);
  }
  updateTrainerPermissions(courseUuid: UUID, trainerId: string, permissions: { can_modify_course: boolean; can_manage_students: boolean; can_view_analytics: boolean }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/trainers/${trainerId}`, { permissions });
  }
  removeTrainer(courseUuid: UUID, trainerId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/trainers/${trainerId}`);
  }

  // 10.12 Global trainers directory
  getAllTrainers(params?: { search?: string; per_page?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    const qs = queryParams.toString();
    return apiService.get(`${this.base}/trainers${qs ? `?${qs}` : ''}`);
  }
  searchTrainers(query: string, per_page?: number) {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    if (per_page) queryParams.append('per_page', String(per_page));
    return apiService.get(`${this.ccBase}/courses/trainers/search?${queryParams.toString()}`);
  }
  getTrainerDetails(trainerId: string) {
    return apiService.get(`${this.ccBase}/trainers/${trainerId}`);
  }
  createTrainer(data: FormData | { name: string; email: string; phone?: string; specialization?: string; experience_years: number; description?: string; competencies: string[]; avatar?: File }) {
    if (data instanceof FormData) return apiService.post(`${this.ccBase}/trainers`, data);
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('email', data.email);
    fd.append('experience_years', String(data.experience_years));
    fd.append('competencies', JSON.stringify(data.competencies));
    if (data.phone) fd.append('phone', data.phone);
    if (data.specialization) fd.append('specialization', data.specialization);
    if (data.description) fd.append('description', data.description);
    if (data.avatar) fd.append('avatar', data.avatar);
    return apiService.post(`${this.ccBase}/trainers`, fd);
  }
  updateTrainer(trainerId: string, data: FormData | { name?: string; email?: string; phone?: string; specialization?: string; experience_years?: number; description?: string; competencies?: string[]; avatar?: File }) {
    if (data instanceof FormData) return apiService.put(`${this.ccBase}/trainers/${trainerId}`, data);
    const fd = new FormData();
    if (data.name) fd.append('name', data.name);
    if (data.email) fd.append('email', data.email);
    if (data.phone) fd.append('phone', data.phone);
    if (data.specialization) fd.append('specialization', data.specialization);
    if (data.experience_years !== undefined) fd.append('experience_years', String(data.experience_years));
    if (data.description) fd.append('description', data.description);
    if (data.competencies) fd.append('competencies', JSON.stringify(data.competencies));
    if (data.avatar) fd.append('avatar', data.avatar);
    return apiService.put(`${this.ccBase}/trainers/${trainerId}`, fd);
  }

  // 10.13 Workflow
  getWorkflow(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow`);
  }
  createWorkflow(courseUuid: UUID, data: { name: string; description?: string; is_active: boolean }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/workflow`, data);
  }
  updateWorkflow(courseUuid: UUID, data: { name?: string; description?: string; is_active?: boolean }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/workflow`, data);
  }
  toggleWorkflowStatus(courseUuid: UUID, is_active: boolean) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/workflow/toggle`, { is_active });
  }

  // Workflow actions
  getWorkflowActions(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/actions`);
  }
  createWorkflowAction(courseUuid: UUID, data: { title: string; type: string; recipient: string; timing?: string; scheduled_time?: string; is_active: boolean; execution_order: number; config: any }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/workflow/actions`, data);
  }
  updateWorkflowAction(courseUuid: UUID, actionId: string, data: { title?: string; type?: string; recipient?: string; timing?: string; scheduled_time?: string; is_active?: boolean; execution_order?: number; config?: any }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/workflow/actions/${actionId}`, data);
  }
  deleteWorkflowAction(courseUuid: UUID, actionId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/workflow/actions/${actionId}`);
  }
  reorderWorkflowActions(courseUuid: UUID, actionIds: string[]) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/workflow/actions/reorder`, { action_ids: actionIds });
  }
  toggleWorkflowAction(courseUuid: UUID, actionId: string, is_active: boolean) {
    return apiService.patch(`${this.ccBase}/courses/${courseUuid}/workflow/actions/${actionId}/toggle`, { is_active });
  }

  // Global: Certification models
  getAllCertificationModels() {
    return apiService.get(`${this.ccBase}/certification-models`);
  }
  getMyCertificationModels() {
    return apiService.get(`${this.base}/certification-models`);
  }
  getFormlyCertificationModels() {
    return apiService.get(`${this.ccBase}/certification-models/formly-models`);
  }
  createCertificationModel(data: { name: string; description?: string; file: File; is_template: boolean }) {
    const fd = new FormData();
    fd.append('name', data.name);
    if (data.description) fd.append('description', data.description);
    fd.append('file', data.file);
    fd.append('is_template', data.is_template ? '1' : '0'); // Laravel expects '1' or '0' for boolean fields
    return apiService.post(`${this.ccBase}/certification-models`, fd);
  }
  updateCertificationModel(modelId: string, data: { name?: string; description?: string; file?: File; is_template?: boolean }) {
    const fd = new FormData();
    if (data.name) fd.append('name', data.name);
    if (data.description) fd.append('description', data.description);
    if (data.file) fd.append('file', data.file);
    if (data.is_template !== undefined) fd.append('is_template', data.is_template ? '1' : '0'); // Laravel expects '1' or '0' for boolean fields
    return apiService.put(`${this.ccBase}/certification-models/${modelId}`, fd);
  }
  deleteCertificationModel(modelId: string) {
    return apiService.delete(`${this.ccBase}/certification-models/${modelId}`);
  }

  // Email Templates (Global)
  getEmailTemplates() {
    return apiService.get(`${this.base}/email-templates`);
  }
  createEmailTemplate(data: { name: string; subject: string; body: string; placeholders: string[]; is_default: boolean }) {
    return apiService.post(`${this.ccBase}/email-templates`, data);
  }
  updateEmailTemplate(templateId: string, data: { name?: string; subject?: string; body?: string; placeholders?: string[]; is_default?: boolean }) {
    return apiService.put(`${this.ccBase}/email-templates/${templateId}`, data);
  }
  deleteEmailTemplate(templateId: string) {
    return apiService.delete(`${this.ccBase}/email-templates/${templateId}`);
  }

  // ==================== ENHANCED DOCUMENT TEMPLATES API ====================

  // Super Admin Document Templates
  getDocumentTemplates() {
    return apiService.get('/api/admin/document-templates');
  }
  createDocumentTemplate(data: { name: string; description?: string; category: string; template_type: string; file: File; variables?: any }) {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('template_type', data.template_type);
    formData.append('file', data.file);
    if (data.variables) formData.append('variables', JSON.stringify(data.variables));
    return apiService.post('/api/admin/document-templates', formData);
  }
  getDocumentTemplate(uuid: string) {
    return apiService.get(`/api/admin/document-templates/${uuid}`);
  }
  updateDocumentTemplate(uuid: string, data: { name?: string; description?: string; category?: string; template_type?: string; file?: File; variables?: any }) {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.template_type) formData.append('template_type', data.template_type);
    if (data.file) formData.append('file', data.file);
    if (data.variables) formData.append('variables', JSON.stringify(data.variables));
    return apiService.put(`/api/admin/document-templates/${uuid}`, formData);
  }
  deleteDocumentTemplate(uuid: string) {
    return apiService.delete(`/api/admin/document-templates/${uuid}`);
  }
  uploadDocumentTemplate(uuid: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`/api/admin/document-templates/${uuid}/upload`, formData);
  }

  // Organization Document Templates
  getOrganizationDocumentTemplates() {
    return apiService.get('/api/organization/document-templates');
  }
  createOrganizationDocumentTemplate(data: { name: string; description?: string; category: string; template_type: string; file: File; variables?: any }) {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('template_type', data.template_type);
    formData.append('file', data.file);
    if (data.variables) formData.append('variables', JSON.stringify(data.variables));
    return apiService.post('/api/organization/document-templates', formData);
  }
  getOrganizationDocumentTemplate(uuid: string) {
    return apiService.get(`/api/organization/document-templates/${uuid}`);
  }
  updateOrganizationDocumentTemplate(uuid: string, data: { name?: string; description?: string; category?: string; template_type?: string; file?: File; variables?: any }) {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.template_type) formData.append('template_type', data.template_type);
    if (data.file) formData.append('file', data.file);
    if (data.variables) formData.append('variables', JSON.stringify(data.variables));
    return apiService.put(`/api/organization/document-templates/${uuid}`, formData);
  }
  deleteOrganizationDocumentTemplate(uuid: string) {
    return apiService.delete(`/api/organization/document-templates/${uuid}`);
  }
  uploadOrganizationDocumentTemplate(uuid: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`/api/organization/document-templates/${uuid}/upload`, formData);
  }

  // Document Generation
  generateDocumentFromTemplate(courseUuid: UUID, templateId: string, variables: any) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/documents/generate`, { template_id: templateId, variables });
  }
  getAvailableDocumentTemplates(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/documents/templates`);
  }
  regenerateDocument(courseUuid: UUID, documentId: string, variables: any) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/documents/${documentId}/regenerate`, { variables });
  }

  // ==================== ENHANCED QUESTIONNAIRE API ====================

  // Questionnaire Templates
  getQuestionnaireTemplates() {
    return apiService.get('/api/admin/questionnaire-templates');
  }
  createQuestionnaireTemplate(data: { name: string; description?: string; category: string; target_audience: string[]; questions: any[] }) {
    return apiService.post('/api/admin/questionnaire-templates', data);
  }
  getQuestionnaireTemplate(uuid: string) {
    return apiService.get(`/api/admin/questionnaire-templates/${uuid}`);
  }
  updateQuestionnaireTemplate(uuid: string, data: { name?: string; description?: string; category?: string; target_audience?: string[]; questions?: any[] }) {
    return apiService.put(`/api/admin/questionnaire-templates/${uuid}`, data);
  }
  deleteQuestionnaireTemplate(uuid: string) {
    return apiService.delete(`/api/admin/questionnaire-templates/${uuid}`);
  }

  // Enhanced Questionnaire Management
  getAvailableQuestionnaireTemplates() {
    return apiService.get('/api/organization/questionnaire-templates');
  }
  createQuestionnaireFromTemplate(courseUuid: UUID, templateId: string, customizations?: any) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/from-template`, { template_id: templateId, customizations });
  }

  // CSV Import/Export
  importQuestionnaireFromCSV(courseUuid: UUID, file: File, settings?: any) {
    const formData = new FormData();
    formData.append('file', file);
    if (settings) formData.append('settings', JSON.stringify(settings));
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/import-csv`, formData);
  }
  getQuestionnaireImportTemplates(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/questionnaires/import-templates`);
  }
  exportQuestionnaireToCSV(courseUuid: UUID, questionnaireId: string) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/export-csv`);
  }

  // Questionnaire Responses
  getQuestionnaireResponses(courseUuid: UUID, questionnaireId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/responses`);
  }
  submitQuestionnaireResponse(courseUuid: UUID, questionnaireId: string, data: { user_type: string; responses: any }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/responses`, data);
  }
  getQuestionnaireAnalytics(courseUuid: UUID, questionnaireId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/questionnaires/${questionnaireId}/analytics`);
  }

  // ==================== ENHANCED WORKFLOW API ====================

  // Workflow Triggers
  getWorkflowTriggers(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/triggers`);
  }
  createWorkflowTrigger(courseUuid: UUID, data: { trigger_name: string; trigger_event: string; trigger_conditions: any; is_active: boolean }) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/workflow/triggers`, data);
  }
  getWorkflowTrigger(courseUuid: UUID, triggerId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/triggers/${triggerId}`);
  }
  updateWorkflowTrigger(courseUuid: UUID, triggerId: string, data: { trigger_name?: string; trigger_event?: string; trigger_conditions?: any; is_active?: boolean }) {
    return apiService.put(`${this.ccBase}/courses/${courseUuid}/workflow/triggers/${triggerId}`, data);
  }
  deleteWorkflowTrigger(courseUuid: UUID, triggerId: string) {
    return apiService.delete(`${this.ccBase}/courses/${courseUuid}/workflow/triggers/${triggerId}`);
  }
  testWorkflowTrigger(courseUuid: UUID, triggerId: string) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/workflow/triggers/${triggerId}/test`);
  }

  // Enhanced Email Templates
  previewEmailTemplate(templateId: string, variables?: any) {
    return apiService.post(`/api/organization/email-templates/${templateId}/preview`, { variables });
  }

  // Notification Templates
  getNotificationTemplates() {
    return apiService.get('/api/organization/notification-templates');
  }
  createNotificationTemplate(data: { name: string; title: string; message: string; notification_type: string; placeholders?: any }) {
    return apiService.post('/api/organization/notification-templates', data);
  }
  getNotificationTemplate(uuid: string) {
    return apiService.get(`/api/organization/notification-templates/${uuid}`);
  }
  updateNotificationTemplate(uuid: string, data: { name?: string; title?: string; message?: string; notification_type?: string; placeholders?: any }) {
    return apiService.put(`/api/organization/notification-templates/${uuid}`, data);
  }
  deleteNotificationTemplate(uuid: string) {
    return apiService.delete(`/api/organization/notification-templates/${uuid}`);
  }

  // Workflow Execution
  getWorkflowExecutions(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/executions`);
  }
  executeWorkflowManually(courseUuid: UUID, data?: any) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/workflow/execute`, data);
  }
  getWorkflowExecution(courseUuid: UUID, executionId: string) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/executions/${executionId}`);
  }
  retryWorkflowExecution(courseUuid: UUID, executionId: string) {
    return apiService.post(`${this.ccBase}/courses/${courseUuid}/workflow/executions/${executionId}/retry`);
  }

  // Workflow Analytics
  getWorkflowAnalytics(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/analytics`);
  }
  getWorkflowPerformance(courseUuid: UUID) {
    return apiService.get(`${this.ccBase}/courses/${courseUuid}/workflow/performance`);
  }

  // ==================== NEW: ENHANCED COURSE STRUCTURE API ====================

  // Course Sections (above chapters)
  getSections(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/sections`);
  }
  createSection(courseUuid: UUID, data: { title: string; description?: string; order: number; is_published: boolean }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/sections`, data);
  }
  updateSection(courseUuid: UUID, sectionId: number, data: { title?: string; description?: string; order?: number; is_published?: boolean }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/sections/${sectionId}`, data);
  }
  deleteSection(courseUuid: UUID, sectionId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/sections/${sectionId}`);
  }
  reorderSections(courseUuid: UUID, sections: Array<{ id: number; order: number }>) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/sections/reorder`, { sections });
  }

  // Enhanced Chapters (with section support)
  createChapterEnhanced(courseUuid: UUID, data: { course_section_id?: number; title: string; description?: string; order_index: number; is_published: boolean }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/chapters`, data);
  }
  updateChapterEnhanced(courseUuid: UUID, chapterUuid: string, data: { title?: string; description?: string; order_index?: number; is_published?: boolean; course_section_id?: number | null }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}`, data);
  }
  deleteChapterEnhanced(courseUuid: UUID, chapterUuid: string) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}`);
  }

  // Sub-Chapters Enhanced
  getSubChaptersEnhanced(courseUuid: UUID, chapterUuid: string) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}/sub-chapters`);
  }
  createSubChapterEnhanced(courseUuid: UUID, chapterUuid: string, data: { title: string; description?: string; order_index: number; is_published: boolean }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}/sub-chapters`, data);
  }
  updateSubChapterEnhanced(courseUuid: UUID, chapterUuid: string, subChapterUuid: string, data: { title?: string; description?: string; order_index?: number; is_published?: boolean }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}/sub-chapters/${subChapterUuid}`, data);
  }
  deleteSubChapterEnhanced(courseUuid: UUID, chapterUuid: string, subChapterUuid: string) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}/sub-chapters/${subChapterUuid}`);
  }

  // Content Items (video/text/image/file/audio)
  getContentItems(courseUuid: UUID, subChapterUuid: string) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/content`);
  }
  createContentItem(courseUuid: UUID, subChapterUuid: string, data: FormData) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/content`, data);
  }
  updateContentItem(courseUuid: UUID, subChapterUuid: string, contentId: number, data: FormData) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/content/${contentId}`, data);
  }
  deleteContentItem(courseUuid: UUID, subChapterUuid: string, contentId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/content/${contentId}`);
  }
  reorderContentItems(courseUuid: UUID, subChapterUuid: string, items: Array<{ id: number; order: number }>) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/content/reorder`, { items });
  }

  // Quiz Associations
  getChapterQuizzes(courseUuid: UUID, chapterUuid: string) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/chapters/${chapterUuid}/quizzes`);
  }

  // Assignments
  getAssignments(courseUuid: UUID, subChapterUuid: string) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/assignments`);
  }
  createAssignment(courseUuid: UUID, subChapterUuid: string, data: FormData) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/assignments`, data);
  }
  updateAssignment(courseUuid: UUID, subChapterUuid: string, assignmentId: number, data: FormData) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/assignments/${assignmentId}`, data);
  }
  deleteAssignment(courseUuid: UUID, subChapterUuid: string, assignmentId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/assignments/${assignmentId}`);
  }

  // Support Items
  getSupportItems(courseUuid: UUID, subChapterUuid: string) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/support`);
  }
  createSupportItem(courseUuid: UUID, subChapterUuid: string, data: FormData) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/support`, data);
  }
  deleteSupportItem(courseUuid: UUID, subChapterUuid: string, supportId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/sub-chapters/${subChapterUuid}/support/${supportId}`);
  }

  // Documents Enhanced (with audience and templates)
  getDocumentsEnhanced(courseUuid: UUID, params?: { audience?: string; document_type?: string; certificates_only?: boolean; questionnaires_only?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.audience) queryParams.append('audience', params.audience);
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.certificates_only) queryParams.append('certificates_only', 'true');
    if (params?.questionnaires_only) queryParams.append('questionnaires_only', 'true');
    const qs = queryParams.toString();
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/documents-enhanced${qs ? `?${qs}` : ''}`);
  }

  // Get all documents from organization (for template reuse)
  getAllOrganizationDocuments(params?: { type?: string; document_type?: string; search?: string; audience_type?: string; exclude_questionnaires?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.audience_type) queryParams.append('audience_type', params.audience_type);
    if (params?.exclude_questionnaires !== undefined) queryParams.append('exclude_questionnaires', params.exclude_questionnaires ? 'true' : 'false');
    const qs = queryParams.toString();
    return apiService.get(`/api/organization/documents/all${qs ? `?${qs}` : ''}`);
  }

  getOrganizationDocumentStats() {
    return apiService.get('/api/organization/documents/stats');
  }
  
  // Create document at organization level (orphan document, not linked to a course)
  createOrganizationDocument(data: FormData | any) {
    return apiService.post('/api/organization/documents', data);
  }
  
  createDocumentEnhanced(courseUuid: UUID, data: FormData | any) {
    // Utiliser /documents au lieu de /documents-enhanced pour correspondre au backend
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/documents`, data);
  }
  updateDocumentEnhanced(courseUuid: UUID, documentId: number, data: any) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/documents-enhanced/${documentId}`, data);
  }
  deleteDocumentEnhanced(courseUuid: UUID, documentId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/documents-enhanced/${documentId}`);
  }
  regenerateDocumentEnhanced(courseUuid: UUID, documentId: number, data: { variables: any }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/documents-enhanced/${documentId}/regenerate`, data);
  }
  downloadDocumentEnhanced(courseUuid: UUID, documentId: number) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/documents-enhanced/${documentId}/download`, { responseType: 'blob' });
  }

  // Questionnaires (separated from documents)
  getQuestionnaires(courseUuid: UUID, params?: { audience?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.audience) queryParams.append('audience', params.audience);
    const qs = queryParams.toString();
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/questionnaires${qs ? `?${qs}` : ''}`);
  }
  getQuestionnaire(courseUuid: UUID, questionnaireId: number) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/questionnaires/${questionnaireId}`);
  }

  // Document Templates Enhanced (organization level)
  getDocumentTemplatesEnhanced(params?: { type?: string; is_active?: boolean; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    const qs = queryParams.toString();
    return apiService.get(`${this.base}/document-templates${qs ? `?${qs}` : ''}`);
  }
  getDocumentTemplateEnhanced(templateId: number) {
    return apiService.get(`${this.base}/document-templates/${templateId}`);
  }
  previewDocumentTemplate(templateId: number, data: { variables: any }) {
    return apiService.post(`${this.base}/document-templates/${templateId}/preview`, data);
  }
  cloneDocumentTemplate(templateId: number, data: { name: string; content?: string; fields?: any }) {
    return apiService.post(`${this.base}/document-templates/${templateId}/clone`, data);
  }

  // Pedagogical Objectives Enhanced
  getPedagogicalObjectives(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/objectives`);
  }
  createPedagogicalObjective(courseUuid: UUID, data: { objective: string; order: number }) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/objectives`, data);
  }
  updatePedagogicalObjective(courseUuid: UUID, objectiveId: number, data: { objective?: string; order?: number }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/objectives/${objectiveId}`, data);
  }
  deletePedagogicalObjective(courseUuid: UUID, objectiveId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/objectives/${objectiveId}`);
  }
  reorderPedagogicalObjectives(courseUuid: UUID, objectives: Array<{ id: number; order: number }>) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/objectives/reorder`, { objectives });
  }

  // Flow Actions (new workflow system)
  getFlowActions(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/flow-actions`);
  }
  createFlowAction(courseUuid: UUID, data: FormData) {
    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/flow-actions`, data);
  }
  updateFlowAction(courseUuid: UUID, actionId: number, data: FormData) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/flow-actions/${actionId}`, data);
  }
  deleteFlowAction(courseUuid: UUID, actionId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/flow-actions/${actionId}`);
  }

  // Trainers with Enhanced Permissions
  getCourseTrainersEnhanced(courseUuid: UUID) {
    return apiService.get(`${this.orgCoursesBase}/${courseUuid}/trainers`);
  }
  assignTrainerEnhanced(courseUuid: UUID, data: { instructor_id?: number | string; trainer_id?: number | string; permissions: any }) {
    // Backend expects: { "instructor_id": 45, "permissions": {...} }
    // Accept both trainer_id and instructor_id for compatibility
    const trainerId = data.trainer_id || data.instructor_id;

    if (!trainerId) {
      throw new Error('ID du formateur manquant');
    }

    // Accept both numeric ID and UUID
    let trainerIdentifier: number | string = trainerId;
    
    // Try to convert to number if it's a numeric string
    if (typeof trainerId === 'string') {
      const numericId = parseInt(trainerId, 10);
      if (!isNaN(numericId)) {
        trainerIdentifier = numericId;
      }
      // Otherwise keep as UUID string
    }

    // Backend expects instructor_id (not trainer_id)
    const payload = {
      instructor_id: trainerIdentifier,
      permissions: data.permissions
    };

    console.log('🔵 assignTrainerEnhanced payload:', payload);

    return apiService.post(`${this.orgCoursesBase}/${courseUuid}/trainers`, payload);
  }
  updateTrainerPermissionsEnhanced(courseUuid: UUID, trainerId: number, data: { permissions: any }) {
    return apiService.put(`${this.orgCoursesBase}/${courseUuid}/trainers/${trainerId}`, data);
  }
  removeTrainerEnhanced(courseUuid: UUID, trainerId: number) {
    return apiService.delete(`${this.orgCoursesBase}/${courseUuid}/trainers/${trainerId}`);
  }

  // Get all organization trainers for selection
  getOrganizationTrainers(params?: { search?: string; per_page?: number; is_active?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    const qs = queryParams.toString();
    return apiService.get(`${this.base}/trainers${qs ? `?${qs}` : ''}`);
  }

  // Media File Info
  getMediaInfo(data: { path: string }) {
    return apiService.post('/api/media/info', data);
  }
}

export const courseCreation = new CourseCreationService();
export default courseCreation;
