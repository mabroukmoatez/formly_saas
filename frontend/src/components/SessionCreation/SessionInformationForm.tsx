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

interface SessionInformationFormProps {
  formData: {
    title: string;
    subtitle: string;
    description: string;
    category_id: number | null;
    subcategory_id: number | null;
    session_language_id: number | null;
    difficulty_level_id: number | null;
    duration: string;
    duration_days: number;
    session_start_date: string;
    session_end_date: string;
    session_start_time: string;
    session_end_time: string;
    max_participants: number;
    target_audience: string;
    prerequisites: string;
    tags: string[];
    youtube_video_id: string;
    intro_video: File | null;
    intro_image: File | null;
    intro_video_url?: string;
    intro_image_url?: string;
    sessionUuid?: string;
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

export const SessionInformationForm: React.FC<SessionInformationFormProps> = ({
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
        return formData.session_language_id !== null;
      case 'difficulty':
        return formData.difficulty_level_id !== null;
      case 'duration':
        return formData.duration && formData.duration.trim().length > 0;
      case 'duration_days':
        return formData.duration_days > 0;
      case 'session_dates':
        return formData.session_start_date && formData.session_end_date;
      case 'session_times':
        return formData.session_start_time && formData.session_end_time;
      case 'capacity':
        return formData.max_participants > 0;
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
        {/* Session Basic Information */}
        <div className='border text-card-foreground rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] transition-all duration-200 bg-white border-[#dbd8d8]'>
          <div className='p-5 flex flex-col gap-4'>
            <div className="space-y-4">
              <FormField
                label={t('sessionCreation.form.title')}
                value={formData.title}
                onChange={(value) => onInputChange('title', value)}
                placeholder={t('sessionCreation.form.titlePlaceholder')}
                maxLength={110}
              />

              <SelectField
                label={t('sessionCreation.form.category')}
                value={formData.category_id}
                onChange={(value) => onInputChange('category_id', value)}
                options={categories}
                placeholder={t('sessionCreation.form.selectCategory')}
              />

              {formData.category_id && (
                <SelectField
                  label={t('sessionCreation.form.subcategory')}
                  value={formData.subcategory_id}
                  onChange={(value) => onInputChange('subcategory_id', value)}
                  options={subcategories.filter(sc => sc.category_id === formData.category_id)}
                  placeholder={t('sessionCreation.form.selectSubcategory')}
                />
              )}

              <RichTextField
                label={t('sessionCreation.form.description')}
                value={formData.description}
                onChange={(content) => onInputChange('description', content)}
                placeholder={t('sessionCreation.form.descriptionPlaceholder')}
                minHeight="200px"
              />
            </div>
          </div>
        </div>

        {/* Session Dates and Times */}
        <LegacyCollapsible
          id="session-dates"
          title={t('sessionCreation.form.sessionDates')}
          hasData={hasSectionData('session_dates') || hasSectionData('session_times')}
          showCheckmark={true}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('sessionCreation.form.startDate')}
                type="date"
                value={formData.session_start_date}
                onChange={(value) => onInputChange('session_start_date', value)}
                placeholder={t('sessionCreation.form.selectStartDate')}
              />
              
              <FormField
                label={t('sessionCreation.form.endDate')}
                type="date"
                value={formData.session_end_date}
                onChange={(value) => onInputChange('session_end_date', value)}
                placeholder={t('sessionCreation.form.selectEndDate')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('sessionCreation.form.startTime')}
                type="time"
                value={formData.session_start_time}
                onChange={(value) => onInputChange('session_start_time', value)}
                placeholder={t('sessionCreation.form.selectStartTime')}
              />
              
              <FormField
                label={t('sessionCreation.form.endTime')}
                type="time"
                value={formData.session_end_time}
                onChange={(value) => onInputChange('session_end_time', value)}
                placeholder={t('sessionCreation.form.selectEndTime')}
              />
            </div>

            <FormField
              label={t('sessionCreation.form.maxParticipants')}
              type="number"
              value={formData.max_participants}
              onChange={(value) => onInputChange('max_participants', parseInt(value))}
              placeholder={t('sessionCreation.form.maxParticipantsPlaceholder')}
            />
          </div>
        </LegacyCollapsible>

        {/* Media Upload */}
        <LegacyCollapsible
          id="media-upload"
          title={t('sessionCreation.form.addIntroMedia')}
          hasData={hasSectionData('media')}
          showCheckmark={true}
        >
          <MediaUpload
            introVideo={formData.intro_video}
            introImage={formData.intro_image}
            introVideoUrl={formData.intro_video_url}
            introImageUrl={formData.intro_image_url}
            courseUuid={formData.sessionUuid}
            uploadIntroVideo={uploadIntroVideo}
            uploadIntroImage={uploadIntroImage}
            onVideoUpload={handleVideoUpload}
            onImageUpload={handleImageUpload}
            onVideoRemove={handleVideoRemove}
            onImageRemove={handleImageRemove}
          />
        </LegacyCollapsible>

        {/* Session Duration */}
        <LegacyCollapsible
          id="duration"
          title={t('sessionCreation.form.duration')}
          hasData={hasSectionData('duration')}
          showCheckmark={true}
        >
          <DurationField
            duration={formData.duration}
            onDurationChange={(value) => onInputChange('duration', value)}
          />
        </LegacyCollapsible>

        {/* Session Details - Moved to CollapsibleSections */}
      </div>
    </section>
  );
};