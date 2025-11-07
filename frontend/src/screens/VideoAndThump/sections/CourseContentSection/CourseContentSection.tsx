import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";

const steps = [
  { number: 1, label: "Informations générales", active: true },
  { number: 2, label: "Contenu", active: false },
  { number: 3, label: "Documents", active: false },
  { number: 4, label: "Questionnaire", active: false },
  { number: 5, label: "Formateur", active: false },
  { number: 6, label: "Déroulement", active: false },
];

const progressBars = [
  { active: true },
  { active: false },
  { active: false },
  { active: false },
  { active: false },
  { active: false },
];

export const CourseContentSection = (): JSX.Element => {
  return (
    <section className="relative w-full">
      <div className="flex flex-col w-full items-end justify-between px-[43px] py-5 bg-[linear-gradient(138deg,rgba(255,255,255,0)_0%,rgba(0,122,255,0.06)_100%)]">
        <header className="flex h-[53px] items-center justify-end gap-7 w-full mb-5">
          <img
            className="w-[23px] h-[23px]"
            alt="Notifications"
            src="/assets/icons/notification-2.png"
          />

          <img
            className="w-[26.07px]"
            alt="Messages"
            src="/assets/icons/message.svg"
          />

          <img
            className="flex-[0_0_auto]"
            alt="Settings"
            src="/assets/icons/settings.svg"
          />

          <Avatar className="w-[52.59px] h-[52.59px]">
            <AvatarImage
              src="/assets/images/avatar.svg"
              alt="User avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </header>

        <div className="inline-flex items-center gap-3 mb-5">
          <Button
            variant="outline"
            className="h-auto inline-flex items-center justify-center gap-4 px-[19px] py-2.5 rounded-[60px] border-[#6a90b9] bg-transparent hover:bg-transparent"
          >
            <img
              className="w-[25px] h-[25px]"
              alt="Auto save icon"
              src="/assets/icons/auto-save.png"
            />
            <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
              Auto Save
            </span>
          </Button>

          <Button className="h-[46px] inline-flex items-center justify-center gap-4 px-[23px] py-2.5 bg-[#6a90b9] rounded-[48px] hover:bg-[#5a7fa9]">
            <span className="w-32 [font-family:'Poppins',Helvetica] font-medium text-[#ffffff] text-[17px] text-center">
              Inédite
            </span>
          </Button>
        </div>

        <nav className="flex items-center justify-between w-full">
          <div className="flex flex-wrap items-center gap-[1px]">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <Badge
                  variant="outline"
                  className={`h-[35.46px] inline-flex items-center justify-center gap-[8.44px] px-[8.44px] py-[6.75px] rounded-[38.44px] ${
                    step.active
                      ? "border-[#007aff] shadow-[0px_0px_13.25px_0.84px_#007aff45] bg-transparent"
                      : "border-[#6a90b9] bg-[#ffffff]"
                  }`}
                >
                  <div className="relative w-[26.21px] h-[24.21px]">
                    <div
                      className={`absolute top-0 left-0 w-6 h-6 rounded-[12.1px] border-[1.69px] border-solid ${
                        step.active ? "border-[#007aff]" : "border-[#6a90b9]"
                      }`}
                    />
                    <div
                      className={`absolute top-[calc(50.00%_-_11px)] left-[7px] [font-family:'Poppins',Helvetica] font-semibold text-[14.4px] text-center ${
                        step.active ? "text-[#007aff]" : "text-[#6a90b9]"
                      }`}
                    >
                      {step.number}
                    </div>
                  </div>
                  <span
                    className={`[font-family:'Poppins',Helvetica] font-semibold text-[14.4px] ${
                      step.active ? "text-[#007aff]" : "text-[#6a90b9]"
                    }`}
                  >
                    {step.label}
                  </span>
                </Badge>
                {index < steps.length - 1 && (
                  <img
                    className="w-[25.24px] h-0.5"
                    alt="Step separator"
                    src="/assets/icons/connector.svg"
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="inline-flex flex-col items-end justify-center gap-px">
            <div className="[font-family:'Poppins',Helvetica] text-[#19294a] text-[19px]">
              <span className="font-bold">10</span>
              <span className="font-normal">/100%</span>
            </div>
            <div className="inline-flex items-center gap-[5px]">
              {progressBars.map((bar, index) => (
                <div
                  key={index}
                  className={`w-[26.25px] h-[5px] rounded-[6.25px] ${
                    bar.active ? "bg-[#007aff]" : "bg-[#d2d2d2]"
                  }`}
                />
              ))}
            </div>
          </div>
        </nav>
      </div>

      <img
        className="w-full h-0 object-cover"
        alt="Section divider"
        src="/assets/images/section-divider.svg"
      />
    </section>
  );
};
