import React from "react";
import { Button } from "../../../../components/ui/button";
import { ScrollArea } from "../../../../components/ui/scroll-area";

const navigationItems = [
  {
    id: "gestion-commerciale",
    label: "Gestion commerciale",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-9.png",
    iconClass: "w-[16.27px] h-[17.32px]",
    hasSubmenu: false,
  },
  {
    id: "gestion-administrative",
    label: "Gestion administrative",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003358-3.png",
    iconClass: "w-[17.5px] h-[19.11px]",
    hasSubmenu: false,
  },
  {
    id: "gestion-formations",
    label: "Gestion des formations",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-10.png",
    iconClass: "w-[16.2px] h-[17.25px]",
    hasSubmenu: true,
    isActive: true,
  },
  {
    id: "parties-prenantes",
    label: "Parties Prenantes",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003263-3.png",
    iconClass: "w-[18.23px] h-[18.01px]",
    hasSubmenu: false,
  },
  {
    id: "marque-blanche",
    label: "Marque Blanche",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003356-3.png",
    iconClass: "w-[18.01px] h-[15.95px]",
    hasSubmenu: false,
  },
];

const submenuItems = [
  {
    id: "statistiques",
    label: "Statistiques",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-11.png",
    iconClass: "w-[16.2px] h-[17.25px]",
    isActive: false,
  },
  {
    id: "gestion-formations-sub",
    label: "Gestion des formations",
    icon: "/assets/icons/file.svg",
    iconClass: "w-[13.95px] h-[16.18px]",
    isActive: true,
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003359-3.png",
    iconClass: "w-[17.81px] h-[15.38px]",
    isActive: false,
  },
  {
    id: "gestion-quizz",
    label: "Gestion Des Quizz",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003262-3.png",
    iconClass: "w-[19px] h-[17.25px]",
    isActive: false,
  },
  {
    id: "supports-pedagogiques",
    label: "Supports Pédagogiques",
    icon: "/assets/icons/expense.svg",
    iconClass: "w-[13.26px] h-[17.34px]",
    isActive: false,
  },
];

export const CourseDetailsSection = (): JSX.Element => {
  return (
    <aside className="flex w-full max-w-[257px] items-start justify-end gap-2.5 px-[13px] py-[17px] bg-white rounded-[18px] overflow-hidden border border-solid border-[#d2d2e7] relative translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
      <img
        className="absolute left-0 bottom-[85px] w-full h-[563px] blur-[50.4px] object-cover pointer-events-none"
        alt="Background decoration"
        src="/assets/images/sidebar-bg-2.png"
      />

      <nav className="relative w-full max-w-[229px]">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-[14px]">
            <img
              className="w-8 h-8"
              alt="Formly logo"
              src="/assets/logos/formly-icon-3.png"
            />
            <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#6a90b9] text-[25px] tracking-[0] leading-normal">
              Formly
            </h1>
          </div>

          <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
            <img
              className="w-[23.66px] h-[23.66px]"
              alt="Menu toggle"
              src="/assets/icons/menu-4.png"
            />
          </Button>
        </header>

        <ScrollArea className="h-auto">
          <div className="flex flex-col gap-1.5">
            {navigationItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <Button
                  variant="ghost"
                  className={`h-auto w-full justify-start gap-[18px] px-[18px] py-2.5 rounded-[7px] shadow-[0px_4px_20px_5px_#09294c12] hover:bg-[#e5f3ff] transition-colors ${
                    item.isActive
                      ? "font-semibold text-[#007aff]"
                      : "font-medium text-[#6a90b9]"
                  } [font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal`}
                >
                  <img
                    className={item.iconClass}
                    alt={`${item.label} icon`}
                    src={item.icon}
                  />
                  <span>{item.label}</span>
                </Button>

                {item.hasSubmenu && (
                  <div className="flex flex-col gap-1.5 pl-[18px] relative">
                    <div className="absolute top-0 left-[18px] w-px h-[250px] bg-gradient-to-b from-[#d2d2e7] to-transparent" />

                    {submenuItems.map((subItem) => (
                      <Button
                        key={subItem.id}
                        variant="ghost"
                        className={`h-auto w-full justify-start gap-[18px] px-[18px] py-[17px] rounded-[7px] hover:bg-[#e5f3ff] transition-colors ${
                          subItem.isActive
                            ? "bg-[#e5f3ff] font-semibold text-[#007aff]"
                            : "font-medium text-[#6a90b9]"
                        } [font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal`}
                      >
                        <img
                          className={subItem.iconClass}
                          alt={`${subItem.label} icon`}
                          src={subItem.icon}
                        />
                        <span>{subItem.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </nav>
    </aside>
  );
};
