import { apiService } from './api';
import {
  Trainer,
  TrainerListResponse,
  TrainerDetailsResponse,
  TrainerCalendarResponse,
  CreateTrainerData,
  UpdateTrainerData,
  TrainerEvaluationData,
  ApiResponse,
  TrainerCoursesResponse,
  TrainerStakeholder,
  TrainerStakeholderInteraction,
  StakeholdersResponse,
  StakeholderInteractionsResponse,
  TrainerQuestionnaire,
  QuestionnairesResponse,
} from './trainers.types';

/**
 * Service for Trainers Management
 */
class TrainersService {
  private base = '/api/organization/trainers';

  /**
   * Get all trainers with pagination and filters
   */
  async getTrainers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'name' | 'trainings' | 'collaboration_date';
    sort_order?: 'asc' | 'desc';
    status?: 'active' | 'inactive' | 'pending';
  }): Promise<TrainerListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = this.base + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<TrainerListResponse>(endpoint);
  }

  /**
   * Get trainer details by UUID
   */
  async getTrainerById(uuid: string): Promise<TrainerDetailsResponse> {
    return await apiService.get<TrainerDetailsResponse>(`${this.base}/${uuid}`);
  }

  /**
   * Create a new trainer
   */
  async createTrainer(data: CreateTrainerData): Promise<ApiResponse<{ trainer: Trainer }>> {
    const formData = new FormData();
    
    // Debug: Vérifier les données reçues
    console.log('createTrainer - Données reçues:', {
      name: data.name,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
    });
    
    // Champs obligatoires - TOUJOURS envoyer
    // Construire le nom complet (backend requiert "name")
    let fullName = '';
    if (data.name) {
      fullName = data.name.trim();
    } else if (data.first_name && data.last_name) {
      fullName = `${data.first_name.trim()} ${data.last_name.trim()}`.trim();
    } else if (data.first_name) {
      fullName = data.first_name.trim();
    } else if (data.last_name) {
      fullName = data.last_name.trim();
    }
    
    // TOUJOURS envoyer name (même si vide, le backend validera)
    formData.append('name', fullName);
    console.log('FormData - name ajouté:', fullName);
    
    // Email est obligatoire - TOUJOURS envoyer
    const emailValue = data.email ? data.email.trim() : '';
    formData.append('email', emailValue);
    console.log('FormData - email ajouté:', emailValue);
    
    // Autres champs obligatoires/importants - toujours envoyer first_name et last_name
    if (data.first_name !== undefined) {
      formData.append('first_name', data.first_name || '');
    }
    if (data.last_name !== undefined) {
      formData.append('last_name', data.last_name || '');
    }
    if (data.status) {
      formData.append('status', data.status);
    } else {
      formData.append('status', 'active'); // Valeur par défaut
    }
    
    // Debug: Afficher tous les champs du FormData AVANT l'envoi
    console.log('FormData entries (avant envoi):');
    const formDataEntries: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = value;
      console.log(`  ${key}:`, value instanceof File ? `[File: ${value.name}]` : value);
    }
    console.log('FormData complet:', formDataEntries);
    
    // Champs optionnels simples
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.postal_code) formData.append('postal_code', data.postal_code);
    if (data.country) formData.append('country', data.country);
    if (data.specialization) formData.append('specialization', data.specialization);
    if (data.experience_years !== undefined && data.experience_years !== null) {
      formData.append('experience_years', String(data.experience_years));
    }
    if (data.description) formData.append('description', data.description);
    if (data.contract_type) formData.append('contract_type', data.contract_type);
    if (data.hourly_rate !== undefined && data.hourly_rate !== null) {
      formData.append('hourly_rate', String(data.hourly_rate));
    }
    if (data.contract_start_date) formData.append('contract_start_date', data.contract_start_date);
    if (data.siret) formData.append('siret', data.siret);
    if (data.password) formData.append('password', data.password);
    if (data.password_confirmation) formData.append('password_confirmation', data.password_confirmation);
    
    // Avatar (fichier)
    if (data.avatar && data.avatar instanceof File) {
      formData.append('avatar', data.avatar);
    }
    
    // Compétences - Format array avec brackets (Laravel)
    if (data.competencies && Array.isArray(data.competencies) && data.competencies.length > 0) {
      data.competencies.forEach((comp) => {
        formData.append('competencies[]', comp);
      });
    }
    
    // Permissions - Format objet
    if (data.permissions && typeof data.permissions === 'object') {
      Object.keys(data.permissions).forEach((permKey) => {
        const permValue = data.permissions![permKey as keyof typeof data.permissions];
        if (permValue !== undefined && permValue !== null) {
          formData.append(`permissions[${permKey}]`, String(permValue));
        }
      });
    }
    
    // Planning de disponibilité - JSON stringifié
    if (data.availability_schedule && typeof data.availability_schedule === 'object' && Object.keys(data.availability_schedule).length > 0) {
      formData.append('availability_schedule', JSON.stringify(data.availability_schedule));
    }

    // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement avec le boundary
    return await apiService.post<ApiResponse<{ trainer: Trainer }>>(this.base, formData);
  }

  /**
   * Update trainer
   * Selon la documentation API, utilise PUT avec JSON (pas FormData)
   * L'avatar doit être uploadé séparément via uploadAvatar()
   */
  async updateTrainer(uuid: string, data: UpdateTrainerData): Promise<ApiResponse<{ trainer: Trainer }>> {
    // Construire le nom complet (backend requiert "name")
    let fullName = '';
    if (data.name !== undefined && data.name !== null) {
      fullName = String(data.name).trim();
    } else if (data.first_name !== undefined || data.last_name !== undefined) {
      const firstName = (data.first_name || '').trim();
      const lastName = (data.last_name || '').trim();
      if (firstName && lastName) {
        fullName = `${firstName} ${lastName}`.trim();
      } else if (firstName) {
        fullName = firstName;
      } else if (lastName) {
        fullName = lastName;
      }
    }
    
    // Construire l'objet JSON pour la requête
    // TOUJOURS inclure name et email (champs obligatoires)
    const jsonData: Record<string, any> = {
      name: fullName || '',
      email: data.email !== undefined && data.email !== null ? String(data.email).trim() : '',
    };
    
    // first_name et last_name - inclure même s'ils sont vides (pour permettre la mise à jour)
    if (data.first_name !== undefined) {
      jsonData.first_name = data.first_name ? String(data.first_name).trim() : '';
    }
    if (data.last_name !== undefined) {
      jsonData.last_name = data.last_name ? String(data.last_name).trim() : '';
    }
    
    // Champs optionnels - TOUJOURS inclure s'ils sont définis dans dataToSend
    // Envoyer les valeurs telles quelles (même chaînes vides ou 0) pour que le backend les traite
    if (data.status !== undefined) jsonData.status = data.status;
    if (data.phone !== undefined) jsonData.phone = data.phone || '';
    if (data.address !== undefined) jsonData.address = data.address || '';
    if (data.city !== undefined) jsonData.city = data.city || '';
    if (data.postal_code !== undefined) jsonData.postal_code = data.postal_code || '';
    if (data.country !== undefined) jsonData.country = data.country || '';
    if (data.specialization !== undefined) jsonData.specialization = data.specialization || '';
    if (data.experience_years !== undefined && data.experience_years !== null) {
      jsonData.experience_years = data.experience_years;
    }
    if (data.description !== undefined) jsonData.description = data.description || '';
    if (data.contract_type !== undefined) jsonData.contract_type = data.contract_type || '';
    if (data.hourly_rate !== undefined && data.hourly_rate !== null) {
      jsonData.hourly_rate = data.hourly_rate;
    }
    if (data.contract_start_date !== undefined) jsonData.contract_start_date = data.contract_start_date || '';
    if (data.siret !== undefined) jsonData.siret = data.siret || '';
    if (data.password) jsonData.password = data.password;
    if (data.password_confirmation) jsonData.password_confirmation = data.password_confirmation;
    
    // Compétences - Format array JSON
    if (data.competencies !== undefined) {
      jsonData.competencies = Array.isArray(data.competencies) ? data.competencies : [];
    }
    
    // Permissions - Format objet JSON
    if (data.permissions !== undefined && typeof data.permissions === 'object') {
      jsonData.permissions = data.permissions;
    }
    
    // Planning de disponibilité - Format objet JSON
    if (data.availability_schedule !== undefined && typeof data.availability_schedule === 'object') {
      jsonData.availability_schedule = data.availability_schedule;
    }

    // Utiliser PUT avec JSON (selon la documentation API)
    // Ne PAS inclure l'avatar ici - utiliser uploadAvatar() séparément
    console.log('🚀 updateTrainer - Données JSON à envoyer:', JSON.stringify(jsonData, null, 2));
    console.log('🚀 updateTrainer - URL:', `${this.base}/${uuid}`);
    
    const response = await apiService.put<ApiResponse<{ trainer: Trainer }>>(`${this.base}/${uuid}`, jsonData);
    
    console.log('✅ updateTrainer - Réponse reçue:', response);
    return response;
  }

  /**
   * Upload trainer avatar
   */
  async uploadAvatar(uuid: string, avatarFile: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    // POST est correct ici car c'est une route spécifique /avatar
    // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
    return await apiService.post<ApiResponse<{ avatar_url: string }>>(`${this.base}/${uuid}/avatar`, formData);
  }

  /**
   * Delete trainer
   */
  async deleteTrainer(uuid: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`${this.base}/${uuid}`);
  }

  /**
   * Get trainer calendar
   */
  async getTrainerCalendar(
    uuid: string,
    params?: {
      from?: string;
      to?: string;
    }
  ): Promise<TrainerCalendarResponse> {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const endpoint = `${this.base}/${uuid}/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<TrainerCalendarResponse>(endpoint);
  }

  /**
   * Evaluate trainer
   */
  async evaluateTrainer(uuid: string, data: TrainerEvaluationData): Promise<ApiResponse<{ evaluation: any }>> {
    return await apiService.post<ApiResponse<{ evaluation: any }>>(`${this.base}/${uuid}/evaluate`, data);
  }


  /**
   * Get courses for a trainer
   */
  async getTrainerCourses(uuid: string): Promise<TrainerCoursesResponse> {
    return await apiService.get<TrainerCoursesResponse>(`${this.base}/${uuid}/courses`);
  }

  /**
   * Get stakeholders for a trainer
   */
  async getStakeholders(uuid: string): Promise<StakeholdersResponse> {
    return await apiService.get<StakeholdersResponse>(`${this.base}/${uuid}/stakeholders`);
  }

  /**
   * Add a stakeholder to a trainer
   */
  async addStakeholder(uuid: string, data: {
    type: 'internal' | 'external';
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    organization?: string;
    notes?: string;
  }): Promise<ApiResponse<{ stakeholder: TrainerStakeholder }>> {
    return await apiService.post<ApiResponse<{ stakeholder: TrainerStakeholder }>>(
      `${this.base}/${uuid}/stakeholders`,
      data
    );
  }

  /**
   * Update a stakeholder
   */
  async updateStakeholder(uuid: string, stakeholderId: number, data: {
    type?: 'internal' | 'external';
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    organization?: string;
    notes?: string;
  }): Promise<ApiResponse<{ stakeholder: TrainerStakeholder }>> {
    return await apiService.put<ApiResponse<{ stakeholder: TrainerStakeholder }>>(
      `${this.base}/${uuid}/stakeholders/${stakeholderId}`,
      data
    );
  }

  /**
   * Delete a stakeholder
   */
  async deleteStakeholder(uuid: string, stakeholderId: number): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(
      `${this.base}/${uuid}/stakeholders/${stakeholderId}`
    );
  }

  /**
   * Get interactions for a stakeholder
   */
  async getStakeholderInteractions(uuid: string, stakeholderId: number): Promise<StakeholderInteractionsResponse> {
    return await apiService.get<StakeholderInteractionsResponse>(
      `${this.base}/${uuid}/stakeholders/${stakeholderId}/interactions`
    );
  }

  /**
   * Add an interaction for a stakeholder
   */
  async addStakeholderInteraction(uuid: string, stakeholderId: number, data: {
    interaction_type: 'email' | 'phone' | 'meeting' | 'note' | 'other';
    subject: string;
    notes?: string;
    interaction_date: string;
  }): Promise<ApiResponse<{ interaction: TrainerStakeholderInteraction }>> {
    return await apiService.post<ApiResponse<{ interaction: TrainerStakeholderInteraction }>>(
      `${this.base}/${uuid}/stakeholders/${stakeholderId}/interactions`,
      data
    );
  }

  /**
   * Get questionnaires for a trainer
   */
  async getQuestionnaires(uuid: string): Promise<QuestionnairesResponse> {
    return await apiService.get<QuestionnairesResponse>(`${this.base}/${uuid}/questionnaires`);
  }

  /**
   * Remind trainer about a questionnaire
   */
  async remindQuestionnaire(uuid: string, questionnaireId: number): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(`${this.base}/${uuid}/remind-questionnaire`, {
      questionnaire_id: questionnaireId,
    });
  }

  /**
   * Upload trainer document
   */
  async uploadDocument(uuid: string, formData: FormData): Promise<ApiResponse<{ document: any }>> {
    // POST est correct ici car c'est une route spécifique /documents
    // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
    return await apiService.post<ApiResponse<{ document: any }>>(`${this.base}/${uuid}/documents`, formData);
  }

  /**
   * Delete trainer document
   */
  async deleteDocument(uuid: string, documentId: number): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`${this.base}/${uuid}/documents/${documentId}`);
  }
}

export const trainersService = new TrainersService();

