import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { TrainerPermissionsModal, TrainerPermissions } from './TrainerPermissionsModal';
import { courseCreation } from '../../services/courseCreation';
import { CourseTrainerEnhanced } from '../../services/courseCreation.types';
import { User, Trash2, Edit3, Plus, Eye, Shield, Users, Award } from 'lucide-react';

interface CourseTrainer {
  id: number;
  trainer_id: number;
  course_uuid: string;
  permissions: TrainerPermissions;
  assigned_at: string;
  trainer: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    avatar_url?: string;
  };
}

export const Step5FormateurNew: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useCourseCreation();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [courseTrainers, setCourseTrainers] = useState<CourseTrainer[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<CourseTrainer | null>(null);

  useEffect(() => {
    if (formData.courseUuid) {
      loadCourseTrainers();
      loadAvailableTrainers();
    }
  }, [formData.courseUuid]);

  const loadCourseTrainers = async () => {
    try {
      setLoading(true);
      const response = await courseCreation.getCourseTrainersEnhanced(formData.courseUuid!);
      console.log('📊 Course trainers response:', response);
      if (response.success && response.data) {
        // Filter out any trainers without trainer data
        const validTrainers = response.data.filter((ct: any) => {
          if (!ct.trainer) {
            console.warn('⚠️ Skipping course trainer without trainer data:', ct);
            return false;
          }
          return true;
        });
        setCourseTrainers(validTrainers);
        console.log('✅ Loaded course trainers:', validTrainers);
      }
    } catch (error: any) {
      console.error('Error loading trainers:', error);
      showError('Erreur', 'Impossible de charger les formateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTrainers = async () => {
    try {
      const response = await courseCreation.getOrganizationTrainers({ is_active: true });
      if (response.success && response.data) {
        // Ensure trainers have numeric IDs - log structure for debugging
        const trainers = response.data.map((trainer: any) => {
          console.log('🔍 Trainer from API:', { id: trainer.id, uuid: trainer.uuid, name: trainer.name });
          return trainer;
        });
        setAvailableTrainers(trainers);
      }
    } catch (error: any) {
      console.error('Error loading available trainers:', error);
    }
  };

  const handleAssignTrainer = async (trainerId: number | string, permissions: TrainerPermissions) => {
    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
      }

      // Accept both numeric ID and UUID
      let trainerIdentifier: number | string = trainerId;
      
      if (typeof trainerId === 'string') {
        // Try to parse as number if it's a numeric string
        const parsedId = parseInt(trainerId, 10);
        if (!isNaN(parsedId)) {
          trainerIdentifier = parsedId;
        }
        // Otherwise keep as UUID string
      }
      
      console.log('🔵 Trainer ID:', trainerIdentifier, 'Type:', typeof trainerIdentifier);

      // Backend expects instructor_id
      const assignmentData = { instructor_id: trainerIdentifier, permissions };
      
      console.log('🔵 Assigning trainer with data:', assignmentData);
      console.log('🔵 Course UUID:', formData.courseUuid);
      
      const response = await courseCreation.assignTrainerEnhanced(formData.courseUuid, assignmentData);
      
      console.log('✅ Trainer assigned response:', response);
      
      showSuccess('Formateur assigné avec succès');
      await loadCourseTrainers();
    } catch (error: any) {
      console.error('❌ Error assigning trainer:', error);
      console.error('❌ Error details:', error.message, error.status);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Impossible d\'assigner le formateur';
      showError('Erreur', errorMessage);
      throw error;
    }
  };

  const handleRemoveTrainer = async (trainerId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce formateur ?')) {
      return;
    }

    try {
      await courseCreation.removeTrainerEnhanced(formData.courseUuid!, trainerId);
      setCourseTrainers(courseTrainers.filter(ct => ct.trainer_id !== trainerId));
      showSuccess('Formateur retiré');
    } catch (error: any) {
      console.error('Error removing trainer:', error);
      showError('Erreur', 'Impossible de retirer le formateur');
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
            // Guard against missing trainer data
            if (!courseTrainer?.trainer) {
              console.error('❌ CourseTrainer missing trainer data:', courseTrainer);
              return null;
            }

            const permLevel = getPermissionLevel(courseTrainer.permissions);
            const permIcons = getPermissionIcons(courseTrainer.permissions);
            const trainer = courseTrainer.trainer;
            
            return (
              <Card key={courseTrainer.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
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

                        <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Assigné le {new Date(courseTrainer.assigned_at).toLocaleDateString('fr-FR')}
                        </p>
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
                        onClick={() => handleRemoveTrainer(courseTrainer.trainer_id)}
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
        courseUuid={formData.courseUuid || ''}
        availableTrainers={availableTrainers}
        assignedTrainers={courseTrainers}
      />
    </div>
  );
};

