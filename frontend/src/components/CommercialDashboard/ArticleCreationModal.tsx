import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
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

  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    description: '',
    category: '',
    quantity: 1,
    price_ht: 0,
    discount: 0,
    tva: 20,
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
        quantity: 1,
        price_ht: parseFloat(String(article.price_ht || article.unit_price || 0)),
        discount: 0,
        tva: parseFloat(String(article.tva || article.tax_rate || 20)),
      });
    } else if (isOpen && !article) {
      const nextRef = `ART-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      setFormData({
        reference: nextRef,
        designation: '',
        description: '',
        category: '',
        quantity: 1,
        price_ht: 0,
        discount: 0,
        tva: 20,
      });
    }
  }, [isOpen, article]);

  const calculateAmountHT = () => {
    const { quantity, price_ht, discount } = formData;
    const subtotal = quantity * price_ht;
    const discountAmount = (subtotal * discount) / 100;
    return (subtotal - discountAmount).toFixed(2);
  };

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.designation || !formData.price_ht) {
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
        price_ht: formData.price_ht,
        tva: formData.tva,
      };

      if (article?.id) {
        const response = await commercialService.updateArticle(String(article.id), articleData);
        if (response.success) {
          success('Article modifié avec succès');
          onSave(response.data);
        } else {
          showError('Erreur', 'Impossible de modifier l\'article');
        }
      } else {
        const response = await commercialService.createArticle(articleData);
        if (response.success) {
          success('Article créé avec succès');
          onSave(response.data);
        } else {
          showError('Erreur', 'Impossible de créer l\'article');
        }
      }
      onClose();
    } catch (error: any) {
      showError('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[10.833px] w-full max-w-[750px] font-['Poppins',sans-serif]">
        <div className="absolute border-[0.833px] border-[rgba(106,144,186,0.39)] inset-0 pointer-events-none rounded-[10.833px] shadow-[0px_57px_86px_0px_rgba(25,41,74,0.16)]" />

        <div className="flex flex-col items-end justify-end p-[40px] pt-[46px] pb-[19px] gap-[21px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-[40px] top-[8px] size-[30.667px] rounded-full bg-[#e8f0f7] flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <X className="w-5 h-5 text-[#6a90ba]" strokeWidth={2} />
          </button>

          {/* Form Section */}
          <div className="bg-[#e8f0f7] rounded-[12px] p-[14px] w-full">
            <div className="flex flex-wrap gap-[15px] items-start">
              {/* Designation Field - Wider */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] min-w-[281px] relative">
                <div className="absolute border border-[#007aff] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center">Désignation</p>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className="text-[15px] font-semibold text-[#19294a] text-center bg-transparent border-none outline-none"
                  placeholder="Nom de l'article"
                />
              </div>

              {/* Quantity Field */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] relative">
                <div className="absolute border border-[rgba(106,144,186,0.33)] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center">Quantité</p>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  className="text-[15px] font-semibold text-[#19294a] text-center bg-transparent border-none outline-none w-16"
                  min="1"
                />
              </div>

              {/* Prix de vente HT Field */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] relative">
                <div className="absolute border border-[rgba(106,144,186,0.33)] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center capitalize">prix de vente HT</p>
                <div className="flex items-center gap-1 justify-center">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_ht}
                    onChange={(e) => handleInputChange('price_ht', parseFloat(e.target.value) || 0)}
                    className="text-[15px] font-semibold text-[#19294a] text-center bg-transparent border-none outline-none w-20"
                  />
                  <span className="text-[15px] font-semibold text-[#19294a]">€</span>
                </div>
              </div>

              {/* Remise Field */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] relative">
                <div className="absolute border border-[rgba(106,144,186,0.33)] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center capitalize">Remise</p>
                <div className="flex items-center gap-1 justify-center">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    className="text-[15px] font-semibold text-[#19294a] text-center bg-transparent border-none outline-none w-16"
                  />
                  <span className="text-[15px] font-semibold text-[#19294a]">%</span>
                </div>
              </div>

              {/* TVA Field - Editable Input */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] relative">
                <div className="absolute border border-[rgba(106,144,186,0.33)] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center capitalize">TVA</p>
                <div className="flex items-center gap-1 justify-center">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tva}
                    onChange={(e) => handleInputChange('tva', parseFloat(e.target.value) || 0)}
                    className="text-[15px] font-semibold text-[#19294a] text-center bg-transparent border-none outline-none w-16"
                  />
                  <span className="text-[15px] font-semibold text-[#19294a]">%</span>
                </div>
              </div>

              {/* Montant HT Field - Calculated */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] min-w-[165px] relative">
                <div className="absolute border border-[rgba(106,144,186,0.33)] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center capitalize">montant HT</p>
                <p className="text-[15px] font-semibold text-[#19294a] text-center">
                  {calculateAmountHT()} €
                </p>
              </div>

              {/* Category Field */}
              <div className="bg-white rounded-[8px] px-[13px] py-[6px] flex flex-col gap-[10px] relative">
                <div className="absolute border border-[rgba(106,144,186,0.33)] inset-0 pointer-events-none rounded-[8px]" />
                <p className="text-[12px] font-medium text-[#6a90ba] text-center capitalize">catégorie</p>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="text-[15px] font-semibold text-[#19294a] text-center bg-transparent border-none outline-none min-w-[120px]"
                  placeholder="Catégorie"
                />
              </div>
            </div>
          </div>

          {/* Valider Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#007aff] rounded-[13px] px-4 py-3 flex items-center gap-4 border border-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <p className="text-[17px] font-medium text-white">
              {saving ? 'Enregistrement...' : 'Valider'}
            </p>
            <div className="flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
