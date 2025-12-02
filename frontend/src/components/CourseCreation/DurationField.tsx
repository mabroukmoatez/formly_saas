import React from 'react';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

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
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {/* Hours Input */}
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={durationHours || ''}
          onChange={(e) => onDurationHoursChange?.(parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          className={`w-[80px] text-center ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
        />
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          H
        </span>
      </div>
      
      <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        SOIT
      </span>
      
      {/* Days Input */}
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={durationDays || ''}
          onChange={(e) => onDurationDaysChange?.(parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          className={`w-[80px] text-center ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
        />
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          J
        </span>
      </div>
      
      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        De Formation
      </span>
    </div>
  );
};
