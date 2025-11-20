import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Cloud, Search, Upload, Loader2, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const AwsCosts: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [costsByClient, setCostsByClient] = useState<any[]>([]);
  const [aggregatedCosts, setAggregatedCosts] = useState<any>(null);
  const [period, setPeriod] = useState('monthly');

  const periods = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
  ];

  useEffect(() => {
    fetchCosts();
  }, [period]);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const [costsByClientRes, aggregatedRes] = await Promise.all([
        superAdminService.getAwsCostsByClient(),
        superAdminService.getAggregatedAwsCosts(period),
      ]);
      
      if (costsByClientRes.success) {
        // Ensure data is an array
        setCostsByClient(Array.isArray(costsByClientRes.data) ? costsByClientRes.data : []);
      }
      if (aggregatedRes.success) {
        setAggregatedCosts(aggregatedRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching AWS costs:', error);
      showError('Erreur', error.message || 'Impossible de charger les coûts AWS');
      setCostsByClient([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleImportCosts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await superAdminService.importAwsCosts(file);
      if (response.success) {
        success('Succès', 'Coûts AWS importés');
        fetchCosts();
      }
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-orange-500/10">
            <Cloud className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Coûts AWS
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Observabilité et gestion des coûts cloud AWS
            </p>
          </div>
        </div>
        <label>
          <input type="file" accept=".csv" className="hidden" onChange={handleImportCosts} />
          <Button className="bg-orange-500 hover:bg-orange-600" as="span">
            <Upload className="w-4 h-4 mr-2" />
            Importer les coûts
          </Button>
        </label>
      </div>

      {/* Aggregated Stats */}
      {aggregatedCosts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Coût total</p>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${aggregatedCosts.total_cost?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tendance</p>
              </div>
              <p className={`text-2xl font-bold ${aggregatedCosts.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {aggregatedCosts.trend > 0 ? '+' : ''}{aggregatedCosts.trend?.toFixed(1) || '0'}%
              </p>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-purple-500" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Services actifs</p>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {aggregatedCosts.active_services || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Period Filter */}
      <div className="flex gap-2 mb-6">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Costs by Client */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : costsByClient.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucune donnée de coûts disponible
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organisation</th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Instance</th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Coût</th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {costsByClient.map((cost, index) => (
                    <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {cost.organization_name}
                      </td>
                      <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {cost.instance_id || '-'}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ${cost.total_cost?.toFixed(2) || '0.00'}
                      </td>
                      <td className={`py-3 px-4 ${cost.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {cost.trend > 0 ? '+' : ''}{cost.trend?.toFixed(1) || '0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

