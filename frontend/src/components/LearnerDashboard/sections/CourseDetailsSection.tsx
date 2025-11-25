import React from 'react';
import { Play } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { fixImageUrl } from '../../../lib/utils';

interface CourseDetailsSectionProps {
  course?: {
    description?: string;
    target_audience?: string;
    prerequisites?: string;
    pedagogical_methods?: string;
    evaluation_methods?: string;
    monitoring_methods?: string;
    cover_image?: string;
    video_url?: string;
  };
}

export const CourseDetailsSection: React.FC<CourseDetailsSectionProps> = ({
  course,
}) => {
  const courseDetails = [
    {
      icon: '📝',
      title: 'Description',
      content: course?.description || 'The Complete AI Guide is your practical, no-BS introduction to how AI is actually changing the game—today, not in some distant future.',
      isList: false,
    },
    {
      icon: '👥',
      title: 'Public Visé',
      content: course?.target_audience || 'Use ChatGPT for ideation, content creation, research, and automation.',
      isList: true,
    },
    {
      icon: '📋',
      title: 'Prerequis',
      content: course?.prerequisites || 'Use ChatGPT for ideation, content creation, research, and automation.',
      isList: true,
    },
  ];

  const methodSections = [
    {
      title: 'Moyens pédagogiques et techniques mis en œuvre',
      content: course?.pedagogical_methods || 'Use ChatGPT for ideation, content creation, research, and automation.',
    },
    {
      title: 'Moyens permettant d\'apprécier les résultats',
      content: course?.evaluation_methods || 'Use ChatGPT for ideation, content creation, research, and automation.',
    },
    {
      title: 'Moyens permettant de suivre l\'execution',
      content: course?.monitoring_methods || 'Use ChatGPT for ideation, content creation, research, and automation.',
    },
  ];

  return (
    <section className="flex flex-col items-start gap-4 w-full">
      <div className="relative w-full opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:0ms]">
        {course?.cover_image ? (
          <img
            className="w-full h-auto rounded-lg"
            alt="Course preview"
            src={fixImageUrl(course.cover_image)}
          />
        ) : (
          <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
            <Play className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {course?.video_url && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95px] h-[95px] flex items-center justify-center cursor-pointer">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-white/90 rounded-full" />
              <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#6a90b9] fill-[#6a90b9]" />
            </div>
          </div>
        )}
      </div>

      <Card className="w-full bg-white rounded-[18px] border border-[#dadfe8] opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
        <CardContent className="flex flex-col items-start gap-7 px-[37px] py-[41px]">
          {courseDetails.map((detail, index) => (
            <div
              key={index}
              className="flex flex-col items-start gap-[17px] w-full"
            >
              <div className="flex items-center gap-2.5 w-full">
                <span className="text-[25px]">{detail.icon}</span>
                <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px] tracking-[0] leading-[normal]">
                  {detail.title}
                </h3>
              </div>

              <p className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#5c677e] text-[15.5px] tracking-[0] leading-[normal] whitespace-pre-line">
                {detail.content}
              </p>
            </div>
          ))}

          <div className="flex flex-col items-start gap-[17px] w-full">
            <div className="flex items-center gap-2.5 w-full">
              <span className="text-[25px]">📚</span>
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px] tracking-[0] leading-[normal]">
                Method De Formation
              </h3>
            </div>

            {methodSections.map((section, index) => (
              <div
                key={index}
                className="w-full [font-family:'Poppins',Helvetica] text-[17px] tracking-[0] leading-[17px]"
              >
                <p className="font-medium text-[#19294a] mb-1">
                  {section.title}
                </p>
                <p className="font-normal text-[#5b677d]">{section.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

