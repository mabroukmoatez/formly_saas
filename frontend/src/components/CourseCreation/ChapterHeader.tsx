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
    <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'} ${className}`}>
      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {t('courseSteps.step2.sections.chapters.emptyState')}
      </h3>
      <p className="mb-6">
        {t('courseSteps.step2.sections.chapters.emptyDescription')}
      </p>
    </div>
  );
};
