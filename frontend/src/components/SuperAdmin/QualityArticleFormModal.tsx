import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface QualityArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  articleId?: number;
}

export const QualityArticleFormModal: React.FC<QualityArticleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  articleId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    is_featured: false,
    summary: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (articleId) {
        fetchArticle();
      } else {
        resetForm();
      }
    }
  }, [isOpen, articleId]);

  const fetchArticle = async () => {
    if (!articleId) return;
    try {
      setLoading(true);
      const response = await superAdminService.getQualityArticles({ per_page: 100 });
      if (response.success) {
        const articles = response.data?.articles || response.data?.data || response.data || [];
        const article = Array.isArray(articles) ? articles.find((a: any) => a.id === articleId) : null;
        if (article) {
          setFormData({
            title: article.title || '',
            content: article.content || '',
            category: article.category || '',
            is_featured: article.is_featured || false,
            summary: article.summary || article.content?.substring(0, 200) || '',
          });
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les données de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      is_featured: false,
      summary: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est requis';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est requise';
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
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category.trim(),
        is_featured: formData.is_featured,
        summary: formData.summary.trim() || null,
      };

      let response;
      if (articleId) {
        response = await superAdminService.updateQualityArticle(articleId, submitData);
      } else {
        response = await superAdminService.createQualityArticle(submitData);
      }

      if (response.success) {
        success('Succès', articleId ? 'Article modifié avec succès' : 'Article créé avec succès');
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        showError('Erreur', error.message || (articleId ? 'Impossible de modifier l\'article' : 'Impossible de créer l\'article'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {articleId ? 'Modifier l\'article' : 'Créer un article'}
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
              <div className="md:col-span-2">
                <Label htmlFor="title" className={isDark ? 'text-gray-300' : ''}>
                  Titre *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  required
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="category" className={isDark ? 'text-gray-300' : ''}>
                  Catégorie *
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder="Ex: Qualiopi, Audit, Veille..."
                  required
                />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_featured" className={isDark ? 'text-gray-300' : ''}>
                    Article mis en avant
                  </Label>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="summary" className={isDark ? 'text-gray-300' : ''}>
                  Résumé (optionnel)
                </Label>
                <textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Résumé court de l'article (affiché dans les cartes)"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="content" className={isDark ? 'text-gray-300' : ''}>
                  Contenu *
                </Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Contenu de l'article (HTML supporté)"
                  required
                />
                {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Le contenu peut inclure du HTML pour le formatage
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600">
                {isSubmitting ? 'Enregistrement...' : articleId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};





