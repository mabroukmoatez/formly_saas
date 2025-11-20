import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useQualityDocuments } from '../../hooks/useQualityDocuments';
import { AddDocumentModal } from '../../components/QualityDashboard/AddDocumentModal';
import { AddEvidenceModal } from '../../components/QualityDashboard/AddEvidenceModal';
import { Loader2, Eye, Download, Trash2, Search, Filter, Calendar, FileText } from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import { deleteQualityDocument, downloadQualityDocument } from '../../services/qualityManagement';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

export const Documents = (): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const [selectedType, setSelectedType] = useState<'procedure' | 'model' | 'evidence' | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { documents, loading, error, refetch } = useQualityDocuments(selectedType);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const { success, error: showError } = useToast();

  const getDocumentIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const getDocumentBgColor = (type: string) => {
    switch (type) {
      case 'procedure':
        return 'bg-orange-100';
      case 'template':
        return 'bg-blue-100';
      case 'proof':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleView = async (docId: number) => {
    try {
      const response = await downloadQualityDocument(docId);
      // downloadQualityDocument retourne response.data de l'API
      // L'API retourne { success: true, data: { url: "...", expiresAt: "..." } }
      // Donc response = { url: "...", expiresAt: "..." } ou { success: true, data: { url: "...", expiresAt: "..." } }
      const url = response?.data?.url || response?.url;
      
      if (url) {
        window.open(url, '_blank');
      } else {
        console.error('No URL in response:', response);
        showError('Erreur', 'Impossible d\'ouvrir le document - URL non disponible');
      }
    } catch (err: any) {
      console.error('Error viewing document:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleDownload = async (docId: number) => {
    try {
      const response = await downloadQualityDocument(docId);
      // downloadQualityDocument retourne response.data de l'API
      // L'API retourne { success: true, data: { url: "...", expiresAt: "..." } }
      // Donc response = { url: "...", expiresAt: "..." } ou { success: true, data: { url: "...", expiresAt: "..." } }
      const url = response?.data?.url || response?.url;
      
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = response?.data?.name || response?.name || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success('Téléchargement démarré');
      } else {
        console.error('No URL in response:', response);
        showError('Erreur', 'Impossible de télécharger le document - URL non disponible');
      }
    } catch (err: any) {
      console.error('Error downloading document:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue lors du téléchargement');
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) {
      return;
    }

    try {
      const response = await deleteQualityDocument(docId);
      if (response.success) {
        success('Document supprimé avec succès');
        refetch();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error deleting document:', err);
      showError('Erreur', 'Une erreur est survenue lors de la suppression');
    }
  };

  const handleAddDocument = () => {
    if (selectedType === 'procedure') {
      setShowProcedureModal(true);
    } else if (selectedType === 'model') {
      setShowModelModal(true);
    } else if (selectedType === 'evidence') {
      setShowEvidenceModal(true);
    } else {
      // Default to procedure if no type selected
      setShowProcedureModal(true);
    }
  };

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents;
    return documents.filter((doc) => {
      const name = (doc.name || doc.filename || '').toLowerCase();
      const description = (doc.description || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || description.includes(search);
    });
  }, [documents, searchTerm]);

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-blue-400' : 'text-[#ff7700]'}`} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
          <CardContent className="text-center py-8">
            <p className={isDark ? 'text-red-400' : 'text-red-500'}>Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Page Title Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-[#ecf1fd]'}`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <FileText className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Bibliothèque de Documents
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Gérez vos procédures, modèles et preuves Qualiopi
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px] mb-6`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            {/* Filter Button */}
            <Button
              variant="outline"
              className={`${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {selectedType && (
                <Badge className="ml-2 bg-blue-500 text-white">
                  1
                </Badge>
              )}
            </Button>
            {/* Add Document Button */}
            <Button 
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90"
              onClick={handleAddDocument}
            >
              Ajouter Un Document
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                    Type:
                  </span>
                  <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className={selectedType === undefined 
                ? `${isDark ? 'bg-gray-700 border-blue-500 text-blue-400' : 'bg-[#ffe5ca] border-[#ff7700] text-[#ff7700]'} font-semibold` 
                : `${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-[#dadfe8] text-[#6a90b9]'}`}
              onClick={() => setSelectedType(undefined)}
            >
              Tous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedType === 'procedure' 
                ? `${isDark ? 'bg-gray-700 border-blue-500 text-blue-400' : 'bg-[#ffe5ca] border-[#ff7700] text-[#ff7700]'} font-semibold` 
                : `${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-[#dadfe8] text-[#6a90b9]'}`}
              onClick={() => setSelectedType('procedure')}
            >
              Procédures
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedType === 'model' 
                ? `${isDark ? 'bg-gray-700 border-blue-500 text-blue-400' : 'bg-[#ffe5ca] border-[#ff7700] text-[#ff7700]'} font-semibold` 
                : `${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-[#dadfe8] text-[#6a90b9]'}`}
              onClick={() => setSelectedType('model')}
            >
              Modèles
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedType === 'evidence' 
                ? `${isDark ? 'bg-gray-700 border-blue-500 text-blue-400' : 'bg-[#ffe5ca] border-[#ff7700] text-[#ff7700]'} font-semibold` 
                : `${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-[#dadfe8] text-[#6a90b9]'}`}
              onClick={() => setSelectedType('evidence')}
            >
              Preuves
            </Button>
          </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
        <CardHeader>
          <CardTitle className={`${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Documents {selectedType && `- ${selectedType === 'procedure' ? 'Procédures' : selectedType === 'model' ? 'Modèles' : 'Preuves'}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <p className={`[font-family:'Poppins',Helvetica] mb-2 ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                {searchTerm ? 'Aucun document trouvé' : 'Aucun document'}
              </p>
              <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-500' : 'text-[#6a90b9]/70'}`}>
                {searchTerm 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Ajoutez votre premier document pour commencer'}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-4 p-4 rounded-[10px] border ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-[#ebf1ff] hover:border-[#ff7700]'} hover:shadow-md transition-all cursor-pointer ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}
              >
                <div className={`flex items-center justify-center p-[17px] ${getDocumentBgColor(doc.type)} rounded-xl`}>
                  <span className="text-3xl">
                      {getDocumentIcon(doc.name || doc.filename || '')}
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    <h4 className={`[font-family:'Inter',Helvetica] font-semibold text-base ${isDark ? 'text-white' : 'text-black'}`}>
                      {doc.name || doc.filename || 'Document sans nom'}
                  </h4>
                    {/* Date and Author */}
                    {(doc.createdAt || doc.created_at || doc.uploadedBy) && (
                      <div className="flex items-center gap-4 text-xs">
                        {doc.createdAt && (
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {doc.created_at && (
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {doc.uploadedBy && (
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            Par {doc.uploadedBy}
                          </span>
                        )}
                      </div>
                    )}
                    {doc.indicatorIds && doc.indicatorIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-[6.97px]">
                          {doc.indicatorIds.slice(0, 3).map((num) => (
                          <div
                            key={num}
                            className="flex items-center justify-center w-5 h-5 bg-[#6a90b9] rounded-full"
                          >
                            <span className="[font-family:'Poppins',Helvetica] font-semibold text-white text-xs text-center">
                              {num}
                            </span>
                          </div>
                        ))}
                      </div>
                        {doc.indicatorIds.length > 3 && (
                      <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-sm">
                            +{doc.indicatorIds.length - 3} Indicateurs
                      </span>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-sm">
                        {doc.type.toUpperCase()}
                      </span>
                        {doc.size && (
                        <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-sm">
                            {doc.size}
                          </span>
                        )}
                        {doc.sizeBytes && (
                          <span className={`[font-family:'Inter',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-400' : 'text-[#00000066]'}`}>
                            {formatFileSize(doc.sizeBytes)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(doc.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.id);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddDocumentModal
        isOpen={showProcedureModal}
        onClose={() => setShowProcedureModal(false)}
        type="procedure"
        onSuccess={async () => {
          setShowProcedureModal(false);
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 300));
          await refetch();
        }}
      />
      <AddDocumentModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        type="model"
        onSuccess={async () => {
          setShowModelModal(false);
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 300));
          await refetch();
        }}
      />
      <AddEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        onSuccess={async () => {
          setShowEvidenceModal(false);
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 300));
          await refetch();
        }}
      />
    </div>
  );
};

