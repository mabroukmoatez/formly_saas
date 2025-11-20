import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { TrendingUp, Users, BookOpen, DollarSign, Loader2, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const Analytics: React.FC = () => {
  const { isDark } = useTheme();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState('30d');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | undefined>();
  const [organizations, setOrganizations] = useState<any[]>([]);

  const periods = [
    { value: '24h', label: '24 heures' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '1y', label: '1 an' },
  ];

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedOrganizationId]);

  const fetchOrganizations = async () => {
    try {
      const response = await superAdminService.getOrganizations({ per_page: 100 });
      if (response.success) {
        const orgs = response.data?.data || response.data || [];
        setOrganizations(Array.isArray(orgs) ? orgs : []);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = { period };
      if (selectedOrganizationId) {
        params.organization_id = selectedOrganizationId;
      }

      const response = await superAdminService.getAnalytics(params);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      showError('Erreur', error.message || 'Impossible de charger les analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-blue-500/10">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Analytics Dashboard
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Vue d'ensemble des statistiques système
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={selectedOrganizationId || ''}
          onChange={(e) => setSelectedOrganizationId(e.target.value ? parseInt(e.target.value) : undefined)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">Toutes les organisations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.organization_name || org.company_name || `Org #${org.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Statistics */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Utilisateurs
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total:</span>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.users?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Nouveaux:</span>
                  <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    +{analytics.users?.new || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Actifs:</span>
                  <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {analytics.users?.active || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Statistics */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cours
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total:</span>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.courses?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Publiés:</span>
                  <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {analytics.courses?.published || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Brouillons:</span>
                  <span className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {analytics.courses?.draft || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Statistics */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Revenus
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total:</span>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(analytics.revenue?.total || 0, analytics.revenue?.currency || 'EUR')}
                  </span>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Période sélectionnée
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <TrendingUp className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucune donnée disponible
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
