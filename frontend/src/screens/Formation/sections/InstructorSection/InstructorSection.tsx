import {
  ClipboardListIcon,
  FileTextIcon,
  InfoIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../../../components/ui/tabs";

const tabItems = [
  { id: "description", label: "Description", active: true },
  { id: "contenu", label: "Contenu", active: false },
  { id: "documents", label: "Documents", active: false },
  { id: "questionnaire", label: "Questionnaire", active: false },
  { id: "deroulement", label: "Déroulement", active: false },
];

const contentSections = [
  {
    icon: "info",
    title: "Description",
    content:
      "The Complete AI Guide is your practical, no-BS introduction to how AI is actually changing the game—today, not in some distant future.The Complete AI Guide is your practical, no-BS introduction to how AI is actually changing the game—today, not in some distant future.The Complete AI Guide is your practical, no-BS introduction to how AI is actually changing the game—today, not in some distant future.",
  },
  {
    icon: "users",
    title: "Public Vise",
    content: [
      "Use ChatGPT for ideation, content creation, research, and automation.",
      "Use ChatGPT for ideation, content creation, research, and automation.",
      "Use ChatGPT for ideation, content creation, research, and automation.",
    ],
  },
  {
    icon: "clipboard",
    title: "Prerequis",
    content: [
      "Use ChatGPT for ideation, content creation, research, and automation.",
      "Use ChatGPT for ideation, content creation, research, and automation.",
      "Use ChatGPT for ideation, content creation, research, and automation.",
    ],
  },
];

const formationMethods = [
  {
    heading: "Moyens pédagogiques et techniques mis en œuvre",
    content:
      "Use ChatGPT for ideation, content creation, research, and automation.",
  },
  {
    heading: "Moyens permettant d'apprécier les résultats",
    content:
      "Use ChatGPT for ideation, content creation, research, and automation.",
  },
  {
    heading: "Moyens permettant de suivre l'execution",
    content:
      "Use ChatGPT for ideation, content creation, research, and automation.",
  },
];

export const InstructorSection = (): JSX.Element => {
  const [activeTab, setActiveTab] = React.useState("description");

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "info":
        return <InfoIcon className="w-[25px] h-[25px] text-[#6a90b9]" />;
      case "users":
        return <UsersIcon className="w-[25px] h-[25px] text-[#6a90b9]" />;
      case "clipboard":
        return (
          <ClipboardListIcon className="w-[25px] h-[25px] text-[#6a90b9]" />
        );
      default:
        return null;
    }
  };

  return (
    <section className="flex flex-col w-full max-w-[831px] items-start gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-[50px] bg-white rounded-[63px] shadow-[0px_4px_18.8px_#0000000f] p-1.5 justify-between">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={`h-[38px] px-3 py-3 rounded-[33px] [font-family:'Poppins',Helvetica] font-medium text-[17px] transition-colors data-[state=active]:bg-[#ffe5ca] data-[state=active]:text-[#ff7700] data-[state=inactive]:text-[#6a90b9] data-[state=inactive]:bg-transparent`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative inline-flex flex-col items-start">
        <img
          className="w-full max-w-[831px] h-auto aspect-[831/387] object-cover rounded-lg"
          alt="Course instructor video"
          src="/assets/images/course-instructor.png"
        />

        <button
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95px] h-[95px] flex items-center justify-center group hover:scale-110 transition-transform"
          aria-label="Play video"
        >
          <img
            className="absolute w-[57px] h-[61px]"
            alt="Play button background"
            src="/assets/icons/play.svg"
          />
          <img
            className="absolute w-8 h-[34px] ml-2"
            alt="Play icon"
            src="/assets/icons/play.svg"
          />
        </button>
      </div>

      <Card className="w-full border border-[#dadfe8] rounded-[18px] shadow-none">
        <CardContent className="flex flex-col items-start gap-7 px-[37px] py-[41px]">
          {contentSections.map((section, index) => (
            <div
              key={index}
              className="flex flex-col items-start gap-[17px] w-full"
            >
              <div className="flex items-center gap-2.5 w-full">
                {renderIcon(section.icon)}
                <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
                  {section.title}
                </h3>
              </div>

              {Array.isArray(section.content) ? (
                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#5c677e] text-[15.5px]">
                  {section.content.map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < section.content.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5c677e] text-[15.5px]">
                  {section.content}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-col items-start gap-[17px] w-full">
            <div className="flex items-center gap-2.5 w-full">
              <FileTextIcon className="w-[21.85px] h-[25px] text-[#6a90b9]" />
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
                Method De Formation
              </h3>
            </div>

            {formationMethods.map((method, index) => (
              <div
                key={index}
                className="[font-family:'Poppins',Helvetica] text-[17px] leading-[17px]"
              >
                <span className="font-medium text-[#19294a]">
                  {method.heading}
                  <br />
                </span>
                <span className="font-normal text-[#5b677d]">
                  {method.content}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
