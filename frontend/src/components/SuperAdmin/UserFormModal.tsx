import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId?: number;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'student',
    organization_id: '',
    is_active: true,
  });

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'admin', label: 'Admin' },
    { value: 'organization', label: 'Organization' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
      if (userId) {
        fetchUser();
      } else {
        resetForm();
      }
    }
  }, [isOpen, userId]);

  const fetchOrganizations = async () => {
    try {
      const response = await superAdminService.getOrganizations({ per_page: 100 });
      if (response.success) {
        setOrganizations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchUser = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await superAdminService.getUser(userId);
      if (response.success) {
        const user = response.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          password_confirmation: '',
          role: user.role || 'student',
          organization_id: user.organization_id?.toString() || '',
          is_active: user.is_active !== false,
        });
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les données de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'student',
      organization_id: '',
      is_active: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!userId && !formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        is_active: formData.is_active,
      };

      if (formData.password) {
        submitData.password = formData.password;
        submitData.password_confirmation = formData.password_confirmation;
      }

      if (formData.organization_id) {
        submitData.organization_id = parseInt(formData.organization_id);
      }

      let response;
      if (userId) {
        response = await superAdminService.updateUser(userId, submitData);
      } else {
        response = await superAdminService.createUser(submitData);
      }

      if (response.success) {
        success('Succès', userId ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        showError('Erreur', error.message || (userId ? 'Impossible de modifier l\'utilisateur' : 'Impossible de créer l\'utilisateur'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {userId ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className={isDark ? 'text-gray-300' : ''}>
                  Nom complet *
                </Label>
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
                <Label htmlFor="role" className={isDark ? 'text-gray-300' : ''}>
                  Rôle *
                </Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>

              <div>
                <Label htmlFor="organization_id" className={isDark ? 'text-gray-300' : ''}>
                  Organisation
                </Label>
                <select
                  id="organization_id"
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Aucune organisation</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.organization_name || org.company_name}
                    </option>
                  ))}
                </select>
                {errors.organization_id && <p className="text-red-500 text-sm mt-1">{errors.organization_id}</p>}
              </div>

              {!userId && (
                <>
                  <div>
                    <Label htmlFor="password" className={isDark ? 'text-gray-300' : ''}>
                      Mot de passe *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      required={!userId}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <Label htmlFor="password_confirmation" className={isDark ? 'text-gray-300' : ''}>
                      Confirmer le mot de passe *
                    </Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      required={!userId}
                    />
                    {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
                  </div>
                </>
              )}

              {userId && (
                <>
                  <div>
                    <Label htmlFor="password" className={isDark ? 'text-gray-300' : ''}>
                      Nouveau mot de passe (laisser vide pour ne pas changer)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  {formData.password && (
                    <div>
                      <Label htmlFor="password_confirmation" className={isDark ? 'text-gray-300' : ''}>
                        Confirmer le nouveau mot de passe
                      </Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={formData.password_confirmation}
                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      />
                      {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
                    </div>
                  )}
                </>
              )}

              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className={isDark ? 'text-gray-300' : ''}>
                    Utilisateur actif
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-500 hover:bg-purple-600">
                {isSubmitting ? 'Enregistrement...' : userId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

