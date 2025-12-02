import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useToast } from '../ui/toast';
import { TrainerPermissionsModal, TrainerPermissions } from './TrainerPermissionsModal';
import { courseCreation } from '../../services/courseCreation';
import { CourseTrainerEnhanced } from '../../services/courseCreation.types';
import { User, Trash2, Edit3, Plus, Eye, Shield, Users, Award } from 'lucide-react';

interface CourseTrainer {
  id?: number;
  uuid?: string;
  trainer_id?: number | string;
  course_uuid?: string;
  session_uuid?: string;
  permissions?: TrainerPermissions;
  assigned_at?: string;
  // Trainer data can be nested or flat
  trainer?: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    avatar_url?: string;
  };
  // Flat structure (when trainer data is directly on the object)
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  avatar_url?: string;
}

export const Step5Formateur: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useSessionCreation();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [courseTrainers, setCourseTrainers] = useState<CourseTrainer[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<CourseTrainer | null>(null);

  // Use courseUuid for trainer operations
  useEffect(() => {
    if (formData.courseUuid) {
      loadCourseTrainers();
      loadAvailableTrainers();
    }
  }, [formData.courseUuid]);

  const loadCourseTrainers = async () => {
    try {
      setLoading(true);
      const response = await courseCreation.getCourseTrainers(formData.courseUuid!);
      if (response.success && response.data) {
        // Backend may return trainer data in two formats:
        // 1. Nested: { trainer: { id, uuid, name, ... } }
        // 2. Flat: { id, uuid, name, ... } (trainer data directly on the object)
        const validTrainers = response.data.filter((ct: any) => {
          // Check if trainer data exists (either nested or flat)
          const hasTrainerData = ct.trainer || (ct.uuid || ct.id);
          return hasTrainerData;
        });
        
        // Normalize the data structure - ensure trainer data is accessible
        const normalizedTrainers = validTrainers.map((ct: any) => {
          // If trainer data is nested, keep it. If flat, wrap it for consistency
          if (ct.trainer) {
            return ct; // Already nested, keep as is
          } else {
            // Flat structure - backend returns trainer data directly
            // Return the object as-is since it already has all trainer fields
            return ct;
          }
        });
        
        setCourseTrainers(normalizedTrainers);
      }
    } catch (error: any) {
      showError('Erreur', 'Impossible de charger les formateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTrainers = async () => {
    try {
      const response = await courseCreation.getAllTrainers({ is_active: true });
      if (response.success && response.data) {
        setAvailableTrainers(response.data);
      }
    } catch (error: any) {
    }
  };

  const handleAssignTrainer = async (trainerId: number | string, permissions: TrainerPermissions) => {
    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
      }

      // Accept both numeric ID and UUID
      // IMPORTANT: If it's a string, check if it's a UUID (contains hyphens) or a numeric string
      // UUIDs should NOT be parsed as numbers - they should stay as strings
      let trainerIdentifier: number | string = trainerId;
      
      if (typeof trainerId === 'string') {
        // Check if it's a UUID format (contains hyphens like "60046f79-d593-4ba9-bd74-e92474cf9cd3")
        // If it's a UUID, keep it as a string. Otherwise, try parsing as number.
        if (trainerId.includes('-')) {
          // It's a UUID, keep as string
          trainerIdentifier = trainerId;
        } else {
          // It's a numeric string, try to parse as number
          const parsedId = parseInt(trainerId, 10);
          if (!isNaN(parsedId)) {
            trainerIdentifier = parsedId;
          } else {
            // Keep as string if parsing fails
            trainerIdentifier = trainerId;
          }
        }
      }

      // Backend expects instructor_id - assignSessionTrainer will handle the conversion
      const assignmentData = { instructor_id: trainerIdentifier, permissions };
      
      const response = await courseCreation.assignTrainer(formData.courseUuid!, assignmentData);
      
      showSuccess('Formateur assigné avec succès');
      await loadCourseTrainers();
    } catch (error: any) {
      // Extract validation errors if present
      const validationErrors = error.details?.errors || error.response?.data?.errors;
      if (validationErrors) {
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]: [string, any]) => {
            const msgs = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${msgs}`;
          })
          .join(' | ');
        showError('Erreur de validation', errorMessages);
      } else {
        // Check for backend database errors (500 status)
        if (error.status === 500) {
          const backendError = error.details?.error || error.message || '';
          if (backendError.includes('Column not found') || backendError.includes('SQLSTATE')) {
            showError('Erreur serveur', 'Erreur de base de données côté serveur. Veuillez contacter le support technique. Le formateur a peut-être été assigné malgré l\'erreur.');
            // Still try to reload trainers in case it succeeded despite the error
            setTimeout(async () => {
              await loadCourseTrainers();
            }, 1000);
          } else {
            showError('Erreur serveur', error.response?.data?.message || error.message || 'Erreur lors de l\'assignation du formateur');
          }
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Impossible d\'assigner le formateur';
          showError('Erreur', errorMessage);
        }
      }
      throw error;
    }
  };

  const handleRemoveTrainer = async (trainerId: number | string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce formateur ?')) {
      return;
    }

    try {
      // Convert to string for API call (API expects string UUID or numeric ID as string)
      const trainerIdStr = String(trainerId);
      await courseCreation.removeTrainer(formData.courseUuid!, trainerIdStr);
      // Reload trainers to get updated list from backend
      await loadCourseTrainers();
      showSuccess('Formateur retiré');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Impossible de retirer le formateur';
      showError('Erreur', errorMessage);
    }
  };

  const getPermissionLevel = (permissions: TrainerPermissions): { label: string; color: string } => {
    const count = Object.values(permissions).filter(Boolean).length;
    if (count === 1) return { label: 'Lecture seule', color: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700' };
    if (count <= 4) return { label: 'Éditeur', color: isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-700' };
    if (count <= 7) return { label: 'Gestionnaire', color: isDark ? 'bg-purple-900/20 text-purple-300' : 'bg-purple-100 text-purple-700' };
    return { label: 'Contrôle total', color: isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-700' };
  };

  const getPermissionIcons = (permissions: TrainerPermissions) => {
    const icons = [];
    if (permissions.view_course) icons.push({ icon: Eye, label: 'Voir' });
    if (permissions.edit_content) icons.push({ icon: Edit3, label: 'Éditer' });
    if (permissions.manage_students) icons.push({ icon: Users, label: 'Étudiants' });
    if (permissions.grade_assignments) icons.push({ icon: Award, label: 'Noter' });
    return icons;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Formateurs du Cours
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Assignez des formateurs et définissez leurs permissions
          </p>
        </div>
        <Button
          onClick={() => setShowAssignModal(true)}
          style={{ backgroundColor: primaryColor }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Assigner un Formateur
        </Button>
      </div>

      {/* Info Card */}
      <Card className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className={`font-medium mb-1 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                Permissions Granulaires
              </h4>
              <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Contrôlez précisément ce que chaque formateur peut faire : voir, éditer, gérer les étudiants, noter, etc.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
        </div>
      ) : courseTrainers.length === 0 ? (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucun formateur assigné
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Assignez des formateurs pour collaborer sur ce cours
              </p>
              <Button
                onClick={() => setShowAssignModal(true)}
                style={{ backgroundColor: primaryColor }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Assigner le Premier Formateur
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courseTrainers.map(courseTrainer => {
            // Handle both nested and flat trainer data structures
            // Backend may return: { trainer: {...} } OR { id, uuid, name, ... } directly
            const trainer = courseTrainer.trainer || courseTrainer;
            
            // Guard against missing trainer data
            if (!trainer || (!trainer.uuid && !trainer.id)) {
              return null;
            }

            const permLevel = getPermissionLevel(courseTrainer.permissions || {});
            const permIcons = getPermissionIcons(courseTrainer.permissions || {});
            
            // Get unique key for the card
            const cardKey = courseTrainer.id || courseTrainer.uuid || trainer.id || trainer.uuid || `trainer-${trainer.name}`;
            
            return (
              <Card key={cardKey} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      {trainer.avatar_url ? (
                        <img 
                          src={trainer.avatar_url} 
                          alt={trainer.name || 'Formateur'}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl`} style={{ backgroundColor: primaryColor }}>
                          {trainer.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {trainer.name || 'Formateur'}
                          </h3>
                          <Badge className={permLevel.color}>
                            {permLevel.label}
                          </Badge>
                        </div>

                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {trainer.email || 'Email non disponible'}
                        </p>

                        {trainer.specialization && (
                          <p className={`text-sm mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Spécialisation: {trainer.specialization}
                          </p>
                        )}

                        {/* Permission Icons */}
                        <div className="flex flex-wrap gap-2">
                          {permIcons.map(({ icon: Icon, label }, idx) => (
                            <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              <Icon className="w-3 h-3" />
                              {label}
                            </div>
                          ))}
                          {Object.values(courseTrainer.permissions).filter(Boolean).length > 4 && (
                            <div className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                              +{Object.values(courseTrainer.permissions).filter(Boolean).length - 4} autres
                            </div>
                          )}
                        </div>

                        {courseTrainer.assigned_at && (
                          <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Assigné le {new Date(courseTrainer.assigned_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTrainer(courseTrainer)}
                        className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                        title="Modifier permissions"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTrainer(courseTrainer.trainer_id || trainer.id || trainer.uuid)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Trainer Modal */}
      <TrainerPermissionsModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSave={handleAssignTrainer}
        sessionUuid={formData.courseUuid || ''}
        availableTrainers={availableTrainers}
        assignedTrainers={courseTrainers}
      />
    </div>
  );
};

