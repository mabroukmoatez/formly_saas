import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { getQualityIndicators, updateQualityIndicator } from '../../services/qualityManagement';

interface IndicatorPersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PersonalizationAnswers {
  isExclusiveSubcontractor: boolean | null; // Question 1
  hasPrerequisites: boolean | null; // Question 2
  onlyShortFormations: boolean | null; // Question 3
  hasRNCP: boolean | null; // Question 4
  hasAlternance: boolean | null; // Question 5
  neverSubcontracts: boolean | null; // Question 6
  hasWorkPlacements: boolean | null; // Question 7
}

export const IndicatorPersonalizationModal: React.FC<IndicatorPersonalizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<PersonalizationAnswers>({
    isExclusiveSubcontractor: null,
    hasPrerequisites: null,
    onlyShortFormations: null,
    hasRNCP: null,
    hasAlternance: null,
    neverSubcontracts: null,
    hasWorkPlacements: null,
  });

  // Load current answers from indicators
  useEffect(() => {
    if (isOpen) {
      loadCurrentAnswers();
    }
  }, [isOpen]);

  const loadCurrentAnswers = async () => {
    setLoading(true);
    try {
      const response = await getQualityIndicators();
      console.log('✅ IndicatorPersonalizationModal loadCurrentAnswers response:', response);

      // Handle different response structures
      let indicatorsArray: any[] = [];

      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { indicators: [...] } }
          indicatorsArray = response.data?.indicators || response.data?.data || [];
        } else if (response.indicators && Array.isArray(response.indicators)) {
          // Structure: { indicators: [...] }
          indicatorsArray = response.indicators;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          indicatorsArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          indicatorsArray = response.data;
        }
      }

      const indicators = Array.isArray(indicatorsArray) ? indicatorsArray : [];

      // Infer answers from indicator applicability
      // Question 1: If indicators 1, 2, 3 are not applicable → isExclusiveSubcontractor = true
      const indicator1 = indicators.find((ind: any) => ind.number === 1);
      const indicator2 = indicators.find((ind: any) => ind.number === 2);
      const indicator3 = indicators.find((ind: any) => ind.number === 3);
      const isExclusiveSubcontractor = indicator1?.isApplicable === false &&
        indicator2?.isApplicable === false &&
        indicator3?.isApplicable === false;

      // Question 2: If indicator 8 is not applicable → hasPrerequisites = false
      const indicator8 = indicators.find((ind: any) => ind.number === 8);
      const hasPrerequisites = indicator8?.isApplicable !== false;

      // Question 3: If indicator 12 is not applicable → onlyShortFormations = true
      const indicator12 = indicators.find((ind: any) => ind.number === 12);
      const onlyShortFormations = indicator12?.isApplicable === false;

      // Question 4: If indicators 3, 7, 15 are applicable → hasRNCP = true
      const indicator7 = indicators.find((ind: any) => ind.number === 7);
      const indicator15 = indicators.find((ind: any) => ind.number === 15);
      const hasRNCP = indicator3?.isApplicable === true &&
        indicator7?.isApplicable === true &&
        indicator15?.isApplicable === true;

      // Question 5: If indicator 13 is applicable → hasAlternance = true
      const indicator13 = indicators.find((ind: any) => ind.number === 13);
      const hasAlternance = indicator13?.isApplicable === true;

      // Question 6: If indicator 27 is not applicable → neverSubcontracts = true
      const indicator27 = indicators.find((ind: any) => ind.number === 27);
      const neverSubcontracts = indicator27?.isApplicable === false;

      // Question 7: If indicator 28 is applicable → hasWorkPlacements = true
      const indicator28 = indicators.find((ind: any) => ind.number === 28);
      const hasWorkPlacements = indicator28?.isApplicable === true;

      setAnswers({
        isExclusiveSubcontractor: isExclusiveSubcontractor ? true : null,
        hasPrerequisites: hasPrerequisites !== undefined ? hasPrerequisites : null,
        onlyShortFormations: onlyShortFormations ? true : null,
        hasRNCP: hasRNCP ? true : null,
        hasAlternance: hasAlternance ? true : null,
        neverSubcontracts: neverSubcontracts ? true : null,
        hasWorkPlacements: hasWorkPlacements ? true : null,
      });
    } catch (err: any) {
      console.error('Error loading current answers:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de charger les indicateurs Qualiopi');
    } finally {
      setLoading(false);
    }
  };

  const calculateIndicatorApplicability = (): Record<number, boolean> => {
    const updates: Record<number, boolean> = {};

    // Question 1: Sous-traitant exclusif → Indicateurs 1, 2, 3 non applicables
    if (answers.isExclusiveSubcontractor === true) {
      updates[1] = false;
      updates[2] = false;
      updates[3] = false;
    }

    // Question 2: Prérequis → Indicateur 8 non applicable si false
    if (answers.hasPrerequisites === false) {
      updates[8] = false;
    }

    // Question 3: Formations ≤ 2 jours → Indicateur 12 non applicable
    if (answers.onlyShortFormations === true) {
      updates[12] = false;
    }

    // Question 4: RNCP → Indicateurs 3, 7, 15 applicables si true
    if (answers.hasRNCP === true) {
      updates[3] = true;
      updates[7] = true;
      updates[15] = true;
    }

    // Question 5: Alternance → Indicateur 13 applicable si true
    if (answers.hasAlternance === true) {
      updates[13] = true;
    }

    // Question 6: Jamais sous-traitance → Indicateur 27 non applicable
    if (answers.neverSubcontracts === true) {
      updates[27] = false;
    }

    // Question 7: Périodes en entreprise → Indicateur 28 applicable si true
    if (answers.hasWorkPlacements === true) {
      updates[28] = true;
    }

    return updates;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = calculateIndicatorApplicability();
      const response = await getQualityIndicators();
      console.log('✅ IndicatorPersonalizationModal handleSave response:', response);

      // Handle different response structures
      let indicatorsArray: any[] = [];

      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { indicators: [...] } }
          indicatorsArray = response.data?.indicators || response.data?.data || [];
        } else if (response.indicators && Array.isArray(response.indicators)) {
          // Structure: { indicators: [...] }
          indicatorsArray = response.indicators;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          indicatorsArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          indicatorsArray = response.data;
        }
      }

      const indicators = Array.isArray(indicatorsArray) ? indicatorsArray : [];

      // Update indicators
      const promises = Object.entries(updates).map(([number, isApplicable]) => {
        const indicator = indicators.find((ind: any) => ind.number === parseInt(number));
        if (indicator) {
          return updateQualityIndicator(indicator.id, { isApplicable });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      success('Personnalisation enregistrée avec succès');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving personalization:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateAnswer = (key: keyof PersonalizationAnswers, value: boolean | null) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
            Définir les indicateurs qui vous concernent
          </DialogTitle>
          <DialogDescription className={`${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
            Répondez aux questions pour personnaliser les indicateurs Qualiopi selon votre activité
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Question 1 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vous êtes EXCLUSIVEMENT sous-traitant (jamais de client en direct) ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si oui, les indicateurs 1, 2, 3 ne seront pas applicables
              </p>
              <RadioGroup
                value={answers.isExclusiveSubcontractor === null ? '' : answers.isExclusiveSubcontractor ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('isExclusiveSubcontractor', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q1-yes" />
                  <Label htmlFor="q1-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q1-no" />
                  <Label htmlFor="q1-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 2 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vos formations nécessitent des prérequis à l'entrée ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si non, l'indicateur 8 ne sera pas applicable
              </p>
              <RadioGroup
                value={answers.hasPrerequisites === null ? '' : answers.hasPrerequisites ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('hasPrerequisites', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q2-yes" />
                  <Label htmlFor="q2-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q2-no" />
                  <Label htmlFor="q2-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 3 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vous ne proposez QUE des formations égales ou inférieures à 2 jours ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si oui, l'indicateur 12 ne sera pas applicable
              </p>
              <RadioGroup
                value={answers.onlyShortFormations === null ? '' : answers.onlyShortFormations ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('onlyShortFormations', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q3-yes" />
                  <Label htmlFor="q3-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q3-no" />
                  <Label htmlFor="q3-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 4 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vous proposez des formations menant à une certification professionnelle RNCP ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si oui, les indicateurs 3, 7, 15 seront applicables
              </p>
              <RadioGroup
                value={answers.hasRNCP === null ? '' : answers.hasRNCP ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('hasRNCP', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q4-yes" />
                  <Label htmlFor="q4-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q4-no" />
                  <Label htmlFor="q4-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 5 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vous proposez des prestations de formation en alternance ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si oui, l'indicateur 13 sera applicable
              </p>
              <RadioGroup
                value={answers.hasAlternance === null ? '' : answers.hasAlternance ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('hasAlternance', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q5-yes" />
                  <Label htmlFor="q5-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q5-no" />
                  <Label htmlFor="q5-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 6 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vous ne faites JAMAIS appel à la sous-traitance ou au portage ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si oui, l'indicateur 27 ne sera pas applicable
              </p>
              <RadioGroup
                value={answers.neverSubcontracts === null ? '' : answers.neverSubcontracts ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('neverSubcontracts', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q6-yes" />
                  <Label htmlFor="q6-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q6-no" />
                  <Label htmlFor="q6-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 7 */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Label className={`text-base font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                Vos actions incluent des périodes en entreprise ou en situation de travail (stage, alternance, AFEST) ?
              </Label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                Si oui, l'indicateur 28 sera applicable
              </p>
              <RadioGroup
                value={answers.hasWorkPlacements === null ? '' : answers.hasWorkPlacements ? 'yes' : 'no'}
                onValueChange={(value) => updateAnswer('hasWorkPlacements', value === 'yes' ? true : value === 'no' ? false : null)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="q7-yes" />
                  <Label htmlFor="q7-yes" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="q7-no" />
                  <Label htmlFor="q7-no" className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Non</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className={isDark ? 'border-gray-600 hover:bg-gray-700' : ''}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: primaryColor }}
            className="text-white hover:opacity-90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

