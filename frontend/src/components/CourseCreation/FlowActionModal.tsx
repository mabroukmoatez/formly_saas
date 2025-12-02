import React, { useState, useEffect } from 'react';
import { X, Mail, Clock, Plus, Trash2, Paperclip, Check, User, Building2, FileText, ChevronDown, Upload, Search, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { apiService } from '../../services/api';

interface FlowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flowActionData: FlowActionData) => Promise<void>;
  courseId: string; // UUID
  emailTemplates?: EmailTemplate[];
  questionnaires?: Array<{ id: number; name: string; title?: string }>;
}

export interface FlowActionData {
  title: string;
  type: 'email' | 'notification' | 'document' | 'assignment' | 'reminder' | 'certificate' | 'payment' | 'enrollment' | 'completion' | 'feedback' | 'meeting' | 'resource';
  recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin';
  dest_type: 'email' | 'notification' | 'webhook';
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  n_days: number;
  custom_time?: string;
  email_id?: number | string; // Peut être un ID (number) ou un UUID (string)
  email_uuid?: string; // UUID du template si disponible
  dest?: string;
  files?: File[];
  document_ids?: number[]; // IDs des documents sélectionnés depuis la bibliothèque
  questionnaire_ids?: number[];
}

interface EmailTemplate {
  id?: number;
  uuid?: string;
  name: string;
  subject?: string;
  content?: string;
}

export const FlowActionModal: React.FC<FlowActionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseId,
  emailTemplates = [],
  questionnaires = []
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [title, setTitle] = useState('');
  const [actionType, setActionType] = useState<'email' | 'document'>('email');
  const [recipient, setRecipient] = useState<'formateur' | 'apprenant' | 'entreprise' | 'admin'>('apprenant');
  const [destType, setDestType] = useState<'email' | 'notification' | 'webhook'>('email');
  const [refDate, setRefDate] = useState<'enrollment' | 'completion' | 'start' | 'custom'>('start');
  const [timeType, setTimeType] = useState<'before' | 'after' | 'on'>('on');
  const [nDays, setNDays] = useState(0);
  const [customTime, setCustomTime] = useState<string>('');
  const [timeOption, setTimeOption] = useState<'start' | 'end' | 'custom'>('start');
  const [emailId, setEmailId] = useState<number | string | null>(null);
  const [emailUuid, setEmailUuid] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [documentIds, setDocumentIds] = useState<number[]>([]); // IDs des documents depuis la bibliothèque
  const [selectedDocuments, setSelectedDocuments] = useState<Array<{ id: number; name: string; uuid?: string }>>([]);
  const [questionnaireIds, setQuestionnaireIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Dropdown states
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [showTimingDay, setShowTimingDay] = useState(false);
  const [showTimingSession, setShowTimingSession] = useState(false);
  const [showTimingTime, setShowTimingTime] = useState(false);
  const [showQuestionnaires, setShowQuestionnaires] = useState(false);
  const [showDocumentLibrary, setShowDocumentLibrary] = useState(false);
  const [emailTemplateSearch, setEmailTemplateSearch] = useState('');
  const [questionnaireSearch, setQuestionnaireSearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [organizationDocuments, setOrganizationDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setActionType('email');
      setRecipient('apprenant');
      setDestType('email');
      setRefDate('start');
      setTimeType('on');
      setNDays(0);
      setCustomTime('');
      setTimeOption('start');
      setEmailId(null);
      setEmailUuid(null);
      setFiles([]);
      setDocumentIds([]);
      setSelectedDocuments([]);
      setQuestionnaireIds([]);
      setShowEmailTemplate(true); // Ouvrir par défaut pour Email
      setShowTimingDay(false);
      setShowTimingSession(false);
      setShowTimingTime(false);
      setShowQuestionnaires(false);
      setShowDocumentLibrary(false); // Fermer le modal de bibliothèque par défaut
      setEmailTemplateSearch('');
      setQuestionnaireSearch('');
      setDocumentSearch('');
      setSelectedFile(null);
      setOrganizationDocuments([]);
    }
  }, [isOpen]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFiles([e.target.files[0]]);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFiles([]);
  };

  const loadOrganizationDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const queryParams = new URLSearchParams();
      queryParams.append('exclude_questionnaires', 'true');
      const response = await apiService.get(`/api/organization/documents/all?${queryParams.toString()}`);
      if (response.success && response.data) {
        setOrganizationDocuments(response.data);
      } else if (response.data) {
        // Handle direct data response
        setOrganizationDocuments(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Error loading organization documents:', error);
      showError('Erreur', 'Impossible de charger les documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleSelectDocumentFromLibrary = (document: any) => {
    // Stocker l'ID/UUID du document au lieu de télécharger le fichier
    if (!document.id) {
      showError('Erreur', 'Document sans ID valide');
      return;
    }

    // Vérifier si le document n'est pas déjà sélectionné
    if (documentIds.includes(document.id)) {
      showError('Erreur', 'Ce document est déjà sélectionné');
      return;
    }

    // Ajouter l'ID du document
    setDocumentIds([...documentIds, document.id]);
    setSelectedDocuments([
      ...selectedDocuments,
      {
        id: document.id,
        name: document.name || document.title || `Document ${document.id}`,
        uuid: document.uuid
      }
    ]);
    setShowDocumentLibrary(false);
  };

  const handleRemoveDocument = (documentId: number) => {
    setDocumentIds(documentIds.filter(id => id !== documentId));
    setSelectedDocuments(selectedDocuments.filter(doc => doc.id !== documentId));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Erreur', 'Le titre est requis');
      return;
    }

    // Email template is required for both email and document types (document is sent via email)
    if (!emailId && !emailUuid) {
      showError('Erreur', 'Veuillez sélectionner un template d\'email');
      return;
    }

    // Validate n_days: if timeType is 'on', n_days must be 0
    const finalNDays = timeType === 'on' ? 0 : nDays;
    if (timeType !== 'on' && finalNDays <= 0) {
      showError('Erreur', 'Veuillez spécifier le nombre de jours');
      return;
    }

    setSaving(true);
    try {
      // Format custom_time correctly for backend
      // Only send custom_time if a specific time is selected
      let formattedCustomTime: string | undefined = undefined;
      if (timeOption === 'custom' && customTime) {
        // Ensure format is HH:MM:00 for backend
        formattedCustomTime = customTime.includes(':') && customTime.split(':').length === 2 ? `${customTime}:00` : customTime;
      }
      // If timeOption is 'start' or 'end', don't send custom_time (backend will use default)

      const flowActionData: FlowActionData = {
        title: title.trim(),
        type: actionType === 'document' ? 'document' : 'email',
        recipient: recipient,
        dest_type: destType,
        ref_date: refDate,
        time_type: timeType,
        n_days: finalNDays,
        custom_time: formattedCustomTime,
        files,
        document_ids: documentIds.length > 0 ? documentIds : undefined,
        questionnaire_ids: questionnaireIds.length > 0 ? questionnaireIds : undefined
      };

      // Email ID/UUID is required for both email and document types (document is sent via email)
      if (emailId || emailUuid) {
        // Si c'est un UUID (string), utiliser l'UUID directement
        if (emailId && typeof emailId === 'string' && emailId.includes('-')) {
          // C'est un UUID, chercher le template correspondant
          const template = emailTemplates.find(t => 
            (t.uuid && (t.uuid === emailId || t.uuid === emailUuid)) ||
            (t.id && String(t.id) === emailId)
          );
          
          if (template) {
            // Si le template a un ID numérique, l'utiliser
            if (template.id !== undefined && template.id !== null) {
              const templateId = typeof template.id === 'number' ? template.id : Number(template.id);
              if (!isNaN(templateId)) {
                flowActionData.email_id = templateId;
              } else {
                // Pas d'ID numérique, utiliser l'UUID
                flowActionData.email_uuid = template.uuid || emailId || emailUuid;
              }
            } else if (template.uuid) {
              // Le template n'a que un UUID, l'utiliser
              flowActionData.email_uuid = template.uuid;
            } else {
              // Fallback: utiliser l'UUID fourni
              flowActionData.email_uuid = emailId || emailUuid;
            }
          } else {
            // Template non trouvé, utiliser l'UUID fourni
            flowActionData.email_uuid = emailId || emailUuid;
          }
        } else if (emailId) {
          // C'est un ID numérique
          const templateId = typeof emailId === 'number' ? emailId : Number(emailId);
          if (isNaN(templateId)) {
            // Si ce n'est pas un nombre valide, essayer avec emailUuid
            if (emailUuid) {
              flowActionData.email_uuid = emailUuid;
            } else {
              showError('Erreur', 'L\'ID du template d\'email n\'est pas un nombre valide');
              setSaving(false);
              return;
            }
          } else {
            flowActionData.email_id = templateId;
          }
        } else if (emailUuid) {
          // Si seulement emailUuid est défini (pas emailId)
          flowActionData.email_uuid = emailUuid;
        }
      }

      // For document type, don't set dest (backend will use document_ids to construct the URL)
      // dest is only used for webhook type where it should be a valid URL
      if (actionType === 'document') {
        // Don't set dest for document type - backend will handle it from document_ids
        // flowActionData.dest = undefined;
      }


      await onSave(flowActionData);
      onClose();
    } catch (err: any) {
      console.error('Error creating flow action:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };


  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowTimingDay(false);
        setShowTimingSession(false);
        setShowTimingTime(false);
      }
      if (!target.closest('.email-template-container')) {
        setShowEmailTemplate(false);
      }
      if (!target.closest('.questionnaire-container')) {
        setShowQuestionnaires(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter email templates by search and exclude "Course Reminder"
  const filteredEmailTemplates = emailTemplates.filter(tpl => {
    const name = (tpl.name || '').toLowerCase();
    // Exclure "Course Reminder" (mocké/hardcodé)
    if (name === 'course reminder' || name === 'reminder' || name.includes('course reminder')) {
      return false;
    }
    return name.includes(emailTemplateSearch.toLowerCase());
  });

  // Filter questionnaires by search
  const filteredQuestionnaires = questionnaires.filter(q =>
    (q.name || q.title || '').toLowerCase().includes(questionnaireSearch.toLowerCase())
  );

  // Get timing day label
  const getTimingDayLabel = () => {
    if (timeType === 'on') return 'La Jour Même De';
    if (timeType === 'before') return `${nDays > 0 ? nDays + ' ' : ''}Jour${nDays > 1 ? 's' : ''} Avant`;
    if (timeType === 'after') return `${nDays > 0 ? nDays + ' ' : ''}Jour${nDays > 1 ? 's' : ''} Apres`;
    return 'La Jour Même De';
  };

  // Get timing session label
  const getTimingSessionLabel = () => {
    if (refDate === 'start') return 'Premier Séance';
    if (refDate === 'enrollment') return 'Demarage de la session';
    if (refDate === 'completion') return 'dernier seance';
    return 'Premier Séance';
  };

  // Get timing time label
  const getTimingTimeLabel = () => {
    if (timeOption === 'start') return "L'heur De Début De La Séance";
    if (timeOption === 'end') return "L'heur De Fin De La Séance";
    if (timeOption === 'custom' && customTime) return `Heur Specifique (${customTime})`;
    return "L'heur De Début De La Séance";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className={`relative w-full max-w-2xl max-h-[95vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ajouter une action automatique
              </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={saving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] space-y-4">
          {/* Title Input */}
          <div>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Titre De L'action" 
              className={`${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`} 
            />
          </div>

          {/* Recipient Selection */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRecipient('formateur')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                recipient === 'formateur'
                  ? 'text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={recipient === 'formateur' ? { backgroundColor: primaryColor } : {}}
            >
              <User className="w-4 h-4" />
              Formateur
            </button>
            <button
              onClick={() => setRecipient('apprenant')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                recipient === 'apprenant'
                  ? 'text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={recipient === 'apprenant' ? { backgroundColor: '#ec4899' } : {}}
            >
              <User className="w-4 h-4" />
              Apprenant
            </button>
            <button
              onClick={() => setRecipient('entreprise')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                recipient === 'entreprise'
                  ? 'text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={recipient === 'entreprise' ? { backgroundColor: primaryColor } : {}}
            >
              <Building2 className="w-4 h-4" />
              Entreprise
            </button>
          </div>

          {/* Enverra Un - Action Type */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enverra Un</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionType('email');
                  setDestType('email');
                  // Pour Email, toujours ouvrir la sélection de template pour voir la liste
                  setShowEmailTemplate(true);
                  // Fermer le modal de bibliothèque de documents si ouvert
                  setShowDocumentLibrary(false);
                }}
                className="px-4 py-2.5 rounded-lg font-medium transition-all"
                style={
                  actionType === 'email'
                    ? { backgroundColor: primaryColor, color: 'white', border: 'none' }
                    : isDark
                      ? { backgroundColor: '#374151', color: '#d1d5db', border: 'none' }
                      : { backgroundColor: '#f3f4f6', color: '#374151', border: 'none' }
                }
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('document');
                  setDestType('email');
                  // Pour Document, fermer la sélection de template email
                  setShowEmailTemplate(false);
                  // Fermer aussi le modal de bibliothèque si ouvert (sera réouvert si nécessaire)
                  setShowDocumentLibrary(false);
                }}
                className="px-4 py-2.5 rounded-lg font-medium transition-all"
                style={
                  actionType === 'document'
                    ? { backgroundColor: primaryColor, color: 'white', border: 'none' }
                    : isDark
                      ? { backgroundColor: '#374151', color: '#d1d5db', border: 'none' }
                      : { backgroundColor: '#f3f4f6', color: '#374151', border: 'none' }
                }
              >
                Document
              </button>
            </div>

            {/* Email Template Selection - Show when Email is selected or when Document has a template */}
            {actionType === 'email' && (
              <div className="mt-3">
                {/* Show selected template if exists */}
                {emailId && !showEmailTemplate && (
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {emailTemplates.find(t => 
                            (t.id && emailId && String(t.id) === String(emailId)) ||
                            (t.uuid && emailUuid && t.uuid === emailUuid) ||
                            (t.uuid && emailId && t.uuid === String(emailId))
                          )?.name || 'Template sélectionné'}
                        </span>
                        <Check className="w-4 h-4" style={{ color: primaryColor }} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowEmailTemplate(true);
                          setEmailTemplateSearch('');
                        }}
                      >
                        Modifier
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show template selection UI for Email */}
                {(!emailId || showEmailTemplate) && (
                  <div className={`p-4 rounded-lg border email-template-container ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sélectionner un template d'email
                        </span>
                        {emailId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowEmailTemplate(false);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {filteredEmailTemplates.length > 0 ? (
                        <>
                          <div className="relative mb-3">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <Input
                              value={emailTemplateSearch}
                              onChange={(e) => setEmailTemplateSearch(e.target.value)}
                              placeholder="Rechercher un template..."
                              className={`pl-10 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                            />
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {filteredEmailTemplates.map(tpl => (
                <button
                                key={tpl.id || tpl.uuid || `template-${Math.random()}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Gérer id (number) ou uuid (string)
                                  if (tpl.id !== undefined && tpl.id !== null) {
                                    const templateId = typeof tpl.id === 'number' ? tpl.id : Number(tpl.id);
                                    if (isNaN(templateId)) {
                                      showError('Erreur', 'ID de template invalide');
                                      return;
                                    }
                                    setEmailId(templateId);
                                    setEmailUuid(null);
                                  } else if (tpl.uuid) {
                                    // Utiliser l'UUID si disponible, mais chercher l'ID numérique
                                    setEmailUuid(tpl.uuid);
                                    // Si le template a un ID, l'utiliser, sinon utiliser l'UUID (le backend devra le convertir)
                                    if (tpl.id) {
                                      setEmailId(typeof tpl.id === 'number' ? tpl.id : Number(tpl.id));
                                    } else {
                                      // Stocker l'UUID temporairement, on cherchera l'ID plus tard
                                      setEmailId(tpl.uuid);
                                    }
                                  } else {
                                    showError('Erreur', 'Template sans ID ni UUID');
                                    return;
                                  }
                                  
                                  setShowEmailTemplate(false);
                                  setEmailTemplateSearch('');
                                }}
                                className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                                  ((emailId && tpl.id && String(emailId) === String(tpl.id)) || 
                                   (emailUuid && tpl.uuid && emailUuid === tpl.uuid) ||
                                   (emailId && tpl.uuid && String(emailId) === tpl.uuid))
                                    ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                                    : isDark ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-600' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                  {tpl.name || 'Template sans nom'}
                                </span>
                                {((emailId && tpl.id && String(emailId) === String(tpl.id)) || 
                                  (emailUuid && tpl.uuid && emailUuid === tpl.uuid) ||
                                  (emailId && tpl.uuid && String(emailId) === tpl.uuid)) && (
                                  <Check className="w-4 h-4 ml-auto" style={{ color: primaryColor }} />
                                )}
                </button>
              ))}
                          </div>
                        </>
                      ) : (
                        <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Aucun template d'email disponible
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Template Selection - Show when Document is selected */}
            {actionType === 'document' && (
              <div className="mt-3">
                {/* Show selected template if exists */}
                {emailId && !showEmailTemplate && (
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Template: {emailTemplates.find(t => 
                            (t.id && emailId && String(t.id) === String(emailId)) ||
                            (t.uuid && emailUuid && t.uuid === emailUuid) ||
                            (t.uuid && emailId && t.uuid === String(emailId))
                          )?.name || 'Template sélectionné'}
                        </span>
                        <Check className="w-4 h-4" style={{ color: primaryColor }} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowEmailTemplate(true);
                          setEmailTemplateSearch('');
                        }}
                      >
                        Modifier
                      </Button>
            </div>
          </div>
                )}

                {/* Show button to select template if none selected */}
                {!emailId && !showEmailTemplate && (
                  <button
                    onClick={() => {
                      setShowEmailTemplate(true);
                      setEmailTemplateSearch('');
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all border-2 border-dashed ${
                      isDark
                        ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Choisir un template d'email pour envoyer le document
                  </button>
                )}

                {/* Show template selection UI for Document - Only if explicitly opened */}
                {showEmailTemplate && (
                  <div className={`p-4 rounded-lg border email-template-container ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sélectionner le template d'email pour envoyer le document
                        </span>
                        {emailId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowEmailTemplate(false);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {filteredEmailTemplates.length > 0 ? (
                        <>
                          <div className="relative mb-3">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <Input
                              value={emailTemplateSearch}
                              onChange={(e) => setEmailTemplateSearch(e.target.value)}
                              placeholder="Rechercher un template..."
                              className={`pl-10 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                            />
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {filteredEmailTemplates.map(tpl => (
                              <button
                                key={tpl.id || tpl.uuid || `template-${Math.random()}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Gérer id (number) ou uuid (string)
                                  if (tpl.id !== undefined && tpl.id !== null) {
                                    const templateId = typeof tpl.id === 'number' ? tpl.id : Number(tpl.id);
                                    if (isNaN(templateId)) {
                                      showError('Erreur', 'ID de template invalide');
                                      return;
                                    }
                                    setEmailId(templateId);
                                    setEmailUuid(null);
                                  } else if (tpl.uuid) {
                                    // Utiliser l'UUID si disponible, mais chercher l'ID numérique
                                    setEmailUuid(tpl.uuid);
                                    // Si le template a un ID, l'utiliser, sinon utiliser l'UUID (le backend devra le convertir)
                                    if (tpl.id) {
                                      setEmailId(typeof tpl.id === 'number' ? tpl.id : Number(tpl.id));
                                    } else {
                                      // Stocker l'UUID temporairement, on cherchera l'ID plus tard
                                      setEmailId(tpl.uuid);
                                    }
                                  } else {
                                    showError('Erreur', 'Template sans ID ni UUID');
                                    return;
                                  }
                                  
                                  setShowEmailTemplate(false);
                                  setEmailTemplateSearch('');
                                }}
                                className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                                  ((emailId && tpl.id && String(emailId) === String(tpl.id)) || 
                                   (emailUuid && tpl.uuid && emailUuid === tpl.uuid) ||
                                   (emailId && tpl.uuid && String(emailId) === tpl.uuid))
                                    ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                                    : isDark ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-600' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                  {tpl.name || 'Template sans nom'}
                                </span>
                                {((emailId && tpl.id && String(emailId) === String(tpl.id)) || 
                                  (emailUuid && tpl.uuid && emailUuid === tpl.uuid) ||
                                  (emailId && tpl.uuid && String(emailId) === tpl.uuid)) && (
                                  <Check className="w-4 h-4 ml-auto" style={{ color: primaryColor }} />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Aucun template d'email disponible
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
            )}
          </div>

          {/* Avec - Files - Only show for Document type */}
          {actionType === 'document' && (
            <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Avec</span>
            </div>
            
            {/* Documents sélectionnés depuis la bibliothèque */}
            {selectedDocuments.length > 0 && (
              <div className="space-y-2 mb-2">
                {selectedDocuments.map((doc) => (
                  <div key={doc.id} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8" style={{ color: primaryColor }} />
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {doc.name}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Depuis la bibliothèque
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveDocument(doc.id)} 
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}

            {/* Fichier uploadé */}
            {actionType === 'document' && selectedFile && (
              <div className={`p-3 rounded-lg border mb-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8" style={{ color: primaryColor }} />
            <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedFile.name}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Fichier importé
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        document.getElementById('file-input')?.click();
                      }}
                    >
                      Modifier
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="text-red-500">
                      Retirer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action si aucun fichier/document */}
            {actionType === 'document' && selectedDocuments.length === 0 && !selectedFile && (
              <div className="space-y-2">
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all w-full ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aucun Fichier Jont
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setShowDocumentLibrary(true);
                      if (organizationDocuments.length === 0) {
                        loadOrganizationDocuments();
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Choisir Un Document Depuis La Bibliothèque
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importer Un Fichier
                  </Button>
                </div>
            </div>
          )}

            {/* Boutons d'action si des fichiers/documents sont déjà sélectionnés */}
            {actionType === 'document' && (selectedDocuments.length > 0 || selectedFile) && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  onClick={() => {
                    setShowDocumentLibrary(true);
                    if (organizationDocuments.length === 0) {
                      loadOrganizationDocuments();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Ajouter Depuis La Bibliothèque
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter Un Fichier
                </Button>
              </div>
            )}

            <input
              id="file-input"
              type="file"
              onChange={handleFileAdd}
              className="hidden"
            />
            </div>
          )}

          {/* Et - Questionnaires */}
          <div className="relative dropdown-container questionnaire-container">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Et</span>
            </div>
            <button
              onClick={() => setShowQuestionnaires(!showQuestionnaires)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all w-full flex items-center justify-between ${
                questionnaireIds.length > 0
                  ? 'text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={questionnaireIds.length > 0 ? { backgroundColor: primaryColor } : {}}
            >
              <span>
                {questionnaireIds.length > 0 
                  ? `${questionnaireIds.length} Questionnaire${questionnaireIds.length > 1 ? 's' : ''} Sélectionné${questionnaireIds.length > 1 ? 's' : ''}`
                  : 'Aucun Questionnaire'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showQuestionnaires ? 'rotate-180' : ''}`} />
            </button>
            
            {showQuestionnaires && (
              <div className={`absolute z-10 w-full mt-2 p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-lg max-h-64 overflow-y-auto`}>
                {questionnaires.length > 0 ? (
                  <>
                    <div className="relative mb-3">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <Input
                        value={questionnaireSearch}
                        onChange={(e) => setQuestionnaireSearch(e.target.value)}
                        placeholder="Rechercher un questionnaire"
                        className={`pl-10 text-sm ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      {filteredQuestionnaires.map(q => (
                        <label key={q.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                          <input
                            type="checkbox"
                            checked={questionnaireIds.includes(q.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuestionnaireIds([...questionnaireIds, q.id]);
                              } else {
                                setQuestionnaireIds(questionnaireIds.filter(id => id !== q.id));
                              }
                            }}
                            className="w-4 h-4"
                            style={{ accentColor: primaryColor }}
                          />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {q.name || q.title || `Questionnaire ${q.id}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucun questionnaire disponible
                  </div>
                )}
              </div>
            )}
          </div>

          {/* A - Recipient */}
            <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>A</span>
            </div>
            <button
              className={`px-4 py-2.5 rounded-lg font-medium transition-all w-full text-white`}
              style={{ backgroundColor: primaryColor }}
            >
              Chaque {recipient === 'formateur' ? 'Formateur' : recipient === 'apprenant' ? 'Apprenant' : 'Entreprise'}
            </button>
            </div>

          {/* Et Ce - Timing Day */}
          <div className="relative dropdown-container">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Et Ce</span>
            </div>
            <button
              onClick={() => setShowTimingDay(!showTimingDay)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all w-full flex items-center justify-between ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{getTimingDayLabel()}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTimingDay ? 'rotate-180' : ''}`} />
            </button>
            
            {showTimingDay && (
              <div className={`absolute z-10 w-full mt-2 p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-lg`}>
                <div className="space-y-2">
                  {[
                    { value: 'before', label: 'Jour Avant' },
                    { value: 'on', label: 'Jour Meme' },
                    { value: 'after', label: 'Jour Apres' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={timeType === option.value}
                        onChange={() => {
                          setTimeType(option.value as any);
                          if (option.value !== 'on') setNDays(1);
                        }}
                        className="w-4 h-4"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{option.label}</span>
                    </label>
                  ))}
                  {timeType !== 'on' && (
                    <div className="mt-3">
                      <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Nombre de jours
                      </Label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={nDays || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNDays(val > 0 ? val : 1);
                        }}
                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                        placeholder="Nombre de jours"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* La - Timing Session */}
          <div className="relative dropdown-container">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>La</span>
            </div>
            <button
              onClick={() => setShowTimingSession(!showTimingSession)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all w-full flex items-center justify-between ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{getTimingSessionLabel()}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTimingSession ? 'rotate-180' : ''}`} />
            </button>
            
            {showTimingSession && (
              <div className={`absolute z-10 w-full mt-2 p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-lg`}>
            <div className="space-y-2">
                  {[
                    { value: 'enrollment', label: 'Demarage de la session' },
                    { value: 'start', label: 'premier seance' },
                    { value: 'completion', label: 'dernier seance' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={refDate === option.value}
                        onChange={() => setRefDate(option.value as any)}
                        className="w-4 h-4"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* A - Timing Time */}
          <div className="relative dropdown-container">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>A</span>
            </div>
            <button
              onClick={() => setShowTimingTime(!showTimingTime)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all w-full flex items-center justify-between ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{getTimingTimeLabel()}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTimingTime ? 'rotate-180' : ''}`} />
            </button>
            
            {showTimingTime && (
              <div className={`absolute z-10 w-full mt-2 p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-lg`}>
                <div className="space-y-2">
                  {[
                    { value: 'start', label: "l'Heure de debute de seance" },
                    { value: 'end', label: "l'Heure de fin de seance" },
                    { value: 'custom', label: 'Heur Specifique' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={timeOption === option.value}
                        onChange={() => {
                          setTimeOption(option.value as any);
                          if (option.value === 'custom') {
                            setCustomTime('10:00');
                          } else {
                            setCustomTime('');
                          }
                        }}
                        className="w-4 h-4"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{option.label}</span>
                    </label>
                  ))}
                  {timeOption === 'custom' && (
                    <div className="mt-3">
                      <Input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className={`${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Library Modal */}
        {showDocumentLibrary && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className={`w-full max-w-4xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Choisir Un Document Depuis La Bibliothèque
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDocumentLibrary(false)}
                    className={isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    placeholder="Rechercher un document..."
                    className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                {loadingDocuments ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                    {organizationDocuments
                      .filter(doc => 
                        (doc.name || doc.title || '').toLowerCase().includes(documentSearch.toLowerCase())
                      )
                      .map((document) => {
                        const isSelected = documentIds.includes(document.id);
                        return (
                          <Card
                            key={document.id || document.uuid}
                            onClick={() => handleSelectDocumentFromLibrary(document)}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                                : isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            style={isSelected ? { borderWidth: '2px' } : {}}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                  <FileText className="w-8 h-8" style={{ color: primaryColor }} />
                                </div>
                                <h3 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {document.name || document.title || `Document ${document.id}`}
                                </h3>
                                {document.description && (
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {document.description.substring(0, 50)}...
                                  </p>
                                )}
                                {isSelected && (
                                  <Check className="w-5 h-5 mt-2" style={{ color: primaryColor }} />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    {organizationDocuments.filter(doc => 
                      (doc.name || doc.title || '').toLowerCase().includes(documentSearch.toLowerCase())
                    ).length === 0 && (
                      <div className={`col-span-full text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aucun document trouvé
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={saving}
            className="px-6"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={
              saving || 
              !title.trim() || 
              (!emailId && !emailUuid) || 
              (timeType !== 'on' && nDays < 1)
            } 
            style={{ backgroundColor: primaryColor }}
            className="px-6"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Création...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
