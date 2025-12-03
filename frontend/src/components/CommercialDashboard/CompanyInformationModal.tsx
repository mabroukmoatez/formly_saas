import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { fixImageUrl } from '../../lib/utils';

interface CompanyInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const CompanyInformationModal: React.FC<CompanyInformationModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { settings } = useOrganizationSettings();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [saving, setSaving] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    company_name: organization?.organization_name || '',
    legal_name: '',
    address: '',
    address_complement: '',
    zip_code: '',
    city: '',
    country: 'France',
    phone_fixed: '',
    phone_mobile: '',
    email: '',
    website: '',
    fax: '',
    vat_number: '',
    siret: '',
    siren: '',
    rcs: '',
    naf_code: '',
    capital: '',
    legal_form: '',
    director_name: '',
  });

  // Separate state for bank details form
  const [bankFormData, setBankFormData] = useState({
    bank_name: '',
    bank_iban: '',
    bank_bic: '',
    bank_account_holder: '',
  });

  // Load settings data when modal opens and settings are available
  useEffect(() => {
    if (settings && isOpen) {
      setFormData({
        company_name: (settings as any)?.organization_name || settings?.name || organization?.organization_name || '',
        legal_name: (settings as any)?.legal_name || '',
        address: (settings as any)?.address || settings?.address || '',
        address_complement: (settings as any)?.address_complement || '',
        zip_code: (settings as any)?.postal_code || (settings as any)?.zip_code || settings?.postal_code || '',
        city: (settings as any)?.city || settings?.city || '',
        country: (settings as any)?.country || settings?.country || 'France',
        phone_fixed: (settings as any)?.phone_fixed || (settings as any)?.phone || settings?.phone || '',
        phone_mobile: (settings as any)?.phone_mobile || '',
        email: (settings as any)?.email || settings?.email || (settings as any)?.organization_email || '',
        website: (settings as any)?.website || settings?.website || '',
        fax: (settings as any)?.fax || settings?.fax || '',
        vat_number: (settings as any)?.tva_number || (settings as any)?.vat_number || '',
        siret: (settings as any)?.siret || settings?.siret || '',
        siren: (settings as any)?.siren || '',
        rcs: (settings as any)?.rcs || '',
        naf_code: (settings as any)?.naf_code || '',
        capital: (settings as any)?.capital || '',
        legal_form: (settings as any)?.legal_form || '',
        director_name: (settings as any)?.director_name || settings?.director_name || '',
      });

      // Load bank accounts
      if ((settings as any)?.banks) {
        setBankAccounts((settings as any).banks);
      }
    }
  }, [settings, isOpen, organization]);

  const handleAddBank = () => {
    setBankFormData({
      bank_name: '',
      bank_iban: '',
      bank_bic: '',
      bank_account_holder: '',
    });
    setEditingBankId(null);
    setShowBankForm(true);
  };

  const handleEditBank = (bank: any) => {
    setBankFormData({
      bank_name: bank.bank_name,
      bank_iban: bank.iban,
      bank_bic: bank.bic_swift,
      bank_account_holder: bank.account_holder,
    });
    setEditingBankId(bank.id);
    setShowBankForm(true);
  };

  const handleCancelBankForm = () => {
    setShowBankForm(false);
    setEditingBankId(null);
    setBankFormData({
      bank_name: '',
      bank_iban: '',
      bank_bic: '',
      bank_account_holder: '',
    });
  };

  const handleSaveBankForm = async () => {
    // Validate that all fields are filled
    if (!bankFormData.bank_name || !bankFormData.bank_iban ||
        !bankFormData.bank_bic || !bankFormData.bank_account_holder) {
      error('Veuillez remplir tous les champs bancaires');
      return;
    }

    try {
      setSaving(true);
      const response = await commercialService.updateCompanyDetails(bankFormData);

      if (response.success) {
        success(editingBankId ? 'Coordonnées bancaires modifiées' : 'Coordonnées bancaires ajoutées');

        // Reload the company details to get the updated bank accounts
        const detailsResponse = await commercialService.getCompanyDetails();
        if (detailsResponse.success && (detailsResponse.data as any)?.banks) {
          setBankAccounts((detailsResponse.data as any).banks);
        }

        handleCancelBankForm();
      } else {
        error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err: any) {
      console.error('Error saving bank details:', err);
      error(err.message || 'Erreur lors de l\'enregistrement des coordonnées bancaires');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await commercialService.updateCompanyDetails(formData);

      if (response.success) {
        success('Informations de l\'entreprise enregistrées avec succès');
        onSave(formData);
        onClose();
      } else {
        error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err: any) {
      console.error('Error saving company details:', err);
      error(err.message || 'Erreur lors de l\'enregistrement des informations');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Informations de l'entreprise
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label>Logo de l'entreprise</Label>
              <div className="mt-2">
                {organization?.organization_logo_url && (
                  <img src={fixImageUrl(organization.organization_logo_url)} alt="Logo" className="h-20 mb-2" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle file upload here
                      console.log('Logo file selected:', file);
                      // TODO: Implement actual upload logic
                    }
                  }}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
            </div>

            {/* Company Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom de l'entreprise</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
              <div>
                <Label>Forme juridique</Label>
                <Input
                  value={formData.legal_form}
                  onChange={(e) => setFormData({ ...formData, legal_form: e.target.value })}
                  placeholder="SARL, SAS, etc."
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`mt-2 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                  <Label>Complément d'adresse</Label>
                <Input
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
              <div>
                <Label>Code postal</Label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">COORDONNÉES</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone Fixe</Label>
                  <Input
                    value={formData.phone_fixed}
                    onChange={(e) => setFormData({ ...formData, phone_fixed: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>Téléphone Mobile</Label>
                  <Input
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>Site Web</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">ÉLÉMENTS JURIDIQUES</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capital (€)</Label>
                  <Input
                    type="number"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>SIRET</Label>
                  <Input
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>RCS</Label>
                  <Input
                    value={formData.rcs}
                    onChange={(e) => setFormData({ ...formData, rcs: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>NAF</Label>
                  <Input
                    value={formData.naf_code}
                    onChange={(e) => setFormData({ ...formData, naf_code: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>N° TVA Intracommunautaire</Label>
                  <Input
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <Label>Nom du directeur</Label>
                  <Input
                    value={formData.director_name}
                    onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">COORDONNÉES BANCAIRES</Label>

              {/* Existing bank accounts */}
              {bankAccounts.length > 0 && (
                <div className="space-y-3 mb-4">
                  {bankAccounts.map((bank) => (
                    <div
                      key={bank.id}
                      className={`relative border-2 rounded-lg p-4 ${isDark ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-500'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {bank.account_holder} - {bank.bank_name}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBank(bank)}
                            className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 mb-1">IBAN</p>
                          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{bank.iban}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">BIC / SWIFT</p>
                          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{bank.bic_swift}</p>
                        </div>
                      </div>
                      {bank.is_default && (
                        <div className="absolute top-4 right-16">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">PAR DÉFAUT</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add bank form or Add button */}
              {showBankForm ? (
                <div className={`border-2 rounded-lg p-4 ${isDark ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-500'}`}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Nom de la banque</Label>
                      <Input
                        value={bankFormData.bank_name}
                        onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                        placeholder="Nom de votre banque"
                      />
                    </div>
                    <div>
                      <Label>Titulaire du compte</Label>
                      <Input
                        value={bankFormData.bank_account_holder}
                        onChange={(e) => setBankFormData({ ...bankFormData, bank_account_holder: e.target.value })}
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                        placeholder="Nom du titulaire"
                      />
                    </div>
                    <div>
                      <Label>IBAN</Label>
                      <Input
                        value={bankFormData.bank_iban}
                        onChange={(e) => setBankFormData({ ...bankFormData, bank_iban: e.target.value })}
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                      />
                    </div>
                    <div>
                      <Label>BIC / SWIFT</Label>
                      <Input
                        value={bankFormData.bank_bic}
                        onChange={(e) => setBankFormData({ ...bankFormData, bank_bic: e.target.value })}
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                        placeholder="BNPAFRPPXXX"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelBankForm}
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveBankForm}
                      disabled={saving}
                      style={{ backgroundColor: primaryColor }}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        editingBankId ? 'Modifier' : 'Ajouter'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAddBank}
                  className={`w-full border-2 border-dashed rounded-lg p-6 flex items-center justify-center gap-3 transition-colors ${
                    isDark
                      ? 'border-gray-600 bg-gray-800/30 hover:bg-gray-800/50 text-gray-400 hover:text-gray-300'
                      : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50/50 text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Ajouter un compte</span>
                </button>
              )}
            </div>
          </div>
        </CardContent>

        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: primaryColor }}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

