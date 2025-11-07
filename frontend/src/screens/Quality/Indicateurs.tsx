import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useQualityIndicators } from '../../hooks/useQualityIndicators';
import { Loader2 } from 'lucide-react';

export const Indicateurs = (): JSX.Element => {
  const { indicators, loading, error } = useQualityIndicators();

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
      <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
        <CardHeader>
          <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-2xl">
            Indicateurs Qualiopi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-4">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className={`relative flex items-center justify-center w-16 h-16 rounded-full border-[3.49px] cursor-pointer transition-all ${
                  indicator.status === 'completed'
                    ? 'border-[#25c9b5] bg-[#25c9b5]/10 hover:bg-[#25c9b5]/20'
                    : indicator.status === 'in_progress'
                    ? 'border-[#ff7700] bg-[#ff7700]/10 hover:bg-[#ff7700]/20'
                    : 'border-[#e8f0f7] hover:border-[#ff7700]'
                }`}
              >
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
            ))}
          </div>

          <Separator className="bg-[#e2e2ea]" />

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="h-auto px-6 py-3 bg-[#ebf1ff] rounded-lg border-2 border-dashed border-[#6a90b9] hover:bg-[#d5e7ff] transition-colors"
              onClick={() => console.log('Navigate to indicator settings')}
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
                <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg mb-2">
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
                  <p className="mt-2 text-center [font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-sm">
                    {completionPercentage}% Complété
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#e8f0f7] rounded-lg">
              <CardContent className="p-6">
                <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg mb-2">
                  Objectif Qualiopi
                </h3>
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-sm mb-4">
                  Pour obtenir la certification Qualiopi, tous les 32 indicateurs doivent être complétés avec
                  au moins une procédure, un modèle et une preuve associés.
                </p>
                <Button className="mt-4 bg-[#ff7700] hover:bg-[#e66900] text-white w-full">
                  Voir le guide Qualiopi
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

