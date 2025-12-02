import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ProfileDropdown, NotificationDropdown } from '../CommercialDashboard';
import { OnboardingModal } from '../Onboarding/OnboardingModal';
import { useOnboarding } from '../../hooks/useOnboarding';
import { Menu, Sun, Moon, MessageSquare, ArrowLeft } from 'lucide-react';

interface QualityHeaderProps {
  className?: string;
  onMobileMenuToggle?: () => void;
  onChatToggle?: () => void;
}

export const QualityHeader: React.FC<QualityHeaderProps> = ({ className = '', onMobileMenuToggle, onChatToggle }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { showOnboarding, openOnboarding, closeOnboarding } = useOnboarding();
  const { organization, subdomain } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const primaryColor = organization?.primary_color || '#007aff';

  const handleGoToDashboard = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const isSubdomainRoute = pathSegments.length > 0 && pathSegments[0] === subdomain;
    
    if (isSubdomainRoute && subdomain) {
      navigate(`/${subdomain}/dashboard`);
    } else if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/dashboard`);
    } else {
      navigate('/dashboard');
    }
  };

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

        {/* Switcher to Commercial Dashboard */}
        <Button 
          variant="ghost"
          onClick={handleGoToDashboard}
          className={`h-9 px-4 rounded-[10px] flex items-center gap-2 ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ 
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backgroundColor: isDark ? undefined : 'transparent'
          }}
        >
          <ArrowLeft className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('quality.header.commercialDashboard')}</span>
        </Button>

        {/* Onboarding Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-9 w-9 rounded-[10px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={openOnboarding}
          title={t('onboarding.welcome.title')}
        >
          <img
            className="w-5 h-5"
            alt="Onboarding"
            src="/assets/icons/sidebar/Group 1000003266.png"
            style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
          />
        </Button>
      </div>

      <div className="flex items-center justify-end gap-3 flex-1">
        {/* Messages Button */}
        {onChatToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-9 w-9 rounded-[10px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={onChatToggle}
          >
            <MessageSquare className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </Button>
        )}

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

      {/* Onboarding Modal */}
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
    </header>
  );
};

