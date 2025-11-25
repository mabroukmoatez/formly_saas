import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  Search,
  Filter,
  FileQuestion,
  FolderOpen
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useLearnerDocuments } from '../../hooks/useLearnerDocuments';
import { useLearnerQuestionnaires } from '../../hooks/useLearnerQuestionnaires';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';

export const Documents: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'documents' | 'questionnaires'>('documents');
  const [documentType, setDocumentType] = useState<'all' | 'session_documents' | 'questionnaires'>('all');
  const [questionnaireStatus, setQuestionnaireStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { documents, loading: documentsLoading, error: documentsError, refetch: refetchDocuments } = useLearnerDocuments({
    type: documentType === 'all' ? undefined : documentType,
    page: 1,
    limit: 50
  });

  const { questionnaires, loading: questionnairesLoading, error: questionnairesError, refetch: refetchQuestionnaires } = useLearnerQuestionnaires({
    status: questionnaireStatus === 'all' ? undefined : questionnaireStatus,
    page: 1,
    limit: 50
  });

  const primaryColor = organization?.primary_color || '#007aff';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('xls')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadDocument = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQuestionnaireStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Terminé</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 text-white">En retard</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const filteredDocuments = documents.filter(doc => 
    searchQuery === '' || doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuestionnaires = questionnaires.filter(q => 
    searchQuery === '' || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
              Mes Documents
            </h1>
            <p className="text-gray-500 mt-1">
              Accédez à tous vos documents et questionnaires
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="questionnaires">
                <FileQuestion className="h-4 w-4 mr-2" />
                Questionnaires
              </TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un document..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as any)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="all">Tous les documents</option>
                      <option value="session_documents">Documents de session</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Documents List */}
              {documentsLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
                  </CardContent>
                </Card>
              ) : documentsError ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-red-500">{documentsError}</p>
                    <Button onClick={() => refetchDocuments()} className="mt-4">
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun document</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Aucun document ne correspond à votre recherche.' : 'Vous n\'avez pas encore de documents.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-3xl">{getFileIcon(doc.type)}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{doc.name}</h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                {doc.session && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{doc.session.name} - {formatDate(doc.session.date)}</span>
                                  </div>
                                )}
                                {doc.course && (
                                  <span className="text-gray-500">{doc.course.name}</span>
                                )}
                                <span>{formatFileSize(doc.size)}</span>
                                <span className="text-gray-400">{formatDate(doc.received_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(doc.url)}
                              title="Voir le document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {doc.can_download && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadDocument(doc.url, doc.name)}
                                title="Télécharger"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Questionnaires Tab */}
            <TabsContent value="questionnaires" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un questionnaire..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={questionnaireStatus}
                      onChange={(e) => setQuestionnaireStatus(e.target.value as any)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="completed">Terminés</option>
                      <option value="overdue">En retard</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Questionnaires List */}
              {questionnairesLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
                  </CardContent>
                </Card>
              ) : questionnairesError ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-red-500">{questionnairesError}</p>
                    <Button onClick={() => refetchQuestionnaires()} className="mt-4">
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredQuestionnaires.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileQuestion className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun questionnaire</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Aucun questionnaire ne correspond à votre recherche.' : 'Vous n\'avez pas encore de questionnaires.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredQuestionnaires.map((questionnaire) => (
                    <Card key={questionnaire.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{questionnaire.title}</h3>
                              {getQuestionnaireStatusBadge(questionnaire.status)}
                            </div>
                            {questionnaire.description && (
                              <p className="text-sm text-gray-600 mb-2">{questionnaire.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              {questionnaire.session && (
                                <span className="text-gray-500">Session: {questionnaire.session.name}</span>
                              )}
                              {questionnaire.course && (
                                <span className="text-gray-500">Formation: {questionnaire.course.name}</span>
                              )}
                              {questionnaire.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Échéance: {formatDate(questionnaire.deadline)}</span>
                                </div>
                              )}
                              {questionnaire.completed_at && (
                                <span className="text-green-600">Terminé le {formatDate(questionnaire.completed_at)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {questionnaire.status === 'pending' || questionnaire.status === 'in_progress' ? (
                              <Button
                                style={{ backgroundColor: primaryColor }}
                                onClick={() => {
                                  // Navigate to questionnaire page
                                  window.location.href = `/learner/questionnaires/${questionnaire.id}`;
                                }}
                              >
                                Remplir
                              </Button>
                            ) : (
                              <Button variant="outline" disabled>
                                Terminé
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </LearnerLayout>
  );
};

