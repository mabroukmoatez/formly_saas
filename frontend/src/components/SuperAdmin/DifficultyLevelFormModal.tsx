import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface DifficultyLevelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  levelId?: number;
}

export const DifficultyLevelFormModal: React.FC<DifficultyLevelFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  levelId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    description: '',
    color: '#3b82f6',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (levelId) {
        fetchLevel();
      } else {
        resetForm();
      }
    }
  }, [isOpen, levelId]);

  const fetchLevel = async () => {
    if (!levelId) return;
    try {
      setLoading(true);
      const response = await superAdminService.getDifficultyLevels({ per_page: 100 });
      if (response.success) {
        const levels = response.data?.data || response.data || [];
        const level = levels.find((l: any) => l.id === levelId);
        if (level) {
          setFormData({
            name: level.name || '',
            level: level.level || level.value || 1,
            description: level.description || '',
            color: level.color || '#3b82f6',
          });
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les données du niveau');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      level: 1,
      description: '',
      color: '#3b82f6',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (formData.level < 1 || formData.level > 10) {
      newErrors.level = 'Le niveau doit être entre 1 et 10';
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
        level: formData.level,
        value: formData.level, // Some backends might use 'value' instead of 'level'
        description: formData.description.trim() || null,
        color: formData.color,
      };

      let response;
      if (levelId) {
        response = await superAdminService.updateDifficultyLevel(levelId, submitData);
      } else {
        response = await superAdminService.createDifficultyLevel(submitData);
      }

      if (response.success) {
        success('Succès', levelId ? 'Niveau modifié avec succès' : 'Niveau créé avec succès');
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        showError('Erreur', error.message || (levelId ? 'Impossible de modifier le niveau' : 'Impossible de créer le niveau'));
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
            {levelId ? 'Modifier le niveau de difficulté' : 'Créer un niveau de difficulté'}
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
                  Nom *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder="Débutant"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="level" className={isDark ? 'text-gray-300' : ''}>
                  Niveau (1-10) *
                </Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  required
                />
                {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
              </div>

              <div>
                <Label htmlFor="color" className={isDark ? 'text-gray-300' : ''}>
                  Couleur
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className={`w-20 h-10 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder="#3b82f6"
                  />
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
              <Button type="submit" disabled={isSubmitting} className="bg-purple-500 hover:bg-purple-600">
                {isSubmitting ? 'Enregistrement...' : levelId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};





