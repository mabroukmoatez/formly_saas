import React from 'react';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface RichTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export const RichTextField: React.FC<RichTextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  minHeight = '150px',
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className={`flex flex-col px-[17px] py-3 rounded-[18px] border border-solid ${
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
    } ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            {label}:
          </span>
        </div>

        <RichTextEditor
          content={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`min-h-[${minHeight}]`}
        />
      </div>
    </div>
  );
};
