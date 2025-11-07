import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FileUpload } from '../ui/file-upload';
import { RobustVideoPlayer } from '../ui/robust-video-player';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { InfoIcon } from 'lucide-react';

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

  return (
    <Card className={`rounded-[18px] border-[#dbd8d8] shadow-[0px_0px_75.7px_#19294a17] ${className}`}>
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
              <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
                {t('courseCreation.form.addIntroMedia')}
              </span>
              <InfoIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Upload Buttons */}
          <div className="flex justify-center items-center gap-4">
            <FileUpload
              accept="video/*"
              maxSize={100}
              courseUuid={courseUuid}
              uploadType="intro-video"
              uploadIntroVideo={uploadIntroVideo}
              onFileUploaded={(file, url) => onVideoUpload(file, url)}
            >
              <Button 
                className="h-auto inline-flex items-center gap-2.5 px-[19px] py-[26px] rounded-[15px] border hover:opacity-90 cursor-pointer"
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white',
                  border: 'none'
                }}
              >
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-white text-[17px]">
                  {t('courseCreation.form.introVideo')}
                </span>
                <img
                  className="w-[38.89px] h-[26.39px]"
                  alt="Video"
                  src="/assets/icons/video.png"
                />
              </Button>
            </FileUpload>

            <FileUpload
              accept="image/*"
              maxSize={10}
              courseUuid={courseUuid}
              uploadType="intro-image"
              uploadIntroImage={uploadIntroImage}
              onFileUploaded={(file, url) => onImageUpload(file, url)}
            >
              <Button
                variant="outline"
                className="h-auto inline-flex items-center gap-2.5 px-[19px] py-[26px] rounded-[15px] hover:opacity-90 cursor-pointer"
                style={{ 
                  borderColor: primaryColor, 
                  color: primaryColor,
                  backgroundColor: 'transparent'
                }}
              >
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[17px]">
                  {t('courseCreation.form.introImage')}
                </span>
                <img
                  className="w-[25.53px] h-[27px]"
                  alt="Image"
                  src="/assets/icons/image.png"
                />
              </Button>
            </FileUpload>
          </div>
        </div>

        {/* Media Preview Section */}
        {(introVideo || introImage || introVideoUrl || introImageUrl) && (
          <div className="flex flex-col gap-4 px-[22px] py-[15px] bg-[#fcf1e5] rounded-[20px]">
            <div className="flex gap-7">
              {/* Video Preview */}
              {(introVideo || introVideoUrl) && (
                <div className="flex-1 flex flex-col items-center gap-4">
                  <div className="inline-flex items-center gap-3">
                    <div className="inline-flex items-center gap-2">
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[17px]">
                        {t('courseCreation.form.introVideo')}
                      </span>
                      <InfoIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-3.5 py-[13px] w-full bg-white rounded-[42px]">
                    <div className="flex-1 h-[168px] rounded-lg overflow-hidden">
                      <RobustVideoPlayer
                        src={introVideo ? URL.createObjectURL(introVideo) : introVideoUrl || ''}
                        title={introVideo?.name || 'Intro Video'}
                        size="sm"
                        className="w-full h-full"
                        showControls={true}
                      />
                    </div>
                    <div className="inline-flex flex-col gap-[22px]">
                      <div className="inline-flex flex-col gap-4">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
                          {introVideo?.name || 'Intro Video'}
                        </span>
                        <Badge
                          variant="outline"
                          className="inline-flex items-center justify-center gap-2.5 px-3 py-[7px] bg-white rounded-[70px] h-auto"
                          style={{
                            borderColor: primaryColor,
                            color: primaryColor
                          }}
                        >
                          <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                            {t('courseCreation.form.uploaded')}
                          </span>
                        </Badge>
                      </div>
                      <div className="inline-flex items-center gap-[12.37px]">
                        <FileUpload
                          accept="video/*"
                          maxSize={100}
                          onFileUploaded={(file, url) => onVideoUpload(file, url)}
                        >
                          <Button variant="ghost" size="icon" className="w-[37.92px] h-[37.92px] p-0">
                            <img className="w-full h-full" alt="Edit" src="/assets/icons/edit.svg" />
                          </Button>
                        </FileUpload>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-[37.92px] h-[37.92px] p-0"
                          onClick={onVideoRemove}
                        >
                          <img className="w-full h-full" alt="Delete" src="/assets/icons/delete.svg" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {(introImage || introImageUrl) && (
                <div className="flex-1 flex flex-col items-center gap-4">
                  <div className="inline-flex items-center gap-3">
                    <div className="inline-flex items-center gap-2">
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[17px]">
                        {t('courseCreation.form.introImage')}
                      </span>
                      <InfoIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="relative flex items-center gap-4 px-3.5 py-[13px] w-full bg-white rounded-[42px]">
                    <div className="flex-1 h-[168px] bg-gray-100 rounded-[26px] flex items-center justify-center">
                      <img 
                        src={introImage ? URL.createObjectURL(introImage) : introImageUrl || ''} 
                        className="w-full h-full object-cover rounded-[26px]"
                        alt="Thumbnail"
                        onError={(e) => {
                          e.currentTarget.src = '/uploads/default/course.jpg';
                        }}
                      />
                    </div>
                    <div className="inline-flex flex-col gap-[22px] relative z-10">
                      <div className="inline-flex flex-col gap-4">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
                          {introImage?.name || 'Intro Image'}
                        </span>
                        <Badge
                          variant="outline"
                          className="inline-flex items-center justify-center gap-2.5 px-3 py-[7px] bg-white rounded-[70px] h-auto"
                          style={{
                            borderColor: primaryColor,
                            color: primaryColor
                          }}
                        >
                          <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                            {t('courseCreation.form.uploaded')}
                          </span>
                        </Badge>
                      </div>
                      <div className="inline-flex items-center gap-[12.37px]">
                        <FileUpload
                          accept="image/*"
                          maxSize={10}
                          onFileUploaded={(file, url) => onImageUpload(file, url)}
                        >
                          <Button variant="ghost" size="icon" className="w-[37.92px] h-[37.92px] p-0">
                            <img className="w-full h-full" alt="Edit" src="/assets/icons/edit.svg" />
                          </Button>
                        </FileUpload>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-[37.92px] h-[37.92px] p-0"
                          onClick={onImageRemove}
                        >
                          <img className="w-full h-full" alt="Delete" src="/assets/icons/delete.svg" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
