import React from "react";
import { CourseContentSection } from "./sections/CourseContentSection";
import { CourseDescriptionSection } from "./sections/CourseDescriptionSection";
import { CourseDetailsSection } from "./sections/CourseDetailsSection";

export const VideoAndThump = (): JSX.Element => {
  return (
    <main
      className="bg-white w-full relative opacity-0 translate-y-[-1rem] animate-fade-in"
      data-model-id="7:4158"
    >
      <div className="flex w-full">
        <aside className="opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:400ms]">
          <CourseDetailsSection />
        </aside>

        <div className="flex flex-col flex-1">
          <div className="w-full opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
            <CourseContentSection />
          </div>

          <section className="opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:600ms]">
            <CourseDescriptionSection />
          </section>
        </div>
      </div>
    </main>
  );
};
