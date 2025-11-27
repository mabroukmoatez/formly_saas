import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { useToast } from '../ui/toast';
import { getQualityIndicators, updateQualityIndicator } from '../../services/qualityManagement';
import { Loader2, Info, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { QualityIndicator } from '../../services/qualityManagement';

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
  hint: string;
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
      id: 'vae',
      name: "Validation des acquis de l'expérience - VAE",
      description: 'Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.',
      selected: false,
    },
    {
      id: 'bilan-competences',
      name: 'Bilan de compétences',
      description: 'Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.',
      selected: false,
    },
    {
      id: 'cfa',
      name: "Centre de formation d'apprentis - CFA",
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
      hint: '(Désactivation des indicateurs 1, 2 et 3)',
    },
    {
      id: 'q2',
      question: "Vos formations nécessitent des prérequis à l'entrée ?",
      toggleValue: false,
      affectedIndicators: [8],
      indicatorAction: 'activate',
      hint: "(Activation de l'indicateur 8)",
    },
    {
      id: 'q3',
      question: 'Vous ne proposez QUE des formations égales ou inférieures à 2 jours ?',
      toggleValue: false,
      affectedIndicators: [12],
      indicatorAction: 'deactivate',
      hint: "(Désactivation l'indicateur 12)",
    },
    {
      id: 'q4',
      question: 'Vous proposez des formations menant à une certification professionnelle RNCP ?',
      toggleValue: true,
      affectedIndicators: [3, 7, 15],
      indicatorAction: 'activate',
      hint: '(Activation des indicateurs 3, 7 et 16)',
    },
    {
      id: 'q5',
      question: 'Vous proposez des prestations de formation en alternance ?',
      toggleValue: false,
      affectedIndicators: [13],
      indicatorAction: 'activate',
      hint: "(Activation de l'indicateur 13)",
    },
    {
      id: 'q6',
      question: 'Vous ne faites JAMAIS appel à la sous-traitance ou au portage ?',
      toggleValue: false,
      affectedIndicators: [27],
      indicatorAction: 'deactivate',
      hint: "(Désactivation de l'indicateur 27)",
    },
    {
      id: 'q7',
      question: 'Vos actions incluent des périodes en entreprise ou en situation de travail(stage, alternance, AFEST) ?',
      toggleValue: true,
      affectedIndicators: [28],
      indicatorAction: 'activate',
      hint: "(Activation de l'indicateur 28)",
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

      setIndicators(Array.isArray(indicatorsArray) ? indicatorsArray : []);
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
      showError('Erreur', err.message || "Une erreur est survenue lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white w-[90vw] max-w-[850px] max-h-[90vh] overflow-y-auto rounded-[18px] shadow-[0px_0px_75.7px_0px_rgba(25,41,74,0.09)] p-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-[13.33px] top-[11.48px] size-[30.667px] bg-[#e8f0f7] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity z-10"
        >
          <X className="w-4 h-4 text-[#6a90ba]" strokeWidth={2} />
        </button>

        <div className="box-border content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[32px] relative size-full">
          {/* Title */}
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <p className="font-['Poppins',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] text-nowrap whitespace-pre">
              Définir les indicateurs qui vous concernent
            </p>
          </div>

          {/* Main Content */}
          <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
            {/* Training Categories Section */}
            <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
              <div className="relative rounded-[18px] shrink-0 w-full border border-[#dbd9d9]">
                <div className="size-full">
                  <div className="box-border content-stretch flex flex-col gap-[16px] items-start p-[18px] relative w-full">
                    <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[normal] not-italic relative shrink-0 w-full">
                      <p className="font-['Poppins',sans-serif] font-medium relative text-[#19294a] text-[15px]">
                        Categorie d'action de formation
                      </p>
                      <p className="font-['Poppins',sans-serif] font-normal relative text-[#6a90ba] text-[11px] w-full">
                        {`Choisissez la catégorie d'actions de formation qui vous concerne (Une ou plusieurs)  : `}
                      </p>
                    </div>

                    {/* Categories Grid */}
                    <div className="content-stretch flex flex-wrap gap-[10px] items-start relative shrink-0 w-full">
                      {/* Left Column */}
                      <div className="flex-1 min-w-[280px] content-stretch flex flex-col gap-[10px] items-start relative">
                        {trainingCategories.slice(0, 2).map((category) => (
                          <div
                            key={category.id}
                            className={`${category.selected ? 'bg-[#ebf1ff] border-[#007aff]' : 'bg-neutral-50 border-[#d3d3e8]'
                              } relative rounded-[18px] shrink-0 w-full border cursor-pointer transition-all hover:opacity-90`}
                            onClick={() => handleCategoryToggle(category.id)}
                          >
                            <div className="flex flex-row items-center size-full">
                              <div className="box-border content-stretch flex gap-[16px] items-center pl-[7px] pr-[26px] py-[16px] relative w-full">
                                <div className="content-stretch flex flex-col items-start justify-center relative shrink-0">
                                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                                    <p className="font-['Poppins',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] text-nowrap whitespace-pre">
                                      {category.name}
                                    </p>
                                  </div>
                                  <div className="content-stretch flex gap-[7px] items-center relative shrink-0">
                                    <p className="font-['Poppins',sans-serif] font-normal leading-[14px] not-italic relative shrink-0 text-[#5c677e] text-[11px] max-w-[317.704px]">
                                      {category.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Column */}
                      <div className="flex-1 min-w-[280px] content-stretch flex flex-col gap-[10px] items-start relative">
                        {trainingCategories.slice(2, 4).map((category) => (
                          <div
                            key={category.id}
                            className={`${category.selected ? 'bg-[#ebf1ff] border-[#007aff]' : 'bg-neutral-50 border-[#d3d3e8]'
                              } relative rounded-[18px] shrink-0 w-full border cursor-pointer transition-all hover:opacity-90`}
                            onClick={() => handleCategoryToggle(category.id)}
                          >
                            <div className="flex flex-row items-center size-full">
                              <div className="box-border content-stretch flex gap-[16px] items-center pl-[7px] pr-[26px] py-[16px] relative w-full">
                                <div className="content-stretch flex flex-col items-start justify-center relative flex-1 min-w-0">
                                  <div className="content-stretch flex gap-[8px] items-center relative w-full">
                                    <p className="font-['Poppins',sans-serif] font-medium leading-[normal] not-italic relative text-[#19294a] text-[15px] break-words">
                                      {category.name}
                                    </p>
                                  </div>
                                  <div className="content-stretch flex gap-[7px] items-start relative w-full">
                                    <p className="font-['Poppins',sans-serif] font-normal leading-[14px] not-italic relative text-[#5c677e] text-[11px] break-words">
                                      {category.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[13.333px]">
                  <Info className="block size-full text-[#6a90ba]" />
                </div>
                <p className="font-['Poppins',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[11px] text-center max-w-[600px]">
                  {`Formly Propose par défaut les 22 Indicateurs Communs C'est à dire obligatoires lors de l'audit.`}
                  <br />
                  Ici vous pouvez sélectionner les indicateurs spécifiques qui vous concernent OU personnaliser au mieux l'application pour une utilisation optimale.
                </p>
              </div>
            </div>

            {/* Questions Section */}
            {loadingIndicators ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
              </div>
            ) : (
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                {questions.map((question, index) => {
                  const affectedIndicators = indicators.filter((ind) =>
                    question.affectedIndicators.includes(ind.number || 0)
                  );

                  return (
                    <React.Fragment key={question.id}>
                      {/* Question Row */}
                      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                          <p className="font-['Poppins',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">
                            {question.question}
                          </p>
                          <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full flex-wrap">
                            <Info className="shrink-0 size-[13.333px] text-[#6a90ba]" />
                            <p className="font-['Poppins',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px]">
                              {question.hint}
                            </p>
                            {affectedIndicators.map((indicator) => {
                              const isActive = question.toggleValue && question.indicatorAction === 'activate';
                              const isInactive = question.toggleValue && question.indicatorAction === 'deactivate';
                              const bgColor = isInactive ? '#ff7700' : isActive ? '#26c9b6' : '#007aff';

                              return (
                                <div
                                  key={indicator.id}
                                  className="content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]"
                                  style={{ backgroundColor: bgColor }}
                                >
                                  <p className="capitalize font-['Poppins',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">
                                    {indicator.number}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <Switch
                          checked={question.toggleValue}
                          onCheckedChange={() => handleQuestionToggle(question.id)}
                          style={question.toggleValue ? { backgroundColor: primaryColor } : undefined}
                          className="h-[26.667px] w-[52px]"
                        />
                      </div>

                      {/* Separator Line */}
                      {index < questions.length - 1 && (
                        <div className="h-0 relative shrink-0 w-full">
                          <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                              <line stroke="#E4E5E7" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Valider Button */}
          <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] items-center justify-center px-[16px] py-[10px] relative rounded-[50px] shrink-0 w-[292px] cursor-pointer hover:opacity-90 transition-opacity" onClick={handleSave}>
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <p className="capitalize font-['Poppins',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[19px] text-nowrap text-white whitespace-pre">
                  Enregistrement...
                </p>
              </>
            ) : (
              <p className="capitalize font-['Poppins',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[19px] text-nowrap text-white whitespace-pre">
                Valider
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
