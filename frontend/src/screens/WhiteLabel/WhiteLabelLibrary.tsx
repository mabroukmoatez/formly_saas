import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { sessionCreation } from '../../services/sessionCreation';
import { courseCreation } from '../../services/courseCreation';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';
import { DeleteConfirmationModal } from '../../components/CourseCreation/DeleteConfirmationModal';
import { 
  Search,
  FileText,
  FileSpreadsheet,
  Mail,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  BookOpen,
  Clock
} from 'lucide-react';

interface Document {
  id: number;
  uuid?: string;
  name: string;
  title?: string;
  description?: string;
  document_type?: string;
  is_questionnaire?: boolean;
  questionnaire_type?: string;
  created_at: string;
  updated_at: string;
  course_uuid?: string;
  session_uuid?: string;
  preview_url?: string;
}

export const WhiteLabelLibrary: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const { subdomain } = useSubdomainNavigation();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [activeType, setActiveType] = useState<'all' | 'document' | 'questionnaire' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    documents: 0,
    questionnaires: 0,
    emails: 0,
    total: 0
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    loadDocuments();
    loadEmailTemplates();
  }, []);
  
  useEffect(() => {
    filterDocuments();
  }, [documents, emailTemplates, activeType, searchQuery]);
  
  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Charger tous les documents de l'organisation (documents et questionnaires)
      const response = await sessionCreation.getAllOrganizationDocuments({
        exclude_questionnaires: false // Inclure les questionnaires
      });
      
      if (response.success && response.data) {
        const allDocs = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        // Séparer documents et questionnaires
        const docs = allDocs.filter((d: any) => !d.is_questionnaire && !d.questionnaire_type);
        const questionnaires = allDocs.filter((d: any) => d.is_questionnaire || d.questionnaire_type);
        
        setDocuments(allDocs);
        setStats(prev => ({
          ...prev,
          documents: docs.length,
          questionnaires: questionnaires.length,
          total: allDocs.length + prev.emails
        }));
      } else {
        setDocuments([]);
        setStats(prev => ({ ...prev, documents: 0, questionnaires: 0, total: prev.emails }));
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      showError('Erreur lors du chargement des documents');
      setDocuments([]);
      setStats(prev => ({ ...prev, documents: 0, questionnaires: 0, total: prev.emails }));
    } finally {
      setLoading(false);
    }
  };
  
  const loadEmailTemplates = async () => {
    try {
      const response = await apiService.getEmailTemplates();
      if (response.success && response.data) {
        const templates = Array.isArray(response.data) ? response.data : (response.data.templates || []);
        setEmailTemplates(templates);
        setStats(prev => ({
          ...prev,
          emails: templates.length,
          total: prev.documents + prev.questionnaires + templates.length
        }));
      }
    } catch (err) {
      console.error('Error loading email templates:', err);
    }
  };
  
  const filterDocuments = () => {
    let filtered: any[] = [];
    
    // Filter by type
    if (activeType === 'document') {
      filtered = documents.filter(d => !d.is_questionnaire && !d.questionnaire_type);
    } else if (activeType === 'questionnaire') {
      filtered = documents.filter(d => d.is_questionnaire || d.questionnaire_type);
    } else if (activeType === 'email') {
      filtered = emailTemplates;
    } else {
      filtered = [...documents, ...emailTemplates];
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) => 
        (item.name || item.title || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        (item.subject || '').toLowerCase().includes(query)
      );
    }
    
    setFilteredDocuments(filtered);
  };
  
  const handleCreateDocument = () => {
    const url = subdomain
      ? `/${subdomain}/document-creation`
      : `/document-creation`;
    window.open(url, '_blank');
  };
  
  const handleCreateQuestionnaire = () => {
    const url = subdomain
      ? `/${subdomain}/questionnaire-creation`
      : `/questionnaire-creation`;
    window.open(url, '_blank');
  };
  
  const handleCreateEmailTemplate = () => {
    const url = subdomain
      ? `/${subdomain}/email-template-creation`
      : `/email-template-creation`;
    window.open(url, '_blank');
  };
  
  const handleEditDocument = (document: Document) => {
    if (document.is_questionnaire || document.questionnaire_type) {
      const url = subdomain
        ? `/${subdomain}/questionnaire-creation?documentId=${document.id}${document.uuid ? `&questionnaireUuid=${document.uuid}` : ''}`
        : `/questionnaire-creation?documentId=${document.id}${document.uuid ? `&questionnaireUuid=${document.uuid}` : ''}`;
      window.open(url, '_blank');
    } else {
      const url = subdomain
        ? `/${subdomain}/document-creation?documentId=${document.id}`
        : `/document-creation?documentId=${document.id}`;
      window.open(url, '_blank');
    }
  };
  
  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      setDeleting(true);
      let response;
      
      // Si le document est lié à une session, utiliser sessionCreation.deleteDocumentEnhanced
      if (documentToDelete.session_uuid) {
        response = await sessionCreation.deleteDocumentEnhanced(documentToDelete.session_uuid, documentToDelete.id);
      } 
      // Si le document est lié à un cours, utiliser courseCreation.deleteDocumentEnhanced
      else if (documentToDelete.course_uuid) {
        response = await courseCreation.deleteDocumentEnhanced(documentToDelete.course_uuid, documentToDelete.id);
      } 
      // Sinon, supprimer au niveau de l'organisation
      else {
        response = await apiService.delete(`/api/organization/documents/${documentToDelete.id}`);
      }
      
      if (response.success) {
        success('Document supprimé avec succès');
        setDeleteModalOpen(false);
        setDocumentToDelete(null);
        await loadDocuments();
      } else {
        showError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      console.error('Error deleting document:', err);
      showError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR');
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: primaryColor }} />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="px-[27px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                Bibliothèque
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                Gérez vos documents et questionnaires créés
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateDocument}
              variant="outline"
              className="rounded-[10px] px-6"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Créer Document
            </Button>
            <Button
              onClick={handleCreateQuestionnaire}
              variant="outline"
              className="rounded-[10px] px-6"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Créer Questionnaire
            </Button>
            <Button
              onClick={handleCreateEmailTemplate}
              className="rounded-[10px] px-6"
              style={{ backgroundColor: primaryColor }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Créer Modèle Email
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <Card className={`border-2 rounded-[18px] mb-6 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un document..."
                  className={`pl-10 rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                />
              </div>
              
            </div>
          </CardContent>
        </Card>
        
        {/* Type Tabs */}
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)} className="space-y-6">
          <TabsList className={`rounded-[12px] ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <TabsTrigger value="all" className="rounded-[10px]">
              Tous ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="document" className="rounded-[10px]">
              <FileText className="w-4 h-4 mr-2" />
              Documents ({stats.documents})
            </TabsTrigger>
            <TabsTrigger value="questionnaire" className="rounded-[10px]">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Questionnaires ({stats.questionnaires})
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-[10px]">
              <Mail className="w-4 h-4 mr-2" />
              Emails ({stats.emails})
            </TabsTrigger>
          </TabsList>
          
          {/* Documents Grid */}
          <TabsContent value={activeType} className="space-y-6">
            {filteredDocuments.length === 0 ? (
              <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
                <CardContent className="p-12 text-center">
                  <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Aucun document trouvé
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {searchQuery ? 'Essayez avec d\'autres mots-clés' : 'Créez votre premier document'}
                  </p>
                  {!searchQuery && (
                    <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                      <Button
                        onClick={handleCreateDocument}
                        className="rounded-[10px]"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Créer Document
                      </Button>
                      <Button
                        onClick={handleCreateQuestionnaire}
                        variant="outline"
                        className="rounded-[10px]"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Créer Questionnaire
                      </Button>
                      <Button
                        onClick={handleCreateEmailTemplate}
                        variant="outline"
                        className="rounded-[10px]"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Créer Modèle Email
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((item: any) => {
                  // Check if it's an email template
                  if (item.type === 'email' || item.subject) {
                    return (
                      <Card 
                        key={item.id}
                        className={`border-2 rounded-[18px] hover:shadow-lg transition-shadow ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}
                      >
                        <CardContent className="p-6">
                          <div className={`mb-4 rounded-[12px] aspect-video flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Mail className="w-12 h-12 text-gray-400" />
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                                {item.name || 'Sans titre'}
                              </h3>
                              {item.description && (
                                <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {item.description}
                                </p>
                              )}
                              {item.subject && (
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Objet: {item.subject}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Badge 
                                variant="outline"
                                className={`text-xs ${isDark ? 'border-gray-600 text-gray-300' : ''}`}
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Créé {formatDate(item.created_at)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const url = subdomain
                                    ? `/${subdomain}/email-template-creation?templateId=${item.id}`
                                    : `/email-template-creation?templateId=${item.id}`;
                                  window.open(url, '_blank');
                                }}
                                className="flex-1 rounded-[8px]"
                                style={{ color: primaryColor }}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) return;
                                  try {
                                    const response = await apiService.deleteEmailTemplate(item.id);
                                    if (response.success) {
                                      success('Modèle d\'email supprimé avec succès');
                                      await loadEmailTemplates();
                                    }
                                  } catch (err: any) {
                                    showError(err.message || 'Erreur lors de la suppression');
                                  }
                                }}
                                className="rounded-[8px] text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Document or Questionnaire
                  const isQuestionnaire = item.is_questionnaire || item.questionnaire_type;
                  return (
                    <Card 
                      key={item.id}
                      className={`border-2 rounded-[18px] hover:shadow-lg transition-shadow ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}
                    >
                      <CardContent className="p-6">
                        {/* Preview Image */}
                        {item.preview_url ? (
                          <div className="mb-4 rounded-[12px] overflow-hidden bg-gray-100 aspect-video">
                            <img
                              src={fixImageUrl(item.preview_url)}
                              alt={item.name || item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`mb-4 rounded-[12px] aspect-video flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {isQuestionnaire ? (
                              <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                            ) : (
                              <FileText className="w-12 h-12 text-gray-400" />
                            )}
                          </div>
                        )}
                        
                        {/* Document Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                              {item.name || item.title || 'Sans titre'}
                            </h3>
                            {item.description && (
                              <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant="outline"
                              className={`text-xs ${isDark ? 'border-gray-600 text-gray-300' : ''}`}
                            >
                              {isQuestionnaire ? (
                                <>
                                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                                  Questionnaire
                                </>
                              ) : (
                                <>
                                  <FileText className="w-3 h-3 mr-1" />
                                  Document
                                </>
                              )}
                            </Badge>
                            {item.questionnaire_type && (
                              <Badge className="text-xs bg-blue-100 text-blue-700">
                                {item.questionnaire_type}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Créé {formatDate(item.created_at)}</span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDocument(item)}
                              className="flex-1 rounded-[8px]"
                              style={{ color: primaryColor }}
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(item)}
                              className="rounded-[8px] text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setDocumentToDelete(null);
          }
        }}
        onConfirm={confirmDeleteDocument}
        type={documentToDelete?.is_questionnaire || documentToDelete?.questionnaire_type ? 'questionnaire' : 'document'}
        itemName={documentToDelete?.name || documentToDelete?.title || ''}
        isLoading={deleting}
      />
    </DashboardLayout>
  );
};

