import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent } from '../../components/ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Charge, ExpensesDashboardResponse } from '../../services/commercial.types';
import { useToast } from '../../components/ui/toast';
import { ChargeCreationModal } from '../../components/CommercialDashboard/ChargeCreationModal';
import { ChargeViewModal } from '../../components/CommercialDashboard/ChargeViewModal';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { Plus, Search, Download, Eye, Edit, Trash2, CreditCard, DollarSign, TrendingUp, FileText, Calendar, Filter, Eye as EyeIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

export const ChargesDepenses = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [charges, setCharges] = useState<Charge[]>([]);
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedContractType, setSelectedContractType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<ExpensesDashboardResponse | null>(null);

  useEffect(() => {
    fetchCharges();
    fetchDashboardStats();
  }, [page, selectedCategory, selectedRole, selectedContractType, dateFrom, dateTo]);

  const fetchDashboardStats = async () => {
    try {
      setDashboardLoading(true);
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedRole) params.role = selectedRole;
      if (selectedContractType) params.contract_type = selectedContractType;

      try {
        const response = await commercialService.getExpensesDashboard(params);
        if (response.success && response.data) {
          setDashboardStats(response);
          return;
        }
      } catch (apiErr) {
        console.warn('Dashboard API not available, calculating from charges:', apiErr);
      }

      // Fallback: Calculate statistics from charges
      // Fetch all charges (without pagination) to calculate stats
      const allChargesResponse = await commercialService.getCharges({
        per_page: 1000, // Get a large number to calculate stats
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (allChargesResponse.success && allChargesResponse.data?.data) {
        const allCharges = allChargesResponse.data.data;
        calculateStatsFromCharges(allCharges);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const calculateStatsFromCharges = (chargesList: Charge[]) => {
    // Calculate totals
    const totalExpenses = chargesList.reduce((sum, charge) => {
      return sum + parseFloat(String(charge.amount || 0));
    }, 0);

    const totalCount = chargesList.length;
    const averageExpense = totalCount > 0 ? totalExpenses / totalCount : 0;

    // Group by category
    const byCategory: Record<string, number> = {};
    chargesList.forEach(charge => {
      const category = charge.category || 'other';
      const amount = parseFloat(String(charge.amount || 0));
      byCategory[category] = (byCategory[category] || 0) + amount;
    });

    // Group by month
    const monthlyData: Record<string, number> = {};
    chargesList.forEach(charge => {
      const date = charge.date ? new Date(charge.date) : new Date(charge.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = parseFloat(String(charge.amount || 0));
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
    });

    // Group by category and month for stacked chart
    const monthlyByCategory: Record<string, { humains: number; environnement: number }> = {};
    chargesList.forEach(charge => {
      const date = charge.date ? new Date(charge.date) : new Date(charge.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = parseFloat(String(charge.amount || 0));
      const category = (charge.category || '').toLowerCase();
      
      if (!monthlyByCategory[monthKey]) {
        monthlyByCategory[monthKey] = { humains: 0, environnement: 0 };
      }

      if (category.includes('rh') || category.includes('humain') || category.includes('salary')) {
        monthlyByCategory[monthKey].humains += amount;
      } else if (category.includes('environnement') || category.includes('environment')) {
        monthlyByCategory[monthKey].environnement += amount;
      } else {
        // Distribute proportionally
        const humainsRatio = byCategory['salary'] || 0;
        const envRatio = byCategory['utilities'] || 0;
        const totalRatio = humainsRatio + envRatio || 1;
        monthlyByCategory[monthKey].humains += amount * (humainsRatio / totalRatio);
        monthlyByCategory[monthKey].environnement += amount * (envRatio / totalRatio);
      }
    });

    // Convert to API format
    const monthlyEvolution = Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        value: monthlyData[month]
      }));

    const byCategoryArray = Object.keys(byCategory).map(name => ({
      name: getCategoryLabel(name),
      value: byCategory[name]
    }));

    // Calculate category totals for display
    const humainsTotalCalc = byCategoryArray
      .filter(c => {
        const name = c.name.toLowerCase();
        return name.includes('rh') || name.includes('humain') || name.includes('salaire');
      })
      .reduce((sum, c) => sum + c.value, 0);
    
    const environnementTotalCalc = byCategoryArray
      .filter(c => {
        const name = c.name.toLowerCase();
        return name.includes('environnement') || name.includes('environment');
      })
      .reduce((sum, c) => sum + c.value, 0);

    // Create dashboard response structure
    const dashboardData: ExpensesDashboardResponse = {
      success: true,
      data: {
        charts: {
          by_category: byCategoryArray,
          monthly_evolution: monthlyEvolution,
          by_contract_type: []
        },
        summary: {
          total_expenses: totalExpenses,
          total_count: totalCount,
          average_expense: averageExpense
        }
      }
    };

    setDashboardStats(dashboardData);
  };

  const fetchCharges = async () => {
    try {
      setLoading(true);
      const response = await commercialService.getCharges({
        page,
        per_page: 12,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      if (response.success && response.data) {
        setCharges(response.data.data || []);
        setPagination(response.data.pagination || { total: 0, total_pages: 0 });
      }
    } catch (err) {
      console.error('Error fetching charges:', err);
      showError(t('common.error'), 'Impossible de charger les dépenses');
      setCharges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCharges(new Set(charges.map(c => String(c.id))));
    } else {
      setSelectedCharges(new Set());
    }
  };

  const handleSelectCharge = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCharges);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCharges(newSelected);
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      office: 'bg-blue-100 text-blue-700',
      travel: 'bg-purple-100 text-purple-700',
      marketing: 'bg-pink-100 text-pink-700',
      utilities: 'bg-yellow-100 text-yellow-700',
      salary: 'bg-green-100 text-green-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      office: 'Bureau',
      travel: 'Voyage',
      marketing: 'Marketing',
      utilities: 'Services',
      salary: 'Salaire',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  const confirmDeleteCharge = async () => {
    if (!chargeToDelete) return;
    
    setDeleting(true);
    try {
      if (chargeToDelete === 'bulk') {
        // Delete multiple charges
        const deletePromises = Array.from(selectedCharges).map(id =>
          commercialService.deleteCharge(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedCharges.size} dépense(s) supprimée(s) avec succès`);
        setSelectedCharges(new Set());
      } else {
        // Delete single charge
        await commercialService.deleteCharge(chargeToDelete);
        success('Dépense supprimée avec succès');
      }
      fetchCharges();
      fetchDashboardStats();
      setShowDeleteModal(false);
      setChargeToDelete(null);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer la dépense');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteCharge = () => {
    setShowDeleteModal(false);
    setChargeToDelete(null);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchCharges();
    fetchDashboardStats();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedRole('');
    setSelectedContractType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const allSelected = selectedCharges.size === charges.length && charges.length > 0;
  const someSelected = selectedCharges.size > 0 && selectedCharges.size < charges.length;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Get dashboard summary values
  const totalExpenses = dashboardStats?.data?.summary?.total_expenses || 0;
  const totalCount = dashboardStats?.data?.summary?.total_count || 0;
  const averageExpense = dashboardStats?.data?.summary?.average_expense || 0;

  // Helper function to format month
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const date = new Date(monthStr + '-01');
    return months[date.getMonth()] || monthStr.substring(5, 7);
  };

  // Get monthly data
  const monthlyData = dashboardStats?.data?.charts?.monthly_evolution || [];
  const byCategoryData = dashboardStats?.data?.charts?.by_category || [];
  
  // Calculate totals by category
  const environnementTotal = byCategoryData.reduce((sum, c) => {
    const name = c.name?.toLowerCase() || '';
    if (name.includes('environnement') || name.includes('environment')) {
      return sum + (c.value || 0);
    }
    return sum;
  }, 0);

  const humainsTotal = byCategoryData.reduce((sum, c) => {
    const name = c.name?.toLowerCase() || '';
    if (name.includes('rh') || name.includes('humain') || name.includes('salaire')) {
      return sum + (c.value || 0);
    }
    return sum;
  }, 0);

  // Prepare monthly data for stacked chart (Total)
  // Group by month and sum all categories
  const monthlyTotals: Record<string, { humains: number; environnement: number }> = {};
  
  // Initialize all months
  const allMonths = monthlyData.map(m => m.month);
  allMonths.forEach(month => {
    monthlyTotals[month] = { humains: 0, environnement: 0 };
  });

  // Calculate monthly split based on category totals
  monthlyData.forEach(item => {
    const total = item.value || 0;
    if (total > 0) {
      const totalCategory = humainsTotal + environnementTotal;
      if (totalCategory > 0) {
        const humainsRatio = humainsTotal / totalCategory;
        const envRatio = environnementTotal / totalCategory;
        monthlyTotals[item.month] = {
          humains: total * humainsRatio,
          environnement: total * envRatio
        };
      } else {
        // If no category data, split 50/50
        monthlyTotals[item.month] = {
          humains: total * 0.5,
          environnement: total * 0.5
        };
      }
    }
  });

  // Helper to render bar chart
  const renderBarChart = (
    data: Array<{ month: string; value: number }>,
    color: string,
    isStacked: boolean = false,
    secondaryData?: Array<{ month: string; value: number }>,
    secondaryColor?: string
  ) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-32 flex items-center justify-center">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée</p>
        </div>
      );
    }

    const maxValue = Math.max(
      ...data.map(d => d.value || 0),
      ...(secondaryData ? secondaryData.map(d => d.value || 0) : [0]),
      1
    );

    // Generate all 12 months
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Helper to match month from API data
    const matchMonth = (monthStr: string, index: number) => {
      if (!monthStr) return null;
      // Try to parse YYYY-MM format
      const parts = monthStr.split('-');
      if (parts.length === 2) {
        const monthNum = parseInt(parts[1]);
        if (monthNum === index + 1) return monthStr;
      }
      // Try formatMonth comparison
      if (formatMonth(monthStr) === months[index]) return monthStr;
      return null;
    };
    
    return (
      <div className="h-32 flex items-end justify-between gap-1 px-2 mt-4">
        {months.map((monthLabel, index) => {
          const dataPoint = data.find(d => matchMonth(d.month, index));
          const secondaryPoint = secondaryData?.find(d => matchMonth(d.month, index));
          
          const value = dataPoint?.value || 0;
          const secondaryValue = secondaryPoint?.value || 0;
          const totalValue = value + secondaryValue;
          
          const maxHeight = 100; // Max height percentage
          const secondaryHeight = secondaryValue > 0 ? Math.max((secondaryValue / maxValue) * maxHeight, 2) : 0;
          const primaryHeight = value > 0 ? Math.max((value / maxValue) * maxHeight, 2) : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="relative w-full flex flex-col items-end justify-end" style={{ height: '100%', minHeight: '80px' }}>
                {isStacked && secondaryValue > 0 && (
                  <div
                    className="w-full rounded-t transition-all hover:opacity-90"
                    style={{
                      height: `${secondaryHeight}%`,
                      minHeight: secondaryValue > 0 ? '3px' : '0',
                      backgroundColor: secondaryColor || '#a855f7',
                    }}
                    title={`${monthLabel} (Environnement): ${formatCurrency(secondaryValue)}`}
                  />
                )}
                {value > 0 && (
                  <div
                    className={`w-full transition-all hover:opacity-90 ${isStacked ? 'rounded-t' : 'rounded-t rounded-b'}`}
                    style={{
                      height: `${primaryHeight}%`,
                      minHeight: value > 0 ? '3px' : '0',
                      backgroundColor: color,
                    }}
                    title={`${monthLabel}${isStacked ? ' (Humains)' : ''}: ${formatCurrency(value)}`}
                  />
                )}
                {/* Tooltip */}
                {totalValue > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 shadow-lg">
                    {monthLabel}: {formatCurrency(totalValue)}
                  </div>
                )}
              </div>
              <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                {monthLabel}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && charges.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: primaryColor }}></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CreditCard className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.charges_depenses.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('dashboard.commercial.charges_depenses.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              {t('dashboard.commercial.charges_depenses.create')}
            </span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Card 1: Dépenses Total */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                  Dépenses Total
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica', color: '#007aff' }}>
                  {dashboardLoading ? '...' : formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: '#007aff15' }}>
                <EyeIcon className="h-5 w-5" style={{ color: '#007aff' }} />
              </div>
            </div>
            {/* Stacked Bar Chart */}
            {renderBarChart(
              monthlyData.map(item => ({
                month: item.month,
                value: (monthlyTotals[item.month]?.humains || 0)
              })),
              '#25c9b5', // Teal color
              true,
              monthlyData.map(item => ({
                month: item.month,
                value: (monthlyTotals[item.month]?.environnement || 0)
              })),
              '#a855f7' // Purple color
            )}
          </CardContent>
        </Card>

        {/* Card 2: Moyens Environnementaux */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                  Moyens Environnementaux
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica', color: '#a855f7' }}>
                  {dashboardLoading ? '...' : formatCurrency(environnementTotal)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: '#a855f715' }}>
                <EyeIcon className="h-5 w-5" style={{ color: '#a855f7' }} />
              </div>
            </div>
            {/* Bar Chart - Purple */}
            {renderBarChart(
              monthlyData.map(item => ({
                month: item.month,
                value: (monthlyTotals[item.month]?.environnement || 0)
              })),
              '#a855f7' // Purple color
            )}
          </CardContent>
        </Card>

        {/* Card 3: Moyens Humains */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                  Moyens Humains
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica', color: '#25c9b5' }}>
                  {dashboardLoading ? '...' : formatCurrency(humainsTotal)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: '#25c9b515' }}>
                <EyeIcon className="h-5 w-5" style={{ color: '#25c9b5' }} />
              </div>
            </div>
            {/* Bar Chart - Teal */}
            {renderBarChart(
              monthlyData.map(item => ({
                month: item.month,
                value: (monthlyTotals[item.month]?.humains || 0)
              })),
              '#25c9b5' // Teal color
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        {/* Filters Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
            <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Filtres
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className={`flex items-center gap-2 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} rounded-[10px]`}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
            >
              <option value="">Toutes les catégories</option>
              <option value="office">Bureau</option>
              <option value="travel">Voyage</option>
              <option value="marketing">Marketing</option>
              <option value="utilities">Services</option>
              <option value="salary">Salaire</option>
              <option value="other">Autre</option>
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
            >
              <option value="">Tous les rôles</option>
              <option value="Formateur">Formateur</option>
              <option value="Coordinateur">Coordinateur</option>
              <option value="Administrateur">Administrateur</option>
            </select>

            {/* Contract Type Filter */}
            <select
              value={selectedContractType}
              onChange={(e) => setSelectedContractType(e.target.value)}
              className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
            >
              <option value="">Tous les contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Freelance">Freelance</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Date début"
                className={`px-2 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
              />
              <span className={isDark ? 'text-gray-400' : 'text-[#698eac]'}>-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Date fin"
                className={`px-2 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleApplyFilters}
              className={`inline-flex items-center gap-2 px-4 py-2 h-auto rounded-[10px] ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#007aff] hover:bg-[#0066cc]'} text-white`}
            >
              <Filter className="w-4 h-4" />
              Appliquer les filtres
            </Button>
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className={`inline-flex items-center gap-2 px-4 py-2 h-auto rounded-[10px] border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-[#d5d6da] bg-white hover:bg-gray-50'}`}
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-between w-full pt-4 border-t border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'}`}>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  // Export to CSV
                  const csvData = charges.map(charge => ({
                    'Référence': charge.reference || '',
                    'Description': charge.description || '',
                    'Montant': parseFloat(String(charge.amount || 0)),
                    'Catégorie': getCategoryLabel(charge.category || ''),
                    'Date': charge.date ? new Date(charge.date).toLocaleDateString('fr-FR') : '',
                  }));
                  
                  const csv = [
                    Object.keys(csvData[0]).join(','),
                    ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `depenses_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  success('Dépenses exportées avec succès');
                } catch (err) {
                  showError('Erreur', 'Impossible d\'exporter les dépenses');
                }
              }}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 h-auto rounded-[10px] border border-dashed ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-[#6a90b9] bg-transparent hover:bg-[#f5f5f5]'}`}
            >
              <Download className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-[#698eac]'}`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#698eac]'} text-[13px]`}>
                {t('common.export')}
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (selectedCharges.size === 0) return;
                setShowDeleteModal(true);
                setChargeToDelete('bulk');
              }}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 h-auto rounded-[10px] border border-dashed ${isDark ? 'border-red-700 bg-red-900/20 hover:bg-red-900/30' : 'border-[#fe2f40] bg-transparent hover:bg-[#fff5f5]'}`}
              disabled={selectedCharges.size === 0}
            >
              <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-[#fe2f40]'}`} />
              <span className={`font-medium ${isDark ? 'text-red-400' : 'text-[#fe2f40]'} text-[13px]`}>
                {t('common.delete')} ({selectedCharges.size})
              </span>
            </Button>
          </div>
        </div>

        {charges.length === 0 ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('common.noDataFound')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className="w-[80px] px-[42px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                    />
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Type
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Description
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Catégorie
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Montant
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Date
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow
                    key={String(charge.id)}
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-[#007aff14]'} ${selectedCharges.has(String(charge.id)) ? 'bg-[#007aff14]' : ''}`}
                  >
                    <TableCell className="px-[42px]">
                      <Checkbox
                        checked={selectedCharges.has(String(charge.id))}
                        onCheckedChange={(checked) => handleSelectCharge(String(charge.id), checked as boolean)}
                        className={`w-5 h-5 rounded-md border ${selectedCharges.has(String(charge.id)) ? 'bg-[#007aff14] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      />
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {charge.reference || charge.label || '-'}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px] max-w-xs truncate`}>
                      {charge.description || (charge.documents && charge.documents.length > 0 ? `${charge.documents.length} document(s)` : '-')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getCategoryColor(charge.category.toLowerCase())}>
                        {getCategoryLabel(charge.category.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(charge.amount))}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {new Date(charge.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => {
                            setSelectedCharge(charge);
                            setIsViewModalOpen(true);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCharge(charge);
                            setIsEditModalOpen(true);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button 
                          onClick={() => {
                            setChargeToDelete(String(charge.id));
                            setShowDeleteModal(true);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:bg-red-50`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {t('common.page')} {page} {t('common.of')} {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              disabled={page === pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Charge Creation Modal */}
      <ChargeCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCharge(null);
        }}
        onSave={() => {
          setIsModalOpen(false);
          setSelectedCharge(null);
          fetchCharges();
          fetchDashboardStats();
        }}
      />

      {/* Charge View Modal */}
      <ChargeViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        charge={selectedCharge}
        primaryColor={primaryColor}
      />

      {/* Charge Edit Modal */}
      <ChargeCreationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCharge(null);
        }}
        charge={selectedCharge}
        onSave={() => {
          setIsEditModalOpen(false);
          setSelectedCharge(null);
          fetchCharges();
          fetchDashboardStats();
        }}
      />

      {/* Confirmation Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteCharge}
        onConfirm={confirmDeleteCharge}
        title="Voulez-vous vraiment supprimer cette dépense ?"
        message="Cette action est irréversible. La dépense sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};
