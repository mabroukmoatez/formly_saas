import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings';
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
  const primaryColor = organization?.primary_color || '#007aff';

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
    // Bank details
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
        // Bank details
        bank_name: (settings as any)?.bank_name || '',
        bank_iban: (settings as any)?.bank_iban || '',
        bank_bic: (settings as any)?.bank_bic || '',
        bank_account_holder: (settings as any)?.bank_account_holder || '',
      });
    }
  }, [settings, isOpen, organization]);

  const handleSave = () => {
    onSave(formData);
    onClose();
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de la banque</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder="Nom de votre banque"
                  />
                </div>
                <div>
                  <Label>Titulaire du compte</Label>
                  <Input
                    value={formData.bank_account_holder}
                    onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder="Nom du titulaire"
                  />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={formData.bank_iban}
                    onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  />
                </div>
                <div>
                  <Label>BIC / SWIFT</Label>
                  <Input
                    value={formData.bank_bic}
                    onChange={(e) => setFormData({ ...formData, bank_bic: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder="BNPAFRPPXXX"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} style={{ backgroundColor: primaryColor }}>
            Enregistrer les modifications
          </Button>
        </div>
      </Card>
    </div>
  );
};

