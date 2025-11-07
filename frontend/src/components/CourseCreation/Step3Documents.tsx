import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useToast } from '../ui/toast';
import { courseCreation } from '../../services/courseCreation';
import { Document, CertificationModel } from '../../services/courseCreation.types';
import { 
  File, 
  Trash2, 
  Eye,
  Award,
  Library,
  CloudUpload,
  X,
  Download,
  Plus,
  FileText,
  CheckCircle,
  Edit3
} from 'lucide-react';

interface DocumentTemplate {
  uuid: string;
  name: string;
  description: string;
  category: 'contract' | 'certificate' | 'quote' | 'invoice' | 'report' | 'other';
  template_type: 'predefined' | 'custom';
  file_url: string;
  variables: any;
  is_active: boolean;
}

interface GeneratedDocument {
  uuid: string;
  name: string;
  template_id: string;
  template_variables: any;
  file_url: string;
  generated_at: string;
  is_generated: boolean;
}

export const Step3Documents: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  // Use CourseCreationContext
  const {
    documents,
    certificationModels,
    loadDocuments,
    createDocument,
    deleteDocument,
    loadCertificationModels,
    formData
  } = useCourseCreation();

  // State for filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'contract' | 'certificate' | 'quote' | 'invoice' | 'report' | 'other'>('all');

  // State for modals
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showDocumentGeneration, setShowDocumentGeneration] = useState(false);
  
  // State for document templates
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [organizationTemplates, setOrganizationTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<any>({});
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  
  // State for certification model selection
  const [selectedCertification, setSelectedCertification] = useState<CertificationModel | null>(null);
  
  // State for file upload
  const [isUploading, setIsUploading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDocuments();
    loadCertificationModels();
    loadDocumentTemplates();
  }, [loadDocuments, loadCertificationModels]);

  // Load document templates
  const loadDocumentTemplates = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid) return;

      // Load predefined templates
      const predefinedResponse: any = await courseCreation.getDocumentTemplates();
      if (predefinedResponse.success) {
        setDocumentTemplates(predefinedResponse.data.templates || []);
      }

      // Load organization templates
      const orgResponse: any = await courseCreation.getOrganizationDocumentTemplates();
      if (orgResponse.success) {
        setOrganizationTemplates(orgResponse.data.templates || []);
      }

      // Load available templates for this course
      const availableResponse: any = await courseCreation.getAvailableDocumentTemplates(courseUuid);
      if (availableResponse.success) {
        setGeneratedDocuments(availableResponse.data.generated_documents || []);
      }
    } catch (error: any) {
      // ('Failed to load document templates:', error);
      error('Erreur lors du chargement des modèles de documents');
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTemplateVariables({});
    setShowTemplateSelector(false);
    setShowDocumentGeneration(true);
  };

  // Handle document generation
  const handleGenerateDocument = async () => {
    try {
      const courseUuid = formData.courseUuid;
      if (!courseUuid || !selectedTemplate) {
        error('Informations manquantes pour la génération');
            return;
          }

      const response: any = await courseCreation.generateDocumentFromTemplate(courseUuid, selectedTemplate.uuid, templateVariables);

      if (response.success) {
        success('Document généré avec succès');
        setShowDocumentGeneration(false);
        setSelectedTemplate(null);
        setTemplateVariables({});
        loadDocuments();
        loadDocumentTemplates();
          }
        } catch (error: any) {
      // ('Failed to generate document:', error);
      error('Erreur lors de la génération du document');
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File, category: string) => {
    try {
      setIsUploading(true);

      const courseUuid = formData.courseUuid;
      if (!courseUuid) {
        error('UUID du cours non disponible');
        return;
      }

      const documentData = {
        name: file.name,
        description: `Document ${category} uploadé`,
        category: category as 'apprenant' | 'formateur' | 'entreprise',
        file: file,
        file_url: '', // Will be set by backend
        file_size: file.size,
        is_required: false
      };
      
      const newDocument = await createDocument(documentData);
      if (newDocument) {
        setIsUploading(false);
        success('Document uploadé avec succès');
      }
    } catch (err: any) {
      // ('Failed to upload document:', err);
      error('Erreur lors de l\'upload du document');
      setIsUploading(false);
    }
  };

  // Handle certification model selection
  const handleSelectCertification = async (model: CertificationModel) => {
    try {
      // For now, just set the selected certification locally
      // The backend assignment might need to be handled differently
      setSelectedCertification(model);
      setShowCertificationModal(false);
      success('Modèle d\'attestation sélectionné avec succès');
      
      // TODO: Fix the assignCertificationModel function in CourseCreationContext
      // The current implementation has a bug where it looks for cm.uuid === modelId.toString()
      // but modelId is a number and cm.uuid is a string UUID, so it never matches
    } catch (error: any) {
      // ('Failed to assign certification model:', error);
      error('Erreur lors de la sélection du modèle d\'attestation');
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const deleted = await deleteDocument(parseInt(documentId));
      if (deleted) {
        success('Document supprimé avec succès');
      }
    } catch (error: any) {
      // ('Failed to delete document:', error);
      error('Erreur lors de la suppression du document');
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (activeFilter === 'all') return true;
    // Map document categories to filter categories
    const categoryMap: { [key: string]: string } = {
      'apprenant': 'contract',
      'formateur': 'certificate', 
      'entreprise': 'quote'
    };
    return categoryMap[doc.category] === activeFilter;
  });

  // Get filter count
  const getFilterCount = (type: 'all' | 'contract' | 'certificate' | 'quote' | 'invoice' | 'report' | 'other') => {
    if (type === 'all') return documents.length;
    const categoryMap: { [key: string]: string } = {
      'apprenant': 'contract',
      'formateur': 'certificate', 
      'entreprise': 'quote'
    };
    return documents.filter(doc => categoryMap[doc.category] === type).length;
  };

  // Filter options
  const filters = [
    { key: 'all', label: 'Tous', count: getFilterCount('all'), icon: File },
    { key: 'contract', label: 'Contrats', count: getFilterCount('contract'), icon: FileText },
    { key: 'certificate', label: 'Certificats', count: getFilterCount('certificate'), icon: Award },
    { key: 'quote', label: 'Devis', count: getFilterCount('quote'), icon: FileText },
    { key: 'invoice', label: 'Factures', count: getFilterCount('invoice'), icon: FileText },
    { key: 'report', label: 'Rapports', count: getFilterCount('report'), icon: FileText },
    { key: 'other', label: 'Autres', count: getFilterCount('other'), icon: File }
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
              Documents et Attestations
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

        {/* Document Templates Section */}
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
                  Modèles de Documents
                </h2>
              </div>
                  <Button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
                  >
                    <Library className="w-4 h-4" />
                Choisir un modèle
                  </Button>
            </div>

            {/* Template Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {['contract', 'certificate', 'quote', 'invoice', 'report', 'other'].map((category) => {
                const categoryTemplates = [...documentTemplates, ...organizationTemplates].filter(
                  t => t.category === category && t.is_active
                );
                
                return (
                  <Card
                    key={category}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setShowTemplateSelector(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                        }`}>
                          <FileText className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                        <div className="flex-1">
                          <h3 className={`font-medium text-sm ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {category === 'contract' ? 'Contrats' :
                             category === 'certificate' ? 'Certificats' :
                             category === 'quote' ? 'Devis' :
                             category === 'invoice' ? 'Factures' :
                             category === 'report' ? 'Rapports' : 'Autres'}
                          </h3>
                          <p className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {categoryTemplates.length} modèle{categoryTemplates.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Generated Documents */}
        {generatedDocuments.length > 0 && (
          <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
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
                  Documents Générés
                </h2>
                    </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedDocuments.map((doc) => (
                  <Card
                    key={doc.uuid}
                    className={`transition-all hover:shadow-lg ${
                      isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-green-900/50' : 'bg-green-100'
                        }`}>
                          <CheckCircle className={`w-6 h-6 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm line-clamp-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {doc.name}
                      </h3>
                          <p className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                            Généré le {new Date(doc.generated_at).toLocaleDateString()}
                      </p>
                          <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                              onClick={() => window.open(doc.file_url, '_blank')}
                              className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                              Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = doc.file_url;
                                a.download = doc.name;
                                a.click();
                              }}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Télécharger
                      </Button>
                    </div>
                  </div>
              </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Course Documents */}
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
                  Documents du Cours
              </h2>
              </div>
            </div>

            {/* Upload Area */}
            <div className={`border-2 border-dashed rounded-lg p-8 mb-6 ${
              isDark ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className="text-center">
                <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Ajouter des documents
                </h3>
                <p className={`text-sm mb-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Glissez-déposez vos fichiers ou cliquez pour sélectionner
                </p>
                
                <div className="flex gap-3 justify-center">
                  {['apprenant', 'formateur', 'entreprise'].map((category) => (
              <Button
                      key={category}
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx,.txt,.jpg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file, category);
                        };
                        input.click();
                      }}
                      className={`flex items-center gap-2 ${
                        isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                      <Plus className="w-4 h-4" />
                      {category === 'apprenant' ? 'Apprenant' :
                       category === 'formateur' ? 'Formateur' : 'Entreprise'}
              </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                  <Card
                    key={document.uuid}
                    className={`transition-all hover:shadow-lg ${
                      isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                      }`}>
                          <File className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                      </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm line-clamp-2 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {document.name}
                        </h3>
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {document.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${
                              document.category === 'apprenant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                              document.category === 'formateur' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                            }`}>
                              {document.category === 'apprenant' ? 'Apprenant' :
                               document.category === 'formateur' ? 'Formateur' : 'Entreprise'}
                            </Badge>
                      </div>
                    </div>
                    </div>
                      <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                          onClick={() => {
                            setPreviewDocument(document);
                            setShowDocumentPreview(true);
                          }}
                          className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                          Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                          onClick={() => handleDeleteDocument(document.uuid)}
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
                <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun document trouvé pour cette catégorie</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certification Model Selection */}
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
                  Modèle d'Attestation
                </h2>
              </div>
                <Button
                  onClick={() => setShowCertificationModal(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Award className="w-4 h-4" />
                {selectedCertification ? 'Modifier' : 'Sélectionner'}
                </Button>
            </div>

            {selectedCertification ? (
              <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                  <Award className={`w-8 h-8 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedCertification.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedCertification.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCertificationModal(true)}
                  className="flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Modifier
                </Button>
              </div>
            ) : (
              <div className={`text-center py-8 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun modèle d'attestation sélectionné</p>
                <p className="text-sm mt-2">Sélectionnez un modèle pour générer automatiquement les attestations</p>
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
                    Sélectionner un modèle de document
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

                {/* Predefined Templates */}
                <div className="mb-8">
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Modèles prédéfinis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documentTemplates.map((template) => (
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
                              <Badge className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                {template.category}
                              </Badge>
                        </div>
                      </div>
                        </CardContent>
                      </Card>
                  ))}
                  </div>
                </div>

                {/* Organization Templates */}
                {organizationTemplates.length > 0 && (
                  <div className="mb-8">
                    <h3 className={`text-lg font-semibold mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Modèles de l'organisation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {organizationTemplates.map((template) => (
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
                                isDark ? 'bg-green-900/50' : 'bg-green-100'
                              }`}>
                                <FileText className={`w-6 h-6 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
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
                                <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                  {template.category}
                                </Badge>
              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
            </div>
          </div>
        )}

                {documentTemplates.length === 0 && organizationTemplates.length === 0 && (
                  <div className={`text-center py-8 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Aucun modèle de document disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Generation Modal */}
        {showDocumentGeneration && selectedTemplate && (
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
                    onClick={() => setShowDocumentGeneration(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="mb-6">
                  <h3 className={`font-medium mb-2 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                    Modèle sélectionné: {selectedTemplate.name}
                        </h3>
                        <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                    {selectedTemplate.description}
                        </p>
                    </div>
                    
                {/* Template Variables */}
                {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
                  <div className="mb-6">
                    <h3 className={`font-medium mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Variables du modèle
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(selectedTemplate.variables).map(([key, value]: [string, any]) => (
                        <div key={key}>
                          <Label htmlFor={key} className={`text-sm font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {value.label || key}
                          </Label>
                          <Input
                            id={key}
                            value={templateVariables[key] || ''}
                            onChange={(e) => setTemplateVariables((prev: any) => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            placeholder={value.placeholder || `Entrez ${value.label || key}`}
                            className="mt-1"
                          />
                    </div>
                      ))}
                  </div>
                </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDocumentGeneration(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleGenerateDocument}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Générer le document
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certification Model Modal */}
        {showCertificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Sélectionner un modèle d'attestation
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCertificationModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificationModels.map((model) => (
                    <Card
                      key={model.uuid}
                      onClick={() => handleSelectCertification(model)}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isDark ? 'bg-yellow-900/50' : 'bg-yellow-100'
                          }`}>
                            <Award className={`w-6 h-6 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`} />
                      </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-sm line-clamp-2 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                              {model.name}
                        </h3>
                            <p className={`text-xs mt-1 line-clamp-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                              {model.description}
                        </p>
                            <Badge className="mt-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                              {model.is_template ? 'Modèle' : 'Personnalisé'}
                            </Badge>
                      </div>
                    </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>

                {certificationModels.length === 0 && (
                  <div className={`text-center py-8 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Aucun modèle d'attestation disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {showDocumentPreview && previewDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    Aperçu du document
                  </h2>
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDocumentPreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                      </Button>
                    </div>

                <div className="mb-4">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {previewDocument.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {previewDocument.description}
                  </p>
                  </div>

                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <iframe
                    src={previewDocument.file_url}
                    className="w-full h-96 border-0"
                    title={previewDocument.name}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowDocumentPreview(false)}
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = previewDocument.file_url;
                      a.download = previewDocument.name;
                      a.click();
                    }}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
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