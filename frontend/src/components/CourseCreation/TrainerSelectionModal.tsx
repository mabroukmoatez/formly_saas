import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Users, Check, Eye, Edit, Award, FileText, Upload, GitBranch, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { TrainerPermissions } from './TrainerPermissionsModal';

interface Trainer {
  id: number;
  uuid: string;
  name: string;
  email: string;
  avatar_url?: string;
  specialization?: string;
}

interface TrainerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (trainerIds: (number | string)[], permissions: TrainerPermissions) => Promise<void>;
  availableTrainers: Trainer[];
  assignedTrainerIds?: (number | string)[];
  onCreateNew: () => void;
}

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

const defaultPermissions: TrainerPermissions = {
  view_course: true,
  edit_content: false,
  manage_students: false,
  grade_assignments: false,
  view_analytics: false,
  manage_documents: false,
  manage_workflow: false,
  publish_content: false
};

export const TrainerSelectionModal: React.FC<TrainerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  availableTrainers,
  assignedTrainerIds = [],
  onCreateNew
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainers, setSelectedTrainers] = useState<Set<number | string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [permissions, setPermissions] = useState<TrainerPermissions>(defaultPermissions);
  const isInitializing = useRef(false);

  const filteredTrainers = availableTrainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pre-select assigned trainers when modal opens
  useEffect(() => {
    if (isOpen) {
      isInitializing.current = true;
      if (assignedTrainerIds.length > 0) {
        const assignedSet = new Set(assignedTrainerIds);
        setSelectedTrainers(assignedSet);
        // Update selectAll based on whether all filtered trainers are selected
        const filteredIds = filteredTrainers.map(t => t.id || t.uuid);
        setSelectAll(filteredIds.length > 0 && filteredIds.every(id => assignedSet.has(id)));
      } else {
        // Reset selection when modal opens with no assigned trainers
        setSelectedTrainers(new Set());
        setSelectAll(false);
      }
      // Reset initialization flag after a short delay
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    }
  }, [isOpen, assignedTrainerIds]);

  // Handle selectAll toggle - only apply when user manually toggles, not on initial load
  useEffect(() => {
    if (!isInitializing.current && selectAll) {
      const allIds = filteredTrainers.map(t => t.id || t.uuid);
      setSelectedTrainers(new Set(allIds));
    }
  }, [selectAll, filteredTrainers]);

  const handleToggleTrainer = (trainerId: number | string) => {
    const newSelected = new Set(selectedTrainers);
    if (newSelected.has(trainerId)) {
      newSelected.delete(trainerId);
    } else {
      newSelected.add(trainerId);
    }
    setSelectedTrainers(newSelected);
    setSelectAll(newSelected.size === filteredTrainers.length && filteredTrainers.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTrainers(new Set());
      setSelectAll(false);
    } else {
      const allIds = filteredTrainers.map(t => t.id || t.uuid);
      setSelectedTrainers(new Set(allIds));
      setSelectAll(true);
    }
  };

  const handlePermissionToggle = (key: keyof TrainerPermissions) => {
    const newPermissions = { ...permissions, [key]: !permissions[key] };
    setPermissions(newPermissions);
  };

  const handleChoose = async () => {
    if (selectedTrainers.size === 0) {
      return;
    }
    await onSelect(Array.from(selectedTrainers), permissions);
  };

  const permissionCount = Object.values(permissions).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className={`w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <Input
                type="text"
                placeholder="Recherche"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Create Button */}
            <Button
              variant="outline"
              onClick={onCreateNew}
              className="gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Créer Un Nouveau Formateur
            </Button>

            {/* Choose Button */}
            <Button
              onClick={handleChoose}
              disabled={selectedTrainers.size === 0}
              style={{ backgroundColor: primaryColor }}
              className="gap-2 whitespace-nowrap"
            >
              Choisir Ce Formateur
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} hover:opacity-80`}
            >
              <div 
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectAll 
                    ? 'border-blue-500 bg-blue-500' 
                    : isDark 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-300 bg-white'
                }`}
              >
                {selectAll && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-medium">Tout sélectionner</span>
            </button>
          </div>
        </div>

        {/* Single Scrollable Container for Trainers and Permissions */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Trainers Grid */}
            <div>
              {filteredTrainers.length === 0 ? (
                <div className="text-center py-12">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Aucun formateur trouvé
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredTrainers.map(trainer => {
                    const trainerId = trainer.id || trainer.uuid;
                    const isSelected = selectedTrainers.has(trainerId);
                    
                    return (
                      <Card
                        key={trainerId}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-blue-500'
                            : isDark
                              ? 'bg-gray-700 border-gray-600'
                              : 'bg-white border-gray-200'
                        }`}
                        onClick={() => handleToggleTrainer(trainerId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            {trainer.avatar_url ? (
                              <img
                                src={trainer.avatar_url}
                                alt={trainer.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {trainer.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1">
                              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {trainer.name}
                              </h3>
                              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Domaine
                              </p>
                              <Badge
                                className="px-2 py-0.5 text-xs"
                                style={{
                                  backgroundColor: isDark ? '#EDE9FE' : '#EDE9FE',
                                  color: isDark ? '#7C3AED' : '#7C3AED',
                                  border: 'none'
                                }}
                              >
                                <Users className="w-3 h-3 mr-1" />
                                Formateur
                              </Badge>
                            </div>

                            {/* Checkbox */}
                            <div
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : isDark
                                    ? 'border-gray-600 bg-gray-700'
                                    : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Permissions Section - Only show when trainers are selected */}
            {selectedTrainers.size > 0 && (
              <div className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Autorisations pour les formateurs sélectionnés
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

