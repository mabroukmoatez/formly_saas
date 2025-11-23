import React from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown, NotificationDropdown } from '../CommercialDashboard/index';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

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
  const { navigateToRoute } = useSubdomainNavigation();

  return (
    <header
      className={`relative flex items-center justify-between gap-7 px-6 py-4 h-16 flex-shrink-0 transition-colors bg-[#19294a] ${className}`}
    >
      {/* Outward curved corner - bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-5 h-5"
        style={{
          backgroundColor: '#f3f4f6',
          borderTopRightRadius: '20px'
        }}
      />

      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-[10px] lg:hidden hover:bg-white/10"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5 text-white" />
        </Button>

        {/* Welcome Message - Clickable to Profile */}
        <div className="hidden sm:block">
          <h2
            className="text-lg font-semibold text-white cursor-pointer hover:underline transition-all"
            onClick={() => navigateToRoute('/student/profile')}
          >
            {t('student.header.hello') || 'Hello'}, {user?.name || user?.first_name || 'Student'}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 flex-1">
        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* Theme Toggle Button - Hidden for consistent design */}
        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
};
