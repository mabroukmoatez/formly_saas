import { EditIcon, EyeIcon, Trash2Icon } from "lucide-react";
import React from "react";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { DescriptionSection } from "./sections/DescriptionSection";
import { InstructorSection } from "./sections/InstructorSection";
import { ModuleSection } from "./sections/ModuleSection";
import { ObjectiveSection } from "./sections/ObjectiveSection";

const headerIcons = [
  {
    src: "/assets/icons/notification-3.png",
    alt: "Group",
    className: "w-[23px] h-[23px]",
  },
  {
    src: "/assets/icons/message.svg",
    alt: "Frame",
    className: "w-[26.07px]",
  },
  {
    src: "/assets/icons/settings.svg",
    alt: "Frame",
    className: "",
  },
];

export const Formation = (): JSX.Element => {
  return (
    <div
      className="bg-[#f9f9f9] overflow-hidden w-full min-h-screen relative"
      data-model-id="7:3566"
    >
      <header className="absolute top-[17px] right-[23px] flex items-center gap-7 z-10 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:0ms]">
        {headerIcons.map((icon, index) => (
          <img
            key={index}
            className={`relative ${icon.className}`}
            alt={icon.alt}
            src={icon.src}
          />
        ))}
        <Avatar className="w-[52.59px] h-[52.59px]">
          <AvatarImage src="/assets/images/avatar.svg" />
        </Avatar>
      </header>

      <div className="fixed top-[124px] right-6 flex items-center gap-1.5 z-10 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
        <Button
          variant="ghost"
          className="h-auto bg-[#e8f0f7] hover:bg-[#d8e5f2] rounded-[13px] px-3 py-2 gap-2 transition-colors"
        >
          <Trash2Icon className="w-[19px] h-[19px] text-[#6a90b9]" />
          <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
            delete
          </span>
        </Button>

        <Button
          variant="ghost"
          className="h-auto bg-[#e8f0f7] hover:bg-[#d8e5f2] rounded-[13px] px-3 py-2 gap-2 transition-colors"
        >
          <EditIcon className="w-[16.62px] h-[16.52px] text-[#6a90b9]" />
          <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
            EditIcon Course
          </span>
        </Button>

        <Button className="h-auto bg-[#19294a] hover:bg-[#0f1a2e] rounded-[13px] px-3 py-2 gap-2 transition-colors">
          <EyeIcon className="w-[17.63px] h-[13.98px] text-white" />
          <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[17px]">
            ferme l&apos;Apercu
          </span>
        </Button>
      </div>

      <div className="flex w-full min-h-screen">
        <aside className="w-[128px] flex-shrink-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:400ms]">
          <DescriptionSection />
        </aside>

        <main className="flex-1 flex flex-col opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:600ms]">
          <section className="w-full relative">
            <ModuleSection />
          </section>

          <section className="w-full relative">
            <InstructorSection />
          </section>
        </main>

        <aside className="w-[244px] flex-shrink-0 relative opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:800ms]">
          <ObjectiveSection />
          <img
            className="absolute top-[calc(50%_-_60px)] left-0 w-[5px] h-[120px]"
            alt="Vector"
            src="/assets/icons/divider-2.svg"
          />
        </aside>
      </div>

      <img
        className="absolute top-[332px] right-[37px] w-0.5 h-[55px]"
        alt="Vector"
        src="/assets/icons/divider.svg"
      />
    </div>
  );
};
