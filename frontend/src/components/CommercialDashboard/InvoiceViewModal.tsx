import React, { useState } from 'react';
import { X, Download, Send, Check, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { Invoice } from '../../services/commercial.types';

interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  primaryColor: string;
  onUpdate?: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  primaryColor,
  onUpdate,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await commercialService.updateInvoice(String(invoice.id), {
        status: newStatus,
      });
      
      if (response.success) {
        success(`Statut changé en "${getStatusLabel(newStatus)}"`);
        setShowStatusMenu(false);
        if (onUpdate) onUpdate();
        onClose();
      } else {
        showError('Erreur', 'Impossible de changer le statut');
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de changer le statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      paid: 'Payé',
      overdue: 'Impayé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      sent: isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700',
      paid: isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700',
      overdue: isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700',
      cancelled: isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500',
    };
    return colors[status] || colors.draft;
  };

  const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

  const clientName = invoice.client 
    ? (invoice.client.company_name || `${invoice.client.first_name || ''} ${invoice.client.last_name || ''}`.trim() || 'Client')
    : (invoice.client_name || 'N/A');

  const clientAddress = invoice.client?.address || invoice.client_address || '';
  const clientEmail = invoice.client?.email || invoice.client_email || '';
  const clientPhone = invoice.client?.phone || invoice.client_phone || '';

  const totalHT = parseFloat(invoice.total_ht || '0');
  const totalTVA = parseFloat(invoice.total_tva || '0');
  const totalTTC = parseFloat(invoice.total_ttc || '0');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[1200px] h-[95vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              onClick={onClose}
            >
              <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
            <h2 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Détails de la Facture
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Change Button */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={updatingStatus}
                className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${getStatusColor(invoice.status)} rounded-[53px] relative`}
              >
                <Check className="w-5 h-5" />
                <span className="font-medium text-xs">{getStatusLabel(invoice.status)}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>

              {/* Status Dropdown */}
              {showStatusMenu && (
                <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden z-50`}>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={status === invoice.status}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${
                        status === invoice.status
                          ? `${isDark ? 'bg-gray-700' : 'bg-gray-100'} opacity-50 cursor-not-allowed`
                          : `${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${status === 'paid' ? 'bg-green-500' : status === 'sent' ? 'bg-blue-500' : status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'}`} />
                      {getStatusLabel(status)}
                      {status === invoice.status && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-[#e8f0f7] text-[#6a90b9]'} rounded-[53px]`}
            >
              <Download className="w-5 h-5" />
              <span className="font-medium text-xs">Télécharger En Pdf</span>
            </Button>

            <Button
              variant="ghost"
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-[#e5f3ff] text-[#007aff]'} rounded-[53px]`}
            >
              <Send className="w-5 h-5" />
              <span className="font-medium text-xs">Envoyer</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(95vh-73px)] overflow-y-auto p-10">
          <div className="flex flex-col gap-[42px] max-w-[875px] mx-auto">
            {/* Logo and Invoice Number */}
            <div className="flex items-center justify-between gap-4">
              <div className={`flex w-[219px] h-[60px] items-center justify-center rounded-[5px] ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Logo Organisation
                </span>
              </div>

              <div className={`flex flex-col gap-2 px-3.5 py-1.5 rounded-[5px] border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Facture</div>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {invoice.invoice_number}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="flex items-start justify-between gap-4">
              <div className={`flex-1 bg-white rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {invoice.client?.company_name || 'Entreprise'}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>
                  {clientAddress || 'Adresse'}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Date d'émission: {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                {invoice.due_date && (
                  <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date d'échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Info */}
            <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
              <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Informations Client
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div>Nom: {clientName}</div>
                {clientEmail && <div>Email: {clientEmail}</div>}
                {clientPhone && <div>Téléphone: {clientPhone}</div>}
                {clientAddress && <div>Adresse: {clientAddress}</div>}
              </div>
            </div>

            {/* Items Table */}
            <div className={`rounded-[5px] border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
              <div className="p-6">
                <div className={`font-semibold text-sm mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Articles
                </div>
                
                {/* Table Header */}
                <div className="flex items-center justify-between pb-2 border-b mb-4">
                  <div className="flex items-center gap-[29px]">
                    <div className={`font-semibold text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Description</div>
                  </div>
                  <div className="inline-flex items-center gap-[51px]">
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Quantité</div>
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>PU</div>
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>TVA</div>
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total HT</div>
                  </div>
                </div>

                {/* Items */}
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => {
                    const description = item.description || item.designation || '';
                    const unitPrice = item.unit_price || parseFloat(item.price_ht || '0');
                    const taxRate = item.tax_rate || parseFloat(item.tva_rate || '0');
                    const total = item.total || parseFloat(item.total_ht || '0');
                    
                    return (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {description}
                        </div>
                        <div className="inline-flex items-center gap-[51px]">
                          <div className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.quantity}</div>
                          <div className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{unitPrice.toFixed(2)} €</div>
                          <div className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{taxRate}%</div>
                          <div className={`text-sm text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {total.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucun article disponible
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center justify-between w-48 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="text-xs">Total HT:</span>
                  <span className="font-semibold">{totalHT.toFixed(2)} €</span>
                </div>
                <div className={`flex items-center justify-between w-48 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="text-xs">TVA:</span>
                  <span className="font-semibold">{totalTVA.toFixed(2)} €</span>
                </div>
                <div className={`flex items-center justify-between w-48 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span>Total TTC:</span>
                  <span style={{ color: primaryColor }}>{totalTTC.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            {invoice.payment_terms && (
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Conditions de paiement
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {invoice.payment_terms}
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Notes
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {invoice.notes}
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="flex items-start justify-between pt-8">
              <div className={`flex-1 bg-white rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Bon pour accord
                </div>
                <div className={`flex items-center gap-2 mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Check className="w-4 h-4" />
                  <span className="text-xs">Signature et cachet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

