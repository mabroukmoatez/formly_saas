import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DurationField } from './DurationField';
import { MediaUpload } from './MediaUpload';
import { RichTextField } from './RichTextField';
import { CategoryButtons } from './CategoryButtons';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';

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
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';
  const [isMediaSectionExpanded, setIsMediaSectionExpanded] = useState(true);

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
      <div className={`w-full max-w-[1396px] flex flex-col gap-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>

        {/* Course Title - Non-collapsible row */}
        <div className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
          <div className="flex items-center gap-3 flex-1">
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] whitespace-nowrap ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Course Title:
            </span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="Inter Course Title..."
              maxLength={110}
              className={`flex-1 border-none shadow-none text-[17px] font-medium bg-transparent outline-none ${
                isDark
                  ? 'text-white placeholder:text-gray-400'
                  : 'text-[#2D3748] placeholder:text-[#718096]'
              }`}
            />
          </div>
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#6a90b9]'
          }`}>
            {formData.title.length}/110
          </span>
        </div>

        {/* Catégorie D'actions De Formation - Non-collapsible row */}
        <div className={`flex items-center px-[17px] py-3 rounded-[18px] border border-solid ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
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
            isCompactMode={true}
          />
        </div>

        {/* Course Category - Non-collapsible row */}
        <div className={`flex items-center px-[17px] py-3 rounded-[18px] border border-solid ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] whitespace-nowrap ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Course Category:
            </span>
            {formData.category_id && categories.find(c => c.id === formData.category_id) && (
              <span
                className="px-4 py-1 rounded-full text-[15px] font-medium"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}`
                }}
              >
                {categories.find(c => c.id === formData.category_id)?.name}
              </span>
            )}
            {formData.subcategory_id && subcategories.find(s => s.id === formData.subcategory_id) && (
              <span
                className="px-4 py-1 rounded-full text-[15px] font-medium"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}`
                }}
              >
                {subcategories.find(s => s.id === formData.subcategory_id)?.name}
              </span>
            )}
            {!formData.category_id && (
              <span className={`text-[15px] italic ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>
                Sélectionnez une catégorie ci-dessus
              </span>
            )}
          </div>
        </div>

        {/* Ajouter Photo Ou Video D'introduction - Collapsible */}
        <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] relative transition-all duration-200 hover:shadow-lg ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
        }`}>
          <CardContent
            className="p-5 flex items-center justify-between cursor-pointer"
            onClick={() => setIsMediaSectionExpanded(!isMediaSectionExpanded)}
          >
            <div className="inline-flex items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <div
                  className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid ${
                    isDark ? 'border-gray-500' : 'border-[#e2e2ea]'
                  }`}
                  style={{
                    borderColor: isMediaSectionExpanded ? primaryColor : (isDark ? '#6b7280' : '#e2e2ea'),
                    backgroundColor: isMediaSectionExpanded ? primaryColor : 'transparent'
                  }}
                />
                <span
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}
                  style={{
                    color: isMediaSectionExpanded ? primaryColor : (isDark ? 'white' : '#19294a')
                  }}
                >
                  Ajouter Photo Ou Video D'introduction
                </span>
                <InfoIcon
                  className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  style={{
                    color: isMediaSectionExpanded ? primaryColor : (isDark ? '#9ca3af' : '#6b7280')
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img
                className="w-[31px] h-[31px] transition-transform duration-200"
                alt="Toggle"
                src="/assets/icons/expand-module.png"
                style={{
                  transform: isMediaSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>
          </CardContent>

          {isMediaSectionExpanded && (
            <div
              className={`px-5 pb-5 border-t ${isDark ? 'border-gray-600' : 'border-[#e2e2ea]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-4">
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
              </div>
            </div>
          )}
        </Card>

        {/* Course Description - Non-collapsible card */}
        <Card className={`border rounded-[18px] ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  Course Description:
                </span>
              </div>
              <RichTextField
                label=""
                value={formData.description}
                onChange={(content) => onInputChange('description', content)}
                placeholder="Write Course Description..."
                minHeight="200px"
              />
            </div>
          </CardContent>
        </Card>

        {/* Durée De La Formation - Non-collapsible row */}
        <div className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Durée De La Formation
            </span>
            <InfoIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>

          <div className="flex items-center gap-6">
            {/* Hours input */}
            <div className="flex items-center gap-2">
              <span className={`text-[15px] ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>-</span>
              <input
                type="number"
                value={formData.duration || ''}
                onChange={(e) => onInputChange('duration', parseInt(e.target.value) || 0)}
                placeholder="-"
                min="0"
                className={`w-[60px] px-2 py-1 rounded-lg border text-center text-[17px] font-medium ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-[#e2e2ea] text-[#2D3748]'
                }`}
              />
              <span
                className={`px-3 py-1 rounded-full text-[13px] font-medium ${
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-[#E8F3FF] text-[#0066FF]'
                }`}
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                H(s)
              </span>
            </div>

            {/* Minutes input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={''}
                onChange={(e) => {}}
                placeholder="-"
                min="0"
                max="59"
                className={`w-[60px] px-2 py-1 rounded-lg border text-center text-[17px] font-medium ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-[#e2e2ea] text-[#2D3748]'
                }`}
              />
              <span
                className={`px-3 py-1 rounded-full text-[13px] font-medium ${
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-[#E8F3FF] text-[#0066FF]'
                }`}
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                S(s)
              </span>
            </div>

            {/* Days input */}
            <div className="flex items-center gap-2">
              <span className={`text-[15px] ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>-</span>
              <input
                type="number"
                value={formData.duration_days || ''}
                onChange={(e) => onInputChange('duration_days', parseInt(e.target.value) || 0)}
                placeholder="-"
                min="0"
                className={`w-[60px] px-2 py-1 rounded-lg border text-center text-[17px] font-medium ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-[#e2e2ea] text-[#2D3748]'
                }`}
              />
              <span
                className={`px-3 py-1 rounded-full text-[13px] font-medium ${
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-[#E8F3FF] text-[#0066FF]'
                }`}
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                J(s)
              </span>
            </div>

            <span className={`text-[15px] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
              De Formation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};