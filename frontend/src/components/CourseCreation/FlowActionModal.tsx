import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Paperclip, Check, Users, Building2, Upload, Search, Clock, Calendar, FileText, GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { courseCreation } from '../../services/courseCreation';
import { apiService } from '../../services/api';

interface FlowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flowActionData: FlowActionData) => Promise<void>;
  courseId: string;
  emailTemplates?: EmailTemplate[];
  editingAction?: FlowAction | null;
}

export interface FlowActionData {
  title: string;
  type: 'email' | 'notification' | 'document' | 'assignment' | 'certificate' | 'payment' | 'enrollment' | 'completion' | 'feedback' | 'meeting' | 'resource';
  recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin';
  dest_type: 'email' | 'notification' | 'webhook';
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  n_days: number;
  custom_time?: string;
  email_id?: number;
  dest?: string;
  files?: File[];
  questionnaire_ids?: number[];
  document_id?: number; // For document selection from library
}

interface FlowAction {
  id: number;
  title: string;
  recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin';
  dest_type: 'email' | 'notification' | 'webhook';
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  n_days: number;
  custom_time?: string;
  email_id?: number;
  files?: Array<{ id: number; file_name: string; file_url?: string }>;
  questionnaires?: Array<{ id: number; name: string }>;
  document_id?: number;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject?: string;
  content?: string;
}

interface Document {
  id: number;
  name: string;
  file_url?: string;
  file_name?: string;
}

export const FlowActionModal: React.FC<FlowActionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseId: _courseId,
  emailTemplates = [],
  editingAction = null
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState<'formateur' | 'apprenant' | 'entreprise' | 'admin'>('apprenant');
  const [refDate, setRefDate] = useState<'enrollment' | 'completion' | 'start' | 'custom'>('start');
  const [timeType, setTimeType] = useState<'before' | 'after' | 'on'>('on');
  const [nDays, setNDays] = useState(3);
  const [customTime, setCustomTime] = useState('20:30');
  const [timeOption, setTimeOption] = useState<'session_start' | 'session_end' | 'custom'>('session_start');
  const [emailId, setEmailId] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ file: File; preview?: string }>>([]);
  const [questionnaireIds, setQuestionnaireIds] = useState<number[]>([]);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<any[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [saving, setSaving] = useState(false);
  const [showQuestionnairePicker, setShowQuestionnairePicker] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [showEmailTemplatePicker, setShowEmailTemplatePicker] = useState(false);
  const [showTimePopover, setShowTimePopover] = useState(false);
  const [showSessionPopover, setShowSessionPopover] = useState(false);
  const [showTimeOptionPopover, setShowTimeOptionPopover] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [availableEmailTemplates, setAvailableEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailTemplateSearch, setEmailTemplateSearch] = useState('');
  const [actionType, setActionType] = useState<'email' | 'document'>('email');

  const timePopoverRef = useRef<HTMLDivElement>(null);
  const sessionPopoverRef = useRef<HTMLDivElement>(null);
  const timeOptionPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuestionnaires();
      loadDocuments();
      loadEmailTemplates();
      if (editingAction) {
        setTitle(editingAction.title);
        setRecipient(editingAction.recipient);
        setRefDate(editingAction.ref_date);
        setTimeType(editingAction.time_type);
        setNDays(editingAction.n_days);
        setCustomTime(editingAction.custom_time || '20:30');
        setEmailId(editingAction.email_id || null);
        setDocumentId(editingAction.document_id || null);
        setQuestionnaireIds(editingAction.questionnaires?.map(q => q.id) || []);
        setActionType(editingAction.document_id ? 'document' : 'email');
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingAction]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePopoverRef.current && !timePopoverRef.current.contains(event.target as Node)) {
        setShowTimePopover(false);
      }
      if (sessionPopoverRef.current && !sessionPopoverRef.current.contains(event.target as Node)) {
        setShowSessionPopover(false);
      }
      if (timeOptionPopoverRef.current && !timeOptionPopoverRef.current.contains(event.target as Node)) {
        setShowTimeOptionPopover(false);
      }
    };

    if (showTimePopover || showSessionPopover || showTimeOptionPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimePopover, showSessionPopover, showTimeOptionPopover]);

  const resetForm = () => {
    setTitle('');
    setRecipient('apprenant');
    setRefDate('start');
    setTimeType('on');
    setNDays(3);
    setCustomTime('20:30');
    setTimeOption('session_start');
    setEmailId(null);
    setDocumentId(null);
    setFiles([]);
    setFilePreviews([]);
    setQuestionnaireIds([]);
    setActionType('email');
  };

  const loadQuestionnaires = async () => {
    try {
      const response: any = await courseCreation.getAllOrganizationDocuments({
        exclude_questionnaires: false
      });
      if (response.success && response.data) {
        const questionnaires = response.data.filter((d: any) =>
          d.is_questionnaire || d.questionnaire_type || d.questions
        );
        setAvailableQuestionnaires(questionnaires);
      }
    } catch (error: any) {
      console.error('Error loading questionnaires:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response: any = await courseCreation.getAllOrganizationDocuments({
        exclude_questionnaires: true
      });
      if (response.success && response.data) {
        const docs = response.data.filter((d: any) => !d.is_questionnaire);
        setAvailableDocuments(docs);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      setLoadingTemplates(true);
      // Use API endpoint for email templates from library
      const response: any = await apiService.getEmailTemplates({
        per_page: 100,
        search: emailTemplateSearch
      });
      if (response.success && response.data) {
        const templates = Array.isArray(response.data) 
          ? response.data 
          : (response.data.templates || response.data.data || []);
        setAvailableEmailTemplates(templates);
      } else {
        setAvailableEmailTemplates([]);
      }
    } catch (error: any) {
      console.error('Error loading email templates:', error);
      setAvailableEmailTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (showEmailTemplatePicker) {
      loadEmailTemplates();
    }
  }, [emailTemplateSearch, showEmailTemplatePicker]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      
      // Create previews
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreviews(prev => [...prev, { file, preview: e.target?.result as string }]);
          };
          reader.readAsDataURL(file);
        } else {
          setFilePreviews(prev => [...prev, { file }]);
        }
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const handleToggleQuestionnaire = (questionnaireId: number) => {
    if (questionnaireIds.includes(questionnaireId)) {
      setQuestionnaireIds(questionnaireIds.filter(id => id !== questionnaireId));
    } else {
      setQuestionnaireIds([...questionnaireIds, questionnaireId]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Erreur', 'Le titre est requis');
      return;
    }

    if (actionType === 'email' && !emailId) {
      showError('Erreur', 'Veuillez sélectionner un template d\'email');
      return;
    }

    if (actionType === 'document' && !documentId) {
      showError('Erreur', 'Veuillez sélectionner un document');
      return;
    }

    setSaving(true);
    try {
      const flowActionData: FlowActionData = {
        title: title.trim(),
        type: actionType === 'email' ? 'email' : 'document',
        recipient: recipient,
        dest_type: 'email',
        ref_date: refDate,
        time_type: timeType,
        n_days: nDays,
        custom_time: timeOption === 'custom' ? customTime : undefined,
        email_id: actionType === 'email' ? (emailId || undefined) : undefined,
        document_id: actionType === 'document' ? (documentId || undefined) : undefined,
        files: files.length > 0 ? files : undefined,
        questionnaire_ids: questionnaireIds.length > 0 ? questionnaireIds : undefined
      };

      await onSave(flowActionData);
    } catch (err: any) {
      console.error('Error saving flow action:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const getRecipientLabel = (rec: string) => {
    switch (rec) {
      case 'apprenant': return 'Apprenant';
      case 'formateur': return 'Formateur';
      case 'entreprise': return 'Entreprise';
      default: return 'Admin';
    }
  };

  const getRecipientIcon = (rec: string) => {
    switch (rec) {
      case 'apprenant': return <GraduationCap className="w-4 h-4" />;
      case 'formateur': return <Users className="w-4 h-4" />;
      case 'entreprise': return <Building2 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRefDateLabel = (ref: string) => {
    switch (ref) {
      case 'start': return 'Premier Séance';
      case 'enrollment': return 'Inscription';
      case 'completion': return 'Fin Du Cours';
      default: return 'Premier Séance';
    }
  };

  const getTimeTypeLabel = (type: string) => {
    switch (type) {
      case 'on': return 'La Jour Même De';
      case 'before': return `${nDays} Jours Avant`;
      case 'after': return `${nDays} Jours Après`;
      default: return 'La Jour Même De';
    }
  };

  const filteredEmailTemplates = availableEmailTemplates.filter(tpl =>
    tpl.name.toLowerCase().includes(emailTemplateSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editingAction ? `L'action Nommée ${editingAction.title}` : '+ ajouter une action automatique'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={saving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Title */}
          <div>
            <label className={`mb-2 block text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Titre De L'action
            </label>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Example De Titre"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Recipient Selection */}
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRecipient('formateur')}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  recipient === 'formateur'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : isDark
                      ? 'border-gray-600 bg-gray-700 text-gray-300'
                      : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {getRecipientIcon('formateur')}
                Formateur
              </button>
              <button
                onClick={() => setRecipient('apprenant')}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  recipient === 'apprenant'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : isDark
                      ? 'border-gray-600 bg-gray-700 text-gray-300'
                      : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {getRecipientIcon('apprenant')}
                Apprenant
              </button>
              <button
                onClick={() => setRecipient('entreprise')}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  recipient === 'entreprise'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : isDark
                      ? 'border-gray-600 bg-gray-700 text-gray-300'
                      : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {getRecipientIcon('entreprise')}
                Entreprise
              </button>
            </div>
          </div>

          {/* Action Type Selection - Email or Document */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enverra Un</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActionType('email');
                    setDocumentId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    actionType === 'email'
                      ? `border-[${primaryColor}] bg-[${primaryColor}] text-white`
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-gray-300'
                        : 'border-gray-300 bg-white text-gray-700'
                  }`}
                  style={actionType === 'email' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  <Mail className="w-4 h-4" />
                  Email
                  {emailId && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Email Template Selection */}
            {actionType === 'email' && (
              <div className="mt-2 space-y-2">
                {!emailId ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEmailTemplatePicker(true)}
                      className="flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Choisir Un Modèle Depuis La Bibliothèque
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('email-file-input')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Importer Un Fichier
                    </Button>
                    <input
                      type="file"
                      accept=".html,.txt"
                      id="email-file-input"
                      className="hidden"
                      onChange={(e) => {
                        // Handle email file import
                        console.log('Email file import:', e.target.files);
                      }}
                    />
                  </div>
                ) : (
                  <div className={`p-3 rounded-lg border-2 ${isDark ? 'border-green-600 bg-gray-700' : 'border-green-500 bg-green-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          {availableEmailTemplates.find(t => t.id === emailId)?.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEmailId(null);
                          setShowEmailTemplatePicker(true);
                        }}
                      >
                        Choisir Un Autre Modèle
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Selection */}
            {actionType === 'document' && (
              <div className="mt-2">
                {!documentId ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDocumentPicker(true)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Choisir Un Document Depuis La Bibliothèque
                  </Button>
                ) : (
                  <div className={`p-3 rounded-lg border-2 ${isDark ? 'border-blue-600 bg-gray-700' : 'border-blue-500 bg-blue-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                        {availableDocuments.find(d => d.id === documentId)?.name || 'Document sélectionné'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocumentId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Files and Questionnaires */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Avec</span>
              {files.length === 0 ? (
                <label
                  htmlFor="file-input"
                  className={`px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`}
                >
                  Aucun Fichier Jont
                </label>
              ) : (
                <div className="relative">
                  <button
                    className="text-green-600 text-sm font-medium hover:underline"
                    onClick={() => {
                      // Show file preview popover
                    }}
                  >
                    {files.length} Fichier Joint
                  </button>
                  {/* File Preview Popover */}
                  {filePreviews.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
                      {filePreviews.map((preview, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2 last:mb-0">
                          {preview.preview ? (
                            <img src={preview.preview} alt={preview.file.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <FileText className="w-12 h-12 text-gray-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{preview.file.name}</p>
                            <p className="text-xs text-gray-500">Ajouter il y a {index + 1} seconde{index > 0 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Modifier</Button>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500" onClick={() => handleRemoveFile(index)}>Retirer</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                multiple
                onChange={handleFileAdd}
                className="hidden"
                id="file-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Et</span>
              {questionnaireIds.length === 0 ? (
                <button
                  onClick={() => setShowQuestionnairePicker(true)}
                  className={`px-4 py-2 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`}
                >
                  Aucun Questionnaire
                </button>
              ) : (
                <button
                  className="text-blue-600 text-sm font-medium"
                  onClick={() => setShowQuestionnairePicker(true)}
                >
                  {questionnaireIds.length} Questionnaire
                </button>
              )}
            </div>
          </div>

          {/* Recipient Summary */}
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>A</span>
              <span className={`text-sm font-medium ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                Chaque {getRecipientLabel(recipient)}
              </span>
            </div>
          </div>

          {/* Timing Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Et Ce</span>
              <div className="relative" ref={timePopoverRef}>
                <button
                  onClick={() => setShowTimePopover(!showTimePopover)}
                  className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {getTimeTypeLabel(timeType)}
                </button>
                {showTimePopover && (
                  <div className="absolute top-full left-0 mt-2 z-20 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="timeType"
                          value="before"
                          checked={timeType === 'before'}
                          onChange={() => {
                            setTimeType('before');
                            setShowTimePopover(false);
                          }}
                        />
                        <span className="text-sm">Jour Avant</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="timeType"
                          value="on"
                          checked={timeType === 'on'}
                          onChange={() => {
                            setTimeType('on');
                            setShowTimePopover(false);
                          }}
                        />
                        <span className="text-sm">Jour Meme</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="timeType"
                          value="after"
                          checked={timeType === 'after'}
                          onChange={() => {
                            setTimeType('after');
                            setShowTimePopover(false);
                          }}
                        />
                        <span className="text-sm">Jour Apres</span>
                      </label>
                    </div>
                    {timeType === 'before' && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          min="0"
                          value={nDays}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNDays(Number(e.target.value))}
                          className="w-full"
                          placeholder="Nombre de jours"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>La</span>
              <div className="relative" ref={sessionPopoverRef}>
                <button
                  onClick={() => setShowSessionPopover(!showSessionPopover)}
                  className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {getRefDateLabel(refDate)}
                </button>
                {showSessionPopover && (
                  <div className="absolute top-full left-0 mt-2 z-20 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="refDate"
                          value="start"
                          checked={refDate === 'start'}
                          onChange={() => {
                            setRefDate('start');
                            setShowSessionPopover(false);
                          }}
                        />
                        <span className="text-sm">Demarage de la session</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="refDate"
                          value="start"
                          checked={refDate === 'start'}
                          onChange={() => {
                            setRefDate('start');
                            setShowSessionPopover(false);
                          }}
                        />
                        <span className="text-sm">premier seance</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="refDate"
                          value="completion"
                          checked={refDate === 'completion'}
                          onChange={() => {
                            setRefDate('completion');
                            setShowSessionPopover(false);
                          }}
                        />
                        <span className="text-sm">dernier seance</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>A</span>
              <div className="relative" ref={timeOptionPopoverRef}>
                <button
                  onClick={() => setShowTimeOptionPopover(!showTimeOptionPopover)}
                  className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {timeOption === 'session_start' && "L'heur De Début De La Séance"}
                  {timeOption === 'session_end' && "L'heur De Fin De La Séance"}
                  {timeOption === 'custom' && customTime}
                </button>
                {showTimeOptionPopover && (
                  <div className="absolute top-full left-0 mt-2 z-20 bg-white border rounded-lg shadow-lg p-3 min-w-[250px]">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="timeOption"
                          value="session_start"
                          checked={timeOption === 'session_start'}
                          onChange={() => {
                            setTimeOption('session_start');
                            setShowTimeOptionPopover(false);
                          }}
                        />
                        <span className="text-sm">l'Heure de debute de seance</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="timeOption"
                          value="session_end"
                          checked={timeOption === 'session_end'}
                          onChange={() => {
                            setTimeOption('session_end');
                            setShowTimeOptionPopover(false);
                          }}
                        />
                        <span className="text-sm">l'Heure de fin de seance</span>
                      </label>
                      <div className="pt-2 border-t">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="radio"
                            name="timeOption"
                            value="custom"
                            checked={timeOption === 'custom'}
                            onChange={() => setTimeOption('custom')}
                          />
                          <span className="text-sm">Heur Specifique</span>
                        </label>
                        {timeOption === 'custom' && (
                          <Input
                            type="time"
                            value={customTime}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setCustomTime(e.target.value);
                              setShowTimeOptionPopover(false);
                            }}
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose} disabled={saving} className="px-6">
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: primaryColor }} className="px-6">
            {saving ? 'Enregistrement...' : editingAction ? 'Valider ✓' : 'Ajouter'}
          </Button>
        </div>
      </Card>

      {/* Email Template Picker Modal */}
      {showEmailTemplatePicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEmailTemplatePicker(false)} />
          <Card className={`relative w-full max-w-md max-h-[80vh] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Choise Un Model
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={emailTemplateSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailTemplateSearch(e.target.value)}
                  placeholder="Q Totre De L'email Template"
                  className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingTemplates ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">Chargement...</div>
                </div>
              ) : filteredEmailTemplates.length > 0 ? (
                <div className="space-y-2">
                  {filteredEmailTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setEmailId(tpl.id);
                        setShowEmailTemplatePicker(false);
                        setEmailTemplateSearch('');
                      }}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        emailId === tpl.id
                          ? 'border-blue-500 bg-blue-50'
                          : isDark
                            ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{tpl.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">Aucun template trouvé</div>
                </div>
              )}
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button onClick={() => setShowEmailTemplatePicker(false)} className="w-full">
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Questionnaire Picker Modal */}
      {showQuestionnairePicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuestionnairePicker(false)} />
          <Card className={`relative w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sélectionner des questionnaires
              </h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {availableQuestionnaires.map(q => (
                <label key={q.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionnaireIds.includes(q.id)}
                    onChange={() => handleToggleQuestionnaire(q.id)}
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{q.name}</span>
                </label>
              ))}
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button onClick={() => setShowQuestionnairePicker(false)}>Valider</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Document Picker Modal */}
      {showDocumentPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDocumentPicker(false)} />
          <Card className={`relative w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sélectionner un document
              </h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {availableDocuments.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setDocumentId(doc.id);
                    setShowDocumentPicker(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg border-2 transition-all ${
                    documentId === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{doc.name}</span>
                </button>
              ))}
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button onClick={() => setShowDocumentPicker(false)}>Fermer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
