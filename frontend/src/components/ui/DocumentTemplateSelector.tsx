import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Badge } from './badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from './toast';
import { courseCreation } from '../../services/courseCreation';
import { DocumentTemplate, OrganizationDocumentTemplate } from '../../services/courseCreation.types';
import { 
  File, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus, 
  Upload,
  X,
  Check,
  AlertCircle,
  FileText,
  Award,
  Receipt,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';

interface DocumentTemplateSelectorProps {
  courseUuid: string;
  onTemplateSelect: (template: DocumentTemplate | OrganizationDocumentTemplate) => void;
  onTemplateGenerate: (templateId: string, variables: any) => void;
  selectedTemplate?: DocumentTemplate | OrganizationDocumentTemplate | null;
  showGenerateButton?: boolean;
  category?: string;
}

export const DocumentTemplateSelector: React.FC<DocumentTemplateSelectorProps> = ({
  courseUuid,
  onTemplateSelect,
  onTemplateGenerate,
  selectedTemplate,
  showGenerateButton = true,
  category
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [templates, setTemplates] = useState<(DocumentTemplate | OrganizationDocumentTemplate)[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<(DocumentTemplate | OrganizationDocumentTemplate)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<any>({});
  const [availableTemplates, setAvailableTemplates] = useState<(DocumentTemplate | OrganizationDocumentTemplate)[]>([]);

  const categories = [
    { key: 'all', label: 'Tous', icon: File },
    { key: 'contract', label: 'Contrat', icon: FileText },
    { key: 'certificate', label: 'Certificat', icon: Award },
    { key: 'quote', label: 'Devis', icon: Receipt },
    { key: 'invoice', label: 'Facture', icon: FileSpreadsheet },
    { key: 'report', label: 'Rapport', icon: ClipboardList },
    { key: 'other', label: 'Autre', icon: File }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      // Load both super admin and organization templates
      const [adminTemplates, orgTemplates] = await Promise.all([
        courseCreation.getDocumentTemplates(),
        courseCreation.getOrganizationDocumentTemplates()
      ]);

      const allTemplates = [
        ...(adminTemplates.data?.templates || []),
        ...(orgTemplates.data?.templates || [])
      ];

      setTemplates(allTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
      error('Erreur lors du chargement des modèles');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template: DocumentTemplate | OrganizationDocumentTemplate) => {
    onTemplateSelect(template);
    setShowTemplateModal(false);
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLoading(true);
      await onTemplateGenerate(selectedTemplate.uuid, templateVariables);
      success('Document généré avec succès');
      setShowGenerateModal(false);
      setTemplateVariables({});
    } catch (err) {
      console.error('Failed to generate document:', err);
      error('Erreur lors de la génération du document');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.key === category);
    return categoryData?.icon || File;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'certificate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'quote':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'invoice':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'report':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Selection Button */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowTemplateModal(true)}
          variant="outline"
          className={`flex items-center gap-2 ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <File className="w-4 h-4" />
          {selectedTemplate ? 'Changer de modèle' : 'Choisir un modèle'}
        </Button>

        {selectedTemplate && showGenerateButton && (
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Download className="w-4 h-4" />
            Générer le document
          </Button>
        )}
      </div>

      {/* Selected Template Display */}
      {selectedTemplate && (
        <Card className={`rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                {React.createElement(getCategoryIcon(selectedTemplate.category), {
                  className: `w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`
                })}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedTemplate.name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedTemplate.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge className={getCategoryColor(selectedTemplate.category)}>
                    {categories.find(cat => cat.key === selectedTemplate.category)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {selectedTemplate.template_type === 'predefined' ? 'Prédéfini' : 'Personnalisé'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedTemplate.file_url, '_blank')}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Aperçu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTemplateSelect(null)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="w-3 h-3" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-6xl max-h-[80vh] overflow-y-auto rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Sélectionner un modèle de document
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <Input
                      placeholder="Rechercher un modèle..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <Button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        variant={selectedCategory === cat.key ? 'default' : 'outline'}
                        size="sm"
                        className={`flex items-center gap-2 ${
                          selectedCategory === cat.key ? 'text-white' : ''
                        }`}
                        style={selectedCategory === cat.key ? { backgroundColor: primaryColor } : {}}
                      >
                        <IconComponent className="w-4 h-4" />
                        {cat.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  const IconComponent = getCategoryIcon(template.category);
                  return (
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
                            <IconComponent className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
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
                              <Badge className={getCategoryColor(template.category)}>
                                {categories.find(cat => cat.key === template.category)?.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.template_type === 'predefined' ? 'Prédéfini' : 'Personnalisé'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Aucun modèle trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Generation Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Générer le document
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className={`font-medium mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedTemplate.name}
                  </h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Template Variables */}
                {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
                  <div className="space-y-3">
                    <h4 className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Variables du modèle
                    </h4>
                    {Object.entries(selectedTemplate.variables).map(([key, value]) => (
                      <div key={key}>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {key}
                        </label>
                        <Input
                          placeholder={`Entrez ${key}`}
                          value={templateVariables[key] || ''}
                          onChange={(e) => setTemplateVariables(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))}
                          className={isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleGenerateDocument}
                    disabled={isLoading}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white"
                  >
                    {isLoading ? 'Génération...' : 'Générer le document'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
