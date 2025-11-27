import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RichTextEditor } from '../ui/rich-text-editor';
import { RobustVideoPlayer } from '../ui/robust-video-player';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Plus, FileText, Upload, Trash2, ChevronDown, ChevronRight, Video, Image, Type, Calendar, Save, X, Edit, Clock } from 'lucide-react';
import { SubChapterPill } from './SubChapterPill';
import { QuizPill } from './QuizPill';
import { DevoirPill } from './DevoirPill';
import { ExaminPill } from './ExaminPill';

interface Chapter {
  id: string;
  title: string;
  content: any[];
  subChapters: any[];
  evaluations: any[];
  supportFiles: any[];
  isExpanded: boolean;
  order: number;
}

interface ChapterExpandedContentProps {
  chapter: Chapter;
  onAddContent: (chapterId: string, type: 'text' | 'video' | 'image', file?: File) => void;
  onUpdateContent: (chapterId: string, contentId: string, updates: { title?: string; content?: string }) => void;
  onAddEvaluation: (chapterId: string, type: 'devoir' | 'examen', data: any) => void;
  onUpdateEvaluation: (chapterId: string, evaluationId: string, data: any) => void;
  onAddSupportFile: (chapterId: string, file: File) => void;
  onDeleteContent: (chapterId: string, contentId: string) => void;
  onDeleteEvaluation: (chapterId: string, evaluationId: string) => void;
  onDeleteSupportFile: (chapterId: string, fileId: string) => void;
  onTitleChange?: (chapterId: string, contentId: string, title: string) => void;
  toggleSection: (chapterId: string, sectionKey: string) => void;
  isSectionCollapsed: (chapterId: string, sectionKey: string) => boolean;
  toggleEvaluationEditor: (chapterId: string) => void;
  isEvaluationEditorOpen: (chapterId: string) => boolean;
  onAddQuiz?: (chapterId: string) => void;
  onAddSubChapter?: (chapterId: string) => void;
  onAddDevoir?: (chapterId: string) => void;
  onAddExamin?: (chapterId: string) => void;
  children?: React.ReactNode; // For sub-chapters
}

export const ChapterExpandedContent: React.FC<ChapterExpandedContentProps> = ({
  chapter,
  onAddContent,
  onUpdateContent,
  onAddEvaluation,
  onUpdateEvaluation,
  onAddQuiz,
  onAddSubChapter,
  onAddDevoir,
  onAddExamin,
  onAddSupportFile,
  onDeleteContent,
  onDeleteEvaluation,
  onDeleteSupportFile,
  onTitleChange,
  toggleSection,
  isSectionCollapsed,
  toggleEvaluationEditor,
  isEvaluationEditorOpen,
  pendingEvaluationType,
  onPendingEvaluationTypeHandled,
  children,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  // State for evaluation editor (local to this component)
  const [evaluationType, setEvaluationType] = useState<'devoir' | 'examen'>('devoir');
  
  // Handle pending evaluation type when component mounts or when it changes
  React.useEffect(() => {
    if (pendingEvaluationType && !isEvaluationEditorOpen(chapter.id)) {
      setEvaluationType(pendingEvaluationType);
      toggleEvaluationEditor(chapter.id);
      onPendingEvaluationTypeHandled?.();
    }
  }, [pendingEvaluationType, chapter.id, isEvaluationEditorOpen, toggleEvaluationEditor, onPendingEvaluationTypeHandled]);
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null as File | null
  });

  const handleSaveEvaluation = () => {
    if (editingEvaluation) {
      // Update existing evaluation
      onUpdateEvaluation(chapter.id, editingEvaluation.id, evaluationData);
    } else {
      // Create new evaluation
      onAddEvaluation(chapter.id, evaluationType, evaluationData);
    }
    toggleEvaluationEditor(chapter.id);
    setEvaluationData({ title: '', description: '', dueDate: '', file: null });
    setEditingEvaluation(null);
  };

  const handleEditEvaluation = (evaluation: any) => {
    setEditingEvaluation(evaluation);
    setEvaluationType(evaluation.type);
    setEvaluationData({
      title: evaluation.title || '',
      description: evaluation.description || '',
      dueDate: evaluation.due_date || '',
      file: evaluation.file || null
    });
    toggleEvaluationEditor(chapter.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      onAddSupportFile(chapter.id, file);
    }
  };

  const handleContentUpload = (type: 'text' | 'video' | 'image') => {
    if (type === 'text') {
      onAddContent(chapter.id, type);
    } else {
      // For video and image, trigger file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'video' ? 'video/*' : 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          onAddContent(chapter.id, type, file);
        }
      };
      input.click();
    }
  };

  return (
    <div className="space-y-4 ml-6">
      {/* Direct Chapter Content */}
      <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
      }`}>
        <CardContent className="p-5">
          <div 
            className="flex items-center gap-3 mb-6 cursor-pointer"
            onClick={() => toggleSection(chapter.id, 'contenu')}
          >
            <div 
              className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
              style={{ 
                backgroundColor: '#8B5CF6',
                borderColor: '#8B5CF6'
              }}
            />
            <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {t('courseSteps.step2.sections.contenus.title')}
            </h3>
            <button className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              {isSectionCollapsed(chapter.id, 'contenu') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Content Items */}
          {!isSectionCollapsed(chapter.id, 'contenu') && (
            <div className="space-y-4">
              {chapter.content.map((item) => (
                <div
                  key={item.id || `content-${item.type}-${item.order}`}
                  className={`p-4 rounded-lg border transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {item.type === 'image' && item.file ? (
                        <img 
                          src={URL.createObjectURL(item.file)} 
                          alt={item.title || 'Image'} 
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : item.type === 'video' && item.file ? (
                        <video 
                          src={URL.createObjectURL(item.file)} 
                          className="w-8 h-8 object-cover rounded"
                          controls={false}
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-500" />
                      )}
                      {onTitleChange ? (
                        <Input
                          value={item.title || ''}
                          onChange={(e) => onTitleChange(chapter.id, item.id, e.target.value)}
                          placeholder={`${item.type} content`}
                          className={`text-sm font-medium border-none shadow-none bg-transparent p-0 h-auto ${
                            isDark 
                              ? 'text-white placeholder:text-gray-400' 
                              : 'text-gray-700 placeholder:text-gray-500'
                          }`}
                        />
                      ) : (
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                          {item.title || `${item.type} content`}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteContent(chapter.id, item.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Media Preview */}
                  {item.file && (
                    <div className="max-w-md">
                      {item.type === 'video' ? (
                        <div className="relative">
                          <RobustVideoPlayer 
                            src={URL.createObjectURL(item.file)}
                            title={item.title || 'Video'}
                            size="md"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteContent(chapter.id, item.id)}
                            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : item.type === 'image' ? (
                        <div className="relative">
                          <img 
                            src={URL.createObjectURL(item.file)} 
                            alt={item.title || 'Image'} 
                            className="w-full h-48 object-cover rounded"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteContent(chapter.id, item.id)}
                            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Text Content */}
                  {item.type === 'text' && (
                    <RichTextEditor
                      content={item.content || ''}
                      onChange={(content) => {
                        onUpdateContent(chapter.id, item.id, { content });
                      }}
                      placeholder={t('courseSteps.step2.sections.contenus.addButtons.text') + ' content...'}
                    />
                  )}
                </div>
              ))}

              {/* Add Content Buttons */}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium mr-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('courseSteps.step2.sections.contenus.addButtons.label')}:
                </span>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpload('video');
                  }}
                  variant="outline"
                  className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    isDark 
                      ? 'border-purple-600 text-purple-300 hover:bg-purple-900/30' 
                      : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(147, 51, 234, 0.1)' : '#F3E8FF',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : '#C084FC',
                  }}
                >
                  <Video className="w-4 h-4" />
                  <Plus className="w-3 h-3" />
                  <span className="text-sm font-medium">Vidéo</span>
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpload('text');
                  }}
                  variant="outline"
                  className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    isDark 
                      ? 'border-purple-600 text-purple-300 hover:bg-purple-900/30' 
                      : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(147, 51, 234, 0.1)' : '#F3E8FF',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : '#C084FC',
                  }}
                >
                  <FileText className="w-4 h-4" />
                  <Plus className="w-3 h-3" />
                  <span className="text-sm font-medium">Text</span>
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpload('image');
                  }}
                  variant="outline"
                  className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    isDark 
                      ? 'border-purple-600 text-purple-300 hover:bg-purple-900/30' 
                      : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(147, 51, 234, 0.1)' : '#F3E8FF',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : '#C084FC',
                  }}
                >
                  <Image className="w-4 h-4" />
                  <Plus className="w-3 h-3" />
                  <span className="text-sm font-medium">Image</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluations */}
      <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
      }`}>
        <CardContent className="p-5">
          <div 
            className="flex items-center gap-3 mb-6 cursor-pointer"
            onClick={() => toggleSection(chapter.id, 'evaluations')}
          >
            <div 
              className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
              style={{ 
                backgroundColor: '#10B981',
                borderColor: '#10B981'
              }}
            />
            <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {t('courseSteps.step2.sections.evaluations.title')}
            </h3>
            <button className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              {isSectionCollapsed(chapter.id, 'evaluations') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isSectionCollapsed(chapter.id, 'evaluations') && (
            <div className="space-y-4">
              {/* Devoir Form */}
              {isEvaluationEditorOpen(chapter.id) && evaluationType === 'devoir' ? (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingEvaluation ? 
                      `${t('common.edit')} ${t('courseSteps.step2.sections.evaluations.addButtons.devoir')}` :
                      t('courseSteps.step2.sections.evaluations.addButtons.devoir')
                    }
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.title')}
                      </label>
                      <Input
                        placeholder={t('courseSteps.step2.sections.evaluations.form.titleDeDevoir')}
                        className={isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}
                        value={evaluationData.title}
                        onChange={(e) => setEvaluationData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.description')}
                      </label>
                      <RichTextEditor
                        content={evaluationData.description}
                        onChange={(content) => {
                          setEvaluationData(prev => ({ ...prev, description: content }));
                        }}
                        placeholder={t('courseSteps.step2.sections.evaluations.form.description') + ' du devoir...'}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.dueDate')}
                      </label>
                      <Input
                        type="date"
                        className={isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}
                        value={evaluationData.dueDate}
                        onChange={(e) => setEvaluationData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.file')}
                      </label>
                      <Input
                        type="file"
                        className={isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEvaluationData(prev => ({ ...prev, file }));
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEvaluation}
                        className="flex items-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Save className="w-4 h-4" />
                        {t('courseSteps.step2.sections.evaluations.form.validate')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggleEvaluationEditor(chapter.id)}
                      >
                        {t('courseSteps.step2.sections.evaluations.form.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Examen Form */}
              {isEvaluationEditorOpen(chapter.id) && evaluationType === 'examen' ? (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingEvaluation ? 
                      `${t('common.edit')} ${t('courseSteps.step2.sections.evaluations.addButtons.examin')}` :
                      t('courseSteps.step2.sections.evaluations.addButtons.examin')
                    }
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.title')}
                      </label>
                      <Input
                        placeholder={t('courseSteps.step2.sections.evaluations.form.titleDeExamen')}
                        className={isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}
                        value={evaluationData.title}
                        onChange={(e) => setEvaluationData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.description')}
                      </label>
                      <RichTextEditor
                        content={evaluationData.description}
                        onChange={(content) => {
                          setEvaluationData(prev => ({ ...prev, description: content }));
                        }}
                        placeholder={t('courseSteps.step2.sections.evaluations.form.description') + ' de l\'examen...'}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('courseSteps.step2.sections.evaluations.form.dueDate')}
                      </label>
                      <Input
                        type="date"
                        className={isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}
                        value={evaluationData.dueDate}
                        onChange={(e) => setEvaluationData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    {/* File upload removed for examen - only available in devoir */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEvaluation}
                        className="flex items-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Save className="w-4 h-4" />
                        {t('courseSteps.step2.sections.evaluations.form.validate')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggleEvaluationEditor(chapter.id)}
                      >
                        {t('courseSteps.step2.sections.evaluations.form.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Add Evaluation/Quiz Buttons */}
              {!isEvaluationEditorOpen(chapter.id) && (
                <div className="flex items-center gap-3 mt-4">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ajouter un:
                  </span>
                  {onAddQuiz && (
                    <QuizPill onClick={() => onAddQuiz(chapter.id)} />
                  )}
                  {onAddDevoir ? (
                    <DevoirPill onClick={() => onAddDevoir(chapter.id)} />
                  ) : (
                    <DevoirPill 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEvaluationType('devoir');
                        toggleEvaluationEditor(chapter.id);
                      }} 
                    />
                  )}
                  {onAddExamin ? (
                    <ExaminPill onClick={() => onAddExamin(chapter.id)} />
                  ) : (
                    <ExaminPill 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEvaluationType('examen');
                        toggleEvaluationEditor(chapter.id);
                      }} 
                    />
                  )}
                </div>
              )}

              {/* Existing Associated Quizzes */}
              {(() => {
                const quizzes = chapter.quizzes || chapter.quiz_assignments || [];
                console.log(`📊 Chapter ${chapter.id} quizzes:`, quizzes);
                return quizzes.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quiz Associés ({quizzes.length})
                    </h4>
                    {quizzes.map((quizAssignment: any) => {
                    const quiz = quizAssignment.quiz || quizAssignment;
                    return (
                      <div
                        key={quizAssignment.uuid || quizAssignment.id || quiz.uuid}
                        className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                          isDark 
                            ? 'bg-purple-900/20 border-purple-700 hover:bg-purple-800/30' 
                            : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Quiz Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                              isDark ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-semibold text-sm truncate ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {quiz.title}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  📝 Quiz
                                </span>
                              </div>
                              
                              {/* Quiz Info */}
                              <div className="flex items-center gap-3 text-xs">
                                {quiz.duration && (
                                  <>
                                    <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      <Clock className="w-3 h-3" />
                                      {quiz.duration} min
                                    </span>
                                    <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>•</span>
                                  </>
                                )}
                                {quiz.total_questions !== undefined && (
                                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FileText className="w-3 h-3" />
                                    {quiz.total_questions} questions
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          {onDeleteEvaluation && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    // Dissociate quiz using quizService
                                    const { quizService } = await import('../../services/quiz');
                                    await quizService.dissociateQuiz(quiz.uuid, chapter.id);
                                    // Reload to show updated data
                                    window.location.reload();
                                  } catch (err) {
                                    console.error('Error dissociating quiz:', err);
                                  }
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                ) : null;
              })()}

              {/* Existing Evaluations */}
              {chapter.evaluations && chapter.evaluations.length > 0 && (
                <div className="space-y-3">
                  {chapter.evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id || `evaluation-${evaluation.type}-${evaluation.title}`}
                      className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Type Icon */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                            evaluation.type === 'examen' 
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {evaluation.type === 'examen' ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold text-sm truncate ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {evaluation.title}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                evaluation.type === 'examen'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {evaluation.type === 'examen' ? 'Examen' : 'Devoir'}
                              </span>
                            </div>
                            
                            {/* Description */}
                            {evaluation.description && (
                              <p className={`text-xs line-clamp-2 mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {evaluation.description.replace(/<[^>]*>/g, '')}
                              </p>
                            )}
                            
                            {/* Due Date */}
                            {evaluation.due_date && (
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Échéance: {new Date(evaluation.due_date).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvaluation(evaluation);
                            }}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvaluation(chapter.id, evaluation.id);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Files */}
      <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
      }`}>
        <CardContent className="p-5">
          <div 
            className="flex items-center gap-3 mb-6 cursor-pointer"
            onClick={() => toggleSection(chapter.id, 'support')}
          >
            <div 
              className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
              style={{ 
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B'
              }}
            />
            <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {t('courseSteps.step2.sections.support.title')}
            </h3>
            <button className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              {isSectionCollapsed(chapter.id, 'support') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isSectionCollapsed(chapter.id, 'support') && (
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                  id={`support-upload-${chapter.id}`}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById(`support-upload-${chapter.id}`)?.click();
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {t('courseSteps.step2.sections.support.upload')}
                </Button>
              </div>

              {/* Existing Support Files */}
              {chapter.supportFiles && chapter.supportFiles.length > 0 ? (
                <div className="space-y-3">
                  {chapter.supportFiles.map((file) => (
                    <div
                      key={file.id || `support-${file.name || file.file_name}-${file.type}`}
                      className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* File Icon/Preview */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                            {file.type?.startsWith('image/') ? (
                              <img 
                                src={file.url || URL.createObjectURL(file.file)} 
                                alt={file.name || 'Image'} 
                                className="w-full h-full object-cover"
                              />
                            ) : file.type?.startsWith('video/') ? (
                              <video 
                                src={file.url || URL.createObjectURL(file.file)} 
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : file.type?.startsWith('application/pdf') ? (
                              <div className="w-full h-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm truncate mb-1 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {file.name || file.file_name}
                            </h4>
                            
                            {/* File Info */}
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`px-2 py-1 rounded-full font-medium ${
                                file.type?.startsWith('image/')
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : file.type?.startsWith('video/')
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                  : file.type?.startsWith('application/pdf')
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                              }`}>
                                {file.type?.startsWith('image/') ? 'Image' :
                                 file.type?.startsWith('video/') ? 'Vidéo' :
                                 file.type?.startsWith('application/pdf') ? 'PDF' :
                                 'Fichier'}
                              </span>
                              {file.size && (
                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add preview functionality
                              if (file.url || file.file) {
                                window.open(file.url || URL.createObjectURL(file.file), '_blank');
                              }
                            }}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSupportFile(chapter.id, file.id);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">{t('courseSteps.step2.sections.support.emptyState')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone d'Ajout Enfant - SubChapterPill et QuizPill */}
      <div className="flex items-center gap-3 mb-4">
        <SubChapterPill onClick={() => onAddSubChapter?.(chapter.id)} />
        <QuizPill onClick={() => onAddQuiz?.(chapter.id)} />
      </div>

      {/* Sub-chapters */}
      {children}
    </div>
  );
};