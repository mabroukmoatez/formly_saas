import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Quote } from '../../services/commercial.types';
import { useToast } from '../../components/ui/toast';
import { QuoteImportModal } from '../../components/CommercialDashboard/QuoteImportModal';
import { ConfirmationModal as ConfirmationModalComponent } from '../../components/ui/confirmation-modal';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  FileUp, 
  ChevronDown,
  ChevronUp,
  Menu,
  ArrowUpDown,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

type SortField = 'quote_number' | 'issue_date' | 'client_name' | 'total_ht' | 'total_tva' | 'total_ttc' | 'status' | 'type';
type SortDirection = 'asc' | 'desc';

export const MesDevis = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization, subdomain } = useOrganization();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const primaryColor = organization?.primary_color || '#007aff';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('issue_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown]);

  useEffect(() => {
    fetchQuotes();
  }, [page, selectedStatus, searchTerm]);

  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    
    setDeleting(true);
    try {
      if (quoteToDelete === 'bulk') {
        const deletePromises = Array.from(selectedQuotes).map(id =>
          commercialService.deleteQuote(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedQuotes.size} devis supprimé(s) avec succès`);
        setSelectedQuotes(new Set());
      } else {
        await commercialService.deleteQuote(quoteToDelete);
        success('Devis supprimé avec succès');
      }
      fetchQuotes();
      setShowDeleteModal(false);
      setQuoteToDelete(null);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer le devis');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteQuote = () => {
    setShowDeleteModal(false);
    setQuoteToDelete(null);
  };

  // Helper function to normalize values (convert strings to numbers)
  const normalizeValue = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value;
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await commercialService.getQuotes({
        page,
        per_page: 12,
        search: searchTerm || undefined,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        const quotesData = response.data.quotes?.data || response.data.data || [];
        setQuotes(quotesData);
        
        const paginationData = response.data.quotes || response.data.pagination || {};
        setPagination({
          total: paginationData.total || paginationData.total || 0,
          total_pages: paginationData.last_page || paginationData.total_pages || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      showError(t('common.error'), 'Impossible de charger les devis');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuotes(new Set(quotes.map(q => q.id)));
    } else {
      setSelectedQuotes(new Set());
    }
  };

  const handleSelectQuote = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedQuotes);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedQuotes(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedQuotes = useMemo(() => {
    const sorted = [...quotes];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'quote_number':
          aValue = a.quote_number || '';
          bValue = b.quote_number || '';
          break;
        case 'issue_date':
          aValue = new Date(a.issue_date).getTime();
          bValue = new Date(b.issue_date).getTime();
          break;
        case 'client_name':
          aValue = a.client?.company_name || a.client?.first_name || a.client_name || '';
          bValue = b.client?.company_name || b.client?.first_name || b.client_name || '';
          break;
        case 'total_ht':
          aValue = normalizeValue(a.total_ht);
          bValue = normalizeValue(b.total_ht);
          break;
        case 'total_tva':
          aValue = normalizeValue(a.total_tva);
          bValue = normalizeValue(b.total_tva);
          break;
        case 'total_ttc':
          aValue = normalizeValue(a.total_ttc || a.total_amount);
          bValue = normalizeValue(b.total_ttc || b.total_amount);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'type':
          aValue = a.client?.type || 'particulier';
          bValue = b.client?.type || 'particulier';
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
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
  }, [quotes, sortField, sortDirection]);

  const getStatusColor = (status: string): { bg: string; text: string } => {
    // Using exact colors from specifications
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#E3F2FD', text: '#2196F3' }, // Créée - bleu clair
      sent: { bg: '#E3F2FD', text: '#2196F3' }, // Envoyé - bleu clair
      accepted: { bg: '#E8F5E9', text: '#4CAF50' }, // Signé ✓ - vert
      rejected: { bg: 'bg-red-100', text: 'text-red-700' },
      expired: { bg: 'bg-orange-100', text: 'text-orange-700' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: 'Créée',
      sent: 'Envoyé',
      accepted: 'Signé ✓',
      rejected: 'Rejeté',
      expired: 'Expiré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  const getClientType = (quote: Quote): string => {
    if (quote.client?.type) {
      return quote.client.type === 'company' ? 'Entreprise' : 'Particulier';
    }
    return 'Particulier';
  };

  const formatCurrency = (value: number | string | undefined): string => {
    const numValue = normalizeValue(value);
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
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const handleExportExcel = async () => {
    try {
      const csvData = sortedQuotes.map(quote => ({
        'N°': quote.quote_number,
        'Date': formatDate(quote.issue_date),
        'Type': getClientType(quote),
        'Client': quote.client?.company_name || 
          `${quote.client?.first_name || ''} ${quote.client?.last_name || ''}`.trim() ||
          quote.client_name || '',
        'Montant HT': normalizeValue(quote.total_ht),
        'Montant TVA': normalizeValue(quote.total_tva),
        'Montant TTC': normalizeValue(quote.total_ttc || quote.total_amount),
        'Statut': getStatusLabel(quote.status),
      }));
      
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      success('Devis exportés avec succès');
    } catch (err) {
      showError('Erreur', 'Impossible d\'exporter les devis');
    }
  };

  const allSelected = selectedQuotes.size === quotes.length && quotes.length > 0;
  const someSelected = selectedQuotes.size > 0 && selectedQuotes.size < quotes.length;

  if (loading && quotes.length === 0) {
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
            <FileText className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.mes_devis.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('dashboard.commercial.mes_devis.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-[#6a90b9]'} shadow-sm hover:shadow-md transition-all`}
          >
            <FileUp className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              Importer un devis
            </span>
          </Button>
          <Button 
            onClick={() => {
              if (subdomain) {
                navigate(`/${subdomain}/quote-creation`);
              } else {
                navigate('/quote-creation');
              }
            }}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              {t('dashboard.commercial.mes_devis.create')}
            </span>
          </Button>
        </div>
      </div>

      {/* Filters and Table Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Search */}
          <div className={`flex items-center gap-3 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-[10px]`} style={{ width: '400px' }}>
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
            <Input
              placeholder="Rechercher Par Client"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setTimeout(() => {
                  if (e.target.value === searchTerm) {
                    fetchQuotes();
                  }
                }, 500);
              }}
              onKeyDown={(e) => e.key === 'Enter' && fetchQuotes()}
              className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
            />
          </div>

          {/* Right: Sort and Export */}
          <div className="flex items-center gap-3">
            {/* Sort Button */}
            <div className="relative" ref={sortDropdownRef}>
              <Button
                variant="outline"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-transparent hover:bg-gray-50'}`}
              >
                <ArrowUpDown className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Trier
                </span>
                <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
              </Button>
              {showSortDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
                  <div className="p-2">
                    {(['quote_number', 'issue_date', 'client_name', 'total_ttc', 'status'] as SortField[]).map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          handleSort(field);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                      >
                        {field === 'quote_number' && 'N°'}
                        {field === 'issue_date' && 'Date'}
                        {field === 'client_name' && 'Client'}
                        {field === 'total_ttc' && 'Montant TTC'}
                        {field === 'status' && 'Statut'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
          </div>
        </div>

        {/* Table */}
        {sortedQuotes.length === 0 ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('common.noDataFound')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className="w-[50px] px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAllExpanded(!allExpanded)}
                        className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
                      >
                        <Menu className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      </button>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      />
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('quote_number')}
                  >
                    <div className="flex items-center gap-2">
                      N°
                      {sortField === 'quote_number' ? (
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
                    onClick={() => handleSort('issue_date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortField === 'issue_date' ? (
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
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {sortField === 'type' ? (
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
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center gap-2">
                      Client
                      {sortField === 'client_name' ? (
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
                    className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('total_ht')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Montant HT
                      {sortField === 'total_ht' ? (
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
                    className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('total_tva')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Montant TVA
                      {sortField === 'total_tva' ? (
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
                    className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('total_ttc')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Montant TTC
                      {sortField === 'total_ttc' ? (
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
                    className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Statut
                      {sortField === 'status' ? (
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
                {sortedQuotes.map((quote) => {
                  const statusColors = getStatusColor(quote.status);
                  return (
                    <TableRow
                      key={String(quote.id)}
                      className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-gray-50'} ${selectedQuotes.has(String(quote.id)) ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell className="px-4 py-4">
                        <Checkbox
                          checked={selectedQuotes.has(String(quote.id))}
                          onCheckedChange={(checked) => handleSelectQuote(String(quote.id), checked as boolean)}
                          className={`w-5 h-5 rounded-md border ${selectedQuotes.has(String(quote.id)) ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                        />
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {quote.quote_number}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : ''} text-[15px]`}>
                        <span style={{ color: primaryColor }} className="cursor-pointer hover:underline">
                          {formatDate(quote.issue_date)}
                        </span>
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {getClientType(quote)}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {quote.client?.company_name || 
                          `${quote.client?.first_name || ''} ${quote.client?.last_name || ''}`.trim() ||
                          quote.client_name || 'N/A'}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'} rounded-full px-3 py-1 font-medium text-sm`}>
                          {formatCurrency(quote.total_ht)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'} rounded-full px-3 py-1 font-medium text-sm`}>
                          {formatCurrency(quote.total_tva)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'} rounded-full px-3 py-1 font-medium text-sm`}>
                          {formatCurrency(quote.total_ttc || quote.total_amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge 
                          className={`rounded-full px-3 py-1 font-medium text-sm flex items-center justify-center gap-1 inline-flex ${statusColors.bg.startsWith('#') ? '' : statusColors.bg} ${statusColors.text.startsWith('#') ? '' : statusColors.text}`}
                          style={{ 
                            backgroundColor: statusColors.bg.startsWith('#') ? statusColors.bg : undefined,
                            color: statusColors.text.startsWith('#') ? statusColors.text : undefined,
                          }}
                        >
                          {quote.status === 'accepted' && <Check className="w-3 h-3" />}
                          {getStatusLabel(quote.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              if (subdomain) {
                                navigate(`/${subdomain}/quote-view/${quote.id}`);
                              } else {
                                navigate(`/quote-view/${quote.id}`);
                              }
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} transition-all`}
                            title="Modifier"
                          >
                            <Edit className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                          </button>
                          <button 
                            onClick={() => {
                              setQuoteToDelete(String(quote.id));
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

            {/* Totals Summary */}
            {sortedQuotes.length > 0 && (
              <div className={`mt-6 ml-auto w-[350px] rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-6`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total HT
                    </span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formatCurrency(
                        sortedQuotes.reduce((sum, quote) => sum + normalizeValue(quote.total_ht), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      TVA
                    </span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formatCurrency(
                        sortedQuotes.reduce((sum, quote) => sum + normalizeValue(quote.total_tva), 0)
                      )}
                    </span>
                  </div>
                  <div className={`pt-3 border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-base`} style={{ color: primaryColor }}>
                        Total TTC
                      </span>
                      <span className={`font-bold text-xl`} style={{ color: primaryColor }}>
                        {formatCurrency(
                          sortedQuotes.reduce((sum, quote) => sum + normalizeValue(quote.total_ttc || quote.total_amount), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* Confirmation Delete Modal */}
      <ConfirmationModalComponent
        isOpen={showDeleteModal}
        onClose={cancelDeleteQuote}
        onConfirm={confirmDeleteQuote}
        title="Voulez-vous vraiment supprimer ce devis ?"
        message="Cette action est irréversible. Le devis sera définitivement supprimé."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />

      {/* Quote Import Modal */}
      <QuoteImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(extractedData) => {
          // Navigate to creation page with pre-filled data
          if (subdomain) {
            navigate(`/${subdomain}/quote-creation`, { state: { prefillData: extractedData } });
          } else {
            navigate('/quote-creation', { state: { prefillData: extractedData } });
          }
        }}
      />
    </div>
  );
};
