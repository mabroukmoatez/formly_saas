import React from 'react';
import { Input } from '../ui/input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'number';
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
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
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Your Course Title"}
          maxLength={maxLength}
          className={`flex-1 border-none shadow-none text-[17px] font-medium border-b ${
            isDark 
              ? 'text-white placeholder:text-gray-400 bg-transparent border-gray-600 focus:border-gray-400' 
              : 'text-[#2D3748] placeholder:text-[#718096] bg-transparent border-[#E2E8F0] focus:border-[#0066FF]'
          } rounded-none px-0`}
          style={{ 
            borderBottom: isDark ? '1px solid #4B5563' : '1px solid #E2E8F0',
            outline: 'none',
            boxShadow: 'none'
          }}
        />
      </div>
      {maxLength && (
        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
          isDark ? 'text-gray-400' : 'text-[#6a90b9]'
        }`}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
};
