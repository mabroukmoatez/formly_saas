import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { Article } from '../../services/commercial.types';

interface ArticleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article?: Article) => void;
  article?: Article | null;
}

export const ArticleCreationModal: React.FC<ArticleCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  article,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    description: '',
    category: '',
    price_ht: '',
    tva: '',
  });
  const [saving, setSaving] = useState(false);

  // Load article data when editing
  useEffect(() => {
    if (isOpen && article) {
      setFormData({
        reference: article.reference || '',
        designation: article.designation || article.name || '',
        description: article.description || '',
        category: article.category || '',
        price_ht: String(article.price_ht || article.unit_price || ''),
        tva: String(article.tva || article.tax_rate || '20'),
      });
    } else if (isOpen && !article) {
      // Reset to defaults when creating new
      const nextRef = `ART-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      setFormData({
        reference: nextRef,
        designation: '',
        description: '',
        category: '',
        price_ht: '',
        tva: '20',
      });
    }
  }, [isOpen, article]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.designation || !formData.price_ht || !formData.tva) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const articleData = {
        reference: formData.reference,
        designation: formData.designation,
        description: formData.description,
        category: formData.category,
        price_ht: parseFloat(formData.price_ht),
        tva: parseFloat(formData.tva),
      };

      if (article?.id) {
        // Update existing article
        const response = await commercialService.updateArticle(String(article.id), articleData);
        if (response.success) {
          success('Article modifié avec succès');
          onSave(response.data);
        } else {
          showError('Erreur', 'Impossible de modifier l\'article');
        }
      } else {
        // Create new article
        const response = await commercialService.createArticle(articleData);
        if (response.success) {
          success('Article créé avec succès');
          onSave(response.data);
        } else {
          showError('Erreur', 'Impossible de créer l\'article');
        }
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const calculatePriceTTC = (): string => {
    const ht = parseFloat(formData.price_ht) || 0;
    const tva = parseFloat(formData.tva) || 0;
    const ttc = ht + (ht * tva / 100);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ttc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-[95%] max-w-[800px] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-12 rounded-[10px] flex items-center justify-center`}
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <Package className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {article ? 'Modifier l\'article' : 'Créer un article'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {article ? 'Modifiez les informations de l\'article' : 'Ajoutez un nouvel article à votre catalogue'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={onClose}
          >
            <X className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Reference and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Référence <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  placeholder="ART-2025-001"
                  className={isDark ? 'bg-gray-800 border-gray-600 text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Catégorie
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Support">Support</option>
                  <option value="Training">Formation</option>
                  <option value="Services">Services</option>
                  <option value="Subscription">Abonnement</option>
                  <option value="Product">Produit</option>
                </select>
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Désignation <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                placeholder="Nom de l'article ou service"
                className={isDark ? 'bg-gray-800 border-gray-600 text-white' : ''}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Description
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description détaillée de l'article"
                rows={3}
                className={isDark ? 'bg-gray-800 border-gray-600 text-white' : ''}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Prix HT <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_ht}
                  onChange={(e) => handleInputChange('price_ht', e.target.value)}
                  placeholder="0.00"
                  className={isDark ? 'bg-gray-800 border-gray-600 text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  TVA (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tva}
                  onChange={(e) => handleInputChange('tva', e.target.value)}
                  placeholder="20"
                  className={isDark ? 'bg-gray-800 border-gray-600 text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Prix TTC
                </Label>
                <div className={`px-3 py-2 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'} font-semibold`}>
                  {calculatePriceTTC()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className={isDark ? 'border-gray-600 text-gray-300' : ''}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formData.designation || !formData.price_ht}
                className="gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{article ? 'Modifier' : 'Créer l\'article'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

