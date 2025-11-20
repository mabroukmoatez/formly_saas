import React from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { Menu, Sun, Moon, MessageSquare } from 'lucide-react';

interface HeaderProps {
  className?: string;
  onMobileMenuToggle?: () => void;
  onChatToggle?: () => void;
}

export const SuperAdminHeader: React.FC<HeaderProps> = ({ className = '', onMobileMenuToggle, onChatToggle }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <header 
      className={`flex items-center justify-between gap-7 px-6 py-4 h-16 flex-shrink-0 border-b transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}
    >
      <div className="flex items-center gap-7">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-9 w-9 rounded-[10px] lg:hidden ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={onMobileMenuToggle}
        >
          <Menu className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </Button>
      </div>

      <div className="flex items-center justify-end gap-3 flex-1">
        {/* Messages Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-9 w-9 rounded-[10px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={onChatToggle}
        >
          <MessageSquare className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </Button>

        {/* Help Button with Notification Dropdown */}
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

