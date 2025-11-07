import React from 'react';
import { Input } from '../ui/input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface DurationFieldProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  className?: string;
}

export const DurationField: React.FC<DurationFieldProps> = ({
  duration,
  onDurationChange,
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
          {t('courseCreation.form.duration')}:
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={duration || ''}
            onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
            className={`w-[80px] border-none shadow-none text-[17px] font-medium text-center ${
              isDark 
                ? 'text-white placeholder:text-gray-400 bg-transparent' 
                : 'text-[#6a90b9] placeholder:text-[#6a90b9]'
            }`}
          />
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
            isDark ? 'text-white' : 'text-[#007aff]'
          }`}>
            H
          </span>
          <img className="w-3.5 h-3.5" alt="Hours" src="/assets/icons/clock.png" />
        </div>
      </div>
    </div>
  );
};
