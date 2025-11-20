import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Eye, 
  Check, 
  Plus, 
  Trash2, 
  ChevronDown,
  GripVertical,
  ArrowLeft,
  Copy,
  X,
  Loader2,
  Save,
  Info,
  List,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  Indent,
  Outdent,
  Link,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  Palette
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { courseCreation } from '../../services/courseCreation';
import { sessionCreation } from '../../services/sessionCreation';
import { DocumentRichTextEditor } from '../../components/CourseCreation/DocumentRichTextEditor';

type QuestionType = 
  | 'single_choice'      // Réponse simple (radio)
  | 'multiple_choice'    // Réponse multiple (checkbox)
  | 'short_text'         // Réponse courte
  | 'long_text'          // Paragraphe
  | 'dropdown'          // Liste déroulante
  | 'table'             // Grille/Tableau
  | 'recommendation'    // Question de recommandation
  | 'pedagogy';         // Pédagogie (section d'info)

interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionTableColumn {
  id: string;
  label: string;
}

interface QuestionTableRow {
  id: string;
  cells: string[];
}

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options?: QuestionOption[];           // Pour single_choice, multiple_choice, dropdown
  tableColumns?: QuestionTableColumn[];  // Pour table
  tableRows?: QuestionTableRow[];       // Pour table
  content?: string;                      // Pour pedagogy (HTML)
}

interface QuestionnaireCreationContentProps {
  courseUuid?: string;
  sessionUuid?: string;
}

export const QuestionnaireCreationContent: React.FC<QuestionnaireCreationContentProps> = ({ courseUuid: propCourseUuid, sessionUuid: propSessionUuid }) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();
  const { subdomain } = useSubdomainNavigation();
  const { courseUuid: paramCourseUuid } = useParams();
  const [searchParams] = useSearchParams();
  
  const courseUuid = propCourseUuid || paramCourseUuid || searchParams.get('courseUuid');
  const sessionUuid = propSessionUuid || searchParams.get('sessionUuid');
  const primaryColor = organization?.primary_color || '#2196F3';

  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [questionnaireDescription, setQuestionnaireDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAddQuestionMenu, setShowAddQuestionMenu] = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const questionTypeLabels: Record<QuestionType, string> = {
    single_choice: 'Réponse simple',
    multiple_choice: 'Réponse multiple',
    short_text: 'Réponse courte',
    long_text: 'Paragraphe',
    dropdown: 'Liste déroulante',
    table: 'Grille/Tableau',
    recommendation: 'Question de recommandation',
    pedagogy: 'Pédagogie'
  };

  const addQuestion = (type: QuestionType, insertAfterId?: string) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      question: '',
      required: false,
      ...(type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown' ? {
        options: [
          { id: `opt-${Date.now()}-1`, text: 'Option 1' },
          { id: `opt-${Date.now()}-2`, text: 'Option 2' }
        ]
      } : {}),
      ...(type === 'table' ? {
        tableColumns: [
          { id: `col-${Date.now()}-1`, label: 'Texte' },
          { id: `col-${Date.now()}-2`, label: 'Texte' }
        ],
        tableRows: [
          { id: `row-${Date.now()}-1`, cells: ['', ''] }
        ]
      } : {}),
      ...(type === 'pedagogy' ? {
        content: ''
      } : {})
    };

    if (insertAfterId) {
      const index = questions.findIndex(q => q.id === insertAfterId);
      if (index !== -1) {
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        setQuestions(newQuestions);
      } else {
        setQuestions([...questions, newQuestion]);
      }
    } else {
      setQuestions([...questions, newQuestion]);
    }
    setShowAddQuestionMenu(null);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const duplicated: Question = {
        ...question,
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: `${question.question} (copie)`,
        ...(question.options ? {
          options: question.options.map(opt => ({
            id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: opt.text
          }))
        } : {}),
        ...(question.tableColumns && question.tableRows ? {
          tableColumns: question.tableColumns.map(col => ({
            id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: col.label
          })),
          tableRows: question.tableRows.map(row => ({
            id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            cells: [...row.cells]
          }))
        } : {})
      };
      const index = questions.findIndex(q => q.id === id);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, duplicated);
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOption: QuestionOption = {
        id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: ''
      };
      updateQuestion(questionId, {
        options: [...question.options, newOption]
      });
    }
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: question.options.map(opt => opt.id === optionId ? { ...opt, text } : opt)
      });
    }
  };

  const deleteOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 1) {
      updateQuestion(questionId, {
        options: question.options.filter(opt => opt.id !== optionId)
      });
    }
  };

  const moveOption = (questionId: string, optionId: string, direction: 'up' | 'down') => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const index = question.options.findIndex(opt => opt.id === optionId);
      if (index === -1) return;
      
      const newOptions = [...question.options];
      if (direction === 'up' && index > 0) {
        [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
      } else if (direction === 'down' && index < newOptions.length - 1) {
        [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
      }
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const addTableColumn = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.tableColumns) {
      const newColumn: QuestionTableColumn = {
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: 'Texte'
      };
      updateQuestion(questionId, {
        tableColumns: [...question.tableColumns, newColumn],
        tableRows: question.tableRows?.map(row => ({
          ...row,
          cells: [...row.cells, '']
        })) || []
      });
    }
  };

  const updateTableColumn = (questionId: string, columnId: string, label: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.tableColumns) {
      updateQuestion(questionId, {
        tableColumns: question.tableColumns.map(col => col.id === columnId ? { ...col, label } : col)
      });
    }
  };

  const deleteTableColumn = (questionId: string, columnId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.tableColumns && question.tableColumns.length > 1) {
      const columnIndex = question.tableColumns.findIndex(col => col.id === columnId);
      updateQuestion(questionId, {
        tableColumns: question.tableColumns.filter(col => col.id !== columnId),
        tableRows: question.tableRows?.map(row => ({
          ...row,
          cells: row.cells.filter((_, idx) => idx !== columnIndex)
        })) || []
      });
    }
  };

  const addTableRow = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.tableColumns) {
      const newRow: QuestionTableRow = {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cells: question.tableColumns.map(() => '')
      };
      updateQuestion(questionId, {
        tableRows: [...(question.tableRows || []), newRow]
      });
    }
  };

  const updateTableCell = (questionId: string, rowId: string, columnIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.tableRows) {
      updateQuestion(questionId, {
        tableRows: question.tableRows.map(row => 
          row.id === rowId 
            ? { ...row, cells: row.cells.map((cell, idx) => idx === columnIndex ? value : cell) }
            : row
        )
      });
    }
  };

  const deleteTableRow = (questionId: string, rowId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.tableRows) {
      updateQuestion(questionId, {
        tableRows: question.tableRows.filter(row => row.id !== rowId)
      });
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedQuestionId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedQuestionId && draggedQuestionId !== targetId) {
      const draggedIndex = questions.findIndex(q => q.id === draggedQuestionId);
      const targetIndex = questions.findIndex(q => q.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newQuestions = [...questions];
        const [removed] = newQuestions.splice(draggedIndex, 1);
        newQuestions.splice(targetIndex, 0, removed);
        setQuestions(newQuestions);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedQuestionId(null);
  };

  const handleSave = async () => {
    if (!courseUuid && !sessionUuid) {
      showError('Erreur', 'UUID du cours ou de la session manquant');
      return;
    }

    if (!questionnaireTitle.trim()) {
      showError('Erreur', 'Veuillez saisir un titre de questionnaire');
      return;
    }

    if (!questions || questions.length === 0) {
      showError('Erreur', 'Veuillez ajouter au moins une question');
      return;
    }

    try {
      setSaving(true);

      if (sessionUuid) {
        // For sessions, use FormData with createDocumentEnhanced
        const formDataToSend = new FormData();
        formDataToSend.append('name', questionnaireTitle.trim());
        formDataToSend.append('document_type', 'custom_builder');
        formDataToSend.append('audience_type', 'students');
        formDataToSend.append('is_certificate', '0');
        formDataToSend.append('is_questionnaire', '1');
        formDataToSend.append('questionnaire_type', 'custom');
        
        if (questionnaireDescription.trim()) {
          formDataToSend.append('description', questionnaireDescription.trim());
        }

        const customTemplate = {
          pages: [{ page: 1, content: '' }],
          total_pages: 1,
          fields: []
        };

        formDataToSend.append('custom_template', JSON.stringify(customTemplate));
        formDataToSend.append('questions', JSON.stringify(questions.map((q, index) => ({
          order: index + 1,
          type: q.type,
          question: q.question,
          required: q.required,
          ...(q.options && { options: q.options.map(opt => opt.text) }),
          ...(q.tableColumns && q.tableRows && {
            table_columns: q.tableColumns.map(col => col.label),
            table_rows: q.tableRows.map(row => row.cells)
          }),
          ...(q.content && { content: q.content })
        }))));

        const response = await sessionCreation.createDocumentEnhanced(sessionUuid, formDataToSend);
        
        if (response.success) {
          showSuccess('Questionnaire créé avec succès');
          if (window.opener) {
            setTimeout(() => window.close(), 1500);
          } else {
            handleBack();
          }
        } else {
          showError('Erreur', response.message || 'Impossible de créer le questionnaire');
        }
      } else {
        // For courses, use the existing method
        const questionnaireData = {
          title: questionnaireTitle.trim(),
          description: questionnaireDescription.trim() || null,
          questionnaire_type: 'custom',
          questions: questions.map((q, index) => ({
            order: index + 1,
            type: q.type,
            question: q.question,
            required: q.required,
            ...(q.options && { options: q.options.map(opt => opt.text) }),
            ...(q.tableColumns && q.tableRows && {
              table_columns: q.tableColumns.map(col => col.label),
              table_rows: q.tableRows.map(row => row.cells)
            }),
            ...(q.content && { content: q.content })
          }))
        };

        const response = await courseCreation.createQuestionnaire(courseUuid!, questionnaireData);
        
        if (response.success) {
          showSuccess('Questionnaire créé avec succès');
          if (window.opener) {
            setTimeout(() => window.close(), 1500);
          } else {
            handleBack();
          }
        } else {
          showError('Erreur', response.message || 'Impossible de créer le questionnaire');
        }
      }
    } catch (error: any) {
      console.error('Error creating questionnaire:', error);
      showError('Erreur', error.message || 'Impossible de créer le questionnaire');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      if (sessionUuid) {
        if (subdomain) {
          navigate(`/${subdomain}/session-creation/${sessionUuid}?step=4`);
        } else {
          navigate(`/session-creation/${sessionUuid}?step=4`);
        }
      } else if (courseUuid) {
        if (subdomain) {
          navigate(`/${subdomain}/course-creation?courseUuid=${courseUuid}&step=4`);
        } else {
          navigate(`/course-creation?courseUuid=${courseUuid}&step=4`);
        }
      }
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.question-menu') && !target.closest('.type-menu')) {
        setShowAddQuestionMenu(null);
        setShowTypeMenu({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
      <div className="flex flex-col w-full px-6 py-6">
        {/* En-tête de la page */}
        <div className={`sticky top-0 z-40 flex items-center justify-between py-4 mb-6 border-b ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                Créer un questionnaire
              </h1>
              <p 
                className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
              >
                Configurez votre questionnaire personnalisé
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className={`h-auto px-4 py-2 rounded-md ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Aperçu questionnaire
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-auto px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Valider
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex justify-center">
          <div className="w-full max-w-[1200px]">
            {/* Zone Questionnaire Principal */}
            <div className={`rounded-lg shadow-sm border p-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* En-tête du Questionnaire */}
              <div className="mb-8">
                {/* Logo et Nom organisme */}
                <div className="flex items-center gap-3 mb-8">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    {organization?.organization_logo ? (
                      <img 
                        src={organization.organization_logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className={`text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {organization?.organization_name || 'Nom de l\'organisme de votre entreprise'}
                  </div>
                </div>

                {/* Titre et Description */}
                <div className="text-center mb-4">
                  <Input
                    value={questionnaireTitle}
                    onChange={(e) => setQuestionnaireTitle(e.target.value)}
                    placeholder="Titre"
                    className={`text-center text-lg font-semibold border-0 border-b-2 rounded-none focus:ring-0 p-0 pb-2 mb-3 ${
                      isDark 
                        ? 'bg-transparent text-gray-200 border-gray-600 focus:border-blue-500' 
                        : 'bg-transparent text-gray-700 border-gray-300 focus:border-blue-500'
                    }`}
                    style={{ fontSize: '18px', fontWeight: 600 }}
                  />
                  <Input
                    value={questionnaireDescription}
                    onChange={(e) => setQuestionnaireDescription(e.target.value)}
                    placeholder="Description"
                    className={`text-center text-sm border-0 border-b-2 rounded-none focus:ring-0 p-0 pb-2 ${
                      isDark 
                        ? 'bg-transparent text-gray-400 border-gray-600 focus:border-blue-500' 
                        : 'bg-transparent text-gray-500 border-gray-300 focus:border-blue-500'
                    }`}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Bouton d'ajout de question initial */}
              {questions.length === 0 && (
                <div className="flex justify-center my-6 relative">
                  <button
                    onClick={() => setShowAddQuestionMenu('initial')}
                    className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' 
                        : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {showAddQuestionMenu === 'initial' && (
                    <div className={`absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border min-w-[220px] question-menu ${
                      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <button
                        onClick={() => addQuestion('single_choice')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm">Réponse simple</span>
                      </button>
                      <button
                        onClick={() => addQuestion('multiple_choice')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm">Réponse multiple</span>
                      </button>
                      <button
                        onClick={() => addQuestion('short_text')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Réponse courte</span>
                      </button>
                      <button
                        onClick={() => addQuestion('long_text')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Paragraphe</span>
                      </button>
                      <button
                        onClick={() => addQuestion('dropdown')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-sm">Liste déroulante</span>
                      </button>
                      <button
                        onClick={() => addQuestion('table')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <ListOrdered className="w-4 h-4" />
                        <span className="text-sm">Grille/Tableau</span>
                      </button>
                      <button
                        onClick={() => addQuestion('recommendation')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <Info className="w-4 h-4" />
                        <span className="text-sm">Question de recommandation</span>
                      </button>
                      <button
                        onClick={() => addQuestion('pedagogy')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-b-lg ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Pédagogie</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Questions */}
              {questions.map((question, index) => (
                <React.Fragment key={question.id}>
                  {/* Bouton "+" entre les questions */}
                  {index > 0 && (
                    <div className="flex justify-center my-5 relative">
                      <button
                        onClick={() => setShowAddQuestionMenu(`after-${question.id}`)}
                        className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                          isDark 
                            ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' 
                            : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      {showAddQuestionMenu === `after-${question.id}` && (
                        <div className={`absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border min-w-[220px] question-menu ${
                          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => addQuestion('single_choice', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span className="text-sm">Réponse simple</span>
                          </button>
                          <button
                            onClick={() => addQuestion('multiple_choice', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span className="text-sm">Réponse multiple</span>
                          </button>
                          <button
                            onClick={() => addQuestion('short_text', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Réponse courte</span>
                          </button>
                          <button
                            onClick={() => addQuestion('long_text', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Paragraphe</span>
                          </button>
                          <button
                            onClick={() => addQuestion('dropdown', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                            <span className="text-sm">Liste déroulante</span>
                          </button>
                          <button
                            onClick={() => addQuestion('table', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <ListOrdered className="w-4 h-4" />
                            <span className="text-sm">Grille/Tableau</span>
                          </button>
                          <button
                            onClick={() => addQuestion('recommendation', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <Info className="w-4 h-4" />
                            <span className="text-sm">Question de recommandation</span>
                          </button>
                          <button
                            onClick={() => addQuestion('pedagogy', question.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-b-lg ${
                              isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Pédagogie</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bloc de question */}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(question.id)}
                    onDragOver={(e) => handleDragOver(e, question.id)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-lg border p-5 mb-4 transition-all cursor-move ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 hover:shadow-lg hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                    } ${draggedQuestionId === question.id ? 'opacity-60' : ''}`}
                  >
                    {/* En-tête de la question */}
                    <div className="flex items-center gap-3 mb-4">
                      {/* Numéro de question */}
                      <div 
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-300' 
                            : 'bg-gray-100 border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>

                      {/* Label "Question" */}
                      <span className={`text-sm font-medium flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Question {index + 1}
                      </span>

                      {/* Actions à droite */}
                      <div className="flex items-center gap-2">
                        {/* Dropdown Type */}
                        <div className="relative type-menu">
                          <button
                            onClick={() => setShowTypeMenu({ ...showTypeMenu, [question.id]: !showTypeMenu[question.id] })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              isDark 
                                ? 'bg-blue-900/30 text-blue-300 border border-blue-800' 
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}
                          >
                            {questionTypeLabels[question.type]}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showTypeMenu[question.id] ? 'rotate-180' : ''}`} />
                          </button>
                          {showTypeMenu[question.id] && (
                            <div className={`absolute top-10 right-0 z-50 rounded-lg shadow-lg border min-w-[200px] type-menu ${
                              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                            }`}>
                              {Object.entries(questionTypeLabels).map(([type, label]) => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    const newType = type as QuestionType;
                                    // Réinitialiser les options selon le nouveau type
                                    if (newType === 'single_choice' || newType === 'multiple_choice' || newType === 'dropdown') {
                                      if (!question.options) {
                                        updateQuestion(question.id, {
                                          type: newType,
                                          options: [
                                            { id: `opt-${Date.now()}-1`, text: 'Option 1' },
                                            { id: `opt-${Date.now()}-2`, text: 'Option 2' }
                                          ]
                                        });
                                      } else {
                                        updateQuestion(question.id, { type: newType });
                                      }
                                    } else if (newType === 'table') {
                                      if (!question.tableColumns) {
                                        updateQuestion(question.id, {
                                          type: newType,
                                          tableColumns: [
                                            { id: `col-${Date.now()}-1`, label: 'Texte' },
                                            { id: `col-${Date.now()}-2`, label: 'Texte' }
                                          ],
                                          tableRows: [
                                            { id: `row-${Date.now()}-1`, cells: ['', ''] }
                                          ]
                                        });
                                      } else {
                                        updateQuestion(question.id, { type: newType });
                                      }
                                    } else if (newType === 'pedagogy') {
                                      if (!question.content) {
                                        updateQuestion(question.id, {
                                          type: newType,
                                          content: ''
                                        });
                                      } else {
                                        updateQuestion(question.id, { type: newType });
                                      }
                                    } else {
                                      updateQuestion(question.id, { 
                                        type: newType,
                                        options: undefined,
                                        tableColumns: undefined,
                                        tableRows: undefined,
                                        content: undefined
                                      });
                                    }
                                    setShowTypeMenu({ ...showTypeMenu, [question.id]: false });
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                                    question.type === type
                                      ? isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                                      : isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                                  }`}
                                >
                                  <span className="text-sm">{label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Duplication */}
                        <button
                          onClick={() => duplicateQuestion(question.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Suppression */}
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contenu de la question */}
                    <div className="ml-10">
                      {/* Message pour question de recommandation */}
                      {question.type === 'recommendation' && (
                        <div className={`mb-4 p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-blue-900/20 border-blue-800' 
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            <Info className={`w-4 h-4 mt-0.5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                            <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                              Cette question recueille un avis ou témoignage
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Champ question */}
                      <div className="mb-4">
                        <Label className={`text-xs mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Question
                        </Label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          placeholder="Saisissez votre question..."
                          className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>

                      {/* Toggle Obligatoire */}
                      <div className="flex items-center gap-2 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                            style={{ accentColor: primaryColor }}
                          />
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Obligatoire
                          </span>
                        </label>
                      </div>

                      {/* Options pour single_choice, multiple_choice, dropdown */}
                      {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'dropdown') && question.options && (
                        <div className="space-y-3 mb-4">
                          {question.options.map((option, optIndex) => (
                            <div key={option.id} className="flex items-center gap-3">
                              {/* Numéro option */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600 text-gray-300' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700'
                              }`}>
                                <span className="text-xs font-medium">{optIndex + 1}</span>
                              </div>

                              {/* Champ texte option */}
                              <div className="flex-1">
                                <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Texte
                                </Label>
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                  placeholder="Texte de l'option..."
                                  className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                />
                              </div>

                              {/* Actions option */}
                              <div className="flex items-center gap-1 pt-6">
                                <button
                                  onClick={() => moveOption(question.id, option.id, 'up')}
                                  disabled={optIndex === 0}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                    optIndex === 0
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteOption(question.id, option.id)}
                                  disabled={question.options!.length <= 1}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                    question.options!.length <= 1
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-red-500 hover:bg-red-50'
                                  }`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Bouton ajouter option */}
                          <button
                            onClick={() => addOption(question.id)}
                            className={`ml-9 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 ${
                              isDark ? 'text-blue-400 hover:text-blue-300' : ''
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter une option
                          </button>
                        </div>
                      )}

                      {/* Zone de réponse pour short_text */}
                      {question.type === 'short_text' && (
                        <div className="mb-4">
                          <div className={`border-b-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} pb-2`}>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Réponse courte
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Zone de réponse pour long_text */}
                      {question.type === 'long_text' && (
                        <div className="mb-4">
                          <div className={`border-2 border-dashed rounded p-4 min-h-[80px] ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Zone de réponse (paragraphe)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tableau pour table */}
                      {question.type === 'table' && question.tableColumns && question.tableRows && (
                        <div className="mb-4">
                          {/* Sous-question */}
                          <div className="mb-3">
                            <Label className={`text-xs mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Sous-question
                            </Label>
                            <Input
                              value={question.question}
                              onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                              placeholder="Saisissez la sous-question..."
                              className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                          </div>

                          {/* Tableau */}
                          <div className={`border rounded-md overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                                  {question.tableColumns.map((col, colIdx) => (
                                    <th key={col.id} className={`border p-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                      <Input
                                        value={col.label}
                                        onChange={(e) => updateTableColumn(question.id, col.id, e.target.value)}
                                        className={`text-xs font-medium border-0 p-0 h-auto text-center ${
                                          isDark ? 'bg-transparent text-gray-300' : 'bg-transparent text-gray-600'
                                        }`}
                                        placeholder="Texte"
                                      />
                                      {question.tableColumns!.length > 1 && (
                                        <button
                                          onClick={() => deleteTableColumn(question.id, col.id)}
                                          className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </th>
                                  ))}
                                  <th className={`w-10 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                    <button
                                      onClick={() => addTableColumn(question.id)}
                                      className={`w-full h-full flex items-center justify-center transition-colors ${
                                        isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {question.tableRows.map((row, rowIdx) => (
                                  <tr key={row.id} className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                    <td className={`border p-2 text-center ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}`}>
                                      {rowIdx + 1}
                                    </td>
                                    {row.cells.map((cell, cellIdx) => (
                                      <td key={cellIdx} className={`border p-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                        <Input
                                          value={cell}
                                          onChange={(e) => updateTableCell(question.id, row.id, cellIdx, e.target.value)}
                                          className={`text-xs border-0 p-0 h-auto ${
                                            isDark ? 'bg-transparent text-white' : 'bg-transparent'
                                          }`}
                                          placeholder="Texte"
                                        />
                                      </td>
                                    ))}
                                    <td className={`border p-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                      <button
                                        onClick={() => deleteTableRow(question.id, row.id)}
                                        className="w-full h-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className={`border-t p-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                              <button
                                onClick={() => addTableRow(question.id)}
                                className={`w-full flex items-center justify-center py-2 transition-colors text-sm ${
                                  isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter une ligne
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Éditeur riche pour pedagogy */}
                      {question.type === 'pedagogy' && (
                        <div className="mb-4">
                          <DocumentRichTextEditor
                            value={question.content || ''}
                            onChange={(content) => updateQuestion(question.id, { content })}
                            placeholder="Saisissez le contenu pédagogique..."
                            onFocus={() => setActiveQuestionId(question.id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {/* Bouton d'ajout après la dernière question */}
              {questions.length > 0 && (
                <div className="flex justify-center my-6 relative">
                  <button
                    onClick={() => setShowAddQuestionMenu('end')}
                    className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' 
                        : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {showAddQuestionMenu === 'end' && (
                    <div className={`absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border min-w-[220px] question-menu ${
                      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <button
                        onClick={() => addQuestion('single_choice')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm">Réponse simple</span>
                      </button>
                      <button
                        onClick={() => addQuestion('multiple_choice')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm">Réponse multiple</span>
                      </button>
                      <button
                        onClick={() => addQuestion('short_text')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Réponse courte</span>
                      </button>
                      <button
                        onClick={() => addQuestion('long_text')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Paragraphe</span>
                      </button>
                      <button
                        onClick={() => addQuestion('dropdown')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-sm">Liste déroulante</span>
                      </button>
                      <button
                        onClick={() => addQuestion('table')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <ListOrdered className="w-4 h-4" />
                        <span className="text-sm">Grille/Tableau</span>
                      </button>
                      <button
                        onClick={() => addQuestion('recommendation')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <Info className="w-4 h-4" />
                        <span className="text-sm">Question de recommandation</span>
                      </button>
                      <button
                        onClick={() => addQuestion('pedagogy')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-b-lg ${
                          isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Pédagogie</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'Aperçu */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* En-tête de la modal */}
            <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aperçu du Questionnaire
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewMode(false)}
                className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="p-8">
              {/* En-tête */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    {organization?.organization_logo ? (
                      <img 
                        src={organization.organization_logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className={`text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {organization?.organization_name || 'Nom de l\'organisme de votre entreprise'}
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h1 className={`font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {questionnaireTitle || 'Titre'}
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {questionnaireDescription || 'Description'}
                  </p>
                </div>
              </div>

              {/* Aperçu des questions */}
              {questions.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Aucune question ajoutée. Ajoutez des questions pour voir l'aperçu.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className={`rounded-lg border p-5 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                          isDark ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                        }`}>
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {question.question || 'Question sans titre'}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-xl ${
                            isDark 
                              ? 'bg-blue-900/30 text-blue-300' 
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {questionTypeLabels[question.type]}
                          </span>
                          {question.required && (
                            <span className={`ml-2 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                              *
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Aperçu selon le type */}
                      {question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'dropdown' ? (
                        <div className="ml-10 space-y-2">
                          {question.options?.map((opt, optIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              {question.type === 'single_choice' ? (
                                <div className={`w-4 h-4 rounded-full border-2 ${isDark ? 'border-gray-500' : 'border-gray-400'}`}></div>
                              ) : question.type === 'multiple_choice' ? (
                                <div className={`w-4 h-4 rounded border-2 ${isDark ? 'border-gray-500' : 'border-gray-400'}`}></div>
                              ) : (
                                <div className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{optIdx + 1}.</div>
                              )}
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {opt.text || 'Option sans texte'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : question.type === 'short_text' ? (
                        <div className="ml-10">
                          <div className={`border-b-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} pb-2`}>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Réponse courte
                            </span>
                          </div>
                        </div>
                      ) : question.type === 'long_text' ? (
                        <div className="ml-10">
                          <div className={`border-2 border-dashed rounded p-4 min-h-[80px] ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Zone de réponse (paragraphe)
                            </span>
                          </div>
                        </div>
                      ) : question.type === 'table' && question.tableColumns && question.tableRows ? (
                        <div className="ml-10">
                          <div className={`border rounded-md overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                                  {question.tableColumns.map((col) => (
                                    <th key={col.id} className={`border p-2 text-xs font-medium ${isDark ? 'border-gray-500 text-gray-300' : 'border-gray-300 text-gray-600'}`}>
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {question.tableRows.map((row, rowIdx) => (
                                  <tr key={row.id} className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                    <td className={`border p-2 text-center text-xs ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}`}>
                                      {rowIdx + 1}
                                    </td>
                                    {row.cells.map((cell, cellIdx) => (
                                      <td key={cellIdx} className={`border p-2 text-xs ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                                        {cell || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : question.type === 'pedagogy' ? (
                        <div className="ml-10">
                          <div 
                            className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}
                            dangerouslySetInnerHTML={{ __html: question.content || '<p class="text-gray-400 italic">Contenu vide</p>' }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer de la modal */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setPreviewMode(false);
                  handleSave();
                }}
                disabled={saving}
                className="text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
