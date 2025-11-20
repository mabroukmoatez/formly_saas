import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useQualityIndicators } from '../../hooks/useQualityIndicators';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { IndicatorSettingsModal } from '../../components/QualityDashboard/IndicatorSettingsModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2, Bookmark } from 'lucide-react';

export const Indicateurs = (): JSX.Element => {
  const { indicators, loading, error, refetch } = useQualityIndicators();
  const { navigateToRoute } = useSubdomainNavigation();
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Calculate statistics
  const completed = indicators.filter(i => i.status === 'completed').length;
  const inProgress = indicators.filter(i => i.status === 'in_progress').length;
  const notStarted = indicators.filter(i => i.status === 'not_started').length;
  const total = indicators.length;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="text-center py-8">
            <p className="text-red-500">Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Page Title Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-[#ecf1fd]'}`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Bookmark className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Mes Indicateurs
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Gérez vos indicateurs Qualiopi et suivez votre conformité
            </p>
          </div>
        </div>
      </div>

      <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
        <CardHeader>
          <CardTitle className={`[font-family:'Poppins',Helvetica] font-semibold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
            Liste des Indicateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {indicators.map((indicator) => (
              <Card
                key={indicator.id}
                onClick={() => navigateToRoute(`/quality/indicateurs/${indicator.id}`)}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  indicator.status === 'completed'
                    ? 'border-[#25c9b5] hover:border-[#25c9b5]'
                    : indicator.status === 'in_progress'
                    ? 'border-[#ff7700] hover:border-[#ff7700]'
                    : 'border-[#e8f0f7] hover:border-[#ff7700]'
                }`}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-[3.49px] ${
                    indicator.status === 'completed'
                      ? 'border-[#25c9b5] bg-[#25c9b5]/10'
                      : indicator.status === 'in_progress'
                      ? 'border-[#ff7700] bg-[#ff7700]/10'
                      : 'border-[#e8f0f7]'
                  }`}>
                <span
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-lg text-center ${
                    indicator.status === 'completed' 
                      ? 'text-[#25c9b5]' 
                      : indicator.status === 'in_progress'
                      ? 'text-[#ff7700]'
                      : 'text-black'
                  }`}
                >
                  {indicator.number}
                </span>
                {indicator.overlay_color && indicator.status === 'completed' && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: indicator.overlay_color }}
                  />
                )}
              </div>
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm text-center line-clamp-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {indicator.title}
                  </h3>
                  {indicator.documentCounts && (
                    <div className="flex items-center gap-2 text-xs [font-family:'Poppins',Helvetica]">
                      <span className="text-[#ff7700]">{indicator.documentCounts.procedures} P</span>
                      <span className="text-[#25c9b5]">{indicator.documentCounts.models} M</span>
                      <span className="text-[#d7e07f]">{indicator.documentCounts.evidences} Pr</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="bg-[#e2e2ea]" />

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="h-auto px-6 py-3 bg-[#ebf1ff] rounded-lg border-2 border-dashed border-[#6a90b9] hover:bg-[#d5e7ff] transition-colors"
              onClick={() => setShowSettingsModal(true)}
            >
              <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-base">
                Paramètres Des Indicateurs
              </span>
            </Button>
          </div>

          {/* Indicator Details */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card className="border border-[#e8f0f7] rounded-lg">
              <CardContent className="p-6">
                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Statistiques
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                      Complétés
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#25c9b5] text-sm">
                      {completed} / {total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                      En cours
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#ff7700] text-sm">
                      {inProgress} / {total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                      Non démarrés
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-sm">
                      {notStarted} / {total}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#e8f0f7]">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#25c9b5] to-[#ff7700]" 
                      style={{ width: `${completionPercentage}%` }} 
                    />
                  </div>
                  <p className={`mt-2 text-center [font-family:'Poppins',Helvetica] font-medium text-sm ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {completionPercentage}% Complété
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#e8f0f7] rounded-lg">
              <CardContent className="p-6">
                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Objectif Qualiopi
                </h3>
                <p className={`[font-family:'Poppins',Helvetica] font-normal text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                  Pour obtenir la certification Qualiopi, tous les 32 indicateurs doivent être complétés avec
                  au moins une procédure, un modèle et une preuve associés.
                </p>
                <Button style={{ backgroundColor: primaryColor }} className="mt-4 text-white hover:opacity-90 w-full">
                  Voir le guide Qualiopi
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      <IndicatorSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSuccess={() => {
          refetch();
          setShowSettingsModal(false);
        }}
      />
    </div>
  );
};

