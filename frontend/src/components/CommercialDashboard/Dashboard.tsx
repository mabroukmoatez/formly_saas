import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { commercialDashboardService } from '../../services/commercialDashboard';
import { DashboardData } from '../../services/commercialDashboard.types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { InvoiceCreationModal } from './InvoiceCreationModal';
import { QuoteCreationModal } from './QuoteCreationModal';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, FileText, Receipt, CreditCard, BarChart3 } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';

export const CommercialDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization, subdomain } = useOrganization();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const primaryColor = organization?.primary_color || '#007aff';

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await commercialDashboardService.getDashboard();
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

  // Format currency in Euros
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('€', '€').replace(/ /g, ' ').trim();
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

  if (!dashboardData || !dashboardData.kpis) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('dashboard.commercial.noDataAvailable')}</p>
      </div>
    );
  }

  const kpis = dashboardData.kpis;
  const charts = dashboardData.charts || { revenue: [] };

  const actionButtons = [
    {
      label: t('dashboard.commercial.createInvoice'),
      bgColor: isDark ? "bg-[#1e3a5f]" : "bg-[#e5f3ff]",
      textColor: isDark ? "text-[#60a5fa]" : "text-[#007aff]",
      icon: <Receipt className="w-4 h-4" />,
      onClick: () => {
        if (organization?.custom_domain || subdomain) {
          navigate(`/${subdomain || organization?.custom_domain}/invoice-creation`);
        } else {
          navigate('/invoice-creation');
        }
      },
    },
    {
      label: t('dashboard.commercial.createQuote'),
      bgColor: isDark ? "bg-[#5f3a1e]" : "bg-[#ffe5ca]",
      textColor: isDark ? "text-[#fb923c]" : "text-[#ff7700]",
      icon: <FileText className="w-4 h-4" />,
      onClick: () => setIsQuoteModalOpen(true),
    },
    {
      label: t('dashboard.commercial.manageExpenses'),
      bgColor: isDark ? "bg-gray-700" : "bg-[#e8f0f7]",
      textColor: isDark ? "text-gray-300" : "text-[#6a90b9]",
      icon: <CreditCard className="w-4 h-4" />,
      onClick: () => navigate('/dashboard/charges-depenses'),
    },
  ];

  const metricCards = [
    {
      title: t('dashboard.commercial.paymentsReceived'),
      amount: formatCurrency(kpis.revenue?.current || 0),
      trend: `${Math.abs(kpis.revenue?.comparison || 0).toFixed(1)}%`,
      trendText: t('dashboard.commercial.vsLastMonth'),
      trendUp: (kpis.revenue?.comparison || 0) >= 0,
      trendColor: (kpis.revenue?.comparison || 0) >= 0 ? "text-[#25c9b5]" : "text-[#fe2f40]",
    },
    {
      title: t('dashboard.commercial.numberOfQuotes'),
      amount: formatNumber(kpis.quotes?.current || 0),
      trend: `${Math.abs(kpis.quotes?.comparison || 0).toFixed(1)}%`,
      trendText: t('dashboard.commercial.vsMonthLast'),
      trendUp: (kpis.quotes?.comparison || 0) >= 0,
      trendColor: (kpis.quotes?.comparison || 0) >= 0 ? "text-[#25c9b5]" : "text-[#fe2f40]",
    },
    {
      title: t('dashboard.commercial.totalRevenue'),
      amount: formatCurrency(kpis.revenue?.current || 0),
      trend: `${Math.abs(kpis.revenue?.comparison || 0).toFixed(1)}%`,
      trendText: t('dashboard.commercial.vsMonthLast'),
      trendUp: (kpis.revenue?.comparison || 0) >= 0,
      trendColor: (kpis.revenue?.comparison || 0) >= 0 ? "text-[#25c9b5]" : "text-[#fe2f40]",
    },
    {
      title: t('dashboard.commercial.unpaidAmount'),
      amount: formatCurrency(kpis.overdue?.current || 0),
      trend: "0.0%",
      trendText: t('dashboard.commercial.vsMonthLast'),
      trendUp: true,
      trendColor: "text-[#25c9b5]",
    },
  ];

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('dashboard.commercial.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-[13px]">
          {actionButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={button.onClick}
              className={`h-auto inline-flex items-center justify-center gap-4 px-[19px] py-2.5 ${button.bgColor} ${button.textColor} rounded-[10px] hover:opacity-90 cursor-pointer`}
            >
              {button.icon}
              <span className="font-medium text-[17px]">
                {button.label}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <Card
              key={index}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}
            >
              <CardContent className="p-4 relative">
                <div className="flex flex-col gap-3">
                  <div className={`opacity-70 font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-base`}>
                    {card.title}
                  </div>
                  <div className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#19294a]'} text-[28px] tracking-[1.00px]`}>
                    {card.amount}
                  </div>
                  <div className="flex items-center gap-2">
                    {card.trendUp ? (
                      <TrendingUpIcon className="w-4 h-4 text-[#25c9b5]" />
                    ) : (
                      <TrendingDownIcon className="w-4 h-4 text-[#fe2f40]" />
                    )}
                    <div className="font-normal text-base">
                      <span className={`font-semibold ${card.trendColor}`}>
                        {card.trend}
                      </span>
                      <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'} ml-1`}>
                        {card.trendText}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart Card */}
        <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#202224]'} text-2xl`}>
                {t('dashboard.commercial.revenueEvolution')}
              </h2>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`w-[104px] h-[28px] ${isDark ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-[#fcfcfc] text-gray-900 border-neutral-300'} rounded border-[0.6px] border-solid px-2 text-sm`}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Revenue Chart */}
            <div className="relative h-64">
              {charts.revenue && charts.revenue.length > 0 ? (
                <div className="w-full h-full flex items-end justify-between gap-2 px-4">
                  {charts.revenue.map((dataPoint: any, index: number) => {
                    const maxValue = Math.max(...charts.revenue.map((d: any) => d.value || 0), 1);
                    const height = ((dataPoint.value || 0) / maxValue) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex items-end justify-center group">
                          <div
                            className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                            style={{
                              height: `${height}%`,
                              minHeight: '20px',
                              backgroundColor: isDark ? '#3b82f6' : '#007aff',
                            }}
                            title={`${dataPoint.month}: ${formatCurrency(dataPoint.value || 0)}`}
                          />
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {formatCurrency(dataPoint.value || 0)}
                          </div>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {dataPoint.month?.substring(0, 3) || index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                    {t('dashboard.commercial.chartComingSoon')}<br/>
                    <span className="text-sm">Aucune donnée disponible pour {selectedYear}</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Creation Modal */}
      <InvoiceCreationModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSave={() => {
          setIsInvoiceModalOpen(false);
          fetchDashboardData();
          success('Facture créée avec succès');
        }}
      />

      {/* Quote Creation Modal */}
      <QuoteCreationModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSave={() => {
          setIsQuoteModalOpen(false);
          fetchDashboardData();
          success('Devis créé avec succès');
        }}
      />
    </section>
  );
};
    