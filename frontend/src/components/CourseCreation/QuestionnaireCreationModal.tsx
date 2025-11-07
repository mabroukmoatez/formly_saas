import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Check, AlertCircle, Plus, Save, Loader2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { VariableSelector } from './VariableSelector';

interface QuestionnaireTemplate {
  id: number;
  name: string;
  description?: string;
  type: string;
  content?: string;
  fields?: Record<string, string>;
  is_active: boolean;
}

type QuestionnaireType = 'pre_course' | 'post_course' | 'mid_course' | 'custom';
type CreationMode = 'builder' | 'template';
type QuestionType = 'text' | 'multiple_choice' | 'rating' | 'yes_no';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  required: boolean;
}

interface QuestionnaireCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionnaireData: any) => Promise<void>;
  courseUuid: string;
  templates?: QuestionnaireTemplate[];
}

export const QuestionnaireCreationModal: React.FC<QuestionnaireCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseUuid,
  templates = []
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [creationMode, setCreationMode] = useState<CreationMode>('builder');
  const [questionnaireType, setQuestionnaireType] = useState<QuestionnaireType>('pre_course');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [dynamicVariables, setDynamicVariables] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCreationMode('builder');
      setQuestionnaireType('pre_course');
      setName('');
      setDescription('');
      setSelectedTemplate(null);
      setTemplateVariables({});
      setDynamicVariables({});
      setQuestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template?.fields) {
        const initialVars: Record<string, string> = {};
        Object.keys(template.fields).forEach(key => {
          initialVars[key] = '';
        });
        setTemplateVariables(initialVars);
      }
    }
  }, [selectedTemplate, templates]);

  const addQuestion = (type: QuestionType = 'text') => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      question: '',
      required: true
    };
    if (type === 'multiple_choice') {
      newQuestion.options = ['Option 1', 'Option 2'];
    }
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options && q.options.length > 2) {
        return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Erreur', 'Le nom du questionnaire est requis');
      return;
    }

    if (creationMode === 'template' && !selectedTemplate) {
      showError('Erreur', 'Veuillez sélectionner un template');
      return;
    }

    if (creationMode === 'builder' && questions.length === 0) {
      showError('Erreur', 'Veuillez ajouter au moins une question');
      return;
    }

    setSaving(true);
    try {
      const questionnaireData: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        audience_type: 'students',
        is_certificate: false,
        questionnaire_type: questionnaireType,
      };

      if (creationMode === 'template') {
        questionnaireData.document_type = 'template';
        questionnaireData.template_id = selectedTemplate;
        questionnaireData.variables = {
          ...templateVariables,
          ...dynamicVariables
        };
      } else {
        questionnaireData.document_type = 'custom_builder';
        
        const formattedQuestions = questions.map((q, idx) => ({
          id: idx + 1,
          type: q.type,
          question: q.question,
          options: q.options || undefined,
          required: q.required,
          order: idx
        }));
        
        questionnaireData.questions = formattedQuestions;
        
        let htmlContent = `<h1>${name}</h1>`;
        if (description) {
          htmlContent += `<p>${description}</p>`;
        }
        htmlContent += '<div style="margin-top: 30px;">';
        formattedQuestions.forEach((q, idx) => {
          htmlContent += `
            <div style="margin-bottom: 20px;">
              <p><strong>${idx + 1}. ${q.question}</strong> ${q.required ? '<span style="color: red;">*</span>' : ''}</p>
              ${q.type === 'multiple_choice' && q.options ? 
                q.options.map(opt => `<p style="margin-left: 20px;">☐ ${opt}</p>`).join('') 
                : ''}
              ${q.type === 'rating' ? '<p style="margin-left: 20px;">☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5</p>' : ''}
              ${q.type === 'yes_no' ? '<p style="margin-left: 20px;">☐ Oui  ☐ Non</p>' : ''}
              ${q.type === 'text' ? '<p style="margin-left: 20px;">_____________________________</p>' : ''}
            </div>
          `;
        });
        htmlContent += '</div>';
        
        questionnaireData.custom_template = {
          pages: [{ page: 1, content: htmlContent }],
          total_pages: 1
        };
        
        if (Object.keys(dynamicVariables).length > 0) {
          questionnaireData.variables = dynamicVariables;
        }
        
        questionnaireData.is_questionnaire = true;
      }

      await onSave(questionnaireData);
      showSuccess('Questionnaire créé avec succès');
      onClose();
    } catch (err: any) {
      console.error('Error creating questionnaire:', err);
      showError('Erreur', err.message || 'Impossible de créer le questionnaire');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedTemplateData = selectedTemplate ? templates.find(t => t.id === selectedTemplate) : null;

  const questionnaireTypes = [
    { value: 'pre_course' as QuestionnaireType, label: 'Pré-formation', icon: '📋', desc: 'Évaluation avant le cours' },
    { value: 'post_course' as QuestionnaireType, label: 'Post-formation', icon: '✅', desc: 'Feedback après le cours' },
    { value: 'mid_course' as QuestionnaireType, label: 'Mi-parcours', icon: '📊', desc: 'Suivi intermédiaire' },
    { value: 'custom' as QuestionnaireType, label: 'Personnalisé', icon: '⚙️', desc: 'Questionnaire sur mesure' }
  ];

  const questionTypes = [
    { value: 'text' as QuestionType, label: 'Texte libre', icon: '📝' },
    { value: 'multiple_choice' as QuestionType, label: 'Choix multiple', icon: '☑️' },
    { value: 'rating' as QuestionType, label: 'Notation (1-5)', icon: '⭐' },
    { value: 'yes_no' as QuestionType, label: 'Oui/Non', icon: '❓' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-[90%] max-w-[1400px] h-[90vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}>
        {/* Header Actions */}
        <div className={`flex items-center justify-between px-10 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              onClick={onClose}
            >
              <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
            <div>
              <h2 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Créer un Questionnaire
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Configurez votre questionnaire d'évaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={saving}
              className={`h-auto inline-flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-300' : 'bg-[#e5f3ff] hover:bg-[#cce5ff] text-[#007aff]'} rounded-[53px]`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span className="font-medium text-xs">Enregistrer Le Questionnaire</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-97px)] overflow-hidden">
          {/* Left Sidebar - Configuration */}
          <div className={`w-[380px] border-r overflow-y-auto px-10 py-8 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex flex-col gap-8">
              {/* Mode de Création */}
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <Label className={`text-xs font-medium mb-3 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Mode de Création
                </Label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'builder' as CreationMode, label: 'Builder Custom', desc: 'Créer vos questions' },
                    { value: 'template' as CreationMode, label: 'Depuis Template', desc: 'Utiliser un template' }
                  ].map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => setCreationMode(mode.value)}
                      className={`p-3 rounded-[5px] border text-left transition-all ${
                        creationMode === mode.value
                          ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                          : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {mode.label}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type de Questionnaire */}
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <Label className={`text-xs font-medium mb-3 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Type de Questionnaire <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-col gap-2">
                  {questionnaireTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setQuestionnaireType(type.value)}
                      className={`p-3 rounded-[5px] border text-left transition-all ${
                        questionnaireType === type.value
                          ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                          : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {type.icon} {type.label}
                        </span>
                        {questionnaireType === type.value && <Check className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className="mb-4">
                  <Label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nom du Questionnaire <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Questionnaire de satisfaction"
                    className={`font-semibold text-sm border-0 p-0 ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                  />
                </div>
                <div>
                  <Label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description du questionnaire..."
                    rows={3}
                    className={`min-h-[80px] text-sm border-none ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-transparent'}`}
                  />
                </div>
              </div>

              {/* Template Variables */}
              {creationMode === 'template' && selectedTemplateData && selectedTemplateData.fields && (
                <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                  <h4 className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Paramètres du Template
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(selectedTemplateData.fields).map(([key, type]) => (
                      <div key={key}>
                        <Label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {key.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
                          value={templateVariables[key] || ''}
                          onChange={(e) => setTemplateVariables({ ...templateVariables, [key]: e.target.value })}
                          placeholder={`Entrer ${key.replace(/_/g, ' ')}`}
                          className={`font-normal text-sm ${isDark ? 'text-white bg-gray-700' : 'text-gray-800'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Variables Selector */}
              {creationMode === 'template' && (
                <VariableSelector
                  selectedVariables={dynamicVariables}
                  onVariablesChange={setDynamicVariables}
                />
              )}
            </div>
          </div>

          {/* Main Content - Questions or Template Selection */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            {creationMode === 'template' ? (
              /* Template Selection */
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Sélectionnez un Template
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {templates.filter(t => t.is_active).length === 0 ? (
                    <div className={`col-span-2 text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucun template disponible
                    </div>
                  ) : (
                    templates.filter(t => t.is_active).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-6 rounded-[10px] border-2 transition-all text-left ${
                          selectedTemplate === t.id
                            ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                            : isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileSpreadsheet className="w-6 h-6" style={selectedTemplate === t.id ? { color: primaryColor } : {}} />
                          <div className="flex-1">
                            <div className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {t.name}
                            </div>
                            {t.description && (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.description}</p>
                            )}
                          </div>
                          {selectedTemplate === t.id && <Check className="w-5 h-5 text-blue-500" />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Questions Builder */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Questions ({questions.length})
                  </h3>
                </div>

                {/* Questions List */}
                <div className="space-y-4 mb-6">
                  {questions.length === 0 ? (
                    <div className={`text-center py-12 rounded-[10px] border-2 border-dashed ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Aucune question pour le moment</p>
                      <p className="text-sm mt-1">Utilisez les boutons ci-dessous pour ajouter des questions</p>
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <div
                        key={question.id}
                        className={`p-6 rounded-[10px] border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2">
                            <GripVertical className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`font-bold text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {index + 1}.
                            </span>
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            {/* Question Type */}
                            <div className="flex items-center gap-2">
                              <Label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Type :</Label>
                              <select
                                value={question.type}
                                onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                                className={`px-2 py-1 rounded text-xs border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                              >
                                {questionTypes.map(qt => (
                                  <option key={qt.value} value={qt.value}>{qt.icon} {qt.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Question Text */}
                            <Input
                              value={question.question}
                              onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                              placeholder="Entrez votre question..."
                              className={`font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                            />

                            {/* Options for multiple choice */}
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="ml-6 space-y-2">
                                <Label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Options :</Label>
                                {question.options.map((option, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(question.id, optIdx, e.target.value)}
                                      placeholder={`Option ${optIdx + 1}`}
                                      className={`flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                    />
                                    {question.options && question.options.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(question.id, optIdx)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <X className="w-4 h-4 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(question.id)}
                                  className="gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Ajouter une option
                                </Button>
                              </div>
                            )}

                            {/* Required checkbox */}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`required-${question.id}`}
                                checked={question.required}
                                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <Label htmlFor={`required-${question.id}`} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Question obligatoire
                              </Label>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(question.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Question Buttons - Design Pattern Facture */}
                <div className="flex items-center justify-center">
                  <div className={`inline-flex flex-col items-center gap-2 px-3 py-3 rounded-[60px] border border-solid shadow-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#007aff]'}`}>
                    <div className="inline-flex items-start gap-[18px] flex-wrap justify-center">
                      {questionTypes.map((qt) => (
                        <Button
                          key={qt.value}
                          variant="ghost"
                          onClick={() => addQuestion(qt.value)}
                          className={`h-auto inline-flex items-center gap-2 px-6 py-3 rounded-[53px] ${isDark ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-300' : 'bg-[#e5f3ff] hover:bg-[#cce5ff] text-[#007aff]'}`}
                        >
                          <Plus className="w-5 h-5" />
                          <span className={`font-medium text-xs ${isDark ? 'text-blue-300' : 'text-[#007aff]'}`}>
                            {qt.icon} {qt.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
