import { apiService } from './api';

// Types based on sessions.md API documentation
export type UUID = string;

export interface CreateSessionPayload {
  title: string;
  subtitle?: string;
  description?: string;
  category_id?: number | null;
  session_language_id?: number | null;
  difficulty_level_id?: number | null;
  price?: number;
  price_ht?: number;
  vat_percentage?: number;
  currency?: string;
  duration?: string;
  duration_days?: number;
  session_start_date?: string;
  session_end_date?: string;
  session_start_time?: string;
  session_end_time?: string;
  max_participants?: number;
  target_audience?: string;
  prerequisites?: string;
  key_points?: Array<{ name: string }>;
  trainer_ids?: string[];
  isPublished?: boolean;
}

export interface SessionInstance {
  uuid: string;
  session_uuid: string;
  instance_type: 'presentiel' | 'distanciel' | 'e-learning';
  start_date: string;
  start_time: string;
  end_time?: string;
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  location_country?: string;
  location_building?: string;
  location_room?: string;
  platform_type?: string;
  meeting_link?: string;
  meeting_password?: string;
  elearning_platform?: string;
  elearning_link?: string;
  access_start_date?: string;
  access_end_date?: string;
  is_self_paced?: boolean;
  max_participants?: number;
  current_participants?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  trainer_ids?: string[];
  is_cancelled?: boolean;
  cancellation_reason?: string;
}

export interface SessionParticipant {
  id: number;
  uuid: string;
  user_id: number;
  session_uuid: string;
  enrollment_date: string;
  status: 'enrolled' | 'active' | 'completed' | 'suspended' | 'cancelled';
  progress_percentage: number;
  user?: {
    name: string;
    email: string;
  };
}

export interface SessionChapter {
  uuid: string;
  session_uuid: string;
  title: string;
  description?: string;
  order: number;
  sub_chapters?: SessionSubChapter[];
}

export interface SessionSubChapter {
  uuid: string;
  chapter_uuid: string;
  title: string;
  description?: string;
  order: number;
  content?: SessionContent[];
}

export interface SessionContent {
  uuid: string;
  type: 'video' | 'text' | 'image';
  title?: string;
  content?: string;
  file_url?: string;
  order: number;
}

export interface SessionDocument {
  uuid: string;
  session_uuid: string;
  name: string;
  description?: string;
  category: 'syllabus' | 'handout' | 'reference';
  file_url: string;
  file_size?: number;
  mime_type?: string;
}

export interface SessionTrainer {
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience_years: number;
  description?: string;
  competencies: string[];
  avatar_url?: string;
}

class SessionCreationService {
  private orgSessionsBase = '/api/organization/sessions';
  private publicSessionsBase = '/api/sessions';
  private studentSessionsBase = '/api/student/sessions';
  private base = '/api/organization';

  // ==================== PUBLIC/FRONTEND APIs ====================
  
  // 1. Get All Sessions (Public)
  getAllSessions(params?: {
    search?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    difficulty_level_id?: number;
    language_id?: number;
    featured?: boolean;
    sort_by?: string;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category_id) queryParams.append('category_id', String(params.category_id));
    if (params?.min_price) queryParams.append('min_price', String(params.min_price));
    if (params?.max_price) queryParams.append('max_price', String(params.max_price));
    if (params?.difficulty_level_id) queryParams.append('difficulty_level_id', String(params.difficulty_level_id));
    if (params?.language_id) queryParams.append('language_id', String(params.language_id));
    if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    
    const qs = queryParams.toString();
    return apiService.get(`${this.publicSessionsBase}${qs ? `?${qs}` : ''}`);
  }

  // 2. Get Session Details by Slug
  getSessionDetailsBySlug(slug: string) {
    return apiService.get(`${this.publicSessionsBase}/${slug}`);
  }

  // 3. Get Featured Sessions
  getFeaturedSessions(limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', String(limit));
    const qs = queryParams.toString();
    return apiService.get(`${this.publicSessionsBase}/featured${qs ? `?${qs}` : ''}`);
  }

  // 4. Get Session Categories
  getSessionCategories() {
    return apiService.get(`${this.publicSessionsBase}/categories`);
  }

  // 5. Get Upcoming Instances (Public)
  getUpcomingInstances(params?: {
    instance_type?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.instance_type) queryParams.append('instance_type', params.instance_type);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    
    const qs = queryParams.toString();
    return apiService.get(`${this.publicSessionsBase}/upcoming-instances${qs ? `?${qs}` : ''}`);
  }

  // 6. Search Sessions
  searchSessions(query: string) {
    return apiService.get(`${this.publicSessionsBase}/search?q=${encodeURIComponent(query)}`);
  }

  // ==================== STUDENT APIs ====================

  // 7. Get Student Enrollments
  getStudentEnrollments(params?: {
    status?: string;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    
    const qs = queryParams.toString();
    return apiService.get(`${this.studentSessionsBase}${qs ? `?${qs}` : ''}`);
  }

  // 8. Enroll in Session (Student)
  enrollInSession(sessionUuid: string) {
    return apiService.post(`${this.studentSessionsBase}/${sessionUuid}/enroll`);
  }

  // 9. Get Session Details (Student)
  getStudentSessionDetails(sessionUuid: string) {
    return apiService.get(`${this.studentSessionsBase}/${sessionUuid}`);
  }

  // 10. Get Student Upcoming Instances
  getStudentUpcomingInstances() {
    return apiService.get(`${this.studentSessionsBase}/upcoming-instances`);
  }

  // 11. Get Student Attendance
  getStudentAttendance(sessionUuid: string) {
    return apiService.get(`${this.studentSessionsBase}/${sessionUuid}/attendance`);
  }

  // 12. Access Session Instance
  accessSessionInstance(instanceUuid: string) {
    return apiService.get(`/api/student/session-instances/${instanceUuid}/access`);
  }

  // 13. Get Student Progress
  getStudentProgress(sessionUuid: string) {
    return apiService.get(`${this.studentSessionsBase}/${sessionUuid}/progress`);
  }

  // ==================== ORGANIZATION APIs ====================

  // 14. List Organization Sessions
  listOrganizationSessions(params?: {
    status?: number;
    search?: string;
    category_id?: number;
    per_page?: number;
    trainer_id?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category_id) queryParams.append('category_id', String(params.category_id));
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    if (params?.trainer_id) queryParams.append('trainer_id', params.trainer_id);
    
    const qs = queryParams.toString();
    return apiService.get(`${this.orgSessionsBase}${qs ? `?${qs}` : ''}`);
  }

  // Session CRUD operations
  getCreationMetadata() {
    return apiService.get(`${this.orgSessionsBase}/metadata`);
  }

  // Get Session Details (Organization)
  getSessionDetails(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}`);
  }

  // 15. Create Session
  createSession(data: CreateSessionPayload) {
    return apiService.post(`${this.orgSessionsBase}`, data);
  }

  // 16. Update Session
  updateSession(sessionUuid: UUID, data: Partial<CreateSessionPayload>) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}`, data);
  }

  // 16.1 Upload Session Media (like courses)
  uploadIntroVideo(sessionUuid: UUID, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/media/intro-video`, formData);
  }

  uploadIntroImage(sessionUuid: UUID, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/media/intro-image`, formData);
  }

  deleteIntroVideo(sessionUuid: UUID) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/media/intro-video`);
  }

  deleteIntroImage(sessionUuid: UUID) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/media/intro-image`);
  }

  updateMediaUrls(sessionUuid: UUID, data: { intro_video_url?: string; intro_image_url?: string }) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/media/urls`, data);
  }

  // 17. Delete Session
  deleteSession(sessionUuid: UUID) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}`);
  }

  updateSessionStatus(sessionUuid: UUID, status: number) {
    return apiService.patch(`${this.orgSessionsBase}/${sessionUuid}/status`, { status });
  }

  // Session Instances (Séances)
  // 18. Generate Session Instances
  generateSessionInstances(sessionUuid: UUID, data: {
    instance_type: 'presentiel' | 'distanciel' | 'e-learning';
    has_recurrence: boolean;
    recurrence_start_date?: string;
    recurrence_end_date?: string;
    selected_days?: number[];
    time_slots?: string[];
    start_date?: string;
    location_address?: string;
    location_city?: string;
    location_postal_code?: string;
    location_country?: string;
    location_building?: string;
    location_room?: string;
    platform_type?: string;
    meeting_link?: string;
    meeting_password?: string;
    elearning_platform?: string;
    elearning_link?: string;
    access_start_date?: string;
    access_end_date?: string;
    is_self_paced?: boolean;
    max_participants?: number;
    trainer_ids?: string[];
  }) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/generate-instances`, data);
  }

  // 19. Get Session Instances
  getSessionInstances(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/instances`);
  }

  // 20. Cancel Session Instance
  cancelSessionInstance(instanceUuid: UUID, reason: string) {
    return apiService.post(`${this.base}/session-instances/${instanceUuid}/cancel`, { reason });
  }

  // Session Participants
  // 21. Enroll Participant (Organization)
  enrollParticipant(sessionUuid: UUID, userId: number) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/enroll`, { user_id: userId });
  }

  // 22. Get Session Participants
  getSessionParticipants(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/participants`);
  }

  // 23. Update Participant Status
  updateParticipantStatus(participantId: number, status: 'enrolled' | 'active' | 'completed' | 'suspended' | 'cancelled') {
    return apiService.put(`${this.base}/session-participants/${participantId}/status`, { status });
  }

  // 24. Mark Attendance
  markAttendance(instanceUuid: UUID, data: {
    participant_id: number;
    user_id: number;
    status: 'present' | 'absent' | 'late' | 'excused';
    check_in_time?: string;
    notes?: string;
  }) {
    return apiService.post(`${this.base}/session-instances/${instanceUuid}/attendance`, data);
  }

  // 25. Get Attendance Report
  getAttendanceReport(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/attendance-report`);
  }

  // Session Chapters
  // 26. Session Chapters CRUD
  getSessionChapters(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/chapters`);
  }

  createSessionChapter(sessionUuid: UUID, data: { title: string; description?: string; order?: number; order_index?: number; course_section_id?: number; section_id?: number; is_published?: boolean }) {
    // Normalize order and order_index
    const payload: any = {
      title: data.title,
      description: data.description || '',
      order_index: data.order_index ?? data.order ?? 0,
      is_published: data.is_published !== undefined ? data.is_published : true
    };
    
    // Include section_id if provided (backend might expect course_section_id or section_id)
    if (data.course_section_id !== undefined) {
      payload.course_section_id = data.course_section_id;
    }
    if (data.section_id !== undefined) {
      payload.section_id = data.section_id;
    }
    
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters`, payload);
  }

  updateSessionChapter(chapterUuid: UUID, data: { title?: string; description?: string; order?: number }) {
    return apiService.put(`${this.base}/session-chapters/${chapterUuid}`, data);
  }

  deleteSessionChapter(chapterUuid: UUID) {
    return apiService.delete(`${this.base}/session-chapters/${chapterUuid}`);
  }

  // Session Chapter Content
  createSessionContent(sessionUuid: UUID, chapterUuid: string, data: { type: 'video' | 'text' | 'image'; title?: string; content?: string; file?: File; order: number; sub_chapter_id?: string | null }) {
    const formData = new FormData();
    formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', String(data.content));
    if (data.file) formData.append('file', data.file);
    formData.append('order', String(data.order));
    if (data.sub_chapter_id !== null && data.sub_chapter_id !== undefined) {
      formData.append('sub_chapter_id', data.sub_chapter_id);
    }
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/content`, formData);
  }

  updateSessionContent(sessionUuid: UUID, chapterUuid: string, contentUuid: string, data: { type?: 'video' | 'text' | 'image'; title?: string; content?: string; file?: File; order?: number }) {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Laravel method spoofing
    if (data.type) formData.append('type', data.type);
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', String(data.content));
    if (data.file) formData.append('file', data.file);
    if (data.order !== undefined) formData.append('order', String(data.order));
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/content/${contentUuid}`, formData);
  }

  deleteSessionContent(sessionUuid: UUID, chapterUuid: string, contentUuid: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/content/${contentUuid}`);
  }

  // Session Chapter Evaluations
  createSessionEvaluation(sessionUuid: UUID, chapterUuid: string, data: { type: 'devoir' | 'examen'; title: string; description: string; due_date?: string | null; file?: File | null; sub_chapter_id?: string | null }) {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.due_date) formData.append('due_date', data.due_date);
    if (data.sub_chapter_id !== null && data.sub_chapter_id !== undefined) {
      formData.append('sub_chapter_id', data.sub_chapter_id);
    }
    if (data.file) formData.append('file', data.file);
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/evaluations`, formData);
  }

  updateSessionEvaluation(sessionUuid: UUID, chapterUuid: string, evaluationUuid: string, data: { type?: 'devoir' | 'examen'; title?: string; description?: string; due_date?: string; file?: File }) {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Laravel method spoofing
    if (data.type) formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.due_date) formData.append('due_date', data.due_date);
    if (data.file) formData.append('file', data.file);
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/evaluations/${evaluationUuid}`, formData);
  }

  deleteSessionEvaluation(sessionUuid: UUID, chapterUuid: string, evaluationUuid: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/evaluations/${evaluationUuid}`);
  }

  // Session Sub-chapters
  createSessionSubChapter(sessionUuid: UUID, chapterUuid: string, data: { title: string; description?: string; order?: number }) {
    const payload: any = {
      title: data.title,
      description: data.description || '',
      order_index: data.order ?? 0
    };
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/sub-chapters`, payload);
  }

  updateSessionSubChapter(sessionUuid: UUID, chapterUuid: string, subChapterUuid: string, data: { title?: string; description?: string; order?: number }) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/sub-chapters/${subChapterUuid}`, data);
  }

  deleteSessionSubChapter(sessionUuid: UUID, chapterUuid: string, subChapterUuid: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/sub-chapters/${subChapterUuid}`);
  }

  // Session Chapter Support Files
  uploadSessionSupportFiles(sessionUuid: UUID, chapterUuid: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file);
    });
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/support-files`, formData);
  }

  deleteSessionSupportFile(sessionUuid: UUID, chapterUuid: string, fileUuid: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/chapters/${chapterUuid}/support-files/${fileUuid}`);
  }

  // Session Documents
  // 27. Session Documents
  getSessionDocuments(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/documents`);
  }

  uploadSessionDocument(sessionUuid: UUID, data: { name: string; category: string; file: File }) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('file', data.file);
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/documents`, formData);
  }

  deleteSessionDocument(documentUuid: UUID) {
    return apiService.delete(`${this.base}/session-documents/${documentUuid}`);
  }

  // Trainers
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
    return apiService.get(`${this.base}/trainers/search?${queryParams.toString()}`);
  }

  getTrainerDetails(trainerId: string) {
    return apiService.get(`${this.base}/trainers/${trainerId}`);
  }

  createTrainer(data: {
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    experience_years: number;
    description?: string;
    competencies: string[];
    avatar?: File;
  }) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('experience_years', String(data.experience_years));
    formData.append('competencies', JSON.stringify(data.competencies));
    if (data.phone) formData.append('phone', data.phone);
    if (data.specialization) formData.append('specialization', data.specialization);
    if (data.description) formData.append('description', data.description);
    if (data.avatar) formData.append('avatar', data.avatar);
    return apiService.post(`${this.base}/trainers`, formData);
  }

  updateTrainer(trainerId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    specialization?: string;
    experience_years?: number;
    description?: string;
    competencies?: string[];
    avatar?: File;
  }) {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.specialization) formData.append('specialization', data.specialization);
    if (data.experience_years !== undefined) formData.append('experience_years', String(data.experience_years));
    if (data.description) formData.append('description', data.description);
    if (data.competencies) formData.append('competencies', JSON.stringify(data.competencies));
    if (data.avatar) formData.append('avatar', data.avatar);
    return apiService.put(`${this.base}/trainers/${trainerId}`, formData);
  }

  // Users for participant enrollment
  getAllUsers(params?: { search?: string; per_page?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', String(params.per_page));
    const qs = queryParams.toString();
    return apiService.get(`${this.base}/users${qs ? `?${qs}` : ''}`);
  }

  searchUsers(query: string, per_page?: number) {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    if (per_page) queryParams.append('per_page', String(per_page));
    return apiService.get(`${this.base}/users/search?${queryParams.toString()}`);
  }

  // Session modules
  getSessionModules(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/modules`);
  }

  createSessionModule(sessionUuid: UUID, data: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/modules`, data);
  }

  updateSessionModule(sessionUuid: UUID, moduleUuid: string, data: any) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/modules/${moduleUuid}`, data);
  }

  deleteSessionModule(sessionUuid: UUID, moduleUuid: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/modules/${moduleUuid}`);
  }

  // Session objectives
  getSessionObjectives(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/objectives`);
  }

  createSessionObjective(sessionUuid: UUID, data: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/objectives`, data);
  }

  updateSessionObjective(sessionUuid: UUID, objectiveUuid: string, data: any) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/objectives/${objectiveUuid}`, data);
  }

  deleteSessionObjective(sessionUuid: UUID, objectiveUuid: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/objectives/${objectiveUuid}`);
  }

  // Session Sections
  getSessionSections(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/sections`);
  }

  createSessionSection(sessionUuid: UUID, data: { title: string; description?: string; order_index?: number; is_published?: boolean }) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/sections`, data);
  }

  updateSessionSection(sessionUuid: UUID, sectionId: number, data: { title?: string; description?: string; order_index?: number; is_published?: boolean }) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/sections/${sectionId}`, data);
  }

  deleteSessionSection(sessionUuid: UUID, sectionId: number) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/sections/${sectionId}`);
  }

  // Session Questionnaires
  getSessionQuestionnaires(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/questionnaires`);
  }

  createSessionQuestionnaire(sessionUuid: UUID, data: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/questionnaires`, data);
  }

  updateSessionQuestionnaire(sessionUuid: UUID, questionnaireUuid: UUID, data: any) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/${questionnaireUuid}`, data);
  }

  deleteSessionQuestionnaire(sessionUuid: UUID, questionnaireUuid: UUID) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/${questionnaireUuid}`);
  }

  // Session Trainers
  getSessionTrainers(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/trainers`);
  }

  assignSessionTrainer(sessionUuid: UUID, data: { instructor_id?: number | string; trainer_id?: number | string; permissions?: any }) {
    // Backend expects trainer_id (not instructor_id) as a STRING
    const trainerId = data.trainer_id || data.instructor_id;
    
    if (!trainerId) {
      throw new Error('ID du formateur manquant');
    }

    // Backend expects trainer_id as a string
    // IMPORTANT: Convert to string explicitly to ensure JSON serialization preserves it as a string
    // Using String() ensures the value is always a string type, not a numeric string
    const trainerIdentifier = String(trainerId);

    // Create payload ensuring trainer_id is definitely a string
    // This ensures JSON.stringify will produce {"trainer_id":"6"} not {"trainer_id":6}
    const payload: { trainer_id: string; permissions: any } = {
      trainer_id: trainerIdentifier,
      permissions: data.permissions || {}
    };

    // Verify the type before sending
    if (typeof payload.trainer_id !== 'string') {
      console.error('❌ [assignSessionTrainer] CRITICAL: trainer_id is not a string!', typeof payload.trainer_id, payload.trainer_id);
      // Force convert again as safety measure
      payload.trainer_id = String(payload.trainer_id);
    }

    // Debug logging to verify the payload type
    console.log('🔵 [assignSessionTrainer] Payload before sending:', payload);
    console.log('🔵 [assignSessionTrainer] trainer_id type:', typeof payload.trainer_id);
    console.log('🔵 [assignSessionTrainer] trainer_id value:', payload.trainer_id);
    console.log('🔵 [assignSessionTrainer] JSON preview:', JSON.stringify(payload));

    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/trainers`, payload);
  }

  removeSessionTrainer(sessionUuid: UUID, trainerId: string) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/trainers/${trainerId}`);
  }

  updateSessionTrainerPermissions(sessionUuid: UUID, trainerId: string, permissions: any) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/trainers/${trainerId}`, { permissions });
  }

  // Session Workflow
  getSessionWorkflow(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/workflow`);
  }

  createSessionWorkflowAction(sessionUuid: UUID, data: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/workflow/actions`, data);
  }

  updateSessionWorkflowAction(sessionUuid: UUID, actionUuid: UUID, data: any) {
    return apiService.put(`${this.orgSessionsBase}/${sessionUuid}/workflow/actions/${actionUuid}`, data);
  }

  deleteSessionWorkflowAction(sessionUuid: UUID, actionUuid: UUID) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/workflow/actions/${actionUuid}`);
  }

  toggleSessionWorkflow(sessionUuid: UUID, isActive: boolean) {
    return apiService.patch(`${this.orgSessionsBase}/${sessionUuid}/workflow/toggle`, { is_active: isActive });
  }

  // Document Templates (shared with courses)
  getDocumentTemplates() {
    return apiService.get('/api/admin/document-templates');
  }

  getOrganizationDocumentTemplates() {
    return apiService.get('/api/organization/document-templates');
  }

  getAvailableDocumentTemplates(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/documents/templates`);
  }

  generateDocumentFromTemplate(sessionUuid: UUID, templateId: string, variables: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/documents/generate`, { template_id: templateId, variables });
  }

  // Questionnaire Templates (shared with courses)
  getQuestionnaireTemplates() {
    return apiService.get('/api/admin/questionnaire-templates');
  }

  createQuestionnaireFromTemplate(sessionUuid: UUID, templateId: string, customizations?: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/from-template`, { template_id: templateId, customizations });
  }

  importQuestionnaireFromCSV(sessionUuid: UUID, file: File, settings?: any) {
    const formData = new FormData();
    formData.append('file', file);
    if (settings) formData.append('settings', JSON.stringify(settings));
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/import-csv`, formData);
  }

  getQuestionnaireImportTemplates(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/import-templates`);
  }

  exportQuestionnaireToCSV(sessionUuid: UUID, questionnaireId: string) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/${questionnaireId}/export-csv`);
  }

  getQuestionnaireResponses(sessionUuid: UUID, questionnaireId: string) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/${questionnaireId}/responses`);
  }

  getQuestionnaireAnalytics(sessionUuid: UUID, questionnaireId: string) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/questionnaires/${questionnaireId}/analytics`);
  }

  // Workflow Triggers & Executions
  getWorkflowTriggers(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/workflow/triggers`);
  }

  getWorkflowExecutions(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/workflow/executions`);
  }

  executeWorkflowManually(sessionUuid: UUID, data?: any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/workflow/execute`, data);
  }

  getWorkflowAnalytics(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/workflow/analytics`);
  }

  // Documents Enhanced (same as courses)
  getDocumentsEnhanced(sessionUuid: UUID, params?: { audience?: string; document_type?: string; certificates_only?: boolean; questionnaires_only?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.audience) queryParams.append('audience', params.audience);
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.certificates_only) queryParams.append('certificates_only', 'true');
    if (params?.questionnaires_only) queryParams.append('questionnaires_only', 'true');
    const qs = queryParams.toString();
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/documents-enhanced${qs ? `?${qs}` : ''}`);
  }

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

  createDocumentEnhanced(sessionUuid: UUID, data: FormData | any) {
    return apiService.post(`${this.orgSessionsBase}/${sessionUuid}/documents-enhanced`, data);
  }

  deleteDocumentEnhanced(sessionUuid: UUID, documentId: number) {
    return apiService.delete(`${this.orgSessionsBase}/${sessionUuid}/documents-enhanced/${documentId}`);
  }

  getQuestionnaires(sessionUuid: UUID, params?: { audience?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.audience) queryParams.append('audience', params.audience);
    const qs = queryParams.toString();
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/questionnaires${qs ? `?${qs}` : ''}`);
  }

  getDocumentTemplatesEnhanced(params?: { type?: string; is_active?: boolean; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    const qs = queryParams.toString();
    return apiService.get(`${this.base}/document-templates${qs ? `?${qs}` : ''}`);
  }

  getWorkflowActions(sessionUuid: UUID) {
    return apiService.get(`${this.orgSessionsBase}/${sessionUuid}/workflow/actions`);
  }

  getEmailTemplates() {
    return apiService.get(`${this.base}/email-templates`);
  }
}

export const sessionCreation = new SessionCreationService();
export default sessionCreation;
