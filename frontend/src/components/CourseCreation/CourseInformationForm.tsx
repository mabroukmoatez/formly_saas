import React from 'react';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LegacyCollapsible } from '../ui/collapsible';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DurationField } from './DurationField';
import { MediaUpload } from './MediaUpload';
import { RichTextField } from './RichTextField';

interface CourseInformationFormProps {
  formData: {
    title: string;
    subtitle: string;
    description: string;
    category_id: number | null;
    subcategory_id: number | null;
    course_language_id: number | null;
    difficulty_level_id: number | null;
    duration: number;
    duration_days: number;
    target_audience: string;
    prerequisites: string;
    tags: string[];
    youtube_video_id: string;
    intro_video: File | null;
    intro_image: File | null;
    intro_video_url?: string;
    intro_image_url?: string;
    courseUuid?: string;
  };
  categories: Array<{ id: number; name: string }>;
  subcategories?: Array<{ id: number; name: string; category_id: number }>;
  onInputChange: (field: string, value: any) => void;
  onFileUpload: (field: 'intro_video' | 'intro_image', file: File) => void;
  onFileUrlUpdate: (field: 'intro_video_url' | 'intro_image_url', url: string) => void;
  // Context upload functions
  uploadIntroVideo?: (file: File) => Promise<boolean>;
  uploadIntroImage?: (file: File) => Promise<boolean>;
}

export const CourseInformationForm: React.FC<CourseInformationFormProps> = ({
  formData,
  categories,
  subcategories = [],
  onInputChange,
  onFileUpload,
  onFileUrlUpdate,
  uploadIntroVideo,
  uploadIntroImage
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Helper function to check if a section has data
  const hasSectionData = (section: string) => {
    switch (section) {
      case 'title':
        return formData.title && formData.title.trim().length > 0;
      case 'subtitle':
        return formData.subtitle && formData.subtitle.trim().length > 0;
      case 'description':
        return formData.description && formData.description.trim().length > 0;
      case 'category':
        return formData.category_id !== null;
      case 'subcategory':
        return formData.subcategory_id !== null;
      case 'language':
        return formData.course_language_id !== null;
      case 'difficulty':
        return formData.difficulty_level_id !== null;
      case 'duration':
        return formData.duration > 0;
      case 'duration_days':
        return formData.duration_days > 0;
      case 'tags':
        return formData.tags && formData.tags.length > 0;
      case 'media':
        return formData.intro_video !== null || formData.intro_image !== null || 
               formData.intro_video_url !== '' || formData.intro_image_url !== '';
      default:
        return false;
    }
  };

  const handleVideoUpload = (file: File, url: string) => {
    onFileUpload('intro_video', file);
    onFileUrlUpdate('intro_video_url', url);
  };

  const handleImageUpload = (file: File, url: string) => {
    onFileUpload('intro_image', file);
    onFileUrlUpdate('intro_image_url', url);
  };

  const handleVideoRemove = () => {
    onInputChange('intro_video', null);
  };

  const handleImageRemove = () => {
    onInputChange('intro_image', null);
  };

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        {/* Course Basic Information */}
        <LegacyCollapsible
          id="basic-info"
          title={t('courseCreation.form.basicInformation')}
          hasData={hasSectionData('title') || hasSectionData('category') || hasSectionData('description')}
          showCheckmark={true}
        >
          <div className="space-y-4">
            <FormField
              label={t('courseCreation.form.title')}
                  value={formData.title}
              onChange={(value) => onInputChange('title', value)}
                  placeholder={t('courseCreation.form.titlePlaceholder')}
              maxLength={110}
            />

            <SelectField
              label={t('courseCreation.form.category')}
              value={formData.category_id}
              onChange={(value) => onInputChange('category_id', value)}
              options={categories}
              placeholder={t('courseCreation.form.selectCategory')}
            />

            {formData.category_id && (
              <SelectField
                label={t('courseCreation.form.subcategory')}
                value={formData.subcategory_id}
                onChange={(value) => onInputChange('subcategory_id', value)}
                options={subcategories.filter(sc => sc.category_id === formData.category_id)}
                placeholder={t('courseCreation.form.selectSubcategory')}
              />
            )}

            <RichTextField
              label={t('courseCreation.form.description')}
              value={formData.description}
                  onChange={(content) => onInputChange('description', content)}
                  placeholder={t('courseCreation.form.descriptionPlaceholder')}
              minHeight="200px"
                />
              </div>
        </LegacyCollapsible>

        {/* Media Upload */}
        <LegacyCollapsible
          id="media-upload"
          title={t('courseCreation.form.addIntroMedia')}
          hasData={hasSectionData('media')}
          showCheckmark={true}
        >
          <MediaUpload
            introVideo={formData.intro_video}
            introImage={formData.intro_image}
            introVideoUrl={formData.intro_video_url}
            introImageUrl={formData.intro_image_url}
            courseUuid={formData.courseUuid}
            uploadIntroVideo={uploadIntroVideo}
            uploadIntroImage={uploadIntroImage}
            onVideoUpload={handleVideoUpload}
            onImageUpload={handleImageUpload}
            onVideoRemove={handleVideoRemove}
            onImageRemove={handleImageRemove}
          />
        </LegacyCollapsible>

        {/* Course Duration */}
        <LegacyCollapsible
          id="duration"
          title={t('courseCreation.form.duration')}
          hasData={hasSectionData('duration')}
          showCheckmark={true}
        >
          <DurationField
            duration={formData.duration}
            onDurationChange={(value) => onInputChange('duration', value)}
          />
        </LegacyCollapsible>
      </div>
    </section>
  );
};
