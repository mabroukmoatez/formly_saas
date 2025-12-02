import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Search, Plus, Send, Save, Loader2, Edit, Trash2, Receipt } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/toast';
import { commercialService } from '../../services/commercial';
import { ArticleSearchModal } from '../../components/CommercialDashboard/ArticleSearchModal';
import { ArticleCreationModal } from '../../components/CommercialDashboard/ArticleCreationModal';
import { InseeSearchInput } from '../../components/CommercialDashboard/InseeSearchInput';
import { CompanyInformationModal } from '../../components/CommercialDashboard/CompanyInformationModal';
import { ClientInformationModal } from '../../components/CommercialDashboard/ClientInformationModal';
import { PaymentConditionsModal } from '../../components/CommercialDashboard/PaymentConditionsModal';
import { Article, InvoiceClient } from '../../services/commercial.types';

interface InvoiceItem {
  id: string;
  reference: string;
  designation: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

export const InvoiceCreationContent: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization, subdomain } = useOrganization();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const primaryColor = organization?.primary_color || '#007aff';

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(`FA-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
  const [invoiceTitle, setInvoiceTitle] = useState('Facture');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [paymentConditions, setPaymentConditions] = useState('');
  const [client, setClient] = useState<InvoiceClient | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showArticleSearch, setShowArticleSearch] = useState(false);
  const [showArticleCreation, setShowArticleCreation] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load company details and prefill data from OCR
  useEffect(() => {
    const loadCompanyDetails = async () => {
      try {
        const response = await commercialService.getCompanyDetails();
        if (response.success && response.data) {
          setCompanyInfo(response.data);
        }
      } catch (err) {
        console.error('Error loading company details:', err);
      }
    };
    loadCompanyDetails();

    // Prefill form with OCR data if available
    const prefillData = (location.state as any)?.prefillData;
    if (prefillData) {
      if (prefillData.invoice_number) {
        setInvoiceNumber(prefillData.invoice_number);
      }
      if (prefillData.client_name || prefillData.client_email || prefillData.client_address || prefillData.client_phone) {
        setClientInfo({
          name: prefillData.client_name || '',
          email: prefillData.client_email || '',
          address: prefillData.client_address || '',
          phone: prefillData.client_phone || '',
        });
      }
      if (prefillData.items && prefillData.items.length > 0) {
        const mappedItems: InvoiceItem[] = prefillData.items.map((item: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          reference: item.reference || '',
          designation: item.designation || item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          tax_rate: item.tax_rate || 20,
          total: item.total || (item.unit_price || 0) * (item.quantity || 1),
        }));
        setItems(mappedItems);
      }
      if (prefillData.payment_conditions) {
        setPaymentConditions(prefillData.payment_conditions);
      }
    }
  }, [location.state]);

  const calculateTotals = () => {
    const totalHT = items.reduce((sum, item) => sum + item.total, 0);
    const totalTax = items.reduce((sum, item) => sum + (item.total * item.tax_rate / 100), 0);
    const totalTTC = totalHT + totalTax;
    return { totalHT, totalTax, totalTTC };
  };

  const { totalHT, totalTax, totalTTC } = calculateTotals();

  const handleSave = async () => {
    if (!clientInfo.name || items.length === 0) {
      showError('Erreur', 'Veuillez remplir les informations du client et ajouter au moins un article');
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
      const invoiceData = {
        invoice_number: invoiceNumber,
        client_id: client?.id,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_address: clientInfo.address,
        client_phone: clientInfo.phone,
        issue_date: new Date().toISOString().split('T')[0],
        payment_conditions: paymentConditions,
        items: items.map(item => ({
          description: item.designation,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        })),
      };

      await commercialService.createInvoice(invoiceData);
      success('Facture créée avec succès');
      // Navigate back
      if (subdomain) {
        navigate(`/${subdomain}/mes-factures`);
      } else {
        navigate('/mes-factures');
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de créer la facture');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!clientInfo.name || items.length === 0) {
      showError('Erreur', 'Veuillez remplir les informations du client et ajouter au moins un article');
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

    setDownloading(true);
    try {
      // Create invoice first
      const invoiceData = {
        invoice_number: invoiceNumber,
        client_id: client?.id,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_address: clientInfo.address,
        client_phone: clientInfo.phone,
        issue_date: new Date().toISOString().split('T')[0],
        payment_conditions: paymentConditions,
        items: items.map(item => ({
          description: item.designation,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        })),
      };

      const createResponse = await commercialService.createInvoice(invoiceData);

      if (!createResponse.success || !createResponse.data) {
        showError('Erreur', 'Impossible de créer la facture');
        return;
      }

      // Handle both possible response structures
      const responseData = createResponse.data as any;
      const invoiceId = String(responseData.invoice?.id || responseData.id);

      if (!invoiceId) {
        showError('Erreur', 'ID de facture manquant dans la réponse');
        return;
      }

      // Generate and download PDF
      const blob = await commercialService.generateInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('PDF téléchargé avec succès');

      // Navigate back after successful download
      if (subdomain) {
        navigate(`/${subdomain}/mes-factures`);
      } else {
        navigate('/mes-factures');
      }
    } catch (err: any) {
      console.error('PDF download error:', err);
      showError('Erreur', err.message || 'Impossible de télécharger le PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSelectArticle = (article: Article) => {
    const unitPrice = article.unit_price || parseFloat(article.price_ht || '0');
    const newItem: InvoiceItem = {
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

  return (
    <div className="px-[27px] py-8">
      {/* Page Title Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-[#ecf1fd]'}`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Receipt className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.mes_factures.create')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Créer une nouvelle facture
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className={`flex items-center justify-between p-6 border-b mb-6 ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            onClick={() => {
              if (subdomain) {
                navigate(`/${subdomain}/mes-factures`);
              } else {
                navigate('/mes-factures');
              }
            }}
          >
            <ArrowLeft className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleDownloadPdf}
            disabled={downloading || saving}
            className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-[#e8f0f7] text-[#6a90b9]'} rounded-[53px]`}
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium text-xs">Télécharger En Pdf</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
            className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-[#e8f0f7] text-[#6a90b9]'} rounded-[53px]`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span className="font-medium text-xs">Enregistrer Le Document</span>
          </Button>

          <Button
            variant="ghost"
            disabled={sending || saving}
            className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-[#e5f3ff] text-[#007aff]'} rounded-[53px]`}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="font-medium text-xs">Envoyer</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[42px] max-w-[1100px] mx-auto">
        {/* Logo Section */}
        <div className="flex items-center justify-between gap-4">
          <div 
            className={`flex w-[219px] h-[60px] items-center justify-center rounded-[5px] border-2 border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}
          >
            {companyInfo?.logo_url || organization?.organization_logo_url ? (
              <img src={companyInfo?.logo_url || organization?.organization_logo_url} alt="Logo" className="h-full object-contain" />
            ) : (
              <div className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Logo
              </div>
            )}
          </div>

          <div className={`flex items-center justify-center px-3.5 py-1.5 rounded-[5px] border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
            <Input
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
              placeholder="Titre de la facture"
              className={`text-xs text-center border-0 p-0 h-auto ${isDark ? 'text-gray-300 bg-transparent' : 'text-gray-600 bg-transparent'}`}
            />
          </div>
        </div>

        {/* Company and Client Info */}
        <div className="flex items-start justify-between gap-4">
          {/* Company Block - Clickable */}
          <div 
            className={`flex-1 bg-white rounded-[5px] border-2 border-dashed p-6 cursor-pointer hover:border-solid transition-all relative group ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}
            onClick={() => setShowCompanyModal(true)}
          >
            <Edit className={`absolute top-2 right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {companyInfo?.company_name || organization?.organization_name || 'Mon Entreprise'}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>
              {(() => {
                // Build address line with only available information
                const addressParts = [];
                
                if (companyInfo) {
                  // Address with zip code and city if available
                  if (companyInfo.address) {
                    let addressLine = companyInfo.address;
                    if (companyInfo.zip_code || companyInfo.city) {
                      const locationParts = [];
                      if (companyInfo.zip_code) locationParts.push(companyInfo.zip_code);
                      if (companyInfo.city) locationParts.push(companyInfo.city);
                      if (locationParts.length > 0) {
                        addressLine += `, ${locationParts.join(' ')}`;
                      }
                    }
                    addressParts.push(addressLine);
                  }

                  // Add VAT number only if available
                  if (companyInfo.vat_number) {
                    addressParts.push(`N° TVA: ${companyInfo.vat_number}`);
                  }

                  // Add SIRET only if available
                  if (companyInfo.siret) {
                    addressParts.push(`SIRET: ${companyInfo.siret}`);
                  }

                  // Add email if available
                  if (companyInfo.email) {
                    addressParts.push(companyInfo.email);
                  }

                  // Add phone if available
                  if (companyInfo.phone_fixed || companyInfo.phone_mobile) {
                    addressParts.push(companyInfo.phone_fixed || companyInfo.phone_mobile);
                  }

                  return addressParts.length > 0 ? addressParts.join('\n') : 'Cliquez pour ajouter les informations';
                }
                
                // Fallback to organization description if no companyInfo
                return organization?.description || 'Adresse\nN° TVA\nSIRET';
              })()}
            </div>
          </div>

          {/* Invoice Number and Date */}
          <div className="flex flex-col gap-3">
            <div className={`flex items-start gap-2 px-3 py-1 rounded-[3px] bg-white border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={`font-semibold text-base border-0 p-0 h-auto ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
              />
            </div>
            <div className={`flex items-start gap-4 px-3 py-1 rounded-[3px] bg-white border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
              <div className={`font-normal text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('dashboard.commercial.mes_factures.issue_date')}: {new Date().toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Client Block - Clickable */}
          <div 
            className={`flex-1 bg-white rounded-[5px] border-2 border-dashed p-6 cursor-pointer hover:border-solid transition-all relative group ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}
            onClick={() => setShowClientModal(true)}
          >
            <Edit className={`absolute top-2 right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <div className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {client?.company_name || (client?.first_name && client?.last_name 
                ? `${client.first_name} ${client.last_name}` 
                : clientInfo.name || 'Informations du client')}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>
              {(() => {
                // Build client info display with only available information
                const addressParts = [];
                
                if (client) {
                  // Address with zip code and city if available
                  if (client.address) {
                    let addressLine = client.address;
                    if (client.zip_code || client.city) {
                      const locationParts = [];
                      if (client.zip_code) locationParts.push(client.zip_code);
                      if (client.city) locationParts.push(client.city);
                      if (locationParts.length > 0) {
                        addressLine += `, ${locationParts.join(' ')}`;
                      }
                    }
                    addressParts.push(addressLine);
                  }

                  // Add VAT number only if available (if client has vat_number field)
                  if ((client as any).vat_number) {
                    addressParts.push(`N° TVA: ${(client as any).vat_number}`);
                  }

                  // Add SIRET only if available
                  if (client.siret) {
                    addressParts.push(`SIRET: ${client.siret}`);
                  }

                  // Add email if available
                  if (client.email) {
                    addressParts.push(client.email);
                  }

                  // Add phone if available
                  if (client.phone) {
                    addressParts.push(client.phone);
                  }

                  return addressParts.length > 0 ? addressParts.join('\n') : 'Cliquez pour ajouter les informations';
                }
                
                // Fallback to clientInfo if client object not available
                if (clientInfo.name || clientInfo.address || clientInfo.email || clientInfo.phone) {
                  const infoParts = [];
                  if (clientInfo.address) infoParts.push(clientInfo.address);
                  if (clientInfo.email) infoParts.push(clientInfo.email);
                  if (clientInfo.phone) infoParts.push(clientInfo.phone);
                  return infoParts.length > 0 ? infoParts.join('\n') : 'Cliquez pour ajouter les informations';
                }
                
                return 'Cliquez pour ajouter les informations';
              })()}
            </div>
          </div>
        </div>

        {/* Items Table - Same as modal */}
        <div className={`w-full rounded-[29.41px] border-0 shadow-none ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col gap-6 p-6">
            {/* Table Header */}
            <div className="flex items-center justify-between px-7">
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
                {items.map((item, index) => {
                  const itemTotal = item.quantity * item.unit_price;
                  return (
                    <div
                      key={item.id}
                      className={`flex w-full items-center justify-between px-7 py-4 rounded-[30px] border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-[#ebeff6] bg-white'}`}
                    >
                      <div className="flex items-center gap-[29px]">
                        <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {item.reference || '-'}
                        </div>
                        <div className={`font-semibold text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.designation || '-'}
                        </div>
                      </div>
                      <div className="flex w-[354px] items-center justify-center gap-[22px] pl-6 pr-0">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value) || 0;
                            const updated = [...items];
                            updated[index] = { ...item, quantity: qty, total: qty * item.unit_price };
                            setItems(updated);
                          }}
                          className={`w-[50px] font-semibold border-0 p-1 text-center ${isDark ? 'text-gray-300 bg-transparent' : 'text-gray-600 bg-transparent'}`}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            const updated = [...items];
                            updated[index] = { ...item, unit_price: price, total: item.quantity * price };
                            setItems(updated);
                          }}
                          className={`w-[80px] font-semibold text-xs text-right border-0 p-1 ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          value={item.tax_rate}
                          onChange={(e) => {
                            const tax = parseFloat(e.target.value) || 0;
                            const updated = [...items];
                            updated[index] = { ...item, tax_rate: tax };
                            setItems(updated);
                          }}
                          className={`w-[71px] font-semibold text-xs text-center border-0 p-1 ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                        />
                        <div className={`font-semibold text-xs text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {itemTotal.toFixed(2)} €
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setItems(items.filter((_, i) => i !== index))}
                          className="h-6 w-6 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
                    onClick={() => setShowArticleCreation(true)}
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

        {/* Payment Terms - Clickable */}
        <div 
          className={`min-h-[120px] w-full rounded-[5px] border-2 border-dashed p-6 cursor-pointer hover:border-solid transition-all relative group ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}
          onClick={() => setShowPaymentModal(true)}
        >
          <Edit className={`absolute top-2 right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          <Textarea
            placeholder="Condition de paiement..."
            value={paymentConditions}
            readOnly
            className={`min-h-[100px] border-none cursor-pointer resize-none ${isDark ? 'bg-transparent text-gray-300' : 'bg-transparent'}`}
          />
        </div>
      </div>

      {/* Modals */}
      <CompanyInformationModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSave={(data) => {
          setCompanyInfo(data);
          setShowCompanyModal(false);
        }}
      />

      <ClientInformationModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={(clientData) => {
          setClient(clientData);
          setClientInfo({
            name: clientData.company_name || `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || '',
            email: clientData.email || '',
            address: clientData.address || '',
            phone: clientData.phone || '',
          });
          setShowClientModal(false);
        }}
      />

      <PaymentConditionsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={(schedule, text, options) => {
          setPaymentConditions(text);
          setShowPaymentModal(false);
        }}
        totalAmount={totalTTC}
      />

      <ArticleSearchModal
        isOpen={showArticleSearch}
        onClose={() => setShowArticleSearch(false)}
        onSelectArticle={handleSelectArticle}
      />

      <ArticleCreationModal
        isOpen={showArticleCreation}
        onClose={() => setShowArticleCreation(false)}
        onSave={() => setShowArticleCreation(false)}
      />
    </div>
  );
};

