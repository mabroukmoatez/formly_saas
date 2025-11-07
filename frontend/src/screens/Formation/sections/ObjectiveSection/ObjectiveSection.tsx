import React from "react";
import { Avatar, AvatarImage } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";

const objectives = [
  {
    icon: "/assets/icons/checkmark.png",
    text: "Use ChatGPT for ideation, content creation, research, and automation.",
    width: "w-[393px]",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003484-1.png",
    text: "Use ChatGPT for ideation, content creation, research, and automation.",
    width: "w-fit",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003484-2.png",
    text: "Use ChatGPT for ideation, content creation, research, and automation.",
    width: "w-fit",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003484-3.png",
    text: "Use ChatGPT for ideation, content creation, research, and automation.",
    width: "w-fit",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003484-4.png",
    text: "Use ChatGPT for ideation, content creation, research, and automation.",
    width: "w-fit",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003484-5.png",
    text: "Use ChatGPT for ideation, content creation, research, and automation.",
    width: "w-fit",
  },
];

const modules = [
  {
    icon: "/assets/icons/document.png",
    text: "What is Artificial Intelligence, Really?",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-2-2.png",
    text: "What is Artificial Intelligence, Really?",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-2-3.png",
    text: "What is Artificial Intelligence, Really?",
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-2-4.png",
    text: "What is Artificial Intelligence, Really?",
  },
  {
    icon: "/assets/icons/document.png",
    text: "What is Artificial Intelligence, Really?",
  },
];

const trainers = [
  {
    name: "Sophie Bernard",
    image: "/assets/images/instructor.svg",
    badge: "Formatice",
  },
  {
    name: "Sophie Bernard",
    image: "/assets/images/instructor.svg",
    badge: "Formatice",
  },
];

export const ObjectiveSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full max-w-[518px] items-start gap-[19px] relative">
      <Card className="w-full bg-white rounded-[18px] border-[#d2d2e7] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        <CardContent className="flex flex-col items-start justify-end gap-7 p-5">
          <header className="flex items-center justify-between w-full">
            <div className="inline-flex items-center gap-2">
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#08ab39] text-[17px] tracking-[0] leading-[normal]">
                Objective
              </h3>
            </div>
            <img
              className="w-[26px] h-[26px]"
              alt="Group"
              src="/assets/icons/expand.png"
            />
          </header>

          <ul className="flex flex-col items-start gap-2.5 w-full">
            {objectives.map((objective, index) => (
              <li key={index} className="flex items-center gap-7 w-full">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-[7px]">
                    <img
                      className="w-[16.12px] h-[16.12px] ml-[-0.56px]"
                      alt="Checkmark"
                      src={objective.icon}
                    />
                    <p
                      className={`${objective.width} [font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[11px] tracking-[0] leading-[normal]`}
                    >
                      {objective.text}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full bg-white rounded-[18px] border-[#d2d2e7] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <CardContent className="flex flex-col items-start justify-end gap-7 p-5">
          <header className="flex items-center justify-between w-full">
            <div className="inline-flex items-center gap-2">
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[17px] tracking-[0] leading-[normal]">
                Module
              </h3>
            </div>
            <img
              className="w-[26px] h-[26px]"
              alt="Group"
              src="/assets/icons/collapse.png"
            />
          </header>

          <ul className="flex flex-col items-start gap-2 w-full">
            {modules.map((module, index) => (
              <li
                key={index}
                className="flex h-[47px] items-center justify-between px-[17px] py-3 w-full bg-[#e8f0f7] rounded-[18px] cursor-pointer transition-colors hover:bg-[#d8e8f5]"
              >
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-[7px]">
                    <img
                      className="w-[12.42px] h-[14.73px] ml-[-0.22px]"
                      alt="Document"
                      src={module.icon}
                    />
                    <p className="[font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-[11px] tracking-[0] leading-[normal]">
                      {module.text}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="relative w-full">
        <img
          className="absolute top-[calc(50%_-_27.5px)] left-[505px] w-0.5 h-[55px]"
          alt="Vector"
          src="/assets/icons/divider.svg"
        />
      </div>

      <Card className="w-full bg-[#e5f3ff] rounded-[18px] border-[#007aff] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <CardContent className="flex flex-col items-center gap-3.5 p-[17px]">
          <h3 className="self-stretch [font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[15px] tracking-[0] leading-[normal]">
            Formateur
          </h3>

          <div className="flex w-full items-center justify-between gap-4">
            {trainers.map((trainer, index) => (
              <article
                key={index}
                className="inline-flex items-start gap-3 px-[21px] py-3 bg-white rounded-[16.17px] border border-[#e8f0f7] transition-transform hover:scale-[1.02]"
              >
                <Avatar className="w-[54px] h-[54px]">
                  <AvatarImage src={trainer.image} alt={trainer.name} />
                </Avatar>

                <div className="inline-flex h-[54px] items-center gap-4">
                  <div className="inline-flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px] tracking-[0] leading-[normal]">
                        {trainer.name}
                      </h4>
                    </div>

                    <Badge className="inline-flex items-center justify-center gap-2 px-2.5 py-0.5 bg-[#ebf1ff] rounded-[10.83px] border-[0.83px] border-[#007aff] hover:bg-[#ebf1ff]">
                      <img
                        className="w-[11.7px] h-[12.5px]"
                        alt="Vector"
                        src="/assets/icons/badge-icon.svg"
                      />
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-xs tracking-[0] leading-[normal]">
                        {trainer.badge}
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
