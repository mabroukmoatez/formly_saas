import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChevronDown } from 'lucide-react';

interface DurationFieldProps {
  duration: number;
  durationDays?: number;
  durationHours?: number;
  durationMinutes?: number;
  onDurationChange?: (duration: number) => void;
  onDurationDaysChange?: (days: number) => void;
  onDurationHoursChange?: (hours: number) => void;
  onDurationMinutesChange?: (minutes: number) => void;
  className?: string;
}

export const DurationField: React.FC<DurationFieldProps> = ({
  duration,
  durationDays = 0,
  durationHours = 0,
  durationMinutes = 0,
  onDurationChange,
  onDurationDaysChange,
  onDurationHoursChange,
  onDurationMinutesChange,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Jour
        </label>
        <Input
          type="number"
          value={durationDays || ''}
          onChange={(e) => onDurationDaysChange?.(parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          className={`w-[80px] ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Heure
        </label>
        <Input
          type="number"
          value={durationHours || ''}
          onChange={(e) => onDurationHoursChange?.(parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          max="23"
          className={`w-[80px] ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Minute
        </label>
        <Input
          type="number"
          value={durationMinutes || ''}
          onChange={(e) => onDurationMinutesChange?.(parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          max="59"
          className={`w-[80px] ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
        />
      </div>
    </div>
  );
};
