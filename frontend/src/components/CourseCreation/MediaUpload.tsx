import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FileUpload } from '../ui/file-upload';
import { RobustVideoPlayer } from '../ui/robust-video-player';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { InfoIcon, Video, Image, X } from 'lucide-react';

interface MediaUploadProps {
  introVideo: File | null;
  introImage: File | null;
  introVideoUrl?: string;
  introImageUrl?: string;
  courseUuid?: string;
  onVideoUpload: (file: File, url: string) => void;
  onImageUpload: (file: File, url: string) => void;
  onVideoRemove: () => void;
  onImageRemove: () => void;
  className?: string;
  // Context upload functions
  uploadIntroVideo?: (file: File) => Promise<boolean>;
  uploadIntroImage?: (file: File) => Promise<boolean>;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  introVideo,
  introImage,
  introVideoUrl,
  introImageUrl,
  courseUuid,
  onVideoUpload,
  onImageUpload,
  onVideoRemove,
  onImageRemove,
  className = '',
  uploadIntroVideo,
  uploadIntroImage
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');

  const hasVideo = introVideo || introVideoUrl;
  const hasImage = introImage || introImageUrl;

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`w-[17px] h-[17px] rounded-full border-2 ${isDark ? 'border-gray-600' : 'border-[#e2e2ea]'}`} />
        <span className={`font-semibold text-[17px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
          Ajouter Photo Ou Video D'introduction
        </span>
        <InfoIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} />
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center items-center gap-4">
        <Button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`h-auto inline-flex items-center gap-2.5 px-6 py-4 rounded-[15px] font-semibold text-[17px] transition-all ${activeTab === 'video'
              ? 'bg-[#FF7B00] text-white border-[#FF7B00] hover:bg-[#e66e00]'
              : isDark
                ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                : 'bg-white text-[#6a90b9] border-[#e2e2ea] hover:bg-gray-50'
            }`}
          style={{
            border: activeTab === 'video' ? '1px solid #FF7B00' : undefined
          }}
        >
          <span>Vidéo D'introduction</span>
          <Video className="w-6 h-6" />
        </Button>

        <Button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`h-auto inline-flex items-center gap-2.5 px-6 py-4 rounded-[15px] font-semibold text-[17px] transition-all ${activeTab === 'image'
              ? 'bg-[#FF7B00] text-white border-[#FF7B00] hover:bg-[#e66e00]'
              : isDark
                ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                : 'bg-white text-[#6a90b9] border-[#e2e2ea] hover:bg-gray-50'
            }`}
          style={{
            border: activeTab === 'image' ? '1px solid #FF7B00' : undefined
          }}
        >
          <span>Image D'introduction</span>
          <Image className="w-6 h-6" />
        </Button>
      </div>

      {/* Single Upload Zone - Switches based on active tab */}
      <div className="w-full">
        {activeTab === 'video' ? (
          // Video Upload Zone
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-[15px] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                Vidéo D'introduction
              </span>
              <InfoIcon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
            </div>

            {hasVideo ? (
              // Video Preview
              <div className={`relative rounded-[20px] overflow-hidden border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#FFF5EB] border-[#FF7B00]'}`}>
                <button
                  type="button"
                  onClick={onVideoRemove}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-4">
                  <div className="h-[180px] rounded-lg overflow-hidden">
                    <RobustVideoPlayer
                      src={introVideo ? URL.createObjectURL(introVideo) : introVideoUrl || ''}
                      title={introVideo?.name || 'Intro Video'}
                      size="sm"
                      className="w-full h-full"
                      showControls={true}
                    />
                  </div>
                  <p className={`mt-3 text-sm text-center truncate ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {introVideo?.name || 'Vidéo d\'introduction'}
                  </p>
                </div>
              </div>
            ) : (
              // Video Upload Drop Zone
              <FileUpload
                accept="video/*"
                maxSize={20}
                courseUuid={courseUuid}
                uploadType="intro-video"
                uploadIntroVideo={uploadIntroVideo}
                onFileUploaded={(file, url) => onVideoUpload(file, url)}
              >
                <div className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[20px] border-2 border-dashed cursor-pointer transition-all hover:border-[#FF7B00] ${isDark
                    ? 'bg-gray-800 border-gray-600 hover:bg-gray-750'
                    : 'bg-[#FFF5EB] border-[#FFB366] hover:bg-[#FFEAD9]'
                  }`}>
                  <div className="w-16 h-16 rounded-xl bg-[#FF7B00] flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#4A5568]'}`}>
                      glisser ou téléchargez la vidéo d'introduction
                    </p>
                    <p className="text-xs text-[#FF7B00] mt-1 font-medium">
                      Max File Size Is 20Mb
                    </p>
                  </div>
                </div>
              </FileUpload>
            )}
          </div>
        ) : (
          // Image Upload Zone
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-[15px] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                Miniature Vidéo
              </span>
              <InfoIcon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
            </div>

            {hasImage ? (
              // Image Preview
              <div className={`relative rounded-[20px] overflow-hidden border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#007aff]'}`} style={{ borderColor: primaryColor }}>
                <button
                  type="button"
                  onClick={onImageRemove}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-4">
                  <div className="h-[180px] rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={introImage ? URL.createObjectURL(introImage) : introImageUrl || ''}
                      className="w-full h-full object-cover"
                      alt="Miniature"
                      onError={(e) => {
                        e.currentTarget.src = '/uploads/default/course.jpg';
                      }}
                    />
                  </div>
                  <p className={`mt-3 text-sm text-center truncate ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {introImage?.name || 'Image d\'introduction'}
                  </p>
                </div>
              </div>
            ) : (
              // Image Upload Drop Zone
              <FileUpload
                accept="image/*"
                maxSize={10}
                courseUuid={courseUuid}
                uploadType="intro-image"
                uploadIntroImage={uploadIntroImage}
                onFileUploaded={(file, url) => onImageUpload(file, url)}
              >
                <div
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[20px] border-2 border-dashed cursor-pointer transition-all ${isDark
                      ? 'bg-gray-800 border-gray-600 hover:bg-gray-750 hover:border-blue-500'
                      : 'bg-white border-[#93C5FD] hover:bg-[#EBF4FF] hover:border-[#007aff]'
                    }`}
                  style={{ borderColor: isDark ? undefined : primaryColor + '66' }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-dashed"
                    style={{ borderColor: primaryColor }}
                  >
                    <Image className="w-8 h-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#4A5568]'}`}>
                      glisser ou téléchargez la miniature
                    </p>
                    <p className="text-xs mt-1 font-medium" style={{ color: primaryColor }}>
                      Image Size 1920x1080
                    </p>
                  </div>
                </div>
              </FileUpload>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
