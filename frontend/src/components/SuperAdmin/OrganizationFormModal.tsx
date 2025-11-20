import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService, Organization, Plan } from '../../services/superAdmin';

interface OrganizationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId?: number;
}

export const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    organization_name: '',
    company_name: '',
    email: '',
    phone: '',
    siret: '',
    siren: '',
    address: '',
    city: '',
    zip_code: '',
    country: 'France',
    plan_id: '',
    user_id: '',
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      if (organizationId) {
        fetchOrganization();
      } else {
        resetForm();
      }
    }
  }, [isOpen, organizationId]);

  const fetchPlans = async () => {
    try {
      const response = await superAdminService.getPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchOrganization = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const response = await superAdminService.getOrganization(organizationId);
      if (response.success) {
        const org = response.data;
        setFormData({
          organization_name: org.organization_name || '',
          company_name: org.company_name || '',
          email: org.email || '',
          phone: org.phone || '',
          siret: org.siret || '',
          siren: org.siren || '',
          address: '',
          city: '',
          zip_code: '',
          country: 'France',
          plan_id: org.super_admin_plan?.id?.toString() || '',
          user_id: '',
        });
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organization_name: '',
      company_name: '',
      email: '',
      phone: '',
      siret: '',
      siren: '',
      address: '',
      city: '',
      zip_code: '',
      country: 'France',
      plan_id: '',
      user_id: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Le nom de l\'organisation est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
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
      const payload: any = {
        organization_name: formData.organization_name.trim(),
        company_name: formData.company_name.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        siret: formData.siret.trim() || undefined,
        siren: formData.siren.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        zip_code: formData.zip_code.trim() || undefined,
        country: formData.country || undefined,
      };

      if (formData.plan_id) {
        payload.plan_id = parseInt(formData.plan_id);
      }
      if (formData.user_id) {
        payload.user_id = parseInt(formData.user_id);
      }

      const response = organizationId
        ? await superAdminService.updateOrganization(organizationId, payload)
        : await superAdminService.createOrganization(payload);

      if (response.success) {
        success('Succès', organizationId ? 'Organisation mise à jour avec succès' : 'Organisation créée avec succès');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || (organizationId ? 'Impossible de mettre à jour l\'organisation' : 'Impossible de créer l\'organisation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {organizationId ? 'Modifier l\'organisation' : 'Créer une organisation'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organization_name" className={isDark ? 'text-gray-300' : ''}>
                Nom de l'organisation *
              </Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.organization_name && <p className="text-red-500 text-sm mt-1">{errors.organization_name}</p>}
            </div>

            <div>
              <Label htmlFor="company_name" className={isDark ? 'text-gray-300' : ''}>
                Nom de l'entreprise
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="email" className={isDark ? 'text-gray-300' : ''}>
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="phone" className={isDark ? 'text-gray-300' : ''}>
                Téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="siret" className={isDark ? 'text-gray-300' : ''}>
                SIRET
              </Label>
              <Input
                id="siret"
                value={formData.siret}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value.replace(/\D/g, '') })}
                maxLength={14}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
              {errors.siret && <p className="text-red-500 text-sm mt-1">{errors.siret}</p>}
            </div>

            <div>
              <Label htmlFor="siren" className={isDark ? 'text-gray-300' : ''}>
                SIREN
              </Label>
              <Input
                id="siren"
                value={formData.siren}
                onChange={(e) => setFormData({ ...formData, siren: e.target.value.replace(/\D/g, '') })}
                maxLength={9}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
              {errors.siren && <p className="text-red-500 text-sm mt-1">{errors.siren}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className={isDark ? 'text-gray-300' : ''}>
                Adresse
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="city" className={isDark ? 'text-gray-300' : ''}>
                Ville
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="zip_code" className={isDark ? 'text-gray-300' : ''}>
                Code postal
              </Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="country" className={isDark ? 'text-gray-300' : ''}>
                Pays
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="plan_id" className={isDark ? 'text-gray-300' : ''}>
                Plan
              </Label>
              <select
                id="plan_id"
                value={formData.plan_id}
                onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Sélectionner un plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Enregistrement...' : organizationId ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

