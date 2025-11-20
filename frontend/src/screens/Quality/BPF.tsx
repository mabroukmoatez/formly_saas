import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Download, History, Send } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import {
  getQualityBPFs,
  getQualityBPF,
  getBPFHistory,
  submitQualityBPF,
  deleteQualityBPF,
  getBPFArchives,
  exportBPF,
  QualityBPF,
} from '../../services/qualityManagement';
import { formatDate, formatDateTime, formatDateISO } from '../../utils/dateFormatter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

interface BPFHistoryEntry {
  id: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  action: 'create' | 'update' | 'submit';
  user: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface BPFArchive {
  id: number;
  year: number;
  status: 'submitted' | 'approved';
  submittedDate?: string;
  createdAt: string;
  data?: any;
}

export const BPF = (): JSX.Element => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const { navigateToRoute } = useSubdomainNavigation();

  const currentYear = new Date().getFullYear();
  const [currentBPF, setCurrentBPF] = useState<QualityBPF | null>(null);
  const [archives, setArchives] = useState<BPFArchive[]>([]);
  const [history, setHistory] = useState<BPFHistoryEntry[]>([]);
  const [loadingBPF, setLoadingBPF] = useState(true);
  const [loadingArchives, setLoadingArchives] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBPF, setSelectedBPF] = useState<QualityBPF | null>(null);

  useEffect(() => {
    fetchCurrentBPF();
    fetchArchives();
  }, []);

  const fetchCurrentBPF = async () => {
    setLoadingBPF(true);
    try {
      const response = await getQualityBPFs({ year: currentYear, status: 'draft' });
      if (response.success) {
        const bpfs = response.data?.bpfs || response.data?.data || [];
        const bpfsArray = Array.isArray(bpfs) ? bpfs : [];
        const draftBPF = bpfsArray.find((bpf: QualityBPF) => bpf.year === currentYear && bpf.status === 'draft');
        setCurrentBPF(draftBPF || null);
      }
    } catch (err: any) {
      console.error('Error fetching current BPF:', err);
      showError('Erreur', 'Impossible de charger le BPF actuel');
    } finally {
      setLoadingBPF(false);
    }
  };

  const fetchArchives = async () => {
    setLoadingArchives(true);
    try {
      const response = await getBPFArchives();
      if (response.success) {
        const archivesArray = response.data?.archives || response.data?.data || [];
        setArchives(Array.isArray(archivesArray) ? archivesArray : []);
      }
    } catch (err: any) {
      console.error('Error fetching archives:', err);
      showError('Erreur', 'Impossible de charger les archives');
    } finally {
      setLoadingArchives(false);
    }
  };

  const fetchBPFHistory = async (bpfId: number) => {
    setLoadingHistory(true);
    try {
      const response = await getBPFHistory(bpfId);
      if (response.success && response.data?.history) {
        setHistory(response.data.history);
      } else if (response.success && Array.isArray(response.data)) {
        setHistory(response.data);
      } else {
        setHistory([]);
      }
    } catch (err: any) {
      console.error('Error fetching BPF history:', err);
      showError('Erreur', 'Impossible de charger l\'historique');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditBPF = (bpf: QualityBPF) => {
    navigateToRoute(`/quality/bpf/${bpf.id}/edit`);
  };

  const handleSubmitBPF = async () => {
    if (!currentBPF?.id) {
      showError('Erreur', 'Aucun BPF à soumettre');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitQualityBPF(currentBPF.id, {
        submittedTo: 'DREETS',
        submissionMethod: 'online',
        notes: 'BPF soumis via l\'application',
      });

      if (response.success) {
        success('BPF soumis avec succès');
        setShowSubmitModal(false);
        fetchCurrentBPF();
        fetchArchives();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error submitting BPF:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBPF = async (bpfId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce BPF ?')) {
      return;
    }
    try {
      const response = await deleteQualityBPF(bpfId);
      if (response.success) {
        success('BPF supprimé avec succès');
        fetchCurrentBPF();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error deleting BPF:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la suppression');
    }
  };

  const handleExportBPF = async (bpfId: number) => {
    try {
      const response = await exportBPF(bpfId, 'pdf');
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank');
        success('Export du BPF démarré');
      } else {
        showError('Erreur', response.error?.message || 'Impossible d\'exporter le BPF');
      }
    } catch (err: any) {
      console.error('Error exporting BPF:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de l\'export');
    }
  };

  const handleViewHistory = async (bpf: QualityBPF) => {
    setSelectedBPF(bpf);
    setShowHistoryModal(true);
    await fetchBPFHistory(bpf.id);
  };

  if (loadingBPF || loadingArchives) {
    return (
      <div className="px-[27px] py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            Bilan Pédagogique et Financier (BPF)
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-[#6a90b9]'} [font-family:'Poppins',Helvetica]`}>
          Le BPF doit être transmis chaque année à la DREETS avant le 30 avril
        </p>
      </div>

      {/* Current Year BPF */}
      <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px] mb-6`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            Année en cours - {currentYear}
          </CardTitle>
          {!currentBPF && (
            <Button
              onClick={() => navigateToRoute('/quality/bpf/create')}
              className="bg-[#ff7700] hover:bg-[#e66900] text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Créer le BPF {currentYear}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {currentBPF ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                      BPF {currentYear}
                    </p>
                    <Badge className={`mt-2 ${currentBPF.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {currentBPF.status === 'draft' ? 'Brouillon' : currentBPF.status === 'submitted' ? 'Soumis' : 'Approuvé'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBPF(currentBPF)}
                      className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Modifier
                    </Button>
                    {currentBPF.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBPF(currentBPF);
                          setShowSubmitModal(true);
                        }}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Send className="mr-2 h-4 w-4" /> Soumettre
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(currentBPF)}
                      className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                    >
                      <History className="mr-2 h-4 w-4" /> Historique
                    </Button>
                  <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportBPF(currentBPF.id)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="mr-2 h-4 w-4" /> Exporter
                  </Button>
                  <Button 
                    variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteBPF(currentBPF.id)}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                      <Trash2 className="mr-2 h-4 w-4" />
                  </Button>
                  </div>
                </div>
                {currentBPF.data && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>Sessions</p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                        {currentBPF.data.training?.totalSessions || 0}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>Participants</p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                        {currentBPF.data.training?.totalParticipants || 0}
                    </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>Chiffre d'affaires</p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                        {currentBPF.data.financial?.totalRevenue?.toLocaleString('fr-FR') || 0} €
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica] mb-4`}>
                Aucun BPF enregistré pour {currentYear}
              </p>
              <Button
                onClick={() => navigateToRoute('/quality/bpf/create')}
                className="bg-[#ff7700] hover:bg-[#e66900] text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Créer le BPF {currentYear}
              </Button>
                </div>
          )}
              </CardContent>
            </Card>

      {/* Archives */}
      <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
        <CardHeader>
          <CardTitle className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            Archives
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archives.length === 0 ? (
            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
              Aucun BPF archivé
            </p>
          ) : (
            <div className="space-y-3">
              {archives.map((archive) => (
                <div
                  key={archive.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#ff7700] to-[#ff9500] rounded-lg flex items-center justify-center">
                      <span className={`font-bold text-white text-lg [font-family:'Poppins',Helvetica]`}>
                        {archive.year}
                          </span>
                        </div>
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                        BPF {archive.year}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
                        Soumis le {archive.submittedDate ? formatDate(new Date(archive.submittedDate)) : 'N/A'}
                      </p>
                        </div>
                      </div>
                  <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                      onClick={() => handleViewHistory(archive)}
                      className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                        >
                      <History className="mr-2 h-4 w-4" /> Historique
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                      onClick={() => handleExportBPF(archive.id)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                      <Download className="mr-2 h-4 w-4" /> Exporter
                        </Button>
                      </div>
                </div>
              ))}
            </div>
          )}
                    </CardContent>
                  </Card>

      {/* Submit BPF Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-md`}>
          <DialogHeader>
            <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
              Soumettre le BPF {currentYear}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Êtes-vous sûr de vouloir soumettre ce BPF ? Une fois soumis, il sera archivé et vous ne pourrez plus le modifier.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
              className={isDark ? 'border-gray-600' : ''}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitBPF}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Soumission...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Soumettre
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-3xl max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
              Historique des modifications - BPF {selectedBPF?.year}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
              </div>
            ) : history.length === 0 ? (
              <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
                Aucun historique disponible
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                          {entry.user.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
                          {formatDateTime(new Date(entry.createdAt))}
                        </p>
                      </div>
                      <Badge className={entry.action === 'create' ? 'bg-green-100 text-green-800' : entry.action === 'update' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                        {entry.action === 'create' ? 'Création' : entry.action === 'update' ? 'Modification' : 'Soumission'}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                        <strong>Champ:</strong> {entry.fieldName}
                      </p>
                      {entry.oldValue && (
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                          <strong>Ancienne valeur:</strong> {entry.oldValue}
                        </p>
                      )}
                      {entry.newValue && (
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                          <strong>Nouvelle valeur:</strong> {entry.newValue}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowHistoryModal(false)}
              className="bg-[#ff7700] hover:bg-[#e66900] text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
