import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { fundersService } from '../../services/Funders';

interface FunderFormData {
  type: 'individual' | 'company' | 'external';
  name: string;
  legal_name: string;
  siret: string;
  siren: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_position: string;
  contact_email: string;
  contact_phone: string;
  opco_name: string;
  agreement_number: string;
  max_funding_amount: string;
  notes: string;
  is_active: boolean;
}

interface FunderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  funderUuid?: string;
}

export const FunderFormModal: React.FC<FunderFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  funderUuid,
}) => {
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#007aff';

  const [formData, setFormData] = useState<FunderFormData>({
    type: 'external',
    name: '',
    legal_name: '',
    siret: '',
    siren: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    contact_first_name: '',
    contact_last_name: '',
    contact_position: '',
    contact_email: '',
    contact_phone: '',
    opco_name: '',
    agreement_number: '',
    max_funding_amount: '',
    notes: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (funderUuid && isOpen) {
      fetchFunder();
    } else if (!funderUuid && isOpen) {
      // Reset form for new funder creation
      setFormData({
        type: 'external',
        name: '',
        legal_name: '',
        siret: '',
        siren: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        postal_code: '',
        city: '',
        country: 'France',
        contact_first_name: '',
        contact_last_name: '',
        contact_position: '',
        contact_email: '',
        contact_phone: '',
        opco_name: '',
        agreement_number: '',
        max_funding_amount: '',
        notes: '',
        is_active: true,
      });
    }
  }, [funderUuid, isOpen]);

  const fetchFunder = async () => {
    try {
      const response = await fundersService.getFunderById(funderUuid!);
      if (response.success) {
        const funder = response.data.funder || response.data;
        setFormData({
          type: funder.type || 'external',
          name: funder.name || '',
          legal_name: funder.legal_name || '',
          siret: funder.siret || '',
          siren: funder.siren || '',
          email: funder.email || '',
          phone: funder.phone || '',
          website: funder.website || '',
          address: funder.address || '',
          postal_code: funder.postal_code || '',
          city: funder.city || '',
          country: funder.country || 'France',
          contact_first_name: funder.contact_first_name || '',
          contact_last_name: funder.contact_last_name || '',
          contact_position: funder.contact_position || '',
          contact_email: funder.contact_email || '',
          contact_phone: funder.contact_phone || '',
          opco_name: funder.opco_name || '',
          agreement_number: funder.agreement_number || '',
          max_funding_amount: funder.max_funding_amount?.toString() || '',
          notes: funder.notes || '',
          is_active: funder.is_active ?? true,
        });
      }
    } catch (error: any) {
      showError('Erreur', 'Impossible de charger les données du financeur');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du financeur est obligatoire';
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
        max_funding_amount: formData.max_funding_amount ? parseFloat(formData.max_funding_amount) : undefined,
      };

      const response = funderUuid
        ? await fundersService.updateFunder(funderUuid, payload)
        : await fundersService.createFunder(payload);

      if (response.success) {
        success('Succès', response.message || `Financeur ${funderUuid ? 'modifié' : 'créé'} avec succès`);
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || `Erreur lors de ${funderUuid ? 'la modification' : 'la création'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FunderFormData, value: any) => {
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
              {funderUuid ? 'Modifier le financeur' : 'Nouveau Financeur'}
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
            {/* Type de financeur */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de financeur</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="type"
                    value="individual"
                    checked={formData.type === 'individual'}
                    onChange={(e) => handleChange('type', e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Apprenant</div>
                    <div className="text-sm text-gray-500">Auto-financement</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="type"
                    value="company"
                    checked={formData.type === 'company'}
                    onChange={(e) => handleChange('type', e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Entreprise</div>
                    <div className="text-sm text-gray-500">Finance ses salariés</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="type"
                    value="external"
                    checked={formData.type === 'external'}
                    onChange={(e) => handleChange('type', e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Externe</div>
                    <div className="text-sm text-gray-500">OPCO, France Travail</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du financeur <span className="text-red-500">*</span>
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

                {formData.type === 'external' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom OPCO
                    </label>
                    <input
                      type="text"
                      value={formData.opco_name}
                      onChange={(e) => handleChange('opco_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ex: OPCO Atlas, OPCO EP, etc."
                    />
                  </div>
                )}

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

                {formData.type === 'external' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro d'accord
                      </label>
                      <input
                        type="text"
                        value={formData.agreement_number}
                        onChange={(e) => handleChange('agreement_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget maximum (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.max_funding_amount}
                        onChange={(e) => handleChange('max_funding_amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://"
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

            {/* Personne de contact */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Notes internes sur le financeur..."
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
                Financeur actif
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
                {isSubmitting ? 'Enregistrement...' : funderUuid ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
