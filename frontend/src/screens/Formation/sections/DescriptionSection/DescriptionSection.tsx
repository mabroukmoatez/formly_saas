import React from "react";
import { Button } from "../../../../components/ui/button";

const navigationItems = [
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-3.png",
    label: "Gestion commerciale",
    active: false,
    hasSubmenu: false,
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003358-1.png",
    label: "Gestion administrative",
    active: false,
    hasSubmenu: false,
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-4.png",
    label: "Gestion des formations",
    active: true,
    hasSubmenu: true,
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003263-1.png",
    label: "Parties Prenantes",
    active: false,
    hasSubmenu: false,
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003356-1.png",
    label: "Marque Blanche",
    active: false,
    hasSubmenu: false,
  },
];

const submenuItems = [
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-5.png",
    label: "Statistiques",
    active: false,
  },
  {
    icon: "/assets/icons/file.svg",
    label: "Gestion des formations",
    active: true,
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003359-1.png",
    label: "Sessions",
    active: false,
  },
  {
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003262-1.png",
    label: "Gestion Des Quizz",
    active: false,
  },
  {
    icon: "/assets/icons/expense.svg",
    label: "Supports Pédagogiques",
    active: false,
  },
];

export const DescriptionSection = (): JSX.Element => {
  return (
    <aside className="flex flex-col w-[257px] min-h-[1059px] gap-2.5 p-[13px_13px_17px_13px] bg-white rounded-[18px] border border-solid border-[#d2d2e7] overflow-hidden relative animate-fade-in opacity-0">
      <img
        className="absolute left-0 bottom-[85px] w-[257px] h-[563px] blur-[50.4px] object-cover pointer-events-none"
        alt="Background decoration"
        src="/assets/images/sidebar-bg-2.png"
      />

      <div className="relative flex flex-col gap-[40px] z-10">
        <header className="flex items-center justify-between px-[5px]">
          <div className="flex items-center gap-[14px]">
            <img
              className="w-[31px] h-8"
              alt="Formly logo"
              src="/assets/logos/formly-icon.png"
            />
            <span className="[font-family:'Urbanist',Helvetica] font-bold text-[#6a90b9] text-[25px] tracking-[0] leading-normal">
              Formly
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
            <img
              className="w-[23.66px] h-[23.66px]"
              alt="Menu toggle"
              src="/assets/icons/menu-2.png"
            />
          </Button>
        </header>

        <nav className="flex flex-col gap-1.5">
          {navigationItems.map((item, index) => (
            <React.Fragment key={index}>
              <Button
                variant="ghost"
                className={`h-auto w-full justify-start gap-2.5 px-[18px] py-2.5 rounded-[7px] shadow-[0px_4px_20px_5px_#09294c12] hover:bg-[#e5f3ff] transition-colors ${
                  item.active ? "bg-transparent" : ""
                }`}
              >
                <div className="flex items-center gap-[18px]">
                  <img
                    className="w-4 h-4 object-contain"
                    alt={`${item.label} icon`}
                    src={item.icon}
                  />
                  <span
                    className={`[font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal ${
                      item.active
                        ? "font-semibold text-[#007aff]"
                        : "font-medium text-[#6a90b9]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Button>

              {item.hasSubmenu && (
                <div className="flex flex-col gap-1.5 pl-[18px] relative">
                  <div className="absolute top-0 left-[18px] w-px h-[250px] bg-[#d2d2e7]" />
                  <div className="flex flex-col relative z-10">
                    {submenuItems.map((subItem, subIndex) => (
                      <Button
                        key={subIndex}
                        variant="ghost"
                        className={`h-auto w-full justify-start gap-2.5 px-[18px] py-[17px] rounded-[7px] hover:bg-[#e5f3ff] transition-colors ${
                          subItem.active ? "bg-[#e5f3ff]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-[18px]">
                          <img
                            className="w-4 h-4 object-contain"
                            alt={`${subItem.label} icon`}
                            src={subItem.icon}
                          />
                          <span
                            className={`[font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal ${
                              subItem.active
                                ? "font-semibold text-[#007aff]"
                                : "font-medium text-[#6a90b9]"
                            }`}
                          >
                            {subItem.label}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </aside>
  );
};
