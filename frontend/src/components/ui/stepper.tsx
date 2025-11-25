import React from 'react';
import { CheckIcon } from 'lucide-react';
import { Badge } from './badge';
import { useTheme } from '../../contexts/ThemeContext';

interface Step {
  number: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const Stepper: React.FC<StepperProps> = ({ 
  steps, 
  currentStep, 
  onStepClick,
  className = '',
  primaryColor = '#007aff',
  secondaryColor = '#6a90b9'
}) => {
  const { isDark } = useTheme();
  
  const getStepStatus = (stepNumber: number): 'completed' | 'current' | 'upcoming' => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <nav className={`flex flex-wrap items-center gap-[1px_0px] ${className}`} aria-label="Progress steps">
      {steps.map((step, index) => {
        const status = getStepStatus(step.number);
        return (
          <React.Fragment key={step.number}>
            <button
              onClick={() => onStepClick?.(step.number)}
              className={`inline-flex h-[35.46px] items-center justify-center gap-[8.44px] px-[8.44px] py-[6.75px] rounded-[38.44px] border border-solid transition-colors ${
                status === 'completed'
                  ? 'text-white hover:opacity-90'
                  : status === 'current'
                    ? 'bg-transparent hover:opacity-80'
                    : isDark 
                      ? 'bg-gray-800 hover:opacity-80' 
                      : 'bg-white hover:opacity-80'
              }`}
              style={{
                backgroundColor: status === 'completed' ? primaryColor : status === 'current' ? 'transparent' : isDark ? '#1f2937' : 'white',
                borderColor: status === 'completed' ? primaryColor : status === 'current' ? primaryColor : secondaryColor,
                color: status === 'completed' ? 'white' : status === 'current' ? primaryColor : secondaryColor,
                boxShadow: status === 'completed' || status === 'current' ? `0px 0px 13.25px 0.84px ${primaryColor}45` : 'none'
              }}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <div className="relative w-[26.21px] h-[24.21px]">
                {status === 'completed' ? (
                  <div className="relative w-6 h-6 rounded-[12.1px] border-[1.69px] border-solid border-white flex items-center justify-center">
                    <CheckIcon
                      className="w-2.5 h-2 text-white"
                      strokeWidth={3}
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-6 h-6 rounded-[12.1px] border-[1.69px] border-solid flex items-center justify-center"
                    style={{
                      borderColor: status === 'current' ? primaryColor : secondaryColor
                    }}
                  >
                    <span
                      className="[font-family:'Poppins',Helvetica] font-semibold text-[12.4px]"
                      style={{
                        color: status === 'current' ? primaryColor : secondaryColor
                      }}
                    >
                      {step.number}
                    </span>
                  </div>
                )}
              </div>
              <span
                className="[font-family:'Poppins',Helvetica] font-semibold text-[12.4px] tracking-[0] leading-[normal]"
                style={{
                  color: status === 'completed' ? 'white' : status === 'current' ? primaryColor : secondaryColor
                }}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <img
                className="w-[25.24px] h-0.5"
                alt="Step separator"
                src="/assets/icons/separator.svg"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

interface ProgressBarsProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  primaryColor?: string;
  progressPercentage?: number;
}

export const ProgressBars: React.FC<ProgressBarsProps> = ({ 
  currentStep, 
  totalSteps, 
  className = '',
  primaryColor = '#007aff',
  progressPercentage
}) => {
  const { isDark } = useTheme();
  const displayPercentage = progressPercentage !== undefined ? progressPercentage : Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className={`inline-flex flex-col items-end justify-center gap-px ${className}`}>
      <div className={`[font-family:'Poppins',Helvetica] font-normal text-[17px] tracking-[0] leading-[normal] ${
        isDark ? 'text-white' : 'text-[#19294a]'
      }`}>
        <span className="font-bold">{displayPercentage}</span>
        <span className={`[font-family:'Poppins',Helvetica] font-normal text-[17px] tracking-[0] ${
          isDark ? 'text-white' : 'text-[#19294a]'
        }`}>
          /100%
        </span>
      </div>
      <div className="inline-flex items-center gap-[5px]">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className="w-[26.25px] h-[5px] rounded-[6.25px] transition-colors"
            style={{
              backgroundColor: index < currentStep ? primaryColor : isDark ? '#4a5568' : '#d2d2d2'
            }}
          />
        ))}
      </div>
    </div>
  );
};
