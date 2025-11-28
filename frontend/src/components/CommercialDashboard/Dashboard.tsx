import React, { useState, useEffect, useMemo } from 'react';
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
import { RevenueLineChart } from './RevenueLineChart';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, FileText, Receipt, CreditCard, BarChart3, DollarSign, Wallet, AlertCircle, Loader2 } from 'lucide-react';
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
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredChartData = useMemo(() => {
    if (!dashboardData?.charts?.revenue) {
      return [];
    }
    return dashboardData.charts.revenue.filter((point) => {
      if (point.month && point.month.includes('-')) {
        const pointYear = parseInt(point.month.split('-')[0]);
        return pointYear === chartYear;
      }
      return true;
    });
  }, [dashboardData?.charts?.revenue, chartYear]);

  // Helper function to normalize values (convert strings to numbers)
  const normalizeValue = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await commercialDashboardService.getDashboard(selectedYear);
      if (response.success && response.data) {
        // Normalize the data - convert strings to numbers
        const normalizedData = {
          ...response.data,
          kpis: {
            ...response.data.kpis,
            revenue: {
              current: normalizeValue(response.data.kpis.revenue.current),
              previous: normalizeValue(response.data.kpis.revenue.previous),
              comparison: response.data.kpis.revenue.comparison,
            },
            quotes: {
              current: normalizeValue(response.data.kpis.quotes.current),
              previous: normalizeValue(response.data.kpis.quotes.previous),
              comparison: response.data.kpis.quotes.comparison,
            },
            invoices: {
              current: normalizeValue(response.data.kpis.invoices.current),
              previous: normalizeValue(response.data.kpis.invoices.previous),
              comparison: response.data.kpis.invoices.comparison,
            },
            overdue: {
              current: normalizeValue(response.data.kpis.overdue.current),
            },
            expenses: {
              current: normalizeValue(response.data.kpis.expenses.current),
              previous: normalizeValue(response.data.kpis.expenses.previous),
              comparison: response.data.kpis.expenses.comparison,
            },
          },
          charts: {
            revenue: response.data.charts.revenue
              .map((point) => ({
                ...point,
                value: normalizeValue(point.value),
              })),
          },
        };
        setDashboardData(normalizedData);
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

  if (loading && (!dashboardData || !dashboardData.kpis)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('common.loading') || 'Chargement des données...'}
          </p>
        </div>
      </div>
    );
  }

  if (!loading && (!dashboardData || !dashboardData.kpis)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('dashboard.commercial.noDataAvailable')}</p>
      </div>
    );
  }

  const kpis = dashboardData.kpis;
  const charts = dashboardData.charts || { revenue: [] };

  // Calculate total revenue from chart data if current is 0
  const calculateTotalRevenue = (): number => {
    if (kpis.revenue.current > 0) {
      return kpis.revenue.current;
    }
    // Sum all values from the chart
    const total = charts.revenue.reduce((sum, point) => sum + (point.value || 0), 0);
    return total > 0 ? total : kpis.revenue.current;
  };

  // Calculate total quotes from chart or use current value
  const calculateTotalQuotes = (): number => {
    if (kpis.quotes.current > 0) {
      return kpis.quotes.current;
    }
    // If current is 0 but we have previous data, use previous as fallback
    return kpis.quotes.previous > 0 ? kpis.quotes.previous : kpis.quotes.current;
  };

  const totalRevenue = calculateTotalRevenue();
  const totalQuotes = calculateTotalQuotes();

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
      onClick: () => {
        if (organization?.custom_domain || subdomain) {
          navigate(`/${subdomain || organization?.custom_domain}/quote-creation`);
        } else {
          navigate('/quote-creation');
        }
      },
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
      amount: formatCurrency(totalRevenue),
      trend: `${Math.abs(kpis.revenue?.comparison || 0).toFixed(1)}%`,
      trendText: t('dashboard.commercial.vsLastMonth'),
      trendUp: (kpis.revenue?.comparison || 0) >= 0,
      trendColor: (kpis.revenue?.comparison || 0) >= 0 ? "text-[#25c9b5]" : "text-[#fe2f40]",
      icon: <Wallet className="w-6 h-6" />,
      iconColor: isDark ? "text-blue-400" : "text-blue-600",
      iconBg: isDark ? "bg-blue-900/30" : "bg-blue-100",
    },
    {
      title: t('dashboard.commercial.numberOfQuotes'),
      amount: formatNumber(totalQuotes),
      trend: `${Math.abs(kpis.quotes?.comparison || 0).toFixed(1)}%`,
      trendText: t('dashboard.commercial.vsMonthLast'),
      trendUp: (kpis.quotes?.comparison || 0) >= 0,
      trendColor: (kpis.quotes?.comparison || 0) >= 0 ? "text-[#25c9b5]" : "text-[#fe2f40]",
      icon: <FileText className="w-6 h-6" />,
      iconColor: isDark ? "text-orange-400" : "text-orange-600",
      iconBg: isDark ? "bg-orange-900/30" : "bg-orange-100",
    },
    {
      title: t('dashboard.commercial.totalRevenue'),
      amount: formatCurrency(totalRevenue),
      trend: `${Math.abs(kpis.revenue?.comparison || 0).toFixed(1)}%`,
      trendText: t('dashboard.commercial.vsMonthLast'),
      trendUp: (kpis.revenue?.comparison || 0) >= 0,
      trendColor: (kpis.revenue?.comparison || 0) >= 0 ? "text-[#25c9b5]" : "text-[#fe2f40]",
      icon: <DollarSign className="w-6 h-6" />,
      iconColor: isDark ? "text-green-400" : "text-green-600",
      iconBg: isDark ? "bg-green-900/30" : "bg-green-100",
    },
    {
      title: t('dashboard.commercial.unpaidAmount'),
      amount: formatCurrency(kpis.overdue?.current || 0),
      trend: "0.0%",
      trendText: t('dashboard.commercial.vsMonthLast'),
      trendUp: true,
      trendColor: "text-[#25c9b5]",
      icon: <AlertCircle className="w-6 h-6" />,
      iconColor: isDark ? "text-red-400" : "text-red-600",
      iconBg: isDark ? "bg-red-900/30" : "bg-red-100",
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
                  <div className="flex items-start justify-between">
                    <div className={`opacity-70 font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-base flex-1`}>
                      {card.title}
                    </div>
                    {card.icon && (
                      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${card.iconBg}`}>
                        <div className={card.iconColor}>
                          {card.icon}
                        </div>
                      </div>
                    )}
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

        {/* Revenue Chart Card - Le composant inclut maintenant la Card */}
        <RevenueLineChart
          data={filteredChartData}
          height={256}
          primaryColor={primaryColor}
          selectedYear={chartYear}
          onYearChange={setChartYear}
          showCard={true}
          isLoading={loading}
        />
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
