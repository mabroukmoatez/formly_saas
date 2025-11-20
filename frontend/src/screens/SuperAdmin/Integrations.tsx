import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Zap, Search, Plus, Loader2, Eye, Edit, Trash2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

export const Integrations: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getIntegrations();
      
      if (response.success) {
        setIntegrations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Error fetching integrations:', error);
      showError('Erreur', error.message || 'Impossible de charger les intégrations');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIntegration) return;
    setDeleting(true);
    try {
      await superAdminService.deleteIntegration(selectedIntegration.id);
      success('Succès', 'Intégration supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedIntegration(null);
      fetchIntegrations();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer l\'intégration');
    } finally {
      setDeleting(false);
    }
  };

  const handleTestIntegration = async (id: number) => {
    try {
      const response = await superAdminService.testIntegration(id);
      if (response.success) {
        success('Succès', 'Test d\'intégration réussi');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Le test d\'intégration a échoué');
    }
  };

  const handleConnectIntegration = async (id: number) => {
    try {
      await superAdminService.connectIntegration(id);
      success('Succès', 'Intégration connectée avec succès');
      fetchIntegrations();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de connecter l\'intégration');
    }
  };

  const filteredIntegrations = integrations.filter((integration) =>
    integration.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIntegrationTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'payment':
        return 'bg-blue-500/10 text-blue-500';
      case 'storage':
        return 'bg-purple-500/10 text-purple-500';
      case 'email':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-yellow-500/10">
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Intégrations
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gérer les intégrations tierces (Stripe, AWS, etc.)
            </p>
          </div>
        </div>
        <Button className="bg-yellow-500 hover:bg-yellow-600">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une intégration
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher des intégrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : filteredIntegrations.length === 0 ? (
            <div className="text-center py-12">
              <Zap className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {searchTerm ? 'Aucune intégration trouvée' : 'Aucune intégration configurée'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => (
                <Card
                  key={integration.id}
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {integration.name}
                        </h3>
                        <Badge className={getIntegrationTypeColor(integration.type)}>
                          {integration.type || 'Unknown'}
                        </Badge>
                      </div>
                      {integration.is_connected ? (
                        <Badge className="bg-green-500/10 text-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/10 text-gray-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                    </div>
                    
                    {integration.description && (
                      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {integration.description}
                      </p>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleTestIntegration(integration.id)}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                      {!integration.is_connected && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleConnectIntegration(integration.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connect
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowDeleteModal(true);
                        }}
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
          setSelectedIntegration(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer l'intégration"
        message={`Êtes-vous sûr de vouloir supprimer l'intégration "${selectedIntegration?.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
        variant="destructive"
      />
    </div>
  );
};
