import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import api from '../../services/api';

interface CompanyFormData {
  name: string;
  legal_name: string;
  siret: string;
  siren: string;
  vat_number: string;
  ape_code: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  legal_form: string;
  capital: string;
  registration_number: string;
  registration_city: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_position: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  employee_count: string;
  industry: string;
  is_active: boolean;
}

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  companyUuid?: string;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companyUuid,
}) => {
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#007aff';

  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    legal_name: '',
    siret: '',
    siren: '',
    vat_number: '',
    ape_code: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    legal_form: '',
    capital: '',
    registration_number: '',
    registration_city: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_position: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
    employee_count: '',
    industry: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companyUuid && isOpen) {
      fetchCompany();
    } else if (!companyUuid && isOpen) {
      // Reset form for new company creation
      setFormData({
        name: '',
        legal_name: '',
        siret: '',
        siren: '',
        vat_number: '',
        ape_code: '',
        email: '',
        phone: '',
        mobile: '',
        website: '',
        address: '',
        postal_code: '',
        city: '',
        country: 'France',
        legal_form: '',
        capital: '',
        registration_number: '',
        registration_city: '',
        contact_first_name: '',
        contact_last_name: '',
        contact_position: '',
        contact_email: '',
        contact_phone: '',
        notes: '',
        employee_count: '',
        industry: '',
        is_active: true,
      });
    }
  }, [companyUuid, isOpen]);

  const fetchCompany = async () => {
    try {
      const response = await api.get(`/api/organization/companies/${companyUuid}`);
      if (response.success) {
        const company = response.data.company || response.data;
        setFormData({
          name: company.name || '',
          legal_name: company.legal_name || '',
          siret: company.siret || '',
          siren: company.siren || '',
          vat_number: company.vat_number || '',
          ape_code: company.ape_code || '',
          email: company.email || '',
          phone: company.phone || '',
          mobile: company.mobile || '',
          website: company.website || '',
          address: company.address || '',
          postal_code: company.postal_code || '',
          city: company.city || '',
          country: company.country || 'France',
          legal_form: company.legal_form || '',
          capital: company.capital || '',
          registration_number: company.registration_number || '',
          registration_city: company.registration_city || '',
          contact_first_name: company.contact_first_name || '',
          contact_last_name: company.contact_last_name || '',
          contact_position: company.contact_position || '',
          contact_email: company.contact_email || '',
          contact_phone: company.contact_phone || '',
          notes: company.notes || '',
          employee_count: company.employee_count?.toString() || '',
          industry: company.industry || '',
          is_active: company.is_active ?? true,
        });
      }
    } catch (error: any) {
      console.error('Error fetching company:', error);
      showError('Erreur', 'Impossible de charger les données de l\'entreprise');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'entreprise est obligatoire';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email invalide';
    }
    if (formData.siret && formData.siret.length !== 14) {
      newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
    }
    if (formData.siren && formData.siren.length !== 9) {
      newErrors.siren = 'Le SIREN doit contenir 9 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        capital: formData.capital || null,
      };

      const response = companyUuid
        ? await api.post(`/api/organization/companies/${companyUuid}`, payload)
        : await api.post('/api/organization/companies', payload);

      if (response.success) {
        success('Succès', response.message || `Entreprise ${companyUuid ? 'modifiée' : 'créée'} avec succès`);
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Error:', error);
      showError('Erreur', error.message || `Erreur lors de ${companyUuid ? 'la modification' : 'la création'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CompanyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {companyUuid ? 'Modifier l\'entreprise' : 'Nouvelle Entreprise'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison sociale
                  </label>
                  <input
                    type="text"
                    value={formData.legal_name}
                    onChange={(e) => handleChange('legal_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={formData.siret}
                    onChange={(e) => handleChange('siret', e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.siret ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678901234"
                  />
                  {errors.siret && <p className="mt-1 text-sm text-red-500">{errors.siret}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIREN</label>
                  <input
                    type="text"
                    maxLength={9}
                    value={formData.siren}
                    onChange={(e) => handleChange('siren', e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.siren ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123456789"
                  />
                  {errors.siren && <p className="mt-1 text-sm text-red-500">{errors.siren}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
                  <select
                    value={formData.legal_form}
                    onChange={(e) => handleChange('legal_form', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Sélectionner</option>
                    <option value="SARL">SARL</option>
                    <option value="SAS">SAS</option>
                    <option value="SA">SA</option>
                    <option value="EURL">EURL</option>
                    <option value="SNC">SNC</option>
                    <option value="Association">Association</option>
                    <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personne de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.contact_first_name}
                    onChange={(e) => handleChange('contact_first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.contact_last_name}
                    onChange={(e) => handleChange('contact_last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fonction</label>
                  <input
                    type="text"
                    value={formData.contact_position}
                    onChange={(e) => handleChange('contact_position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.contact_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contact_email && <p className="mt-1 text-sm text-red-500">{errors.contact_email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note interne</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Notes internes sur l'entreprise..."
              />
            </div>

            {/* Statut */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Entreprise active
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? 'Enregistrement...' : companyUuid ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
