import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface CourseLanguageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  languageId?: number;
}

export const CourseLanguageFormModal: React.FC<CourseLanguageFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  languageId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    native_name: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (languageId) {
        fetchLanguage();
      } else {
        resetForm();
      }
    }
  }, [isOpen, languageId]);

  const fetchLanguage = async () => {
    if (!languageId) return;
    try {
      setLoading(true);
      const response = await superAdminService.getCourseLanguages({ per_page: 100 });
      if (response.success) {
        const languages = response.data?.data || response.data || [];
        const language = languages.find((l: any) => l.id === languageId);
        if (language) {
          setFormData({
            name: language.name || '',
            code: language.code || '',
            native_name: language.native_name || '',
            is_active: language.is_active !== false,
          });
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les données de la langue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      native_name: '',
      is_active: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis';
    } else if (formData.code.length !== 2) {
      newErrors.code = 'Le code doit contenir 2 caractères (ex: en, fr, es)';
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
        code: formData.code.trim().toLowerCase(),
        native_name: formData.native_name.trim() || null,
        is_active: formData.is_active,
      };

      let response;
      if (languageId) {
        response = await superAdminService.updateCourseLanguage(languageId, submitData);
      } else {
        response = await superAdminService.createCourseLanguage(submitData);
      }

      if (response.success) {
        success('Succès', languageId ? 'Langue modifiée avec succès' : 'Langue créée avec succès');
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        showError('Erreur', error.message || (languageId ? 'Impossible de modifier la langue' : 'Impossible de créer la langue'));
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
            {languageId ? 'Modifier la langue' : 'Créer une langue'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className={isDark ? 'text-gray-300' : ''}>
                  Nom (en anglais) *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder="English"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="code" className={isDark ? 'text-gray-300' : ''}>
                  Code ISO (2 lettres) *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().slice(0, 2) })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder="EN"
                  maxLength={2}
                  required
                />
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="native_name" className={isDark ? 'text-gray-300' : ''}>
                  Nom natif
                </Label>
                <Input
                  id="native_name"
                  value={formData.native_name}
                  onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder="English"
                />
              </div>

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
                    Langue active
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600">
                {isSubmitting ? 'Enregistrement...' : languageId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

