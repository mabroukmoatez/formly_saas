import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { quizService } from '../../services/quiz';
import { Plus, Trash2, GripVertical, Check, Upload, FileText, X } from 'lucide-react';

interface QuestionEditorProps {
  quizUuid: string;
  questions: any[];
  onQuestionsChange: (questions: any[]) => void;
  onComplete: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  quizUuid,
  questions,
  onQuestionsChange,
  onComplete
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [selectedType, setSelectedType] = useState('single_choice');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionDescription, setQuestionDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [points, setPoints] = useState(4);
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3']);
  const [correctAnswer, setCorrectAnswer] = useState<number[]>([]);
  const [images, setImages] = useState<(File | null)[]>([null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(['', '', '', '']);
  const [saving, setSaving] = useState(false);

  const questionTypes = [
    { value: 'single_choice', id: 1, label: t('quiz.questions.types.singleChoice'), color: '#ff6b35' },
    { value: 'multiple_choice', id: 2, label: t('quiz.questions.types.multipleChoice'), color: '#ff6b35' },
    { value: 'ranking', id: 3, label: t('quiz.questions.types.ranking'), color: '#9b59b6' },
    { value: 'image_choice', id: 4, label: t('quiz.questions.types.imageChoice'), color: '#3498db' },
    { value: 'free_text', id: 5, label: t('quiz.questions.types.freeText'), color: '#e74c3c' },
    { value: 'true_false', id: 6, label: t('quiz.questions.types.trueFalse'), color: '#2ecc71' }
  ];

  const handleSaveQuestion = async () => {
    if (!questionTitle.trim()) {
      showError(t('common.error'), t('quiz.questions.questionTitleRequired'));
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', questionTitle);
      if (questionDescription) formData.append('description', questionDescription);
      
      // Backend expects quiz_question_type_id (integer 1-6), not question_type_key
      const typeId = questionTypes.find(t => t.value === selectedType)?.id || 1;
      formData.append('quiz_question_type_id', typeId.toString());
      
      formData.append('time_limit', timeLimit.toString());
      formData.append('points', points.toString());
      formData.append('order', (questions.length + 1).toString());
      formData.append('is_mandatory', '1');
      
      // Options - format attendu par le backend
      if (selectedType === 'image_choice') {
        // Pour image_choice: envoyer les images
        let optionIndex = 0;
        images.forEach((img, idx) => {
          if (img) {
            formData.append(`options[${optionIndex}][image]`, img);
            formData.append(`options[${optionIndex}][order]`, (optionIndex + 1).toString());
            formData.append(`options[${optionIndex}][is_correct]`, correctAnswer.includes(idx) ? '1' : '0');
            optionIndex++;
          }
        });
      } else if (selectedType === 'true_false') {
        formData.append(`options[0][title]`, t('quiz.questions.options.true'));
        formData.append(`options[0][order]`, '1');
        formData.append(`options[0][is_correct]`, correctAnswer.includes(0) ? '1' : '0');
        formData.append(`options[1][title]`, t('quiz.questions.options.false'));
        formData.append(`options[1][order]`, '2');
        formData.append(`options[1][is_correct]`, correctAnswer.includes(1) ? '1' : '0');
      } else if (selectedType !== 'free_text') {
        // Pour les autres types (single_choice, multiple_choice, ranking)
        options.forEach((opt, idx) => {
          formData.append(`options[${idx}][title]`, opt);
          formData.append(`options[${idx}][order]`, (idx + 1).toString());
          formData.append(`options[${idx}][is_correct]`, correctAnswer.includes(idx) ? '1' : '0');
        });
      }

      console.log('📤 Creating question with type:', selectedType);
      console.log('📊 Form data contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, value.name, `(${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }
      
      const response = await quizService.createQuestion(quizUuid, formData);
      
      if (response.success && response.data) {
        success(t('quiz.messages.questionCreateSuccess'));
        
        // Add question to local state
        onQuestionsChange([...questions, response.data]);
        
        // Reset form completely
        setQuestionTitle('');
        setQuestionDescription('');
        setOptions(['Option 1', 'Option 2', 'Option 3']);
        setCorrectAnswer([]);
        setImages([null, null, null, null]);
        setImagePreviews(['', '', '', '']);
      }
    } catch (err: any) {
      showError(t('common.error'), t('quiz.messages.questionCreateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionUuid: string) => {
    try {
      await quizService.deleteQuestion(quizUuid, questionUuid);
      success(t('quiz.messages.questionDeleteSuccess'));
      // Remove from local state
      onQuestionsChange(questions.filter(q => q.uuid !== questionUuid));
    } catch (err) {
      showError(t('common.error'), t('quiz.messages.questionDeleteError'));
    }
  };

  const handleResetForm = () => {
    setQuestionTitle('');
    setQuestionDescription('');
    setOptions(['Option 1', 'Option 2', 'Option 3']);
    setCorrectAnswer([]);
    setImages([null, null, null, null]);
    setImagePreviews(['', '', '', '']);
    setTimeLimit(60);
    setPoints(4);
    // Scroll to top of editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentType = questionTypes.find(t => t.value === selectedType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1396px] mx-auto">
      {/* Left: Question Editor */}
      <div className="lg:col-span-2">
        <div className={`rounded-[13px] border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} p-8`}>
          {/* Type Selector */}
          <div className="mb-6">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg font-medium text-sm"
              style={{ backgroundColor: '#f0f4f8', color: currentType?.color || '#ff6b35', border: 'none' }}
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question Title */}
          <div className={`rounded-[5px] border border-dashed p-6 mb-6 ${isDark ? 'bg-gray-750 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
            <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('quiz.questions.questionTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder={t('quiz.questions.questionTitlePlaceholder')}
              className={`w-full font-semibold text-sm border-0 p-0 bg-transparent ${isDark ? 'text-white' : 'text-gray-800'} focus:outline-none`}
            />
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('validation.required')}
            </p>
          </div>

          {/* Description */}
          <div className={`rounded-[5px] border border-dashed p-6 mb-6 ${isDark ? 'bg-gray-750 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
            <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('quiz.questions.questionDescription')}
            </label>
            <textarea
              value={questionDescription}
              onChange={(e) => setQuestionDescription(e.target.value)}
              rows={3}
              className={`w-full min-h-[80px] border-none bg-transparent ${isDark ? 'text-gray-300' : 'text-gray-800'} focus:outline-none resize-none`}
              placeholder={t('quiz.questions.questionDescriptionPlaceholder')}
            />
          </div>

          {/* Time and Points */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className={`[font-family:'Poppins',Helvetica] text-sm font-semibold mb-2 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('quiz.questions.timeLimit')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className={`w-20 px-3 py-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <span className="text-xs">{t('quiz.questions.timeLimitUnit')}</span>
              </div>
            </div>
            <div>
              <label className={`[font-family:'Poppins',Helvetica] text-sm font-semibold mb-2 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('quiz.questions.points')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  className={`w-20 px-3 py-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <span className="text-xs">{t('quiz.questions.pointsUnit')}</span>
              </div>
            </div>
          </div>

          {/* Options rendering based on type */}
          {selectedType === 'image_choice' ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('quiz.questions.options.addImage')}
                </label>
                <span className="text-xs text-gray-500">{t('quiz.questions.options.maxImages')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <div className={`aspect-square rounded-lg border-2 flex items-center justify-center overflow-hidden ${
                      img ? 'border-solid' : 'border-dashed'
                    } ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      {imagePreviews[idx] ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={imagePreviews[idx]} 
                            alt={`Option ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImages = [...images];
                              const newPreviews = [...imagePreviews];
                              newImages[idx] = null;
                              newPreviews[idx] = '';
                              setImages(newImages);
                              setImagePreviews(newPreviews);
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-500">{t('quiz.questions.options.chooseImage')}</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const newImages = [...images];
                                const newPreviews = [...imagePreviews];
                                newImages[idx] = file;
                                newPreviews[idx] = URL.createObjectURL(file);
                                setImages(newImages);
                                setImagePreviews(newPreviews);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                    <button
                      onClick={() => setCorrectAnswer([idx])}
                      className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-2 ${
                        correctAnswer.includes(idx) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                      }`}
                    >
                      {correctAnswer.includes(idx) && <Check className="w-4 h-4 text-white mx-auto" />}
                    </button>
                    {correctAnswer.includes(idx) && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-500 text-white text-xs">{t('quiz.questions.options.correctAnswer')}</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : selectedType === 'true_false' ? (
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setCorrectAnswer([0])}
                className={`flex-1 p-6 rounded-lg border-2 transition-all ${
                  correctAnswer.includes(0)
                    ? 'border-green-500 bg-green-50'
                    : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${correctAnswer.includes(0) ? 'text-green-600' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('quiz.questions.options.true')}
                  </div>
                  {correctAnswer.includes(0) && (
                    <Check className="w-6 h-6 text-green-600 mx-auto" />
                  )}
                </div>
              </button>
              <button
                onClick={() => setCorrectAnswer([1])}
                className={`flex-1 p-6 rounded-lg border-2 transition-all ${
                  correctAnswer.includes(1)
                    ? 'border-red-500 bg-red-50'
                    : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${correctAnswer.includes(1) ? 'text-red-600' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('quiz.questions.options.false')}
                  </div>
                  {correctAnswer.includes(1) && (
                    <Check className="w-6 h-6 text-red-600 mx-auto" />
                  )}
                </div>
              </button>
            </div>
          ) : selectedType === 'free_text' ? (
            <div className={`rounded-[5px] border border-dashed p-6 mb-6 ${isDark ? 'bg-gray-750 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('quiz.questions.options.freeTextNote')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  {selectedType === 'ranking' ? (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-white" style={{ backgroundColor: '#9b59b6' }}>
                      {index + 1}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (selectedType === 'single_choice') {
                          setCorrectAnswer([index]);
                        } else {
                          setCorrectAnswer(prev => 
                            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                          );
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        correctAnswer.includes(index) 
                          ? 'bg-blue-500 border-blue-500' 
                          : isDark ? 'border-gray-500' : 'border-gray-300'
                      }`}
                    >
                      {correctAnswer.includes(index) && (
                        selectedType === 'single_choice' ? (
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                        ) : (
                          <Check className="w-4 h-4 text-white" />
                        )
                      )}
                    </button>
                  )}
                  
                  <input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg border ${
                      correctAnswer.includes(index)
                        ? 'border-blue-500 bg-blue-50'
                        : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                    placeholder={`Option ${index + 1}`}
                  />
                  
                  {correctAnswer.includes(index) && selectedType !== 'ranking' && (
                    <Badge className="bg-blue-100 text-blue-600 px-3 py-1">{t('quiz.questions.options.correctAnswer')}</Badge>
                  )}
                  
                  <button
                    onClick={() => {
                      setOptions(options.filter((_, i) => i !== index));
                      setCorrectAnswer(correctAnswer.filter(i => i !== index).map(i => i > index ? i - 1 : i));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => setOptions([...options, `${t('quiz.questions.options.option')} ${options.length + 1}`])}
                className={`w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 ${
                  isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t('quiz.questions.options.addOption')}</span>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button className="text-red-500 text-sm flex items-center gap-2">
              🗑️ {t('quiz.questions.delete')}
            </button>
            <Button
              onClick={handleSaveQuestion}
              disabled={saving}
              className="px-8 py-3 rounded-[10px] text-white font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? t('quiz.questions.saving') : t('quiz.questions.validate')}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Questions List */}
      <div>
        <Card className={`rounded-[18px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-base ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                {t('quiz.questions.list')} ({questions.length})
              </h3>
              <button
                onClick={handleResetForm}
                className="text-blue-500 text-sm flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('quiz.questions.add')}
              </button>
            </div>

            <div className="space-y-2">
              {questions.map((q, index) => (
                <div
                  key={q.uuid}
                  className={`p-4 rounded-[10px] border cursor-move hover:shadow transition-all ${
                    isDark ? 'border-gray-700 bg-gray-750 hover:border-gray-600' : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                          {index + 1}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {q.title}
                        </span>
                      </div>
                      <Badge 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: questionTypes.find(t => t.value === q.question_type?.key)?.color + '20',
                          color: questionTypes.find(t => t.value === q.question_type?.key)?.color
                        }}
                      >
                        {q.question_type?.title}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.uuid)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {questions.length > 0 && (
              <button
                className="w-full mt-6 py-3 rounded-[10px] text-white font-medium"
                style={{ backgroundColor: primaryColor }}
                onClick={onComplete}
              >
                Valider ✓
              </button>
            )}

            {questions.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">{t('quiz.questions.noQuestions')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('quiz.questions.noQuestionsDescription')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
