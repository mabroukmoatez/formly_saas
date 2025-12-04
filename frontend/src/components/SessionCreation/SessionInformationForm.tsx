import React from 'react';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FormField } from '../CourseCreation/FormField';
import { DurationField } from '../CourseCreation/DurationField';
import { MediaUpload } from '../CourseCreation/MediaUpload';
import { RichTextField } from '../CourseCreation/RichTextField';
import { CategoryButtons } from '../CourseCreation/CategoryButtons';
import { FormationActionBadge } from '../CourseCreation/FormationActionBadge';

interface SessionInformationFormProps {
  formData: {
    title: string;
    subtitle: string;
    description: string;
    formation_action?: string;
    category_id: number | null;
    subcategory_id: number | null;
    session_language_id: number | null;
    difficulty_level_id: number | null;
    duration: number;
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
  categories: Array<{ id: number; name: string; is_custom?: boolean }>;
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

export const SessionInformationForm: React.FC<SessionInformationFormProps> = ({
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
        {/* Session Basic Information */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <div className="space-y-4">
              <FormField
                label={t('sessionCreation.form.title')}
                value={formData.title}
                onChange={(value) => onInputChange('title', value)}
                placeholder="Your Session Title"
                maxLength={110}
              />

              <FormationActionBadge
                selectedAction={formData.formation_action || "Actions de formation"}
                onActionChange={(action) => onInputChange('formation_action', action)}
              />

              <CategoryButtons
                selectedCategory={formData.category_id && categories ? categories.find(c => c.id === formData.category_id) || null : null}
                selectedSubcategory={formData.subcategory_id && subcategories ? subcategories.find(s => s.id === formData.subcategory_id) || null : null}
                categories={categories || []}
                subcategories={subcategories || []}
                onCategorySelected={(category) => onInputChange('category_id', category?.id || null)}
                onSubcategorySelected={(subcategory) => onInputChange('subcategory_id', subcategory?.id || null)}
                onCategoryCreated={onCategoryCreated}
                onSubcategoryCreated={onSubcategoryCreated}
                sessionUuid={formData.sessionUuid}
                isSession={true}
                selectedPracticeIds={selectedPracticeIds}
                onPracticesChanged={onPracticesChanged}
              />

              <RichTextField
                label={t('sessionCreation.form.description')}
                value={formData.description}
                onChange={(content) => onInputChange('description', content)}
                placeholder="Text Comes Here.."
                minHeight="200px"
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Schedule - Session-specific dates and times (after description) */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              {t('sessionCreation.form.schedule')}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('sessionCreation.form.scheduleDescription')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('sessionCreation.form.startDate')}
                </label>
                <input
                  type="date"
                  value={formData.session_start_date || ''}
                  onChange={(e) => onInputChange('session_start_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* End Date */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('sessionCreation.form.endDate')}
                </label>
                <input
                  type="date"
                  value={formData.session_end_date || ''}
                  onChange={(e) => onInputChange('session_end_date', e.target.value)}
                  min={formData.session_start_date || undefined}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Start Time */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('sessionCreation.form.startTime')}
                </label>
                <input
                  type="time"
                  value={formData.session_start_time || '09:00'}
                  onChange={(e) => onInputChange('session_start_time', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* End Time */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('sessionCreation.form.endTime')}
                </label>
                <input
                  type="time"
                  value={formData.session_end_time || '17:00'}
                  onChange={(e) => onInputChange('session_end_time', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Max Participants */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('sessionCreation.form.maxParticipants')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_participants || 20}
                  onChange={(e) => onInputChange('max_participants', parseInt(e.target.value) || 20)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#19294a] mb-4">
              {t('sessionCreation.form.addIntroMedia')}
            </h3>
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
          </CardContent>
        </Card>

        {/* Session Duration */}
        <Card className="border border-[#e2e2ea] rounded-[18px]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#19294a] mb-4">
              {t('sessionCreation.form.duration')}
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
