import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useQualityIndicators } from '../../hooks/useQualityIndicators';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { IndicatorSettingsModal } from '../../components/QualityDashboard/IndicatorSettingsModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, Bookmark } from 'lucide-react';

export const Indicateurs = (): JSX.Element => {
  const { indicators, loading, error, refetch } = useQualityIndicators();
  const { navigateToRoute } = useSubdomainNavigation();
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { t } = useLanguage();
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
            <p className="text-red-500">{t('quality.documents.error')}: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Page Title Header */}
      <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
        <CardHeader>
          <CardTitle className={`[font-family:'Poppins',Helvetica] font-semibold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
            {t('quality.indicators.pageTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Grid with 3 cards per row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                onClick={() => navigateToRoute(`/quality/indicateurs/${indicator.id}`)}
                className="bg-white relative rounded-[18px] cursor-pointer transition-all hover:shadow-lg"
              >
                <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
                <div className="size-full">
                  <div className="box-border content-stretch flex flex-col gap-[14px] items-start p-[24px] relative size-full">
                    {/* Top: Indicator Number + Title */}
                    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                      {/* Indicator Number Circle */}
                      <div className="content-stretch flex gap-[6.984px] items-center justify-center relative rounded-[55.87px] shrink-0 size-[48.188px]">
                        <div aria-hidden="true" className="absolute border-[#e8f0f7] border-[3.492px] border-solid inset-0 pointer-events-none rounded-[55.87px]" />
                        <p className="capitalize font-['Poppins',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[12.391px] text-black text-center text-nowrap whitespace-pre">
                          {indicator.number}
                        </p>
                      </div>
                      {/* Title */}
                      <p className="font-['Poppins',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] flex-1 line-clamp-2">
                        {indicator.title}
                      </p>
                    </div>

                    {/* Bottom: Document Counts */}
                    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                      {/* Procédures */}
                      <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[7.991px] shrink-0">
                        <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[1.229px] border-solid inset-0 pointer-events-none rounded-[7.991px]" />
                        <div className="flex flex-col items-center justify-center size-full">
                          <div className="box-border content-stretch flex flex-col font-['Poppins',sans-serif] gap-[3px] items-center justify-center leading-[normal] not-italic px-[14.752px] py-[9px] relative text-[#6a90ba] text-nowrap w-full whitespace-pre">
                            <p className="relative shrink-0 text-[14.752px] font-medium">
                              {indicator.documentCounts?.procedures || 0}
                            </p>
                            <p className="relative shrink-0 text-[10.449px]">{t('quality.indicators.procedures')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Modèles */}
                      <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[7.991px] shrink-0">
                        <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[1.229px] border-solid inset-0 pointer-events-none rounded-[7.991px]" />
                        <div className="flex flex-col items-center justify-center size-full">
                          <div className="box-border content-stretch flex flex-col font-['Poppins',sans-serif] gap-[3px] items-center justify-center leading-[normal] not-italic px-[14.752px] py-[9px] relative text-[#6a90ba] text-nowrap w-full whitespace-pre">
                            <p className="relative shrink-0 text-[14.752px] font-medium">
                              {indicator.documentCounts?.models || 0}
                            </p>
                            <p className="relative shrink-0 text-[10.449px]">{t('quality.indicators.models')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Preuves */}
                      <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[7.991px] shrink-0">
                        <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[1.229px] border-solid inset-0 pointer-events-none rounded-[7.991px]" />
                        <div className="flex flex-col items-center justify-center size-full">
                          <div className="box-border content-stretch flex flex-col font-['Poppins',sans-serif] gap-[3px] items-center justify-center leading-[normal] not-italic px-[14.752px] py-[9px] relative text-[#6a90ba] text-nowrap w-full whitespace-pre">
                            <p className="relative shrink-0 text-[14.752px] font-medium">
                              {indicator.documentCounts?.evidences || 0}
                            </p>
                            <p className="relative shrink-0 text-[10.449px]">{t('quality.indicators.proofs')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                {t('quality.indicators.settingsButton')}
              </span>
            </Button>
          </div>

          {/* Indicator Details */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card className="border border-[#e8f0f7] rounded-lg">
              <CardContent className="p-6">
                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  {t('quality.indicators.statistics')}
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                      {t('quality.indicators.completed')}
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#25c9b5] text-sm">
                      {completed} / {total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                      {t('quality.indicators.inProgress')}
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#ff7700] text-sm">
                      {inProgress} / {total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                      {t('quality.indicators.notStarted')}
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
                    {completionPercentage}{t('quality.indicators.percentCompleted')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#e8f0f7] rounded-lg">
              <CardContent className="p-6">
                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  {t('quality.indicators.qualiopiGoal')}
                </h3>
                <p className={`[font-family:'Poppins',Helvetica] font-normal text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                  {t('quality.indicators.qualiopiGoalDescription')}
                </p>
                <Button style={{ backgroundColor: primaryColor }} className="mt-4 text-white hover:opacity-90 w-full">
                  {t('quality.indicators.viewGuide')}
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

