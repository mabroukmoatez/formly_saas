/**
 * Session Override Service
 * 
 * Service pour gérer les overrides de session (héritage Cours → Session)
 * Les modifications faites ici affectent UNIQUEMENT la session, pas le cours template
 */

import { apiService, ApiResponse } from './api';
import type {
  SessionWithEffectiveData,
  UpdateSessionOverridesData,
  SessionChapter,
  SessionSubChapter,
  SessionDocument,
  SessionWorkflowAction,
  SessionChapterData,
  SessionSubChapterData,
  SessionDocumentData,
  SessionWorkflowActionData,
  InitializeOverrideResponse,
  EffectiveChaptersResponse,
  EffectiveDocumentsResponse,
  EffectiveWorkflowActionsResponse,
} from './sessionOverride.types';

const BASE_URL = '/api/admin/organization/course-sessions';

/**
 * Service pour gérer les overrides de session
 */
export const sessionOverrideService = {
  // ==================== SESSION OVERRIDES ====================

  /**
   * Récupérer une session avec toutes ses données effectives
   */
  async getSessionWithEffectiveData(sessionUuid: string): Promise<ApiResponse<SessionWithEffectiveData>> {
    return apiService.get(`${BASE_URL}/${sessionUuid}`);
  },

  /**
   * Mettre à jour les overrides simples d'une session
   * Les champs à null reviennent à la valeur du cours
   */
  async updateSessionOverrides(
    sessionUuid: string, 
    overrides: UpdateSessionOverridesData
  ): Promise<ApiResponse<SessionWithEffectiveData>> {
    return apiService.put(`${BASE_URL}/${sessionUuid}`, overrides);
  },

  /**
   * Réinitialiser un champ override (revenir à la valeur du cours)
   */
  async resetOverrideField(
    sessionUuid: string, 
    fieldName: keyof UpdateSessionOverridesData
  ): Promise<ApiResponse<SessionWithEffectiveData>> {
    return apiService.put(`${BASE_URL}/${sessionUuid}`, {
      [fieldName]: null
    });
  },

  // ==================== CHAPTERS OVERRIDE ====================

  /**
   * Initialiser l'override des chapitres
   * Copie tous les chapitres du cours vers la session pour permettre les modifications
   */
  async initializeChaptersOverride(sessionUuid: string): Promise<ApiResponse<InitializeOverrideResponse>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/initialize-chapters-override`, {});
  },

  /**
   * Récupérer les chapitres effectifs (du cours ou de la session selon override)
   */
  async getEffectiveChapters(sessionUuid: string): Promise<ApiResponse<EffectiveChaptersResponse>> {
    return apiService.get(`${BASE_URL}/${sessionUuid}/effective-chapters`);
  },

  /**
   * Créer un nouveau chapitre spécifique à la session
   */
  async createSessionChapter(
    sessionUuid: string, 
    data: SessionChapterData
  ): Promise<ApiResponse<SessionChapter>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/chapters`, data);
  },

  /**
   * Modifier un chapitre de session
   */
  async updateSessionChapter(
    sessionUuid: string, 
    chapterUuid: string, 
    data: SessionChapterData
  ): Promise<ApiResponse<SessionChapter>> {
    return apiService.put(`${BASE_URL}/${sessionUuid}/chapters/${chapterUuid}`, data);
  },

  /**
   * Supprimer un chapitre de session (soft delete)
   */
  async deleteSessionChapter(
    sessionUuid: string, 
    chapterUuid: string
  ): Promise<ApiResponse<void>> {
    return apiService.delete(`${BASE_URL}/${sessionUuid}/chapters/${chapterUuid}`);
  },

  /**
   * Restaurer un chapitre supprimé
   */
  async restoreSessionChapter(
    sessionUuid: string, 
    chapterUuid: string
  ): Promise<ApiResponse<SessionChapter>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/chapters/${chapterUuid}/restore`, {});
  },

  /**
   * Réinitialiser tous les chapitres (revenir au template du cours)
   */
  async resetChaptersOverride(sessionUuid: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${BASE_URL}/${sessionUuid}/chapters-override`);
  },

  // ==================== SUB-CHAPTERS OVERRIDE ====================

  /**
   * Créer un nouveau sous-chapitre dans un chapitre de session
   */
  async createSessionSubChapter(
    sessionUuid: string,
    chapterUuid: string,
    data: SessionSubChapterData
  ): Promise<ApiResponse<SessionSubChapter>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/chapters/${chapterUuid}/sub-chapters`, data);
  },

  /**
   * Modifier un sous-chapitre de session
   */
  async updateSessionSubChapter(
    sessionUuid: string,
    chapterUuid: string,
    subChapterUuid: string,
    data: SessionSubChapterData
  ): Promise<ApiResponse<SessionSubChapter>> {
    return apiService.put(
      `${BASE_URL}/${sessionUuid}/chapters/${chapterUuid}/sub-chapters/${subChapterUuid}`, 
      data
    );
  },

  /**
   * Supprimer un sous-chapitre de session
   */
  async deleteSessionSubChapter(
    sessionUuid: string,
    chapterUuid: string,
    subChapterUuid: string
  ): Promise<ApiResponse<void>> {
    return apiService.delete(
      `${BASE_URL}/${sessionUuid}/chapters/${chapterUuid}/sub-chapters/${subChapterUuid}`
    );
  },

  // ==================== DOCUMENTS OVERRIDE ====================

  /**
   * Initialiser l'override des documents
   */
  async initializeDocumentsOverride(sessionUuid: string): Promise<ApiResponse<InitializeOverrideResponse>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/initialize-documents-override`, {});
  },

  /**
   * Récupérer les documents effectifs
   */
  async getEffectiveDocuments(sessionUuid: string): Promise<ApiResponse<EffectiveDocumentsResponse>> {
    return apiService.get(`${BASE_URL}/${sessionUuid}/effective-documents`);
  },

  /**
   * Créer un nouveau document spécifique à la session
   */
  async createSessionDocument(
    sessionUuid: string, 
    data: SessionDocumentData
  ): Promise<ApiResponse<SessionDocument>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.document_type) formData.append('document_type', data.document_type);
    if (data.visibility) formData.append('visibility', data.visibility);
    if (data.order_index !== undefined) formData.append('order_index', String(data.order_index));
    if (data.file) formData.append('file', data.file);

    return apiService.post(`${BASE_URL}/${sessionUuid}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Modifier un document de session
   */
  async updateSessionDocument(
    sessionUuid: string, 
    documentUuid: string, 
    data: Partial<SessionDocumentData>
  ): Promise<ApiResponse<SessionDocument>> {
    if (data.file) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.document_type) formData.append('document_type', data.document_type);
      if (data.visibility) formData.append('visibility', data.visibility);
      if (data.order_index !== undefined) formData.append('order_index', String(data.order_index));
      formData.append('file', data.file);
      formData.append('_method', 'PUT');

      return apiService.post(`${BASE_URL}/${sessionUuid}/documents/${documentUuid}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    return apiService.put(`${BASE_URL}/${sessionUuid}/documents/${documentUuid}`, data);
  },

  /**
   * Supprimer un document de session
   */
  async deleteSessionDocument(
    sessionUuid: string, 
    documentUuid: string
  ): Promise<ApiResponse<void>> {
    return apiService.delete(`${BASE_URL}/${sessionUuid}/documents/${documentUuid}`);
  },

  /**
   * Restaurer un document supprimé
   */
  async restoreSessionDocument(
    sessionUuid: string, 
    documentUuid: string
  ): Promise<ApiResponse<SessionDocument>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/documents/${documentUuid}/restore`, {});
  },

  /**
   * Réinitialiser tous les documents (revenir au template du cours)
   */
  async resetDocumentsOverride(sessionUuid: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${BASE_URL}/${sessionUuid}/documents-override`);
  },

  // ==================== WORKFLOW OVERRIDE ====================

  /**
   * Initialiser l'override du workflow
   */
  async initializeWorkflowOverride(sessionUuid: string): Promise<ApiResponse<InitializeOverrideResponse>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/initialize-workflow-override`, {});
  },

  /**
   * Récupérer les actions workflow effectives
   */
  async getEffectiveWorkflowActions(sessionUuid: string): Promise<ApiResponse<EffectiveWorkflowActionsResponse>> {
    return apiService.get(`${BASE_URL}/${sessionUuid}/effective-workflow-actions`);
  },

  /**
   * Créer une nouvelle action workflow spécifique à la session
   */
  async createSessionWorkflowAction(
    sessionUuid: string, 
    data: SessionWorkflowActionData
  ): Promise<ApiResponse<SessionWorkflowAction>> {
    return apiService.post(`${BASE_URL}/${sessionUuid}/workflow-actions`, data);
  },

  /**
   * Modifier une action workflow de session
   */
  async updateSessionWorkflowAction(
    sessionUuid: string, 
    actionUuid: string, 
    data: Partial<SessionWorkflowActionData>
  ): Promise<ApiResponse<SessionWorkflowAction>> {
    return apiService.put(`${BASE_URL}/${sessionUuid}/workflow-actions/${actionUuid}`, data);
  },

  /**
   * Supprimer une action workflow de session
   */
  async deleteSessionWorkflowAction(
    sessionUuid: string, 
    actionUuid: string
  ): Promise<ApiResponse<void>> {
    return apiService.delete(`${BASE_URL}/${sessionUuid}/workflow-actions/${actionUuid}`);
  },

  /**
   * Réinitialiser le workflow (revenir au template du cours)
   */
  async resetWorkflowOverride(sessionUuid: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${BASE_URL}/${sessionUuid}/workflow-override`);
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Vérifier si un champ est hérité du cours ou overridé
   */
  isFieldInherited(session: SessionWithEffectiveData, fieldName: string): boolean {
    const inheritedKey = `${fieldName}_inherited` as keyof SessionWithEffectiveData;
    return session[inheritedKey] === true;
  },

  /**
   * Obtenir la valeur du cours template pour un champ
   */
  getCourseValue(session: SessionWithEffectiveData, fieldName: string): any {
    const course = session.course as any;
    return course?.[fieldName];
  },

  /**
   * Obtenir la valeur override pour un champ (null si hérite)
   */
  getOverrideValue(session: SessionWithEffectiveData, fieldName: string): any {
    const overrideKey = `${fieldName}_override` as keyof SessionWithEffectiveData;
    return session[overrideKey];
  },

  /**
   * Comparer si une valeur diffère du template
   */
  hasChangedFromTemplate(
    session: SessionWithEffectiveData, 
    fieldName: string, 
    currentValue: any
  ): boolean {
    const courseValue = this.getCourseValue(session, fieldName);
    return JSON.stringify(currentValue) !== JSON.stringify(courseValue);
  }
};

export default sessionOverrideService;

