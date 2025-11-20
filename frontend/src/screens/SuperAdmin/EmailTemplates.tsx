import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Search, Plus, Loader2, Eye, Edit, Trash2, X, EyeOff, Eye as EyeIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { SystemEmailTemplateFormModal } from '../../components/SuperAdmin';

export const EmailTemplates: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const types = [
    { value: 'all', label: 'Tous les types' },
    { value: 'welcome', label: 'Bienvenue' },
    { value: 'password_reset', label: 'Réinitialisation mot de passe' },
    { value: 'user_created', label: 'Utilisateur créé' },
    { value: 'password_changed', label: 'Mot de passe modifié' },
    { value: 'course_enrolled', label: 'Inscription au cours' },
    { value: 'course_completed', label: 'Cours terminé' },
    { value: 'certificate_issued', label: 'Certificat émis' },
    { value: 'session_reminder', label: 'Rappel de session' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [typeFilter, activeFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (activeFilter !== 'all') params.is_active = activeFilter === 'active';

      const response = await superAdminService.getSystemEmailTemplates(params);
      if (response.success) {
        const templatesData = response.data?.templates || [];
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      showError('Erreur', error.message || 'Impossible de charger les templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTemplates();
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setDeleting(true);
    try {
      await superAdminService.deleteSystemEmailTemplate(selectedTemplate.id);
      success('Succès', 'Template supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le template');
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = async (template: any) => {
    try {
      const sampleData = {
        user_name: 'John Doe',
        user_email: 'john@example.com',
        organization_name: 'Mon Organisation',
        login_url: 'http://localhost:8000/login',
        reset_link: 'http://localhost:8000/reset-password?token=xxx',
        course_name: 'Exemple de cours',
        session_name: 'Session exemple',
        certificate_url: 'http://localhost:8000/certificates/xxx',
        date: new Date().toLocaleDateString('fr-FR'),
      };

      const response = await superAdminService.previewSystemEmailTemplate(template.id, sampleData);
      if (response.success) {
        setPreviewData(response.data);
        setSelectedTemplate(template);
        setShowPreviewModal(true);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de générer la prévisualisation');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj?.label || type;
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-sky-500/10">
            <Mail className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Templates Email Système
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gérer les templates d'email système
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher des templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucun template trouvé
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`${isDark ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} hover:shadow-lg transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {template.name}
                        </h3>
                        <Badge variant="outline" className="text-xs mb-2">
                          {getTypeLabel(template.type)}
                        </Badge>
                        {template.is_active ? (
                          <Badge className="bg-green-500/10 text-green-500 text-xs">
                            Actif
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-500 text-xs">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {template.subject}
                    </p>

                    {template.variables && template.variables.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Variables: {template.variables.slice(0, 3).join(', ')}
                          {template.variables.length > 3 && '...'}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowDetailsModal(true);
                        }}
                        title="Voir les détails"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(template)}
                        title="Prévisualiser"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowEditModal(true);
                        }}
                        title="Modifier"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowDeleteModal(true);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTemplate(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer le template"
        message={`Êtes-vous sûr de vouloir supprimer le template "${selectedTemplate?.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
        variant="destructive"
      />

      {/* Template Details Modal */}
      {showDetailsModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowDetailsModal(false)}>
          <Card 
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedTemplate.name}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getTypeLabel(selectedTemplate.type)}
                  </Badge>
                  {selectedTemplate.is_active ? (
                    <Badge className="bg-green-500/10 text-green-500">
                      Actif
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/10 text-gray-500">
                      Inactif
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sujet</h3>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedTemplate.subject}</p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Corps</h3>
                  <div 
                    className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.body || '' }}
                  />
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Variables disponibles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable: string) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowPreviewModal(false)}>
          <Card 
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Prévisualisation - {selectedTemplate.name}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowPreviewModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sujet</h3>
                  <p className={`p-3 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {previewData.subject}
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Corps</h3>
                  <div 
                    className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}
                    dangerouslySetInnerHTML={{ __html: previewData.body || '' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      <SystemEmailTemplateFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
        }}
        onSuccess={() => {
          fetchTemplates();
          setShowEditModal(false);
          setSelectedTemplate(null);
        }}
        templateId={selectedTemplate?.id}
      />
    </div>
  );
};

