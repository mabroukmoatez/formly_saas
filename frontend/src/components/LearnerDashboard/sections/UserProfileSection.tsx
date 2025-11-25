import React from 'react';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { fixImageUrl } from '../../../lib/utils';

interface UserProfileSectionProps {
  course?: {
    objectives?: string[];
    modules?: Array<{ title: string; id?: number }>;
    instructors?: Array<{
      id: number;
      name: string;
      role?: string;
      avatar?: string;
    }>;
  };
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  course,
}) => {
  const objectives = course?.objectives || [
    'Use ChatGPT for ideation, content creation, research, and automation.',
    'Use ChatGPT for ideation, content creation, research, and automation.',
    'Use ChatGPT for ideation, content creation, research, and automation.',
    'Use ChatGPT for ideation, content creation, research, and automation.',
    'Use ChatGPT for ideation, content creation, research, and automation.',
    'Use ChatGPT for ideation, content creation, research, and automation.',
  ];

  const modules = course?.modules || [
    { title: 'What is Artificial Intelligence, Really?', id: 1 },
    { title: 'What is Artificial Intelligence, Really?', id: 2 },
    { title: 'What is Artificial Intelligence, Really?', id: 3 },
    { title: 'What is Artificial Intelligence, Really?', id: 4 },
    { title: 'What is Artificial Intelligence, Really?', id: 5 },
  ];

  const trainers = course?.instructors || [
    {
      id: 1,
      name: 'Sophie Bernard',
      role: 'Formatrice',
      avatar: undefined,
    },
    {
      id: 2,
      name: 'Sophie Bernard',
      role: 'Formatrice',
      avatar: undefined,
    },
  ];

  return (
    <section className="flex flex-col w-full max-w-[518.44px] items-start gap-[19px] relative">
      <Card className="w-full bg-white rounded-[18px] border border-[#d2d2e7] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        <CardContent className="flex flex-col items-start justify-end gap-7 p-5">
          <header className="flex items-center justify-between w-full">
            <h2 className="[font-family:'Poppins',Helvetica] font-medium text-[#08ab39] text-[17px] tracking-[0] leading-[normal]">
              Objective
            </h2>
            <span className="text-[26px]">✅</span>
          </header>

          <ul className="flex flex-col items-start gap-2.5 w-full">
            {objectives.map((objective, index) => (
              <li key={index} className="flex items-center gap-7 w-full">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-[7px]">
                    <span className="text-[#08ab39] text-lg">✓</span>
                    <p className="w-[393px] font-medium text-[#6a90b9] text-[11px] [font-family:'Poppins',Helvetica] tracking-[0] leading-[normal]">
                      {objective}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full bg-white rounded-[18px] border border-[#d2d2e7] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <CardContent className="flex flex-col items-start justify-end gap-7 p-5">
          <header className="flex items-center justify-between w-full">
            <h2 className="[font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[17px] tracking-[0] leading-[normal]">
              Module
            </h2>
            <span className="text-[26px]">📚</span>
          </header>

          <ul className="flex flex-col items-start gap-2 w-full">
            {modules.map((module, index) => (
              <li
                key={module.id || index}
                className="flex h-[47px] items-center justify-between px-[17px] py-3 w-full bg-[#e8f0f7] rounded-[18px] cursor-pointer transition-colors hover:bg-[#d8e8f5]"
              >
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-[7px]">
                    <span className="text-[#007aff] text-sm">📄</span>
                    <p className="[font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-[11px] tracking-[0] leading-[normal]">
                      {module.title}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full bg-[#e5f3ff] rounded-[18px] border border-[#007aff] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <CardContent className="flex flex-col items-center gap-3.5 p-[17px]">
          <h2 className="self-stretch [font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[15px] tracking-[0] leading-[normal]">
            Formateur
          </h2>

          <div className="flex w-full items-center justify-between gap-4">
            {trainers.map((trainer) => (
              <article
                key={trainer.id}
                className="inline-flex items-start gap-3 px-[21px] py-3 bg-white rounded-[16.17px] border border-[#e8f0f7] transition-transform hover:scale-[1.02]"
              >
                {trainer.avatar ? (
                  <img
                    className="w-[54px] h-[54px] object-cover rounded-full"
                    alt={`${trainer.name} profile`}
                    src={fixImageUrl(trainer.avatar)}
                  />
                ) : (
                  <div className="w-[54px] h-[54px] bg-[#ff9600] rounded-full flex items-center justify-center text-white font-bold">
                    {trainer.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="inline-flex h-[54px] items-center gap-4">
                  <div className="inline-flex flex-col items-start gap-1.5">
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px] tracking-[0] leading-[normal]">
                      {trainer.name}
                    </h3>
                    <Badge className="inline-flex items-center justify-center gap-2 px-2.5 py-0.5 bg-[#ebf1ff] rounded-[10.83px] border-[0.83px] border-[#007aff] hover:bg-[#ebf1ff]">
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-xs tracking-[0] leading-[normal]">
                        {trainer.role || 'Formateur'}
                      </span>
                    </Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

