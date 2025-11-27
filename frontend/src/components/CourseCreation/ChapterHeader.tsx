import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Plus, FileText } from 'lucide-react';

interface ChapterHeaderProps {
  onAddChapter: () => void;
  className?: string;
}

export const ChapterHeader: React.FC<ChapterHeaderProps> = ({
  onAddChapter,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
        isDark ? 'text-white' : 'text-[#19294a]'
      }`}>
        {t('courseSteps.step2.sections.chapters.title')}
      </h2>
      <Button
        onClick={onAddChapter}
        className="flex items-center gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        <Plus className="w-4 h-4" />
        {t('courseSteps.step2.sections.chapters.addChapter')}
      </Button>
    </div>
  );
};

interface EmptyChaptersStateProps {
  className?: string;
}

export const EmptyChaptersState: React.FC<EmptyChaptersStateProps> = ({
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div 
      className={`relative min-h-[400px] rounded-lg overflow-hidden ${className}`}
    >
      {/* Blurred background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/assets/images/step2.png')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(2px)'
        }}
      />
      {/* Overlay for better text readability */}
      <div className={`absolute inset-0 ${
        isDark ? 'bg-black/50' : 'bg-white/70'
      }`} />
      
      {/* Content */}
      <div className="relative z-10 text-center py-12 px-4">
        <FileText className={`w-16 h-16 mx-auto mb-4 ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`} />
        <h3 className={`text-lg font-medium mb-2 ${
          isDark ? 'text-gray-200' : 'text-gray-800'
        }`}>
          {t('courseSteps.step2.sections.chapters.emptyState')}
        </h3>
        <p className={`${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {t('courseSteps.step2.sections.chapters.emptyDescription')}
        </p>
      </div>
    </div>
  );
};
