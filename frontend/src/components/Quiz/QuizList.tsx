import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useToast } from '../ui/toast';
import { quizService, Quiz } from '../../services/quiz';
import { ConfirmationModal } from '../ui/confirmation-modal';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
  FileText,
  Clock,
  ChevronDown,
  Calendar
} from 'lucide-react';

export const QuizList: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error: showError } = useToast();
  
  const primaryColor = organization?.primary_color || '#007aff';
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; quizUuid: string; title: string }>({
    isOpen: false,
    quizUuid: '',
    title: ''
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadQuizzes();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedStatus]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false);
      setShowCategoryDropdown(false);
    };
    
    if (showStatusDropdown || showCategoryDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showStatusDropdown, showCategoryDropdown]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await quizService.getQuizzes(params);
      if (response.success && response.data?.data) {
        setQuizzes(response.data.data);
      }
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger les quiz');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes;

  const handleDeleteQuiz = async (quizUuid: string) => {
    try {
      await quizService.deleteQuiz(quizUuid);
      success('Quiz supprimé avec succès');
      loadQuizzes();
      setConfirmDelete({ isOpen: false, quizUuid: '', title: '' });
    } catch (err: any) {
      showError('Erreur', 'Impossible de supprimer le quiz');
    }
  };

  return (
    <div className="px-[27px] py-8">
      {/* Header - Design Pattern Mes Factures */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <FileText className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Gestion des Quiz
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Créez et gérez vos quiz d'évaluation
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => navigateToRoute('/quiz/create')}
          style={{ backgroundColor: primaryColor }}
          className="gap-2 px-6 py-3 rounded-[10px]"
        >
          <Plus className="w-4 h-4" />
          <span className="[font-family:'Poppins',Helvetica] font-medium">Créer Un Nouveau Quiz</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <Input
            placeholder="Recherche Une Formation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#ecf1fd]'}`}
          />
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatusDropdown(!showStatusDropdown); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
          >
            <span>{selectedStatus === 'all' ? 'Tous les statuts' : selectedStatus === 'draft' ? 'Brouillon' : selectedStatus === 'active' ? 'Actif' : 'Inactif'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showStatusDropdown && (
            <div className={`absolute top-full mt-2 w-48 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-50`}
                 onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setSelectedStatus('all'); setShowStatusDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''} first:rounded-t-lg`}
              >
                Tous les statuts
              </button>
              <button
                onClick={() => { setSelectedStatus('draft'); setShowStatusDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''}`}
              >
                Brouillon
              </button>
              <button
                onClick={() => { setSelectedStatus('active'); setShowStatusDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''}`}
              >
                Actif
              </button>
              <button
                onClick={() => { setSelectedStatus('inactive'); setShowStatusDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''} last:rounded-b-lg`}
              >
                Inactif
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? isDark ? 'bg-gray-700' : 'bg-gray-200' : ''}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? isDark ? 'bg-gray-700' : 'bg-gray-200' : ''}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" 
               style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Aucun quiz
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Commencez par créer votre premier quiz
            </p>
            <Button onClick={() => navigateToRoute('/quiz/create')} style={{ backgroundColor: primaryColor }}>
              <Plus className="w-4 h-4 mr-2" />
              Créer Un Quiz
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <Card key={quiz.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} hover:shadow-[0px_4px_20px_5px_#09294c12] transition-all group rounded-[18px]`}>
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden rounded-t-[18px] bg-gradient-to-br from-blue-400 to-purple-600">
                  {quiz.thumbnail ? (
                    <img 
                      src={quiz.thumbnail.startsWith('http') ? quiz.thumbnail : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/${quiz.thumbnail}`} 
                      alt={quiz.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <Badge 
                    className={`absolute top-3 right-3 ${
                      quiz.status === 'active' ? 'bg-green-500' :
                      quiz.status === 'draft' ? 'bg-orange-500' : 'bg-gray-500'
                    } text-white rounded-full px-3 py-1`}
                  >
                    {quiz.status === 'active' ? '● Publié' : 
                     quiz.status === 'draft' ? '● Brouillon' : '● Inactif'}
                  </Badge>
                </div>
                
                <div className="p-5">
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {quiz.title}
                  </h3>
                  
                  {quiz.categories && quiz.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {quiz.categories.slice(0, 2).map(cat => (
                        <Badge 
                          key={cat.id}
                          className="text-xs rounded-[30px] px-3 py-0.5"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.icon} {cat.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-4 text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center gap-1">
                      <span>Modifié il y a 2 h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {quiz.duration || 0} min
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {quiz.total_questions} questions
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigateToRoute(`/quiz/${quiz.uuid}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigateToRoute(`/quiz/edit/${quiz.uuid}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete({ isOpen: true, quizUuid: quiz.uuid, title: quiz.title })}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => (
            <Card key={quiz.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} hover:shadow-md transition-all rounded-[18px]`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-[10px] overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600 flex-shrink-0">
                    {quiz.thumbnail ? (
                      <img 
                        src={quiz.thumbnail.startsWith('http') ? quiz.thumbnail : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/${quiz.thumbnail}`} 
                        alt={quiz.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        {quiz.title}
                      </h3>
                      <Badge 
                        className={`${
                          quiz.status === 'active' ? 'bg-green-500' :
                          quiz.status === 'draft' ? 'bg-orange-500' : 'bg-gray-500'
                        } text-white rounded-full px-2 py-0.5 text-xs`}
                      >
                        ●
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{quiz.duration || 0} min</span>
                      <span>•</span>
                      <span>{quiz.total_questions} questions</span>
                      <span>•</span>
                      <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateToRoute(`/quiz/${quiz.uuid}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateToRoute(`/quiz/edit/${quiz.uuid}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete({ isOpen: true, quizUuid: quiz.uuid, title: quiz.title })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, quizUuid: '', title: '' })}
        onConfirm={() => handleDeleteQuiz(confirmDelete.quizUuid)}
        title="Supprimer le quiz"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};
