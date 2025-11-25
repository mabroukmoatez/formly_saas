import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DurationField } from './DurationField';
import { MediaUpload } from './MediaUpload';
import { RichTextField } from './RichTextField';
import { CategoryButtons } from './CategoryButtons';
import { FileUpload } from '../ui/file-upload';
import { ChevronDown, InfoIcon } from 'lucide-react';

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

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCourseTypeDropdownOpen, setIsCourseTypeDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const courseTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Course type options matching the screenshot
  const courseTypeOptions = [
    { id: 1, name: 'Actions De Formation' },
    { id: 2, name: 'Bilan De Compétences (BC)' },
    { id: 3, name: 'Validations Des Acquis De L\'expérience (VAE)' },
    { id: 4, name: 'Contre La formation D\'apprentis (CFA)' },
  ];

  const [selectedCourseType, setSelectedCourseType] = useState<string>('Actions De Formation');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (courseTypeDropdownRef.current && !courseTypeDropdownRef.current.contains(event.target as Node)) {
        setIsCourseTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className={`w-full max-w-[1396px] flex flex-col gap-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Course Basic Information Card */}
        <Card className={`border rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
        }`}>
          <CardContent className="p-6">
            <div className="space-y-5">
              {/* Course Title - Full Width */}
              <div className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
              }`}>
                <div className="inline-flex items-center gap-3 flex-1">
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] whitespace-nowrap ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    Course Title:
                  </span>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => onInputChange('title', e.target.value)}
                    placeholder="Enter Course Title..."
                    maxLength={110}
                    className={`flex-1 border-none shadow-none text-[17px] font-medium ${
                      isDark
                        ? 'text-white placeholder:text-gray-400 bg-transparent'
                        : 'text-[#2D3748] placeholder:text-[#718096] bg-transparent'
                    }`}
                  />
                </div>
                <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                  isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                }`}>
                  {formData.title.length}/110
                </span>
              </div>

              {/* Category and Course Type Row */}
              <div className="flex items-start gap-4">
                {/* Catégorie D'actions De Formation Dropdown */}
                <div className="relative" ref={categoryDropdownRef}>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-[#E8F3FF] hover:bg-[#d6e8ff] text-[#19294a]'
                    }`}
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[15px]">
                      Catégorie D'actions De Formation:
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[15px]" style={{ color: primaryColor }}>
                      {selectedCourseType}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isCategoryDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-2 z-50 rounded-[18px] border shadow-lg min-w-[300px] ${
                      isDark
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-white border-[#e2e2ea]'
                    }`}>
                      <div className="p-2">
                        {courseTypeOptions.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedCourseType(option.name);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                selectedCourseType === option.name
                                  ? 'bg-[#0066FF] border-[#0066FF]'
                                  : isDark
                                    ? 'bg-transparent border-gray-500'
                                    : 'bg-white border-gray-300'
                              }`}
                              style={selectedCourseType === option.name ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                            >
                              {selectedCourseType === option.name && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                              isDark ? 'text-white' : 'text-[#19294a]'
                            }`}>
                              {option.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Category Dropdown */}
                <div className="relative" ref={courseTypeDropdownRef}>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-[18px] border cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
                        : 'bg-white border-[#e2e2ea] hover:bg-gray-50 text-[#19294a]'
                    }`}
                    onClick={() => setIsCourseTypeDropdownOpen(!isCourseTypeDropdownOpen)}
                  >
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[15px]">
                      Course Category:
                    </span>
                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                      isDark ? 'text-gray-400' : 'text-[#718096]'
                    }`}>
                      {formData.category_id
                        ? categories.find(c => c.id === formData.category_id)?.name || 'Category Name'
                        : 'Category Name'
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isCourseTypeDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isCourseTypeDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-2 z-50 rounded-[18px] border shadow-lg min-w-[250px] ${
                      isDark
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-white border-[#e2e2ea]'
                    }`}>
                      <div className="p-2 max-h-[300px] overflow-y-auto">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              formData.category_id === category.id
                                ? isDark ? 'bg-gray-700' : 'bg-[#E8F3FF]'
                                : isDark
                                  ? 'hover:bg-gray-700'
                                  : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              onInputChange('category_id', category.id);
                              setIsCourseTypeDropdownOpen(false);
                            }}
                          >
                            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                              isDark ? 'text-white' : 'text-[#19294a]'
                            }`}>
                              {category.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Upload Buttons - Centered */}
              <div className={`flex items-center gap-2 px-[17px] py-3 ${
                isDark ? 'text-white' : 'text-[#19294a]'
              }`}>
                <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                  isDark ? 'text-gray-400' : 'text-[#718096]'
                }`}>
                  Ajouter Photo Ou Vidéo D'introduction:
                </span>
              </div>

              <div className="flex justify-center items-center gap-4">
                <FileUpload
                  accept="video/*"
                  maxSize={100}
                  courseUuid={formData.courseUuid}
                  uploadType="intro-video"
                  uploadIntroVideo={uploadIntroVideo}
                  onFileUploaded={(file, url) => handleVideoUpload(file, url)}
                >
                  <Button
                    className="h-auto inline-flex items-center gap-2.5 px-[19px] py-[20px] rounded-[15px] border hover:opacity-90 cursor-pointer"
                    style={{
                      backgroundColor: '#FFD7B5',
                      color: '#2D3748',
                      border: '1px solid #FFD7B5'
                    }}
                  >
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[15px]">
                      Vidéo D'introduction
                    </span>
                    <img
                      className="w-[30px] h-[20px]"
                      alt="Video"
                      src="/assets/icons/video.png"
                    />
                  </Button>
                </FileUpload>

                <FileUpload
                  accept="image/*"
                  maxSize={10}
                  courseUuid={formData.courseUuid}
                  uploadType="intro-image"
                  uploadIntroImage={uploadIntroImage}
                  onFileUploaded={(file, url) => handleImageUpload(file, url)}
                >
                  <Button
                    variant="outline"
                    className="h-auto inline-flex items-center gap-2.5 px-[19px] py-[20px] rounded-[15px] hover:opacity-90 cursor-pointer"
                    style={{
                      borderColor: '#E6D7FF',
                      color: '#2D3748',
                      backgroundColor: '#E6D7FF'
                    }}
                  >
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[15px]">
                      Image D'introduction
                    </span>
                    <img
                      className="w-[20px] h-[22px]"
                      alt="Image"
                      src="/assets/icons/image.png"
                    />
                  </Button>
                </FileUpload>
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    Course Description
                  </span>
                </div>
                <RichTextField
                  label=""
                  value={formData.description}
                  onChange={(content) => onInputChange('description', content)}
                  placeholder="Enter Course Description..."
                  minHeight="150px"
                />
              </div>

              {/* Durée De La Formation - Always Visible */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid`}
                    style={{
                      borderColor: primaryColor,
                      backgroundColor: primaryColor
                    }}
                  />
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px]`}
                    style={{ color: primaryColor }}
                  >
                    Durée De La Formation
                  </span>
                  <InfoIcon className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div className={`flex items-center gap-6 px-4 py-3 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  {/* Hours (HH) */}
                  <div className="flex items-center gap-2">
                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                      isDark ? 'text-gray-400' : 'text-[#718096]'
                    }`}>
                      -
                    </span>
                    <div className={`flex items-center px-3 py-2 rounded-full border ${
                      isDark ? 'bg-gray-600 border-gray-500' : 'bg-[#E8F3FF] border-[#E8F3FF]'
                    }`}>
                      <Input
                        type="number"
                        value={formData.duration || ''}
                        onChange={(e) => onInputChange('duration', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        className={`w-[40px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                          isDark
                            ? 'text-white placeholder:text-gray-400 bg-transparent'
                            : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
                        }`}
                      />
                      <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ml-1 ${
                        isDark ? 'text-white' : 'text-[#19294a]'
                      }`}>
                        H(s)
                      </span>
                    </div>
                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] mx-2 ${
                      isDark ? 'text-gray-400' : 'text-[#718096]'
                    }`}>
                      SOIT
                    </span>
                  </div>

                  {/* Days (JJ) */}
                  <div className="flex items-center gap-2">
                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                      isDark ? 'text-gray-400' : 'text-[#718096]'
                    }`}>
                      -
                    </span>
                    <div className={`flex items-center px-3 py-2 rounded-full border ${
                      isDark ? 'bg-gray-600 border-gray-500' : 'bg-[#E8F3FF] border-[#E8F3FF]'
                    }`}>
                      <Input
                        type="number"
                        value={formData.duration_days || ''}
                        onChange={(e) => onInputChange('duration_days', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        className={`w-[40px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                          isDark
                            ? 'text-white placeholder:text-gray-400 bg-transparent'
                            : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
                        }`}
                      />
                      <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ml-1 ${
                        isDark ? 'text-white' : 'text-[#19294a]'
                      }`}>
                        J/J
                      </span>
                    </div>
                  </div>

                  {/* De Formation label */}
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                    isDark ? 'text-gray-300' : 'text-[#19294a]'
                  }`}>
                    De Formation
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};