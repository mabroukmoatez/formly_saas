import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { TrainerPermissions } from './TrainerPermissionsModal';
import { courseCreation } from '../../services/courseCreation';
import { Users, Trash2, Plus, Search, X, Check, Loader2, Camera } from 'lucide-react';
import { TrainerSelectionModal } from './TrainerSelectionModal';

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
  const { organization, subdomain } = useOrganization();
  const { formData } = useCourseCreation();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();
  const primaryColor = organization?.primary_color || '#007aff';

  const [courseTrainers, setCourseTrainers] = useState<CourseTrainer[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

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
      if (response.success && response.data) {
        const validTrainers = response.data.filter((ct: any) => ct.trainer);
        setCourseTrainers(validTrainers);
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
        setAvailableTrainers(response.data);
      }
    } catch (error: any) {
      console.error('Error loading available trainers:', error);
    }
  };

  const handleAssignTrainers = async (trainerIds: (number | string)[], permissions: TrainerPermissions) => {
    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
      }

      // Assign each selected trainer
      for (const trainerId of trainerIds) {
        let trainerIdentifier: number | string = trainerId;
        
        if (typeof trainerId === 'string') {
          const parsedId = parseInt(trainerId, 10);
          if (!isNaN(parsedId)) {
            trainerIdentifier = parsedId;
          }
        }

        const assignmentData = { instructor_id: trainerIdentifier, permissions };
        await courseCreation.assignTrainerEnhanced(formData.courseUuid, assignmentData);
      }

      showSuccess('Formateurs assignés avec succès');
      await loadCourseTrainers();
      setShowSelectionModal(false);
    } catch (error: any) {
      console.error('Error assigning trainers:', error);
      showError('Erreur', error.response?.data?.message || 'Impossible d\'assigner les formateurs');
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


  const handleCreateNewTrainer = () => {
    // Navigate to trainers page with create parameter
    const trainersRoute = subdomain ? `/${subdomain}/formateurs?create=true` : '/formateurs?create=true';
    navigate(trainersRoute);
  };

  // Get assigned trainer IDs for pre-selection
  const assignedTrainerIds = courseTrainers
    .map(ct => ct.trainer?.id || ct.trainer?.uuid)
    .filter(Boolean) as (number | string)[];

  // Empty state (before any trainers are assigned)
  if (courseTrainers.length === 0 && !loading) {
    return (
      <div className="relative w-full min-h-[600px] flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/assets/images/step5.png)',
            backgroundSize: '150%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(2px)'
          }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/70" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-2xl">
          <p className="text-lg mb-2 text-black font-medium">
            Tous les formateurs de vos Parties-prenantes peuvent animer cette formation.
          </p>
          <p className="text-sm mb-6 text-gray-700">
            Spécifiez Des Formateurs Ici Pour Restreindre L'animation Des Séances.
          </p>
          <Button
            onClick={() => setShowSelectionModal(true)}
            style={{ backgroundColor: primaryColor }}
            className="gap-2 px-6 py-3 text-base"
          >
            <Users className="w-5 h-5" />
            Sélectionner Un Formateur
          </Button>
        </div>

        {/* Modals */}
        <TrainerSelectionModal
          isOpen={showSelectionModal}
          onClose={() => setShowSelectionModal(false)}
          onSelect={handleAssignTrainers}
          availableTrainers={availableTrainers}
          assignedTrainerIds={assignedTrainerIds}
          onCreateNew={handleCreateNewTrainer}
        />
      </div>
    );
  }

  // Trainers grid view (when trainers are assigned)
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Trainer Cards */}
          {courseTrainers.map(courseTrainer => {
            if (!courseTrainer?.trainer) return null;
            
            const trainer = courseTrainer.trainer;
            
            return (
              <Card 
                key={courseTrainer.id} 
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    {trainer.avatar_url ? (
                      <img 
                        src={trainer.avatar_url} 
                        alt={trainer.name || 'Formateur'}
                        className="w-20 h-20 rounded-full object-cover mb-3"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {trainer.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}

                    {/* Name */}
                    <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {trainer.name || 'Formateur'}
                    </h3>

                    {/* Domain Label */}
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Domaine
                    </p>

                    {/* Badge */}
                    <Badge 
                      className="mb-3 px-3 py-1"
                      style={{ 
                        backgroundColor: isDark ? '#7C3AED' : '#EDE9FE',
                        color: isDark ? '#C4B5FD' : '#7C3AED',
                        border: 'none'
                      }}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Formateur
                    </Badge>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTrainer(courseTrainer.trainer_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full mt-2"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Retirer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Trainer Card */}
          <Card 
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-2 border-dashed hover:border-solid transition-all cursor-pointer`}
            onClick={() => setShowSelectionModal(true)}
            style={{ 
              borderColor: isDark ? '#4B5563' : primaryColor,
              borderStyle: 'dashed'
            }}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[280px]">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Plus className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <p 
                className="text-base font-medium"
                style={{ color: primaryColor }}
              >
                Ajouter Formateur
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <TrainerSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelect={handleAssignTrainers}
        availableTrainers={availableTrainers}
        assignedTrainerIds={assignedTrainerIds}
        onCreateNew={handleCreateNewTrainer}
      />
    </div>
  );
};
