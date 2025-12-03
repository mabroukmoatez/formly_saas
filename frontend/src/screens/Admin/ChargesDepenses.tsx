import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Charge, ExpensesDashboardResponse } from '../../services/commercial.types';
import { useToast } from '../../components/ui/toast';
import { ChargeCreationModal } from '../../components/CommercialDashboard/ChargeCreationModal';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { ExpenseDetailModal } from '../../components/CommercialDashboard/ExpenseDetailModal';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Filter,
  ArrowUpDown as SwapIcon,
  FileIcon,
  DollarSign,
  TrendingUp,
  Target,
  Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

type SortField = 'date' | 'label' | 'category' | 'amount' | 'formation';
type SortDirection = 'asc' | 'desc';

// Component for Expense Stat Card with Stacked Bar Chart
interface ExpenseStatCardProps {
  title: string;
  amount: number;
  monthlyData: Array<{ month: string; humains: number; environnement: number; total: number }>;
  type: 'total' | 'environnement' | 'humains';
  isDark: boolean;
  primaryColor: string;
  categoryData?: Array<{ name: string; value: number }>; // For circular chart categories
  onEyeClick?: () => void; // Callback when eye icon is clicked
}

const ExpenseStatCard: React.FC<ExpenseStatCardProps> = ({
  title,
  amount,
  monthlyData,
  type,
  isDark,
  primaryColor,
  categoryData = [],
  onEyeClick
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Chart configuration
  const chartHeight = 120;
  const chartWidth = 350; // Increased width for better month label spacing
  const padding = { top: 10, right: 10, bottom: 30, left: 10 }; // Increased bottom padding for month labels
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const innerWidth = chartWidth - padding.left - padding.right;
  const barWidth = Math.max(6, innerWidth / 12 - 3); // Increased spacing between bars

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...monthlyData.map(d => type === 'total' ? d.total : (type === 'humains' ? d.humains : d.environnement)),
    1
  );

  // Colors based on type
  const colors = {
    total: {
      iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      amountColor: isDark ? 'text-blue-400' : 'text-blue-600',
      bar1: '#25C9B5', // Turquoise (environnementaux)
      bar2: '#9C27B0', // Violet (humains)
    },
    environnement: {
      iconBg: isDark ? 'bg-purple-900/30' : 'bg-purple-100',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      amountColor: isDark ? 'text-purple-400' : 'text-purple-600',
      bar1: '#BA68C8', // Violet clair
      bar2: '#7B1FA2', // Violet foncé
    },
    humains: {
      iconBg: isDark ? 'bg-cyan-900/30' : 'bg-cyan-100',
      iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
      amountColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
      bar1: '#4DD0E1', // Turquoise clair
      bar2: '#00ACC1', // Turquoise moyen
      bar3: '#00838F', // Turquoise foncé
    }
  };

  const currentColors = colors[type];

  // Always render default stacked bar chart
  const renderChart = () => {
    return (
        <>
          {monthlyData.map((data, index) => {
            const barSpacing = innerWidth / 12;
            const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
            const value = type === 'total' ? data.total : (type === 'humains' ? data.humains : data.environnement);
            const barHeight = (value / maxValue) * innerHeight;
            const y = padding.top + innerHeight - barHeight;

            if (type === 'total') {
              // Stacked: environnement (bottom) + humains (top)
              const envHeight = (data.environnement / maxValue) * innerHeight;
              const humainsHeight = (data.humains / maxValue) * innerHeight;
              const envY = padding.top + innerHeight - envHeight;
              const humainsY = envY - humainsHeight;

              return (
                <g key={index}>
                  {/* Environnement (bottom - turquoise) */}
                  {data.environnement > 0 && (
                    <rect
                      x={x}
                      y={envY}
                      width={barWidth}
                      height={envHeight}
                      fill={currentColors.bar1}
                      rx="2"
                      className="transition-all duration-500 ease-in-out cursor-pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      opacity={hoveredBar === null || hoveredBar === index ? 1 : 0.6}
                    />
                  )}
                  {/* Humains (top - violet) */}
                  {data.humains > 0 && (
                    <rect
                      x={x}
                      y={humainsY}
                      width={barWidth}
                      height={humainsHeight}
                      fill={currentColors.bar2}
                      rx="2"
                      className="transition-all duration-500 ease-in-out cursor-pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      opacity={hoveredBar === null || hoveredBar === index ? 1 : 0.6}
                    />
                  )}
                  {/* Hover Tooltip */}
                  {hoveredBar === index && (
                    <g>
                      <rect
                        x={x - 40}
                        y={envY - 50}
                        width="100"
                        height="42"
                        fill={isDark ? '#1f2937' : '#374151'}
                        rx="6"
                        opacity="0.95"
                      />
                      <text
                        x={x + 10}
                        y={envY - 32}
                        textAnchor="middle"
                        fill="white"
                        fontSize="9"
                        fontWeight="600"
                        style={{ fontFamily: 'Poppins, Helvetica' }}
                      >
                        {data.month}
                      </text>
                      <text
                        x={x + 10}
                        y={envY - 22}
                        textAnchor="middle"
                        fill="#25C9B5"
                        fontSize="8"
                        fontWeight="500"
                        style={{ fontFamily: 'Poppins, Helvetica' }}
                      >
                        Env: {formatCurrency(data.environnement)}
                      </text>
                      <text
                        x={x + 10}
                        y={envY - 13}
                        textAnchor="middle"
                        fill="#9C27B0"
                        fontSize="8"
                        fontWeight="500"
                        style={{ fontFamily: 'Poppins, Helvetica' }}
                      >
                        Hum: {formatCurrency(data.humains)}
                      </text>
                    </g>
                  )}
                  {/* Month label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill={isDark ? '#94a3b8' : '#6a90b9'}
                    fontSize="10"
                    fontWeight="500"
                    style={{ fontFamily: 'Poppins, Helvetica' }}
                  >
                    {data.month}
                  </text>
                </g>
              );
            } else if (type === 'environnement') {
              // Stacked: violet clair (bottom) + violet foncé (top)
              const part1 = value * 0.6;
              const part2 = value * 0.4;
              const height1 = (part1 / maxValue) * innerHeight;
              const height2 = (part2 / maxValue) * innerHeight;
              const y1 = padding.top + innerHeight - height1;
              const y2 = y1 - height2;

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y1}
                    width={barWidth}
                    height={height1}
                    fill={currentColors.bar1}
                    rx="2"
                    className="transition-all duration-500 ease-in-out"
                  />
                  <rect
                    x={x}
                    y={y2}
                    width={barWidth}
                    height={height2}
                    fill={currentColors.bar2}
                    rx="2"
                    className="transition-all duration-500 ease-in-out"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill={isDark ? '#94a3b8' : '#6a90b9'}
                    fontSize="10"
                    fontWeight="500"
                    style={{ fontFamily: 'Poppins, Helvetica' }}
                  >
                    {data.month}
                  </text>
                </g>
              );
            } else {
              // Stacked: turquoise clair (bottom) + moyen (middle) + foncé (top)
              const part1 = value * 0.5;
              const part2 = value * 0.3;
              const part3 = value * 0.2;
              const height1 = (part1 / maxValue) * innerHeight;
              const height2 = (part2 / maxValue) * innerHeight;
              const height3 = (part3 / maxValue) * innerHeight;
              const y1 = padding.top + innerHeight - height1;
              const y2 = y1 - height2;
              const y3 = y2 - height3;

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y1}
                    width={barWidth}
                    height={height1}
                    fill={currentColors.bar1}
                    rx="2"
                    className="transition-all duration-500 ease-in-out"
                  />
                  <rect
                    x={x}
                    y={y2}
                    width={barWidth}
                    height={height2}
                    fill={currentColors.bar2}
                    rx="2"
                    className="transition-all duration-500 ease-in-out"
                  />
                  <rect
                    x={x}
                    y={y3}
                    width={barWidth}
                    height={height3}
                    fill={currentColors.bar3}
                    rx="2"
                    className="transition-all duration-500 ease-in-out"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill={isDark ? '#94a3b8' : '#6a90b9'}
                    fontSize="10"
                    fontWeight="500"
                    style={{ fontFamily: 'Poppins, Helvetica' }}
                  >
                    {data.month}
                  </text>
                </g>
              );
            }
          })}
        </>
    );
  };

  return (
    <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-sm`}>
            {title}
          </div>
          {/* Amount and Eye icon on the same line, aligned to the right */}
          <div className="flex items-center gap-2">
            <div className={`font-bold ${currentColors.amountColor} text-2xl`}>
              {formatCurrency(amount)}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEyeClick) {
                  onEyeClick();
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentColors.iconBg} hover:opacity-80 transition-all duration-300 cursor-pointer`}
              title="Visualiser les détails"
              type="button"
            >
              <Eye className={`w-4 h-4 ${currentColors.iconColor}`} />
            </button>
          </div>
        </div>

        {/* Chart Container with Animation */}
        <div className="w-full overflow-x-auto relative" style={{ height: `${chartHeight}px` }}>
          <div className="transition-opacity duration-500 ease-in-out">
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
              {renderChart()}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<ExpensesDashboardResponse | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Advanced filter states
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [amountFilter, setAmountFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [formationFilter, setFormationFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal state for expense detail popup
  const [expenseModalType, setExpenseModalType] = useState<'total' | 'environnement' | 'humains' | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  useEffect(() => {
    fetchCharges();
    fetchDashboardStats();
  }, [page, selectedCategory, searchTerm, sortField, sortDirection]);

  const fetchDashboardStats = async () => {
    try {
      setDashboardLoading(true);
      try {
        const response = await commercialService.getExpensesDashboard({});
        if (response.success && response.data) {
          setDashboardStats(response);
          return;
        }
      } catch (apiErr) {
        console.warn('Dashboard API not available, calculating from charges:', apiErr);
      }

      // Fallback: Calculate statistics from charges
      const allChargesResponse = await commercialService.getCharges({
        per_page: 1000,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
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

  const getCategoryLabel = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('rh') || categoryLower.includes('humain') || categoryLower.includes('salary')) {
      return 'Moyens Humains';
    }
    if (categoryLower.includes('environnement') || categoryLower.includes('environment')) {
      return 'Moyens Environnementaux';
    }
    const labels: Record<string, string> = {
      office: 'Bureau',
      travel: 'Voyage',
      marketing: 'Marketing',
      utilities: 'Services',
      salary: 'Moyens Humains',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  const calculateStatsFromCharges = (chargesList: Charge[]) => {
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

    // Calculate monthly data by category
    const monthlyByCategory: Record<string, { humains: number; environnement: number }> = {};
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    months.forEach((month, index) => {
      const monthKey = `${index + 1}`.padStart(2, '0');
      monthlyByCategory[monthKey] = { humains: 0, environnement: 0 };
    });

    // First pass: categorize charges
    chargesList.forEach(charge => {
      const date = charge.date ? new Date(charge.date) : new Date(charge.created_at);
      const monthIndex = date.getMonth(); // 0-11 (0 = Jan, 11 = Dec)
      const monthKey = `${monthIndex + 1}`.padStart(2, '0');
      const amount = parseFloat(String(charge.amount || 0));
      const category = (charge.category || '').toLowerCase();
      
      if (!monthlyByCategory[monthKey]) {
        monthlyByCategory[monthKey] = { humains: 0, environnement: 0 };
      }

      if (category.includes('rh') || category.includes('humain') || category.includes('salary')) {
        monthlyByCategory[monthKey].humains += amount;
      } else if (category.includes('environnement') || category.includes('environment') || category.includes('utilities') || category.includes('office')) {
        monthlyByCategory[monthKey].environnement += amount;
      } else {
        // For other categories, distribute equally or based on existing pattern
        const humainsTotal = Object.values(monthlyByCategory).reduce((sum, m) => sum + m.humains, 0);
        const envTotal = Object.values(monthlyByCategory).reduce((sum, m) => sum + m.environnement, 0);
        const total = humainsTotal + envTotal || 1;
        if (total > 0) {
          monthlyByCategory[monthKey].humains += amount * (humainsTotal / total);
          monthlyByCategory[monthKey].environnement += amount * (envTotal / total);
        } else {
          // If no data yet, split equally
          monthlyByCategory[monthKey].humains += amount * 0.5;
          monthlyByCategory[monthKey].environnement += amount * 0.5;
        }
      }
    });

    // Convert to array format for charts
    const monthlyEvolution = months.map((month, index) => {
      const monthKey = `${index + 1}`.padStart(2, '0');
      const data = monthlyByCategory[monthKey] || { humains: 0, environnement: 0 };
      return {
        month: month,
        humains: data.humains,
        environnement: data.environnement,
        total: data.humains + data.environnement
      };
    });

    // Convert byCategory to array format (must be before using it in logs)
    const byCategoryArray = Object.keys(byCategory).map(name => ({
      name: getCategoryLabel(name),
      value: byCategory[name]
    }));

    // Calculate totals by category
    const humainsTotal = Object.values(monthlyByCategory).reduce((sum, m) => sum + m.humains, 0);
    const environnementTotal = Object.values(monthlyByCategory).reduce((sum, m) => sum + m.environnement, 0);

    // Debug log to verify data
    console.log('📊 Monthly Evolution Data:', monthlyEvolution);
    console.log('📊 By Category Data:', byCategoryArray);
    console.log('📊 Totals - Humains:', humainsTotal, 'Environnement:', environnementTotal, 'Total:', totalExpenses);

    const dashboardData: ExpensesDashboardResponse = {
      success: true,
      data: {
        charts: {
          by_category: byCategoryArray,
          monthly_evolution: monthlyEvolution.map(m => ({ month: m.month, value: m.total })),
          by_contract_type: []
        },
        summary: {
          total_expenses: totalExpenses,
          total_count: totalCount,
          average_expense: averageExpense
        },
        monthly_data: monthlyEvolution,
        humains_total: humainsTotal,
        environnement_total: environnementTotal
      } as any
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDateSortToggle = () => {
    if (sortField === 'date') {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField('date');
      setSortDirection('desc');
    }
  };

  const sortedCharges = useMemo(() => {
    const sorted = [...charges];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date || a.created_at).getTime();
          bValue = new Date(b.date || b.created_at).getTime();
          break;
        case 'label':
          aValue = a.label || '';
          bValue = b.label || '';
          break;
        case 'category':
          aValue = getCategoryLabel(a.category || '');
          bValue = getCategoryLabel(b.category || '');
          break;
        case 'amount':
          aValue = parseFloat(String(a.amount || 0));
          bValue = parseFloat(String(b.amount || 0));
          break;
        case 'formation':
          aValue = getCourseName(a);
          bValue = getCourseName(b);
          break;
        default:
          return 0;
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'fr', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [charges, sortField, sortDirection]);

  // Apply advanced filters
  const filteredCharges = useMemo(() => {
    return sortedCharges.filter(charge => {
      // Date filter
      if (dateFilter.start || dateFilter.end) {
        const chargeDate = new Date(charge.date || charge.created_at);
        if (dateFilter.start) {
          const startDate = new Date(dateFilter.start);
          if (chargeDate < startDate) return false;
        }
        if (dateFilter.end) {
          const endDate = new Date(dateFilter.end);
          endDate.setHours(23, 59, 59, 999); // Include full end date
          if (chargeDate > endDate) return false;
        }
      }

      // Amount filter
      if (amountFilter.min || amountFilter.max) {
        const amount = parseFloat(String(charge.amount || 0));
        if (amountFilter.min && amount < parseFloat(amountFilter.min)) return false;
        if (amountFilter.max && amount > parseFloat(amountFilter.max)) return false;
      }

      // Formation filter
      if (formationFilter) {
        const courseName = getCourseName(charge).toLowerCase();
        if (!courseName.includes(formationFilter.toLowerCase()) && courseName !== '-') {
          return false;
        }
        if (courseName === '-' && formationFilter.toLowerCase() !== '-') {
          return false;
        }
      }

      return true;
    });
  }, [sortedCharges, dateFilter, amountFilter, formationFilter]);

  const formatCurrency = (value: number | string | undefined): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  };

  const getDocumentCount = (charge: Charge): number => {
    return charge.documents?.length || 0;
  };

  const getFirstDocumentName = (charge: Charge): string => {
    if (charge.documents && charge.documents.length > 0) {
      return charge.documents[0].original_name || charge.documents[0].file_path.split('/').pop() || 'document.pdf';
    }
    return '';
  };

  const handleDownloadDocument = (document: any) => {
    try {
      // Use the same base URL as in ChargeViewModal
      const baseURL = 'http://localhost:8000';
      const filePath = document.file_path.startsWith('/') ? document.file_path.slice(1) : document.file_path;
      const fileUrl = `${baseURL}/storage/${filePath}`;
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      showError('Erreur', 'Impossible de télécharger le document');
    }
  };

  const getCourseName = (charge: Charge): string => {
    if (charge.course) {
      return charge.course.name || charge.course.title || '-';
    }
    return '-';
  };

  const confirmDeleteCharge = async () => {
    if (!chargeToDelete) return;
    
    setDeleting(true);
    try {
      if (chargeToDelete === 'bulk') {
        const deletePromises = Array.from(selectedCharges).map(id =>
          commercialService.deleteCharge(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedCharges.size} dépense(s) supprimée(s) avec succès`);
        setSelectedCharges(new Set());
      } else {
        await commercialService.deleteCharge(chargeToDelete);
        success('Dépense supprimée avec succès');
      }
      fetchCharges();
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

  const handleExportExcel = async () => {
    try {
      // Export selected charges if any, otherwise export all filtered charges
      const chargesToExport = selectedCharges.size > 0
        ? filteredCharges.filter(c => selectedCharges.has(String(c.id)))
        : filteredCharges;

      if (chargesToExport.length === 0) {
        showError('Erreur', 'Aucune charge à exporter');
        return;
      }

      const csvData = chargesToExport.map(charge => ({
        'Date': formatDate(charge.date || charge.created_at),
        'Libellé': charge.label || '',
        'Catégorie': getCategoryLabel(charge.category || ''),
        'Montant (€)': parseFloat(String(charge.amount || 0)),
        'Pièce jointe': getDocumentCount(charge) > 0 ? getFirstDocumentName(charge) : '',
        'Formation liée': getCourseName(charge),
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `charges_depenses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      success(`${chargesToExport.length} charge(s) exportée(s) en Excel avec succès`);
    } catch (err) {
      showError('Erreur', 'Impossible d\'exporter les charges');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Export selected charges if any, otherwise export all filtered charges
      const chargesToExport = selectedCharges.size > 0
        ? filteredCharges.filter(c => selectedCharges.has(String(c.id)))
        : filteredCharges;

      if (chargesToExport.length === 0) {
        showError('Erreur', 'Aucune charge à exporter');
        return;
      }

      // Create a simple PDF using window.print() approach
      // For a more sophisticated PDF, you would use a library like jsPDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showError('Erreur', 'Impossible d\'ouvrir la fenêtre d\'impression');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Charges et Dépenses</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Charges et Dépenses</h1>
          <p>Date d'export : ${new Date().toLocaleDateString('fr-FR')}</p>
          <p>Nombre de charges : ${chargesToExport.length}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th>Montant (€)</th>
                <th>Formation liée</th>
              </tr>
            </thead>
            <tbody>
              ${chargesToExport.map(charge => `
                <tr>
                  <td>${formatDate(charge.date || charge.created_at)}</td>
                  <td>${charge.label || ''}</td>
                  <td>${getCategoryLabel(charge.category || '')}</td>
                  <td>${formatCurrency(charge.amount)}</td>
                  <td>${getCourseName(charge)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      success(`PDF généré avec succès (${chargesToExport.length} charge(s))`);
    } catch (err) {
      showError('Erreur', 'Impossible d\'exporter en PDF');
    }
  };

  const allSelected = selectedCharges.size === charges.length && charges.length > 0;
  const someSelected = selectedCharges.size > 0 && selectedCharges.size < charges.length;

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

      {/* Statistics Cards with Stacked Bar Charts */}
      {dashboardStats && dashboardStats.data && (dashboardStats.data as any).monthly_data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Expenses Card */}
          <ExpenseStatCard
            title="Dépenses Total"
            amount={dashboardStats.data.summary.total_expenses}
            monthlyData={(dashboardStats.data as any).monthly_data}
            type="total"
            isDark={isDark}
            primaryColor={primaryColor}
            categoryData={(dashboardStats.data as any).charts?.by_category || []}
            onEyeClick={() => setExpenseModalType('total')}
          />

          {/* Moyens Environnementaux Card */}
          <ExpenseStatCard
            title="Moyens Environnementaux"
            amount={(dashboardStats.data as any).environnement_total || 0}
            monthlyData={(dashboardStats.data as any).monthly_data}
            type="environnement"
            isDark={isDark}
            primaryColor={primaryColor}
            onEyeClick={() => setExpenseModalType('environnement')}
          />

          {/* Moyens Humains Card */}
          <ExpenseStatCard
            title="Moyens Humains"
            amount={(dashboardStats.data as any).humains_total || 0}
            monthlyData={(dashboardStats.data as any).monthly_data}
            type="humains"
            isDark={isDark}
            primaryColor={primaryColor}
            onEyeClick={() => setExpenseModalType('humains')}
          />
        </div>
      )}

      {/* Filters and Table Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Search and Delete */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-3 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-[10px]`} style={{ width: '400px' }}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                placeholder="Rechercher Un Article"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setTimeout(() => {
                    if (e.target.value === searchTerm) {
                      fetchCharges();
                    }
                  }, 500);
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchCharges()}
                className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
              />
            </div>

            {/* Delete Button - Only show when items are selected */}
            {selectedCharges.size > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(true);
                  setChargeToDelete('bulk');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border-2 border-dashed ${isDark ? 'border-red-700 bg-red-900/20 hover:bg-red-900/30' : 'border-red-500 bg-transparent hover:bg-red-50'}`}
                style={{
                  borderColor: '#ef4444',
                  borderStyle: 'dashed',
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="font-medium text-sm text-red-500">
                  Supprimer ({selectedCharges.size})
                </span>
              </Button>
            )}
          </div>

          {/* Right: All Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              {/* Category Filter Dropdown */}
              <div className="relative" ref={filterDropdownRef}>
                <Button
                  variant="outline"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-blue-500 bg-transparent hover:bg-blue-50'}`}
                  style={{ borderColor: isDark ? undefined : primaryColor }}
                >
                  <Filter className={`w-4 h-4`} style={{ color: primaryColor }} />
                  <span className={`font-medium text-sm`} style={{ color: primaryColor }}>
                    Catégorie
                  </span>
                  <ChevronDown className={`w-4 h-4`} style={{ color: primaryColor }} />
                </Button>
                {showFilterDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                      >
                        Toutes les catégories
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory('salary');
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                      >
                        Moyens Humains
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory('utilities');
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                      >
                        Moyens Environnementaux
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border ${showAdvancedFilters ? 'border-blue-500 bg-blue-50' : (isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-transparent hover:bg-gray-50')}`}
                style={{ borderColor: showAdvancedFilters ? primaryColor : undefined }}
              >
                <Filter className={`w-4 h-4`} style={{ color: showAdvancedFilters ? primaryColor : (isDark ? '#9ca3af' : '#6b7280') }} />
                <span className={`font-medium text-sm`} style={{ color: showAdvancedFilters ? primaryColor : (isDark ? '#9ca3af' : '#6b7280') }}>
                  Filtres avancés
                </span>
              </Button>
            </div>

            {/* Export Excel Button */}
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : ''}`}
              style={{ 
                borderColor: isDark ? undefined : primaryColor,
                borderStyle: 'dashed',
              }}
            >
              <FileSpreadsheet className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="font-medium text-sm" style={{ color: primaryColor }}>
                Export Excel
              </span>
            </Button>

            {/* Export PDF Button */}
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : ''}`}
              style={{ 
                borderColor: isDark ? undefined : primaryColor,
                borderStyle: 'dashed',
              }}
            >
              <FileText className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="font-medium text-sm" style={{ color: primaryColor }}>
                Export PDF
              </span>
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} mb-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div className="flex flex-col gap-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date de début
                </Label>
                <Input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-10`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date de fin
                </Label>
                <Input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-10`}
                />
              </div>

              {/* Amount Range Filter */}
              <div className="flex flex-col gap-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant min (€)
                </Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={amountFilter.min}
                  onChange={(e) => setAmountFilter({ ...amountFilter, min: e.target.value })}
                  className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-10`}
                  step="0.01"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant max (€)
                </Label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={amountFilter.max}
                  onChange={(e) => setAmountFilter({ ...amountFilter, max: e.target.value })}
                  className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-10`}
                  step="0.01"
                />
              </div>

              {/* Formation Filter */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Formation
                </Label>
                <Input
                  type="text"
                  placeholder="Rechercher une formation"
                  value={formationFilter}
                  onChange={(e) => setFormationFilter(e.target.value)}
                  className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-10`}
                />
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end md:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFilter({ start: '', end: '' });
                    setAmountFilter({ min: '', max: '' });
                    setFormationFilter('');
                  }}
                  className={`w-full h-10 ${isDark ? 'border-gray-600 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredCharges.length === 0 && !loading ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('common.noDataFound')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full overflow-x-auto relative">
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/10 dark:bg-white/5 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: primaryColor }}></div>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Chargement...</p>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className="w-[50px] px-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                    />
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortField === 'date' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('label')}
                  >
                    <div className="flex items-center gap-2">
                      Libellé
                      {sortField === 'label' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Catégorie
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-2">
                      Montant (€)
                      {sortField === 'amount' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] px-4 py-3`}>
                    Pièce jointe
                  </TableHead>
                  <TableHead
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('formation')}
                  >
                    <div className="flex items-center gap-2">
                      Formation liée
                      {sortField === 'formation' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] px-4 py-3`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.map((charge) => {
                  const isSelected = selectedCharges.has(String(charge.id));
                  const docCount = getDocumentCount(charge);
                  const firstDocName = getFirstDocumentName(charge);
                  
                  return (
                    <TableRow
                      key={String(charge.id)}
                      className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-gray-50'} ${isSelected ? 'bg-[#F0F8FF]' : ''}`}
                    >
                      <TableCell className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectCharge(String(charge.id), checked as boolean)}
                          className={`w-5 h-5 rounded-md border ${isSelected ? 'bg-[#2196F3] border-[#2196F3]' : 'bg-white border-[#d5d6da]'}`}
                        />
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} text-[15px]`}>
                        {formatDate(charge.date || charge.created_at)}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} text-[15px]`}>
                        {charge.label || '-'}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} text-[15px]`}>
                        {getCategoryLabel(charge.category || '')}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} text-[15px]`}>
                        {formatCurrency(charge.amount)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {docCount > 0 ? (
                          <Badge 
                            className="rounded-full px-3 py-1 font-medium text-sm inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              backgroundColor: '#E3F2FD',
                              color: '#2196F3',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (charge.documents && charge.documents.length > 0) {
                                handleDownloadDocument(charge.documents[0]);
                              }
                            }}
                            title={`Cliquer pour télécharger${docCount > 1 ? ` (${docCount} fichiers)` : ''}`}
                          >
                            <FileIcon className="w-3 h-3" />
                            <span className="hover:underline">{firstDocName}</span>
                            {docCount > 1 && (
                              <span 
                                className="ml-1 text-xs"
                                style={{ color: '#1976D2' }}
                              >
                                +{docCount - 1}
                              </span>
                            )}
                          </Badge>
                        ) : (
                          <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                        )}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} text-[15px]`}>
                        {getCourseName(charge)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedCharge(charge);
                              setIsEditModalOpen(true);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} transition-all`}
                            title="Modifier"
                          >
                            <Edit className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                          </button>
                          <button 
                            onClick={() => {
                              setChargeToDelete(String(charge.id));
                              setShowDeleteModal(true);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} transition-all`}
                            title="Supprimer"
                          >
                            <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 0 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className={`${isDark ? 'border-gray-600' : ''}`}
            >
              {t('common.previous')}
            </Button>
            <span className={`px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('common.page')} {page} {t('common.of')} {pagination.total_pages || 1}
            </span>
            <Button
              variant="outline"
              disabled={page >= (pagination.total_pages || 1)}
              onClick={() => setPage(page + 1)}
              className={`${isDark ? 'border-gray-600' : ''}`}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Article Creation Modal */}
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
        }}
      />

      {/* Article Edit Modal */}
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
        }}
      />

      {/* Confirmation Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteCharge}
        onConfirm={confirmDeleteCharge}
        title={chargeToDelete === 'bulk'
          ? `Voulez-vous vraiment supprimer ${selectedCharges.size} dépense(s) ?`
          : "Voulez-vous vraiment supprimer cette dépense ?"}
        message="Cette action est irréversible. La dépense sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />

      {/* Expense Detail Modal */}
      {expenseModalType && dashboardStats && dashboardStats.data && (dashboardStats.data as any).monthly_data && (
        <ExpenseDetailModal
          isOpen={expenseModalType !== null}
          onClose={() => setExpenseModalType(null)}
          type={expenseModalType}
          totalAmount={
            expenseModalType === 'total'
              ? dashboardStats.data.summary.total_expenses
              : expenseModalType === 'humains'
              ? (dashboardStats.data as any).humains_total || 0
              : (dashboardStats.data as any).environnement_total || 0
          }
          monthlyData={(dashboardStats.data as any).monthly_data}
          categoryData={(dashboardStats.data as any).charts?.by_category || []}
          humainsTotal={(dashboardStats.data as any).humains_total || 0}
          environnementTotal={(dashboardStats.data as any).environnement_total || 0}
        />
      )}
    </div>
  );
};
