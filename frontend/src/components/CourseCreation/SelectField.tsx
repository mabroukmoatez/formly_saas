import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CategoryCreationModal } from './CategoryCreationModal';
import { Plus, ChevronRight } from 'lucide-react';

interface SelectFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  options: Array<{ id: number; name: string; is_custom?: boolean }>;
  placeholder?: string;
  className?: string;
  showCreateButton?: boolean;
  onCategoryCreated?: () => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = '',
  showCreateButton = false,
  onCategoryCreated,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Count custom categories
  const customCategoriesCount = options.filter(opt => opt.is_custom).length;
  const selectedCategory = options.find(opt => opt.id === value);
  const isReadonly = value !== null && selectedCategory && !selectedCategory.is_custom;

  const handleCategoryCreated = (newCategory: { id: number; name: string }) => {
    onChange(newCategory.id);
    if (onCategoryCreated) {
      onCategoryCreated();
    }
  };

  // Special handling for "Catégorie/Pratiques De Formation"
  const isCategoryField = label.toLowerCase().includes('catégorie') || label.toLowerCase().includes('pratiques');

  return (
    <>
      <div className={`flex flex-col gap-2 ${className}`}>
        {isCategoryField && (
          <div className="flex items-center gap-2">
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Catégorie/Pratiques De Formation:
            </span>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                // TODO: Navigate to activities page
              }}
              className={`text-[17px] font-medium hover:underline ${
                isDark ? 'text-blue-400' : 'text-[#0066FF]'
              }`}
              style={{ color: primaryColor }}
            >
              Activités de formation <ChevronRight className="inline w-4 h-4" />
            </a>
          </div>
        )}
        
        <div className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
          <div className="inline-flex items-center gap-3 flex-1">
            {!isCategoryField && (
              <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
                isDark ? 'text-white' : 'text-[#19294a]'
              }`}>
                {label}:
              </span>
            )}
            {isReadonly ? (
              <span className={`text-[17px] font-medium ${
                isDark ? 'text-gray-400' : 'text-[#718096]'
              }`}>
                {selectedCategory?.name || 'Catégorie Name'}
              </span>
            ) : (
              <select
                value={value || ''}
                onChange={(e) => onChange(parseInt(e.target.value) || null)}
                className={`flex-1 px-3 py-2 border rounded-lg text-[17px] font-medium ${
                  isDark 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-[#e2e2ea] text-[#6a90b9]'
                }`}
              >
                <option value="">{placeholder || 'Sélectionner une catégorie'}</option>
                {options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name} {option.is_custom ? '(Personnalisée)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {showCreateButton && !isReadonly && (
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-[#E8F3FF] hover:bg-[#D9E4FB]'
              }`}
              style={{ 
                backgroundColor: isDark ? undefined : '#E8F3FF',
                color: primaryColor
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Créer
            </Button>
          )}
        </div>
      </div>

      {showCreateButton && (
        <CategoryCreationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCategoryCreated}
          existingCustomCount={customCategoriesCount}
        />
      )}
    </>
  );
};
