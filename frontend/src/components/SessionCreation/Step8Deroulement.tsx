import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useToast } from '../ui/toast';
import { FlowActionModal, FlowActionData } from './FlowActionModal';
import { sessionCreation } from '../../services/sessionCreation';
import { CourseFlowAction, EmailTemplate } from '../../services/courseCreation.types';
import { Mail, Bell, Webhook, Trash2, Edit3, Plus, Calendar, Clock, Paperclip } from 'lucide-react';

interface FlowAction {
  id: number;
  title: string;
  course_id: number;
  dest?: string;
  dest_type: 'email' | 'notification' | 'webhook';
  n_days: number;
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  custom_time?: string;
  email_id?: number;
  email?: { id: number; name: string; subject?: string };
  files?: Array<{ id: number; file_name: string; file_size?: number }>;
  created_at: string;
}

export const Step8Deroulement: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useSessionCreation();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [flowActions, setFlowActions] = useState<FlowAction[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (formData.sessionUuid) {
      loadFlowActions();
      loadEmailTemplates();
    }
  }, [formData.sessionUuid]);

  const loadFlowActions = async () => {
    try {
      setLoading(true);
      if (formData.sessionUuid) {
        const response = await sessionCreation.getWorkflowActions(formData.sessionUuid);
        if (response.success && response.data) {
          // Handle different response structures
          const actions = Array.isArray(response.data) ? response.data : (response.data.actions || response.data.data || []);
          setFlowActions(actions);
        } else {
          setFlowActions([]);
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
      const response = await sessionCreation.getEmailTemplates();
      if (response.success && response.data) {
        setEmailTemplates(response.data);
      }
    } catch (error: any) {
      console.error('Error loading email templates:', error);
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
      if (flowActionData.email_id) {
        formDataToSend.append('email_id', flowActionData.email_id.toString());
      }
      if (flowActionData.dest) {
        formDataToSend.append('dest', flowActionData.dest);
      }
      if (flowActionData.files) {
        flowActionData.files.forEach(file => {
          formDataToSend.append('files[]', file);
        });
      }

      console.log('🔵 Creating flow action for session:', formData.sessionUuid);
      console.log('🔵 Flow action type:', flowActionData.type);
      console.log('🔵 Flow action recipient:', flowActionData.recipient);
      await sessionCreation.createSessionWorkflowAction(formData.sessionUuid!, formDataToSend);
      showSuccess('Action automatique créée');
      await loadFlowActions();
    } catch (error: any) {
      console.error('Error creating flow action:', error);
      showError('Erreur', error.message || 'Impossible de créer l\'action automatique');
      throw error;
    }
  };

  const handleDeleteFlowAction = async (actionId: number | string) => {
    if (!confirm('Supprimer cette action automatique ?')) return;

    try {
      if (!formData.sessionUuid) {
        throw new Error('UUID de la session manquant');
      }
      
      // Convert to UUID string (API expects UUID)
      const actionUuid = String(actionId);
      const response = await sessionCreation.deleteSessionWorkflowAction(formData.sessionUuid!, actionUuid);
      
      if (response.success) {
        showSuccess('Action supprimée');
        // Reload flow actions to get updated list from backend
        await loadFlowActions();
      } else {
        showError('Erreur', 'Impossible de supprimer l\'action');
      }
    } catch (error: any) {
      console.error('Error deleting flow action:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Impossible de supprimer l\'action';
      showError('Erreur', errorMessage);
    }
  };

  const getDestTypeIcon = (destType: string) => {
    switch (destType) {
      case 'email': return <Mail className="w-5 h-5" />;
      case 'notification': return <Bell className="w-5 h-5" />;
      case 'webhook': return <Webhook className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getDestTypeColor = (destType: string) => {
    switch (destType) {
      case 'email': return isDark ? 'bg-blue-900/20 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300';
      case 'notification': return isDark ? 'bg-orange-900/20 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-700 border-orange-300';
      case 'webhook': return isDark ? 'bg-purple-900/20 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300';
      default: return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
    }
  };

  const getTriggerDescription = (action: FlowAction) => {
    const timeLabel = action.time_type === 'on' ? 'Le jour de' : action.time_type === 'before' ? 'Avant' : 'Après';
    const refLabel = action.ref_date === 'enrollment' ? 'l\'inscription' : action.ref_date === 'completion' ? 'la fin' : action.ref_date === 'start' ? 'le début' : 'date custom';
    const daysLabel = action.n_days > 0 ? ` (${action.n_days}j)` : '';
    const timeLabel2 = action.custom_time ? ` à ${action.custom_time.substring(0, 5)}` : '';
    return `${timeLabel} ${refLabel}${daysLabel}${timeLabel2}`;
  };

  // Group by ref_date
  const groupedActions = flowActions.reduce((acc, action) => {
    if (!acc[action.ref_date]) acc[action.ref_date] = [];
    acc[action.ref_date].push(action);
    return acc;
  }, {} as Record<string, FlowAction[]>);

  const refDateLabels = {
    enrollment: 'Inscription',
    start: 'Début du Cours',
    completion: 'Fin du Cours',
    custom: 'Date Personnalisée'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Workflows Automatisés
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configurez des actions automatiques (emails, notifications)
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: primaryColor }} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une Action
        </Button>
      </div>

      {/* Info Card */}
      <Card className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <CardContent className="p-4">
          <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Les workflows permettent d'automatiser les communications avec vos étudiants : emails de bienvenue, rappels, certificats, etc.
          </p>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
        </div>
      ) : flowActions.length === 0 ? (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucune action automatique
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Créez votre première action pour automatiser la communication
              </p>
              <Button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: primaryColor }} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer la Première Action
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActions).map(([refDate, actions]) => (
            <div key={refDate}>
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                📅 {refDateLabels[refDate as keyof typeof refDateLabels]}
              </h3>
              <div className="space-y-3">
                {actions.map(action => (
                  <Card key={action.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDestTypeColor(action.dest_type)}`}>
                            {getDestTypeIcon(action.dest_type)}
                </div>
                <div className="flex-1">
                            <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{action.title}</h4>
                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {getTriggerDescription(action)}
                            </p>
                            {action.email && (
                              <Badge variant="outline" className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                                Template: {action.email.name}
                    </Badge>
                            )}
                            {action.files && action.files.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs">
                                <Paperclip className="w-3 h-3" />
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                  {action.files.length} pièce{action.files.length > 1 ? 's' : ''} jointe{action.files.length > 1 ? 's' : ''}
                      </span>
                              </div>
                    )}
                  </div>
                </div>
              <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}><Edit3 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFlowAction(action.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <FlowActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateFlowAction}
        sessionId={formData.sessionUuid || ''}
        emailTemplates={emailTemplates}
      />
    </div>
  );
};

