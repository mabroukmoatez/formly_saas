import React from 'react';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DurationField } from './DurationField';
import { MediaUpload } from './MediaUpload';
import { RichTextField } from './RichTextField';
import { CategoryButtons } from './CategoryButtons';
import { FormationActionBadge } from './FormationActionBadge';

interface CourseInformationFormProps {
  formData: {
    title: string;
    subtitle: string;
    description: string;
    formation_action?: string;
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
  onCategoryCreated?: () => void;
  onSubcategoryCreated?: () => void;
  selectedPracticeIds?: number[];
  onPracticesChanged?: (practiceIds: number[]) => void;
}

export const CourseInformationForm: React.FC<CourseInformationFormProps> = ({
  formData,
  categories,
  subcategories = [],
  onInputChange,
  onFileUpload,
  onFileUrlUpdate,
  uploadIntroVideo,
  uploadIntroImage,
  onCategoryCreated,
  onSubcategoryCreated,
  selectedPracticeIds = [],
  onPracticesChanged
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

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
      <div className="w-full max-w-[1396px] flex flex-col gap-6 bg-white">
        {/* Course Basic Information */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <div className="space-y-4">
              <FormField
                label={t('courseCreation.form.title')}
                value={formData.title}
                onChange={(value) => onInputChange('title', value)}
                placeholder="Your Course Title"
                maxLength={110}
              />

              <FormationActionBadge
                selectedAction={formData.formation_action || "Actions de formation"}
                onActionChange={(action) => onInputChange('formation_action', action)}
              />

              <CategoryButtons
                selectedCategory={formData.category_id ? categories.find(c => c.id === formData.category_id) || null : null}
                selectedSubcategory={formData.subcategory_id ? subcategories.find(s => s.id === formData.subcategory_id) || null : null}
                categories={categories}
                subcategories={subcategories}
                onCategorySelected={(category) => onInputChange('category_id', category?.id || null)}
                onSubcategorySelected={(subcategory) => onInputChange('subcategory_id', subcategory?.id || null)}
                onCategoryCreated={onCategoryCreated}
                onSubcategoryCreated={onSubcategoryCreated}
                courseUuid={formData.courseUuid}
                selectedPracticeIds={selectedPracticeIds}
                onPracticesChanged={onPracticesChanged}
              />

              <RichTextField
                label={t('courseCreation.form.description')}
                value={formData.description}
                onChange={(content) => onInputChange('description', content)}
                placeholder="Text Comes Here.."
                minHeight="200px"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#19294a] mb-4">
              {t('courseCreation.form.addIntroMedia')}
            </h3>
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
          </CardContent>
        </Card>

        {/* Course Duration */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#19294a] mb-4">
              {t('courseCreation.form.duration')}
            </h3>
            <DurationField
              duration={formData.duration}
              durationDays={formData.duration_days || 0}
              durationHours={Math.floor((formData.duration || 0) / 60)}
              durationMinutes={(formData.duration || 0) % 60}
              onDurationDaysChange={(days) => {
                onInputChange('duration_days', days);
                // Calculate total duration in minutes
                const hours = Math.floor((formData.duration || 0) / 60);
                const minutes = (formData.duration || 0) % 60;
                onInputChange('duration', days * 24 * 60 + hours * 60 + minutes);
              }}
              onDurationHoursChange={(hours) => {
                const days = formData.duration_days || 0;
                const minutes = (formData.duration || 0) % 60;
                onInputChange('duration', days * 24 * 60 + hours * 60 + minutes);
              }}
              onDurationMinutesChange={(minutes) => {
                const days = formData.duration_days || 0;
                const hours = Math.floor((formData.duration || 0) / 60);
                onInputChange('duration', days * 24 * 60 + hours * 60 + minutes);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};