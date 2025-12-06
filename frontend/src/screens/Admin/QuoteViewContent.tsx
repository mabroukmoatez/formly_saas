import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Search, Plus, Send, Save, Loader2, Edit, Trash2, Receipt, Check, ChevronDown } from 'lucide-react';
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
import { EmailModal, EmailData } from '../../components/CommercialDashboard/EmailModal';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { Article, InvoiceClient, Quote } from '../../services/commercial.types';

interface QuoteItem {
  id: string;
  reference: string;
  designation: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

export const QuoteViewContent: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization, subdomain } = useOrganization();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const primaryColor = organization?.primary_color || '#007aff';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentSchedule, setPaymentSchedule] = useState<any[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<any>({});
  const [client, setClient] = useState<InvoiceClient | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  // Status modification button removed per user request
  const [converting, setConverting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showArticleSearch, setShowArticleSearch] = useState(false);
  const [showArticleCreation, setShowArticleCreation] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load invoice and company details
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load company details
        const companyResponse = await commercialService.getCompanyDetails();
        if (companyResponse.success && companyResponse.data) {
          setCompanyInfo(companyResponse.data);
        }

        // Load quote if id is provided
        if (id) {
          const quoteResponse = await commercialService.getQuoteById(id);
          if (quoteResponse.success && quoteResponse.data) {
            const quoteData = quoteResponse.data as any;
            setCurrentQuote(quoteData);
            
            // Populate form with quote data
            setQuoteNumber(quoteData.quote_number || '');
            setValidUntil(quoteData.valid_until || '');
            setPaymentTerms(quoteData.payment_schedule_text || quoteData.payment_conditions || '');
            
            // Set client info
            if (quoteData.client) {
              setClient(quoteData.client);
              setClientInfo({
                name: quoteData.client.company_name || `${quoteData.client.first_name || ''} ${quoteData.client.last_name || ''}`.trim() || '',
                email: quoteData.client.email || '',
                address: quoteData.client.address || '',
                phone: quoteData.client.phone || '',
              });
            } else {
              setClientInfo({
                name: quoteData.client_name || '',
                email: quoteData.client_email || '',
                address: quoteData.client_address || '',
                phone: quoteData.client_phone || '',
              });
            }
            
            // Set items
            if (quoteData.items && quoteData.items.length > 0) {
              const processedItems: QuoteItem[] = quoteData.items.map((item: any) => {
                const quantity = parseFloat(item.quantity || 1);
                const unit_price = parseFloat(item.unit_price || item.price_ht || 0);
                // Calculate total from quantity and unit price, not from database
                const total = quantity * unit_price;

                return {
                  id: item.id?.toString() || Date.now().toString(),
                  reference: item.reference || '',
                  designation: item.description || item.designation || '',
                  quantity: quantity,
                  unit_price: unit_price,
                  tax_rate: parseFloat(item.tax_rate || item.tva_rate || 0),
                  total: total,
                };
              });
              setItems(processedItems);
            }

            // Load payment schedule if available
            try {
              const scheduleResponse = await commercialService.getQuotePaymentSchedule(id);
              if (scheduleResponse.success && scheduleResponse.data) {
                if (scheduleResponse.data.payment_schedule && scheduleResponse.data.payment_schedule.length > 0) {
                  setPaymentSchedule(scheduleResponse.data.payment_schedule);
                }
                // Update payment text if available from schedule
                if (scheduleResponse.data.payment_text) {
                  setPaymentTerms(scheduleResponse.data.payment_text);
                }
              }
            } catch (scheduleErr) {
              console.log('No payment schedule found or error loading it:', scheduleErr);
              // Non-critical error, continue without schedules
            }
          } else {
            showError('Erreur', 'Impossible de charger le devis');
            if (subdomain) {
              navigate(`/${subdomain}/mes-devis`);
            } else {
              navigate('/mes-devis');
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        showError('Erreur', 'Impossible de charger les données');
        if (subdomain) {
          navigate(`/${subdomain}/mes-devis`);
        } else {
          navigate('/mes-devis');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate, showError, subdomain]);

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      sent: isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700',
      accepted: isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700',
      rejected: isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700',
      expired: isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700',
      cancelled: isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500',
    };
    return colors[status] || colors.draft;
  };

  // Status list limited to: Créé (draft), Envoyé (sent), Signé (accepted) only
  // Status modification removed - status now changes through specific actions only (send email, upload signed document, etc.)

  // Handle direct logo file selection (no modal)
  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setCompanyInfo((prev: any) => ({
            ...prev,
            logo_url: reader.result as string
          }));
        };
        reader.readAsDataURL(file);

        success('Logo sélectionné avec succès');
      } catch (err: any) {
        showError('Erreur', 'Erreur lors du chargement du logo');
      }
    };
    input.click();
  };

  const calculateTotals = () => {
    const totalHT = items.reduce((sum, item) => sum + item.total, 0);
    const totalTax = items.reduce((sum, item) => sum + (item.total * item.tax_rate / 100), 0);
    const totalTTC = totalHT + totalTax;
    return { totalHT, totalTax, totalTTC };
  };

  const { totalHT, totalTax, totalTTC } = calculateTotals();

  const handleSave = async () => {
    if (!id) {
      showError('Erreur', 'ID de devis manquant');
      return;
    }

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
      const quoteData = {
        quote_number: quoteNumber || currentQuote?.quote_number,
        client_id: client?.id || currentQuote?.client_id,
        client_name: clientInfo.name,
        client_email: clientInfo.email || currentQuote?.client_email || currentQuote?.client?.email,
        client_address: clientInfo.address || currentQuote?.client_address || currentQuote?.client?.address,
        client_phone: clientInfo.phone || currentQuote?.client_phone || currentQuote?.client?.phone,
        issue_date: currentQuote?.issue_date ? new Date(currentQuote.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        valid_until: validUntil || currentQuote?.valid_until,
        payment_conditions: paymentTerms || currentQuote?.payment_conditions,
        status: currentQuote?.status || 'draft',
        items: items.map(item => ({
          id: item.id,
          description: item.designation,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        })),
      };

      await commercialService.updateQuote(id, quoteData);
      success('Devis modifié avec succès');
      // Navigate back
      if (subdomain) {
        navigate(`/${subdomain}/mes-devis`);
      } else {
        navigate('/mes-devis');
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de modifier le devis');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!id) {
      showError('Erreur', 'ID de devis manquant');
      return;
    }

    setDownloading(true);
    try {
      const blob = await commercialService.generateQuotePdf(id);
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

  const handleSendEmail = () => {
    if (!id) {
      showError('Erreur', 'ID de devis manquant');
      return;
    }
    setShowEmailModal(true);
  };

  const handleSendEmailConfirm = async (emailData: EmailData) => {
    if (!id) {
      showError('Erreur', 'ID de devis manquant');
      return;
    }

    setSending(true);
    try {
      await commercialService.sendQuoteEmail(id, emailData);
      success('Email envoyé avec succès');
    } catch (err: any) {
      console.error('Email send error:', err);
      showError('Erreur', err.message || 'Impossible d\'envoyer l\'email');
      throw err; // Re-throw to let modal handle it
    } finally {
      setSending(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!id) {
      showError('Erreur', 'ID de devis manquant');
      return;
    }

    setDeleting(true);
    try {
      await commercialService.deleteQuote(id);
      success('Devis supprimé avec succès');
      if (subdomain) {
        navigate(`/${subdomain}/mes-devis`);
      } else {
        navigate('/mes-devis');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      showError('Erreur', err.message || 'Impossible de supprimer le devis');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!id) {
      showError('Erreur', 'ID de devis manquant');
      return;
    }

    setConverting(true);
    try {
      const response = await commercialService.convertQuoteToInvoice(id);
      if (response.success) {
        success('Devis converti en facture avec succès');
        // Navigate to the new invoice
        const invoiceData = response.data as any;
        const invoiceId = invoiceData.invoice?.id || invoiceData.id;
        if (invoiceId) {
          if (subdomain) {
            navigate(`/${subdomain}/invoice-view/${invoiceId}`);
          } else {
            navigate(`/invoice-view/${invoiceId}`);
          }
        } else {
          // Just go back to quotes list if no invoice ID
          if (subdomain) {
            navigate(`/${subdomain}/mes-devis`);
          } else {
            navigate('/mes-devis');
          }
        }
      } else {
        showError('Erreur', response.message || 'Impossible de convertir le devis');
      }
    } catch (err: any) {
      console.error('Convert to invoice error:', err);
      showError('Erreur', err.message || 'Impossible de convertir en facture');
    } finally {
      setConverting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

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
              {currentQuote ? `Devis ${quoteNumber}` : 'Détails du Devis'}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {currentQuote ? 'Visualiser et modifier le devis' : 'Gérer les informations du devis'}
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
                navigate(`/${subdomain}/mes-devis`);
              } else {
                navigate('/mes-devis');
              }
            }}
          >
            <ArrowLeft className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting || saving}
            className={`h-auto inline-flex items-center justify-center w-10 h-10 p-0 ${isDark ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'} rounded-full`}
            title="Supprimer le devis"
          >
            {deleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </Button>

          {/* Status Display (read-only) */}
          {currentQuote && (
            <div className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${getStatusColor(currentQuote.status)} rounded-[53px] pointer-events-none`}>
              <Check className="w-5 h-5" />
              <span className="font-medium text-xs">{getStatusLabel(currentQuote.status)}</span>
            </div>
          )}

          {/* Convert to Invoice Button - Visible if quote is sent/accepted OR if it needs reconversion */}
          {currentQuote && (
            currentQuote.status === 'sent' ||
            currentQuote.status === 'accepted' ||
            currentQuote.status === 'draft' // Allow conversion from draft if previously converted and modified
          ) && (
            <Button
              variant="ghost"
              onClick={handleConvertToInvoice}
              disabled={converting || saving}
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-700'} rounded-[53px]`}
            >
              {converting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              <span className="font-medium text-xs">Convertir en Facture</span>
            </Button>
          )}

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
            onClick={handleSendEmail}
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

      {/* Content - Same as InvoiceCreationContent */}
      <div className="flex flex-col gap-[42px] max-w-[1100px] mx-auto">
        {/* Logo Section */}
        <div className="flex items-center justify-between gap-4">
          <div
            className={`flex w-[219px] h-[60px] items-center justify-center rounded-[5px] border-2 border-dashed cursor-pointer hover:border-solid transition-all ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}
            onClick={handleLogoUpload}
          >
            {companyInfo?.logo_url || organization?.organization_logo_url ? (
              <img src={companyInfo?.logo_url || organization?.organization_logo_url} alt="Logo" className="h-full object-contain" />
            ) : (
              <div className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Cliquez pour choisir une image
              </div>
            )}
          </div>

          <div className={`flex items-center justify-center px-3.5 py-1.5 rounded-[5px] border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {organization?.organization_name || 'Devis'}
            </div>
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

          {/* Quote Number, Date and Valid Until */}
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
                Date d'émission: {currentQuote?.issue_date ? new Date(currentQuote.issue_date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className={`flex items-start gap-4 px-3 py-1 rounded-[3px] bg-white border border-dashed ${isDark ? 'bg-gray-800 border-gray-600' : 'border-[#6a90b9]'}`}>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                placeholder="Valable jusqu'au..."
                className={`font-normal text-xs border-0 p-0 h-auto ${isDark ? 'text-gray-300 bg-transparent' : 'text-gray-700 bg-transparent'}`}
              />
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

        {/* Items Table */}
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
            value={paymentTerms}
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
        existingClient={client}
      />

      <PaymentConditionsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={async (schedule, text, options) => {
          setPaymentTerms(text);
          setPaymentSchedule(schedule);
          setPaymentOptions(options);
          
          // Save payment schedule to backend if quote exists
          if (id) {
            try {
              const scheduleData = {
                payment_schedule: schedule,
                show_amounts: options.showAmounts,
                show_percentages: options.showPercentages,
                show_dates: options.showDates,
                show_conditions: options.showConditions,
              };
              
              const response = await commercialService.createQuotePaymentSchedule(id, scheduleData);
              if (response.success) {
                success('Conditions de paiement enregistrées');
                // Update payment text from backend response if available
                if (response.data?.payment_text) {
                  setPaymentTerms(response.data.payment_text);
                }
              } else {
                showError('Erreur', response.message || 'Impossible de sauvegarder les conditions de paiement');
              }
            } catch (err: any) {
              console.error('Error saving payment schedule:', err);
              showError('Erreur', err.message || 'Impossible de sauvegarder les conditions de paiement');
            }
          }
          
          setShowPaymentModal(false);
        }}
        totalAmount={totalTTC}
        existingPaymentTerms={paymentTerms}
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

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleSendEmailConfirm}
        documentType="quote"
        documentNumber={quoteNumber}
        clientEmail={clientInfo.email || client?.email || ''}
        clientName={clientInfo.name || client?.company_name || (client?.first_name && client?.last_name ? `${client.first_name} ${client.last_name}` : '') || ''}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Voulez-vous vraiment supprimer ce devis ?"
        message="Cette action est irréversible. Le devis sera définitivement supprimé."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};
