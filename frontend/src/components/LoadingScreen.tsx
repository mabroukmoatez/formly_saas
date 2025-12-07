import React from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { fixImageUrl } from '../lib/utils';

/**
 * Enhanced Loading Screen Component
 */
export const LoadingScreen: React.FC = () => {
  const { organization } = useOrganization();
  const { t } = useLanguage();

  /**
   * Get organization logo URL
   */
  const getLogoUrl = (): string => {
    if (organization?.organization_logo_url) {
      return organization.organization_logo_url;
    }
    return '/assets/logos/login-logo.svg';
  };

  /**
   * Get organization name
   */
  const getOrganizationName = (): string => {
    return organization?.organization_name || 'Formly';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="text-center">
        {/* Organization Logo with Spinner */}
        <div className="mb-6">
          <div className="relative w-20 h-20 mx-auto">
            <img
              className="w-full h-full object-contain"
              alt={getOrganizationName()}
              src={fixImageUrl(getLogoUrl())}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/logos/login-logo.svg';
              }}
            />
            {/* Simple loading spinner */}
            <div className="absolute inset-0 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Organization Name */}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
          {getOrganizationName()}
        </h1>

        {/* Loading Message */}
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {t('common.loadingOrganization')}...
        </p>
      </div>
    </div>
  );
};