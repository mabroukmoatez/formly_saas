import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Invoice } from '../../services/commercial.types';
import { useToast } from '../../components/ui/toast';
import { InvoiceViewModal } from '../../components/CommercialDashboard/InvoiceViewModal';
import { InvoiceImportModal } from '../../components/CommercialDashboard/InvoiceImportModal';
import { ConfirmationModal as ConfirmationModalComponent } from '../../components/ui/confirmation-modal';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Receipt, 
  FileUp, 
  ChevronDown,
  ChevronUp,
  Menu,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

type SortField = 'invoice_number' | 'issue_date' | 'client_name' | 'total_ht' | 'total_tva' | 'total_ttc' | 'status' | 'type';
type SortDirection = 'asc' | 'desc';

export const MesFactures = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization, subdomain } = useOrganization();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const primaryColor = organization?.primary_color || '#007aff';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
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
    fetchInvoices();
  }, [page, selectedStatus, searchTerm]);

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    setDeleting(true);
    try {
      if (invoiceToDelete === 'bulk') {
        const deletePromises = Array.from(selectedInvoices).map(id =>
          commercialService.deleteInvoice(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedInvoices.size} facture(s) supprimée(s) avec succès`);
        setSelectedInvoices(new Set());
      } else {
        await commercialService.deleteInvoice(invoiceToDelete);
        success('Facture supprimée avec succès');
      }
      fetchInvoices();
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer la facture');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteInvoice = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await commercialService.getInvoices({
        page,
        per_page: 12,
        search: searchTerm || undefined,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        const responseData = response.data as any;
        const invoicesData = responseData.invoices?.data || responseData.data?.data || responseData.data || [];
        setInvoices(invoicesData);
        
        const paginationData = responseData.invoices || responseData.pagination || {};
        setPagination({
          total: paginationData.total || paginationData.total || 0,
          total_pages: paginationData.last_page || paginationData.total_pages || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      showError(t('common.error'), 'Impossible de charger les factures');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(invoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = useMemo(() => {
    const sorted = [...invoices];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'invoice_number':
          aValue = a.invoice_number || '';
          bValue = b.invoice_number || '';
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
          aValue = parseFloat(String(a.total_ht || 0));
          bValue = parseFloat(String(b.total_ht || 0));
          break;
        case 'total_tva':
          aValue = parseFloat(String(a.total_tva || 0));
          bValue = parseFloat(String(b.total_tva || 0));
          break;
        case 'total_ttc':
          aValue = parseFloat(String(a.total_ttc || a.total_amount || 0));
          bValue = parseFloat(String(b.total_ttc || b.total_amount || 0));
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
  }, [invoices, sortField, sortDirection]);

  const getStatusColor = (status: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      paid: { bg: 'bg-teal-100', text: 'text-teal-700' }, // Vert menthe/turquoise
      sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
      overdue: { bg: 'bg-pink-100', text: 'text-pink-700' }, // Rose/rouge clair pour impayé
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      paid: 'Payée',
      sent: 'Envoyée',
      draft: 'Brouillon',
      overdue: 'Impayée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getClientType = (invoice: Invoice): string => {
    if (invoice.client?.type) {
      return invoice.client.type === 'company' ? 'Entreprise' : 'Particulier';
    }
    return 'Particulier';
  };

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
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const handleExportExcel = async () => {
    try {
      const csvData = invoices.map(inv => ({
        'N°': inv.invoice_number,
        'Date': formatDate(inv.issue_date),
        'Type': getClientType(inv),
        'Client': inv.client?.company_name || 
          `${inv.client?.first_name || ''} ${inv.client?.last_name || ''}`.trim() ||
          inv.client_name || '',
        'Montant HT': parseFloat(String(inv.total_ht || 0)),
        'Montant TVA': parseFloat(String(inv.total_tva || 0)),
        'Montant TTC': parseFloat(String(inv.total_ttc || inv.total_amount || 0)),
        'Statut': getStatusLabel(inv.status),
      }));
      
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factures_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      success('Factures exportées avec succès');
    } catch (err) {
      showError('Erreur', 'Impossible d\'exporter les factures');
    }
  };

  const allSelected = selectedInvoices.size === invoices.length && invoices.length > 0;
  const someSelected = selectedInvoices.size > 0 && selectedInvoices.size < invoices.length;

  if (loading && invoices.length === 0) {
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
            <Receipt className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.mes_factures.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('dashboard.commercial.mes_factures.subtitle')}
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
              Importer une facture
            </span>
          </Button>
          <Button 
            onClick={() => {
              if (subdomain) {
                navigate(`/${subdomain}/invoice-creation`);
              } else {
                navigate('/invoice-creation');
              }
            }}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              {t('dashboard.commercial.mes_factures.create')}
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
                // Debounce search
                setTimeout(() => {
                  if (e.target.value === searchTerm) {
                    fetchInvoices();
                  }
                }, 500);
              }}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
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
                    {(['invoice_number', 'issue_date', 'client_name', 'total_ttc', 'status'] as SortField[]).map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          handleSort(field);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                      >
                        {field === 'invoice_number' && 'N°'}
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
        {sortedInvoices.length === 0 ? (
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
                    onClick={() => handleSort('invoice_number')}
                  >
                    <div className="flex items-center gap-2">
                      N°
                      {sortField === 'invoice_number' ? (
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
                {sortedInvoices.map((invoice) => {
                  const statusColors = getStatusColor(invoice.status);
                  return (
                    <TableRow
                      key={String(invoice.id)}
                      className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-gray-50'} ${selectedInvoices.has(String(invoice.id)) ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell className="px-4 py-4">
                        <Checkbox
                          checked={selectedInvoices.has(String(invoice.id))}
                          onCheckedChange={(checked) => handleSelectInvoice(String(invoice.id), checked as boolean)}
                          className={`w-5 h-5 rounded-md border ${selectedInvoices.has(String(invoice.id)) ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                        />
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : ''} text-[15px]`}>
                        <span style={{ color: primaryColor }} className="cursor-pointer hover:underline">
                          {formatDate(invoice.issue_date)}
                        </span>
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {getClientType(invoice)}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {invoice.client?.company_name || 
                          `${invoice.client?.first_name || ''} ${invoice.client?.last_name || ''}`.trim() ||
                          invoice.client_name || 'N/A'}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'} rounded-full px-3 py-1 font-medium text-sm`}>
                          {formatCurrency(invoice.total_ht)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'} rounded-full px-3 py-1 font-medium text-sm`}>
                          {formatCurrency(invoice.total_tva)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'} rounded-full px-3 py-1 font-medium text-sm`}>
                          {formatCurrency(invoice.total_ttc || invoice.total_amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className={`${statusColors.bg} ${statusColors.text} rounded-full px-3 py-1 font-medium text-sm`}>
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              if (subdomain) {
                                navigate(`/${subdomain}/invoice-view/${invoice.id}`);
                              } else {
                                navigate(`/invoice-view/${invoice.id}`);
                              }
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} transition-all`}
                            title="Modifier"
                          >
                            <Edit className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                          </button>
                          <button 
                            onClick={() => {
                              setInvoiceToDelete(String(invoice.id));
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
            {sortedInvoices.length > 0 && (
              <div className={`mt-6 ml-auto w-[350px] rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-6`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total HT
                    </span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formatCurrency(
                        sortedInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_ht || 0)), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      TVA
                    </span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formatCurrency(
                        sortedInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_tva || 0)), 0)
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
                          sortedInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_ttc || inv.total_amount || 0)), 0)
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


      {/* Invoice View Modal */}
      <InvoiceViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        invoice={selectedInvoice}
        primaryColor={primaryColor}
        onUpdate={() => {
          fetchInvoices();
          success('Facture mise à jour avec succès');
        }}
      />

      {/* Confirmation Delete Modal */}
      <ConfirmationModalComponent
        isOpen={showDeleteModal}
        onClose={cancelDeleteInvoice}
        onConfirm={confirmDeleteInvoice}
        title="Voulez-vous vraiment supprimer cette facture ?"
        message="Cette action est irréversible. La facture sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />

      {/* Invoice Import Modal */}
      <InvoiceImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(extractedData) => {
          // Navigate to invoice creation page with pre-filled data
          if (subdomain) {
            navigate(`/${subdomain}/invoice-creation`, { state: { prefillData: extractedData } });
          } else {
            navigate('/invoice-creation', { state: { prefillData: extractedData } });
          }
        }}
      />
    </div>
  );
};
