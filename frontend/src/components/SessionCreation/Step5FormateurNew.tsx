import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useToast } from '../ui/toast';
import { TrainerPermissions } from '../CourseCreation/TrainerPermissionsModal';
import { courseCreation } from '../../services/courseCreation';
import { Users, Trash2, Plus, Search, X, Check, Loader2, Camera, Edit3, Eye, Edit, Award, FileText, Shield, GitBranch, Upload } from 'lucide-react';
import { TrainerSelectionModal } from '../CourseCreation/TrainerSelectionModal';
import { TrainerCreateModal } from '../CourseCreation/TrainerCreateModal';

interface SessionTrainer {
  id: number;
  trainer_id: number;
  session_uuid: string;
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
  const { formData, trainers: contextTrainers } = useSessionCreation();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [sessionTrainers, setSessionTrainers] = useState<SessionTrainer[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<SessionTrainer | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<TrainerPermissions | null>(null);

  // Use courseUuid for trainer operations (trainers belong to COURSE, not session)
  useEffect(() => {
    if (formData.courseUuid) {
      // Check if trainers are already loaded from context (via loadFromCourse)
      if (contextTrainers && contextTrainers.length > 0) {
        console.log('[Step5FormateurNew] Using trainers from context:', contextTrainers);
        mapContextTrainersToSessionTrainers(contextTrainers);
        setLoading(false);
      } else {
        loadCourseTrainers();
      }
      loadAvailableTrainers();
    }
  }, [formData.courseUuid, contextTrainers]);
  
  // Map trainers from context (creation-data API) to SessionTrainer format
  const mapContextTrainersToSessionTrainers = (trainers: any[]) => {
    const mappedTrainers: SessionTrainer[] = trainers.map((trainerData: any) => {
      let permissions: TrainerPermissions = {
        view_course: true,
        edit_content: false,
        manage_students: false,
        grade_assignments: false,
        view_analytics: false,
        manage_documents: false,
        manage_workflow: false,
        publish_content: false
      };
      
      if (trainerData.pivot?.permissions || trainerData.permissions) {
        try {
          const rawPermissions = trainerData.pivot?.permissions || trainerData.permissions;
          const parsedPermissions = typeof rawPermissions === 'string' 
            ? JSON.parse(rawPermissions) 
            : rawPermissions;
          permissions = { ...permissions, ...parsedPermissions };
        } catch (e) {
          console.error('[Step5FormateurNew] Error parsing permissions:', e);
        }
      }

      return {
        id: trainerData.id || trainerData.uuid,
        trainer_id: parseInt(trainerData.pivot?.trainer_id || trainerData.uuid || trainerData.id) || trainerData.id,
        session_uuid: trainerData.pivot?.course_uuid || formData.courseUuid || '',
        permissions: permissions,
        assigned_at: trainerData.pivot?.assigned_at || trainerData.assigned_at || new Date().toISOString(),
        trainer: {
          id: trainerData.id,
          uuid: trainerData.uuid,
          name: trainerData.name || trainerData.user?.name || '',
          email: trainerData.email || trainerData.user?.email || '',
          phone: trainerData.phone || trainerData.user?.phone,
          specialization: trainerData.specialization,
          avatar_url: trainerData.avatar_url || trainerData.user?.image_url
        }
      };
    });
    
    console.log('[Step5FormateurNew] Mapped context trainers:', mappedTrainers);
    setSessionTrainers(mappedTrainers);
  };

  // Load trainers from COURSE API
  const loadCourseTrainers = async () => {
    try {
      setLoading(true);
      console.log('[Step5FormateurNew] Loading trainers for courseUuid:', formData.courseUuid);
      const response = await courseCreation.getCourseTrainers(formData.courseUuid!);
      console.log('[Step5FormateurNew] Trainers API response:', response);
      
      if (response.success && response.data) {
        // Handle different response structures: { trainers: [...] } or direct array
        const trainersArray = response.data.trainers || response.data;
        console.log('[Step5FormateurNew] Trainers array extracted:', trainersArray);
        
        if (!Array.isArray(trainersArray) || trainersArray.length === 0) {
          console.log('[Step5FormateurNew] No trainers found or invalid data structure');
          setSessionTrainers([]);
          return;
        }
        
        // Map API response to SessionTrainer format
        // API returns trainers directly with pivot data, not nested in trainer object
        const mappedTrainers: SessionTrainer[] = trainersArray.map((trainerData: any) => {
          // Parse permissions from JSON string
          let permissions: TrainerPermissions = {
            view_course: true,
            edit_content: false,
            manage_students: false,
            grade_assignments: false,
            view_analytics: false,
            manage_documents: false,
            manage_workflow: false,
            publish_content: false
          };
          
          if (trainerData.pivot?.permissions) {
            try {
              const parsedPermissions = typeof trainerData.pivot.permissions === 'string' 
                ? JSON.parse(trainerData.pivot.permissions) 
                : trainerData.pivot.permissions;
              permissions = { ...permissions, ...parsedPermissions };
            } catch (e) {
              console.error('Error parsing permissions:', e);
            }
          }

          return {
            id: trainerData.id || trainerData.uuid,
            trainer_id: parseInt(trainerData.pivot?.trainer_id || trainerData.uuid || trainerData.id) || trainerData.id,
            session_uuid: trainerData.pivot?.course_uuid || formData.courseUuid || '',
            permissions: permissions,
            assigned_at: trainerData.pivot?.assigned_at || new Date().toISOString(),
            trainer: {
              id: trainerData.id,
              uuid: trainerData.uuid,
              name: trainerData.name || '',
              email: trainerData.email || '',
              phone: trainerData.phone,
              specialization: trainerData.specialization,
              avatar_url: trainerData.avatar_url
            }
          };
        });
        
        console.log('[Step5FormateurNew] Mapped trainers:', mappedTrainers);
        setSessionTrainers(mappedTrainers);
      } else {
        console.log('[Step5FormateurNew] API response not successful or no data:', response);
      }
    } catch (error: any) {
      console.error('[Step5FormateurNew] Error loading trainers:', error);
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
      console.error('Error loading available trainers:', error);
    }
  };

  // Assign trainers to COURSE (not session)
  const handleAssignTrainers = async (trainerIds: (number | string)[], permissions: TrainerPermissions) => {
    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
      }

      // Assign each selected trainer
      for (const trainerId of trainerIds) {
        // assignTrainer expects trainer_id as a string
        const assignmentData = { trainer_id: String(trainerId), permissions };
        await courseCreation.assignTrainer(formData.courseUuid!, assignmentData);
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
      await courseCreation.removeTrainer(formData.courseUuid!, String(trainerId));
      setSessionTrainers(sessionTrainers.filter(st => st.trainer_id !== trainerId));
      showSuccess('Formateur retiré');
    } catch (error: any) {
      console.error('Error removing trainer:', error);
      showError('Erreur', 'Impossible de retirer le formateur');
    }
  };

  const handleTrainerCreated = async () => {
    await loadAvailableTrainers();
    setShowCreateModal(false);
    setShowSelectionModal(true);
  };

  const handleEditPermissions = (sessionTrainer: SessionTrainer) => {
    setEditingTrainer(sessionTrainer);
    setEditingPermissions(sessionTrainer.permissions || {
      view_course: true,
      edit_content: false,
      manage_students: false,
      grade_assignments: false,
      view_analytics: false,
      manage_documents: false,
      manage_workflow: false,
      publish_content: false
    });
  };

  const handleSavePermissions = async () => {
    if (!editingTrainer || !editingPermissions || !formData.courseUuid) {
      return;
    }

    try {
      await courseCreation.updateTrainerPermissions(
        formData.courseUuid,
        String(editingTrainer.trainer_id),
        editingPermissions
      );
      showSuccess('Permissions mises à jour avec succès');
      await loadCourseTrainers();
      setEditingTrainer(null);
      setEditingPermissions(null);
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      showError('Erreur', error.response?.data?.message || 'Impossible de mettre à jour les permissions');
    }
  };

  const handlePermissionToggle = (key: keyof TrainerPermissions) => {
    if (!editingPermissions) return;
    const newPermissions = { ...editingPermissions, [key]: !editingPermissions[key] };
    setEditingPermissions(newPermissions);
  };

  // Empty state (before any trainers are assigned)
  if (sessionTrainers.length === 0 && !loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8 px-6">
        {/* Image without blur */}
        <div className="mb-6">
          <img 
            src="/assets/images/step5.png" 
            alt="Formateurs"
            className="max-w-full h-auto"
          />
        </div>
        
        {/* Text content */}
        <div className="text-center px-6 max-w-2xl mb-6">
          <p className={`text-lg mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Tous les formateurs de vos Parties-prenantes peuvent animer cette formation.
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Spécifiez Des Formateurs Ici Pour Restreindre L'animation Des Séances.
          </p>
        </div>
        
        {/* Button under the image and text */}
        <Button
          onClick={() => setShowSelectionModal(true)}
          style={{ backgroundColor: primaryColor }}
          className="gap-2 px-6 py-3 text-base"
        >
          <Users className="w-5 h-5" />
          Sélectionner Un Formateur
        </Button>

        {/* Modals */}
        <TrainerSelectionModal
          isOpen={showSelectionModal}
          onClose={() => setShowSelectionModal(false)}
          onSelect={handleAssignTrainers}
          availableTrainers={availableTrainers}
          onCreateNew={() => {
            setShowSelectionModal(false);
            setShowCreateModal(true);
          }}
        />

        <TrainerCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleTrainerCreated}
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
          {sessionTrainers.map(sessionTrainer => {
            if (!sessionTrainer?.trainer) return null;
            
            const trainer = sessionTrainer.trainer;
            
            return (
              <Card 
                key={sessionTrainer.id} 
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

                    {/* Actions */}
                    <div className="flex gap-2 w-full mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPermissions(sessionTrainer)}
                        className="flex-1"
                        style={{ color: primaryColor }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Permissions
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTrainer(sessionTrainer.trainer_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
        onCreateNew={() => {
          setShowSelectionModal(false);
          setShowCreateModal(true);
        }}
      />

      <TrainerCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleTrainerCreated}
      />

      {/* Edit Permissions Modal */}
      {editingTrainer && editingPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className={`w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Modifier les permissions
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {editingTrainer.trainer.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingTrainer(null);
                    setEditingPermissions(null);
                  }}
                  className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Permissions List */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-3">
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
                    className={`p-4 rounded-lg border-2 transition-all ${
                      editingPermissions[key]
                        ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                        : isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            editingPermissions[key]
                              ? 'bg-blue-500'
                              : isDark ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                          style={editingPermissions[key] ? { backgroundColor: primaryColor } : {}}
                        >
                          <Icon className={`w-5 h-5 ${
                            editingPermissions[key] ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {label}
                            </h3>
                            {editingPermissions[key] && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => key !== 'view_course' && handlePermissionToggle(key)}
                        disabled={key === 'view_course'}
                        className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                          key === 'view_course' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        } ${
                          editingPermissions[key]
                            ? 'bg-blue-500'
                            : isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                        style={editingPermissions[key] ? { backgroundColor: primaryColor } : {}}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            editingPermissions[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTrainer(null);
                  setEditingPermissions(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSavePermissions}
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

