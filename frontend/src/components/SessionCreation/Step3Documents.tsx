import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useToast } from '../ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { AdvancedDocumentCreationModal } from './AdvancedDocumentCreationModal';
import { InheritedBanner, SectionOverrideHeader } from './OverrideIndicator';
import { sessionCreation } from '../../services/sessionCreation';
import { CourseDocumentEnhanced, CourseDocumentTemplateEnhanced } from '../../services/courseCreation.types';
import { 
  FileText, 
  Trash2, 
  Download,
  Plus,
  Users,
  User,
  Building2,
  Award,
  Eye,
  Edit3,
  Upload,
  LayoutTemplate,
  Check
} from 'lucide-react';

interface CourseDocument {
  id: number;
  uuid: string;
  course_uuid: string;
  name: string;
  description?: string;
  document_type: 'template' | 'uploaded_file';
  template_id?: number;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  audience_type: 'students' | 'instructors' | 'organization';
  position: number;
  is_certificate: boolean;
  template_variables?: Record<string, any>;
  is_generated?: boolean;
  generated_at?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentTemplate {
  id: number;
  name: string;
  description?: string;
  type: 'certificate' | 'contract' | 'questionnaire' | 'evaluation' | 'custom';
  content?: string;
  fields?: Record<string, string>;
  logo_url?: string;
  is_active: boolean;
}

export const Step3Documents: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { 
    formData,
    // Override system
    isSessionMode,
    hasDocumentsOverride,
    courseTemplate,
    resetDocumentsToTemplate
  } = useSessionCreation();
  const { error: showError, success: showSuccess } = useToast();
  const { navigateToRoute, buildRoute, subdomain } = useSubdomainNavigation();
  const primaryColor = organization?.primary_color || '#007aff';

  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [allOrgDocuments, setAllOrgDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesView, setShowTemplatesView] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'students' | 'instructors' | 'organization'>('all');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'certificates' | 'documents'>('all');

  // Load documents and templates
  useEffect(() => {
    if (formData.sessionUuid) {
      loadDocuments();
      loadTemplates();
      loadAllOrganizationDocuments();
    }
  }, [formData.sessionUuid]);

  const loadAllOrganizationDocuments = async () => {
    try {
      // Load ALL documents from organization (all courses)
      const docsRes = await sessionCreation.getAllOrganizationDocuments({ 
        exclude_questionnaires: true 
      });
      if (docsRes.success && docsRes.data) {
        setAllOrgDocuments(docsRes.data);
      } else {
        setAllOrgDocuments([]);
      }
    } catch (error: any) {
      setAllOrgDocuments([]);
    }
  };

  const handleUseTemplate = async (templateDoc: any) => {
    try {
      // Copy the document to current course
      const documentData: any = {
        name: `${templateDoc.name} (copie)`,
        description: templateDoc.description,
        document_type: templateDoc.document_type,
        audience_type: templateDoc.audience_type,
        is_certificate: templateDoc.is_certificate,
        custom_template: templateDoc.custom_template,
        template_variables: templateDoc.template_variables,
      };

      if (templateDoc.certificate_background_url) {
        documentData.certificate_background_url = templateDoc.certificate_background_url;
      }
      if (templateDoc.certificate_orientation) {
        documentData.certificate_orientation = templateDoc.certificate_orientation;
      }

      await sessionCreation.createDocumentEnhanced(formData.sessionUuid!, documentData);
      showSuccess('Document ajouté depuis template');
      loadDocuments();
      setShowTemplatesView(false);
    } catch (error: any) {
      showError('Erreur', 'Impossible d\'ajouter le document');
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Load documents excluding questionnaires
      const response = await sessionCreation.getDocumentsEnhanced(formData.sessionUuid!, {
        audience: selectedAudience === 'all' ? undefined : selectedAudience
      });
      
      // Handle different response structures
      let documentsData = null;
      if (response.success) {
        // Check if data is nested (response.data.data) or direct (response.data)
        documentsData = response.data?.data || response.data || [];
      }
      
      if (Array.isArray(documentsData) && documentsData.length > 0) {
        // Filter out any questionnaires that might still be in the response
        const filteredDocs = documentsData.filter((doc: any) => {
          // Exclude questionnaires (is_questionnaire === true or document_type === 'questionnaire')
          const isQuestionnaire = doc.is_questionnaire === true || 
                                  doc.is_questionnaire === 1 || 
                                  doc.document_type === 'questionnaire';
          return !isQuestionnaire;
        });
        setDocuments(filteredDocs);
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      showError('Erreur', 'Impossible de charger les documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await sessionCreation.getDocumentTemplatesEnhanced({ is_active: true });
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error: any) {
    }
  };

  const handleCreateDocument = async (documentData: any) => {
    try {
      if (!formData.sessionUuid) {
        throw new Error('UUID du cours manquant');
      }

      let response;

      // Always use FormData if we have certificate_background or file uploads
      if (documentData.document_type === 'uploaded_file' || documentData.certificate_background) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();
        formDataToSend.append('name', documentData.name);
        formDataToSend.append('document_type', documentData.document_type);
        formDataToSend.append('audience_type', documentData.audience_type);
        formDataToSend.append('is_certificate', documentData.is_certificate ? '1' : '0');  // Laravel expects '0' or '1'
        
        if (documentData.description) {
          formDataToSend.append('description', documentData.description);
        }

        // Certificate-specific fields
        if (documentData.is_certificate) {
          if (documentData.certificate_background) {
            formDataToSend.append('certificate_background', documentData.certificate_background);
          }
          if (documentData.certificate_orientation) {
            formDataToSend.append('certificate_orientation', documentData.certificate_orientation);
          }
        }
        
        if (documentData.document_type === 'uploaded_file') {
          formDataToSend.append('file', documentData.file);
        } else if (documentData.document_type === 'template') {
          formDataToSend.append('template_id', documentData.template_id.toString());
          formDataToSend.append('variables', JSON.stringify(documentData.variables || {}));
        } else if (documentData.document_type === 'custom_builder') {
          formDataToSend.append('custom_template', JSON.stringify(documentData.custom_template));
          if (documentData.variables) {
            formDataToSend.append('variables', JSON.stringify(documentData.variables));
          }
        }
        
        response = await sessionCreation.createDocumentEnhanced(formData.sessionUuid, formDataToSend);
      } else {
        // For template and custom_builder without files, use JSON
        const jsonData: any = {
          name: documentData.name,
          document_type: documentData.document_type,
          audience_type: documentData.audience_type,
          is_certificate: documentData.is_certificate === true,
        };

        if (documentData.description) {
          jsonData.description = documentData.description;
        }

        if (documentData.is_certificate && documentData.certificate_orientation) {
          jsonData.certificate_orientation = documentData.certificate_orientation;
        }

        if (documentData.document_type === 'template') {
          jsonData.template_id = documentData.template_id;
          jsonData.variables = documentData.variables || {};
        } else if (documentData.document_type === 'custom_builder') {
          jsonData.custom_template = documentData.custom_template;
          if (documentData.variables) {
            jsonData.variables = documentData.variables;
          }
        }

        response = await sessionCreation.createDocumentEnhanced(formData.sessionUuid, jsonData);
      }

      if (response.success) {
        showSuccess('Document créé avec succès');
        // Reload with multiple retries - backend may need time to process
        await loadDocuments();
        setTimeout(async () => {
          await loadDocuments();
        }, 500);
        setTimeout(async () => {
          await loadDocuments();
        }, 1500);
        setTimeout(async () => {
          await loadDocuments();
        }, 3000);
      } else {
        const errorMsg = response.message || response.error || 'Erreur lors de la création du document';
        showError('Erreur', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteDocument = async (documentUuid: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const docToDelete = documents.find(d => d.uuid === documentUuid);
      if (docToDelete) {
        await sessionCreation.deleteDocumentEnhanced(formData.sessionUuid!, docToDelete.id);
        setDocuments(documents.filter(doc => doc.uuid !== documentUuid));
        showSuccess('Document supprimé');
      }
    } catch (error: any) {
      showError('Erreur', 'Impossible de supprimer le document');
    }
  };

  const handleDownloadDocument = (document: CourseDocument) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const getAudienceIcon = (audienceType: string) => {
    switch (audienceType) {
      case 'students':
        return <Users className="w-4 h-4" />;
      case 'instructors':
        return <User className="w-4 h-4" />;
      case 'organization':
        return <Building2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getAudienceLabel = (audienceType: string) => {
    switch (audienceType) {
      case 'students':
        return 'Étudiants';
      case 'instructors':
        return 'Formateurs';
      case 'organization':
        return 'Organisation';
      default:
        return audienceType;
    }
  };

  const getAudienceColor = (audienceType: string) => {
    switch (audienceType) {
      case 'students':
        return isDark ? 'bg-blue-900/20 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300';
      case 'instructors':
        return isDark ? 'bg-purple-900/20 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300';
      case 'organization':
        return isDark ? 'bg-green-900/20 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-300';
      default:
        return isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredDocuments = selectedAudience === 'all' 
    ? documents 
    : documents.filter(doc => doc.audience_type === selectedAudience);

  return (
    <div className="space-y-6">
      {/* Session Mode Banner - Shows when documents are inherited from course */}
      {isSessionMode && !hasDocumentsOverride && courseTemplate && (
        <InheritedBanner 
          courseName={courseTemplate.title}
          isVisible={true}
        />
      )}
      
      {/* Header with Override Reset */}
      <SectionOverrideHeader
        title={showTemplatesView ? 'Templates de Documents' : 'Documents du Cours'}
        description={
          isSessionMode && hasDocumentsOverride 
            ? "Documents personnalisés pour cette session" 
            : showTemplatesView 
              ? 'Réutilisez des documents existants comme templates' 
              : 'Gérez les documents, certificats et supports pédagogiques'
        }
        hasOverrides={isSessionMode && hasDocumentsOverride}
        onResetAll={isSessionMode ? resetDocumentsToTemplate : undefined}
      />
      
      {/* Action Buttons */}
      <div className="flex items-center justify-end">
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
              onClick={() => {
                const url = subdomain
                  ? `/${subdomain}/document-creation?sessionUuid=${formData.sessionUuid}`
                  : `/document-creation?sessionUuid=${formData.sessionUuid}`;
                window.open(url, '_blank');
              }}
              style={{ backgroundColor: primaryColor }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Document
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className={`font-medium mb-1 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                Types de Documents Disponibles
              </h4>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <li>• <strong>Templates</strong> : Générez des certificats, contrats, etc. avec des variables</li>
                <li>• <strong>Upload</strong> : Importez des PDFs ou fichiers Word existants</li>
                <li>• <strong>Audience</strong> : Ciblez étudiants, formateurs ou usage interne</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience Filter */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Filtrer par audience:
        </span>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tous', icon: FileText },
            { value: 'students', label: 'Étudiants', icon: Users },
            { value: 'instructors', label: 'Formateurs', icon: User },
            { value: 'organization', label: 'Organisation', icon: Building2 }
          ].map(filter => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedAudience(filter.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedAudience === filter.value
                    ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates View */}
      {showTemplatesView ? (
        <div className="space-y-4">
          {/* Template Filters */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setTemplateFilter('all')}
              variant={templateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              Tous
            </Button>
            <Button
              onClick={() => setTemplateFilter('certificates')}
              variant={templateFilter === 'certificates' ? 'default' : 'outline'}
              size="sm"
            >
              🎓 Certificats
            </Button>
            <Button
              onClick={() => setTemplateFilter('documents')}
              variant={templateFilter === 'documents' ? 'default' : 'outline'}
              size="sm"
            >
              📄 Documents
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allOrgDocuments
              .filter(doc => {
                if (templateFilter === 'certificates') return doc.is_certificate;
                if (templateFilter === 'documents') return !doc.is_certificate && !doc.is_questionnaire;
                return !doc.is_questionnaire;  // Exclude questionnaires from documents
              })
              .map((doc: any) => (
                <Card key={doc.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-all cursor-pointer group`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc.is_certificate ? 'bg-yellow-100' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FileText className="w-6 h-6" style={{ color: doc.is_certificate ? '#FFD700' : primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {doc.name}
                        </h3>
                        {doc.description && (
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {doc.is_certificate && (
                        <Badge className="bg-[#FFF9E6] text-[#FFD700] text-xs">
                          🎓 Certificat
                        </Badge>
                      )}
                      <Badge className={`text-xs ${getAudienceColor(doc.audience_type)}`}>
                        {getAudienceLabel(doc.audience_type)}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-700 text-xs">
                        {doc.document_type}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const previewUrl = buildRoute(`/course/${formData.sessionUuid}/document/${doc.id}`);
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(doc);
                        }}
                      >
                        <Check className="w-3 h-3 mr-1 text-white" />
                        <span className="text-white">Utiliser</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {allOrgDocuments.length === 0 && (
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aucun template disponible
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* Documents List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
            </div>
          ) : filteredDocuments.length === 0 ? (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucun document
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedAudience === 'all' 
                  ? 'Commencez par ajouter des documents à votre cours'
                  : `Aucun document pour l'audience "${getAudienceLabel(selectedAudience)}"`}
              </p>
              <Button
                onClick={() => {
                  // Navigate to document creation page with session UUID
                  const url = subdomain
                    ? `/${subdomain}/document-creation?sessionUuid=${formData.sessionUuid}`
                    : `/document-creation?sessionUuid=${formData.sessionUuid}`;
                  window.open(url, '_blank');
                }}
                style={{ backgroundColor: primaryColor }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer le Premier Document
              </Button>
            </div>
          </CardContent>
        </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.map(document => (
            <Card key={document.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {document.document_type === 'template' ? (
                        <LayoutTemplate className="w-6 h-6" style={{ color: primaryColor }} />
                      ) : (
                        <Upload className="w-6 h-6" style={{ color: primaryColor }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {document.name}
                        </h3>
                        {document.is_certificate && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            <Award className="w-3 h-3 mr-1" />
                            Certificat
                          </Badge>
                        )}
                      </div>

                      {document.description && (
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {document.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        {/* Audience Badge */}
                        <Badge className={`${getAudienceColor(document.audience_type)} flex items-center gap-1`}>
                          {getAudienceIcon(document.audience_type)}
                          {getAudienceLabel(document.audience_type)}
                        </Badge>

                        {/* Type Badge */}
                        <Badge variant="outline" className={isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}>
                          {document.document_type === 'template' ? 'Template' : 'Fichier Importé'}
                        </Badge>

                        {/* File Size */}
                        {document.file_size && (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {(document.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}

                        {/* Generated Status */}
                        {document.is_generated && (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                            Généré
                          </Badge>
                        )}
                      </div>

                      {/* Template Variables Preview */}
                      {document.template_variables && Object.keys(document.template_variables).length > 0 && (
                        <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(document.template_variables).slice(0, 3).map(([key, value]) => (
                              <span key={key} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>{key}:</strong> {value as string}
                              </span>
                            ))}
                            {Object.keys(document.template_variables).length > 3 && (
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                +{Object.keys(document.template_variables).length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadDocument(document)}
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadDocument(document)}
                      className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      title="Prévisualiser"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDocument(document.uuid)}
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

      {/* Create Document Modal */}
      <AdvancedDocumentCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDocument}
        sessionUuid={formData.sessionUuid || ''}
        templates={templates}
      />
    </div>
  );
};


