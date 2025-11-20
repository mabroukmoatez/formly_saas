import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { superAdminService, SuperAdminDashboardData } from '../../services/superAdmin';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, BarChart3, Building2, Server, Users, DollarSign, Activity } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getDashboard(selectedPeriod);
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      showError('Erreur', 'Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with thousand separator
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('superadmin.dashboard.noDataAvailable')}</p>
      </div>
    );
  }

  const kpis = dashboardData.kpis;
  const instances = dashboardData.instances;

  const periodOptions = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '1y', label: '1 an' },
  ];

  const metricCards = [
    {
      title: t('superadmin.dashboard.mrr'),
      amount: formatCurrency(kpis.mrr.value, kpis.mrr.currency),
      trend: `${Math.abs(kpis.mrr.trend).toFixed(1)}%`,
      trendUp: kpis.mrr.trend >= 0,
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: t('superadmin.dashboard.arr'),
      amount: formatCurrency(kpis.arr.value, kpis.arr.currency),
      trend: null,
      trendUp: true,
      icon: Activity,
      color: 'text-green-600',
    },
    {
      title: t('superadmin.dashboard.churn'),
      amount: `${kpis.churn.value.toFixed(1)}%`,
      trend: `${kpis.churn.count} ${t('superadmin.dashboard.organizations')}`,
      trendUp: false,
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      title: t('superadmin.dashboard.arpu'),
      amount: formatCurrency(kpis.arpu.value, kpis.arpu.currency),
      trend: `${Math.abs(kpis.arpu.trend).toFixed(1)}%`,
      trendUp: kpis.arpu.trend >= 0,
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  const instanceCards = [
    {
      title: t('superadmin.dashboard.totalInstances'),
      value: instances.total,
      icon: Server,
      color: 'text-blue-600',
    },
    {
      title: t('superadmin.dashboard.activeInstances'),
      value: instances.active,
      icon: Activity,
      color: 'text-green-600',
    },
    {
      title: t('superadmin.dashboard.errorInstances'),
      value: instances.in_error,
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      title: t('superadmin.dashboard.suspendedInstances'),
      value: instances.suspended,
      icon: Server,
      color: 'text-yellow-600',
    },
  ];

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: '#007aff15' }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('superadmin.dashboard.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('superadmin.dashboard.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedPeriod === option.value ? 'default' : 'ghost'}
              onClick={() => setSelectedPeriod(option.value)}
              className={`h-9 px-4 ${selectedPeriod === option.value ? 'bg-blue-600 text-white' : ''}`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <Card
              key={index}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}
            >
              <CardContent className="p-4 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`opacity-70 font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-base`}>
                      {card.title}
                    </div>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#19294a]'} text-[28px] tracking-[1.00px]`}>
                    {card.amount}
                  </div>
                  {card.trend && (
                    <div className="flex items-center gap-2">
                      {card.trendUp ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <div className="font-normal text-base">
                        <span className={`font-semibold ${card.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                          {card.trend}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instance Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {instanceCards.map((card, index) => (
            <Card
              key={index}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}
            >
              <CardContent className="p-4 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`opacity-70 font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-base`}>
                      {card.title}
                    </div>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#19294a]'} text-[28px] tracking-[1.00px]`}>
                    {formatNumber(card.value)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Clients & Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Clients */}
          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
            <CardContent className="p-6">
              <h2 className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#202224]'} text-2xl mb-4`}>
                {t('superadmin.dashboard.newClients')} ({dashboardData.new_clients.count})
              </h2>
              <div className="space-y-3">
                {dashboardData.new_clients.clients && dashboardData.new_clients.clients.length > 0 ? (
                  dashboardData.new_clients.clients.slice(0, 5).map((client: any, index: number) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <Building2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {client.organization_name || client.name}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('superadmin.dashboard.noNewClients')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
            <CardContent className="p-6">
              <h2 className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#202224]'} text-2xl mb-4`}>
                {t('superadmin.dashboard.topClients')}
              </h2>
              <div className="space-y-3">
                {dashboardData.top_clients && dashboardData.top_clients.length > 0 ? (
                  dashboardData.top_clients.slice(0, 5).map((client: any, index: number) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <Building2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {client.organization_name || client.name}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatCurrency(client.revenue || 0, client.currency || 'EUR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('superadmin.dashboard.noTopClients')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AWS Consumption */}
        {dashboardData.aws_consumption && (
          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
            <CardContent className="p-6">
              <h2 className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#202224]'} text-2xl mb-4`}>
                {t('superadmin.dashboard.awsConsumption')}
              </h2>
              <div className="mb-4">
                <p className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {formatCurrency(dashboardData.aws_consumption.total, dashboardData.aws_consumption.currency)}
                </p>
              </div>
              {dashboardData.aws_consumption.by_service && dashboardData.aws_consumption.by_service.length > 0 && (
                <div className="space-y-2">
                  {dashboardData.aws_consumption.by_service.map((service: any, index: number) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{service.name}</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {formatCurrency(service.cost || 0, dashboardData.aws_consumption.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

