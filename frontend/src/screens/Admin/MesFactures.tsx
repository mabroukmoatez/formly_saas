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
  ArrowUpDown,
  FileSpreadsheet,
  Calendar,
  X,
  FileDown,
  FileText,
  RotateCw
} from 'lucide-react';
import { EmailModal, EmailData } from '../../components/CommercialDashboard/EmailModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
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
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('issue_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter states
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalInvoice, setEmailModalInvoice] = useState<Invoice | null>(null);

  // Format date for input (DD-MM-YYYY)
  const formatDateForInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Parse date from input (DD-MM-YYYY)
  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, selectedStatus, searchTerm, minAmount, maxAmount, dateFrom, dateTo, filterType, filterStatus]);

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
      
      // Parse amount values
      const minAmountValue = minAmount ? parseFloat(minAmount.replace(/[^\d.,]/g, '').replace(',', '.')) : undefined;
      const maxAmountValue = maxAmount ? parseFloat(maxAmount.replace(/[^\d.,]/g, '').replace(',', '.')) : undefined;
      
      // Format dates for API (YYYY-MM-DD)
      const formatDateForAPI = (dateString: string): string | undefined => {
        if (!dateString) return undefined;
        const parsed = parseDateFromInput(dateString);
        if (!parsed) return undefined;
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const response = await commercialService.getInvoices({
        page,
        per_page: 12,
        search: searchTerm || undefined,
        status: filterStatus || selectedStatus || undefined,
        min_amount: minAmountValue,
        max_amount: maxAmountValue,
        date_from: formatDateForAPI(dateFrom),
        date_to: formatDateForAPI(dateTo),
        client_type: filterType || undefined,
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

  // Note: Filters are now applied on the backend, but we keep client-side filtering as fallback
  // if backend doesn't support all filters yet
  const filteredInvoices = useMemo(() => {
    // If backend supports all filters, return invoices as-is
    // Otherwise, apply client-side filtering as fallback
    let filtered = [...invoices];

    // Only apply client-side filtering if backend doesn't support it
    // (This is a fallback - ideally all filtering should be done on backend)
    const needsClientSideFilter = false; // Set to true if backend doesn't support all filters yet

    if (needsClientSideFilter) {
      // Filter by amount
      if (minAmount || maxAmount) {
        const min = minAmount ? parseFloat(minAmount.replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
        const max = maxAmount ? parseFloat(maxAmount.replace(/[^\d.,]/g, '').replace(',', '.')) : Infinity;
        filtered = filtered.filter(inv => {
          const amount = parseFloat(String(inv.total_ttc || inv.total_amount || 0));
          return amount >= min && amount <= max;
        });
      }

      // Filter by date
      if (dateFrom || dateTo) {
        const fromDate = dateFrom ? parseDateFromInput(dateFrom) : null;
        const toDate = dateTo ? parseDateFromInput(dateTo) : null;
        filtered = filtered.filter(inv => {
          const invDate = new Date(inv.issue_date);
          if (fromDate && invDate < fromDate) return false;
          if (toDate && invDate > toDate) return false;
          return true;
        });
      }

      // Filter by type
      if (filterType) {
        filtered = filtered.filter(inv => {
          const type = inv.client?.type || 'particulier';
          return type === filterType;
        });
      }
    }

    return filtered;
  }, [invoices, minAmount, maxAmount, dateFrom, dateTo, filterType]);

  const sortedInvoices = useMemo(() => {
    const sorted = [...filteredInvoices];
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
  }, [filteredInvoices, sortField, sortDirection]);

  // Reset filters
  const resetFilters = () => {
    setMinAmount('');
    setMaxAmount('');
    setDateFrom('');
    setDateTo('');
    setFilterType('');
    setFilterStatus('');
  };

  // Reset specific section
  const resetAmountFilter = () => {
    setMinAmount('');
    setMaxAmount('');
  };

  const resetPeriodFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const resetTypeFilter = () => {
    setFilterType('');
  };

  const resetStatusFilter = () => {
    setFilterStatus('');
  };

  // Quick date selections
  const setToday = () => {
    const today = new Date();
    setDateFrom(formatDateForInput(today));
    setDateTo(formatDateForInput(today));
  };

  const setThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    setDateFrom(formatDateForInput(monday));
    setDateTo(formatDateForInput(new Date()));
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(formatDateForInput(firstDay));
    setDateTo(formatDateForInput(today));
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilterModal(false);
    setPage(1); // Reset to first page when applying filters
    fetchInvoices();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Sélectionner toutes les factures de la page actuelle
      setSelectedInvoices(new Set(sortedInvoices.map(inv => String(inv.id))));
    } else {
      setSelectedInvoices(new Set());
    }
  };

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
      // Si des factures sont sélectionnées, exporter seulement celles-ci
      const invoicesToExport = selectedInvoices.size > 0
        ? invoices.filter(inv => selectedInvoices.has(String(inv.id)))
        : invoices;

      const csvData = invoicesToExport.map(inv => ({
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
      success(`${invoicesToExport.length} facture(s) exportée(s) avec succès`);
    } catch (err) {
      showError('Erreur', 'Impossible d\'exporter les factures');
    }
  };

  const handleExportSelectedExcel = async () => {
    if (selectedInvoices.size === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins une facture');
      return;
    }
    await handleExportExcel();
  };

  const handleExportSelectedPDF = async () => {
    if (selectedInvoices.size === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins une facture');
      return;
    }
    try {
      const invoiceIds = Array.from(selectedInvoices);
      // Générer un PDF pour chaque facture sélectionnée
      for (const id of invoiceIds) {
        const blob = await commercialService.generateInvoicePdf(id);
        const invoice = invoices.find(inv => String(inv.id) === id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture-${invoice?.invoice_number || id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        // Petit délai entre chaque téléchargement
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      success(`${selectedInvoices.size} facture(s) exportée(s) en PDF avec succès`);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible d\'exporter les factures en PDF');
    }
  };

  const handleRelancerSelected = async () => {
    if (selectedInvoices.size === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins une facture');
      return;
    }
    // Ouvrir le modal d'email pour la première facture sélectionnée
    const firstInvoiceId = Array.from(selectedInvoices)[0];
    const firstInvoice = invoices.find(inv => String(inv.id) === firstInvoiceId);
    if (firstInvoice) {
      setEmailModalInvoice(firstInvoice);
      setShowEmailModal(true);
    }
  };

  const handleSendEmailConfirm = async (emailData: EmailData) => {
    if (!emailModalInvoice) return;
    
    try {
      // Envoyer l'email pour toutes les factures sélectionnées
      const invoiceIds = Array.from(selectedInvoices);
      for (const id of invoiceIds) {
        await commercialService.sendInvoiceEmail(id, emailData);
      }
      success(`${selectedInvoices.size} facture(s) relancée(s) avec succès`);
      setShowEmailModal(false);
      setEmailModalInvoice(null);
      setSelectedInvoices(new Set());
      fetchInvoices();
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de relancer les factures');
      throw err;
    }
  };

  // Calculer si toutes les factures affichées sont sélectionnées
  const allSelected = sortedInvoices.length > 0 && sortedInvoices.every(inv => selectedInvoices.has(String(inv.id)));
  const someSelected = sortedInvoices.some(inv => selectedInvoices.has(String(inv.id))) && !allSelected;

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
      <div className="flex items-center justify-between mb-4 rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 
              className={`font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.mes_factures.title')}
            </h1>
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
        <div className="flex items-center justify-between w-full gap-3">
          {/* Left: Search Bar - Position fixe, toujours au même endroit */}
          <div className={`flex items-center gap-3 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-[10px]`} style={{ width: '400px', flexShrink: 0 }}>
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
            <Input
              placeholder="Rechercher Un Document"
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

          {/* Middle: Action Buttons (shown when invoices are selected) */}
          {selectedInvoices.size > 0 && (
            <div className="flex items-center gap-3 flex-1 justify-start" style={{ marginLeft: '16px' }}>
              <Button
                variant="outline"
                onClick={handleExportSelectedExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-lg border-2 border-dashed"
                style={{ 
                  borderColor: primaryColor,
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <FileDown className="w-4 h-4" />
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-medium text-sm">
                  Export Excel
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handleExportSelectedPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-lg border-2 border-dashed"
                style={{ 
                  borderColor: primaryColor,
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <FileDown className="w-4 h-4" />
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">
                  Export PDF
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setInvoiceToDelete('bulk');
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-lg border-2 border-dashed"
                style={{ 
                  borderColor: '#ef4444',
                  backgroundColor: '#ef4444',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <FileDown className="w-4 h-4" />
                <Trash2 className="w-4 h-4" />
                <span className="font-medium text-sm">
                  Supprimer
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handleRelancerSelected}
                className="inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-lg border-2 border-dashed"
                style={{ 
                  borderColor: primaryColor,
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <RotateCw className="w-4 h-4" />
                <span className="font-medium text-sm">
                  Relancer
                </span>
              </Button>
            </div>
          )}

          {/* Right: Filter and Export (shown when no invoices are selected) */}
          {selectedInvoices.size === 0 && (
            <div className="flex items-center gap-3">
              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(true)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-transparent hover:bg-gray-50'}`}
              >
                <ArrowUpDown className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Trier
                </span>
                <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
              </Button>

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
          )}
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
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      style={someSelected && !allSelected ? { opacity: 0.7 } : {}}
                    />
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
                      className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-gray-50'} ${selectedInvoices.has(String(invoice.id)) ? 'bg-blue-50' : ''} cursor-pointer`}
                      onClick={(e) => {
                        // Don't open modal if clicking on checkbox, action buttons, or status badge
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('button') ||
                          target.closest('[role="checkbox"]') ||
                          target.type === 'checkbox' ||
                          target.closest('.status-badge')
                        ) {
                          return;
                        }
                        // Open import modal in edit mode
                        setEditingInvoice(invoice);
                        setIsImportModalOpen(true);
                      }}
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
                      <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Badge className={`status-badge ${statusColors.bg} ${statusColors.text} rounded-full px-3 py-1 font-medium text-sm`}>
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              // Open import modal in edit mode
                              setEditingInvoice(invoice);
                              setIsImportModalOpen(true);
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
   
           {/* Totals Summary Card - Bottom Right */}
        {sortedInvoices.length > 0 && (
          <div className="rounded-[18px]  p-4 mt-4 ${isDark ? 'bg-gray-800' : 'bg-white'}">
            <div className="flex justify-end mt-4 ">
              <div className={`border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} w-[350px] rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-6 shadow-sm`}>
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
            </div>
          </div>
        )}
      

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className={`sm:max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              Filtrer les factures
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 mt-4">
            {/* Montant TTC Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <label className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Montant TTC
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Min</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Max</span>
                  </div>
                </div>
                <button
                  onClick={resetAmountFilter}
                  className="text-sm font-medium"
                  style={{ color: primaryColor }}
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="1000 €"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className={`flex-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white`}
                />
                <Input
                  type="text"
                  placeholder="2000 €"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className={`flex-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white`}
                />
              </div>
            </div>

            {/* Période Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <label className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Période
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>De</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>À</span>
                  </div>
                </div>
                <button
                  onClick={resetPeriodFilter}
                  className="text-sm font-medium"
                  style={{ color: primaryColor }}
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="09-10-2025"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`w-full rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white pr-10`}
                  />
                  <Calendar className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="09-11-2025"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`w-full rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white pr-10`}
                  />
                  <Calendar className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={setToday}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={setThisWeek}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cette Semaine
                </button>
                <button
                  onClick={setThisMonth}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ce Mois
                </button>
              </div>
            </div>

            {/* Type Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Type
                </label>
                <button
                  onClick={resetTypeFilter}
                  className="text-sm font-medium"
                  style={{ color: primaryColor }}
                >
                  Reset
                </button>
              </div>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`w-full rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white px-4 py-2 appearance-none pr-10`}
                >
                  <option value="">Tous</option>
                  <option value="particulier">Particulier</option>
                  <option value="company">Entreprise</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>

            {/* Status Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Status
                </label>
                <button
                  onClick={resetStatusFilter}
                  className="text-sm font-medium"
                  style={{ color: primaryColor }}
                >
                  Reset
                </button>
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white px-4 py-2 appearance-none pr-10`}
                >
                  <option value="">Tous</option>
                  <option value="paid">Payée</option>
                  <option value="sent">Envoyée</option>
                  <option value="draft">Brouillon</option>
                  <option value="overdue">Impayée</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>

            {/* Apply Button */}
            <Button
              onClick={applyFilters}
              className="w-full py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Appliquer les filtres
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        onClose={() => {
          setIsImportModalOpen(false);
          setEditingInvoice(null);
        }}
        onSuccess={(extractedData) => {
          if (editingInvoice) {
            // Edit mode: Just refresh the list
            setIsImportModalOpen(false);
            setEditingInvoice(null);
            fetchInvoices();
          } else {
            // Create mode: Navigate to invoice creation page with pre-filled data
            if (subdomain) {
              navigate(`/${subdomain}/invoice-creation`, { state: { prefillData: extractedData } });
            } else {
              navigate('/invoice-creation', { state: { prefillData: extractedData } });
            }
          }
        }}
        invoice={editingInvoice}
      />

      {/* Email Modal for Relance */}
      {emailModalInvoice && (
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setEmailModalInvoice(null);
          }}
          onSend={handleSendEmailConfirm}
          documentType="invoice"
          documentNumber={emailModalInvoice.invoice_number || ''}
          clientEmail={emailModalInvoice.client?.email || emailModalInvoice.client_email || ''}
          clientName={emailModalInvoice.client?.company_name || 
            `${emailModalInvoice.client?.first_name || ''} ${emailModalInvoice.client?.last_name || ''}`.trim() ||
            emailModalInvoice.client_name || ''}
        />
      )}
    </div>
  );
};
