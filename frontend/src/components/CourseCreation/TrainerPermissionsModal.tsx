import React, { useState, useEffect } from 'react';
import { X, User, Check, Shield, Eye, Edit, Users, Award, FileText, GitBranch, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';

export interface TrainerPermissions {
  view_course: boolean;
  edit_content: boolean;
  manage_students: boolean;
  grade_assignments: boolean;
  view_analytics: boolean;
  manage_documents: boolean;
  manage_workflow: boolean;
  publish_content: boolean;
}

interface Trainer {
  id?: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  avatar_url?: string;
}

interface TrainerPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainerId: number, permissions: TrainerPermissions) => Promise<void>;
  courseUuid: string;
  availableTrainers: Trainer[];
  assignedTrainers?: Array<{ trainer_id: number }>;
}

type PermissionPreset = 'view_only' | 'content_editor' | 'course_manager' | 'custom';

const PERMISSION_DEFINITIONS: Array<{
  key: keyof TrainerPermissions;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}> = [
  {
    key: 'view_course',
    label: 'Voir le cours',
    description: 'Consulter le contenu et la structure du cours',
    icon: Eye
  },
  {
    key: 'edit_content',
    label: 'Éditer le contenu',
    description: 'Modifier chapitres, leçons et éléments de contenu',
    icon: Edit
  },
  {
    key: 'manage_students',
    label: 'Gérer les étudiants',
    description: 'Inscrire/retirer des étudiants et suivre leur progression',
    icon: Users
  },
  {
    key: 'grade_assignments',
    label: 'Noter les devoirs',
    description: 'Évaluer les soumissions et donner des feedbacks',
    icon: Award
  },
  {
    key: 'view_analytics',
    label: 'Voir les analytics',
    description: 'Accéder aux statistiques et rapports du cours',
    icon: FileText
  },
  {
    key: 'manage_documents',
    label: 'Gérer les documents',
    description: 'Créer, modifier et supprimer des documents',
    icon: Upload
  },
  {
    key: 'manage_workflow',
    label: 'Gérer les workflows',
    description: 'Configurer les automatisations et notifications',
    icon: GitBranch
  },
  {
    key: 'publish_content',
    label: 'Publier le contenu',
    description: 'Contrôler la visibilité et publication',
    icon: Shield
  }
];

const PERMISSION_PRESETS: Record<PermissionPreset, { label: string; description: string; permissions: Partial<TrainerPermissions> }> = {
  view_only: {
    label: 'Lecture seule',
    description: 'Consulter uniquement',
    permissions: {
      view_course: true,
      edit_content: false,
      manage_students: false,
      grade_assignments: false,
      view_analytics: false,
      manage_documents: false,
      manage_workflow: false,
      publish_content: false
    }
  },
  content_editor: {
    label: 'Éditeur de contenu',
    description: 'Créer et éditer',
    permissions: {
      view_course: true,
      edit_content: true,
      manage_students: false,
      grade_assignments: true,
      view_analytics: true,
      manage_documents: true,
      manage_workflow: false,
      publish_content: false
    }
  },
  course_manager: {
    label: 'Gestionnaire',
    description: 'Contrôle complet',
    permissions: {
      view_course: true,
      edit_content: true,
      manage_students: true,
      grade_assignments: true,
      view_analytics: true,
      manage_documents: true,
      manage_workflow: true,
      publish_content: true
    }
  },
  custom: {
    label: 'Personnalisé',
    description: 'Configuration manuelle',
    permissions: {}
  }
};

export const TrainerPermissionsModal: React.FC<TrainerPermissionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseUuid,
  availableTrainers,
  assignedTrainers = []
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PermissionPreset>('content_editor');
  const [permissions, setPermissions] = useState<TrainerPermissions>({
    view_course: true,
    edit_content: true,
    manage_students: false,
    grade_assignments: true,
    view_analytics: true,
    manage_documents: true,
    manage_workflow: false,
    publish_content: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTrainerId(null);
      setSelectedPreset('content_editor');
      setSearchQuery('');
      setPermissions(PERMISSION_PRESETS.content_editor.permissions as TrainerPermissions);
    }
  }, [isOpen]);

  const handlePresetChange = (preset: PermissionPreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setPermissions(PERMISSION_PRESETS[preset].permissions as TrainerPermissions);
    }
  };

  const handlePermissionToggle = (key: keyof TrainerPermissions) => {
    const newPermissions = { ...permissions, [key]: !permissions[key] };
    setPermissions(newPermissions);
    setSelectedPreset('custom');
  };

  const handleSave = async () => {
    console.log('🟢 handleSave called');
    console.log('🟢 selectedTrainerId:', selectedTrainerId);
    console.log('🟢 selectedTrainer object:', selectedTrainer);
    console.log('🟢 selectedTrainer.id:', selectedTrainer?.id);
    console.log('🟢 selectedTrainer.uuid:', selectedTrainer?.uuid);
    console.log('🟢 permissions:', permissions);

    if (!selectedTrainerId || !selectedTrainer) {
      showError('Erreur', 'Veuillez sélectionner un formateur');
      return;
    }

    // Try numeric ID first, fall back to UUID if not available
    let trainerIdToUse: number | string = selectedTrainer.id;
    
    if (trainerIdToUse === undefined || trainerIdToUse === null) {
      // If no numeric ID, use UUID (backend should accept both)
      console.warn('⚠️ No numeric ID available, using UUID:', selectedTrainer.uuid);
      trainerIdToUse = selectedTrainer.uuid;
    }

    if (!permissions.view_course) {
      showError('Erreur', 'La permission "Voir le cours" est obligatoire');
      return;
    }

    setSaving(true);
    try {
      console.log('🟢 Calling onSave with ID:', trainerIdToUse, 'Type:', typeof trainerIdToUse, permissions);
      // Cast to number for function signature, but backend will handle UUID if numeric ID not available
      await onSave(trainerIdToUse as any, permissions);
      showSuccess('Formateur assigné avec succès');
      onClose();
    } catch (err: any) {
      console.error('❌ Error in handleSave:', err);
      showError('Erreur', err.message || 'Impossible d\'assigner le formateur');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const assignedTrainerIds = (assignedTrainers || []).map(at => at.trainer_id);
  const availableForSelection = availableTrainers.filter(t => {
    const trainerId = t.id || t.uuid;
    return !assignedTrainerIds.includes(trainerId);
  });
  const filteredTrainers = availableForSelection.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTrainer = selectedTrainerId ? availableTrainers.find(t => {
    const trainerId = t.id || t.uuid;
    return trainerId === selectedTrainerId;
  }) : null;
  const permissionCount = Object.values(permissions).filter(Boolean).length;

  // Debug: Check button state
  console.log('🔍 Modal State:', {
    selectedTrainerId,
    saving,
    isButtonDisabled: saving || !selectedTrainerId,
    availableTrainersCount: availableTrainers.length,
    filteredTrainersCount: filteredTrainers.length
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <User className="w-6 h-6" style={{ color: primaryColor }} />
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Assigner un Formateur
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Choisissez un formateur et définissez ses permissions
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={saving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Trainer Selection */}
            <div>
              <Label className={`text-sm font-medium mb-3 block ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Sélectionner un Formateur <span className="text-red-500">*</span>
              </Label>
              
              {/* Search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Rechercher un formateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Trainers Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                {filteredTrainers.length === 0 ? (
                  <div className={`col-span-2 text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'Aucun formateur trouvé' : 'Tous les formateurs sont déjà assignés'}
                  </div>
                ) : (
                  <>
                  {filteredTrainers.map(trainer => {
                    // Prioritize numeric ID over UUID for backend compatibility
                    const trainerId = trainer.id !== undefined ? trainer.id : trainer.uuid;
                    console.log('🔍 Trainer object:', trainer);
                    console.log('🔍 Resolved trainer ID:', trainerId, 'Type:', typeof trainerId);
                    return (
                    <button
                      key={trainer.uuid}
                      onClick={() => {
                        // Always use numeric ID if available, otherwise UUID
                        const idToUse = trainer.id !== undefined ? trainer.id : trainer.uuid;
                        console.log('🟢 Trainer selected:', idToUse, trainer.name, 'Type:', typeof idToUse);
                        setSelectedTrainerId(idToUse as any); // Type assertion needed for UUID case
                      }}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedTrainerId === trainerId || (trainer.id !== undefined && selectedTrainerId === trainer.id)
                          ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                          : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {trainer.avatar_url ? (
                          <img src={trainer.avatar_url} alt={trainer.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium`} style={{ backgroundColor: primaryColor }}>
                            {trainer.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {trainer.name}
                          </div>
                          <div className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {trainer.email}
                          </div>
                        </div>
                        {selectedTrainerId === trainerId && <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                      </div>
                    </button>
                    );
                  })}
                  </>
                )}
              </div>
            </div>

            {/* Permission Presets */}
            <div>
              <Label className={`text-sm font-medium mb-3 block ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Niveau de Permission
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {(Object.keys(PERMISSION_PRESETS) as PermissionPreset[]).map(preset => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedPreset === preset
                        ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {PERMISSION_PRESETS[preset].label}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {PERMISSION_PRESETS[preset].description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Permissions Détaillées
                </Label>
                <Badge variant="outline" className={isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300'}>
                  {permissionCount}/8 activées
                </Badge>
              </div>
              
              <div className={`grid grid-cols-2 gap-3 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {PERMISSION_DEFINITIONS.map(({ key, label, description, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handlePermissionToggle(key)}
                    disabled={key === 'view_course' && permissions.view_course}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      permissions[key]
                        ? isDark ? 'border-green-600 bg-green-900/20' : 'border-green-500 bg-green-50'
                        : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-200'
                    } ${key === 'view_course' && permissions.view_course ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${permissions[key] ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {label}
                          {permissions[key] && <Check className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Summary */}
            {selectedTrainer && (
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                    {selectedTrainer.name}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    • {permissionCount} permission{permissionCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Ce formateur pourra: {
                    Object.entries(permissions)
                      .filter(([_, value]) => value)
                      .map(([key]) => PERMISSION_DEFINITIONS.find(p => p.key === key)?.label.toLowerCase())
                      .join(', ')
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              console.log('🟡 Button clicked!');
              console.log('🟡 Button disabled?', saving || !selectedTrainerId);
              console.log('🟡 selectedTrainerId:', selectedTrainerId);
              console.log('🟡 saving:', saving);
              handleSave();
            }}
            disabled={saving || !selectedTrainerId}
            style={{ backgroundColor: primaryColor }}
            className="min-w-[140px]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Assignment...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Assigner
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

