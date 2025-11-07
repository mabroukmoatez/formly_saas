import React from 'react';
import { Button } from '../ui/button';
import { Stepper, ProgressBars } from '../ui/stepper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface QuizCreationHeaderProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (stepNumber: number) => void;
  onAutoSave?: () => void;
  onSaveDraft?: () => void;
  isAutoSaving?: boolean;
  isSavingDraft?: boolean;
  quizData: {
    title: string;
    duration: number;
    total_questions: number;
  };
}

const steps = [
  { number: 1, label: 'Informations du Quiz' },
  { number: 2, label: 'Création des Questions' },
];

export const QuizCreationHeader: React.FC<QuizCreationHeaderProps> = ({
  currentStep,
  totalSteps,
  onStepClick,
  onAutoSave,
  onSaveDraft,
  isAutoSaving = false,
  isSavingDraft = false,
  quizData,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Calculate real progress based on quiz completion
  const calculateProgress = () => {
    if (currentStep === 1) {
      // Step 1: Calculate based on basic info
      const totalFields = 2; // title, duration
      let completedFields = 0;
      
      if (quizData.title.trim()) completedFields++;
      if (quizData.duration > 0) completedFields++;
      
      return Math.round((completedFields / totalFields) * 100);
    } else if (currentStep === 2) {
      // Step 2: Calculate based on questions added
      if (quizData.total_questions === 0) return 0;
      if (quizData.total_questions >= 5) return 100;
      return Math.round((quizData.total_questions / 5) * 100);
    }
    return 0;
  };

  const progressPercentage = calculateProgress();

  return (
    <section className="relative w-full">
      <div 
        className={`flex flex-col w-full items-end justify-between px-[43px] py-5 translate-y-[-1rem] animate-fade-in opacity-0 ${
          isDark ? 'bg-gradient-to-br from-gray-800/20 to-gray-900/30' : 'bg-gradient-to-br from-transparent to-gray-50/20'
        }`}
        style={{
          background: isDark 
            ? `linear-gradient(138deg, rgba(31,41,55,0.2) 0%, rgba(17,24,39,0.3) 100%)`
            : `linear-gradient(138deg, rgba(255,255,255,0) 0%, ${primaryColor}06 100%)`
        }}
      >
        {/* Action Buttons */}
        <div className="inline-flex items-center gap-2 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
          <Button
            variant="outline"
            onClick={onAutoSave}
            disabled={isAutoSaving}
            className={`h-8 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full hover:opacity-80 transition-colors ${
              isDark ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-transparent'
            }`}
            style={{ 
              borderColor: secondaryColor, 
              color: secondaryColor,
              backgroundColor: isDark ? '#1f2937' : 'transparent'
            }}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="[font-family:'Poppins',Helvetica] font-medium text-sm">
              {isAutoSaving ? t('common.saving') : t('courseCreation.autoSave')}
            </span>
          </Button>

          <Button
            onClick={onSaveDraft}
            disabled={isSavingDraft}
            className="h-8 gap-2 px-3 py-1.5 rounded-full transition-colors hover:opacity-90"
            style={{ 
              backgroundColor: primaryColor,
              color: 'white',
              border: 'none'
            }}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" />
              <path d="M6 8h8v2H6V8zm0 3h8v2H6v-2z" />
            </svg>
            <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-sm">
              {isSavingDraft ? t('common.saving') : t('courseCreation.draft')}
            </span>
          </Button>
        </div>

        {/* Stepper and Progress */}
        <nav className="flex items-center justify-between w-full flex-[0_0_auto] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
          <Stepper
            steps={steps.map(step => ({
              ...step,
              status: step.number < currentStep ? 'completed' : step.number === currentStep ? 'current' : 'upcoming'
            }))}
            currentStep={currentStep}
            onStepClick={onStepClick}
            className="max-w-[1163px]"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />

          <ProgressBars
            currentStep={currentStep}
            totalSteps={totalSteps}
            primaryColor={primaryColor}
            progressPercentage={progressPercentage}
          />
        </nav>
      </div>

      <img
        className="w-full h-0 object-cover"
        alt="Separator"
        src="/assets/icons/separator.svg"
      />
    </section>
  );
};
