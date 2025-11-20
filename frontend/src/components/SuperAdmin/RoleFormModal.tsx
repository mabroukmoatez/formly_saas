import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService, Role, Permission } from '../../services/superAdmin';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  roleId?: number;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roleId,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'custom',
    level: '5',
    is_active: true,
  });

  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      if (roleId) {
        fetchRole();
      } else {
        resetForm();
      }
    }
  }, [isOpen, roleId]);

  const fetchPermissions = async () => {
    // Note: L'API ne fournit pas de endpoint pour lister toutes les permissions
    // Vous devrez peut-être créer cet endpoint ou récupérer les permissions depuis le rôle
    // Pour l'instant, on laisse vide et on récupère depuis le rôle si on édite
  };

  const fetchRole = async () => {
    if (!roleId) return;
    setLoading(true);
    try {
      const response = await superAdminService.getRole(roleId);
      if (response.success) {
        const role = response.data;
        setFormData({
          name: role.name || '',
          slug: role.slug || '',
          description: role.description || '',
          type: role.type || 'custom',
          level: role.level?.toString() || '5',
          is_active: role.is_active ?? true,
        });
        if (role.permissions) {
          setAvailablePermissions(role.permissions);
          setSelectedPermissions(role.permissions.map((p: Permission) => p.id));
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger le rôle');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'custom',
      level: '5',
      is_active: true,
    });
    setSelectedPermissions([]);
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
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim() || undefined,
        type: formData.type,
        level: parseInt(formData.level),
        is_active: formData.is_active,
      };

      const response = roleId
        ? await superAdminService.updateRole(roleId, payload)
        : await superAdminService.createRole(payload);

      if (response.success) {
        // Assign permissions if creating new role
        if (!roleId && selectedPermissions.length > 0) {
          for (const permissionId of selectedPermissions) {
            try {
              await superAdminService.assignPermission(response.data.id, permissionId);
            } catch (err) {
              console.error('Error assigning permission:', err);
            }
          }
        }

        success('Succès', roleId ? 'Rôle mis à jour avec succès' : 'Rôle créé avec succès');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || (roleId ? 'Impossible de mettre à jour le rôle' : 'Impossible de créer le rôle'));
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
            {roleId ? 'Modifier le rôle' : 'Créer un rôle'}
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
              <Label htmlFor="type" className={isDark ? 'text-gray-300' : ''}>Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="custom">Personnalisé</option>
                <option value="system">Système</option>
              </select>
            </div>

            <div>
              <Label htmlFor="level" className={isDark ? 'text-gray-300' : ''}>Niveau</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="10"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
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
              {isSubmitting ? 'Enregistrement...' : roleId ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

