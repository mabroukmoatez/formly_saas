import React from 'react';
import { Play } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { fixImageUrl } from '../../../lib/utils';

interface VideoPlayerSectionProps {
  course?: {
    title?: string;
    categories?: string[];
    price?: number;
    duration?: string;
    lessons_count?: number;
    version?: string;
    updated_at?: string;
    cover_image?: string;
    video_url?: string;
  };
  onClose?: () => void;
}

export const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  course,
  onClose,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <section className="flex items-start justify-between w-full">
      <div className="flex flex-col max-w-[703px] gap-2.5">
        <header className="flex items-end gap-3.5 w-full">
          <h1 className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[19.5px] tracking-[0] leading-[normal]">
            {course?.title || 'The Complete AI Guide: Learn ChatGPT, Generative AI & More'}
          </h1>
        </header>

        <div className="inline-flex items-center gap-2 flex-wrap">
          {course?.categories && course.categories.length > 0 ? (
            course.categories.slice(0, 3).map((category, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3.5 py-0.5 bg-[#eee0ff] rounded-[30px] hover:bg-[#eee0ff]"
              >
                <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#8c2ffe] text-[15.5px] tracking-[0] leading-[normal]">
                  {category}
                </span>
              </Badge>
            ))
          ) : (
            <>
              <Badge variant="secondary" className="px-3.5 py-0.5 bg-[#eee0ff] rounded-[30px] hover:bg-[#eee0ff]">
                <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#8c2ffe] text-[15.5px] tracking-[0] leading-[normal]">
                  Ai Tools
                </span>
              </Badge>
              <Badge variant="secondary" className="px-3.5 py-0.5 bg-[#eee0ff] rounded-[30px] hover:bg-[#eee0ff]">
                <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#8c2ffe] text-[15.5px] tracking-[0] leading-[normal]">
                  Chat Gpt
                </span>
              </Badge>
            </>
          )}
          {course?.categories && course.categories.length > 3 && (
            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5c677e] text-[13.5px] tracking-[0] leading-[normal]">
              +{course.categories.length - 3} Categories
            </span>
          )}
        </div>

        <div className="inline-flex items-start gap-[31px] flex-wrap">
          {course?.price && (
            <div className="inline-flex h-[23px] items-center gap-2.5">
              <span className="mt-[-2.50px] mb-[-0.50px] font-bold text-[#007aff] text-[17.5px] [font-family:'Poppins',Helvetica] tracking-[0] leading-[normal]">
                $
              </span>
              <span className="mt-[-1.00px] font-normal text-[#5b677d] text-[15.5px] [font-family:'Poppins',Helvetica] tracking-[0] leading-[normal]">
                {course.price}$
              </span>
            </div>
          )}

          {course?.duration && (
            <div className="inline-flex h-[23px] items-center gap-2.5">
              <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] tracking-[0] leading-[normal]">
                {course.duration}
              </span>
            </div>
          )}

          {course?.lessons_count && (
            <div className="inline-flex h-[23px] items-center gap-2.5">
              <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] tracking-[0] leading-[normal]">
                {course.lessons_count} Lesson{course.lessons_count > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {course?.version && (
            <div className="inline-flex h-[23px] items-center gap-2.5">
              <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#007aff] text-[15.5px] tracking-[0] leading-[normal]">
                Version {course.version}
              </span>
              {course.updated_at && (
                <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] tracking-[0] leading-[normal]">
                  {' '}Maj {formatDate(course.updated_at)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <div className="inline-flex items-center justify-end gap-1.5">
          <Button
            className="h-[38px] gap-4 p-3 bg-[#19294a] rounded-[13px] hover:bg-[#19294a]/90 transition-colors"
            onClick={onClose}
          >
            <div className="inline-flex items-center gap-2 mt-[-6.00px] mb-[-6.00px]">
              <span className="mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#ffffff] text-[17px] text-right tracking-[0] leading-[normal]">
                ferme l&apos;Apercu
              </span>
            </div>
          </Button>
        </div>
      )}
    </section>
  );
};

