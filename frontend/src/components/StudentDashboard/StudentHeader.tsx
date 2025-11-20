import React from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown, NotificationDropdown } from '../CommercialDashboard/index';
import { Menu, Sun, Moon, Bell } from 'lucide-react';

interface StudentHeaderProps {
  className?: string;
  onMobileMenuToggle?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  className = '',
  onMobileMenuToggle
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <header
      className={`flex items-center justify-between gap-7 px-6 py-4 h-16 flex-shrink-0 border-b transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-[10px] lg:hidden ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={onMobileMenuToggle}
        >
          <Menu className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </Button>

        {/* Welcome Message */}
        <div className="hidden sm:block">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('student.header.hello') || 'Hello'}, {user?.name || user?.first_name || 'Student'}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 flex-1">
        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-[10px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={toggleTheme}
          title={isDark ? t('common.lightMode') : t('common.darkMode')}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </Button>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
};
