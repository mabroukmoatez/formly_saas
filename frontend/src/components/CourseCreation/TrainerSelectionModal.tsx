import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Users, Check, Eye, Edit, Award, FileText, Shield, GitBranch, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
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
  onCreateNew: () => void;
}

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
  onCreateNew
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainers, setSelectedTrainers] = useState<Set<number | string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissions, setPermissions] = useState<TrainerPermissions>({
    view_course: true,
    edit_content: false,
    manage_students: false,
    grade_assignments: false,
    view_analytics: false,
    manage_documents: false,
    manage_workflow: false,
    publish_content: false
  });

  const filteredTrainers = useMemo(() => {
    return availableTrainers.filter(trainer =>
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTrainers, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (selectAll) {
      const allIds = filteredTrainers.map(t => t.uuid || t.id);
      setSelectedTrainers(new Set(allIds));
    } else {
      // Only clear if explicitly unchecking selectAll
      // Don't clear on initial mount or when selectAll is already false
      if (selectedTrainers.size > 0) {
        // Keep current selections, just don't add new ones
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAll]);

  useEffect(() => {
    if (selectedTrainers.size > 0) {
      setShowPermissions(true);
    }
  }, [selectedTrainers.size]);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setSelectedTrainers(new Set());
      setSelectAll(false);
      setShowPermissions(false);
      setSearchQuery('');
      setPermissions({
        view_course: true,
        edit_content: false,
        manage_students: false,
        grade_assignments: false,
        view_analytics: false,
        manage_documents: false,
        manage_workflow: false,
        publish_content: false
      });
    }
  }, [isOpen]);

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
      const allIds = filteredTrainers.map(t => t.uuid || t.id);
      setSelectedTrainers(new Set(allIds));
      setSelectAll(true);
    }
  };

  const handlePermissionToggle = (key: keyof TrainerPermissions) => {
    if (key === 'view_course') return; // Cannot disable view_course
    const newPermissions = { ...permissions, [key]: !permissions[key] };
    setPermissions(newPermissions);
  };

  const handleChoose = async () => {
    if (selectedTrainers.size === 0) {
      return;
    }
    await onSelect(Array.from(selectedTrainers), permissions);
  };

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

        {/* Permissions Section */}
        {selectedTrainers.size > 0 && (
          <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setShowPermissions(!showPermissions)}
              className={`w-full p-4 flex items-center justify-between ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Permissions ({selectedTrainers.size} formateur{selectedTrainers.size > 1 ? 's' : ''} sélectionné{selectedTrainers.size > 1 ? 's' : ''})
                </span>
              </div>
              {showPermissions ? (
                <ChevronUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>
            
            {showPermissions && (
              <div className="p-6 space-y-3 max-h-[300px] overflow-y-auto">
                {[
                  { key: 'view_course' as const, label: 'Voir le cours', description: 'Consulter le contenu et la structure du cours', icon: Eye },
                  { key: 'edit_content' as const, label: 'Éditer le contenu', description: 'Modifier chapitres, leçons et éléments de contenu', icon: Edit },
                  { key: 'manage_students' as const, label: 'Gérer les étudiants', description: 'Inscrire/retirer des étudiants et suivre leur progression', icon: Users },
                  { key: 'grade_assignments' as const, label: 'Noter les devoirs', description: 'Évaluer les soumissions et donner des feedbacks', icon: Award },
                  { key: 'view_analytics' as const, label: 'Voir les analytics', description: 'Accéder aux statistiques et rapports du cours', icon: FileText },
                  { key: 'manage_documents' as const, label: 'Gérer les documents', description: 'Créer, modifier et supprimer des documents', icon: Upload },
                  { key: 'manage_workflow' as const, label: 'Gérer les workflows', description: 'Configurer les automatisations et notifications', icon: GitBranch },
                  { key: 'publish_content' as const, label: 'Publier le contenu', description: 'Contrôler la visibilité et publication', icon: Shield }
                ].map(({ key, label, description, icon: Icon }) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      permissions[key]
                        ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                        : isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            permissions[key]
                              ? 'bg-blue-500'
                              : isDark ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                          style={permissions[key] ? { backgroundColor: primaryColor } : {}}
                        >
                          <Icon className={`w-4 h-4 ${
                            permissions[key] ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {label}
                            </h4>
                            {permissions[key] && (
                              <Check className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePermissionToggle(key)}
                        disabled={key === 'view_course'}
                        className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                          key === 'view_course' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        } ${
                          permissions[key]
                            ? 'bg-blue-500'
                            : isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                        style={permissions[key] ? { backgroundColor: primaryColor } : {}}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            permissions[key] ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trainers Grid */}
        <div className={`p-6 overflow-y-auto ${showPermissions ? 'max-h-[calc(90vh-500px)]' : 'max-h-[calc(90vh-200px)]'}`}>
          {filteredTrainers.length === 0 ? (
            <div className="text-center py-12">
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                Aucun formateur trouvé
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTrainers.map(trainer => {
                // Use UUID in priority, fallback to ID if UUID not available
                const trainerId = trainer.uuid || trainer.id;
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
      </div>
    </div>
  );
};

