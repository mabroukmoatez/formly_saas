import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Badge } from './badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from './toast';
import { courseCreation } from '../../services/courseCreation';
import { WorkflowTrigger } from '../../services/courseCreation.types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Save,
  Calendar,
  User,
  Building2,
  GraduationCap,
  CreditCard,
  FileText,
  Bell,
  Zap
} from 'lucide-react';

interface WorkflowTriggerManagerProps {
  courseUuid: string;
  workflowId: string;
  onTriggerUpdate?: () => void;
}

export const WorkflowTriggerManager: React.FC<WorkflowTriggerManagerProps> = ({
  courseUuid,
  workflowId,
  onTriggerUpdate
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<WorkflowTrigger | null>(null);
  const [triggerForm, setTriggerForm] = useState({
    trigger_name: '',
    trigger_event: 'course_started' as WorkflowTrigger['trigger_event'],
    trigger_conditions: {},
    is_active: true
  });

  const triggerEvents = [
    { 
      key: 'course_started', 
      label: 'Début du cours', 
      icon: Play, 
      description: 'Se déclenche quand un apprenant commence le cours' 
    },
    { 
      key: 'course_completed', 
      label: 'Fin du cours', 
      icon: CheckCircle, 
      description: 'Se déclenche quand un apprenant termine le cours' 
    },
    { 
      key: 'lesson_completed', 
      label: 'Leçon terminée', 
      icon: GraduationCap, 
      description: 'Se déclenche à la fin de chaque leçon' 
    },
    { 
      key: 'assignment_submitted', 
      label: 'Devoir soumis', 
      icon: FileText, 
      description: 'Se déclenche quand un devoir est soumis' 
    },
    { 
      key: 'payment_received', 
      label: 'Paiement reçu', 
      icon: CreditCard, 
      description: 'Se déclenche quand un paiement est confirmé' 
    },
    { 
      key: 'enrollment_created', 
      label: 'Inscription créée', 
      icon: User, 
      description: 'Se déclenche lors d\'une nouvelle inscription' 
    },
    { 
      key: 'deadline_approaching', 
      label: 'Échéance approche', 
      icon: Clock, 
      description: 'Se déclenche avant une échéance' 
    },
    { 
      key: 'custom', 
      label: 'Personnalisé', 
      icon: Settings, 
      description: 'Déclencheur personnalisé' 
    }
  ];

  useEffect(() => {
    loadTriggers();
  }, [courseUuid]);

  const loadTriggers = async () => {
    setIsLoading(true);
    try {
      const response = await courseCreation.getWorkflowTriggers(courseUuid);
      setTriggers(response.data?.triggers || []);
    } catch (err) {
      console.error('Failed to load triggers:', err);
      error('Erreur lors du chargement des déclencheurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrigger = async () => {
    try {
      setIsLoading(true);
      await courseCreation.createWorkflowTrigger(courseUuid, triggerForm);
      success('Déclencheur créé avec succès');
      setShowCreateModal(false);
      resetForm();
      loadTriggers();
      onTriggerUpdate?.();
    } catch (err) {
      console.error('Failed to create trigger:', err);
      error('Erreur lors de la création du déclencheur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTrigger = async () => {
    if (!editingTrigger) return;

    try {
      setIsLoading(true);
      await courseCreation.updateWorkflowTrigger(courseUuid, editingTrigger.uuid, triggerForm);
      success('Déclencheur mis à jour avec succès');
      setShowEditModal(false);
      setEditingTrigger(null);
      resetForm();
      loadTriggers();
      onTriggerUpdate?.();
    } catch (err) {
      console.error('Failed to update trigger:', err);
      error('Erreur lors de la mise à jour du déclencheur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce déclencheur ?')) return;

    try {
      setIsLoading(true);
      await courseCreation.deleteWorkflowTrigger(courseUuid, triggerId);
      success('Déclencheur supprimé avec succès');
      loadTriggers();
      onTriggerUpdate?.();
    } catch (err) {
      console.error('Failed to delete trigger:', err);
      error('Erreur lors de la suppression du déclencheur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      setIsLoading(true);
      await courseCreation.updateWorkflowTrigger(courseUuid, triggerId, { is_active: !isActive });
      success(`Déclencheur ${!isActive ? 'activé' : 'désactivé'} avec succès`);
      loadTriggers();
      onTriggerUpdate?.();
    } catch (err) {
      console.error('Failed to toggle trigger:', err);
      error('Erreur lors de la modification du déclencheur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTrigger = async (triggerId: string) => {
    try {
      setIsLoading(true);
      await courseCreation.testWorkflowTrigger(courseUuid, triggerId);
      success('Test du déclencheur effectué');
    } catch (err) {
      console.error('Failed to test trigger:', err);
      error('Erreur lors du test du déclencheur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTrigger = (trigger: WorkflowTrigger) => {
    setEditingTrigger(trigger);
    setTriggerForm({
      trigger_name: trigger.trigger_name,
      trigger_event: trigger.trigger_event,
      trigger_conditions: trigger.trigger_conditions,
      is_active: trigger.is_active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setTriggerForm({
      trigger_name: '',
      trigger_event: 'course_started',
      trigger_conditions: {},
      is_active: true
    });
  };

  const getEventIcon = (event: WorkflowTrigger['trigger_event']) => {
    const eventData = triggerEvents.find(e => e.key === event);
    return eventData?.icon || Settings;
  };

  const getEventLabel = (event: WorkflowTrigger['trigger_event']) => {
    const eventData = triggerEvents.find(e => e.key === event);
    return eventData?.label || event;
  };

  const getEventDescription = (event: WorkflowTrigger['trigger_event']) => {
    const eventData = triggerEvents.find(e => e.key === event);
    return eventData?.description || '';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Déclencheurs de workflow
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configurez les événements qui déclenchent automatiquement votre workflow
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Nouveau déclencheur
        </Button>
      </div>

      {/* Triggers List */}
      <div className="space-y-3">
        {triggers.map((trigger) => {
          const IconComponent = getEventIcon(trigger.trigger_event);
          return (
            <Card key={trigger.uuid} className={`rounded-lg ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {trigger.trigger_name}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getEventDescription(trigger.trigger_event)}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEventLabel(trigger.trigger_event)}
                        </Badge>
                        <Badge 
                          className={trigger.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }
                        >
                          {trigger.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestTrigger(trigger.uuid)}
                      className="flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      Tester
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleTrigger(trigger.uuid, trigger.is_active)}
                      className={`flex items-center gap-1 ${
                        trigger.is_active ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'
                      }`}
                    >
                      {trigger.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {trigger.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTrigger(trigger)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTrigger(trigger.uuid)}
                      className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {triggers.length === 0 && (
          <Card className={`rounded-lg border-2 border-dashed ${
            isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
          }`}>
            <CardContent className="p-8 text-center">
              <Bell className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <h3 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucun déclencheur configuré
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Créez votre premier déclencheur pour automatiser votre workflow
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Nouveau déclencheur
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nom du déclencheur
                  </label>
                  <Input
                    value={triggerForm.trigger_name}
                    onChange={(e) => setTriggerForm(prev => ({ ...prev, trigger_name: e.target.value }))}
                    placeholder="Ex: Notification de début de cours"
                    className={isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Événement déclencheur
                  </label>
                  <select
                    value={triggerForm.trigger_event}
                    onChange={(e) => setTriggerForm(prev => ({ ...prev, trigger_event: e.target.value as WorkflowTrigger['trigger_event'] }))}
                    className={`w-full p-2 border rounded-md ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {triggerEvents.map((event) => (
                      <option key={event.key} value={event.key}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {getEventDescription(triggerForm.trigger_event)}
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={triggerForm.is_active}
                      onChange={(e) => setTriggerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Activer le déclencheur
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateTrigger}
                    disabled={isLoading || !triggerForm.trigger_name.trim()}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white"
                  >
                    {isLoading ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trigger Modal */}
      {showEditModal && editingTrigger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Modifier le déclencheur
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nom du déclencheur
                  </label>
                  <Input
                    value={triggerForm.trigger_name}
                    onChange={(e) => setTriggerForm(prev => ({ ...prev, trigger_name: e.target.value }))}
                    placeholder="Ex: Notification de début de cours"
                    className={isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Événement déclencheur
                  </label>
                  <select
                    value={triggerForm.trigger_event}
                    onChange={(e) => setTriggerForm(prev => ({ ...prev, trigger_event: e.target.value as WorkflowTrigger['trigger_event'] }))}
                    className={`w-full p-2 border rounded-md ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {triggerEvents.map((event) => (
                      <option key={event.key} value={event.key}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {getEventDescription(triggerForm.trigger_event)}
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={triggerForm.is_active}
                      onChange={(e) => setTriggerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Activer le déclencheur
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpdateTrigger}
                    disabled={isLoading || !triggerForm.trigger_name.trim()}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white"
                  >
                    {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
