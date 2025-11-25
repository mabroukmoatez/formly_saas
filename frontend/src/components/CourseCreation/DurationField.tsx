import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { InfoIcon } from 'lucide-react';

interface DurationFieldProps {
  duration: number;
  durationDays?: number;
  onDurationChange: (duration: number) => void;
  onDurationDaysChange?: (days: number) => void;
  className?: string;
}

export const DurationField: React.FC<DurationFieldProps> = ({
  duration,
  durationDays = 0,
  onDurationChange,
  onDurationDaysChange,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  return (
    <div className={`flex items-center px-[17px] py-4 rounded-[18px] border border-solid ${
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
    } ${className}`}>
      {/* Label with Info Icon */}
      <div className="inline-flex items-center gap-2 mr-4">
        <div className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid ${
          isDark ? 'border-gray-500' : 'border-[#e2e2ea]'
        }`} />
        <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
          isDark ? 'text-white' : 'text-[#19294a]'
        }`}>
          Durée De La Formation
        </span>
        <InfoIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>

      {/* Input Fields */}
      <div className="inline-flex items-center gap-6 flex-1">
        {/* Hours (HH) */}
        <div className="flex items-center gap-1">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            -
          </span>
          <div className={`flex items-center px-3 py-2 rounded-full border ${
            isDark ? 'bg-gray-600 border-gray-500' : 'bg-[#E8F3FF] border-[#E8F3FF]'
          }`}>
            <Input
              type="number"
              value={duration || ''}
              onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className={`w-[40px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                isDark
                  ? 'text-white placeholder:text-gray-400 bg-transparent'
                  : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
              }`}
            />
            <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ml-1 ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              H(s)
            </span>
          </div>
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] mx-2 ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            SOIT
          </span>
        </div>

        {/* Days (JJ) */}
        <div className="flex items-center gap-1">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            -
          </span>
          <div className={`flex items-center px-3 py-2 rounded-full border ${
            isDark ? 'bg-gray-600 border-gray-500' : 'bg-[#E8F3FF] border-[#E8F3FF]'
          }`}>
            <Input
              type="number"
              value={durationDays || ''}
              onChange={(e) => onDurationDaysChange?.(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className={`w-[40px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                isDark
                  ? 'text-white placeholder:text-gray-400 bg-transparent'
                  : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
              }`}
            />
            <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ml-1 ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              J/J
            </span>
          </div>
        </div>

        {/* De Formation label */}
        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ml-2 ${
          isDark ? 'text-gray-300' : 'text-[#19294a]'
        }`}>
          De Formation
        </span>
      </div>
    </div>
  );
};
