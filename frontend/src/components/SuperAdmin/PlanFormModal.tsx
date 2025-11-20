import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService, Plan } from '../../services/superAdmin';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planId?: number;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planId,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    monthly_price: '',
    yearly_price: '',
    currency: 'EUR',
    max_storage_gb: '',
    max_users: '',
    max_video_minutes: '',
    max_compute_hours: '',
    max_bandwidth_gb: '',
    sla_level: '',
    backup_retention_days: '',
    ssl_included: true,
    support_included: true,
    support_level: '',
    is_active: true,
    is_featured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (planId) {
        fetchPlan();
      } else {
        resetForm();
      }
    }
  }, [isOpen, planId]);

  const fetchPlan = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const response = await superAdminService.getPlan(planId);
      if (response.success) {
        const plan = response.data;
        setFormData({
          name: plan.name || '',
          slug: plan.slug || '',
          description: plan.description || '',
          monthly_price: plan.monthly_price || '',
          yearly_price: plan.yearly_price || '',
          currency: plan.currency || 'EUR',
          max_storage_gb: plan.max_storage_gb?.toString() || '',
          max_users: plan.max_users?.toString() || '',
          max_video_minutes: plan.max_video_minutes?.toString() || '',
          max_compute_hours: plan.max_compute_hours?.toString() || '',
          max_bandwidth_gb: plan.max_bandwidth_gb?.toString() || '',
          sla_level: plan.sla_level || '',
          backup_retention_days: plan.backup_retention_days?.toString() || '',
          ssl_included: plan.ssl_included ?? true,
          support_included: plan.support_included ?? true,
          support_level: plan.support_level || '',
          is_active: plan.is_active ?? true,
          is_featured: plan.is_featured ?? false,
        });
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger le plan');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      monthly_price: '',
      yearly_price: '',
      currency: 'EUR',
      max_storage_gb: '',
      max_users: '',
      max_video_minutes: '',
      max_compute_hours: '',
      max_bandwidth_gb: '',
      sla_level: '',
      backup_retention_days: '',
      ssl_included: true,
      support_included: true,
      support_level: '',
      is_active: true,
      is_featured: false,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Le slug est requis';
    }
    if (!formData.monthly_price) {
      newErrors.monthly_price = 'Le prix mensuel est requis';
    }
    if (!formData.yearly_price) {
      newErrors.yearly_price = 'Le prix annuel est requis';
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
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        monthly_price: parseFloat(formData.monthly_price),
        yearly_price: parseFloat(formData.yearly_price),
        currency: formData.currency,
        max_storage_gb: formData.max_storage_gb ? parseInt(formData.max_storage_gb) : undefined,
        max_users: formData.max_users ? parseInt(formData.max_users) : undefined,
        max_video_minutes: formData.max_video_minutes ? parseInt(formData.max_video_minutes) : undefined,
        max_compute_hours: formData.max_compute_hours ? parseInt(formData.max_compute_hours) : undefined,
        max_bandwidth_gb: formData.max_bandwidth_gb ? parseInt(formData.max_bandwidth_gb) : undefined,
        sla_level: formData.sla_level || undefined,
        backup_retention_days: formData.backup_retention_days ? parseInt(formData.backup_retention_days) : undefined,
        ssl_included: formData.ssl_included,
        support_included: formData.support_included,
        support_level: formData.support_level || undefined,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      const response = planId
        ? await superAdminService.updatePlan(planId, payload)
        : await superAdminService.createPlan(payload);

      if (response.success) {
        success('Succès', planId ? 'Plan mis à jour avec succès' : 'Plan créé avec succès');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || (planId ? 'Impossible de mettre à jour le plan' : 'Impossible de créer le plan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {planId ? 'Modifier le plan' : 'Créer un plan'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="slug" className={isDark ? 'text-gray-300' : ''}>Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
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
              <Label htmlFor="monthly_price" className={isDark ? 'text-gray-300' : ''}>Prix mensuel (€) *</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.monthly_price && <p className="text-red-500 text-sm mt-1">{errors.monthly_price}</p>}
            </div>

            <div>
              <Label htmlFor="yearly_price" className={isDark ? 'text-gray-300' : ''}>Prix annuel (€) *</Label>
              <Input
                id="yearly_price"
                type="number"
                step="0.01"
                value={formData.yearly_price}
                onChange={(e) => setFormData({ ...formData, yearly_price: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.yearly_price && <p className="text-red-500 text-sm mt-1">{errors.yearly_price}</p>}
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
              <Label htmlFor="max_storage_gb" className={isDark ? 'text-gray-300' : ''}>Stockage max (GB)</Label>
              <Input
                id="max_storage_gb"
                type="number"
                value={formData.max_storage_gb}
                onChange={(e) => setFormData({ ...formData, max_storage_gb: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="max_users" className={isDark ? 'text-gray-300' : ''}>Utilisateurs max</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="max_video_minutes" className={isDark ? 'text-gray-300' : ''}>Minutes vidéo max</Label>
              <Input
                id="max_video_minutes"
                type="number"
                value={formData.max_video_minutes}
                onChange={(e) => setFormData({ ...formData, max_video_minutes: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="max_compute_hours" className={isDark ? 'text-gray-300' : ''}>Heures compute max</Label>
              <Input
                id="max_compute_hours"
                type="number"
                value={formData.max_compute_hours}
                onChange={(e) => setFormData({ ...formData, max_compute_hours: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="max_bandwidth_gb" className={isDark ? 'text-gray-300' : ''}>Bande passante max (GB)</Label>
              <Input
                id="max_bandwidth_gb"
                type="number"
                value={formData.max_bandwidth_gb}
                onChange={(e) => setFormData({ ...formData, max_bandwidth_gb: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="sla_level" className={isDark ? 'text-gray-300' : ''}>Niveau SLA</Label>
              <select
                id="sla_level"
                value={formData.sla_level}
                onChange={(e) => setFormData({ ...formData, sla_level: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Sélectionner</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <Label htmlFor="backup_retention_days" className={isDark ? 'text-gray-300' : ''}>Rétention backup (jours)</Label>
              <Input
                id="backup_retention_days"
                type="number"
                value={formData.backup_retention_days}
                onChange={(e) => setFormData({ ...formData, backup_retention_days: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="support_level" className={isDark ? 'text-gray-300' : ''}>Niveau de support</Label>
              <select
                id="support_level"
                value={formData.support_level}
                onChange={(e) => setFormData({ ...formData, support_level: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Sélectionner</option>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="phone">Téléphone</option>
                <option value="priority">Prioritaire</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ssl_included}
                  onChange={(e) => setFormData({ ...formData, ssl_included: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>SSL inclus</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.support_included}
                  onChange={(e) => setFormData({ ...formData, support_included: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Support inclus</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Actif</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Recommandé</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Enregistrement...' : planId ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

