import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categoryId?: number;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categoryId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    description: '',
    is_feature: false,
  });

  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchParentCategories();
      if (categoryId) {
        fetchCategory();
      } else {
        resetForm();
      }
    }
  }, [isOpen, categoryId]);

  const fetchParentCategories = async () => {
    try {
      const response = await superAdminService.getCategories({ per_page: 100 });
      if (response.success) {
        const categories = response.data?.data || response.data || [];
        // Filter out the current category if editing
        setParentCategories(categories.filter((cat: any) => cat.id !== categoryId));
      }
    } catch (error: any) {
      console.error('Error fetching parent categories:', error);
    }
  };

  const fetchCategory = async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      // Note: You may need to add getCategory method to superAdminService
      // For now, we'll use a workaround
      const response = await superAdminService.getCategories({ per_page: 100 });
      if (response.success) {
        const categories = response.data?.data || response.data || [];
        const category = categories.find((cat: any) => cat.id === categoryId);
        if (category) {
          setFormData({
            name: category.name || '',
            slug: category.slug || '',
            parent_id: category.parent_id?.toString() || '',
            description: category.description || '',
            is_feature: category.is_feature === 'yes' || category.is_feature === true,
          });
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les données de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      parent_id: '',
      description: '',
      is_feature: false,
    });
    setErrors({});
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const validateForm = () => {
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        is_feature: formData.is_feature ? 'yes' : 'no',
      };

      if (formData.parent_id) {
        submitData.parent_id = parseInt(formData.parent_id);
      }

      let response;
      if (categoryId) {
        response = await superAdminService.updateCategory(categoryId, submitData);
      } else {
        response = await superAdminService.createCategory(submitData);
      }

      if (response.success) {
        success('Succès', categoryId ? 'Catégorie modifiée avec succès' : 'Catégorie créée avec succès');
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        showError('Erreur', error.message || (categoryId ? 'Impossible de modifier la catégorie' : 'Impossible de créer la catégorie'));
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
            {categoryId ? 'Modifier la catégorie' : 'Créer une catégorie'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className={isDark ? 'text-gray-300' : ''}>
                  Nom *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="slug" className={isDark ? 'text-gray-300' : ''}>
                  Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  required
                />
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
              </div>

              <div>
                <Label htmlFor="parent_id" className={isDark ? 'text-gray-300' : ''}>
                  Catégorie parente
                </Label>
                <select
                  id="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_feature"
                    checked={formData.is_feature}
                    onChange={(e) => setFormData({ ...formData, is_feature: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_feature" className={isDark ? 'text-gray-300' : ''}>
                    Catégorie mise en avant
                  </Label>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description" className={isDark ? 'text-gray-300' : ''}>
                  Description
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-500 hover:bg-teal-600">
                {isSubmitting ? 'Enregistrement...' : categoryId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

