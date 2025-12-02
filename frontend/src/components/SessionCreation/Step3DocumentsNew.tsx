import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useToast } from '../ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { AdvancedDocumentCreationModal } from '../CourseCreation/AdvancedDocumentCreationModal';
import { AttestationSelectionModal } from '../CourseCreation/AttestationSelectionModal';
import { courseCreation } from '../../services/courseCreation';
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
  Check,
  FolderOpen,
  Clock
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

export const Step3DocumentsNew: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { formData } = useSessionCreation();
  const { error: showError, success: showSuccess } = useToast();
  const { navigateToRoute, buildRoute, subdomain } = useSubdomainNavigation();
  const navigate = useNavigate();
  const primaryColor = organization?.primary_color || '#007aff';

  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [allOrgDocuments, setAllOrgDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesView, setShowTemplatesView] = useState(false);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState<any>(null);
  const [linkContractWithInvoice, setLinkContractWithInvoice] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'students' | 'instructors' | 'organization'>('all');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'certificates' | 'documents'>('all');

  // Load documents and templates - Use COURSE API with courseUuid
  useEffect(() => {
    if (formData.courseUuid) {
      loadDocuments();
      loadTemplates();
      loadAllOrganizationDocuments();
    }
  }, [formData.courseUuid]);

  const loadAllOrganizationDocuments = async () => {
    try {
      // Load ALL documents from organization (all courses)
      const docsRes = await courseCreation.getAllOrganizationDocuments({ 
        exclude_questionnaires: true 
      });
      console.log('📚 Organization documents loaded:', docsRes);
      
      if (docsRes.success && docsRes.data) {
        console.log('✅ Templates available:', docsRes.data.length, docsRes.data);
        setAllOrgDocuments(docsRes.data);
      } else {
        console.warn('⚠️ No documents found');
        setAllOrgDocuments([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading organization documents:', error);
      setAllOrgDocuments([]);
    }
  };

  const handleUseTemplate = async (templateDoc: any) => {
    try {
      // Copy the document to current session
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

      await courseCreation.createDocumentEnhanced(formData.courseUuid!, documentData);
      showSuccess('Document ajouté depuis template');
      loadDocuments();
      setShowTemplatesView(false);
    } catch (error: any) {
      console.error('Error using template:', error);
      showError('Erreur', 'Impossible d\'ajouter le document');
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Exclude questionnaires from documents list - use COURSE API
      const response = await courseCreation.getDocumentsEnhanced(formData.courseUuid!, {
        audience: selectedAudience === 'all' ? undefined : selectedAudience
      });
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      showError('Erreur', 'Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await courseCreation.getDocumentTemplatesEnhanced({ is_active: true });
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateDocument = async (documentData: any) => {
    try {
      if (!formData.courseUuid) {
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
        
        response = await courseCreation.createDocumentEnhanced(formData.courseUuid!, formDataToSend);
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

        response = await courseCreation.createDocumentEnhanced(formData.courseUuid!, jsonData);
      }

      if (response.success && response.data) {
        setDocuments([...documents, response.data]);
      }
      
      showSuccess('Document créé avec succès');
      loadDocuments();
    } catch (error: any) {
      console.error('Error creating document:', error);
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
        await courseCreation.deleteDocumentEnhanced(formData.courseUuid!, docToDelete.id);
        setDocuments(documents.filter(doc => doc.uuid !== documentUuid));
        showSuccess('Document supprimé');
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
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
        return 'Apprenant';
      case 'instructors':
        return 'Formateur';
      case 'organization':
        return 'Enterprise';
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffSecs < 60) return `Ajouter il y a ${diffSecs} seconde${diffSecs > 1 ? 's' : ''}`;
    if (diffMins < 60) return `Ajouter il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Ajouter il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Ajouter il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return `Ajouter le ${date.toLocaleDateString('fr-FR')}`;
  };

  // Count documents by audience
  const countByAudience = {
    all: documents.length,
    students: documents.filter(d => d.audience_type === 'students').length,
    instructors: documents.filter(d => d.audience_type === 'instructors').length,
    organization: documents.filter(d => d.audience_type === 'organization').length
  };

  const filteredDocuments = selectedAudience === 'all' 
    ? documents 
    : documents.filter(doc => doc.audience_type === selectedAudience);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Documents de la Session
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Gérez les documents, certificats et supports pédagogiques
          </p>
        </div>
      </div>

      {/* Selectionnaire Le Model D'atestation Section */}
      {!showTemplatesView && (
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Selectionnaire Le Model D'atestation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attestation Card */}
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'
                  }`}>
                    <Award className="w-8 h-8" style={{ color: '#FFD700' }} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Atesatation De Formation
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setShowAttestationModal(true)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Apercu
                      </Button>
                      {selectedAttestation && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-500 hover:bg-red-50 text-xs"
                          onClick={() => setSelectedAttestation(null)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Retirer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contrat/Invoice Link Card */}
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                  }`}>
                    <FileText className="w-8 h-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="flex-1">
                    <div className={`text-[10px] mb-2 p-1.5 rounded ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                      Cette facture est extraite depuis la partie commericale avec les informations de chaque apprenant
                    </div>
                    <h4 className={`text-xs font-medium mb-3 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Esque Vous Voulez Relier Votr Contrat De Formation Avec Une Facture
                    </h4>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="linkContract"
                          checked={linkContractWithInvoice}
                          onChange={() => setLinkContractWithInvoice(true)}
                          className="w-3.5 h-3.5"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="linkContract"
                          checked={!linkContractWithInvoice}
                          onChange={() => setLinkContractWithInvoice(false)}
                          className="w-3.5 h-3.5"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Audience Filter - Circular Badges with Counts */}
      {!showTemplatesView && (
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Tout Affichier', count: countByAudience.all },
            { value: 'students', label: 'Apprenant', count: countByAudience.students },
            { value: 'instructors', label: 'Formateur', count: countByAudience.instructors },
            { value: 'organization', label: 'Enterprise', count: countByAudience.organization }
          ].map(filter => {
            const isActive = selectedAudience === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedAudience(filter.value as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? isDark 
                      ? 'bg-blue-600 text-white border border-blue-400' 
                      : 'bg-blue-500 text-white border border-blue-300'
                    : isDark 
                      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-white text-blue-600'
                    : isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
                          const previewUrl = buildRoute(`/course/${formData.courseUuid}/document/${doc.id}`);
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
                  ? 'Commencez par ajouter des documents à votre session'
                  : `Aucun document pour l'audience "${getAudienceLabel(selectedAudience)}"`}
              </p>
              <Button
                onClick={() => {
                  // Navigate to document creation page with session UUID
                  const url = subdomain
                    ? `/${subdomain}/document-creation?courseUuid=${formData.courseUuid}`
                    : `/document-creation?courseUuid=${formData.courseUuid}`;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map(document => (
                <Card key={document.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-5">
                    {/* Document Icon */}
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-3 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      {document.document_type === 'template' ? (
                        <LayoutTemplate className="w-7 h-7" style={{ color: primaryColor }} />
                      ) : (
                        <FileText className="w-7 h-7" style={{ color: primaryColor }} />
                      )}
                    </div>

                    {/* Document Name */}
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {document.name}
                    </h3>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {document.created_at ? formatTimeAgo(document.created_at) : 'Ajouter il y a 32 secondes'}
                      </span>
                    </div>

                    {/* Audience Badge */}
                    <div className="mb-3">
                      <Badge className={`${getAudienceColor(document.audience_type)} flex items-center gap-1 w-fit px-2 py-0.5 text-xs`}>
                        {getAudienceIcon(document.audience_type)}
                        <span>{getAudienceLabel(document.audience_type)}</span>
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50 text-xs"
                        onClick={() => {
                          const url = subdomain 
                            ? `/${subdomain}/document-creation?courseUuid=${formData.courseUuid}&documentUuid=${document.uuid}`
                            : `/document-creation?courseUuid=${formData.courseUuid}&documentUuid=${document.uuid}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-500 border-red-500 hover:bg-red-50 text-xs"
                        onClick={() => handleDeleteDocument(document.uuid)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Retirer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {!showTemplatesView && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="border-2 border-dashed h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setShowAttestationModal(true)}
              >
                <FolderOpen className="w-5 h-5" />
                <span>Choisir Un Modèle Depuis La Bibliothèque</span>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-dashed h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  const url = subdomain 
                    ? `/${subdomain}/document-creation?courseUuid=${formData.courseUuid}`
                    : `/document-creation?courseUuid=${formData.courseUuid}`;
                  window.open(url, '_blank');
                }}
              >
                <Upload className="w-5 h-5" />
                <span>Importer Un Fichier</span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Document Modal */}
      <AdvancedDocumentCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDocument}
        courseUuid={formData.courseUuid || ''}
        templates={templates}
      />

      {/* Attestation Selection Modal */}
      {formData.courseUuid && (
        <AttestationSelectionModal
          isOpen={showAttestationModal}
          onClose={() => setShowAttestationModal(false)}
          onSelect={(template) => {
            setSelectedAttestation(template);
            handleUseTemplate(template);
          }}
          courseUuid={formData.courseUuid!}
        />
      )}
    </div>
  );
};

