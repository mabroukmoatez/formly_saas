import React, { useState, useEffect } from 'react';
import { X, Search, Clock, FileText, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { quizService } from '../../services/quiz';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface QuizSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuiz: (quizUuid: string, quizTitle: string) => void;
  courseUuid: string; // Can be course UUID or session UUID
  chapterUuid?: string;
  subChapterUuid?: string;
  isSession?: boolean; // Flag to indicate if this is for a session
}

export const QuizSelectionModal: React.FC<QuizSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectQuiz,
  courseUuid,
  chapterUuid,
  subChapterUuid,
  isSession = false
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [associating, setAssociating] = useState(false);

  const loadQuizzes = React.useCallback(async () => {
    console.log('🔍 Loading quizzes...');
    setLoading(true);
    try {
      // Load all quizzes (not just active ones) to include drafts and published quizzes
      const response = await quizService.getQuizzes();
      console.log('📚 Raw API response:', response);
      console.log('📚 Response.success:', response.success);
      console.log('📚 Response.data:', response.data);
      
      if (response.success) {
        // Handle pagination structure: { data: [...], total, per_page, etc }
        let quizzesArray = [];
        if (Array.isArray(response.data)) {
          // Direct array
          quizzesArray = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Paginated response
          quizzesArray = response.data.data;
        } else if (response.data?.quizzes && Array.isArray(response.data.quizzes)) {
          // Alternative structure
          quizzesArray = response.data.quizzes;
        }
        
        console.log('📚 Extracted quizzes:', quizzesArray);
        console.log('📚 Number of quizzes:', quizzesArray.length);
        setQuizzes(quizzesArray);
      } else {
        console.warn('⚠️ Response success is false');
        setQuizzes([]);
      }
    } catch (err) {
      console.error('❌ Error loading quizzes:', err);
      showError(t('common.error'), 'Impossible de charger les quiz');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    console.log('🎯 QuizSelectionModal useEffect triggered. isOpen:', isOpen);
    if (isOpen) {
      // Reset state when modal opens
      setSearchQuery('');
      setSelectedQuiz(null);
      loadQuizzes();
    }
  }, [isOpen, loadQuizzes]);

  const handleAssociateQuiz = async () => {
    if (!selectedQuiz) return;
    
    setAssociating(true);
    try {
      // Backend always expects course_uuid, even for sessions
      // For sessions, use the session UUID as course_uuid
      const associationData: any = {
        course_uuid: courseUuid
      };
      
      // Always include chapter_uuid if available (even when we have sub_chapter_uuid)
      if (chapterUuid) {
        associationData.chapter_uuid = chapterUuid;
      }
      
      // Include sub_chapter_uuid if available
      if (subChapterUuid) {
        associationData.sub_chapter_uuid = subChapterUuid;
      }
      
      // Validate that we have at least course_uuid and chapter_uuid
      if (!associationData.course_uuid) {
        throw new Error('Course UUID is required');
      }
      if (!associationData.chapter_uuid && !associationData.sub_chapter_uuid) {
        throw new Error('Chapter UUID or Sub-chapter UUID is required');
      }
      
      console.log('🔗 Associating quiz to chapter:', associationData);
      
      const response = await quizService.associateQuiz(selectedQuiz.uuid, associationData);
      
      if (response.success) {
        success('Quiz associé avec succès');
        onSelectQuiz(selectedQuiz.uuid, selectedQuiz.title);
        onClose();
      }
    } catch (err) {
      console.error('Error associating quiz:', err);
      showError(t('common.error'), 'Impossible d\'associer le quiz');
    } finally {
      setAssociating(false);
    }
  };

  const filteredQuizzes = searchQuery
    ? quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : quizzes;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-3xl rounded-[20px] shadow-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}
      >
        <div className="p-8 relative max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-2xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Sélectionner un Quiz
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Choisissez un quiz à associer {subChapterUuid ? 'au sous-chapitre' : chapterUuid ? 'au chapitre' : 'à la formation'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher un quiz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredQuizzes.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: primaryColor }} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchQuery ? 'Aucun quiz trouvé' : 'Aucun quiz disponible'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery ? 'Essayez un autre terme' : 'Créez d\'abord un quiz'}
              </p>
            </div>
          )}

          {/* Quiz List */}
          {!loading && filteredQuizzes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {filteredQuizzes.map((quiz: any) => (
                <button
                  key={quiz.uuid}
                  onClick={() => setSelectedQuiz(quiz)}
                  className={`text-left p-4 rounded-[13px] border-2 transition-all ${
                    selectedQuiz?.uuid === quiz.uuid
                      ? 'border-blue-500 bg-blue-50'
                      : isDark 
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-750' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 overflow-hidden rounded-[10px] bg-gradient-to-br from-blue-400 to-purple-600 mb-3">
                    {quiz.thumbnail ? (
                      <img 
                        src={quiz.thumbnail.startsWith('http') ? quiz.thumbnail : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/${quiz.thumbnail}`}
                        alt={quiz.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    {selectedQuiz?.uuid === quiz.uuid && (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Quiz Info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-base ${
                        selectedQuiz?.uuid === quiz.uuid ? 'text-blue-700' : isDark ? 'text-white' : 'text-[#19294a]'
                      }`}>
                        {quiz.title}
                      </h4>
                      <Badge 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: quiz.status === 'active' ? '#ecfdf5' : 
                                         quiz.status === 'draft' ? '#fef3c7' : '#f3f4f6',
                          color: quiz.status === 'active' ? '#065f46' :
                                 quiz.status === 'draft' ? '#92400e' : '#374151'
                        }}
                      >
                        {quiz.status === 'active' ? '✓ Actif' : 
                         quiz.status === 'draft' ? '📝 Brouillon' : 
                         quiz.status === 'inactive' ? '⏸ Inactif' : 
                         '📦 Archivé'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.duration || 0} min
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {quiz.total_questions || 0} questions
                      </span>
                    </div>

                    {quiz.categories && quiz.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {quiz.categories.slice(0, 2).map((cat: any) => (
                          <Badge 
                            key={cat.id}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: cat.color ? `${cat.color}20` : '#3b82f620',
                              color: cat.color || '#3b82f6'
                            }}
                          >
                            {cat.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-2"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAssociateQuiz}
              disabled={!selectedQuiz || associating}
              className="px-6 py-2 text-white"
              style={{ backgroundColor: primaryColor, opacity: !selectedQuiz || associating ? 0.5 : 1 }}
            >
              {associating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Association...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Associer ce Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

