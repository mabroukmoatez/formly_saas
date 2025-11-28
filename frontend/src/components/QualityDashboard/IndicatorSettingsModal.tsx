import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/toast';
import { getQualityIndicators, updateQualityIndicator, batchUpdateIndicators } from '../../services/qualityManagement';
import { Loader2, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { QualityIndicator } from '../../services/qualityManagement';
import { InfoTooltip } from '../ui/info-tooltip';

interface IndicatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TrainingCategory {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface PersonalizationQuestion {
  id: string;
  question: string;
  toggleValue: boolean;
  affectedIndicators: number[];
  indicatorAction: 'activate' | 'deactivate';
}

export const IndicatorSettingsModal: React.FC<IndicatorSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [indicators, setIndicators] = useState<QualityIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);

  // Training categories
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>([
    {
      id: 'actions-formation',
      name: 'Actions de formation',
      description: 'Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.',
      selected: true,
    },
    {
      id: 'bilan-competences',
      name: 'Bilan de compétences',
      description: 'Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.',
      selected: false,
    },
    {
      id: 'vae',
      name: 'Validation des acquis de l\'expérience',
      description: 'Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.',
      selected: false,
    },
    {
      id: 'cfa',
      name: 'CFA',
      description: 'Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.',
      selected: false,
    },
  ]);

  // Personalization questions
  const [questions, setQuestions] = useState<PersonalizationQuestion[]>([
    {
      id: 'q1',
      question: 'Vous êtes EXCLUSIVEMENT sous-traitant (jamais de client en direct) ?',
      toggleValue: true,
      affectedIndicators: [1, 2, 3],
      indicatorAction: 'deactivate',
    },
    {
      id: 'q2',
      question: 'Vos formations nécessitent des prérequis à l\'entrée ?',
      toggleValue: false,
      affectedIndicators: [8],
      indicatorAction: 'activate',
    },
    {
      id: 'q3',
      question: 'Vous ne proposez QUE des formations égales ou inférieures à 2 jours ?',
      toggleValue: false,
      affectedIndicators: [12],
      indicatorAction: 'deactivate',
    },
    {
      id: 'q4',
      question: 'Vous proposez des formations menant à une certification professionnelle RNCP ?',
      toggleValue: true,
      affectedIndicators: [3, 7, 15],
      indicatorAction: 'activate',
    },
    {
      id: 'q5',
      question: 'Vous proposez des prestations de formation en alternance ?',
      toggleValue: false,
      affectedIndicators: [13],
      indicatorAction: 'activate',
    },
    {
      id: 'q6',
      question: 'Vous ne faites JAMAIS appel à la sous-traitance ou au portage ?',
      toggleValue: false,
      affectedIndicators: [27],
      indicatorAction: 'deactivate',
    },
    {
      id: 'q7',
      question: 'Vos actions incluent des périodes en entreprise ou en situation de travail(stage, alternance, AFEST) ?',
      toggleValue: true,
      affectedIndicators: [28],
      indicatorAction: 'activate',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadIndicators();
    }
  }, [isOpen]);

  const loadIndicators = async () => {
    setLoadingIndicators(true);
    try {
      const response = await getQualityIndicators();
      console.log('✅ IndicatorSettingsModal loadIndicators response:', response);
      
      // Handle different response structures
      let indicatorsArray: QualityIndicator[] = [];
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { indicators: [...] } }
          indicatorsArray = response.data.indicators || response.data.data || [];
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
      
      const loadedIndicators = Array.isArray(indicatorsArray) ? indicatorsArray : [];
      setIndicators(loadedIndicators);
      
      // Synchronize questions with current indicator states
      if (loadedIndicators.length > 0) {
        console.log('🔄 Synchronizing questions from indicators:', loadedIndicators.length);
        synchronizeQuestionsFromIndicators(loadedIndicators);
      }
    } catch (err: any) {
      console.error('Error loading indicators:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de charger les indicateurs Qualiopi');
    } finally {
      setLoadingIndicators(false);
    }
  };

  const synchronizeQuestionsFromIndicators = (indicators: QualityIndicator[]) => {
    // Infer question values from indicator applicability
    setQuestions((prevQuestions) => {
      const updatedQuestions = prevQuestions.map((question) => {
        let newToggleValue = question.toggleValue; // Keep current value as default
        
        if (question.id === 'q1') {
          // Question 1: Sous-traitant exclusif → Indicateurs 1, 2, 3 non applicables
          const indicator1 = indicators.find((ind) => ind.number === 1);
          const indicator2 = indicators.find((ind) => ind.number === 2);
          const indicator3 = indicators.find((ind) => ind.number === 3);
          newToggleValue = indicator1?.isApplicable === false && 
                          indicator2?.isApplicable === false && 
                          indicator3?.isApplicable === false;
        } else if (question.id === 'q2') {
          // Question 2: Prérequis → Indicateur 8 applicable si true
          const indicator8 = indicators.find((ind) => ind.number === 8);
          newToggleValue = indicator8?.isApplicable === true;
        } else if (question.id === 'q3') {
          // Question 3: Formations ≤ 2 jours → Indicateur 12 non applicable si true
          const indicator12 = indicators.find((ind) => ind.number === 12);
          newToggleValue = indicator12?.isApplicable === false;
        } else if (question.id === 'q4') {
          // Question 4: RNCP → Indicateurs 3, 7, 15 applicables si true
          // Note: Indicator 3 can also be affected by q1, so we check if at least 7 and 15 are applicable
          // If 3 is applicable AND (7 and 15 are applicable), then RNCP is likely true
          const indicator3 = indicators.find((ind) => ind.number === 3);
          const indicator7 = indicators.find((ind) => ind.number === 7);
          const indicator15 = indicators.find((ind) => ind.number === 15);
          // If 7 and 15 are both applicable, and 3 is also applicable, assume RNCP is true
          // (Even if 3 is affected by q1, if it's still applicable, RNCP likely overrides)
          newToggleValue = indicator7?.isApplicable === true && 
                          indicator15?.isApplicable === true &&
                          indicator3?.isApplicable === true;
        } else if (question.id === 'q5') {
          // Question 5: Alternance → Indicateur 13 applicable si true
          const indicator13 = indicators.find((ind) => ind.number === 13);
          newToggleValue = indicator13?.isApplicable === true;
        } else if (question.id === 'q6') {
          // Question 6: Jamais sous-traitance → Indicateur 27 non applicable si true
          const indicator27 = indicators.find((ind) => ind.number === 27);
          newToggleValue = indicator27?.isApplicable === false;
        } else if (question.id === 'q7') {
          // Question 7: Périodes en entreprise → Indicateur 28 applicable si true
          const indicator28 = indicators.find((ind) => ind.number === 28);
          newToggleValue = indicator28?.isApplicable === true;
        }
        
        return {
          ...question,
          toggleValue: newToggleValue
        };
      });
      
      console.log('✅ Questions synchronized:', updatedQuestions.map(q => ({
        id: q.id,
        toggleValue: q.toggleValue
      })));
      
      return updatedQuestions;
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setTrainingCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
      )
    );
  };

  const handleQuestionToggle = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, toggleValue: !q.toggleValue } : q
      )
    );
  };

  const getIndicatorStatus = (indicatorNumber: number): 'active' | 'inactive' | 'default' => {
    // Check all questions that affect this indicator
    const affectingQuestions = questions.filter(q => q.affectedIndicators.includes(indicatorNumber));
    
    if (affectingQuestions.length === 0) {
      return 'default'; // Not affected by any question
    }
    
    // Priority: 'activate' actions take precedence over 'deactivate'
    // If any 'activate' question is true, indicator should be active
    const hasActiveActivation = affectingQuestions.some(
      q => q.indicatorAction === 'activate' && q.toggleValue === true
    );
    
    if (hasActiveActivation) {
      return 'active';
    }
    
    // If any 'deactivate' question is true, indicator should be inactive
    const hasActiveDeactivation = affectingQuestions.some(
      q => q.indicatorAction === 'deactivate' && q.toggleValue === true
    );
    
    if (hasActiveDeactivation) {
      return 'inactive';
    }
    
    // Default: keep current state (applicable by default for common indicators)
    return 'default';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calculate which indicators should be applicable based on questions
      const indicatorUpdates: Record<number, boolean> = {};
      
      // Process all indicators
      indicators.forEach((indicator) => {
        const status = getIndicatorStatus(indicator.number || 0);
        
        if (status === 'active') {
          // Explicitly activate
          indicatorUpdates[indicator.id] = true;
        } else if (status === 'inactive') {
          // Explicitly deactivate
          indicatorUpdates[indicator.id] = false;
        } else {
          // Default: for common indicators (1-22), they should be applicable by default
          // For specific indicators (23-32), they should be applicable only if explicitly activated
          const isCommonIndicator = indicator.number >= 1 && indicator.number <= 22;
          
          if (isCommonIndicator) {
            // Common indicators (1-22) are applicable by default
            // Keep current value if it exists, otherwise default to true
            indicatorUpdates[indicator.id] = indicator.isApplicable !== false;
          } else {
            // Specific indicators (23-32) are not applicable by default
            // Keep current value if it exists, otherwise default to false
            indicatorUpdates[indicator.id] = indicator.isApplicable === true;
          }
        }
      });

      console.log('📊 Indicator updates to apply:', indicatorUpdates);

      // Prepare batch update payload
      const batchUpdates = Object.entries(indicatorUpdates).map(([id, isApplicable]) => ({
        id: parseInt(id),
        isApplicable
      }));

      // Use batch update to avoid infinite loops in backend
      // This sends all updates in a single request instead of multiple parallel requests
      try {
        await batchUpdateIndicators(batchUpdates);
      } catch (batchError: any) {
        // Fallback: if batch endpoint doesn't exist, update sequentially with delays
        console.warn('Batch update failed, falling back to sequential updates:', batchError);
        
        // Update indicators sequentially with small delays to avoid backend loops
        for (const [id, isApplicable] of Object.entries(indicatorUpdates)) {
          try {
            await updateQualityIndicator(parseInt(id), { isApplicable });
            // Small delay between updates to prevent backend overload
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err: any) {
            console.error(`Failed to update indicator ${id}:`, err);
            // Continue with other updates even if one fails
          }
        }
      }
      
      console.log('✅ Indicator updates completed:', {
        totalUpdated: Object.keys(indicatorUpdates).length,
        updates: indicatorUpdates
      });
      
      success('Paramètres enregistrés avec succès');
      
      // Call onSuccess callback to refresh dashboard
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Définir les indicateurs qui vous concernent
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Personnalisez votre système qualité en sélectionnant les indicateurs applicables à votre organisme
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Section 1: Training Categories */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica] font-semibold text-lg`}>
                Catégorie d'action de formation
              </Label>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica] text-sm`}>
              Choisissez la catégorie d'actions de formation qui vous concerne :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trainingCategories.map((category) => (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all ${
                    category.selected
                      ? isDark
                        ? 'border-[#007aff] bg-blue-900/20'
                        : 'border-[#007aff] bg-blue-50'
                      : isDark
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={category.selected}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                          {category.name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div className={`flex items-start gap-2 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Formly Propose par défaut les 22 Indicateurs Communs. C'est à dire obligatoires lors de l'audit. ici vous pouvez sélectionner les indicateurs spécifiques qui vous concernent OU personnaliser au mieux l'application pour une utilisation optimale.
            </p>
          </div>

          {/* Section 2: Personalization Questions */}
          <div className="flex flex-col gap-4">
            <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica] font-semibold text-lg`}>
              Questions de personnalisation
            </Label>
            {loadingIndicators ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => {
                  const affectedIndicators = indicators.filter((ind) =>
                    question.affectedIndicators.includes(ind.number || 0)
                  );
                  
                  return (
                    <Card
                      key={question.id}
                      className={`${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                              {question.question}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {affectedIndicators.map((indicator) => {
                                const status = getIndicatorStatus(indicator.number || 0);
                                const isActive = question.toggleValue && question.indicatorAction === 'activate';
                                const isInactive = question.toggleValue && question.indicatorAction === 'deactivate';
                                
                                return (
                                  <Badge
                                    key={indicator.id}
                                    className={
                                      isInactive
                                        ? 'bg-orange-500 text-white'
                                        : isActive
                                        ? 'bg-green-500 text-white'
                                        : 'bg-blue-500 text-white'
                                    }
                                  >
                                    {indicator.number}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <Switch
                            checked={question.toggleValue}
                            onCheckedChange={() => handleQuestionToggle(question.id)}
                            style={question.toggleValue ? { backgroundColor: primaryColor } : undefined}
                            className={question.toggleValue ? '' : ''}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className={isDark ? 'border-gray-600' : ''}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4A8AFF] hover:bg-[#3a7aef] text-white w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

