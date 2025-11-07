import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  FileText, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  Info, 
  Users,
  Settings,
  Save,
  Plus,
  Check,
  User,
  TrendingUp
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { quizService, Quiz } from '../../services/quiz';
import { ConfirmationModal } from '../ui/confirmation-modal';
import { QuestionEditor } from './QuestionEditor';
import { AssociationFlow } from './AssociationFlow';

interface QuizViewProps {
  quizUuid?: string;
  editMode?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: (data: any) => Promise<void>;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizUuid: propQuizUuid,
  editMode = false,
  onClose,
  onEdit,
  onDelete,
  onSave
}) => {
  const { quizUuid: paramQuizUuid } = useParams<{ quizUuid: string }>();
  const quizUuid = propQuizUuid || paramQuizUuid;
  
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const { navigateToRoute } = useSubdomainNavigation();

  // Organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'informations' | 'questions' | 'associations' | 'statistiques'>('informations');
  const [saving, setSaving] = useState(false);
  const [associations, setAssociations] = useState<any[]>([]);
  
  // Editable states
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableDuration, setEditableDuration] = useState(0);
  const [editableIsShuffle, setEditableIsShuffle] = useState(false);
  const [editableIsRemake, setEditableIsRemake] = useState(false);
  const [editableShowAnswerDuring, setEditableShowAnswerDuring] = useState(false);
  const [editableShowAnswerAfter, setEditableShowAnswerAfter] = useState(true);
  
  // Modal states
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [showAssociationFlow, setShowAssociationFlow] = useState(false);
  
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Load quiz data
  useEffect(() => {
    console.log('🎯 QuizView mounted with editMode:', editMode, 'quizUuid:', quizUuid);
    
    const loadQuizData = async () => {
      try {
        setLoading(true);
        const response = await quizService.getQuiz(quizUuid!);
        console.log('📊 Quiz data loaded:', response.data);
        
        if (response.success && response.data) {
          setQuiz(response.data);
          
          // Load associations if available
          if (response.data.course_assignments) {
            console.log('🔗 Associations found:', response.data.course_assignments);
            setAssociations(response.data.course_assignments);
          }
          
          // Initialize editable states
          setEditableTitle(response.data.title);
          setEditableDescription(response.data.description || '');
          setEditableDuration(response.data.duration || 0);
          setEditableIsShuffle(response.data.is_shuffle);
          setEditableIsRemake(response.data.is_remake);
          setEditableShowAnswerDuring(response.data.show_answer_during || false);
          setEditableShowAnswerAfter(response.data.show_answer_after);
          
          console.log('✅ Editable states initialized:', {
            title: response.data.title,
            duration: response.data.duration,
            is_shuffle: response.data.is_shuffle,
            is_remake: response.data.is_remake,
            show_answer_during: response.data.show_answer_during,
            show_answer_after: response.data.show_answer_after
          });
        } else {
          error('Impossible de charger le quiz');
        }
      } catch (err: any) {
        console.error('Failed to load quiz:', err);
        error('Erreur lors du chargement du quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizUuid) {
      loadQuizData();
    }
  }, [quizUuid, editMode]);

  const handleSaveEdits = async () => {
    if (!onSave || !quiz) return;
    
    setSaving(true);
    try {
      const updatedData = {
        title: editableTitle,
        description: editableDescription,
        duration: editableDuration,
        is_shuffle: editableIsShuffle,
        is_remake: editableIsRemake,
        show_answer_during: editableShowAnswerDuring,
        show_answer_after: editableShowAnswerAfter,
      };
      
      console.log('💾 Saving quiz with data:', updatedData);
      await onSave(updatedData);
      console.log('✅ Quiz saved successfully');
    } catch (err: any) {
      console.error('❌ Error saving quiz:', err);
      error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirmation(
      'Supprimer le quiz',
      'Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est irréversible.',
      async () => {
        try {
          await quizService.deleteQuiz(quizUuid!);
          success(t('quiz.messages.deleteSuccess'));
          if (onDelete) {
            onDelete();
          } else {
            navigateToRoute('/quiz');
          }
        } catch (err) {
          error(t('quiz.messages.deleteError'));
        }
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`flex h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" 
               style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={`flex h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Quiz non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header - EXACT COPY from CourseView */}
      <div 
        className={`flex items-center justify-between px-[37px] pt-5 pb-5 shadow-sm ${
          isDark ? 'bg-gray-800/50 border-b border-gray-700' : 'bg-white/80 border-b border-[#dadfe8]'
        }`}
      >
        <div className="flex items-center gap-6 flex-1">
          {/* Quiz Title and Info */}
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                {editMode ? (
                  <Input
                    value={editableTitle}
                    onChange={(e) => {
                      console.log('📝 Title changed to:', e.target.value);
                      setEditableTitle(e.target.value);
                    }}
                    className={`[font-family:'Poppins',Helvetica] font-semibold text-[25px] border-0 px-0 focus:outline-none ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-[#19294a]'}`}
                    style={{ color: isDark ? '#F9FAFB' : '#19294a' }}
                  />
                ) : (
                  <h1 
                    className={`[font-family:'Poppins',Helvetica] font-semibold text-[25px]`}
                    style={{ color: isDark ? '#F9FAFB' : '#19294a' }}
                  >
                    {quiz.title}
                  </h1>
                )}
                
                {editMode && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    ✏️ Éditable
                  </span>
                )}
              
              {/* Status Badge */}
              <Badge 
                className="rounded-[53px] px-3 py-1"
                style={{
                  backgroundColor: quiz.status === 'active' ? '#ecfdf5' : 
                                 quiz.status === 'draft' ? '#fef3c7' : '#f3f4f6',
                  color: quiz.status === 'active' ? '#065f46' :
                         quiz.status === 'draft' ? '#92400e' : '#374151'
                }}
              >
                ● {quiz.status === 'active' ? 'Actif' : quiz.status === 'draft' ? 'Brouillon' : 'Inactif'}
              </Badge>

              {/* Categories */}
              {quiz.categories && quiz.categories.map((cat: any) => (
                <Badge 
                  key={cat.id}
                  className="rounded-[53px] px-3 py-1"
                  style={{ 
                    backgroundColor: cat.color ? `${cat.color}20` : `${primaryColor}20`,
                    color: cat.color || primaryColor
                  }}
                >
                  {cat.title}
                </Badge>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {editMode ? editableDuration : quiz.duration || 0} Min
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {quiz.total_questions} Questions
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className={`w-4 h-4`} style={{ color: primaryColor }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: primaryColor }}>
                  Version 1
                </span>
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  MAJ {formatDate(quiz.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - EXACT COPY */}
        <div className="flex items-center gap-1.5 ml-4">
          {!editMode && (
          <Button
            variant="ghost"
            className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: primaryColor }}>
              {t('common.delete')}
            </span>
          </Button>
          )}

          {editMode ? (
            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-6 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: primaryColor, color: 'white' }}
              onClick={handleSaveEdits}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                    Sauvegarde...
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                    Sauvegarder
                  </span>
                </>
              )}
            </Button>
          ) : (
          <Button
            variant="ghost"
            className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
            style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
            onClick={() => navigateToRoute(`/quiz/edit/${quizUuid}`)}
          >
            <Edit3 className="w-4 h-4" style={{ color: secondaryColor }} />
            <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: secondaryColor }}>
              Modifier le Quiz
            </span>
          </Button>
          )}

          <Button 
            className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
            style={{ backgroundColor: accentColor }}
            onClick={onClose || (() => navigateToRoute('/quiz'))}
          >
            <Eye className="w-4 h-4 text-white" />
            <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[17px]">
              {editMode ? 'Annuler' : 'Fermer'}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Content - EXACT COPY Pattern */}
      <div className="flex flex-1 gap-6 p-8 overflow-y-auto">
          <div className="flex-1 flex flex-col gap-4">
            <Tabs defaultValue="informations" className="w-full">
              <TabsList className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[63px] shadow-[0px_4px_18.8px_#0000000f] p-1.5 h-auto`}>
                <TabsTrigger
                  value="informations"
                  className="rounded-[33px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'informations' ? accentColor : secondaryColor }}>
                    Informations
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('questions')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'questions' ? accentColor : secondaryColor }}>
                    Questions
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="associations"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('associations')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'associations' ? accentColor : secondaryColor }}>
                    Associations
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="statistiques"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('statistiques')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'statistiques' ? accentColor : secondaryColor }}>
                    Statistiques
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Informations Tab */}
              <TabsContent value="informations" className="mt-4 space-y-4">
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                  <CardContent className="p-[37px] space-y-7">
                    {/* Description Section */}
                    <div className="space-y-[17px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                          <Info className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                          Description du Quiz
                        </h3>
                        {editMode && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                            ✏️ Éditable
                          </span>
                        )}
                      </div>
                      {editMode ? (
                        <RichTextEditor
                          value={editableDescription}
                          onChange={(val) => {
                            console.log('📝 Description changed');
                            setEditableDescription(val);
                          }}
                          placeholder="Description du quiz..."
                          minHeight="120px"
                        />
                      ) : (
                      <div 
                        className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                        style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                        dangerouslySetInnerHTML={{ __html: quiz.description || 'Aucune description' }}
                      />
                      )}
                    </div>

                    {/* Thumbnail Section */}
                    {quiz.thumbnail && (
                      <div className="space-y-[17px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                            <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                          </div>
                          <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                            Miniature
                          </h3>
                        </div>
                        <img 
                          src={quiz.thumbnail.startsWith('http') ? quiz.thumbnail : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/${quiz.thumbnail}`}
                          alt={quiz.title}
                          className="w-full max-w-md rounded-[13px] shadow-sm"
                        />
                      </div>
                    )}

                    {/* Parameters Section */}
                    <div className="space-y-[17px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                          <Settings className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                          Paramètres du Quiz
                        </h3>
                        {editMode && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                            ✏️ Éditable
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Duration */}
                        <div className={`flex items-center justify-between p-4 rounded-[10px] ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Durée (minutes)
                          </span>
                          {editMode ? (
                            <Input
                              type="number"
                              value={editableDuration}
                              onChange={(e) => {
                                const newDuration = parseInt(e.target.value) || 0;
                                console.log('⏱️ Duration changed to:', newDuration);
                                setEditableDuration(newDuration);
                              }}
                              className="w-20 h-8 text-sm text-right"
                            />
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700">
                              {quiz.duration || 0} min
                            </Badge>
                          )}
                        </div>

                        {/* Total Questions */}
                        <div className={`flex items-center justify-between p-4 rounded-[10px] ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Total Questions
                          </span>
                          <Badge className="bg-purple-100 text-purple-700">
                            {quiz.total_questions || 0}
                          </Badge>
                        </div>
                        
                        {/* Shuffle */}
                        <div className={`flex items-center justify-between p-4 rounded-[10px] ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Mélanger les questions
                          </span>
                          {editMode ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editableIsShuffle}
                                onChange={(e) => {
                                  console.log('🔀 Shuffle changed to:', e.target.checked);
                                  setEditableIsShuffle(e.target.checked);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          ) : (
                            <Badge className={editableIsShuffle || quiz.is_shuffle ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {editableIsShuffle || quiz.is_shuffle ? 'Oui' : 'Non'}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Remake */}
                        <div className={`flex items-center justify-between p-4 rounded-[10px] ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Refaire le quiz
                          </span>
                          {editMode ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editableIsRemake}
                                onChange={(e) => {
                                  console.log('🔄 Remake changed to:', e.target.checked);
                                  setEditableIsRemake(e.target.checked);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          ) : (
                            <Badge className={editableIsRemake || quiz.is_remake ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {editableIsRemake || quiz.is_remake ? 'Oui' : 'Non'}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Show Answers During */}
                        <div className={`flex items-center justify-between p-4 rounded-[10px] ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Afficher réponses pendant
                          </span>
                          {editMode ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editableShowAnswerDuring}
                                onChange={(e) => {
                                  console.log('👁️ Show answer during changed to:', e.target.checked);
                                  setEditableShowAnswerDuring(e.target.checked);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          ) : (
                            <Badge className={editableShowAnswerDuring || quiz.show_answer_during ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {editableShowAnswerDuring || quiz.show_answer_during ? 'Oui' : 'Non'}
                            </Badge>
                          )}
                        </div>

                        {/* Show Answers After */}
                        <div className={`flex items-center justify-between p-4 rounded-[10px] ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Afficher réponses après
                          </span>
                          {editMode ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editableShowAnswerAfter}
                                onChange={(e) => {
                                  console.log('👁️ Show answer after changed to:', e.target.checked);
                                  setEditableShowAnswerAfter(e.target.checked);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          ) : (
                            <Badge className={editableShowAnswerAfter || quiz.show_answer_after ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {editableShowAnswerAfter || quiz.show_answer_after ? 'Oui' : 'Non'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    {quiz.user && (
                      <div className="space-y-[17px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                            <User className="w-5 h-5" style={{ color: primaryColor }} />
                          </div>
                          <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                            Créateur
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {quiz.user.image_url && (
                            <img 
                              src={quiz.user.image_url}
                              alt={quiz.user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15.5px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              {quiz.user.name}
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {quiz.user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="mt-4">
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                  <CardContent className="p-[37px] space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                        Questions du Quiz
                      </h2>
                      {editMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQuestionEditor(true)}
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          className="h-auto px-3 py-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ajouter des Questions
                        </Button>
                      )}
                    </div>

                    {quiz.questions && quiz.questions.length > 0 ? (
                      <div className="space-y-4">
                        {quiz.questions.map((question: any, index: number) => (
                          <div
                            key={question.uuid}
                            className={`p-5 rounded-[13px] border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-[#e2e2ea] bg-gray-50'}`}
                          >
                            <div className="flex items-start gap-4">
                              <div 
                                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-bold flex-shrink-0"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                      {question.title}
                                    </h4>
                                    {question.description && (
                                      <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                        {question.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge 
                                    className="rounded-[53px] px-3 py-1 ml-3"
                                    style={{ 
                                      backgroundColor: question.question_type?.key === 'single_choice' ? '#fef3c7' : 
                                                     question.question_type?.key === 'multiple_choice' ? '#ffe5ca' :
                                                     question.question_type?.key === 'true_false' ? '#d1fae5' :
                                                     '#e5e7eb',
                                      color: question.question_type?.key === 'single_choice' ? '#92400e' :
                                            question.question_type?.key === 'multiple_choice' ? '#9a3412' :
                                            question.question_type?.key === 'true_false' ? '#065f46' :
                                            '#374151'
                                    }}
                                  >
                                    {question.question_type?.title || 'Type inconnu'}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                  <span className={`flex items-center gap-1 text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {question.time_limit || 0} sec
                                  </span>
                                  <span className={`flex items-center gap-1 text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    {question.points} points
                                  </span>
                                  {question.is_mandatory && (
                                    <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                                      Obligatoire
                                    </Badge>
                                  )}
                                </div>

                                {/* Options */}
                                {question.options && question.options.length > 0 && (
                                  <div className="space-y-2">
                                    {question.options.map((option: any) => (
                                      <div
                                        key={option.uuid}
                                        className={`flex items-center gap-3 p-3 rounded-[8px] ${
                                          option.is_correct 
                                            ? 'bg-green-50 border border-green-200' 
                                            : isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'
                                        }`}
                                      >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                          option.is_correct ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                        }`}>
                                          {option.is_correct && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        {option.image ? (
                                          <img 
                                            src={option.image.startsWith('http') ? option.image : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/${option.image}`}
                                            alt={`Option`}
                                            className="w-20 h-20 rounded-[8px] object-cover"
                                          />
                                        ) : (
                                          <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15px] ${
                                            option.is_correct ? 'text-green-700 font-medium' : isDark ? 'text-gray-300' : 'text-gray-700'
                                          }`}>
                                            {option.title}
                                          </span>
                                        )}
                                        {option.is_correct && (
                                          <Badge className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5">
                                            ✓ Bonne réponse
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Edit/Delete buttons in edit mode */}
                                {editMode && (
                                  <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e2e2ea' }}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        showConfirmation(
                                          'Supprimer la question',
                                          'Êtes-vous sûr de vouloir supprimer cette question ?',
                                          async () => {
                                            try {
                                              await quizService.deleteQuestion(quizUuid!, question.uuid);
                                              success('Question supprimée');
                                              // Update local state
                                              setQuiz({ ...quiz, questions: quiz.questions.filter((q: any) => q.uuid !== question.uuid) });
                                            } catch (err) {
                                              error('Erreur lors de la suppression');
                                            }
                                          }
                                        );
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Supprimer
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: primaryColor }} />
                        <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                          Aucune question définie
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Associations Tab */}
              <TabsContent value="associations" className="mt-4">
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                  <CardContent className="p-[37px]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                        Associations avec les Formations
                      </h2>
                      {editMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAssociationFlow(true)}
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          className="h-auto px-3 py-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Associer à une Formation
                        </Button>
                      )}
                    </div>

                    {associations && associations.length > 0 ? (
                      <div className="space-y-4">
                        {associations.map((assoc: any) => (
                          <div
                            key={assoc.uuid}
                            className={`p-5 rounded-[13px] border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-[#e2e2ea] bg-gray-50'}`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Course Image */}
                              <div className="w-16 h-16 rounded-[10px] overflow-hidden flex-shrink-0">
                                {assoc.course?.image_url ? (
                                  <img 
                                    src={assoc.course.image_url}
                                    alt={assoc.course.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <FileText className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1">
                                {/* Course Title */}
                                <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] mb-2`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                  {assoc.course?.title || 'Formation'}
                                </h4>

                                {/* Chapter Info */}
                                {assoc.chapter && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="rounded-[53px] px-3 py-1" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                      📖 Chapitre : {assoc.chapter.title}
                                    </Badge>
                                  </div>
                                )}

                                {/* Meta Info */}
                                <div className="flex items-center gap-4 text-xs" style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                  <span>Ordre : {assoc.order}</span>
                                  <span>•</span>
                                  <span>Visible : {assoc.is_visible ? 'Oui' : 'Non'}</span>
                                  {assoc.available_from && (
                                    <>
                                      <span>•</span>
                                      <span>Disponible : {new Date(assoc.available_from).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              {editMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await quizService.dissociateQuiz(quizUuid!, assoc.course.uuid);
                                      success('Association supprimée');
                                      setAssociations(associations.filter(a => a.uuid !== assoc.uuid));
                                    } catch (err) {
                                      error('Erreur lors de la suppression');
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: primaryColor }} />
                        <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px] mb-2`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                          Ce quiz n'est associé à aucune formation
                        </p>
                        {editMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAssociationFlow(true)}
                            className="mt-4"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Associer à une Formation
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Statistiques Tab */}
              <TabsContent value="statistiques" className="mt-4">
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                  <CardContent className="p-[37px]">
                    <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px] mb-4`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      Statistiques du Quiz
                    </h2>
                    <div className="text-center py-12">
                      <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                        Les statistiques seront affichées ici
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type="danger"
      />

      {/* Question Editor Modal */}
      {showQuestionEditor && quizUuid && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQuestionEditor(false)}>
          <div 
            className={`w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-[18px] ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b" style={{ 
              backgroundColor: isDark ? '#1f2937' : 'white',
              borderColor: isDark ? '#374151' : '#dadfe8'
            }}>
              <h2 className={`text-2xl font-semibold`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                Gérer les Questions
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuestionEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Fermer
              </Button>
            </div>
            <div className="p-6">
              <QuestionEditor
                quizUuid={quizUuid}
                questions={quiz?.questions || []}
                onQuestionsChange={(newQuestions) => {
                  setQuiz({ ...quiz, questions: newQuestions });
                }}
                onComplete={() => {
                  setShowQuestionEditor(false);
                  // Reload quiz data to get fresh question list
                  const loadQuizData = async () => {
                    try {
                      const response = await quizService.getQuiz(quizUuid);
                      if (response.success && response.data) {
                        setQuiz(response.data);
                      }
                    } catch (err) {
                      console.error('Failed to reload quiz:', err);
                    }
                  };
                  loadQuizData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Association Flow Modal */}
      {showAssociationFlow && quizUuid && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div 
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[18px] ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <AssociationFlow
              quizUuid={quizUuid}
              onClose={() => {
                setShowAssociationFlow(false);
                // Reload quiz data to get fresh associations
                const loadQuizData = async () => {
                  try {
                    const response = await quizService.getQuiz(quizUuid);
                    if (response.success && response.data) {
                      setQuiz(response.data);
                      if (response.data.course_assignments) {
                        setAssociations(response.data.course_assignments);
                      }
                    }
                  } catch (err) {
                    console.error('Failed to reload quiz:', err);
                  }
                };
                loadQuizData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

