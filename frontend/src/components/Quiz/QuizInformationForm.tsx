import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload, X } from 'lucide-react';
import { QuizCategoryModal } from './QuizCategoryModal';
import { quizService, QuizCategory } from '../../services/quiz';
import { useToast } from '../ui/toast';

interface QuizInformationFormProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  thumbnail: File | null;
  thumbnailPreview: string;
  setThumbnail: (file: File | null) => void;
  duration: number;
  setDuration: (value: number) => void;
  isShuffle: boolean;
  setIsShuffle: (value: boolean) => void;
  isRemake: boolean;
  setIsRemake: (value: boolean) => void;
  showAnswerAfter: boolean;
  setShowAnswerAfter: (value: boolean) => void;
}

export const QuizInformationForm: React.FC<QuizInformationFormProps> = (props) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categoryInput, setCategoryInput] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await quizService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      showError('Erreur', 'Impossible de charger les catégories');
    }
  };

  const handleAddCategory = () => {
    setShowCategoryModal(true);
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-[42px]">
        {/* Quiz Title */}
        <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
          <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('quiz.information.title')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            placeholder={t('quiz.information.titlePlaceholder')}
            maxLength={110}
            className={`w-full font-semibold text-sm border-0 p-0 bg-transparent ${isDark ? 'text-white' : 'text-gray-800'} focus:outline-none`}
          />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {props.title.length}/110
          </p>
        </div>

        {/* Thumbnail */}
        <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
          <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('quiz.information.thumbnail')}
          </label>
          {props.thumbnailPreview ? (
            <div className="relative">
              <img src={props.thumbnailPreview} className="w-full h-64 object-cover rounded-[10px]" alt="" />
              <button
                onClick={() => {
                  props.setThumbnail(null);
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-[10px] cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-8 h-8 text-orange-500" />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('quiz.information.thumbnailUpload')}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('quiz.information.thumbnailSize')}</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    props.setThumbnail(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Quiz Category */}
        <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
          <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('quiz.information.category')}
          </label>
          
          {/* Selected Categories */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedCategories.map(catId => {
                const category = categories.find(c => c.id === catId);
                if (!category) return null;
                return (
                  <div 
                    key={catId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: category.color ? `${category.color}20` : '#3b82f620',
                      color: category.color || '#3b82f6'
                    }}
                  >
                    {category.title}
                    <button
                      onClick={() => toggleCategory(catId)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Category Selector */}
          <div className="flex gap-2 mb-3">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleCategory(parseInt(e.target.value));
                }
              }}
              className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            >
              <option value="">{t('quiz.information.categoryPlaceholder')}</option>
              {categories
                .filter(cat => !selectedCategories.includes(cat.id))
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {t('quiz.information.categoryAdd')}
            </button>
          </div>
          
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {t('quiz.information.categoryHelper')}
          </p>
        </div>

        {/* Description */}
        <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
          <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('quiz.information.description')}
          </label>
          <textarea
            value={props.description}
            onChange={(e) => props.setDescription(e.target.value)}
            rows={6}
            className={`w-full min-h-[120px] border-none bg-transparent ${isDark ? 'text-gray-300' : 'text-gray-800'} focus:outline-none resize-none`}
            placeholder={t('quiz.information.descriptionPlaceholder')}
          />
        </div>

        {/* Duration */}
        <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
          <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('quiz.information.duration')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={props.duration}
              onChange={(e) => props.setDuration(parseInt(e.target.value) || 0)}
              className={`w-32 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('quiz.information.durationUnit')}</span>
          </div>
        </div>

        {/* Parameters */}
        <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
          <label className={`[font-family:'Poppins',Helvetica] text-base font-semibold mb-4 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('quiz.information.parameters')}
          </label>
          <div className="space-y-4">
            {[
              {
                checked: props.isShuffle,
                onChange: props.setIsShuffle,
                title: t('quiz.information.shuffle.title'),
                desc: t('quiz.information.shuffle.description')
              },
              {
                checked: props.isRemake,
                onChange: props.setIsRemake,
                title: t('quiz.information.remake.title'),
                desc: t('quiz.information.remake.description')
              },
              {
                checked: props.showAnswerAfter,
                onChange: props.setShowAnswerAfter,
                title: t('quiz.information.showAnswers.title'),
                desc: t('quiz.information.showAnswers.description')
              }
            ].map((param, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {param.title}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {param.desc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={param.checked}
                    onChange={(e) => param.onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <QuizCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryAdded={() => {
          loadCategories();
        }}
      />
    </section>
  );
};

