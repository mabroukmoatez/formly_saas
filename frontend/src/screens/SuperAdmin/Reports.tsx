import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3, Download, Plus, Loader2, FileText, Calendar, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const Reports: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'courses',
    name: '',
    start_date: '',
    end_date: '',
  });

  const reportTypes = [
    { value: 'courses', label: 'Rapport des Cours' },
    { value: 'users', label: 'Rapport des Utilisateurs' },
    { value: 'revenue', label: 'Rapport des Revenus' },
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getReports();
      if (response.success) {
        const reportsData = response.data?.data || response.data || [];
        setReports(Array.isArray(reportsData) ? reportsData : []);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      showError('Erreur', error.message || 'Impossible de charger les rapports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const submitData: any = {
        type: formData.type,
      };
      if (formData.name) submitData.name = formData.name;
      if (formData.start_date) submitData.start_date = formData.start_date;
      if (formData.end_date) submitData.end_date = formData.end_date;

      const response = await superAdminService.generateReport(submitData);
      if (response.success) {
        // Add the generated report to the local list
        const generatedReport = response.data;
        if (generatedReport) {
          // Add the report to the beginning of the list
          setReports(prevReports => [generatedReport, ...prevReports]);
        }
        
        success('Succès', 'Rapport généré avec succès');
        setShowGenerateModal(false);
        setFormData({
          type: 'courses',
          name: '',
          start_date: '',
          end_date: '',
        });
        // Still fetch reports in case backend stores them
        fetchReports();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de générer le rapport');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReportTypeLabel = (type: string) => {
    const typeObj = reportTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-indigo-500/10">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              System Reports
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Générer et exporter des rapports système
            </p>
          </div>
        </div>
        <Button 
          className="bg-indigo-500 hover:bg-indigo-600"
          onClick={() => setShowGenerateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Générer un rapport
        </Button>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucun rapport généré
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Cliquez sur "Générer un rapport" pour créer votre premier rapport
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className={`${isDark ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} hover:shadow-lg transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {report.name || getReportTypeLabel(report.type)}
                        </h3>
                        <Badge variant="outline" className="text-xs mb-2">
                          {getReportTypeLabel(report.type)}
                        </Badge>
                        {report.generated_at && (
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Généré le {formatDate(report.generated_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {report.download_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // Handle both relative and absolute URLs
                          const downloadUrl = report.download_url.startsWith('http') 
                            ? report.download_url 
                            : `${window.location.origin}${report.download_url}`;
                          window.open(downloadUrl, '_blank');
                        }}
                      >
                        <Download className="w-3 h-3 mr-2" />
                        Télécharger
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowGenerateModal(false)}>
          <Card 
            className={`w-full max-w-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Générer un rapport
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowGenerateModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <Label htmlFor="type" className={isDark ? 'text-gray-300' : ''}>
                    Type de rapport *
                  </Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="name" className={isDark ? 'text-gray-300' : ''}>
                    Nom du rapport (optionnel)
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder="Ex: Rapport mensuel novembre 2025"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className={isDark ? 'text-gray-300' : ''}>
                      Date de début (optionnel)
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date" className={isDark ? 'text-gray-300' : ''}>
                      Date de fin (optionnel)
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={generating} className="bg-indigo-500 hover:bg-indigo-600">
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
