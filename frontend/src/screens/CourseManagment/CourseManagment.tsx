import { Grid3x3Icon, ListIcon, SearchIcon } from "lucide-react";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SearchSection } from "./sections/SearchSection";
import { SidebarSection } from "./sections/SidebarSection";

export const CourseManagment = (): JSX.Element => {
  return (
    <div className="bg-white w-full min-h-screen flex" data-model-id="7:2859">
      <SidebarSection />

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex-1" />

          <nav className="flex items-center gap-7">
            <button className="relative">
              <img
                className="w-[23px] h-[23px]"
                alt="Notifications"
                src="/assets/icons/notification-4.png"
              />
            </button>

            <button className="relative">
              <img
                className="w-[26.07px] h-[23px]"
                alt="Messages"
                src="/assets/icons/message.svg"
              />
            </button>

            <button className="relative">
              <img
                className="w-[23px] h-[23px]"
                alt="Settings"
                src="/assets/icons/settings.svg"
              />
            </button>

            <Avatar className="w-[52.59px] h-[52.59px]">
              <AvatarImage src="/assets/images/avatar.svg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </nav>
        </header>

        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-[461px]">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[22.22px] h-[22.22px] text-[#6a90b9]" />
              <Input
                placeholder="Recherche Une Formation"
                className="pl-[54px] bg-[#e8f0f7] border-0 h-10 rounded-[10px] text-[13px] font-medium text-[#6a90b9] [font-family:'Poppins',Helvetica] placeholder:text-[#6a90b9]"
              />
            </div>

            <Button className="bg-[#ecf1fd] text-[#007aff] border border-[#007aff] rounded-[10px] px-[19px] py-2.5 h-auto hover:bg-[#d9e7fc] [font-family:'Poppins',Helvetica] font-medium text-[17px]">
              <img
                className="w-[15.29px] h-[15.29px]"
                alt="Create"
                src="/assets/icons/plus.svg"
              />
              Create Course
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2.5 mb-6">
            <Button
              variant="ghost"
              className="bg-[#e8f0f7] text-[#6a90b9] rounded-[10px] px-4 py-2.5 h-10 hover:bg-[#d9e1ec] [font-family:'Poppins',Helvetica] font-medium text-[13px]"
            >
              <img
                className="w-5 h-5"
                alt="Filter"
                src="/assets/icons/filter-2.png"
              />
              Flitre
              <img
                className="w-[11px] h-[6.51px]"
                alt="Dropdown"
                src="/assets/icons/dropdown.svg"
              />
            </Button>

            <div className="flex items-center gap-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-l-[10px] rounded-r-none bg-[#e8f0f7] hover:bg-[#d9e1ec]"
              >
                <Grid3x3Icon className="w-5 h-5 text-[#6a90b9]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-r-[10px] rounded-l-none bg-[#e8f0f7] hover:bg-[#d9e1ec] border-l border-[#d0dce8]"
              >
                <ListIcon className="w-5 h-5 text-[#6a90b9]" />
              </Button>
            </div>
          </div>

          <SearchSection />
        </div>
      </main>
    </div>
  );
};
