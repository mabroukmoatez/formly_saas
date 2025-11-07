import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Calendar, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { apiService } from '../../services/api';
import { Charge } from '../../services/commercial.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ChargeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  charge?: Charge | null;
}

export const ChargeCreationModal: React.FC<ChargeCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  charge,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [formData, setFormData] = useState({
    expense_type: '',
    description: '',
    amount: '',
    tax: '',
    category: '',
    payment_date: '',
    vendor: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load charge data when editing
  useEffect(() => {
    if (isOpen && charge) {
      // Map API fields to form fields
      setFormData({
        expense_type: charge.label || '',
        description: '', // API doesn't have description field
        amount: charge.amount || '',
        tax: '', // API doesn't have tax field
        category: charge.category || '',
        payment_date: new Date(charge.created_at).toISOString().split('T')[0], // Use created_at as payment date
        vendor: '',
        notes: '',
      });
    } else if (isOpen && !charge) {
      // Reset to defaults when creating new
      setFormData({
        expense_type: '',
        description: '',
        amount: '',
        tax: '',
        category: '',
        payment_date: '',
        vendor: '',
        notes: '',
      });
      setSelectedFile(null);
      setFilePreview(null);
    }
  }, [isOpen, charge]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.expense_type || !formData.amount || !formData.payment_date) {
      showError('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    setSaving(true);
    setUploading(true);
    try {
      // Prepare charge data
      if (charge?.id) {
        // Update existing charge
        const chargeData: any = {
          label: formData.expense_type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.payment_date,
          description: formData.description,
        };
        
        const response = await commercialService.updateCharge(String(charge.id), chargeData);
        if (response.success) {
          success('Dépense modifiée avec succès');
        }
      } else {
        // Create new charge with document in single request
        const formDataToSend = new FormData();
        formDataToSend.append('label', formData.expense_type);
        formDataToSend.append('amount', formData.amount);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('date', formData.payment_date);
        if (formData.description) {
          formDataToSend.append('description', formData.description);
        }
        
        // Add document if selected
        if (selectedFile) {
          formDataToSend.append('documents[]', selectedFile);
        }
        
        // Single API call that creates charge and uploads document
        const response = await apiService.post('/api/organization/commercial/charges', formDataToSend);
        
        if (response.success) {
          success('Dépense créée avec succès');
        }
        
        // Reset form only for new charges
        setFormData({
          expense_type: '',
          description: '',
          amount: '',
          tax: '',
          category: '',
          payment_date: '',
          vendor: '',
          notes: '',
        });
        setSelectedFile(null);
        setFilePreview(null);
      }
      
      onSave();
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de sauvegarder la dépense');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-[95%] max-w-[1200px] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-12 rounded-[10px] flex items-center justify-center`}
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <CreditCard className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('dashboard.commercial.charges_depenses.create')}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('dashboard.commercial.charges_depenses.subtitle')}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={onClose}
          >
            <X className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-end gap-3 pb-4 border-b">
              <Button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-[10px]"
                style={{ backgroundColor: primaryColor, color: 'white' }}
                disabled={saving}
              >
                {(saving || uploading) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span className="font-medium text-sm">{t('common.save')}</span>
              </Button>
            </div>

            {/* Grid Layout - Left: Form Fields, Right: Organization Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form Fields */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Informations Dépense
                </h3>

                {/* Expense Type */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type de dépense *
                  </Label>
                  <Input
                    placeholder="Ex: Matériel de bureau"
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                    className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12`}
                    required
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catégorie *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12`}>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-gray-800' : 'bg-white'}>
                      <SelectItem value="office">{t('dashboard.commercial.charges_depenses.categories.office')}</SelectItem>
                      <SelectItem value="travel">{t('dashboard.commercial.charges_depenses.categories.travel')}</SelectItem>
                      <SelectItem value="marketing">{t('dashboard.commercial.charges_depenses.categories.marketing')}</SelectItem>
                      <SelectItem value="utilities">{t('dashboard.commercial.charges_depenses.categories.utilities')}</SelectItem>
                      <SelectItem value="salary">{t('dashboard.commercial.charges_depenses.categories.salary')}</SelectItem>
                      <SelectItem value="other">{t('dashboard.commercial.charges_depenses.categories.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description *
                  </Label>
                  <Textarea
                    placeholder="Détails de la dépense..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows={4}
                    required
                  />
                </div>

                {/* Vendor */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fournisseur
                  </Label>
                  <Input
                    placeholder="Nom du fournisseur"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12`}
                  />
                </div>

                {/* Amount and Payment Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Montant *
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12`}
                      required
                      step="0.01"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      TVA (%)
                    </Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                      className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12`}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Payment Date */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date de paiement *
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12 pr-10`}
                      required
                    />
                    <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </div>

                {/* Existing Documents (Edit Mode) */}
                {charge?.documents && charge.documents.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Documents existants
                    </Label>
                    <div className="space-y-2">
                      {charge.documents.map((doc: any) => (
                        <div 
                          key={doc.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {doc.original_name || 'Document'}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const baseURL = 'http://localhost:8000';
                              window.open(`${baseURL}/storage/${doc.file_path}`, '_blank');
                            }}
                            className={`${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Receipt Upload */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {charge?.documents && charge.documents.length > 0 ? 'Ajouter un nouveau document' : 'Reçu (facture)'}
                  </Label>
                  
                  {filePreview ? (
                    <div className="relative">
                      <div className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg overflow-hidden">
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {selectedFile && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} cursor-pointer hover:border-[#007aff] transition-colors`}>
                      <div className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload className={`w-10 h-10 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Cliquez pour télécharger un fichier
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          PDF, Images (max 10MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              showError('Erreur', 'Le fichier est trop volumineux. La taille maximale est de 10MB.');
                              return;
                            }
                            
                            setSelectedFile(file);
                            
                            // Create preview for images
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFilePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setFilePreview(null);
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Notes supplémentaires..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows={3}
                  />
                </div>
              </div>

              {/* Right Column - Organization Info */}
              <div className="lg:col-span-1">
                <div className={`p-5 rounded-[10px] ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informations Organisation
                  </h3>
                  
                  {organization && (
                    <div className="space-y-4">
                      {organization.organization_logo_url && (
                        <div className="flex justify-center mb-4">
                          <img 
                            src={organization.organization_logo_url} 
                            alt={organization.organization_name || 'Organization'}
                            className="h-16 w-auto object-contain"
                          />
                        </div>
                      )}
                      
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nom</p>
                        <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {organization.organization_name || 'Non défini'}
                        </p>
                      </div>
                      
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Adresse</p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {organization.address || 'Non définie'}
                        </p>
                      </div>
                      
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>SIRET</p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {organization.siret || 'Non défini'}
                        </p>
                      </div>
                      
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Téléphone</p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {organization.phone_number || 'Non défini'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
