import React from 'react';
import { Input } from '../ui/input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SelectFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  options: Array<{ id: number; name: string }>;
  placeholder?: string;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid ${
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
    } ${className}`}>
      <div className="inline-flex items-center gap-3">
        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
          isDark ? 'text-white' : 'text-[#19294a]'
        }`}>
          {label}:
        </span>
        <select
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value) || null)}
          className={`px-3 py-2 border rounded-lg text-[17px] font-medium ${
            isDark 
              ? 'bg-gray-600 border-gray-500 text-white' 
              : 'bg-white border-[#e2e2ea] text-[#6a90b9]'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
