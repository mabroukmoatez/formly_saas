import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { courseCreation } from '../../services/courseCreation';
import { Questionnaire } from '../../services/courseCreation.types';
import { 
  File, 
  Trash2, 
  Users,
  Library,
  Eye,
  X,
  Download,
  Plus,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  CheckCircle,
  BarChart3,
  MessageSquare,
  Edit3
} from 'lucide-react';

interface QuestionnaireTemplate {
  uuid: string;
  name: string;
  description: string;
  category: 'satisfaction' | 'evaluation' | 'feedback' | 'assessment';
  target_audience: string[];
  questions: any[];
  is_active: boolean;
}

interface CSVImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors: string[];
  warnings: string[];
}

interface QuestionnaireResponse {
  uuid: string;
  questionnaire_id: string;
  user_id: string;
  user_type: 'apprenant' | 'formateur' | 'entreprise';
  responses: any;
  completed_at: string;
}

export const Step4Questionnaire: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  // Use CourseCreationContext
  const {
    questionnaires,
    loadQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deleteQuestionnaire,
    formData
  } = useCourseCreation();

  // State for filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'survey' | 'evaluation' | 'feedback' | 'satisfaction'>('all');
  
  // State for modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  
  // State for questionnaire templates
  const [questionnaireTemplates, setQuestionnaireTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [previewQuestionnaire, setPreviewQuestionnaire] = useState<Questionnaire | null>(null);
  
  // State for CSV import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportSettings, setCsvImportSettings] = useState({
    hasHeaders: true,
    delimiter: ',',
    encoding: 'utf-8'
  });
  const [isImporting, setIsImporting] = useState(false);
  
  // State for analytics
  const [questionnaireAnalytics, setQuestionnaireAnalytics] = useState<any>(null);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponse[]>([]);
  
  // State for questionnaire creation form
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'apprenant' as 'apprenant' | 'formateur' | 'entreprise',
    type: 'survey' as 'survey' | 'evaluation' | 'feedback'
  });
  
  // State for question editor
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text',
    is_required: false,
    order_index: 1,
    options: [] as string[] // Add options array
  });

  // Load questionnaires on component mount
  useEffect(() => {
    loadQuestionnaires();
    loadQuestionnaireTemplates();
  }, [loadQuestionnaires]);

  // Helper functions for managing question options
  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const setYesNoOptions = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: ['Oui', 'Non']
    }));
  };

  // Check if question type needs options
  const needsOptions = (questionType: string) => {
    return ['radio', 'checkbox', 'select'].includes(questionType);
  };

  // Load questionnaire templates
  const loadQuestionnaireTemplates = async () => {
    try {
      const response: any = await courseCreation.getQuestionnaireTemplates();
      if (response.success) {
        setQuestionnaireTemplates(response.data.templates || []);
      }
    } catch (error: any) {
      // ('Failed to load questionnaire templates:', error);
      error('Erreur lors du chargement des modèles de questionnaire');
    }
  };

  // Load questionnaire analytics
  const loadQuestionnaireAnalytics = async (questionnaireId: string) => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) return;

      const analyticsResponse: any = await courseCreation.getQuestionnaireAnalytics(courseUuid, questionnaireId);
      if (analyticsResponse.success) {
        setQuestionnaireAnalytics(analyticsResponse.data);
      }

      const responsesResponse: any = await courseCreation.getQuestionnaireResponses(courseUuid, questionnaireId);
      if (responsesResponse.success) {
        setQuestionnaireResponses(responsesResponse.data.responses || []);
      }
    } catch (error: any) {
      // ('Failed to load questionnaire analytics:', error);
      error('Erreur lors du chargement des analyses');
    }
  };

  // Handle questionnaire deletion
  const handleDeleteQuestionnaire = async (id: string) => {
    try {
      const deleted = await deleteQuestionnaire(parseInt(id));
      if (deleted) {
        success('Questionnaire supprimé avec succès');
        loadQuestionnaires(); // Refresh the list
      }
    } catch (error: any) {
      // ('Failed to delete questionnaire:', error);
      error('Erreur lors de la suppression du questionnaire');
    }
  };

  // Handle opening question editor
  const handleEditQuestions = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    setQuestions(questionnaire.questions || []);
    setShowQuestionEditor(true);
  };

  // Handle adding new question
  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      error('Le texte de la question est requis');
      return;
    }

    if (!editingQuestionnaire) {
      error('Aucun questionnaire sélectionné');
      return;
    }

    // Validate options for multiple choice questions
    if (needsOptions(newQuestion.question_type)) {
      const validOptions = newQuestion.options.filter(opt => opt.trim() !== '');
      if (validOptions.length === 0) {
        error('Au moins une option est requise pour ce type de question');
        return;
      }
    }

    try {
      const questionData = {
        question: newQuestion.question_text, // Backend expects 'question' field
        type: newQuestion.question_type, // Backend expects 'type' field
        required: newQuestion.is_required, // Backend expects 'required' field
        order_index: questions.length + 1,
        options: needsOptions(newQuestion.question_type) ? newQuestion.options.filter(opt => opt.trim() !== '') : null,
        validation_rules: null
      };

      const createdQuestion = await createQuestion(editingQuestionnaire.uuid, questionData);
      
      if (createdQuestion) {
        // Add the question to local state for immediate UI update
        const question = {
          ...questionData,
          uuid: createdQuestion.uuid || '',
          questionnaire_id: editingQuestionnaire.uuid,
          created_at: createdQuestion.created_at || '',
          updated_at: createdQuestion.updated_at || ''
        };

        setQuestions([...questions, question]);
        setNewQuestion({
          question_text: '',
          question_type: 'text',
          is_required: false,
          order_index: questions.length + 2,
          options: []
        });
        success('Question ajoutée avec succès');
      }
    } catch (error: any) {
      // ('Failed to add question:', error);
      error('Erreur lors de l\'ajout de la question');
    }
  };

  // Handle removing question
  const handleRemoveQuestion = async (index: number) => {
    if (!editingQuestionnaire) {
      error('Aucun questionnaire sélectionné');
      return;
    }

    const questionToRemove = questions[index];
    if (!questionToRemove || !questionToRemove.uuid) {
      error('Impossible de supprimer cette question');
      return;
    }

    try {
      const deleted = await deleteQuestion(editingQuestionnaire.uuid, questionToRemove.uuid);
      
      if (deleted) {
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
        success('Question supprimée avec succès');
      }
    } catch (error: any) {
      // ('Failed to delete question:', error);
      error('Erreur lors de la suppression de la question');
    }
  };

  // Handle saving questions
  const handleSaveQuestions = async () => {
    try {
      if (!editingQuestionnaire) return;

      // Transform questions to match backend expectations
      const transformedQuestions = questions.map(q => ({
        question: q.question || q.question_text, // Ensure 'question' field exists
        type: q.type || q.question_type, // Ensure 'type' field exists
        required: q.required !== undefined ? q.required : q.is_required, // Ensure 'required' field exists
        order_index: q.order_index,
        options: q.options,
        validation_rules: q.validation_rules,
        uuid: q.uuid,
        questionnaire_id: editingQuestionnaire.uuid,
        created_at: q.created_at || new Date().toISOString(),
        updated_at: q.updated_at || new Date().toISOString()
      }));

      // Update questionnaire with new questions
      const updatedQuestionnaireData = {
        title: editingQuestionnaire.title,
        description: editingQuestionnaire.description,
        category: editingQuestionnaire.category,
        type: editingQuestionnaire.type,
        questions: transformedQuestions
      };

      const updatedQuestionnaire = await updateQuestionnaire(editingQuestionnaire.uuid, updatedQuestionnaireData);
      
      if (updatedQuestionnaire) {
        success('Questions sauvegardées avec succès');
        setShowQuestionEditor(false);
        setEditingQuestionnaire(null);
        setQuestions([]);
        loadQuestionnaires(); // Refresh the list
      }
    } catch (error: any) {
      // ('Failed to save questions:', error);
      error('Erreur lors de la sauvegarde des questions');
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (template: QuestionnaireTemplate) => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) {
        error('UUID du cours non disponible');
        return;
      }

      const response: any = await courseCreation.createQuestionnaireFromTemplate(courseUuid, template.uuid);

      if (response.success) {
        success('Questionnaire créé à partir du modèle');
        setShowTemplateSelector(false);
        loadQuestionnaires();
      }
    } catch (error: any) {
      // ('Failed to create questionnaire from template:', error);
      error('Erreur lors de la création du questionnaire');
    }
  };

  // Handle CSV import
  const handleCSVImport = async (): Promise<CSVImportResult> => {
    try {
      if (!csvFile) {
        throw new Error('Aucun fichier sélectionné');
      }

      setIsImporting(true);
      const courseUuid = formData.courseUuid;
      if (!courseUuid) {
        throw new Error('UUID du cours non disponible');
      }

      const response: any = await courseCreation.importQuestionnaireFromCSV(courseUuid, csvFile, csvImportSettings);
      
      if (response.success) {
        success(`Questionnaire importé avec succès: ${response.data.imported_count} questions`);
        setShowCSVImport(false);
        setCsvFile(null);
        loadQuestionnaires();
        return {
          success: true,
          imported_count: response.data.imported_count || 0,
          failed_count: response.data.failed_count || 0,
          errors: response.data.errors || [],
          warnings: response.data.warnings || []
        };
      } else {
        throw new Error(response.message || 'Erreur lors de l\'import');
      }
    } catch (error: any) {
      // ('Failed to import CSV:', error);
      error('Erreur lors de l\'import CSV');
      return {
        success: false,
        imported_count: 0,
        failed_count: 0,
        errors: [error.message || 'Erreur inconnue'],
        warnings: []
      };
    } finally {
      setIsImporting(false);
    }
  };

  // Handle CSV template download
  const handleDownloadCSVTemplate = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) {
        error('UUID du cours non disponible');
        return;
      }

      const response: any = await courseCreation.getQuestionnaireImportTemplates(courseUuid);
      if (response.success) {
        const template = response.data.template;
        const csvContent = template.content;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questionnaire_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        success('Modèle CSV téléchargé avec succès');
      }
    } catch (error: any) {
      // ('Failed to download CSV template:', error);
      error('Erreur lors du téléchargement du modèle CSV');
    }
  };

  // Handle questionnaire export
  const handleExportQuestionnaire = async (questionnaireId: string) => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) {
        error('UUID du cours non disponible');
        return;
      }

      const response: any = await courseCreation.exportQuestionnaireToCSV(courseUuid, questionnaireId);
      if (response.success) {
        const csvContent = response.data.csv_content;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questionnaire_${questionnaireId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        success('Questionnaire exporté avec succès');
      }
    } catch (error: any) {
      // ('Failed to export questionnaire:', error);
      error('Erreur lors de l\'export du questionnaire');
    }
  };

  // Handle new questionnaire creation
  const handleCreateQuestionnaire = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) {
        error('UUID du cours non disponible');
        return;
      }

      if (!createForm.title.trim()) {
        error('Le titre du questionnaire est requis');
        return;
      }

      const questionnaireData = {
        title: createForm.title,
        description: createForm.description || 'Questionnaire créé automatiquement',
        category: createForm.category,
        type: createForm.type,
        questions: [
          {
            type: 'text',
            question: 'Question par défaut - Veuillez modifier cette question',
            required: false,
            order: 1
          }
        ]
      };
      
      const newQuestionnaire = await createQuestionnaire(questionnaireData);
      if (newQuestionnaire) {
        success('Questionnaire créé avec succès');
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          description: '',
          category: 'apprenant',
          type: 'survey'
        });
        loadQuestionnaires();
      }
    } catch (error: any) {
      // ('Failed to create questionnaire:', error);
      error('Erreur lors de la création du questionnaire');
    }
  };

  // Filter questionnaires
  const filteredQuestionnaires = questionnaires.filter(questionnaire => {
    if (activeFilter === 'all') return true;
    return questionnaire.type === activeFilter;
  });

  // Get filter count
  const getFilterCount = (type: 'all' | 'survey' | 'evaluation' | 'feedback' | 'satisfaction') => {
    if (type === 'all') return questionnaires.length;
    return questionnaires.filter(q => q.type === type).length;
  };

  // Filter options
  const filters = [
    { key: 'all', label: 'Tous', count: getFilterCount('all'), icon: File },
    { key: 'survey', label: 'Enquêtes', count: getFilterCount('survey'), icon: BarChart3 },
    { key: 'evaluation', label: 'Évaluations', count: getFilterCount('evaluation'), icon: CheckCircle },
    { key: 'feedback', label: 'Retours', count: getFilterCount('feedback'), icon: MessageSquare },
    { key: 'satisfaction', label: 'Satisfaction', count: getFilterCount('satisfaction'), icon: Users }
  ];

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor
              }}
            />
            <h1 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Questionnaires et Évaluations
            </h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-6">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
          <Button
                key={filter.key}
                variant={activeFilter === filter.key ? 'default' : 'outline'}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  activeFilter === filter.key
                ? 'text-white' 
                : isDark
                      ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
                style={activeFilter === filter.key ? { backgroundColor: primaryColor } : {}}
          >
                <Icon className="w-4 h-4" />
                {filter.label} {filter.count}
          </Button>
            );
          })}
        </div>

        {/* Import Options */}
        <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor
                  }}
                />
                <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  Options d'Import
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
                onClick={() => setShowCSVImport(true)}
                variant="outline"
                className={`flex items-center gap-3 p-4 h-auto ${
                  isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">Import CSV</div>
                  <div className="text-sm opacity-75">Importer depuis un fichier CSV</div>
                </div>
          </Button>

          <Button
                onClick={() => setShowTemplateSelector(true)}
                variant="outline"
                className={`flex items-center gap-3 p-4 h-auto ${
                  isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
              >
                <Library className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">Modèles prédéfinis</div>
                  <div className="text-sm opacity-75">Utiliser un modèle existant</div>
                </div>
          </Button>

          <Button
                onClick={handleDownloadCSVTemplate}
                variant="outline"
                className={`flex items-center gap-3 p-4 h-auto ${
                  isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
              >
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">Modèle CSV</div>
                  <div className="text-sm opacity-75">Télécharger le modèle</div>
                </div>
          </Button>
        </div>
          </CardContent>
        </Card>

        {/* CSV Import Modal */}
        {showCSVImport && (
          <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
                    style={{
                      backgroundColor: primaryColor,
                      borderColor: primaryColor
                    }}
                  />
                  <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    Import CSV
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCSVImport(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
          </Button>
        </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file" className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Fichier CSV
                  </Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="delimiter" className={`text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Délimiteur
                    </Label>
                    <Select
                      value={csvImportSettings.delimiter}
                      onValueChange={(value) => setCsvImportSettings(prev => ({ ...prev, delimiter: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Virgule (,)</SelectItem>
                        <SelectItem value=";">Point-virgule (;)</SelectItem>
                        <SelectItem value="\t">Tabulation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="encoding" className={`text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Encodage
                    </Label>
                    <Select
                      value={csvImportSettings.encoding}
                      onValueChange={(value) => setCsvImportSettings(prev => ({ ...prev, encoding: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf-8">UTF-8</SelectItem>
                        <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                        <SelectItem value="windows-1252">Windows-1252</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has-headers"
                      checked={csvImportSettings.hasHeaders}
                      onChange={(e) => setCsvImportSettings(prev => ({ ...prev, hasHeaders: e.target.checked }))}
                      className="mr-2"
                    />
                    <Label htmlFor="has-headers" className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Première ligne = en-têtes
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCSVImport(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCSVImport}
                    disabled={!csvFile || isImporting}
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Importer
                      </>
                    )}
                  </Button>
                      </div>
                    </div>
            </CardContent>
          </Card>
        )}

        {/* Questionnaires Grid */}
        <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor
                  }}
                />
                <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  Questionnaires du Cours
                </h2>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                Nouveau questionnaire
              </Button>
            </div>

            {filteredQuestionnaires.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuestionnaires.map((questionnaire) => (
                  <Card
                    key={questionnaire.uuid}
                    className={`transition-all hover:shadow-lg ${
                      isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                        }`}>
                          <FileText className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm line-clamp-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {questionnaire.title}
                          </h3>
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {questionnaire.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${
                              questionnaire.type === 'survey' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                              questionnaire.type === 'evaluation' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              questionnaire.type === 'feedback' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                            }`}>
                              {questionnaire.type === 'survey' ? 'Enquête' :
                               questionnaire.type === 'evaluation' ? 'Évaluation' :
                               questionnaire.type === 'feedback' ? 'Retour' : 'Satisfaction'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {questionnaire.category === 'apprenant' ? 'Apprenant' :
                               questionnaire.category === 'formateur' ? 'Formateur' : 'Entreprise'}
                            </Badge>
                    </div>
                        </div>
                    </div>
                      <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                          onClick={() => {
                            setPreviewQuestionnaire(questionnaire);
                            setShowPreviewModal(true);
                          }}
                          className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                          Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                          onClick={() => handleEditQuestions(questionnaire)}
                          className="flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                          Questions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                          onClick={() => handleExportQuestionnaire(questionnaire.uuid)}
                          className="flex items-center gap-1"
                      >
                          <Download className="w-3 h-3" />
                          Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                          onClick={() => handleDeleteQuestionnaire(questionnaire.uuid)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                          Supprimer
                      </Button>
                    </div>
              </CardContent>
            </Card>
          ))}
                  </div>
            ) : (
              <div className={`text-center py-8 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun questionnaire trouvé pour cette catégorie</p>
                <p className="text-sm mt-2">Créez un nouveau questionnaire ou importez-en un depuis un fichier CSV</p>
                </div>
            )}
              </CardContent>
            </Card>

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                    Sélectionner un modèle de questionnaire
                  </h2>
                <Button
                  variant="ghost"
                  size="icon"
                    onClick={() => setShowTemplateSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {questionnaireTemplates.map((template) => (
                    <Card
                      key={template.uuid}
                      onClick={() => handleTemplateSelect(template)}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                          }`}>
                            <FileText className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-sm line-clamp-2 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {template.name}
                            </h3>
                            <p className={`text-xs mt-1 line-clamp-2 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                              {template.description}
                            </p>
                            <div className="flex gap-1 mt-2">
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                {template.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.target_audience?.join(', ') || 'Multi-audience'}
                              </Badge>
                            </div>
                          </div>
              </div>
            </CardContent>
          </Card>
                  ))}
        </div>

                {questionnaireTemplates.length === 0 && (
                  <div className={`text-center py-8 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Aucun modèle de questionnaire disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && previewQuestionnaire && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                    Aperçu du questionnaire
                  </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
                <div className="mb-4">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {previewQuestionnaire.title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {previewQuestionnaire.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {previewQuestionnaire.questions?.map((question: any, index: number) => (
                    <Card key={index} className={`${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {question.question || question.question_text}
                            </h4>
                            <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                              Type: {question.type || question.question_type} | 
                              Requis: {question.required || question.is_required ? 'Oui' : 'Non'}
                  </p>
                </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                    Fermer
                </Button>
                <Button
                    onClick={() => handleExportQuestionnaire(previewQuestionnaire.uuid)}
                  style={{ backgroundColor: primaryColor }}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                </Button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Question Editor Modal */}
        {showQuestionEditor && editingQuestionnaire && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                    Éditer les questions - {editingQuestionnaire.title}
                  </h2>
                <Button
                  variant="ghost"
                  size="icon"
                    onClick={() => {
                      setShowQuestionEditor(false);
                      setEditingQuestionnaire(null);
                      setQuestions([]);
                    }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
                {/* Add New Question Form */}
                <Card className={`mb-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-4">
                    <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Ajouter une nouvelle question
                    </h3>
              <div className="space-y-4">
                      <div>
                        <Label htmlFor="question-text" className={`text-sm font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Texte de la question *
                        </Label>
                        <Input
                          id="question-text"
                          value={newQuestion.question_text}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                          placeholder="Entrez le texte de la question"
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="question-type" className={`text-sm font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Type de question
                          </Label>
                          <Select
                            value={newQuestion.question_type}
                            onValueChange={(value) => setNewQuestion(prev => ({ ...prev, question_type: value, options: [] }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texte</SelectItem>
                              <SelectItem value="textarea">Texte long</SelectItem>
                              <SelectItem value="radio">Choix unique</SelectItem>
                              <SelectItem value="checkbox">Choix multiples</SelectItem>
                              <SelectItem value="select">Liste déroulante</SelectItem>
                              <SelectItem value="rating">Évaluation</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="file">Fichier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="question-required"
                            checked={newQuestion.is_required}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, is_required: e.target.checked }))}
                            className="mr-2"
                          />
                          <Label htmlFor="question-required" className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Question obligatoire
                          </Label>
                        </div>
                      </div>

                      {/* Options for multiple choice questions */}
                      {needsOptions(newQuestion.question_type) && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Label className={`text-sm font-medium ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Options de réponse
                            </Label>
                            <div className="flex gap-2">
                              {newQuestion.question_type === 'radio' && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={setYesNoOptions}
                                  className="text-xs"
                                >
                                  Oui/Non
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                className="text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Ajouter option
                              </Button>
                            </div>
                          </div>
                          
                          {newQuestion.options.length > 0 ? (
                            <div className="space-y-2">
                              {newQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`text-sm text-center py-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Aucune option définie. Cliquez sur "Ajouter option" pour commencer.
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={handleAddQuestion}
                        className="flex items-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                        disabled={needsOptions(newQuestion.question_type) && newQuestion.options.length === 0}
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter la question
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions List */}
                <div className="space-y-4 mb-6">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Questions ({questions.length})
                  </h3>
                  
                  {questions.length > 0 ? (
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <Card key={index} className={`${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                    {index + 1}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {question.question_type}
                                  </Badge>
                                  {question.is_required && (
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                      Obligatoire
                                    </Badge>
                                  )}
                                </div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {question.question_text}
                                </p>
                                
                                {/* Display options for multiple choice questions */}
                                {question.options && question.options.length > 0 && (
                                  <div className="mt-2">
                                    <p className={`text-sm font-medium mb-1 ${
                                      isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                      Options :
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {question.options.map((option: string, optionIndex: number) => (
                                        <Badge 
                                          key={optionIndex} 
                                          variant="secondary" 
                                          className="text-xs"
                                        >
                                          {option}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                  </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveQuestion(index)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 ml-4"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Aucune question ajoutée</p>
                      <p className="text-sm mt-2">Ajoutez des questions pour créer votre questionnaire</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuestionEditor(false);
                      setEditingQuestionnaire(null);
                      setQuestions([]);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveQuestions}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Sauvegarder les questions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-2xl rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Créer un nouveau questionnaire
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({
                        title: '',
                        description: '',
                        category: 'apprenant',
                        type: 'survey'
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className={`text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Titre du questionnaire *
                    </Label>
                    <Input
                      id="title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Entrez le titre du questionnaire"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className={`text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Description
                    </Label>
                    <textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Entrez la description du questionnaire"
                      className="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Catégorie
                      </Label>
                      <Select
                        value={createForm.category}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value as any }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apprenant">Apprenant</SelectItem>
                          <SelectItem value="formateur">Formateur</SelectItem>
                          <SelectItem value="entreprise">Entreprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type" className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Type
                      </Label>
                      <Select
                        value={createForm.type}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="survey">Enquête</SelectItem>
                          <SelectItem value="evaluation">Évaluation</SelectItem>
                          <SelectItem value="feedback">Retour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({
                        title: '',
                        description: '',
                        category: 'apprenant',
                        type: 'survey'
                      });
                    }}
                  >
                    Annuler
                </Button>
                <Button
                    onClick={handleCreateQuestionnaire}
                  style={{ backgroundColor: primaryColor }}
                >
                    Créer le questionnaire
                </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};