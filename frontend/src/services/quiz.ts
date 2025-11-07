import { apiService } from './api';

export type QuizStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'ranking' | 'image_choice' | 'true_false' | 'free_text';

export interface Quiz {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  total_questions: number;
  is_shuffle: boolean;
  is_remake: boolean;
  show_answer_during: boolean;
  show_answer_after: boolean;
  progress_percentage: number;
  status: QuizStatus;
  created_at: string;
  updated_at: string;
  categories?: QuizCategory[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface QuizCategory {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  color?: string;
  icon?: string;
}

export interface QuizQuestion {
  id: number;
  uuid: string;
  quiz_id: number;
  type: QuestionType;
  title: string;
  description?: string;
  image?: string;
  time_limit?: number;
  points: number;
  order: number;
  options?: QuestionOption[];
  correct_answer?: any;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: number;
  uuid: string;
  question_id: number;
  text?: string;
  image?: string;
  order: number;
  is_correct: boolean;
}

class QuizService {
  private baseUrl = '/api/organization/quizzes';

  // Quiz CRUD
  async getQuizzes(params?: {
    search?: string;
    status?: QuizStatus;
    category_id?: number;
    created_from?: string;
    created_to?: string;
    page?: number;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.created_from) queryParams.append('created_from', params.created_from);
    if (params?.created_to) queryParams.append('created_to', params.created_to);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const qs = queryParams.toString();
    return apiService.get(`${this.baseUrl}${qs ? `?${qs}` : ''}`);
  }

  async getQuiz(quizUuid: string) {
    return apiService.get(`${this.baseUrl}/${quizUuid}`);
  }

  async createQuiz(data: FormData) {
    return apiService.post(this.baseUrl, data);
  }

  async updateQuiz(quizUuid: string, data: FormData) {
    // Add _method for Laravel method spoofing (Laravel can't parse PUT requests with FormData properly)
    data.append('_method', 'PUT');
    return apiService.post(`${this.baseUrl}/${quizUuid}`, data);
  }

  async deleteQuiz(quizUuid: string) {
    return apiService.delete(`${this.baseUrl}/${quizUuid}`);
  }

  async updateQuizStatus(quizUuid: string, status: QuizStatus) {
    return apiService.patch(`${this.baseUrl}/${quizUuid}/status`, { status });
  }

  // Categories
  async getCategories() {
    return apiService.get('/api/organization/quiz-categories');
  }

  async createCategory(data: { title: string; color?: string; icon?: string }) {
    return apiService.post('/api/organization/quiz-categories', data);
  }

  // Questions
  async getQuestions(quizUuid: string) {
    return apiService.get(`${this.baseUrl}/${quizUuid}/questions`);
  }

  async createQuestion(quizUuid: string, data: FormData) {
    return apiService.post(`${this.baseUrl}/${quizUuid}/questions`, data);
  }

  async updateQuestion(quizUuid: string, questionUuid: string, data: FormData) {
    // Add _method for Laravel method spoofing (Laravel can't parse PUT requests with FormData properly)
    data.append('_method', 'PUT');
    return apiService.post(`${this.baseUrl}/${quizUuid}/questions/${questionUuid}`, data);
  }

  async deleteQuestion(quizUuid: string, questionUuid: string) {
    return apiService.delete(`${this.baseUrl}/${quizUuid}/questions/${questionUuid}`);
  }

  async reorderQuestions(quizUuid: string, questionUuids: string[]) {
    return apiService.post(`${this.baseUrl}/${quizUuid}/questions/reorder`, {
      question_uuids: questionUuids
    });
  }

  async duplicateQuestion(quizUuid: string, questionUuid: string) {
    return apiService.post(`${this.baseUrl}/${quizUuid}/questions/${questionUuid}/duplicate`);
  }

  // Question Options
  async createOption(quizUuid: string, questionUuid: string, data: FormData) {
    return apiService.post(`${this.baseUrl}/${quizUuid}/questions/${questionUuid}/options`, data);
  }

  async updateOption(quizUuid: string, questionUuid: string, optionUuid: string, data: FormData) {
    // Add _method for Laravel method spoofing (Laravel can't parse PUT requests with FormData properly)
    data.append('_method', 'PUT');
    return apiService.post(`${this.baseUrl}/${quizUuid}/questions/${questionUuid}/options/${optionUuid}`, data);
  }

  async deleteOption(quizUuid: string, questionUuid: string, optionUuid: string) {
    return apiService.delete(`${this.baseUrl}/${quizUuid}/questions/${questionUuid}/options/${optionUuid}`);
  }

  // Association with Courses
  async associateQuiz(quizUuid: string, data: {
    course_uuid: string;
    chapter_uuid?: string;
    sub_chapter_uuid?: string;
    placement?: 'before' | 'after';
    reference_element_uuid?: string;
  }) {
    return apiService.post(`${this.baseUrl}/${quizUuid}/associate`, data);
  }

  async dissociateQuiz(quizUuid: string, courseUuid: string) {
    return apiService.delete(`${this.baseUrl}/${quizUuid}/associations/${courseUuid}`);
  }

  async getQuizAssociations(quizUuid: string) {
    return apiService.get(`${this.baseUrl}/${quizUuid}/associations`);
  }

  // Statistics
  async getQuizStats(quizUuid: string) {
    return apiService.get(`${this.baseUrl}/${quizUuid}/stats`);
  }

  async getQuizResults(quizUuid: string, params?: {
    course_uuid?: string;
    student_id?: number;
    passed?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.course_uuid) queryParams.append('course_uuid', params.course_uuid);
    if (params?.student_id) queryParams.append('student_id', params.student_id.toString());
    if (params?.passed !== undefined) queryParams.append('passed', params.passed ? '1' : '0');
    
    const qs = queryParams.toString();
    return apiService.get(`${this.baseUrl}/${quizUuid}/results${qs ? `?${qs}` : ''}`);
  }
}

export const quizService = new QuizService();

