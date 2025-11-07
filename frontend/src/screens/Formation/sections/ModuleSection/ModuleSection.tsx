import { BookOpenIcon, ClockIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";

const categories = [
  { label: "Ai Tools" },
  { label: "Chat Gpt" },
  { label: "Category Name" },
];

const metadata = [
  { icon: "$", label: "230$", iconColor: "text-[#007aff]" },
  { icon: "clock", label: "7 Hours" },
  { icon: "book", label: "26 Lesson" },
  { version: "Version 1", date: "Maj 01/10/2025" },
];

export const ModuleSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full max-w-[703px] gap-2.5 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <header className="flex items-end gap-3.5 w-full">
        <h1 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[19.5px] leading-normal">
          The Complete AI Guide: Learn ChatGPT, Generative AI &amp; More
        </h1>
      </header>

      <div className="inline-flex items-center gap-2 flex-wrap">
        {categories.map((category, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="px-3.5 py-0.5 bg-[#eee0ff] hover:bg-[#e0d0ff] rounded-[30px] transition-colors"
          >
            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#8c2ffe] text-[15.5px] leading-normal">
              {category.label}
            </span>
          </Badge>
        ))}

        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5c677e] text-[13.5px] leading-normal">
          +4 Categories
        </span>
      </div>

      <div className="inline-flex items-start gap-[31px] flex-wrap">
        <div className="inline-flex h-[23px] items-center gap-2.5">
          <span className="[font-family:'Poppins',Helvetica] font-bold text-[#007aff] text-[17.5px] leading-normal">
            $
          </span>
          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] leading-normal">
            230$
          </span>
        </div>

        <div className="inline-flex h-[23px] items-center gap-2.5">
          <ClockIcon className="w-[15.83px] h-[18.33px] text-[#5b677d]" />
          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] leading-normal">
            7 Hours
          </span>
        </div>

        <div className="inline-flex h-[23px] items-center gap-2.5">
          <BookOpenIcon className="w-[17.12px] h-[20.73px] text-[#5b677d]" />
          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] leading-normal">
            26 Lesson
          </span>
        </div>

        <div className="inline-flex h-[23px] items-center gap-2.5">
          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#007aff] text-[15.5px] leading-normal">
            Version 1
          </span>
          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5b677d] text-[15.5px] leading-normal">
            Maj 01/10/2025
          </span>
        </div>
      </div>
    </section>
  );
};
