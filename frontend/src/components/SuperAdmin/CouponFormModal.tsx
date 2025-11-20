import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService, Coupon, Plan } from '../../services/superAdmin';

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  couponId?: number;
}

export const CouponFormModal: React.FC<CouponFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  couponId,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    currency: 'EUR',
    starts_at: '',
    ends_at: '',
    is_active: true,
    max_uses: '',
    max_uses_per_user: '',
    minimum_amount: '',
    target_plans: [] as number[],
    notes: '',
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      if (couponId) {
        fetchCoupon();
      } else {
        resetForm();
      }
    }
  }, [isOpen, couponId]);

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

  const fetchCoupon = async () => {
    if (!couponId) return;
    setLoading(true);
    try {
      const response = await superAdminService.getCoupon(couponId);
      if (response.success) {
        const coupon = response.data;
        setFormData({
          code: coupon.code || '',
          name: coupon.name || '',
          description: coupon.description || '',
          type: coupon.type || 'percentage',
          value: coupon.value?.toString() || '',
          currency: coupon.currency || 'EUR',
          starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().split('T')[0] : '',
          ends_at: coupon.ends_at ? new Date(coupon.ends_at).toISOString().split('T')[0] : '',
          is_active: coupon.is_active ?? true,
          max_uses: coupon.max_uses?.toString() || '',
          max_uses_per_user: coupon.max_uses_per_user?.toString() || '',
          minimum_amount: coupon.minimum_amount?.toString() || '',
          target_plans: coupon.target_plans || [],
          notes: coupon.notes || '',
        });
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger le coupon');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      currency: 'EUR',
      starts_at: '',
      ends_at: '',
      is_active: true,
      max_uses: '',
      max_uses_per_user: '',
      minimum_amount: '',
      target_plans: [],
      notes: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.value) {
      newErrors.value = 'La valeur est requise';
    }
    if (!formData.starts_at) {
      newErrors.starts_at = 'La date de début est requise';
    }
    if (!formData.ends_at) {
      newErrors.ends_at = 'La date de fin est requise';
    }
    if (formData.starts_at && formData.ends_at && new Date(formData.starts_at) > new Date(formData.ends_at)) {
      newErrors.ends_at = 'La date de fin doit être après la date de début';
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
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        value: parseFloat(formData.value),
        currency: formData.currency,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        is_active: formData.is_active,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
        max_uses_per_user: formData.max_uses_per_user ? parseInt(formData.max_uses_per_user) : undefined,
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : undefined,
        target_plans: formData.target_plans.length > 0 ? formData.target_plans : undefined,
        notes: formData.notes.trim() || undefined,
      };

      const response = couponId
        ? await superAdminService.updateCoupon(couponId, payload)
        : await superAdminService.createCoupon(payload);

      if (response.success) {
        success('Succès', couponId ? 'Coupon mis à jour avec succès' : 'Coupon créé avec succès');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || (couponId ? 'Impossible de mettre à jour le coupon' : 'Impossible de créer le coupon'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlan = (planId: number) => {
    setFormData({
      ...formData,
      target_plans: formData.target_plans.includes(planId)
        ? formData.target_plans.filter(id => id !== planId)
        : [...formData.target_plans, planId]
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {couponId ? 'Modifier le coupon' : 'Créer un coupon'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code" className={isDark ? 'text-gray-300' : ''}>Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>

            <div>
              <Label htmlFor="name" className={isDark ? 'text-gray-300' : ''}>Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className={isDark ? 'text-gray-300' : ''}>Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type" className={isDark ? 'text-gray-300' : ''}>Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                required
              >
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>

            <div>
              <Label htmlFor="value" className={isDark ? 'text-gray-300' : ''}>
                Valeur * ({formData.type === 'percentage' ? '%' : formData.currency})
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
            </div>

            <div>
              <Label htmlFor="currency" className={isDark ? 'text-gray-300' : ''}>Devise</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <Label htmlFor="starts_at" className={isDark ? 'text-gray-300' : ''}>Date de début *</Label>
              <Input
                id="starts_at"
                type="date"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.starts_at && <p className="text-red-500 text-sm mt-1">{errors.starts_at}</p>}
            </div>

            <div>
              <Label htmlFor="ends_at" className={isDark ? 'text-gray-300' : ''}>Date de fin *</Label>
              <Input
                id="ends_at"
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.ends_at && <p className="text-red-500 text-sm mt-1">{errors.ends_at}</p>}
            </div>

            <div>
              <Label htmlFor="max_uses" className={isDark ? 'text-gray-300' : ''}>Utilisations max</Label>
              <Input
                id="max_uses"
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="max_uses_per_user" className={isDark ? 'text-gray-300' : ''}>Utilisations max par utilisateur</Label>
              <Input
                id="max_uses_per_user"
                type="number"
                value={formData.max_uses_per_user}
                onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="minimum_amount" className={isDark ? 'text-gray-300' : ''}>Montant minimum</Label>
              <Input
                id="minimum_amount"
                type="number"
                step="0.01"
                value={formData.minimum_amount}
                onChange={(e) => setFormData({ ...formData, minimum_amount: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div className="md:col-span-2">
              <Label className={isDark ? 'text-gray-300' : ''}>Plans ciblés</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                {plans.map((plan) => (
                  <label key={plan.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_plans.includes(plan.id)}
                      onChange={() => togglePlan(plan.id)}
                      className="w-4 h-4"
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{plan.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className={isDark ? 'text-gray-300' : ''}>Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Actif</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Enregistrement...' : couponId ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

