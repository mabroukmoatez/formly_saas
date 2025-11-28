import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { FlowActionModal, FlowActionData } from './FlowActionModal';
import { courseCreation } from '../../services/courseCreation';
import { Play, Trash2, Edit3, Plus, Clock, Paperclip, FileText, Users, Building2, Mail, MoreVertical, GraduationCap } from 'lucide-react';

interface FlowAction {
  id: number;
  title: string;
  course_id: number;
  recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin';
  dest_type: 'email' | 'notification' | 'webhook';
  n_days: number;
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  custom_time?: string;
  email_id?: number;
  email?: { id: number; name: string; subject?: string };
  files?: Array<{ id: number; file_name: string; file_size?: number }>;
  questionnaires?: Array<{ id: number; name: string }>;
  created_at: string;
}

type AudienceFilter = 'all' | 'apprenant' | 'formateur' | 'entreprise';

export const Step6WorkflowNew: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useCourseCreation();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [flowActions, setFlowActions] = useState<FlowAction[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceFilter>('all');
  const [editingAction, setEditingAction] = useState<FlowAction | null>(null);

  useEffect(() => {
    if (formData.courseUuid) {
      loadFlowActions();
      loadEmailTemplates();
    }
  }, [formData.courseUuid]);

  const loadFlowActions = async () => {
    try {
      setLoading(true);
      if (formData.courseUuid) {
        const response: any = await courseCreation.getFlowActions(formData.courseUuid);
        if (response.success && response.data) {
          // Map backend response to FlowAction interface
          const actions = Array.isArray(response.data) ? response.data : [];
          const mappedActions = actions.map((action: any) => ({
            id: action.id,
            title: action.title || 'Sans titre',
            course_id: action.course_id,
            recipient: action.recipient || 'apprenant',
            dest_type: action.dest_type || 'email',
            n_days: action.n_days || 0,
            ref_date: action.ref_date || 'start',
            time_type: action.time_type || 'on',
            custom_time: action.custom_time,
            email_id: action.email_id,
            email: action.email,
            files: action.files || action.attachments || [],
            questionnaires: action.questionnaires || action.questionnaire_ids?.map((id: number) => ({ id, name: `Questionnaire ${id}` })) || [],
            created_at: action.created_at
          }));
          setFlowActions(mappedActions);
        }
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
      const response = await courseCreation.getEmailTemplates();
      if (response.success && response.data) {
        setEmailTemplates(response.data);
      }
    } catch (error: any) {
      console.error('Error loading email templates:', error);
    }
  };

  const handleCreateFlowAction = async (flowActionData: FlowActionData) => {
    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
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
      if (flowActionData.email_id) {
        formDataToSend.append('email_id', flowActionData.email_id.toString());
      }
      if (flowActionData.dest) {
        formDataToSend.append('dest', flowActionData.dest);
      }
      if (flowActionData.document_id) {
        formDataToSend.append('document_id', flowActionData.document_id.toString());
      }
      if (flowActionData.files) {
        flowActionData.files.forEach(file => {
          formDataToSend.append('files[]', file);
        });
      }
      if (flowActionData.questionnaire_ids && flowActionData.questionnaire_ids.length > 0) {
        flowActionData.questionnaire_ids.forEach(id => {
          formDataToSend.append('questionnaire_ids[]', id.toString());
        });
      }

      if (editingAction) {
        await courseCreation.updateFlowAction(formData.courseUuid, editingAction.id, formDataToSend);
        showSuccess('Action automatique mise à jour');
      } else {
        await courseCreation.createFlowAction(formData.courseUuid, formDataToSend);
        showSuccess('Action automatique créée');
      }
      
      await loadFlowActions();
      setShowCreateModal(false);
      setEditingAction(null);
    } catch (error: any) {
      console.error('Error saving flow action:', error);
      showError('Erreur', error.message || 'Impossible de sauvegarder l\'action automatique');
      throw error;
    }
  };

  const handleDeleteFlowAction = async (actionId: number) => {
    if (!confirm('Supprimer cette action automatique ?')) return;

    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
      }
      
      await courseCreation.deleteFlowAction(formData.courseUuid, actionId);
      setFlowActions(flowActions.filter(fa => fa.id !== actionId));
      showSuccess('Action supprimée');
    } catch (error: any) {
      console.error('Error deleting flow action:', error);
      showError('Erreur', 'Impossible de supprimer l\'action');
    }
  };

  const handleEditFlowAction = (action: FlowAction) => {
    setEditingAction(action);
    setShowCreateModal(true);
  };

  // Filter actions by audience
  const filteredActions = flowActions.filter(action => {
    if (selectedAudience === 'all') return true;
    return action.recipient === selectedAudience;
  });

  // Count actions by audience
  const getAudienceCount = (audience: AudienceFilter): number => {
    if (audience === 'all') return flowActions.length;
    return flowActions.filter(a => a.recipient === audience).length;
  };

  // Get audience icon for recipient
  const getRecipientIcon = (recipient: string) => {
    switch (recipient) {
      case 'apprenant': return <GraduationCap className="w-4 h-4" />;
      case 'formateur': return <Users className="w-4 h-4" />;
      case 'entreprise': return <Building2 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  // Get audience color
  const getAudienceColor = (audience: AudienceFilter) => {
    switch (audience) {
      case 'apprenant': return '#EF4444'; // Red
      case 'formateur': return '#F59E0B'; // Orange/Yellow
      case 'entreprise': return '#3B82F6'; // Blue
      default: return primaryColor;
    }
  };

  // Format timing description - exact Figma format
  const getTimingDescription = (action: FlowAction): string => {
    if (action.time_type === 'on' && action.ref_date === 'start') {
      return 'La Jour Même De La Premier Séance';
    }
    if (action.time_type === 'before' && action.n_days > 0) {
      return `${action.n_days} jour${action.n_days > 1 ? 's' : ''} avant la première séance`;
    }
    if (action.time_type === 'after' && action.n_days > 0) {
      return `${action.n_days} jour${action.n_days > 1 ? 's' : ''} après la première séance`;
    }
    return '3 jours avant la première séance'; // Default
  };

  // Format time
  const formatTime = (time?: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `At ${displayHour}:${minutes} ${ampm}`;
  };

  // Get recipient label
  const getRecipientLabel = (recipient: string): string => {
    switch (recipient) {
      case 'apprenant': return 'Apprenant';
      case 'formateur': return 'Formateur';
      case 'entreprise': return 'Entreprise';
      default: return 'Admin';
    }
  };

  return (
    <div className="space-y-6">
      {/* Audience Filters */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedAudience('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
            selectedAudience === 'all'
              ? 'border-blue-500 bg-blue-500 text-white'
              : isDark
                ? 'border-gray-600 bg-gray-700 text-gray-300'
                : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm font-medium">Tout Afficher</span>
          <Badge
            className={`ml-1 ${
              selectedAudience === 'all'
                ? 'bg-white text-blue-500'
                : isDark
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}
          >
            {getAudienceCount('all')}
          </Badge>
        </button>

        <button
          onClick={() => setSelectedAudience('apprenant')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
            selectedAudience === 'apprenant'
              ? 'border-blue-500 bg-blue-500 text-white'
              : isDark
                ? 'border-gray-600 bg-gray-700 text-gray-300'
                : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Apprenant</span>
          <Badge
            className={`ml-1 ${
              selectedAudience === 'apprenant'
                ? 'bg-white text-blue-500'
                : isDark
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}
          >
            {getAudienceCount('apprenant')}
          </Badge>
        </button>

        <button
          onClick={() => setSelectedAudience('formateur')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
            selectedAudience === 'formateur'
              ? 'border-blue-500 bg-blue-500 text-white'
              : isDark
                ? 'border-gray-600 bg-gray-700 text-gray-300'
                : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Formateur</span>
          <Badge
            className={`ml-1 ${
              selectedAudience === 'formateur'
                ? 'bg-white text-blue-500'
                : isDark
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}
          >
            {getAudienceCount('formateur')}
          </Badge>
        </button>

        <button
          onClick={() => setSelectedAudience('entreprise')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
            selectedAudience === 'entreprise'
              ? 'border-blue-500 bg-blue-500 text-white'
              : isDark
                ? 'border-gray-600 bg-gray-700 text-gray-300'
                : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-sm font-medium">Entreprise</span>
          <Badge
            className={`ml-1 ${
              selectedAudience === 'entreprise'
                ? 'bg-white text-blue-500'
                : isDark
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}
          >
            {getAudienceCount('entreprise')}
          </Badge>
        </button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
        </div>
      ) : (
        <div className="relative">
          {/* Background Grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Timeline Content */}
          <div className="relative space-y-4">
            {/* Start Button */}
            <div className="flex justify-center">
              <Button
                className="rounded-lg px-6 py-3 font-semibold"
                style={{ backgroundColor: '#1F2937' }}
              >
                <Play className="w-5 h-5 mr-2" />
                Démarrage
              </Button>
            </div>

            {/* Vertical Line */}
            {filteredActions.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-full min-h-[40px]" style={{ borderLeft: '2px dashed #3B82F6' }} />
              </div>
            )}

            {/* Action Cards */}
            {filteredActions.length === 0 ? (
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucune action automatique
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredActions.map((action, index) => (
                <div key={action.id} className="relative">
                  {/* Timing Label */}
                  <div className="flex justify-center mb-2">
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getTimingDescription(action)}
                    </span>
                  </div>

                  {/* Action Card - Exact Figma Design */}
                  <div className="flex justify-center">
                    <Card className="w-full max-w-md bg-yellow-50 border-yellow-200 shadow-sm">
                      <CardContent className="p-4">
                        {/* Header with title and menu */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-base text-gray-900">
                            {action.title}
                          </h4>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>

                        {/* Files and Questionnaires - Clickable links like Figma */}
                        <div className="flex items-center gap-3 mb-3">
                          {action.files && action.files.length > 0 ? (
                            <button 
                              className="text-green-600 text-sm font-medium hover:underline cursor-pointer"
                              onClick={() => {
                                // TODO: Open file preview/download
                                console.log('View files:', action.files);
                              }}
                            >
                              {action.files.length} Fichier Joint
                            </button>
                          ) : null}
                          {action.questionnaires && action.questionnaires.length > 0 ? (
                            <button 
                              className="text-blue-600 text-sm font-medium hover:underline cursor-pointer"
                              onClick={() => {
                                // TODO: Open questionnaire preview
                                console.log('View questionnaires:', action.questionnaires);
                              }}
                            >
                              {action.questionnaires.length} Questionnaire
                            </button>
                          ) : null}
                        </div>

                        {/* Recipient and Time - Bottom section */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: getAudienceColor(action.recipient) }}
                            >
                              {getRecipientIcon(action.recipient)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {getRecipientLabel(action.recipient)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {formatTime(action.custom_time)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons - Bottom border */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFlowAction(action)}
                            className="h-6 px-2 text-xs hover:bg-gray-100"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFlowAction(action.id)}
                            className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Retirer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Vertical Line between actions */}
                  {index < filteredActions.length - 1 && (
                    <div className="flex justify-center my-4">
                      <div className="w-0.5 h-8" style={{ borderLeft: '2px dashed #3B82F6' }} />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Add Action Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => {
                  setEditingAction(null);
                  setShowCreateModal(true);
                }}
                variant="outline"
                className="border-2 border-dashed rounded-lg px-6 py-3"
                style={{ borderColor: primaryColor }}
              >
                <Plus className="w-5 h-5 mr-2" />
                ajouter une action automatique
              </Button>
            </div>

            {/* Quick Add Buttons */}
            {filteredActions.length > 0 && (
              <div className="flex justify-center gap-3 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAction(null);
                    setShowCreateModal(true);
                  }}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Formateur
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAction(null);
                    setShowCreateModal(true);
                  }}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Apprenant
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAction(null);
                    setShowCreateModal(true);
                  }}
                  className="text-xs"
                >
                  <Building2 className="w-3 h-3 mr-1" />
                  Entreprise
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <FlowActionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAction(null);
        }}
        onSave={handleCreateFlowAction}
        courseId={formData.courseUuid || ''}
        emailTemplates={emailTemplates}
        editingAction={editingAction}
      />
    </div>
  );
};
