import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useToast } from '../ui/toast';
import { FlowActionModal, FlowActionData } from '../CourseCreation/FlowActionModal';
import { sessionCreation } from '../../services/sessionCreation';
import { courseCreation } from '../../services/courseCreation';
import { 
  Play, 
  Plus, 
  User, 
  Building2, 
  Mail, 
  Clock, 
  MoreVertical, 
  FileText, 
  Paperclip,
  Edit3,
  Trash2,
  CheckCircle
} from 'lucide-react';

interface FlowAction {
  id: number;
  uuid?: string;
  title: string;
  session_id?: number;
  course_id?: number;
  dest?: string;
  dest_type: 'email' | 'notification' | 'webhook';
  n_days: number;
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  custom_time?: string;
  email_id?: number;
  email?: { id: number; name: string; subject?: string };
  files?: Array<{ id: number; file_name: string; file_size?: number }>;
  questionnaires?: Array<{ id: number; name: string }>;
  recipient?: 'formateur' | 'apprenant' | 'entreprise';
  created_at: string;
}

export const Step8WorkflowNew: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useSessionCreation();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [flowActions, setFlowActions] = useState<FlowAction[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Array<{ id: number; name: string; title?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAction, setEditingAction] = useState<FlowAction | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'apprenant' | 'formateur' | 'entreprise'>('all');

  useEffect(() => {
    if (formData.sessionUuid) {
      loadFlowActions();
      loadEmailTemplates();
      loadQuestionnaires();
    }
  }, [formData.sessionUuid]);

  const loadFlowActions = async () => {
    try {
      setLoading(true);
      if (formData.sessionUuid) {
        const response = await sessionCreation.getWorkflowActions(formData.sessionUuid);
        if (response.success && response.data) {
          // Ensure we always get an array
          const actions = Array.isArray(response.data) 
            ? response.data 
            : response.data.actions || response.data.data || [];
          setFlowActions(actions);
        } else {
          setFlowActions([]);
        }
      } else {
        setFlowActions([]);
      }
    } catch (error: any) {
      console.error('Error loading flow actions:', error);
      showError('Erreur', 'Impossible de charger les workflows');
      setFlowActions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const response = await sessionCreation.getEmailTemplates();
      console.log('Email templates response:', response);
      if (response.success && response.data) {
        // La réponse a la structure { data: { templates: [...], pagination: {...} } } ou { data: [...] }
        const templates = response.data.templates || response.data;
        console.log('Extracted templates:', templates);
        // Filtrer "Course Reminder" (mocké/hardcodé)
        const filteredTemplates = Array.isArray(templates) 
          ? templates.filter((t: any) => 
              t.name?.toLowerCase() !== 'course reminder' && 
              t.name?.toLowerCase() !== 'reminder' &&
              !t.name?.toLowerCase().includes('course reminder')
            )
          : [];
        console.log('Filtered templates:', filteredTemplates);
        setEmailTemplates(filteredTemplates);
      } else {
        console.warn('No email templates in response:', response);
      }
    } catch (error: any) {
      console.error('Error loading email templates:', error);
    }
  };

  const loadQuestionnaires = async () => {
    try {
      // Load questionnaires from COURSE (not session)
      if (!formData.courseUuid) return;
      const response = await courseCreation.getQuestionnaires(formData.courseUuid);
      if (response.success && response.data) {
        const questionnairesList = response.data.map((q: any) => ({
          id: q.id,
          name: q.name || q.title || `Questionnaire ${q.id}`,
          title: q.title
        }));
        setQuestionnaires(questionnairesList);
      }
    } catch (error: any) {
      console.error('Error loading questionnaires:', error);
    }
  };

  const handleCreateFlowAction = async (flowActionData: FlowActionData) => {
    try {
      if (!formData.sessionUuid) {
        throw new Error('UUID de la session manquant');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', flowActionData.title);
      formDataToSend.append('type', flowActionData.type);
      formDataToSend.append('recipient', flowActionData.recipient);
      formDataToSend.append('dest_type', flowActionData.dest_type);
      formDataToSend.append('ref_date', flowActionData.ref_date);
      formDataToSend.append('time_type', flowActionData.time_type);
      formDataToSend.append('n_days', flowActionData.n_days.toString());
      
      if (flowActionData.custom_time) {
        formDataToSend.append('custom_time', flowActionData.custom_time);
      }
      // Gérer email_id (number) ou email_uuid (string)
      if (flowActionData.email_id) {
        // Vérifier si c'est un UUID (string avec tirets) ou un ID numérique
        if (typeof flowActionData.email_id === 'string' && flowActionData.email_id.includes('-')) {
          // C'est un UUID, utiliser email_uuid
          formDataToSend.append('email_uuid', flowActionData.email_id);
        } else {
          // C'est un ID numérique
          const emailIdNum = typeof flowActionData.email_id === 'number' 
            ? flowActionData.email_id 
            : Number(flowActionData.email_id);
          
          if (!isNaN(emailIdNum)) {
            formDataToSend.append('email_id', emailIdNum.toString());
          } else {
            throw new Error('email_id doit être un nombre valide');
          }
        }
      }
      // Si email_uuid est fourni séparément, l'utiliser
      if (flowActionData.email_uuid) {
        formDataToSend.append('email_uuid', flowActionData.email_uuid);
      }
      // Only send dest if it's a valid URL (for webhook type)
      // For document type, don't send dest - backend will construct URL from document_ids
      if (flowActionData.dest && flowActionData.type !== 'document') {
        // Validate that dest is a valid URL
        try {
          new URL(flowActionData.dest);
          formDataToSend.append('dest', flowActionData.dest);
        } catch (e) {
          // If dest is not a valid URL, don't send it
          console.warn('dest is not a valid URL, skipping:', flowActionData.dest);
        }
      }
      if (flowActionData.files) {
        flowActionData.files.forEach(file => {
          formDataToSend.append('files[]', file);
        });
      }
      if (flowActionData.document_ids && flowActionData.document_ids.length > 0) {
        flowActionData.document_ids.forEach(docId => {
          formDataToSend.append('document_ids[]', docId.toString());
        });
      }
      if (flowActionData.questionnaire_ids && flowActionData.questionnaire_ids.length > 0) {
        flowActionData.questionnaire_ids.forEach(qId => {
          formDataToSend.append('questionnaire_ids[]', qId.toString());
        });
      }

      await sessionCreation.createSessionWorkflowAction(formData.sessionUuid, formDataToSend);
      showSuccess('Action automatique créée');
      await loadFlowActions();
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Error creating flow action:', error);
      showError('Erreur', error.message || 'Impossible de créer l\'action automatique');
      throw error;
    }
  };

  const handleDeleteFlowAction = async (actionId: number, actionUuid?: string) => {
    if (!confirm('Supprimer cette action automatique ?')) return;

    try {
      if (!formData.sessionUuid) {
        throw new Error('UUID de la session manquant');
      }
      
      // Use UUID if available, otherwise use ID
      if (actionUuid) {
        await sessionCreation.deleteSessionWorkflowAction(formData.sessionUuid, actionUuid);
      } else {
        // Fallback: try to find UUID from the action
        const action = flowActions.find(a => a.id === actionId);
        if (action?.uuid) {
          await sessionCreation.deleteSessionWorkflowAction(formData.sessionUuid, action.uuid);
        } else {
          throw new Error('UUID de l\'action manquant');
        }
      }
      setFlowActions(flowActions.filter(fa => fa.id !== actionId));
      showSuccess('Action supprimée');
    } catch (error: any) {
      console.error('Error deleting flow action:', error);
      showError('Erreur', 'Impossible de supprimer l\'action');
    }
  };

  // Ensure flowActions is always an array for safety
  const safeFlowActions = Array.isArray(flowActions) ? flowActions : [];

  // Filter actions by recipient
  const filteredActions = safeFlowActions.filter(action => {
    if (activeFilter === 'all') return true;
    return action.recipient === activeFilter;
  });

  // Count actions by recipient
  const counts = {
    all: safeFlowActions.length,
    apprenant: safeFlowActions.filter(a => a.recipient === 'apprenant').length,
    formateur: safeFlowActions.filter(a => a.recipient === 'formateur').length,
    entreprise: safeFlowActions.filter(a => a.recipient === 'entreprise').length,
  };

  // Get trigger text (e.g., "3 jours avant la première séance")
  const getTriggerText = (action: FlowAction) => {
    if (action.ref_date === 'start' && action.time_type === 'before' && action.n_days > 0) {
      return `${action.n_days} jour${action.n_days > 1 ? 's' : ''} avant la première séance`;
    }
    if (action.ref_date === 'start' && action.time_type === 'on') {
      return 'Le jour même de la première séance';
    }
    if (action.ref_date === 'enrollment' && action.time_type === 'after' && action.n_days > 0) {
      return `${action.n_days} jour${action.n_days > 1 ? 's' : ''} après l'inscription`;
    }
    return 'Déclenchement personnalisé';
  };

  // Get time display (e.g., "At 20:30 PM")
  const getTimeDisplay = (action: FlowAction) => {
    if (action.custom_time) {
      const [hours, minutes] = action.custom_time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `At ${displayHour}:${minutes} ${ampm}`;
    }
    return '';
  };

  // Get recipient icon
  const getRecipientIcon = (recipient?: string) => {
    switch (recipient) {
      case 'formateur':
        return <User className="w-4 h-4" />;
      case 'apprenant':
        return <User className="w-4 h-4" />;
      case 'entreprise':
        return <Building2 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Get recipient label
  const getRecipientLabel = (recipient?: string) => {
    switch (recipient) {
      case 'formateur':
        return 'Formateur';
      case 'apprenant':
        return 'Apprenant';
      case 'entreprise':
        return 'Entreprise';
      default:
        return 'Apprenant';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'bg-blue-500 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={activeFilter === 'all' ? { backgroundColor: primaryColor } : {}}
        >
          <Mail className="w-4 h-4" />
          Tout Afficher {counts.all}
        </button>
        <button
          onClick={() => setActiveFilter('apprenant')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'apprenant'
              ? 'bg-blue-500 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={activeFilter === 'apprenant' ? { backgroundColor: primaryColor } : {}}
        >
          <User className="w-4 h-4" />
          Apprenant {counts.apprenant}
        </button>
        <button
          onClick={() => setActiveFilter('formateur')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'formateur'
              ? 'bg-blue-500 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={activeFilter === 'formateur' ? { backgroundColor: primaryColor } : {}}
        >
          <User className="w-4 h-4" />
          Formateur {counts.formateur}
        </button>
        <button
          onClick={() => setActiveFilter('entreprise')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'entreprise'
              ? 'bg-blue-500 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={activeFilter === 'entreprise' ? { backgroundColor: primaryColor } : {}}
        >
          <Building2 className="w-4 h-4" />
          Entreprise {counts.entreprise}
        </button>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Background with dotted pattern */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.3
          }}
        />

        {/* Timeline Content */}
        <div className="relative">
          {/* Start Button */}
          <div className="flex justify-center mb-6">
            <button
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                isDark ? 'bg-gray-800 text-white border-2 border-gray-700' : 'bg-black text-white border-2 border-black'
              }`}
            >
              <Play className="w-5 h-5" />
              Démarrage
            </button>
          </div>

          {/* Vertical Dotted Line */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-0.5"
              style={{
                height: `${Math.max(filteredActions.length * 200, 100)}px`,
                borderLeft: `2px dashed ${isDark ? '#4b5563' : '#cbd5e1'}`,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          </div>

          {/* Actions */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                Aucune action automatique
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredActions.map((action, index) => (
                <div key={action.id} className="flex flex-col items-center">
                  {/* Trigger Text with Dotted Line Connection */}
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="h-0.5 flex-1"
                      style={{
                        borderTop: `1px dashed ${isDark ? '#4b5563' : '#cbd5e1'}`
                      }}
                    />
                    <span className={`text-sm font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getTriggerText(action)}
                    </span>
                    <div 
                      className="h-0.5 flex-1"
                      style={{
                        borderTop: `1px dashed ${isDark ? '#4b5563' : '#cbd5e1'}`
                      }}
                    />
                  </div>

                  {/* Action Card */}
                  <Card 
                    className={`w-full max-w-md ${isDark ? 'bg-yellow-50/10 border-gray-700' : 'bg-yellow-50 border-gray-200'} shadow-md`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Title */}
                          <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {action.title || 'Action sans titre'}
                          </h4>

                          {/* Files and Questionnaires */}
                          <div className="flex items-center gap-3 mb-3">
                            {action.files && action.files.length > 0 && (
                              <Badge className="bg-green-100 text-green-700 border-0">
                                {action.files.length} Fichier{action.files.length > 1 ? 's' : ''} Joint{action.files.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {action.questionnaires && action.questionnaires.length > 0 && (
                              <Badge className="bg-blue-100 text-blue-700 border-0">
                                {action.questionnaires.length} Questionnaire{action.questionnaires.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {(!action.files || action.files.length === 0) && (!action.questionnaires || action.questionnaires.length === 0) && (
                              <>
                                <Badge className="bg-gray-100 text-gray-500 border-0">
                                  Aucun Fichier Joint
                                </Badge>
                                <Badge className="bg-gray-100 text-gray-500 border-0">
                                  Aucun Questionnaire
                                </Badge>
                              </>
                            )}
                          </div>

                          {/* Recipient and Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                action.recipient === 'formateur' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : action.recipient === 'entreprise'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-pink-100 text-pink-700'
                              }`}>
                                {getRecipientIcon(action.recipient)}
                              </div>
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {getRecipientLabel(action.recipient)}
                              </span>
                            </div>
                            {getTimeDisplay(action) && (
                              <div className="flex items-center gap-1">
                                <Clock className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {getTimeDisplay(action)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAction(action)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFlowAction(action.id, action.uuid)}
                            className={`p-2 rounded-lg text-red-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Add Action Button */}
          <div className="flex flex-col items-center mt-8">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 mb-4"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              ajouter une action automatique
            </Button>

            {/* Recipient Icons */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <User className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Formateur
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <User className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Apprenant
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Entreprise
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <FlowActionModal
        isOpen={showCreateModal || editingAction !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAction(null);
        }}
        onSave={handleCreateFlowAction}
        courseId={formData.sessionUuid || ''}
        emailTemplates={emailTemplates}
        questionnaires={questionnaires}
      />
    </div>
  );
};

