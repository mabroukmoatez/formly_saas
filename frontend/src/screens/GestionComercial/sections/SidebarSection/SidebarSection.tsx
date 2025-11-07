import React from "react";
import { Button } from "../../../../components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../components/ui/collapsible";

const menuItems = [
  {
    id: "gestion-commerciale",
    label: "Gestion commerciale",
    icon: "/assets/icons/sidebar/commercial.png",
    iconClass: "w-[16.27px] h-[17.32px]",
    isCollapsible: true,
    subItems: [
      {
        id: "tableau-de-bord",
        label: "Tableau De Bord",
        icon: "/assets/icons/sidebar/dashboard.png",
        iconClass: "w-[16.2px] h-[17.25px]",
      },
      {
        id: "mes-facture",
        label: "Mes  Facture",
        icon: "/assets/icons/file.svg",
        iconClass: "w-[13.95px] h-[16.18px]",
        isActive: true,
      },
      {
        id: "mes-devis",
        label: "Mes Devis",
        icon: "/assets/icons/sidebar/quote.png",
        iconClass: "w-[17.81px] h-[15.38px]",
      },
      {
        id: "mes-article",
        label: "Mes Article",
        icon: "/assets/icons/sidebar/article.png",
        iconClass: "w-[19px] h-[17.25px]",
      },
      {
        id: "charges-depenses",
        label: "Charges & Dépenses",
        icon: "/assets/icons/expense.svg",
        iconClass: "w-[13.26px] h-[17.34px]",
      },
    ],
  },
  {
    id: "gestion-administrative",
    label: "Gestion administrative",
    icon: "/assets/icons/sidebar/admin.png",
    iconClass: "w-[17.5px] h-[19.11px]",
  },
  {
    id: "gestion-formations",
    label: "Gestion des formations",
    icon: "/assets/icons/sidebar/training.png",
    iconClass: "w-[16.2px] h-[17.25px]",
  },
  {
    id: "parties-prenantes",
    label: "Parties Prenantes",
    icon: "/assets/icons/sidebar/stakeholders.png",
    iconClass: "w-[18.23px] h-[18.01px]",
  },
  {
    id: "gestion-qualite",
    label: "Gestion de la qualité",
    icon: "/assets/icons/sidebar/quality.png",
    iconClass: "w-[18.01px] h-[18.01px]",
  },
  {
    id: "marque-blanche",
    label: "Marque Blanche",
    icon: "/assets/icons/sidebar/white-label.png",
    iconClass: "w-[18.01px] h-[15.95px]",
  },
];

export const SidebarSection = (): JSX.Element => {
  return (
    <aside className="flex w-full max-w-[257px] items-start justify-center gap-2.5 px-[13px] py-[17px] bg-white rounded-[18px] overflow-hidden border border-solid border-[#dadfe8] relative">
      <img
        className="absolute left-0 bottom-[101px] w-full h-[563px] pointer-events-none"
        alt="Background decoration"
        src="/assets/images/sidebar-bg.png"
      />

      <div className="relative w-full max-w-[229px] z-10">
        <header className="flex w-full items-center justify-between mb-[72px]">
          <div className="flex items-center gap-[15px]">
            <img
              className="w-[31px] h-8"
              alt="Formly logo"
              src="/assets/logos/formly-logo.png"
            />
            <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#7e8ca9] text-[25px] tracking-[0] leading-normal">
              Formly
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
            <img
              className="w-[23.66px] h-[23.66px]"
              alt="Menu"
              src="/assets/icons/menu.png"
            />
          </Button>
        </header>

        <nav className="flex flex-col w-full items-start gap-1.5">
          {menuItems.map((item, index) => (
            <div key={item.id} className="w-full">
              {item.isCollapsible ? (
                <Collapsible defaultOpen className="w-full">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex h-[52px] w-full items-center justify-start gap-2.5 px-[18px] py-2.5 rounded-[7px] shadow-[0px_4px_20px_5px_#09294c12] hover:bg-accent transition-colors"
                    >
                      <div className="inline-flex items-center gap-[18px]">
                        <img
                          className={item.iconClass}
                          alt={item.label}
                          src={item.icon}
                        />
                        <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#7e8ca9] text-[13px] tracking-[0] leading-normal">
                          {item.label}
                        </span>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col items-start gap-1.5 pl-[18px] relative mt-1.5">
                    <div className="flex flex-col items-center w-full">
                      {item.subItems?.map((subItem) => (
                        <Button
                          key={subItem.id}
                          variant="ghost"
                          className={`flex w-full items-center justify-start gap-2.5 px-[18px] py-[17px] rounded-[7px] h-auto transition-colors ${
                            subItem.isActive
                              ? "bg-[#e5f3ff] hover:bg-[#e5f3ff]"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div className="inline-flex items-center gap-[18px]">
                            <img
                              className={subItem.iconClass}
                              alt={subItem.label}
                              src={subItem.icon}
                            />
                            <span
                              className={`[font-family:'Urbanist',Helvetica] text-[13px] tracking-[0] leading-normal ${
                                subItem.isActive
                                  ? "font-semibold text-[#007aff]"
                                  : "font-medium text-[#7e8ca9]"
                              }`}
                            >
                              {subItem.label}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <img
                      className="absolute top-px left-[18px] w-px h-[247px]"
                      alt="Connector line"
                      src="/assets/icons/separator.svg"
                    />
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Button
                  variant="ghost"
                  className="flex h-[52px] w-full items-center justify-start gap-2.5 px-[18px] py-2.5 rounded-[7px] shadow-[0px_4px_20px_5px_#09294c12] hover:bg-accent transition-colors"
                >
                  <div className="inline-flex items-center gap-[18px]">
                    <img
                      className={item.iconClass}
                      alt={item.label}
                      src={item.icon}
                    />
                    <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#7e8ca9] text-[13px] tracking-[0] leading-normal">
                      {item.label}
                    </span>
                  </div>
                </Button>
              )}
            </div>
          ))}
        </nav>
      </div>

      <img
        className="absolute top-[496px] left-0 w-full h-[563px] pointer-events-none"
        alt="Background decoration bottom"
        src="/assets/images/sidebar-bg-bottom.png"
      />
    </aside>
  );
};
