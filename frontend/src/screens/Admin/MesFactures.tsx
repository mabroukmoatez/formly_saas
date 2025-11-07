import { useState, useEffect } from 'react';
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
import { InvoiceCreationModal } from '../../components/CommercialDashboard/InvoiceCreationModal';
import { InvoiceViewModal } from '../../components/CommercialDashboard/InvoiceViewModal';
import { InvoiceImportModal } from '../../components/CommercialDashboard/InvoiceImportModal';
import { ConfirmationModal as ConfirmationModalComponent } from '../../components/ui/confirmation-modal';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Eye, Edit, Trash2, Receipt, FileUp, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [page, selectedStatus]);

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    setDeleting(true);
    try {
      if (invoiceToDelete === 'bulk') {
        // Delete multiple invoices
        const deletePromises = Array.from(selectedInvoices).map(id =>
          commercialService.deleteInvoice(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedInvoices.size} facture(s) supprimée(s) avec succès`);
        setSelectedInvoices(new Set());
      } else {
        // Delete single invoice
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
        // Handle nested invoices structure
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

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      sent: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      paid: 'Payé',
      sent: 'Envoyé',
      draft: 'Brouillon',
      overdue: 'Impayé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
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
        {/* Filters and Actions */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-4 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} rounded-[10px]`} style={{ width: '400px' }}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                placeholder={t('dashboard.commercial.mes_factures.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
                className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Export to CSV
                    const csvData = invoices.map(inv => ({
                      'N° Facture': inv.invoice_number,
                      'Client': inv.client ? (
                        inv.client.company_name || 
                        `${inv.client.first_name || ''} ${inv.client.last_name || ''}`.trim()
                      ) : (inv.client_name || ''),
                      'Montant TTC': parseFloat(String(inv.total_ttc || inv.total_amount || 0)),
                      'Statut': getStatusLabel(inv.status),
                      'Date d\'échéance': inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : '',
                    }));
                    
                    const csv = [
                      Object.keys(csvData[0]).join(','),
                      ...csvData.map(row => Object.values(row).join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
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
                  if (selectedInvoices.size === 0) return;
                  setShowDeleteModal(true);
                  setInvoiceToDelete('bulk');
                }}
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 h-auto rounded-[10px] border border-dashed ${isDark ? 'border-red-700 bg-red-900/20 hover:bg-red-900/30' : 'border-[#fe2f40] bg-transparent hover:bg-[#fff5f5]'}`}
                disabled={selectedInvoices.size === 0}
              >
                <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-[#fe2f40]'}`} />
                <span className={`font-medium ${isDark ? 'text-red-400' : 'text-[#fe2f40]'} text-[13px]`}>
                  {t('common.delete')} ({selectedInvoices.size})
                </span>
              </Button>
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
          >
            <option value="">{t('dashboard.commercial.mes_factures.all_status')}</option>
            <option value="draft">{t('dashboard.commercial.mes_factures.status.draft')}</option>
            <option value="sent">{t('dashboard.commercial.mes_factures.status.sent')}</option>
            <option value="paid">{t('dashboard.commercial.mes_factures.status.paid')}</option>
            <option value="overdue">{t('dashboard.commercial.mes_factures.status.overdue')}</option>
          </select>
        </div>

        {/* Table */}
        {invoices.length === 0 ? (
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
                    Facture N°
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Client
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Montant
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Statut
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Date d'échéance
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={String(invoice.id)}
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-[#007aff14]'} ${selectedInvoices.has(String(invoice.id)) ? 'bg-[#007aff14]' : ''}`}
                  >
                    <TableCell className="px-[42px]">
                      <Checkbox
                        checked={selectedInvoices.has(String(invoice.id))}
                        onCheckedChange={(checked) => handleSelectInvoice(String(invoice.id), checked as boolean)}
                        className={`w-5 h-5 rounded-md border ${selectedInvoices.has(String(invoice.id)) ? 'bg-[#007aff14] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      />
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {invoice.client ? (
                        invoice.client.company_name || 
                        `${invoice.client.first_name || ''} ${invoice.client.last_name || ''}`.trim() ||
                        'Client'
                      ) : (invoice.client_name || 'N/A')}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                        parseFloat(String(invoice.total_ttc || invoice.total_amount || 0))
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => {
                            if (subdomain) {
                              navigate(`/${subdomain}/invoice-view/${invoice.id}`);
                            } else {
                              navigate(`/invoice-view/${invoice.id}`);
                            }
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button 
                          onClick={() => {
                            if (subdomain) {
                              navigate(`/${subdomain}/invoice-view/${invoice.id}`);
                            } else {
                              navigate(`/invoice-view/${invoice.id}`);
                            }
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              // Quick action: Mark as paid if draft/sent, or mark as sent if draft
                              const newStatus = invoice.status === 'draft' ? 'sent' : invoice.status === 'sent' ? 'paid' : 'paid';
                              const response = await commercialService.updateInvoice(String(invoice.id), { status: newStatus } as any);
                              
                              if (response.success) {
                                const statusLabels: Record<string, string> = {
                                  sent: 'Envoyé',
                                  paid: 'Payé',
                                };
                                success(`Facture marquée comme "${statusLabels[newStatus]}"`);
                                fetchInvoices();
                              } else {
                                showError('Erreur', 'Impossible de changer le statut');
                              }
                            } catch (err: any) {
                              showError('Erreur', err.message || 'Impossible de changer le statut');
                            }
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-green-50'}`}
                          title={invoice.status === 'draft' ? 'Marquer comme Envoyé' : 'Marquer comme Payé'}
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </button>
                        <button 
                          onClick={() => {
                            setInvoiceToDelete(invoice.id);
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

            {/* Totals Summary */}
            {invoices.length > 0 && (
              <div className={`mt-6 ml-auto w-[350px] rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-6`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total HT
                    </span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                        invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_ht || 0)), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      TVA
                    </span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                        invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_tva || 0)), 0)
                      )}
                    </span>
                  </div>
                  <div className={`pt-3 border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-base`} style={{ color: primaryColor }}>
                        Total TTC
                      </span>
                      <span className={`font-bold text-xl`} style={{ color: primaryColor }}>
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                          invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_ttc || inv.total_amount || 0)), 0)
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

      {/* Invoice Creation Modal */}
      <InvoiceCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSave={() => {
          setIsModalOpen(false);
          setSelectedInvoice(null);
          fetchInvoices();
          success('Facture créée avec succès');
        }}
      />

      {/* Invoice Edit Modal */}
      <InvoiceCreationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSave={() => {
          setIsEditModalOpen(false);
          setSelectedInvoice(null);
          fetchInvoices();
          success('Facture modifiée avec succès');
        }}
      />

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
          // Open creation modal with pre-filled data from OCR
          setSelectedInvoice(extractedData);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
};
