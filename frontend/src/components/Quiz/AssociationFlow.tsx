import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { quizService } from '../../services/quiz';
import { courseCreation } from '../../services/courseCreation';
import { X, Check, Search, ChevronDown, Loader2, BookOpen } from 'lucide-react';

interface AssociationFlowProps {
  quizUuid: string;
  onClose: () => void;
}

export const AssociationFlow: React.FC<AssociationFlowProps> = ({ quizUuid, onClose }) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (step === 2) {
      loadCourses();
    }
  }, [step]);

  useEffect(() => {
    if (step === 3 && selectedCourse) {
      loadChaptersAndSections();
    }
  }, [step, selectedCourse]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await courseCreation.getCourses();
      console.log('📚 Courses loaded:', response);
      
      if (response.success) {
        // Handle nested paginated response structure
        // Backend returns: { courses: { data: [...] }, stats: {...}, organization: {...} }
        let coursesArray = [];
        
        if (response.data?.courses?.data) {
          // Structure: response.data.courses.data
          coursesArray = response.data.courses.data;
        } else if (response.data?.data) {
          // Structure: response.data.data
          coursesArray = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Structure: response.data (direct array)
          coursesArray = response.data;
        }
        
        console.log('📚 Extracted courses array:', coursesArray);
        console.log('📚 Number of courses:', coursesArray.length);
        setCourses(coursesArray);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      showError(t('common.error'), 'Impossible de charger les formations');
    } finally {
      setLoading(false);
    }
  };

  const loadChaptersAndSections = async () => {
    setLoading(true);
    try {
      // Load sections
      const sectionsResponse = await courseCreation.getSections(selectedCourse.uuid);
      console.log('📂 Sections loaded:', sectionsResponse);
      if (sectionsResponse.success && sectionsResponse.data) {
        setSections(sectionsResponse.data);
      }

      // Load chapters
      const chaptersResponse = await courseCreation.getChapters(selectedCourse.uuid);
      console.log('📖 Chapters loaded:', chaptersResponse);
      if (chaptersResponse.success && chaptersResponse.data) {
        setChapters(chaptersResponse.data);
      }
    } catch (err) {
      console.error('Error loading chapters/sections:', err);
      showError(t('common.error'), 'Impossible de charger les chapitres');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async () => {
    try {
      const associationData = {
        course_uuid: selectedCourse.uuid,
        chapter_uuid: selectedChapter?.uuid
      };
      
      console.log('🔗 Associating quiz with:', associationData);
      console.log('📚 Selected course:', selectedCourse.title, selectedCourse.uuid);
      console.log('📖 Selected chapter:', selectedChapter ? selectedChapter.title : 'AUCUN', selectedChapter?.uuid);
      
      const response = await quizService.associateQuiz(quizUuid, associationData);
      console.log('✅ Association response:', response);
      
      if (response.success) {
        success(t('quiz.association.success'));
        setStep(5); // Confirmation
      }
    } catch (err) {
      console.error('❌ Error associating quiz:', err);
      showError(t('common.error'), t('quiz.association.error'));
    }
  };

  const filteredCourses = searchQuery
    ? courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : courses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-[20px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl`}>
        <div className="p-8 relative">
          <button 
            onClick={onClose} 
            className={`absolute top-6 right-6 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <X className="w-6 h-6" />
          </button>

          {step === 1 && (
            <div className="text-center py-8">
              <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-2xl mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Voulez-Vous Associer Ce Quiz À Une<br />Formation Existante ?
              </h2>
              <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Vous venez de créer un quiz.<br />
                Souhaitez-vous l'associer immédiatement à une<br />
                formation existante ou le faire plus tard ?
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 rounded-[10px] text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Associer À Une Formation
                </Button>
                <Button
                  onClick={onClose}
                  className="px-8 py-3 rounded-[10px] font-medium border-2"
                  style={{ borderColor: '#ff6b35', color: '#ff6b35' }}
                  variant="outline"
                >
                  Plus Tard
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-xl mb-6 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Sélectionner Une Formation
              </h2>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Recherche"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Trier par:</span>
                <button className="flex items-center gap-2 text-sm text-gray-600">
                  Date De Création
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchQuery ? 'Aucune formation trouvée' : 'Aucune formation disponible'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery ? 'Essayez un autre terme de recherche' : 'Créez d\'abord une formation'}
                  </p>
                </div>
              )}

              {/* Courses List */}
              {!loading && filteredCourses.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCourses.map((course: any) => (
                    <button
                      key={course.uuid}
                      onClick={() => {
                        setSelectedCourse(course);
                        setStep(3);
                      }}
                      className={`w-full p-4 rounded-[13px] border-2 text-left transition-all hover:shadow-md ${
                        isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-750' : 'border-gray-200 hover:border-blue-500 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {course.image_url ? (
                          <img src={course.image_url} className="w-16 h-16 rounded-lg object-cover" alt="" />
                        ) : (
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                            {course.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className="bg-blue-100 text-blue-600 text-xs">
                              ● {course.status === 1 ? 'Publiée' : 'Brouillon'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(course.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Chapitres : {course.total_chapters || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-[10px]"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && selectedCourse && (
            <div>
              <button
                onClick={() => setStep(2)}
                className={`text-sm mb-4 flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ← Retour aux formations
              </button>

              <div className="flex items-center gap-3 mb-6">
                {selectedCourse.image_url ? (
                  <img src={selectedCourse.image_url} className="w-16 h-16 rounded-lg object-cover" alt="" />
                ) : (
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-lg ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {selectedCourse.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    ● {selectedCourse.status === 1 ? 'Publiée' : 'Brouillon'} | {new Date(selectedCourse.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-base mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Sélectionner un Chapitre
              </h3>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                </div>
              )}

              {!loading && sections.length === 0 && chapters.length === 0 && (
                <div className="text-center py-12">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cette formation n'a pas encore de chapitres
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoutez des chapitres à la formation d'abord
                  </p>
                </div>
              )}

              {!loading && (sections.length > 0 || chapters.length > 0) && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Sections with their chapters */}
                  {sections.map((section: any, sectionIdx: number) => {
                    const sectionChapters = chapters.filter((ch: any) => 
                      ch.course_section_id === section.id || ch.section_id === section.id
                    );

                    return (
                      <div key={section.id} className={`rounded-[13px] border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: primaryColor }}>
                            {sectionIdx + 1}
                          </div>
                          <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                            {section.title}
                          </h4>
                          <Badge className="text-xs bg-gray-200 text-gray-700">
                            {sectionChapters.length} chapitre(s)
                          </Badge>
                        </div>

                        {sectionChapters.length > 0 && (
                          <div className="space-y-2 ml-10">
                            {sectionChapters.map((chapter: any, chapterIdx: number) => (
                              <div
                                key={chapter.uuid}
                                className={`p-3 rounded-lg border transition-all ${
                                  selectedChapter?.uuid === chapter.uuid
                                    ? 'border-blue-500 bg-blue-50'
                                    : isDark ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm ${selectedChapter?.uuid === chapter.uuid ? 'text-blue-700 font-medium' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {chapterIdx + 1}. {chapter.title}
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedChapter(chapter)}
                                    className={`rounded-full px-4 py-1 text-xs ${
                                      selectedChapter?.uuid === chapter.uuid
                                        ? 'text-white'
                                        : ''
                                    }`}
                                    style={selectedChapter?.uuid === chapter.uuid ? { backgroundColor: primaryColor } : {}}
                                  >
                                    {selectedChapter?.uuid === chapter.uuid ? (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Sélectionné
                                      </>
                                    ) : (
                                      'Sélectionner'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Chapters without section */}
                  {chapters.filter((ch: any) => !ch.course_section_id && !ch.section_id).length > 0 && (
                    <div className={`rounded-[13px] border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-4`}>
                      <h4 className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        📄 Chapitres sans section
                      </h4>
                      <div className="space-y-2">
                        {chapters.filter((ch: any) => !ch.course_section_id && !ch.section_id).map((chapter: any, idx: number) => (
                          <div
                            key={chapter.uuid}
                            className={`p-3 rounded-lg border transition-all ${
                              selectedChapter?.uuid === chapter.uuid
                                ? 'border-blue-500 bg-blue-50'
                                : isDark ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className={`text-sm ${selectedChapter?.uuid === chapter.uuid ? 'text-blue-700 font-medium' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {idx + 1}. {chapter.title}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => setSelectedChapter(chapter)}
                                className={`rounded-full px-4 py-1 text-xs ${
                                  selectedChapter?.uuid === chapter.uuid
                                    ? 'text-white'
                                    : ''
                                }`}
                                style={selectedChapter?.uuid === chapter.uuid ? { backgroundColor: primaryColor } : {}}
                              >
                                {selectedChapter?.uuid === chapter.uuid ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Sélectionné
                                  </>
                                ) : (
                                  'Sélectionner'
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(2);
                    setSelectedChapter(null);
                  }}
                  className="px-6 py-3 rounded-[10px]"
                >
                  ← Retour
                </Button>
                <Button
                  onClick={handleAssociate}
                  disabled={!selectedChapter}
                  className="px-8 py-3 rounded-[10px] text-white font-medium"
                  style={{ backgroundColor: primaryColor, opacity: !selectedChapter ? 0.5 : 1 }}
                >
                  Valider l'Association →
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${primaryColor}20` }}>
                <Check className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-2xl mb-3 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Association Réussie !
              </h2>
              <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Vous pouvez modifier ce lien à tout moment.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {/* View course */}}
                  className="px-6 py-3 rounded-[10px]"
                >
                  Voir La Formation
                </Button>
                <Button
                  onClick={onClose}
                  className="px-6 py-3 rounded-[10px] text-white font-medium"
                  style={{ backgroundColor: '#ff6b35' }}
                >
                  Créer Un Nouveau Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
