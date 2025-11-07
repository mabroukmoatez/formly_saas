import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface FooterProps {
  className?: string;
}

export const CommercialFooter: React.FC<FooterProps> = ({ className }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();

  // Get copyright text from organization or use default
  const getCopyrightText = (): string => {
    if (organization?.custom_footer_text) {
      return organization.custom_footer_text;
    }
    return `© ${new Date().getFullYear()} ${organization?.organization_name || 'Formly'}. All rights reserved.`;
  };

  return (
    <footer className={`w-full py-4 px-6 border-t transition-colors flex-shrink-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            className="w-6 h-6"
            alt={`${organization?.organization_name || 'Formly'} logo`}
            src={organization?.organization_logo_url || '/assets/logos/formly-logo.png'}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/assets/logos/formly-logo.png';
            }}
          />
          <span className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {organization?.organization_name || 'Formly'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className={`text-xs transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {getCopyrightText()}
          </span>
        </div>
      </div>
    </footer>
  );
};
