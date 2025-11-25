import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Folder,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  ChevronRight,
  Search,
  Plus,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { getSharedFolders, createFolder, uploadFile, deleteFile, deleteFolder, downloadFile, viewFile, SharedFolder, SharedFile } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';

export const SharedFolders: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'qualiopi' | 'my-files'>('qualiopi');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  const primaryColor = organization?.primary_color || '#007aff';

  useEffect(() => {
    fetchFolders();
  }, [currentFolderId, activeTab]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSharedFolders({
        folder_id: currentFolderId || undefined,
        course_id: activeTab === 'qualiopi' ? undefined : undefined // Adjust based on your logic
      });
      if (response.success && response.data) {
        setFolders(response.data.folders || []);
        setFiles(response.data.files || []);
      } else {
        setError('Erreur lors du chargement des dossiers');
      }
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showError('Erreur', 'Veuillez entrer un nom de dossier');
      return;
    }

    try {
      const response = await createFolder({
        name: newFolderName.trim(),
        parent_folder_id: currentFolderId || undefined
      });
      if (response.success) {
        showSuccess('Succès', 'Dossier créé avec succès');
        setShowCreateFolder(false);
        setNewFolderName('');
        fetchFolders();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) {
        formData.append('folder_id', currentFolderId.toString());
      }

      const response = await uploadFile(formData);
      if (response.success) {
        showSuccess('Succès', 'Fichier uploadé avec succès');
        fetchFolders();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const response = await deleteFile(fileId);
      if (response.success) {
        showSuccess('Succès', 'Fichier supprimé avec succès');
        fetchFolders();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) return;

    try {
      const response = await deleteFolder(folderId);
      if (response.success) {
        showSuccess('Succès', 'Dossier supprimé avec succès');
        fetchFolders();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleDownloadFile = async (file: SharedFile) => {
    try {
      if (file.can_download) {
        const response = await downloadFile(file.id);
        if (response?.data?.url || response?.url) {
          const url = response.data?.url || response.url;
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        showError('Erreur', 'Vous n\'avez pas la permission de télécharger ce fichier');
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleViewFile = async (file: SharedFile) => {
    try {
      if (file.can_view) {
        const response = await viewFile(file.id);
        if (response?.data?.url || response?.url) {
          const url = response.data?.url || response.url;
          window.open(url, '_blank');
        }
      } else {
        showError('Erreur', 'Vous n\'avez pas la permission de voir ce fichier');
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredFolders = folders.filter(folder =>
    searchQuery === '' || folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    searchQuery === '' || file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
              Dossiers Partagés
            </h1>
            <p className="text-gray-500 mt-1">
              Accédez à vos dossiers et fichiers partagés
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="qualiopi">Mon dossier Qualiopi</TabsTrigger>
              <TabsTrigger value="my-files">Mes fichiers</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Breadcrumb */}
              {currentFolderId && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFolderId(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                  </Button>
                </div>
              )}

              {/* Actions */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleUploadFile}
                        disabled={uploading}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Uploader
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateFolder(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau dossier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Folders and Files */}
              {loading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
                  </CardContent>
                </Card>
              ) : error ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-red-500">{error}</p>
                    <Button onClick={() => fetchFolders()} className="mt-4">
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Folders */}
                  {filteredFolders.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredFolders.map((folder) => (
                        <Card
                          key={folder.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Folder className="h-8 w-8" style={{ color: primaryColor }} />
                              {folder.is_deletable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(folder.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                            <h3 className="font-semibold mb-1 truncate">{folder.name}</h3>
                            <div className="text-xs text-gray-500">
                              {folder.files_count} fichiers, {folder.subfolders_count} sous-dossiers
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Files */}
                  {filteredFiles.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Fichiers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {filteredFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{file.name}</h4>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>{formatDate(file.created_at)}</span>
                                    {file.uploaded_by && (
                                      <span>Par {file.uploaded_by.name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {file.can_view && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewFile(file)}
                                    title="Voir"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {file.can_download && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadFile(file)}
                                    title="Télécharger"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Aucun dossier ou fichier</h3>
                        <p className="text-gray-500">
                          {searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Ce dossier est vide.'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Create Folder Modal */}
          {showCreateFolder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md m-4">
                <CardHeader>
                  <CardTitle>Créer un dossier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom du dossier</label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Entrez le nom du dossier"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateFolder();
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      className="flex-1"
                      style={{ backgroundColor: primaryColor }}
                      onClick={handleCreateFolder}
                    >
                      Créer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};

