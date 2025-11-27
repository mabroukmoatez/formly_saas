import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { X, Eye, FileSpreadsheet, Search, Plus, Users } from 'lucide-react';
import { courseCreation } from '../../services/courseCreation';

interface QuestionnaireSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: any) => void;
  courseUuid: string;
  audienceType?: 'students' | 'instructors' | 'organization';
}

export const QuestionnaireSelectionModal: React.FC<QuestionnaireSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  courseUuid,
  audienceType
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { subdomain } = useSubdomainNavigation();
  const primaryColor = organization?.primary_color || '#007aff';
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'formly'>('formly');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, audienceType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await courseCreation.getAllOrganizationDocuments({
        exclude_questionnaires: false
      });
      if (response.success && response.data) {
        // Filter for questionnaires
        const questionnaires = response.data.filter((doc: any) => 
          doc.is_questionnaire || doc.questionnaire_type || doc.questions
        );
        
        // Filter by audience if specified
        const filtered = audienceType 
          ? questionnaires.filter((doc: any) => doc.audience_type === audienceType)
          : questionnaires;
        
        setTemplates(filtered);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (searchQuery.trim() === '') return true;
    return template.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className={`w-full max-w-5xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={audienceType === 'instructors' ? 'Formateur' : audienceType === 'students' ? 'Apprenant' : 'Questionnaire'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = subdomain 
                    ? `/${subdomain}/questionnaire-creation?courseUuid=${courseUuid}`
                    : `/questionnaire-creation?courseUuid=${courseUuid}`;
                  window.open(url, '_blank');
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Créer Un Nouveau Modèle
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    onSelect(selectedTemplate);
                    onClose();
                  }
                }}
                disabled={!selectedTemplate}
                style={{ backgroundColor: primaryColor }}
                className="px-6"
              >
                Choisir Ce Modèle
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className={isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-2 px-2 text-sm font-medium transition-colors ${
                activeTab === 'my'
                  ? isDark ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes modèles ({templates.filter(t => t.created_by === organization?.id).length})
            </button>
            <button
              onClick={() => setActiveTab('formly')}
              className={`pb-2 px-2 text-sm font-medium transition-colors ${
                activeTab === 'formly'
                  ? isDark ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Modèles proposés par Formly ({templates.filter(t => !t.created_by || t.created_by !== organization?.id).length})
            </button>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6 max-h-[50vh] overflow-y-auto">
              {filteredTemplates
                .filter(template => {
                  if (activeTab === 'my') {
                    return template.created_by === organization?.id;
                  } else {
                    return !template.created_by || template.created_by !== organization?.id;
                  }
                })
                .map((template, index) => (
                  <Card
                    key={template.uuid || index}
                    onClick={() => setSelectedTemplate(template)}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.uuid === template.uuid
                        ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    style={{
                      borderWidth: selectedTemplate?.uuid === template.uuid ? '2px' : '1px',
                      borderColor: selectedTemplate?.uuid === template.uuid ? primaryColor : undefined
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                          isDark ? 'bg-gray-700' : 'bg-blue-50'
                        }`}>
                          <FileSpreadsheet className="w-8 h-8" style={{ color: primaryColor }} />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 truncate w-full px-2`}>
                          Programme De Formation
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          {template.audience_type === 'students' && (
                            <Users className="w-3 h-3" style={{ color: '#3B82F6' }} />
                          )}
                          {template.audience_type === 'instructors' && (
                            <Users className="w-3 h-3" style={{ color: '#8B5CF6' }} />
                          )}
                          {template.audience_type === 'organization' && (
                            <Users className="w-3 h-3" style={{ color: '#10B981' }} />
                          )}
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {template.audience_type === 'students' ? 'Apprenant' :
                             template.audience_type === 'instructors' ? 'Formateur' :
                             template.audience_type === 'organization' ? 'Enterprise' : 'Autre'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (template.file_url) {
                              window.open(template.file_url, '_blank');
                            }
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Apercu
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

