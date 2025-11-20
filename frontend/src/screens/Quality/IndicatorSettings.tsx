import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useQualityIndicators } from '../../hooks/useQualityIndicators';
import { updateQualityIndicator } from '../../services/qualityManagement';
import { Loader2, Save } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

export const IndicatorSettings = (): JSX.Element => {
  const { indicators, loading, error, refetch } = useQualityIndicators();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [applicableStates, setApplicableStates] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (indicators.length > 0) {
      const states: Record<number, boolean> = {};
      indicators.forEach((indicator) => {
        // Handle both isApplicable field and check if indicator is marked as applicable
        states[indicator.id] = indicator.isApplicable !== false && indicator.isApplicable !== undefined 
          ? indicator.isApplicable 
          : true; // Default to true if not set
      });
      setApplicableStates(states);
    }
  }, [indicators]);

  const handleToggle = (indicatorId: number) => {
    setApplicableStates((prev) => {
      const newState = { ...prev, [indicatorId]: !prev[indicatorId] };
      setHasChanges(true);
      return newState;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(applicableStates).map(([id, isApplicable]) => ({
        id: parseInt(id),
        isApplicable,
      }));

      // Update each indicator
      const promises = updates.map((update) =>
        updateQualityIndicator(update.id, { isApplicable: update.isApplicable })
      );

      await Promise.all(promises);
      success('Paramètres enregistrés avec succès');
      setHasChanges(false);
      refetch();
    } catch (err: any) {
      console.error('Error saving indicator settings:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
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
        <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
          <CardContent className="text-center py-8">
            <p className={`${isDark ? 'text-red-400' : 'text-red-500'}`}>Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
          Paramètres des Indicateurs
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-[#6a90b9]'} [font-family:'Poppins',Helvetica]`}>
          Configurez l'applicabilité de chaque indicateur Qualiopi pour votre organisme
        </p>
      </div>

      <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={`${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Liste des Indicateurs
          </CardTitle>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-[#ff7700] hover:bg-[#e66900] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      applicableStates[indicator.id]
                        ? 'border-[#25c9b5] bg-[#25c9b5]/10'
                        : 'border-gray-400 bg-gray-200'
                    }`}
                  >
                    <span
                      className={`[font-family:'Poppins',Helvetica] font-semibold ${
                        applicableStates[indicator.id] ? 'text-[#25c9b5]' : 'text-gray-500'
                      }`}
                    >
                      {indicator.number}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                      {indicator.title}
                    </h3>
                    {indicator.description && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                        {indicator.description.substring(0, 100)}
                        {indicator.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor={`indicator-${indicator.id}`}
                    className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}
                  >
                    {applicableStates[indicator.id] ? 'Applicable' : 'Non applicable'}
                  </Label>
                  <Switch
                    id={`indicator-${indicator.id}`}
                    checked={applicableStates[indicator.id] || false}
                    onCheckedChange={() => handleToggle(indicator.id)}
                    className={isDark ? 'data-[state=checked]:bg-[#ff7700]' : ''}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

