import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { useOrganization } from '../contexts/OrganizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { Clock, Sparkles, ArrowRight } from 'lucide-react';

export const ComingSoon = (): JSX.Element => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

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
              <Clock className="w-12 h-12" style={{ color: primaryColor }} />
            </div>

            {/* Title */}
            <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-4xl mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              Bientôt Disponible
            </h1>

            {/* Subtitle */}
            <p className={`[font-family:'Poppins',Helvetica] text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Cette fonctionnalité est en cours de développement
            </p>

            {/* Features coming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div 
                className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div className="text-left">
                    <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Design Moderne
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Interface intuitive et élégante
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div className="text-left">
                    <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Fonctionnalités Avancées
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Outils puissants et performants
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div className="text-left">
                    <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Rapide & Fiable
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Performance optimale garantie
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div className="text-left">
                    <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Support Complet
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Documentation et assistance
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status message */}
            <div 
              className="p-4 rounded-[10px] mb-6"
              style={{ backgroundColor: `${primaryColor}10`, borderLeft: `4px solid ${primaryColor}` }}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4" style={{ color: primaryColor }} />
                <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium`} style={{ color: primaryColor }}>
                  Nous travaillons activement sur cette fonctionnalité
                </p>
              </div>
            </div>

            {/* Additional info */}
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
              Merci de votre patience. Revenez bientôt pour découvrir les nouveautés!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

