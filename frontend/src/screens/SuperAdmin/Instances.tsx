import React, { useState, useEffect } from 'react';
import { Server, Play, Pause, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, Instance } from '../../services/superAdmin';

export const SuperAdminInstances: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchInstances();
  }, [statusFilter]);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getInstances({
        status: statusFilter || undefined,
      });
      if (response.success) {
        setInstances(response.data);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les instances');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Server className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#007aff15' }}>
            <Server className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Instances
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Gérer toutes les instances
            </p>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
          <option value="error">Erreur</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : instances.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Server className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucune instance</p>
          </div>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(instance.status)}
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {instance.organization?.organization_name || `Instance #${instance.id}`}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {instance.region}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Statut:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      instance.status === 'active' ? 'bg-green-100 text-green-800' :
                      instance.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {instance.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Santé:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      instance.health_status === 'ok' ? 'bg-green-100 text-green-800' :
                      instance.health_status === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {instance.health_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Type:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {instance.instance_type}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Redémarrer
                  </Button>
                  {instance.status === 'active' ? (
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Pause className="w-4 h-4 mr-2" />
                      Suspendre
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Reprendre
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
};

