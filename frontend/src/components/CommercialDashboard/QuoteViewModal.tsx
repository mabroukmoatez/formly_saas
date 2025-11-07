import React, { useState } from 'react';
import { X, Download, Send, FileText, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { Quote } from '../../services/commercial.types';

interface QuoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  primaryColor: string;
  onUpdate?: () => void;
}

export const QuoteViewModal: React.FC<QuoteViewModalProps> = ({
  isOpen,
  onClose,
  quote,
  primaryColor,
  onUpdate,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [converting, setConverting] = useState(false);

  if (!isOpen || !quote) return null;

  const handleConvertToInvoice = async () => {
    setConverting(true);
    try {
      const response = await commercialService.convertQuoteToInvoice(String(quote.id));
      
      if (response.success) {
        success('Devis converti en facture avec succès');
        if (onUpdate) onUpdate();
        onClose();
      } else {
        showError('Erreur', 'Impossible de convertir le devis');
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de convertir le devis en facture');
    } finally {
      setConverting(false);
    }
  };

  const clientName = quote.client 
    ? (quote.client.company_name || `${quote.client.first_name || ''} ${quote.client.last_name || ''}`.trim() || 'Client')
    : (quote.client_name || 'N/A');

  const clientAddress = quote.client?.address || quote.client_address || '';
  const clientEmail = quote.client?.email || quote.client_email || '';
  const clientPhone = quote.client?.phone || quote.client_phone || '';

  const totalHT = parseFloat(quote.total_ht || '0');
  const totalTVA = parseFloat(quote.total_tva || '0');
  const totalTTC = parseFloat(quote.total_ttc || '0');

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
              Détails du Devis
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Convert to Invoice Button */}
            {quote.status !== 'accepted' ? (
              <Button
                variant="ghost"
                onClick={handleConvertToInvoice}
                disabled={converting}
                className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-green-900 hover:bg-green-800 text-green-300' : 'bg-[#e5ffe5] hover:bg-[#d0ffd0] text-[#00aa00]'} rounded-[53px]`}
              >
                {converting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span className="font-medium text-xs">
                  {converting ? 'Conversion...' : 'Convertir en Facture'}
                </span>
              </Button>
            ) : null}

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
            {/* Logo and Quote Number */}
            <div className="flex items-center justify-between gap-4">
              <div className={`flex w-[219px] h-[60px] items-center justify-center rounded-[5px] ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Logo Organisation
                </span>
              </div>

              <div className={`flex flex-col gap-2 px-3.5 py-1.5 rounded-[5px] border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Devis</div>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quote.quote_number}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="flex items-start justify-between gap-4">
              <div className={`flex-1 bg-white rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {quote.client?.company_name || 'Entreprise'}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>
                  {clientAddress || 'Adresse'}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Date d'émission: {new Date(quote.issue_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                {quote.valid_until && (
                  <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Valide jusqu'au: {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
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
                {quote.items && quote.items.length > 0 ? (
                  quote.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.description}
                      </div>
                      <div className="inline-flex items-center gap-[51px]">
                        <div className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.quantity}</div>
                        <div className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.unit_price.toFixed(2)} €</div>
                        <div className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.tax_rate || 0}%</div>
                        <div className={`text-sm text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.total.toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  ))
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
            {quote.payment_terms && (
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Conditions de paiement
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {quote.payment_terms}
                </div>
              </div>
            )}

            {/* Notes */}
            {quote.notes && (
              <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Notes
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {quote.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

