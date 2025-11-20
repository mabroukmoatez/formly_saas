import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, AuditLog } from '../../services/superAdmin';

export const SuperAdminAuditLogs: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, [severityFilter, moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getAuditLogs({
        severity: severityFilter || undefined,
        module: moduleFilter || undefined,
        per_page: 50,
      });
      if (response.success) {
        // Handle different response structures
        let logsData: AuditLog[] = [];
        if (Array.isArray(response.data)) {
          logsData = response.data;
        } else if (response.data && Array.isArray(response.data.logs)) {
          logsData = response.data.logs;
        } else if (response.data && Array.isArray(response.data.data)) {
          logsData = response.data.data;
        }
        setLogs(logsData);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await superAdminService.exportAuditLogs({
        severity: severityFilter || undefined,
        module: moduleFilter || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Succès', 'Export réussi');
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible d\'exporter les logs');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#007aff15' }}>
            <FileText className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Logs d'audit
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Historique de toutes les actions
            </p>
          </div>
        </div>
        <Button onClick={handleExport} className="bg-blue-600 text-white hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
        <CardContent className="p-4">
          <div className="flex gap-4 mb-4">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="">Toutes les sévérités</option>
              <option value="critical">Critique</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="">Tous les modules</option>
              <option value="organizations">Organisations</option>
              <option value="plans">Plans</option>
              <option value="subscriptions">Abonnements</option>
              <option value="instances">Instances</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun log</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Utilisateur</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Action</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Module</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Cible</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Sévérité</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Statut</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {Array.isArray(logs) && logs.map((log) => (
                    <tr key={log.id} className={`hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatDate(log.created_at)}
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div>
                          <div className="font-semibold">{log.user_name}</div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {log.action}
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {log.module}
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {log.target_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.severity)}
                          <span className="capitalize">{log.severity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

