import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChevronDown } from 'lucide-react';

interface DurationFieldProps {
  duration: number;
  durationMinutes?: number;
  onDurationChange: (duration: number) => void;
  onDurationMinutesChange?: (minutes: number) => void;
  className?: string;
}

export const DurationField: React.FC<DurationFieldProps> = ({
  duration,
  durationMinutes = 0,
  onDurationChange,
  onDurationMinutesChange,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  return (
    <div className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid ${
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
    } ${className}`}>
      <div className="inline-flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={duration || ''}
            onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
            placeholder="-"
            min="0"
            className={`w-[80px] border-none shadow-none text-[17px] font-medium text-center ${
              isDark 
                ? 'text-white placeholder:text-gray-400 bg-transparent' 
                : 'text-[#2D3748] placeholder:text-[#718096]'
            }`}
          />
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            Int(s)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={durationMinutes || ''}
            onChange={(e) => onDurationMinutesChange?.(parseInt(e.target.value) || 0)}
            placeholder="-"
            min="0"
            max="59"
            className={`w-[80px] border-none shadow-none text-[17px] font-medium text-center ${
              isDark 
                ? 'text-white placeholder:text-gray-400 bg-transparent' 
                : 'text-[#2D3748] placeholder:text-[#718096]'
            }`}
          />
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            min
          </span>
        </div>
      </div>
      
      <Button
        type="button"
        className={`ml-2 px-4 py-2 rounded-lg text-sm font-medium ${
          isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-transparent hover:bg-gray-50'
        }`}
        style={{ color: primaryColor }}
      >
        De Formation
        <ChevronDown className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};
