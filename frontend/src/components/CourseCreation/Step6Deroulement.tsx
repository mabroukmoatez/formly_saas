import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { courseCreation } from '../../services/courseCreation';
import { WorkflowTrigger, WorkflowExecution, WorkflowAnalytics, EmailTemplate } from '../../services/courseCreation.types';
import { 
  Play,
  Plus,
  User,
  Building2,
  File,
  FileText,
  Clock,
  MoreVertical,
  Mail,
  X,
  Check,
  Users,
  GripVertical,
  Bell,
  Award,
  CreditCard,
  UserPlus,
  CheckCircle,
  MessageSquare,
  Video,
  BookOpen,
  AlertCircle,
  Settings,
  Pause,
  PlayCircle,
  Zap,
  BarChart3,
  Activity,
  RefreshCw,
  Calendar,
  Send,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';

export const Step6Deroulement: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  // Use CourseCreationContext
  const {
    workflow,
    workflowActions,
    emailTemplates,
    loadWorkflow,
    createWorkflow,
    updateWorkflow,
    toggleWorkflowStatus,
    loadWorkflowActions,
    createWorkflowAction,
    updateWorkflowAction,
    deleteWorkflowAction,
    reorderWorkflowActions,
    toggleWorkflowAction,
    loadEmailTemplates,
    formData
  } = useCourseCreation();

  // State for filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'apprenant' | 'formateur' | 'entreprise'>('all');
  
  // State for modals
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  
  // State for workflow triggers
  const [workflowTriggers, setWorkflowTriggers] = useState<WorkflowTrigger[]>([]);
  const [workflowExecutions, setWorkflowExecutions] = useState<WorkflowExecution[]>([]);
  const [workflowAnalytics, setWorkflowAnalytics] = useState<WorkflowAnalytics | null>(null);
  
  // State for action configuration
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [actionConfig, setActionConfig] = useState({
    title: '',
    type: 'email' as const,
    recipient: 'apprenant' as const,
    timing: 'immediate',
    emailTemplate: '',
    subject: '',
    body: '',
    scheduledTime: '',
    attachments: [] as any[]
  });

  // Load data on component mount
  useEffect(() => {
    loadWorkflow();
    loadWorkflowActions();
    loadEmailTemplates();
    loadWorkflowTriggers();
    loadWorkflowExecutions();
    loadWorkflowAnalytics();
  }, [loadWorkflow, loadWorkflowActions, loadEmailTemplates]);

  // Load workflow triggers
  const loadWorkflowTriggers = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) return;

      const response: any = await courseCreation.getWorkflowTriggers(courseUuid);
      if (response.success) {
        setWorkflowTriggers(response.data.triggers || []);
      }
    } catch (error: any) {
      // ('Failed to load workflow triggers:', error);
      error('Erreur lors du chargement des déclencheurs');
    }
  };

  // Load workflow executions
  const loadWorkflowExecutions = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) return;

      const response: any = await courseCreation.getWorkflowExecutions(courseUuid);
      if (response.success) {
        setWorkflowExecutions(response.data.executions || []);
      }
    } catch (error: any) {
      // ('Failed to load workflow executions:', error);
      error('Erreur lors du chargement des exécutions');
    }
  };

  // Load workflow analytics
  const loadWorkflowAnalytics = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) return;

      const response: any = await courseCreation.getWorkflowAnalytics(courseUuid);
      if (response.success) {
        setWorkflowAnalytics(response.data);
      }
    } catch (error: any) {
      // ('Failed to load workflow analytics:', error);
      error('Erreur lors du chargement des analyses');
    }
  };

  // Handle workflow execution
  const handleExecuteWorkflow = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) return;

      const response: any = await courseCreation.executeWorkflowManually(courseUuid);
      if (response.success) {
        success(t('workflow.executedSuccessfully'));
        loadWorkflowExecutions();
      }
    } catch (error: any) {
      // ('Failed to execute workflow:', error);
      error(t('workflow.executionError'));
    }
  };

  // Handle workflow start
  const handleStartWorkflow = async () => {
    try {
      if (!workflow) {
        // Create workflow if it doesn't exist
        const newWorkflow = await createWorkflow({
          name: t('workflow.defaultName'),
          description: t('workflow.defaultDescription'),
          is_active: true
        });
        
        if (newWorkflow) {
          success(t('workflow.createdAndStarted'));
          loadWorkflow();
        }
      } else {
        // Activate existing workflow
        const activated = await toggleWorkflowStatus(true);
        if (activated) {
          success(t('workflow.started'));
        }
      }
    } catch (error: any) {
      // ('Failed to start workflow:', error);
      error(t('workflow.startError'));
    }
  };

  // Handle action creation
  const handleCreateAction = async () => {
    try {
      const newAction = await createWorkflowAction({
        title: actionConfig.title,
        type: actionConfig.type,
        recipient: actionConfig.recipient,
        timing: actionConfig.timing,
        scheduled_time: actionConfig.scheduledTime || null,
        is_active: true,
        execution_order: workflowActions.length + 1, // ✅ Backend expects 'execution_order'
        config: {
          email_template: actionConfig.emailTemplate,
          subject: actionConfig.subject,
          body: actionConfig.body,
          attachments: actionConfig.attachments || []
        }
      });

      if (newAction) {
        success('Action créée avec succès');
        setShowActionModal(false);
        setActionConfig({
          title: '',
          type: 'email',
          recipient: 'apprenant',
          timing: 'immediate',
          emailTemplate: '',
          subject: '',
          body: '',
          scheduledTime: '',
          attachments: []
        });
      }
    } catch (error: any) {
      // ('Failed to create action:', error);
      error('Erreur lors de la création de l\'action');
    }
  };

  // Handle action update
  const handleUpdateAction = async () => {
    try {
      if (!editingAction) return;

      const updatedAction = await updateWorkflowAction(parseInt(editingAction.uuid), {
        title: actionConfig.title,
        type: actionConfig.type,
        recipient: actionConfig.recipient,
        timing: actionConfig.timing,
        scheduled_time: actionConfig.scheduledTime || null,
        is_active: true,
        execution_order: editingAction.execution_order || editingAction.order_index || 1, // ✅ Backend expects 'execution_order'
        config: {
          email_template: actionConfig.emailTemplate,
          subject: actionConfig.subject,
          body: actionConfig.body,
          attachments: actionConfig.attachments || []
        }
      });

      if (updatedAction) {
        success('Action mise à jour avec succès');
        setShowActionModal(false);
        setEditingAction(null);
        setActionConfig({
          title: '',
          type: 'email',
          recipient: 'apprenant',
          timing: 'immediate',
          emailTemplate: '',
          subject: '',
          body: '',
          scheduledTime: '',
          attachments: []
        });
      }
    } catch (error: any) {
      // ('Failed to update action:', error);
      error('Erreur lors de la mise à jour de l\'action');
    }
  };

  // Get action icon
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'assignment': return <BookOpen className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      case 'certificate': return <Award className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'enrollment': return <UserPlus className="w-4 h-4" />;
      case 'completion': return <CheckCircle className="w-4 h-4" />;
      case 'feedback': return <MessageSquare className="w-4 h-4" />;
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'resource': return <File className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  // Get recipient color
  const getRecipientColor = (recipient: string) => {
    switch (recipient) {
      case 'apprenant': return 'bg-blue-100 text-blue-800';
      case 'formateur': return 'bg-yellow-100 text-yellow-800';
      case 'entreprise': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter actions based on active filter
  const filteredActions = workflowActions.filter(action => {
    if (activeFilter === 'all') return true;
    return action.recipient === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor
            }}
          />
          <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            {t('workflow.title')}
          </h2>
        </div>
      </div>

      {/* Filter Bar - Ancien Design */}
      <div className="flex gap-3">
        <Button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'text-white'
              : isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{
            backgroundColor: activeFilter === 'all' ? primaryColor : 'transparent',
            border: activeFilter === 'all' ? 'none' : `1px solid ${isDark ? '#374151' : '#d1d5db'}`
          }}
        >
          <FileText className="w-4 h-4" />
          {t('workflow.showAll')} ({workflowActions.length})
        </Button>
        <Button
          onClick={() => setActiveFilter('apprenant')}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            activeFilter === 'apprenant'
              ? 'text-white'
              : isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{
            backgroundColor: activeFilter === 'apprenant' ? primaryColor : 'transparent',
            border: activeFilter === 'apprenant' ? 'none' : `1px solid ${isDark ? '#374151' : '#d1d5db'}`
          }}
        >
          <User className="w-4 h-4" />
          {t('workflow.learner')} ({workflowActions.filter(a => a.recipient === 'apprenant').length})
        </Button>
        <Button
          onClick={() => setActiveFilter('formateur')}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            activeFilter === 'formateur'
              ? 'text-white'
              : isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{
            backgroundColor: activeFilter === 'formateur' ? primaryColor : 'transparent',
            border: activeFilter === 'formateur' ? 'none' : `1px solid ${isDark ? '#374151' : '#d1d5db'}`
          }}
        >
          <User className="w-4 h-4" />
          {t('workflow.trainer')} ({workflowActions.filter(a => a.recipient === 'formateur').length})
        </Button>
        <Button
          onClick={() => setActiveFilter('entreprise')}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            activeFilter === 'entreprise'
              ? 'text-white'
              : isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{
            backgroundColor: activeFilter === 'entreprise' ? primaryColor : 'transparent',
            border: activeFilter === 'entreprise' ? 'none' : `1px solid ${isDark ? '#374151' : '#d1d5db'}`
          }}
        >
          <Building2 className="w-4 h-4" />
          {t('workflow.company')} ({workflowActions.filter(a => a.recipient === 'entreprise').length})
        </Button>
      </div>

      {/* Workflow Actions List - Ancien Design Séquentiel */}
      <div className="space-y-4">
        {/* Démarrage */}
        <div className="flex items-center gap-4">
          <div 
            className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              workflow?.is_active 
                ? (isDark ? 'bg-green-700' : 'bg-green-200') 
                : (isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
            }`}
            onClick={handleStartWorkflow}
          >
            <Play className={`w-6 h-6 ${
              workflow?.is_active 
                ? (isDark ? 'text-green-300' : 'text-green-700')
                : (isDark ? 'text-gray-300' : 'text-gray-600')
            }`} />
          </div>
          <div className={`px-4 py-3 rounded-lg flex-1 cursor-pointer transition-colors ${
            workflow?.is_active 
              ? (isDark ? 'bg-green-800/50' : 'bg-green-100') 
              : (isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
          }`}
          onClick={handleStartWorkflow}
          >
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {workflow?.is_active ? t('workflow.started') : t('workflow.start')}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {workflow?.is_active ? t('workflow.activeDescription') : t('workflow.startDescription')}
            </p>
          </div>
        </div>

        {/* Actions Séquentielles */}
        {filteredActions.map((action, index) => (
          <div key={action.uuid} className="flex items-center gap-4">
            {/* Ligne de connexion */}
            <div className="w-12 h-12 flex items-center justify-center">
              <div className={`w-0.5 h-8 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>
            
            {/* Carte d'action */}
            <div className={`px-4 py-3 rounded-lg flex-1 flex items-center justify-between ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  {getActionIcon(action.type)}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {action.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getRecipientColor(action.recipient)}`}>
                      {action.recipient === 'apprenant' ? t('workflow.learner') :
                       action.recipient === 'formateur' ? t('workflow.trainer') :
                       action.recipient === 'entreprise' ? t('workflow.company') : t('workflow.admin')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {action.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {action.timing}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    {action.config?.attachments?.length > 0 && (
                      <span className="text-green-600 text-sm">
                        {action.config.attachments.length} {t('workflow.attachedFile')}
                      </span>
                    )}
                    {action.config?.questionnaires?.length > 0 && (
                      <span className="text-blue-600 text-sm">
                        {action.config.questionnaires.length} {t('workflow.questionnaire')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  At {action.scheduled_time ? new Date(action.scheduled_time).toLocaleTimeString() : '20:30 PM'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingAction(action);
                      setActionConfig({
                        title: action.title,
                        type: action.type,
                        recipient: action.recipient,
                        timing: action.timing,
                        emailTemplate: action.config?.email_template || '',
                        subject: action.config?.subject || '',
                        body: action.config?.body || '',
                        scheduledTime: action.scheduled_time || '',
                        attachments: action.config?.attachments || []
                      });
                      setShowActionModal(true);
                    }}
                    className="p-1"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWorkflowAction(parseInt(action.uuid))}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Ajouter une action automatique */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <div className={`w-0.5 h-8 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
          </div>
          
          <div 
            className={`px-4 py-3 rounded-lg flex-1 cursor-pointer border-2 border-dashed ${
              isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
            }`}
            onClick={() => setShowActionModal(true)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <Plus className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('workflow.addAutomaticAction')}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">{t('workflow.trainer')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">{t('workflow.learner')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">{t('workflow.company')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Action Creation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl mx-4 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingAction ? 'Modifier l\'action' : 'Nouvelle action automatique'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowActionModal(false);
                    setEditingAction(null);
                    setActionConfig({
                      title: '',
                      type: 'email',
                      recipient: 'apprenant',
                      timing: 'immediate',
                      emailTemplate: '',
                      subject: '',
                      body: '',
                      scheduledTime: '',
                      attachments: []
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Titre de l'action</Label>
                  <Input
                    value={actionConfig.title}
                    onChange={(e) => setActionConfig({...actionConfig, title: e.target.value})}
                    placeholder="Ex: Envoi des questionnaires en amont"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type d'action</Label>
                    <Select value={actionConfig.type} onValueChange={(value: any) => setActionConfig({...actionConfig, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="assignment">Devoir</SelectItem>
                        <SelectItem value="reminder">Rappel</SelectItem>
                        <SelectItem value="certificate">Certificat</SelectItem>
                        <SelectItem value="payment">Paiement</SelectItem>
                        <SelectItem value="enrollment">Inscription</SelectItem>
                        <SelectItem value="completion">Finalisation</SelectItem>
                        <SelectItem value="feedback">Retour</SelectItem>
                        <SelectItem value="meeting">Réunion</SelectItem>
                        <SelectItem value="resource">Ressource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Destinataire</Label>
                    <Select value={actionConfig.recipient} onValueChange={(value: any) => setActionConfig({...actionConfig, recipient: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apprenant">Apprenant</SelectItem>
                        <SelectItem value="formateur">Formateur</SelectItem>
                        <SelectItem value="entreprise">Entreprise</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Timing</Label>
                    <Select value={actionConfig.timing} onValueChange={(value) => setActionConfig({...actionConfig, timing: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immédiat</SelectItem>
                        <SelectItem value="scheduled">Programmé</SelectItem>
                        <SelectItem value="delayed">Retardé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {actionConfig.timing === 'scheduled' && (
                    <div>
                      <Label>Heure programmée</Label>
                      <Input
                        type="datetime-local"
                        value={actionConfig.scheduledTime}
                        onChange={(e) => setActionConfig({...actionConfig, scheduledTime: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                {actionConfig.type === 'email' && (
                  <>
                    <div>
                      <Label>Sujet de l'email</Label>
                      <Input
                        value={actionConfig.subject}
                        onChange={(e) => setActionConfig({...actionConfig, subject: e.target.value})}
                        placeholder="Sujet de l'email"
                      />
                    </div>
                    <div>
                      <Label>Contenu de l'email</Label>
                      <textarea
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={4}
                        value={actionConfig.body}
                        onChange={(e) => setActionConfig({...actionConfig, body: e.target.value})}
                        placeholder="Contenu de l'email"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActionModal(false);
                    setEditingAction(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={editingAction ? handleUpdateAction : handleCreateAction}
                  style={{ backgroundColor: primaryColor }}
                >
                  {editingAction ? 'Mettre à jour' : 'Créer l\'action'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};