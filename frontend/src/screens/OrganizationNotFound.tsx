import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2, Home, AlertTriangle } from 'lucide-react';

export const OrganizationNotFound = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  // Default colors when organization is not available
  const primaryColor = '#007aff';
  const secondaryColor = '#6a90b9';

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="px-[27px] py-8">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] max-w-2xl w-full ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardContent className="p-12 text-center">
            {/* Icon */}
            <div 
              className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Building2 className="w-12 h-12" style={{ color: primaryColor }} />
            </div>

            {/* Title */}
            <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-4xl mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              {t('organizationNotFound.title')}
            </h1>

            {/* Subtitle */}
            <p className={`[font-family:'Poppins',Helvetica] text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {t('organizationNotFound.subtitle')}
            </p>

            {/* Info Card */}
            <div 
              className="p-6 rounded-[10px] mb-6 text-left"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                <div>
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {t('organizationNotFound.reasonTitle')}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {t('organizationNotFound.reasonText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-center">
              <Button 
                onClick={handleGoHome}
                className="rounded-[10px] h-11 px-6"
                style={{ backgroundColor: primaryColor }}
              >
                <Home className="w-4 h-4 mr-2" />
                {t('organizationNotFound.goHome')}
              </Button>
            </div>

            {/* Help text */}
            <p className={`text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
              {t('organizationNotFound.helpText')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
















