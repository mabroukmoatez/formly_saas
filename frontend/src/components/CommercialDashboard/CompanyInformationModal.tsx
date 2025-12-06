import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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
import { InseeSearchInput } from './InseeSearchInput';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  iban: string;
  bic_swift: string;
  is_default: boolean;
}

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

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [savingBank, setSavingBank] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    account_name: '',
    bank_name: '',
    iban: '',
    bic_swift: '',
    is_default: false,
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

      // Load bank accounts if available (fallback to settings data)
      const existingBankAccounts = (settings as any)?.banks || [];
      setBankAccounts(existingBankAccounts);
    }
  }, [settings, isOpen, organization]);

  // Load bank accounts from API when modal opens to get fresh data
  useEffect(() => {
    if (isOpen) {
      loadBankAccounts();
    }
  }, [isOpen]);

  const loadBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const response = await commercialService.getBankAccounts();
      if (response.success && response.data) {
        setBankAccounts(response.data);
      }
    } catch (err: any) {
      console.error('Error loading bank accounts:', err);
    } finally {
      setLoadingBankAccounts(false);
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

  const handleAddBankAccount = async () => {
    try {
      setSavingBank(true);
      const bankData = {
        bank_name: bankFormData.bank_name,
        account_holder: bankFormData.account_name,
        iban: bankFormData.iban,
        bic_swift: bankFormData.bic_swift,
        is_default: bankFormData.is_default,
      };

      let response;
      if (editingBankId) {
        // Update existing bank account
        response = await commercialService.updateBankAccount(editingBankId, bankData);
      } else {
        // Create new bank account
        response = await commercialService.createBankAccount(bankData);
      }

      if (response.success) {
        success(editingBankId ? 'Compte bancaire modifié avec succès' : 'Compte bancaire ajouté avec succès');
        // Reload bank accounts from API
        await loadBankAccounts();
        // Reset form
        setShowBankForm(false);
        setEditingBankId(null);
        setBankFormData({
          account_name: '',
          bank_name: '',
          iban: '',
          bic_swift: '',
          is_default: false,
        });
      } else {
        error(response.message || 'Erreur lors de l\'enregistrement du compte bancaire');
      }
    } catch (err: any) {
      console.error('Error saving bank account:', err);
      error(err.message || 'Erreur lors de l\'enregistrement du compte bancaire');
    } finally {
      setSavingBank(false);
    }
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setBankFormData({
      account_name: account.account_holder,
      bank_name: account.bank_name,
      iban: account.iban,
      bic_swift: account.bic_swift,
      is_default: account.is_default,
    });
    setEditingBankId(account.id);
    setShowBankForm(true);
  };

  const handleDeleteBankAccount = async (id: string) => {
    try {
      const response = await commercialService.deleteBankAccount(id);
      if (response.success) {
        success('Compte bancaire supprimé avec succès');
        // Reload bank accounts from API
        await loadBankAccounts();
      } else {
        error(response.message || 'Erreur lors de la suppression du compte bancaire');
      }
    } catch (err: any) {
      console.error('Error deleting bank account:', err);
      error(err.message || 'Erreur lors de la suppression du compte bancaire');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <Card className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[18px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-[#19294a]">
            Informations de l'entreprise
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="flex flex-col gap-6 font-['Poppins',sans-serif]">
            {/* Logo Upload */}
            <div>
              <Label className="text-[14px] text-[#6a90ba]">Logo de l'entreprise</Label>
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
                      console.log('Logo file selected:', file);
                    }
                  }}
                  className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
                />
              </div>
            </div>

            {/* Company Identity */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={formData.legal_form}
                  onChange={(e) => setFormData({ ...formData, legal_form: e.target.value })}
                  placeholder="Forme juridique (SARL, SAS, etc.)"
                  className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse"
                className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  placeholder="Complément d'adresse"
                  className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="Code postal"
                  className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ville"
                  className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[17px] font-semibold text-[#19294a] mb-4">COORDONNÉES</p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Input
                    value={formData.phone_fixed}
                    onChange={(e) => setFormData({ ...formData, phone_fixed: e.target.value })}
                    placeholder="Téléphone Fixe"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                  <Input
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                    placeholder="Téléphone Mobile"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                </div>
                <div className="flex gap-4">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="Site Web"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div>
              <p className="text-[17px] font-semibold text-[#19294a] mb-4">ÉLÉMENTS JURIDIQUES</p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Input
                    type="number"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    placeholder="Capital (€)"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                  <Input
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    placeholder="SIRET"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                </div>
                <div className="flex gap-4">
                  <Input
                    value={formData.rcs}
                    onChange={(e) => setFormData({ ...formData, rcs: e.target.value })}
                    placeholder="RCS"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                  <Input
                    value={formData.naf_code}
                    onChange={(e) => setFormData({ ...formData, naf_code: e.target.value })}
                    placeholder="Code NAF"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                </div>
                <div className="flex gap-4">
                  <Input
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    placeholder="N° TVA Intracommunautaire"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                  <Input
                    value={formData.director_name}
                    onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                    placeholder="Nom du directeur"
                    className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="flex flex-col gap-4 w-full">
              <p className="text-[17px] font-semibold text-[#19294a]">COORDONNÉES BANCAIRES</p>

              {/* Loading State */}
              {loadingBankAccounts ? (
                <div className="flex items-center justify-center h-[154px] bg-[rgba(232,240,247,0.21)] border border-dashed border-[#6a90ba] rounded-[10px]">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#6a90ba] animate-spin" />
                    <p className="text-[14px] text-[#6a90ba]">Chargement des comptes bancaires...</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-start w-full">
                  {/* Existing Bank Accounts */}
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex flex-col gap-3 bg-white border border-[#007aff] rounded-[5px] p-[17.647px] w-[391px]"
                    >
                      <p className="text-[11.765px] font-semibold text-[#19294a]">
                        {account.account_holder} - {account.bank_name}
                      </p>
                      <div className="flex flex-col gap-1 text-[11.765px]">
                        <p className="text-[#6a90ba]">IBAN</p>
                        <p className="text-[#19294a]">{account.iban}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1 text-[11.765px]">
                          <p className="text-[#6a90ba]">BIC / SWIFT</p>
                          <p className="text-[#19294a]">{account.bic_swift}</p>
                        </div>
                        {account.is_default && (
                          <p className="text-[11.765px] text-[#19294a]">IBAN PAR DÉFAUT</p>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleDeleteBankAccount(account.id)}
                          className="flex items-center justify-center bg-[#e8f0f7] border border-[#6a90ba] rounded-full size-[24.859px] hover:bg-[#d0e0f0] transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-[#6a90ba]" />
                        </button>
                        <button
                          onClick={() => handleEditBankAccount(account)}
                          className="flex items-center justify-center bg-[#e8f0f7] border border-[#6a90ba] rounded-full size-[24.859px] hover:bg-[#d0e0f0] transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-[#6a90ba]" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Account Button - Show only when form is not visible */}
                  {!showBankForm && (
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setShowBankForm(true)}
                        className="bg-[rgba(232,240,247,0.21)] border border-dashed border-[#6a90ba] rounded-[10px] h-[154px] w-full flex items-center justify-center gap-4 hover:bg-[rgba(232,240,247,0.4)] transition-colors"
                      >
                        <Plus className="w-[13.292px] h-[13.292px] text-[#6a90ba]" strokeWidth={2} />
                        <p className="text-[14px] font-medium text-[#6a90ba] capitalize">Ajouter un compte</p>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Account Form - Show when adding new account */}
              {showBankForm && (
                <div className="border border-[#6a90ba] rounded-[6px] p-[19px] flex flex-col gap-6">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">
                    {editingBankId ? 'Modifier le compte bancaire' : 'Ajouter un compte bancaire'}
                  </p>

                  {/* Account Name and Bank Name */}
                  <div className="flex gap-4">
                    <Input
                      value={bankFormData.account_name}
                      onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                      placeholder="Nom du compte"
                      className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                    />
                    <Input
                      value={bankFormData.bank_name}
                      onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                      placeholder="Nom de la banque"
                      className="flex-1 bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                    />
                  </div>

                  {/* IBAN */}
                  <Input
                    value={bankFormData.iban}
                    onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })}
                    placeholder="IBAN"
                    className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />

                  {/* BIC / SWIFT */}
                  <Input
                    value={bankFormData.bic_swift}
                    onChange={(e) => setBankFormData({ ...bankFormData, bic_swift: e.target.value })}
                    placeholder="BIC / SWIFT"
                    className="bg-white border-[#ebf1ff] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] text-[14px] text-[#6a90ba] placeholder:text-[#6a90ba]"
                  />

                  {/* Default IBAN Toggle */}
                  <div className="flex items-center justify-end gap-4">
                    <p className="text-[14px] font-medium text-[#5c677e] capitalize">
                      choisir comme iban par défaut
                    </p>
                    <button
                      onClick={() => setBankFormData({ ...bankFormData, is_default: !bankFormData.is_default })}
                      className={`relative h-[19.451px] w-[37.929px] rounded-[9.725px] transition-colors ${
                        bankFormData.is_default ? 'bg-[#007aff]' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-[0.69px] size-[17.506px] bg-white rounded-full shadow-[0px_0px_2.188px_0px_inset_rgba(0,0,0,0.25)] transition-transform ${
                          bankFormData.is_default ? 'translate-x-[18.95px]' : 'translate-x-[1px]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={() => {
                        setShowBankForm(false);
                        setEditingBankId(null);
                        setBankFormData({
                          account_name: '',
                          bank_name: '',
                          iban: '',
                          bic_swift: '',
                          is_default: false,
                        });
                      }}
                      disabled={savingBank}
                      className="border border-[#6a90ba] rounded-[10px] px-4 h-[40px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-[13px] font-medium text-[#7e8ca9] capitalize">annuler</p>
                    </button>
                    <button
                      onClick={handleAddBankAccount}
                      disabled={savingBank}
                      className="bg-[#ff7700] rounded-[10px] px-4 h-[40px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingBank ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <p className="text-[13px] font-medium text-white capitalize">enregistrement...</p>
                        </>
                      ) : (
                        <p className="text-[13px] font-medium text-white capitalize">enregistrer</p>
                      )}
                    </button>
                  </div>
                </div>
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
