import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bell } from 'lucide-react';

interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-[10px] relative ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
      </Button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('common.viewAllNotifications')}
            </h3>
          </div>

          <div className="p-4">
            <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('common.noNotifications')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

