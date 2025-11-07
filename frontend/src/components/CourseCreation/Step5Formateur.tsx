import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { courseCreation } from '../../services/courseCreation';
import { 
  User, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  Users,
  Check,
  Edit3
} from 'lucide-react';

interface Trainer {
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  experience_years: number;
  description: string | null;
  competencies: string[];
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TrainerDetail {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  competencies: string[];
  canModify: boolean;
}

// Interface for course trainers that includes trainer details directly
interface CourseTrainerWithDetails {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  experience_years: number;
  description: string | null;
  competencies: string[];
  avatar_url: string | null;
  is_active: boolean;
  permissions: {
    can_modify_course: boolean;
    can_view_analytics: boolean;
    can_manage_students: boolean;
  };
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export const Step5Formateur: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  // Use CourseCreationContext
  const {
    trainers: availableTrainers,
    courseTrainers: selectedTrainers,
    loadTrainers,
    loadCourseTrainers,
    assignTrainer,
    updateTrainerPermissions,
    removeTrainer,
    createTrainer,
    updateTrainer,
    isLoading
  } = useCourseCreation();

  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showTrainerDetail, setShowTrainerDetail] = useState(false);
  const [showCreateTrainerModal, setShowCreateTrainerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Load trainers on component mount
  useEffect(() => {
    loadTrainers();
    loadCourseTrainers().catch(() => {
      // Don't show error to user as this might be expected for new courses
    });
  }, [loadTrainers, loadCourseTrainers]);

  const [trainerDetail, setTrainerDetail] = useState<TrainerDetail>({
    id: '',
    name: '',
    description: '',
    competencies: [],
    canModify: true
  });

  const handleSelectTrainer = async (trainer: Trainer) => {
    try {
      
      if (selectedTrainers.find(t => t.uuid === trainer.uuid)) {
        // Use the trainer UUID directly instead of converting to number
        const removed = await removeTrainer(trainer.uuid);
        if (removed) {
          success(t('courseSteps.step5.messages.trainerRemoved') || 'Formateur retiré avec succès');
          // Reload course trainers to update the UI
          await loadCourseTrainers();
        }
      } else {
        const assigned = await assignTrainer({
          trainer_id: trainer.uuid,
          permissions: {
            can_modify_course: true,
            can_manage_students: false,
            can_view_analytics: true
          }
        });
        if (assigned) {
          success(t('courseSteps.step5.messages.trainerAssigned') || 'Formateur assigné avec succès');
          // Reload course trainers to update the UI
          await loadCourseTrainers();
        } else {
          // Handle the case where trainer is already assigned
          error('Ce formateur est déjà assigné à ce cours');
        }
      }
    } catch (error: any) {
      // Check if it's the "already assigned" error
      if (error?.response?.data?.message?.includes('already assigned')) {
        error('Ce formateur est déjà assigné à ce cours');
      } else {
        error(t('courseSteps.step5.messages.trainerAssignError') || 'Erreur lors de l\'assignation du formateur');
      }
    }
  };

  const handleRemoveTrainer = async (uuid: string) => {
    try {
      // Use the trainer UUID directly instead of converting to number
      const removed = await removeTrainer(uuid);
      if (removed) {
        success(t('courseSteps.step5.messages.trainerRemoved') || 'Formateur retiré avec succès');
        // Reload course trainers to update the UI
        await loadCourseTrainers();
      }
    } catch (error) {
      error(t('courseSteps.step5.messages.trainerRemoveError') || 'Erreur lors de la suppression du formateur');
    }
  };

  const handleSelectAll = async () => {
    try {
      if (selectAll) {
        // Remove all selected trainers
        for (const trainer of selectedTrainers) {
          // Use trainer UUID directly
          await removeTrainer(trainer.trainer_id);
        }
        setSelectAll(false);
        // Reload course trainers to update the UI
        await loadCourseTrainers();
      } else {
        // Add all available trainers
        for (const trainer of filteredTrainers) {
          if (!selectedTrainers.find(t => t.trainer_id === trainer.uuid)) {
            const assigned = await assignTrainer({
              trainer_id: trainer.uuid,
              permissions: {
                can_modify_course: true,
                can_manage_students: false,
                can_view_analytics: true
              }
            });
          }
        }
        setSelectAll(true);
        // Reload course trainers to update the UI
        await loadCourseTrainers();
      }
    } catch (error) {
      error('Erreur lors de la sélection des formateurs');
    }
  };

  const handleOpenTrainerDetail = (trainer: Trainer) => {
    setTrainerDetail({
      id: trainer.uuid,
      name: trainer.name,
      avatar: trainer.avatar_url,
      description: trainer.description || '',
      competencies: trainer.competencies,
      canModify: true
    });
    setShowTrainerDetail(true);
  };

  const handleSaveTrainerDetail = () => {
    setShowTrainerDetail(false);
  };

  const handleConfirmSelection = () => {
    setShowTrainerModal(false);
  };

  const handleCreateTrainer = () => {
    setShowCreateTrainerModal(true);
    setShowTrainerModal(false);
  };

  const handleCreateNewTrainer = async (trainerData: any) => {
    try {
      const newTrainer = await createTrainer({
        name: trainerData.name,
        email: trainerData.email,
        phone: trainerData.phone || null,
        specialization: trainerData.specialization || '',
        experience_years: trainerData.experience_years || 1,
        description: trainerData.description || '',
        competencies: trainerData.competencies || [],
        avatar: trainerData.avatar
      });
      
      if (newTrainer) {
        success('Formateur créé avec succès');
        setShowCreateTrainerModal(false);
        // Reload trainers to include the new one
        await loadTrainers();
        await loadCourseTrainers();
      } else {
        error('Erreur lors de la création du formateur');
      }
    } catch (error) {
      error('Erreur lors de la création du formateur');
    }
  };

  const [searchResults, setSearchResults] = useState<Trainer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search trainers using API
  const searchTrainers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const result = await courseCreation.searchTrainers(query);
      if (result.success) {
        // Handle paginated response
        const trainers = result.data.data || result.data;
        setSearchResults(trainers);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Use search results if there's a search query, otherwise use all trainers
  const filteredTrainers = searchQuery.trim() 
    ? searchResults 
    : availableTrainers.filter(trainer =>
        trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trainer.specialization && trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase())) ||
        trainer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Trigger search when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTrainers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchTrainers]);

  const isTrainerSelected = (uuid: string) => selectedTrainers.some(t => t.uuid === uuid);

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        {/* Main Content */}
        {selectedTrainers.length === 0 ? (
          /* Empty State */
          <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
          }`}>
            <CardContent className="p-16 text-center">
              <div className="relative w-[190px] h-[190px] mx-auto mb-8">
                {/* Avatar Cluster */}
                <div className="absolute top-0 left-0 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#4a90e2] to-[#6a5acd] shadow-md"></div>
                <div className="absolute top-[20px] right-0 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#50e3c2] to-[#00c6ff] shadow-md"></div>
                <div className="absolute bottom-0 left-[30px] w-[45px] h-[45px] rounded-full bg-gradient-to-br from-[#f5a623] to-[#f8e71c] shadow-md"></div>
                <div className="absolute bottom-[20px] right-[20px] w-[70px] h-[70px] rounded-full bg-gradient-to-br from-[#bd10e0] to-[#e010bd] shadow-md"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-lg">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
              </div>

              <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[20px] mb-3 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                {t('courseSteps.step5.emptyState.title')}
              </h2>
              <p className={`[font-family:'Inter',Helvetica] text-[15px] mb-8 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-[#667085]'}`}>
                {t('courseSteps.step5.emptyState.description')}
              </p>

              <Button
                onClick={() => setShowTrainerModal(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-lg text-white text-[16px] font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                <User className="w-6 h-6" />
                {t('courseSteps.step5.emptyState.selectTrainer')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Selected Trainers Grid */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                {t('courseSteps.step5.selectedTrainers.title')} ({selectedTrainers.length})
              </h2>
              <Button
                onClick={() => setShowTrainerModal(true)}
                variant="outline"
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-[15px] font-medium ${
                  isDark ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-5 h-5" />
                {t('courseSteps.step5.selectedTrainers.addTrainer')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedTrainers.map((courseTrainer) => {
                // Debug the courseTrainer structure
                
                // Cast to the correct interface since API returns trainer details directly
                const trainer = courseTrainer as CourseTrainerWithDetails;
                
                
                if (!trainer || !trainer.name) {
                  return null; // Skip if trainer data is incomplete
                }
                
                return (
                  <Card key={courseTrainer.uuid} className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
                    isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
                  }`}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-[#4a90e2] to-[#6a5acd] mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {trainer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>

                      <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        {trainer.name}
                      </h3>

                      <p className={`[font-family:'Inter',Helvetica] text-[14px] mb-3 ${isDark ? 'text-gray-400' : 'text-[#667085]'}`}>
                        {trainer.specialization || trainer.email}
                      </p>

                      <Badge className={`mb-4 px-3 py-1 rounded-full text-xs font-medium ${
                        trainer.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        <User className="w-3 h-3 mr-1" />
                        {trainer.is_active ? 'Actif' : 'Inactif'}
                      </Badge>

                      <div className="flex gap-2 mt-auto w-full">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenTrainerDetail(trainer)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium ${
                            isDark ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                          {t('courseSteps.step5.actions.modify')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRemoveTrainer(trainer.uuid)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium text-red-600 border-red-300 hover:bg-red-50 ${
                            isDark ? 'dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20' : ''
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('courseSteps.step5.selectedTrainers.remove')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Debug: Show message if no trainers are displayed */}
              {selectedTrainers.length > 0 && selectedTrainers.every(ct => !(ct as CourseTrainerWithDetails).name) && (
                <div className="col-span-full text-center py-8">
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    ⚠️ {selectedTrainers.length} trainer(s) selected but details not found. Check console for details.
                  </p>
                </div>
              )}

              {/* Add Trainer Card - Always show to allow adding more trainers */}
              <Card
                className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] border-2 border-dashed ${
                  isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                } hover:border-gray-400 transition-colors cursor-pointer`}
                onClick={() => setShowTrainerModal(true)}
              >
                <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[16px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {t('courseSteps.step5.selectedTrainers.addTrainer')}
                  </h3>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Trainer Selection Modal */}
        {showTrainerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-4">
                  {/* Top row with search and close button */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder={t('courseSteps.step5.modal.search')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`pl-10 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200'}`}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTrainerModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Bottom row with action buttons */}
                  <div className="flex gap-3 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={handleCreateTrainer}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        isDark ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      {t('courseSteps.step5.modal.createNew')}
                    </Button>
                    <Button
                      onClick={handleConfirmSelection}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Check className="w-4 h-4" />
                      {t('courseSteps.step5.modal.chooseTrainer')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Select All */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-blue-500' : 'text-blue-600 border-gray-300'}`}
                    style={{ accentColor: primaryColor }}
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('courseSteps.step5.modal.selectAll')}
                  </span>
                </div>

                {/* Trainers Grid */}
                {isSearching ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Recherche en cours...
                      </p>
                    </div>
                  </div>
                ) : filteredTrainers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {searchQuery.trim() ? 'Aucun formateur trouvé pour cette recherche' : 'Aucun formateur disponible'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTrainers.map((trainer) => {
                      const isSelected = isTrainerSelected(trainer.uuid);

                      return (
                        <Card
                          key={trainer.uuid}
                          className={`rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? `border-2`
                              : isDark
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          style={isSelected ? { borderColor: primaryColor } : {}}
                          onClick={() => handleSelectTrainer(trainer)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4a90e2] to-[#6a5acd] flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold">
                                  {trainer.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>

                              <div className="flex-1">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {trainer.name}
                                </h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {trainer.specialization || trainer.email}
                                </p>
                                <Badge className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  trainer.is_active
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  <User className="w-3 h-3 mr-1" />
                                  {trainer.is_active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>

                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectTrainer(trainer)}
                                  className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-blue-500' : 'text-blue-600 border-gray-300'}`}
                                  style={{ accentColor: primaryColor }}
                                  onClick={(e) => e.stopPropagation()}
                                />
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
        )}

        {/* Trainer Detail Modal */}
        {showTrainerDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-lg rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('courseSteps.step5.detail.title')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTrainerDetail(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4a90e2] to-[#6a5acd] flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {trainerDetail.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {trainerDetail.name}
                      </h4>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-600 hover:text-blue-700"
                        style={{ color: primaryColor }}
                      >
                        {t('courseSteps.step5.detail.change')}
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('courseSteps.step5.detail.description')}
                    </label>
                    <RichTextEditor
                      content={trainerDetail.description}
                      onChange={(content) => setTrainerDetail({...trainerDetail, description: content})}
                      placeholder="Résumez l'expérience, les compétences clés..."
                    />
                  </div>

                  {/* Competencies */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('courseSteps.step5.detail.competencies')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {trainerDetail.competencies.slice(0, 3).map((comp, idx) => (
                        <Badge key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          {comp}
                        </Badge>
                      ))}
                      {trainerDetail.competencies.length > 3 && (
                        <Badge className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          +{trainerDetail.competencies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('courseSteps.step5.detail.permissions')}
                    </label>
                    <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('courseSteps.step5.detail.modifyTraining')}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trainerDetail.canModify}
                          onChange={(e) => setTrainerDetail({...trainerDetail, canModify: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
                          style={trainerDetail.canModify ? { backgroundColor: primaryColor } : {}}
                        ></div>
                      </label>
                    </div>
                  </div>

                  {/* Validate Button */}
                  <Button
                    onClick={handleSaveTrainerDetail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="w-4 h-4" />
                    {t('courseSteps.step5.detail.validate')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Trainer Modal */}
        {showCreateTrainerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-lg rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Créer Un Nouveau Formateur
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreateTrainerModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom complet *
                    </label>
                    <Input
                      placeholder="Nom du formateur"
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Spécialisation
                    </label>
                    <Input
                      placeholder="Domaine d'expertise"
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Années d'expérience
                    </label>
                    <Input
                      type="number"
                      placeholder="5"
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateTrainerModal(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => handleCreateNewTrainer({
                        name: 'Nouveau Formateur',
                        email: 'formateur@example.com',
                        specialization: 'Formation',
                        experience_years: 1,
                        competencies: []
                      })}
                      className="flex-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Créer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
