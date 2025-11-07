import React from "react";
import { Button } from "../../../../components/ui/button";
import { ScrollArea } from "../../../../components/ui/scroll-area";

const menuItems = [
  {
    id: "gestion-commerciale",
    label: "Gestion commerciale",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-6.png",
    iconClass: "w-[16.27px] h-[17.32px]",
    active: false,
    hasSubmenu: false,
  },
  {
    id: "gestion-administrative",
    label: "Gestion administrative",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003358-2.png",
    iconClass: "w-[17.5px] h-[19.11px]",
    active: false,
    hasSubmenu: false,
  },
  {
    id: "gestion-formations-parent",
    label: "Gestion des formations",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-7.png",
    iconClass: "w-[16.2px] h-[17.25px]",
    active: true,
    hasSubmenu: true,
  },
  {
    id: "parties-prenantes",
    label: "Parties Prenantes",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003263-2.png",
    iconClass: "w-[18.23px] h-[18.01px]",
    active: false,
    hasSubmenu: false,
  },
  {
    id: "marque-blanche",
    label: "Marque Blanche",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003356-2.png",
    iconClass: "w-[18.01px] h-[15.95px]",
    active: false,
    hasSubmenu: false,
  },
];

const submenuItems = [
  {
    id: "statistiques",
    label: "Statistiques",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003265-8.png",
    iconClass: "w-[16.2px] h-[17.25px]",
    active: false,
  },
  {
    id: "gestion-formations-sub",
    label: "Gestion des formations",
    icon: "/assets/icons/file.svg",
    iconClass: "w-[13.95px] h-[16.18px]",
    active: true,
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003359-2.png",
    iconClass: "w-[17.81px] h-[15.38px]",
    active: false,
  },
  {
    id: "gestion-quizz",
    label: "Gestion Des Quizz",
    icon: "https://c.animaapp.com/mgshj8vs3RWwYo/img/group-1000003262-2.png",
    iconClass: "w-[19px] h-[17.25px]",
    active: false,
  },
  {
    id: "supports-pedagogiques",
    label: "Supports Pédagogiques",
    icon: "/assets/icons/expense.svg",
    iconClass: "w-[13.26px] h-[17.34px]",
    active: false,
  },
];

export const SidebarSection = (): JSX.Element => {
  return (
    <aside className="flex w-full max-w-[257px] items-start justify-end gap-2.5 px-[13px] py-[17px] bg-white rounded-[18px] overflow-hidden border border-solid border-[#d2d2e7] relative translate-y-[-1rem] animate-fade-in opacity-0">
      <img
        className="absolute left-0 bottom-[85px] w-full h-[563px] blur-[50.4px] object-cover pointer-events-none"
        alt="Background decoration"
        src="/assets/images/sidebar-bg-2.png"
      />

      <div className="relative w-full max-w-[229px]">
        <header className="flex w-full max-w-[218px] items-center justify-between mb-[72px]">
          <div className="relative w-[135px] h-8 flex items-center">
            <img
              className="w-[30.5px] h-8"
              alt="Formly logo icon"
              src="/assets/logos/formly-icon-2.png"
            />

            <div className="ml-[15.5px] flex items-center justify-center [font-family:'Urbanist',Helvetica] font-bold text-[#6a90b9] text-[25px] tracking-[0] leading-normal whitespace-nowrap">
              Formly
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
            <img
              className="w-[23.66px] h-[23.66px]"
              alt="Menu"
              src="/assets/icons/menu-3.png"
            />
          </Button>
        </header>

        <ScrollArea className="w-full">
          <nav className="flex flex-col w-full items-start gap-1.5">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <Button
                  variant="ghost"
                  className={`flex h-[52px] items-center gap-2.5 px-[18px] py-2.5 w-full justify-start rounded-[7px] shadow-[0px_4px_20px_5px_#09294c12] hover:bg-[#e5f3ff] transition-colors ${
                    item.active && !item.hasSubmenu
                      ? "font-semibold text-[#007aff]"
                      : "font-medium text-[#6a90b9]"
                  }`}
                >
                  <img
                    className={item.iconClass}
                    alt={`${item.label} icon`}
                    src={item.icon}
                  />
                  <span className="[font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal">
                    {item.label}
                  </span>
                </Button>

                {item.hasSubmenu && (
                  <div className="flex flex-col items-start gap-1.5 pl-[18px] w-full relative">
                    <div className="flex flex-col items-center w-full">
                      {submenuItems.map((subItem) => (
                        <Button
                          key={subItem.id}
                          variant="ghost"
                          className={`flex w-full items-center gap-2.5 px-[18px] py-[17px] justify-start rounded-[7px] hover:bg-[#e5f3ff] transition-colors ${
                            subItem.active
                              ? "bg-[#e5f3ff] font-semibold text-[#007aff]"
                              : "font-medium text-[#6a90b9]"
                          }`}
                        >
                          <img
                            className={subItem.iconClass}
                            alt={`${subItem.label} icon`}
                            src={subItem.icon}
                          />
                          <span className="[font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal">
                            {subItem.label}
                          </span>
                        </Button>
                      ))}
                    </div>

                    <img
                      className="absolute top-0 left-[18px] w-px h-[250px]"
                      alt="Submenu connector"
                      src="/assets/icons/separator.svg"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
};
