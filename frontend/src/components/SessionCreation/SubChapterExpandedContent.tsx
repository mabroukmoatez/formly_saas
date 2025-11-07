import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RichTextEditor } from '../ui/rich-text-editor';
import { RobustVideoPlayer } from '../ui/robust-video-player';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Plus, FileText, Upload, Trash2, ChevronDown, ChevronRight, Video, Image, Calendar, Save, X, Edit } from 'lucide-react';

interface SubChapter {
  id: string;
  title: string;
  content: any[];
  evaluations: any[];
  supportFiles: any[];
  isExpanded: boolean;
  order: number;
}

interface SubChapterExpandedContentProps {
  subChapter: SubChapter;
  chapterId: string;
  onAddContent: (chapterId: string, subChapterId: string, type: 'text' | 'video' | 'image', file?: File) => void;
  onUpdateContent: (chapterId: string, subChapterId: string, contentId: string, updates: { title?: string; content?: string }) => void;
  onAddEvaluation: (chapterId: string, subChapterId: string, type: 'devoir' | 'examen', data: any) => void;
  onUpdateEvaluation: (chapterId: string, subChapterId: string, evaluationId: string, data: any) => void;
  onAddSupportFile: (chapterId: string, subChapterId: string, file: File) => void;
  onDeleteContent: (chapterId: string, subChapterId: string, contentId: string) => void;
  onDeleteEvaluation: (chapterId: string, subChapterId: string, evaluationId: string) => void;
  onDeleteSupportFile: (chapterId: string, subChapterId: string, fileId: string) => void;
  onTitleChange: (chapterId: string, subChapterId: string, contentId: string, title: string) => void;
  toggleSection: (subChapterId: string, sectionKey: string) => void;
  isSectionCollapsed: (subChapterId: string, sectionKey: string) => boolean;
  toggleEvaluationEditor: (subChapterId: string) => void;
  isEvaluationEditorOpen: (subChapterId: string) => boolean;
}

export const SubChapterExpandedContent: React.FC<SubChapterExpandedContentProps> = ({
  subChapter,
  chapterId,
  onAddContent,
  onUpdateContent,
  onAddEvaluation,
  onUpdateEvaluation,
  onAddSupportFile,
  onDeleteContent,
  onDeleteEvaluation,
  onDeleteSupportFile,
  onTitleChange,
  toggleSection,
  isSectionCollapsed,
  toggleEvaluationEditor,
  isEvaluationEditorOpen,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  // State for evaluation editor (local to this component)
  const [evaluationType, setEvaluationType] = useState<'devoir' | 'examen'>('devoir');
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
      onUpdateEvaluation(chapterId, subChapter.id, editingEvaluation.id, evaluationData);
    } else {
      // Create new evaluation
      onAddEvaluation(chapterId, subChapter.id, evaluationType, evaluationData);
    }
    toggleEvaluationEditor(subChapter.id);
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
    toggleEvaluationEditor(subChapter.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      onAddSupportFile(chapterId, subChapter.id, file);
    }
  };

  const handleContentUpload = (type: 'text' | 'video' | 'image') => {
    if (type === 'text') {
      onAddContent(chapterId, subChapter.id, type);
    } else {
      // For video and image, trigger file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'video' ? 'video/*' : 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          onAddContent(chapterId, subChapter.id, type, file);
        }
      };
      input.click();
    }
  };

  return (
    <div className="space-y-4 ml-6">
      {/* SubChapter Content */}
      <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
      }`}>
        <CardContent className="p-5">
          <div 
            className="flex items-center gap-3 mb-6 cursor-pointer"
            onClick={() => toggleSection(subChapter.id, 'contenu')}
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
              {isSectionCollapsed(subChapter.id, 'contenu') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Content Items */}
          {!isSectionCollapsed(subChapter.id, 'contenu') && (
            <div className="space-y-4">
              {subChapter.content.map((item) => (
                <div
                  key={item.id || `subcontent-${item.type}-${item.order}`}
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
                      <Input
                        value={item.title || ''}
                        onChange={(e) => onTitleChange(chapterId, subChapter.id, item.id, e.target.value)}
                        placeholder={`${item.type} content`}
                        className={`text-sm font-medium border-none shadow-none bg-transparent p-0 h-auto ${
                          isDark 
                            ? 'text-white placeholder:text-gray-400' 
                            : 'text-gray-700 placeholder:text-gray-500'
                        }`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteContent(chapterId, subChapter.id, item.id)}
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
                            onClick={() => onDeleteContent(chapterId, subChapter.id, item.id)}
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
                            onClick={() => onDeleteContent(chapterId, subChapter.id, item.id)}
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
                        onUpdateContent(chapterId, subChapter.id, item.id, { content });
                      }}
                      placeholder={t('courseSteps.step2.sections.contenus.addButtons.text') + ' content...'}
                    />
                  )}
                </div>
              ))}

              {/* Add Content Buttons */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpload('video');
                  }}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full w-16 h-16"
                >
                  <Video className="w-6 h-6" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpload('text');
                  }}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full w-16 h-16"
                >
                  <FileText className="w-6 h-6" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpload('image');
                  }}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full w-16 h-16"
                >
                  <Image className="w-6 h-6" />
                </Button>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('courseSteps.step2.sections.contenus.addButtons.label')}
                </span>
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
            onClick={() => toggleSection(subChapter.id, 'evaluations')}
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
              {isSectionCollapsed(subChapter.id, 'evaluations') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isSectionCollapsed(subChapter.id, 'evaluations') && (
            <div className="space-y-4">
              {/* Devoir Form */}
              {isEvaluationEditorOpen(subChapter.id) && evaluationType === 'devoir' ? (
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
                        onClick={() => toggleEvaluationEditor(subChapter.id)}
                      >
                        {t('courseSteps.step2.sections.evaluations.form.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEvaluationType('devoir');
                    toggleEvaluationEditor(subChapter.id);
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('courseSteps.step2.sections.evaluations.addButtons.devoir')}
                </Button>
              )}

              {/* Examen Form */}
              {isEvaluationEditorOpen(subChapter.id) && evaluationType === 'examen' ? (
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
                        onClick={() => toggleEvaluationEditor(subChapter.id)}
                      >
                        {t('courseSteps.step2.sections.evaluations.form.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEvaluationType('examen');
                    toggleEvaluationEditor(subChapter.id);
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('courseSteps.step2.sections.evaluations.addButtons.examin')}
                </Button>
              )}

              {/* Existing Evaluations */}
              {subChapter.evaluations && subChapter.evaluations.length > 0 && (
                <div className="space-y-3">
                  {subChapter.evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id || `subevaluation-${evaluation.type}-${evaluation.title}`}
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
                              onDeleteEvaluation(chapterId, subChapter.id, evaluation.id);
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
            onClick={() => toggleSection(subChapter.id, 'support')}
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
              {isSectionCollapsed(subChapter.id, 'support') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isSectionCollapsed(subChapter.id, 'support') && (
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                  id={`support-upload-${subChapter.id}`}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById(`support-upload-${subChapter.id}`)?.click();
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {t('courseSteps.step2.sections.support.upload')}
                </Button>
              </div>

              {/* Existing Support Files */}
              {subChapter.supportFiles && subChapter.supportFiles.length > 0 ? (
                <div className="space-y-2">
                  {subChapter.supportFiles.map((file) => (
                    <div
                      key={file.id || `subsupport-${file.name || file.file_name}-${file.type}`}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDark ? 'bg-gray-600' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {file.type?.startsWith('image/') ? (
                          <img 
                            src={URL.createObjectURL(file.file)} 
                            alt={file.name || 'Image'} 
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : file.type?.startsWith('video/') ? (
                          <video 
                            src={URL.createObjectURL(file.file)} 
                            className="w-8 h-8 object-cover rounded"
                            controls={false}
                          />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500" />
                        )}
                        <div className="flex flex-col">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-700'}`}>
                            {file.name || file.file_name}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteSupportFile(chapterId, subChapter.id, file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
    </div>
  );
};