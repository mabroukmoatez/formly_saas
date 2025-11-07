import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { QuestionnaireCreationModal } from './QuestionnaireCreationModal';
import { courseCreation } from '../../services/courseCreation';
import { 
  FileSpreadsheet, 
  Trash2, 
  Download,
  Plus,
  Eye,
  BarChart3,
  Calendar,
  Users,
  LayoutTemplate,
  Check
} from 'lucide-react';

interface Questionnaire {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  document_type: 'template';
  template_id: number;
  file_url?: string;
  audience_type: 'students';
  questionnaire_type?: 'pre_course' | 'post_course' | 'mid_course' | 'custom';
  template_variables?: Record<string, any>;
  is_generated?: boolean;
  created_at: string;
}

interface QuestionnaireTemplate {
  id: number;
  name: string;
  description?: string;
  type: 'questionnaire';
  content?: string;
  fields?: Record<string, string>;
  is_active: boolean;
}

export const Step4QuestionnaireNew: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useCourseCreation();
  const { error: showError, success: showSuccess } = useToast();
  const { navigateToRoute, buildRoute } = useSubdomainNavigation();
  const primaryColor = organization?.primary_color || '#007aff';

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [allOrgQuestionnaires, setAllOrgQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesView, setShowTemplatesView] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'pre_course' | 'post_course' | 'mid_course' | 'custom'>('all');

  useEffect(() => {
    if (formData.courseUuid) {
      loadQuestionnaires();
      loadTemplates();
      loadAllOrganizationQuestionnaires();
    }
  }, [formData.courseUuid]);

  const loadAllOrganizationQuestionnaires = async () => {
    try {
      // Load ALL questionnaires from organization (all courses)
      const questionnairesRes = await courseCreation.getAllOrganizationDocuments({ 
        exclude_questionnaires: false  // Get ONLY questionnaires
      });
      console.log('📋 Organization questionnaires loaded:', questionnairesRes);
      
      if (questionnairesRes.success && questionnairesRes.data) {
        // Filter only questionnaires
        const questionnairesList = questionnairesRes.data.filter((d: any) => 
          d.is_questionnaire || d.questionnaire_type || d.questions
        );
        console.log('✅ Questionnaire templates available:', questionnairesList.length, questionnairesList);
        setAllOrgQuestionnaires(questionnairesList);
      } else {
        setAllOrgQuestionnaires([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading organization questionnaires:', error);
      setAllOrgQuestionnaires([]);
    }
  };

  const handleUseTemplate = async (templateQuestionnaire: any) => {
    try {
      // Copy the questionnaire to current course
      const questionnaireData: any = {
        name: `${templateQuestionnaire.name} (copie)`,
        description: templateQuestionnaire.description,
        document_type: templateQuestionnaire.document_type,
        audience_type: 'students',
        is_certificate: false,
        is_questionnaire: true,
        questionnaire_type: templateQuestionnaire.questionnaire_type,
        questions: templateQuestionnaire.questions,
        custom_template: templateQuestionnaire.custom_template,
        template_variables: templateQuestionnaire.template_variables,
      };

      // Use FormData
      const formDataToSend = new FormData();
      formDataToSend.append('name', questionnaireData.name);
      formDataToSend.append('document_type', questionnaireData.document_type);
      formDataToSend.append('audience_type', 'students');
      formDataToSend.append('is_certificate', '0');
      formDataToSend.append('is_questionnaire', '1');
      
      if (questionnaireData.description) {
        formDataToSend.append('description', questionnaireData.description);
      }
      if (questionnaireData.questionnaire_type) {
        formDataToSend.append('questionnaire_type', questionnaireData.questionnaire_type);
      }
      if (questionnaireData.custom_template) {
        formDataToSend.append('custom_template', JSON.stringify(questionnaireData.custom_template));
      }
      if (questionnaireData.questions) {
        formDataToSend.append('questions', JSON.stringify(questionnaireData.questions));
      }
      if (questionnaireData.template_variables) {
        formDataToSend.append('variables', JSON.stringify(questionnaireData.template_variables));
      }

      await courseCreation.createDocumentEnhanced(formData.courseUuid!, formDataToSend);
      showSuccess('Questionnaire ajouté depuis template');
      loadQuestionnaires();
      setShowTemplatesView(false);
    } catch (error: any) {
      console.error('Error using template:', error);
      showError('Erreur', 'Impossible d\'ajouter le questionnaire');
    }
  };

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      // Use new questionnaires endpoint (separated from documents)
      const response = await courseCreation.getQuestionnaires(formData.courseUuid!, {
        audience: 'students'
      });
      if (response.success && response.data) {
        setQuestionnaires(response.data);
      }
    } catch (error: any) {
      console.error('Error loading questionnaires:', error);
      showError('Erreur', 'Impossible de charger les questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await courseCreation.getDocumentTemplatesEnhanced({ 
        type: 'questionnaire', 
        is_active: true 
      });
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateQuestionnaire = async (questionnaireData: any) => {
    try {
      if (!formData.courseUuid) {
        throw new Error('UUID du cours manquant');
      }

      let response;

      // Always use FormData for questionnaires to ensure backend receives data correctly
      const formDataToSend = new FormData();
      formDataToSend.append('name', questionnaireData.name);
      formDataToSend.append('document_type', questionnaireData.document_type);
      formDataToSend.append('audience_type', 'students');
      formDataToSend.append('is_certificate', '0');  // Laravel expects '0' or '1' for booleans
      formDataToSend.append('is_questionnaire', '1');  // '1' = true for Laravel validation
      
      if (questionnaireData.description) {
        formDataToSend.append('description', questionnaireData.description);
      }
      
      if (questionnaireData.questionnaire_type) {
        formDataToSend.append('questionnaire_type', questionnaireData.questionnaire_type);
      }
      
      if (questionnaireData.document_type === 'custom_builder') {
        formDataToSend.append('custom_template', JSON.stringify(questionnaireData.custom_template));
        if (questionnaireData.questions) {
          formDataToSend.append('questions', JSON.stringify(questionnaireData.questions));
        }
        if (questionnaireData.variables) {
          formDataToSend.append('variables', JSON.stringify(questionnaireData.variables));
        }
      } else if (questionnaireData.document_type === 'template') {
        formDataToSend.append('template_id', questionnaireData.template_id.toString());
        formDataToSend.append('variables', JSON.stringify(questionnaireData.variables || {}));
      }
      
      console.log('📤 Sending questionnaire with FormData, is_questionnaire: true');
      response = await courseCreation.createDocumentEnhanced(formData.courseUuid, formDataToSend);
      
      showSuccess('Questionnaire créé avec succès');
      loadQuestionnaires();
    } catch (error: any) {
      console.error('Error creating questionnaire:', error);
      throw error;
    }
  };

  const handleDeleteQuestionnaire = async (questionnaireUuid: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce questionnaire ?')) {
      return;
    }

    try {
      const qToDelete = questionnaires.find(q => q.uuid === questionnaireUuid);
      if (qToDelete) {
        await courseCreation.deleteDocumentEnhanced(formData.courseUuid!, qToDelete.id);
        setQuestionnaires(questionnaires.filter(q => q.uuid !== questionnaireUuid));
        showSuccess('Questionnaire supprimé');
      }
    } catch (error: any) {
      console.error('Error deleting questionnaire:', error);
      showError('Erreur', 'Impossible de supprimer le questionnaire');
    }
  };

  const handleDownloadQuestionnaire = (questionnaire: Questionnaire) => {
    if (questionnaire.file_url) {
      window.open(questionnaire.file_url, '_blank');
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'pre_course': return 'Pré-formation';
      case 'post_course': return 'Post-formation';
      case 'mid_course': return 'Mi-parcours';
      case 'custom': return 'Personnalisé';
      default: return 'Non défini';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'pre_course': 
        return isDark ? 'bg-blue-900/20 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300';
      case 'post_course': 
        return isDark ? 'bg-green-900/20 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-300';
      case 'mid_course': 
        return isDark ? 'bg-orange-900/20 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-700 border-orange-300';
      case 'custom': 
        return isDark ? 'bg-purple-900/20 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300';
      default: 
        return isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'pre_course': return <Calendar className="w-4 h-4" />;
      case 'post_course': return <BarChart3 className="w-4 h-4" />;
      case 'mid_course': return <Users className="w-4 h-4" />;
      default: return <FileSpreadsheet className="w-4 h-4" />;
    }
  };

  const filteredQuestionnaires = selectedType === 'all'
    ? questionnaires
    : questionnaires.filter(q => q.questionnaire_type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {showTemplatesView ? 'Templates de Questionnaires' : 'Questionnaires d\'Évaluation'}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {showTemplatesView 
              ? 'Réutilisez des questionnaires existants comme templates' 
              : 'Ajoutez des questionnaires pré/post formation pour vos étudiants'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowTemplatesView(!showTemplatesView)}
            variant="outline"
            className="gap-2"
          >
            {showTemplatesView ? <Plus className="w-4 h-4" /> : <LayoutTemplate className="w-4 h-4" />}
            {showTemplatesView ? 'Créer Nouveau' : 'Templates Existants'}
          </Button>
          {!showTemplatesView && (
            <Button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: primaryColor }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Questionnaire
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className={`font-medium mb-1 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                Types de Questionnaires
              </h4>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <li>• <strong>Pré-formation</strong> : Évaluation des connaissances avant le cours</li>
                <li>• <strong>Post-formation</strong> : Feedback et satisfaction après le cours</li>
                <li>• <strong>Mi-parcours</strong> : Suivi et ajustements pendant la formation</li>
                <li>• <strong>Personnalisé</strong> : Questionnaires sur mesure</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type Filter */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Filtrer par type:
        </span>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'pre_course', label: 'Pré-formation' },
            { value: 'post_course', label: 'Post-formation' },
            { value: 'mid_course', label: 'Mi-parcours' },
            { value: 'custom', label: 'Personnalisé' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setSelectedType(filter.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedType === filter.value
                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates View */}
      {showTemplatesView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allOrgQuestionnaires.map((quest: any) => (
            <Card key={quest.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-all`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {quest.name}
                    </h3>
                    {quest.description && (
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                        {quest.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {quest.questionnaire_type && (
                    <Badge className="bg-[#E8F0F7] text-[#007aff] text-xs">
                      {quest.questionnaire_type === 'pre_course' ? '📋 Pré-formation' :
                       quest.questionnaire_type === 'post_course' ? '✅ Post-formation' :
                       quest.questionnaire_type === 'mid_course' ? '📊 Mi-parcours' : '⚙️ Personnalisé'}
                    </Badge>
                  )}
                  {quest.questions && (
                    <Badge className="bg-gray-100 text-gray-700 text-xs">
                      {quest.questions.length} question{quest.questions.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const previewUrl = buildRoute(`/course/${formData.courseUuid}/document/${quest.id}`);
                      window.open(previewUrl, '_blank');
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Aperçu
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => handleUseTemplate(quest)}
                  >
                    <Check className="w-3 h-3 mr-1 text-white" />
                    <span className="text-white">Utiliser</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {allOrgQuestionnaires.length === 0 && (
            <Card className={`col-span-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="py-12 text-center">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aucun template de questionnaire disponible
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* Questionnaires List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
            </div>
          ) : filteredQuestionnaires.length === 0 ? (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardContent className="py-12">
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucun questionnaire
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Commencez par ajouter un questionnaire d'évaluation
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: primaryColor }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer le Premier Questionnaire
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuestionnaires.map(questionnaire => (
            <Card key={questionnaire.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <FileSpreadsheet className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {questionnaire.name}
                      </h3>

                      {questionnaire.description && (
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {questionnaire.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        {/* Type Badge */}
                        <Badge className={`${getTypeColor(questionnaire.questionnaire_type)} flex items-center gap-1`}>
                          {getTypeIcon(questionnaire.questionnaire_type)}
                          {getTypeLabel(questionnaire.questionnaire_type)}
                        </Badge>

                        {/* Date */}
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Créé le {new Date(questionnaire.created_at).toLocaleDateString('fr-FR')}
                        </span>

                        {/* Generated Status */}
                        {questionnaire.is_generated && (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                            Généré
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadQuestionnaire(questionnaire)}
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadQuestionnaire(questionnaire)}
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Prévisualiser"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestionnaire(questionnaire.uuid)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
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
        </>
      )}

      {/* Create Questionnaire Modal */}
      <QuestionnaireCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateQuestionnaire}
        courseUuid={formData.courseUuid || ''}
        templates={templates}
      />
    </div>
  );
};

