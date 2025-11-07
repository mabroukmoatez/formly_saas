import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { quizService } from '../../services/quiz';

interface QuizCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
}

export const QuizCategoryModal: React.FC<QuizCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showError(t('common.error'), t('quiz.category.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      const response = await quizService.createCategory({
        title: title.trim(),
        color
      });
      
      if (response.success) {
        success(t('quiz.category.success'));
        setTitle('');
        setColor('#3b82f6');
        onCategoryAdded();
        onClose();
      }
    } catch (err: any) {
      showError(t('common.error'), t('quiz.category.error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div 
        className={`w-full max-w-md rounded-[18px] shadow-lg ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-semibold [font-family:'Poppins',Helvetica] ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('quiz.category.modalTitle')}
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`text-sm font-medium mb-2 block [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('quiz.category.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('quiz.category.namePlaceholder')}
              className={`w-full px-4 py-3 rounded-[10px] border [font-family:'Poppins',Helvetica] ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-0`}
              style={{ 
                focusRing: primaryColor 
              }}
              maxLength={50}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {title.length}/50
            </p>
          </div>

          <div>
            <label className={`text-sm font-medium mb-2 block [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('quiz.category.color')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer border-2"
                style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-[10px] border font-mono text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-[10px] font-medium transition-colors [font-family:'Poppins',Helvetica] ${
                isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('quiz.category.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-[10px] text-white font-medium transition-opacity hover:opacity-90 [font-family:'Poppins',Helvetica]"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? t('quiz.category.creating') : t('quiz.category.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

