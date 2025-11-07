import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, ChevronRight, ChevronLeft, Sparkles, Zap, Target, Users, BarChart3, Settings, Award, CheckCircle2 } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation effect for page transitions
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const steps: OnboardingStep[] = [
    {
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.description'),
      features: [
        t('onboarding.welcome.feature1'),
        t('onboarding.welcome.feature2'),
        t('onboarding.welcome.feature3'),
      ],
      icon: Sparkles,
      color: 'text-amber-500',
    },
    {
      title: t('onboarding.commercial.title'),
      description: t('onboarding.commercial.description'),
      features: [
        t('onboarding.commercial.feature1'),
        t('onboarding.commercial.feature2'),
        t('onboarding.commercial.feature3'),
      ],
      icon: BarChart3,
      color: 'text-blue-500',
    },
    {
      title: t('onboarding.management.title'),
      description: t('onboarding.management.description'),
      features: [
        t('onboarding.management.feature1'),
        t('onboarding.management.feature2'),
        t('onboarding.management.feature3'),
      ],
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: t('onboarding.quality.title'),
      description: t('onboarding.quality.description'),
      features: [
        t('onboarding.quality.feature1'),
        t('onboarding.quality.feature2'),
        t('onboarding.quality.feature3'),
      ],
      icon: Award,
      color: 'text-green-500',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Store onboarding completion in localStorage
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleFinish}
      />

      {/* Modal */}
      <Card 
        className={`relative w-full max-w-3xl border-2 rounded-[24px] shadow-2xl ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} animate-in zoom-in-95 duration-500`}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFinish}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('onboarding.progress')}
              </span>
              <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {/* Icon */}
            <div className={`flex justify-center mb-6 animate-bounce-slow`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-800' : 'from-gray-100 to-gray-200'}`}>
                <IconComponent className={`w-10 h- Veteran ${currentStepData.color} animate-pulse`} />
              </div>
            </div>

            {/* Title */}
            <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-3xl text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className={`[font-family:'Poppins',Helvetica] text-lg text-center mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentStepData.description}
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {currentStepData.features.map((feature, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} animate-in slide-in-from-left duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`mt-0.5 ${currentStepData.color}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 h-12 px-6 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
              {t('onboarding.previous')}
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500' 
                      : `w-2 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {currentStep === steps.length - 1 ? t('onboarding.finish') : t('onboarding.next')}
              {currentStep < steps.length - 1 && <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};


