import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useOrganization } from '../contexts/OrganizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

export const AccessDenied = (): JSX.Element => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/dashboard`);
    } else {
      navigate('/dashboard');
    }
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
              <ShieldAlert className="w-12 h-12" style={{ color: primaryColor }} />
            </div>

            {/* Title */}
            <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-4xl mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              {t('accessDenied.title')}
            </h1>

            {/* Subtitle */}
            <p className={`[font-family:'Poppins',Helvetica] text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {t('accessDenied.subtitle')}
            </p>

            {/* Info Card */}
            <div 
              className="p-6 rounded-[10px] mb-6 text-left"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                <div>
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {t('accessDenied.reasonTitle')}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {t('accessDenied.reasonText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="rounded-[10px] h-11 px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('accessDenied.goBack')}
              </Button>
              
              <Button 
                onClick={handleGoHome}
                className="rounded-[10px] h-11 px-6"
                style={{ backgroundColor: primaryColor }}
              >
                <Home className="w-4 h-4 mr-2" />
                {t('accessDenied.goHome')}
              </Button>
            </div>

            {/* Help text */}
            <p className={`text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
              {t('accessDenied.helpText')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

