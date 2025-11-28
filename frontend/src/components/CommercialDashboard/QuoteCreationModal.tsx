import React, { useState, useEffect } from 'react';
import { X, Download, Search, Plus, Send, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { ArticleSearchModal } from './ArticleSearchModal';
import { ArticleCreationModal } from './ArticleCreationModal';
import { InseeSearchInput } from './InseeSearchInput';
import { Article, Quote } from '../../services/commercial.types';

interface QuoteItem {
  id: string;
  reference: string;
  designation: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

interface QuoteCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  quote?: Quote | null;
}

export const QuoteCreationModal: React.FC<QuoteCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quote,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { settings } = useOrganizationSettings();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [quoteNumber, setQuoteNumber] = useState(`D-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
  const [validUntil, setValidUntil] = useState<string>('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showArticleSearch, setShowArticleSearch] = useState(false);
  const [showArticleCreation, setShowArticleCreation] = useState(false);

  // Load quote data when editing
  useEffect(() => {
    if (isOpen && quote) {
      setQuoteNumber(quote.quote_number);
      setClientInfo({
        name: quote.client?.company_name || `${quote.client?.first_name || ''} ${quote.client?.last_name || ''}`.trim() || quote.client_name || '',
        email: quote.client?.email || quote.client_email || '',
        address: quote.client?.address || quote.client_address || '',
        phone: quote.client?.phone || quote.client_phone || '',
      });

      // Set valid_until if it exists
      if (quote.valid_until) {
        setValidUntil(quote.valid_until);
      }

      // Load items if they exist
      if (quote.items && quote.items.length > 0) {
        const processedItems = quote.items.map((item: any) => ({
          id: item.id.toString(),
          reference: '',
          designation: item.description || item.designation || '',
          quantity: item.quantity,
          unit_price: item.unit_price || parseFloat(item.price_ht || '0'),
          tax_rate: item.tax_rate || parseFloat(item.tva_rate || '0'),
          total: item.total || parseFloat(item.total_ht || '0'),
        }));
        setItems(processedItems);
      } else {
        setItems([]);
      }
    } else if (isOpen && !quote) {
      // Reset to defaults when creating new
      const fetchNextNumber = async () => {
        try {
          const { next_number } = await commercialService.getNextDocumentNumber('quote');
          setQuoteNumber(next_number);
        } catch (error) {
          console.error('Failed to fetch next quote number', error);
          // Fallback to date-based
          setQuoteNumber(`D-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
        }
      };
      fetchNextNumber();

      setClientInfo({ name: '', email: '', address: '', phone: '' });
      setValidUntil('');
      setItems([]);
    }
  }, [isOpen, quote]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!clientInfo.name || items.length === 0) {
      showError('Erreur', 'Veuillez remplir les informations du client et ajouter au moins un article');
      return;
    }

    setDownloading(true);
    try {
      let quoteId: string;

      // If editing an existing quote, save it first
      if (quote?.id) {
        const quoteData = {
          quote_number: quoteNumber,
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          client_address: clientInfo.address,
          client_phone: clientInfo.phone,
          amount: totalTTC,
          valid_until: validUntil || undefined,
          items: items.map(item => ({
            reference: item.reference,
            designation: item.designation,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
          })),
        };

        const updateResponse = await commercialService.updateQuote(String(quote.id), quoteData);
        if (!updateResponse.success) {
          showError('Erreur', 'Impossible de mettre à jour le devis');
          return;
        }
        quoteId = String(quote.id);
      } else {
        // Create new quote first, then download PDF
        const quoteData = {
          quote_number: quoteNumber,
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          client_address: clientInfo.address,
          client_phone: clientInfo.phone,
          amount: totalTTC,
          valid_until: validUntil || undefined,
          items: items.map(item => ({
            reference: item.reference,
            designation: item.designation,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
          })),
        };

        const createResponse = await commercialService.createQuote(quoteData);

        if (!createResponse.success || !createResponse.data) {
          showError('Erreur', 'Impossible de créer le devis');
          return;
        }
        // Handle both possible response structures
        const responseData = createResponse.data as any;
        quoteId = String(responseData.quote?.id || responseData.id);

        if (!quoteId) {
          showError('Erreur', 'ID de devis manquant dans la réponse');
          return;
        }
        onSave(); // Refresh list for new quotes
      }

      // Generate and download PDF
      const blob = await commercialService.generateQuotePdf(quoteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Devis-${quoteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('PDF téléchargé avec succès');
    } catch (err: any) {
      console.error('PDF download error:', err);
      showError('Erreur', err.message || 'Impossible de télécharger le PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!clientInfo.email) {
      showError('Erreur', 'Veuillez entrer l\'email du client');
      return;
    }

    if (!clientInfo.name || items.length === 0) {
      showError('Erreur', 'Veuillez remplir les informations du client et ajouter au moins un article');
      return;
    }

    setSending(true);
    try {
      let quoteId: string;

      // If editing an existing quote, save it first
      if (quote?.id) {
        const quoteData = {
          quote_number: quoteNumber,
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          client_address: clientInfo.address,
          client_phone: clientInfo.phone,
          amount: totalTTC,
          valid_until: validUntil || undefined,
          items: items.map(item => ({
            reference: item.reference,
            designation: item.designation,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
          })),
        };

        const updateResponse = await commercialService.updateQuote(String(quote.id), quoteData);
        if (!updateResponse.success) {
          showError('Erreur', 'Impossible de mettre à jour le devis');
          return;
        }
        quoteId = String(quote.id);
      } else {
        // Create new quote first, then send email
        const quoteData = {
          quote_number: quoteNumber,
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          client_address: clientInfo.address,
          client_phone: clientInfo.phone,
          amount: totalTTC,
          valid_until: validUntil || undefined,
          items: items.map(item => ({
            reference: item.reference,
            designation: item.designation,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
          })),
        };

        const createResponse = await commercialService.createQuote(quoteData);

        if (!createResponse.success || !createResponse.data) {
          showError('Erreur', 'Impossible de créer le devis');
          return;
        }
        // Handle both possible response structures
        const responseData = createResponse.data as any;
        quoteId = String(responseData.quote?.id || responseData.id);

        if (!quoteId) {
          showError('Erreur', 'ID de devis manquant dans la réponse');
          return;
        }
        onSave(); // Refresh list for new quotes
      }

      // Send email
      await commercialService.sendQuoteEmail(quoteId, { email: clientInfo.email });
      success('Email envoyé avec succès');
    } catch (err: any) {
      console.error('Email send error:', err);
      showError('Erreur', err.message || 'Impossible d\'envoyer l\'email');
    } finally {
      setSending(false);
    }
  };

  const handleSelectArticle = (article: Article) => {
    const unitPrice = article.unit_price || parseFloat(article.price_ht || '0');
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      reference: article.reference || '',
      designation: article.designation || article.name || article.description || article.reference || 'Article',
      quantity: 1,
      unit_price: unitPrice,
      tax_rate: article.tax_rate || 20,
      total: unitPrice,
    };
    setItems([...items, newItem]);
    success('Article ajouté');
  };

  const handleSelectArticles = (articles: Article[]) => {
    const newItems: QuoteItem[] = articles.map((article) => {
      const unitPrice = article.unit_price || parseFloat(article.price_ht || '0');
      return {
        id: Date.now().toString() + '-' + article.id,
        reference: article.reference || '',
        designation: article.designation || article.name || article.description || article.reference || 'Article',
        quantity: 1,
        unit_price: unitPrice,
        tax_rate: article.tax_rate || 20,
        total: unitPrice,
      };
    });
    setItems([...items, ...newItems]);
    success(`${articles.length} article(s) ajouté(s)`);
  };

  const handleAddNewArticle = () => {
    // Open article creation modal
    setShowArticleCreation(true);
  };

  const handleArticleCreated = () => {
    // Refresh articles or do nothing, the user can search for the new article
    setShowArticleCreation(false);
  };

  const calculateTotals = () => {
    const totalHT = items.reduce((sum, item) => sum + item.total, 0);
    const totalTax = items.reduce((sum, item) => sum + (item.total * item.tax_rate / 100), 0);
    const totalTTC = totalHT + totalTax;
    return { totalHT, totalTax, totalTTC };
  };

  const { totalHT, totalTax, totalTTC } = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-[90%] max-w-[1100px] h-[90vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}>
        {/* Header Actions */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              onClick={onClose}
            >
              <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-[#e8f0f7] text-[#6a90b9]'} rounded-[53px]`}
            >
              {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span className="font-medium text-xs">Télécharger En Pdf</span>
            </Button>

            <Button
              variant="ghost"
              onClick={async () => {
                if (!clientInfo.name || items.length === 0) {
                  showError('Erreur', 'Veuillez remplir les informations');
                  return;
                }
                setSaving(true);
                try {
                  const quoteData = {
                    quote_number: quoteNumber,
                    client_name: clientInfo.name,
                    client_email: clientInfo.email,
                    client_address: clientInfo.address,
                    client_phone: clientInfo.phone,
                    amount: totalTTC,
                    valid_until: validUntil || undefined,
                    items: items.map(item => ({
                      description: item.designation,
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      tax_rate: item.tax_rate,
                    })),
                  };
                  const createResponse = await commercialService.createQuote(quoteData);
                  if (createResponse.success && createResponse.data) {
                    const responseData = createResponse.data as any;
                    const quoteId = responseData.quote?.id || responseData.id;
                    if (quoteId) {
                      await commercialService.convertQuoteToInvoice(quoteId);
                      success('Devis converti en facture');
                      onSave();
                    } else {
                      showError('Erreur', 'ID de devis manquant');
                    }
                  }
                } catch (err: any) {
                  showError('Erreur', err.message || 'Impossible de convertir');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-[#e8f0f7] text-[#6a90b9]'} rounded-[53px]`}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span className="font-medium text-xs">Convertir En Facture</span>
            </Button>

            <Button
              variant="ghost"
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-[#e8f0f7] text-[#6a90b9]'} rounded-[53px]`}
              onClick={async () => {
                if (!clientInfo.name || items.length === 0) {
                  showError('Erreur', 'Veuillez remplir les informations');
                  return;
                }

                // Validate items
                for (const item of items) {
                  if (!item.designation || item.designation.trim() === '') {
                    showError('Erreur', 'Veuillez saisir la désignation pour tous les articles');
                    return;
                  }
                  if (item.quantity <= 0) {
                    showError('Erreur', 'La quantité doit être supérieure à 0');
                    return;
                  }
                  if (item.unit_price <= 0) {
                    showError('Erreur', 'Le prix unitaire doit être supérieur à 0');
                    return;
                  }
                }

                setSaving(true);
                try {
                  await commercialService.createQuote({
                    quote_number: quoteNumber,
                    client_name: clientInfo.name,
                    client_email: clientInfo.email,
                    client_address: clientInfo.address,
                    client_phone: clientInfo.phone,
                    amount: totalTTC,
                    valid_until: validUntil || undefined,
                    items: items.map(item => ({
                      description: item.designation,
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      tax_rate: item.tax_rate,
                    })),
                  });
                  success('Devis enregistré avec succès');
                  onSave();
                } catch (err: any) {
                  showError('Erreur', err.message || 'Impossible d\'enregistrer');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span className="font-medium text-xs">Enregistrer Le Document</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleSendEmail}
              disabled={sending}
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-[#e5f3ff] text-[#007aff]'} rounded-[53px]`}
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span className="font-medium text-xs">Envoyer</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-73px)] overflow-y-auto p-10">
          <div className="flex flex-col gap-[42px] max-w-[875px]">
            {/* Logo and Title Section */}
            <div className="flex items-center justify-between gap-4">
              <div className={`flex w-[219px] h-[60px] items-center justify-center rounded-[5px] bg-white ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                {organization?.organization_logo_url ? (
                  <img src={organization.organization_logo_url} alt="Logo" className="h-full object-contain" />
                ) : (
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {organization?.organization_name || 'Logo'}
                  </div>
                )}
              </div>

              <div className={`flex items-center justify-center px-3.5 py-1.5 rounded-[5px] border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {organization?.organization_name || 'Devis'}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="flex items-start justify-between gap-4">
              {/* From Company */}
              <div className={`flex-1 bg-white rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {(settings as any)?.organization_name || settings?.name || organization?.organization_name || 'Formaly'}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>
                  {(() => {
                    if (settings) {
                      const addressParts = [];
                      if ((settings as any).address) addressParts.push((settings as any).address);
                      if ((settings as any).postal_code && (settings as any).city) {
                        addressParts.push(`${(settings as any).postal_code} ${(settings as any).city}`);
                      } else if ((settings as any).city) {
                        addressParts.push((settings as any).city);
                      }
                      if ((settings as any).country && (settings as any).country !== 'France') {
                        addressParts.push((settings as any).country);
                      }
                      const address = addressParts.join('\n');

                      const infoParts = [];
                      if ((settings as any).tva_number) infoParts.push(`N° TVA: ${(settings as any).tva_number}`);
                      if (settings.siret) infoParts.push(`SIRET: ${settings.siret}`);
                      if ((settings as any).rcs) infoParts.push(`RCS: ${(settings as any).rcs}`);

                      return [address, ...infoParts].filter(Boolean).join('\n') || 'Adresse\nN° TVA\nSIRET';
                    }
                    return organization?.description || 'Adresse\nN° TVA\nSIRET';
                  })()}
                </div>
              </div>

              {/* Quote Number and Date */}
              <div className="flex flex-col gap-3">
                <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] bg-white border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                  <Input
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className={`font-semibold text-base border-0 p-0 h-auto ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                  />
                </div>
                <div className={`flex items-start gap-4 px-3 py-1 rounded-[3px] bg-white border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                  <div className={`font-normal text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('dashboard.commercial.mes_devis.issue_date')}: {new Date().toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] bg-white border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
                  <Input
                    type="date"
                    placeholder="Valide jusqu'au"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className={`text-xs border-0 p-0 ${isDark ? 'bg-transparent text-gray-300' : 'bg-transparent'}`}
                  />
                </div>
              </div>

              {/* To Company */}
              <div className={`flex-1 bg-white rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <div className="mb-3">
                  <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rechercher une entreprise (INSEE)
                  </label>
                  <InseeSearchInput
                    onSelect={(company) => {
                      setClientInfo({
                        name: company.company_name || '',
                        address: `${company.address}, ${company.postal_code} ${company.city}`,
                        email: clientInfo.email,
                        phone: clientInfo.phone,
                      });
                    }}
                  />
                </div>
                <div className="mb-3">
                  <Input
                    placeholder="Nom du client"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    className={`font-semibold text-sm border-0 p-0 ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                  />
                </div>
                <Textarea
                  placeholder="Adresse, email, téléphone..."
                  value={clientInfo.address}
                  onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                  className={`min-h-[100px] border-none ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-transparent'}`}
                />
              </div>
            </div>

            {/* Items Table */}
            <div className={`w-full bg-neutral-colorswhite rounded-[29.41px] border-0 shadow-none ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex flex-col gap-6 p-6">
                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-[29px]">
                    <div className={`font-semibold text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Référence
                    </div>
                    <div className={`font-semibold text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Désignation
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-[51px]">
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Quantité
                    </div>
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      PU Vente
                    </div>
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      TVA
                    </div>
                    <div className={`font-semibold text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Montant HT
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                  <div className={`flex items-center justify-center p-12 border-2 border-dashed rounded-[30px] ${isDark ? 'border-gray-600' : 'border-[#ebeff6]'}`}>
                    <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucun article ajouté
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex w-full items-center justify-between px-7 py-4 rounded-[30px] border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-[#ebeff6] bg-white'}`}
                      >
                        <div className="flex w-[167px] items-center justify-between">
                          <div className={`font-semibold text-xs text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {item.reference}
                          </div>
                          <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {item.designation}
                          </div>
                        </div>
                        <div className="flex w-[354px] items-center justify-center gap-[22px] pl-6 pr-0">
                          <div className={`w-[50px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.quantity}
                          </div>
                          <div className={`font-semibold text-xs text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {item.unit_price.toFixed(2)} €
                          </div>
                          <div className={`w-[71px] font-semibold text-xs text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {item.tax_rate}%
                          </div>
                          <div className={`font-semibold text-xs text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {item.total.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Item Buttons */}
                <div className="flex items-center justify-center mt-4">
                  <div className={`inline-flex flex-col items-center gap-2 px-3 py-3 bg-white rounded-[60px] border border-solid shadow-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#007aff]'}`}>
                    <div className="inline-flex items-start gap-[18px]">
                      <Button
                        variant="ghost"
                        onClick={() => setShowArticleSearch(true)}
                        className={`h-auto inline-flex items-center gap-2 px-6 py-3 rounded-[53px] ${isDark ? 'bg-orange-900/20 hover:bg-orange-900/30 text-orange-300' : 'bg-[#ffe5ca] text-[#ff7700]'}`}
                      >
                        <Search className="w-5 h-5" />
                        <span className={`font-medium text-xs ${isDark ? 'text-orange-300' : 'text-[#ff7700]'}`}>
                          Rechercher Un Article
                        </span>
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={handleAddNewArticle}
                        className={`h-auto inline-flex items-center gap-2 px-6 py-3 rounded-[53px] ${isDark ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-300' : 'bg-[#e5f3ff] text-[#007aff]'}`}
                      >
                        <Plus className="w-4 h-4" />
                        <span className={`font-medium text-xs ${isDark ? 'text-blue-300' : 'text-[#007aff]'}`}>
                          Insérer Un Nouvel Article
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="flex items-start justify-end gap-[114px]">
              <div className={`flex-1 h-[154px] rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                <Textarea
                  placeholder="Bon pour Accord"
                  className={`min-h-full border-none ${isDark ? 'bg-transparent text-gray-300' : 'bg-transparent'}`}
                />
              </div>

              <div className={`w-[278px] h-[154px] rounded-[10px] p-6`} style={{ backgroundColor: primaryColor }}>
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between pt-1 pb-3 border-b border-solid" style={{ borderColor: `${primaryColor}33` }}>
                    <div className="font-normal text-sm text-white/90">
                      Total HT
                    </div>
                    <div className="font-normal text-sm text-white/90">
                      {totalHT.toFixed(2)} €
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 pb-3 border-b border-solid" style={{ borderColor: `${primaryColor}33` }}>
                    <div className="font-normal text-sm text-white/90">
                      TVA
                    </div>
                    <div className="font-normal text-sm text-white/90">
                      {totalTax.toFixed(2)} €
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 px-0">
                    <div className="font-semibold text-lg text-white/95">
                      Total TTC
                    </div>
                    <div className="font-semibold text-lg text-white/95">
                      {totalTTC.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className={`h-[62px] w-full rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
              <Input
                placeholder="Condition de paiement..."
                className={`border-none ${isDark ? 'bg-transparent text-gray-300' : 'bg-transparent'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Article Search Modal */}
      <ArticleSearchModal
        isOpen={showArticleSearch}
        onClose={() => setShowArticleSearch(false)}
        onSelectArticle={handleSelectArticle}
        onSelectArticles={handleSelectArticles}
      />

      {/* Article Creation Modal */}
      <ArticleCreationModal
        isOpen={showArticleCreation}
        onClose={() => setShowArticleCreation(false)}
        onSave={handleArticleCreated}
      />
    </div>
  );
};

