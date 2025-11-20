import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Award,
  FolderOpen,
  Calendar,
  Info,
  Menu,
  X,
} from 'lucide-react';

interface StudentSidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  className = '',
  isMobileOpen = false,
  onMobileMenuClose
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get organization logo URL
  const getOrganizationLogo = (): string => {
    if (organization?.organization_logo_url) {
      return organization.organization_logo_url;
    }
    return '/assets/logos/formly-logo.png';
  };

  // Get organization name
  const getOrganizationName = (): string => {
    return organization?.organization_name || 'Formly';
  };

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Function to check if a menu item is active
  const isMenuItemActive = (path: string): boolean => {
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    const route = pathSegments.length > 1 ? `/${pathSegments[pathSegments.length - 1]}` : currentPath;

    return route === path || currentPath.includes(path);
  };

  // Menu items for student dashboard
  const menuItems = [
    {
      id: "dashboard",
      label: t('student.sidebar.dashboard') || 'Dashboard',
      icon: BarChart3,
      path: "/student/dashboard",
    },
    {
      id: "catalogue",
      label: t('student.sidebar.catalogue') || 'Catalogue de formation',
      icon: BookOpen,
      path: "/student/catalogue",
    },
    {
      id: "learning",
      label: t('student.sidebar.myLearning') || 'Mon apprentissage',
      icon: GraduationCap,
      path: "/student/learning",
    },
    {
      id: "messaging",
      label: t('student.sidebar.messaging') || 'Messagerie',
      icon: MessageSquare,
      path: "/student/messaging",
    },
    {
      id: "results",
      label: t('student.sidebar.myResults') || 'Mes résultats',
      icon: Award,
      path: "/student/results",
    },
    {
      id: "shared-folder",
      label: t('student.sidebar.sharedFolder') || 'Dossier partagé',
      icon: FolderOpen,
      path: "/student/shared-folder",
    },
    {
      id: "events",
      label: t('student.sidebar.eventsNews') || 'Événements /Actualités',
      icon: Calendar,
      path: "/student/events",
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex ${isCollapsed ? 'w-[70px]' : 'w-[240px]'} items-start justify-center gap-2.5 px-[13px] py-[17px] overflow-hidden border-r border-solid transition-all duration-300 bg-[#19294a] border-[#dadfe8] ${className} ${isMobileOpen ? 'fixed left-0 top-0 h-full z-50 lg:relative lg:z-auto' : 'hidden lg:flex'}`}
      >
        {/* Background decorations */}
        <img
          className="absolute left-0 bottom-[101px] w-full h-[563px] pointer-events-none opacity-10"
          alt="Background decoration"
          src="/assets/images/sidebar-bg.png"
        />

        <div className={`relative ${isCollapsed ? 'w-[54px]' : 'w-[214px]'} z-10 flex flex-col h-full`}>
          {/* Header */}
          <header className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
            <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-[15px]'}`}>
              <img
                className="w-[31px] h-8"
                alt={`${getOrganizationName()} logo`}
                src={getOrganizationLogo()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/logos/formly-logo.png';
                }}
              />
              {!isCollapsed && (
                <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[25px] tracking-[0] leading-normal text-white">
                  {getOrganizationName()}
                </h1>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-1 rounded-lg hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <Menu className="w-5 h-5 text-white" />
              ) : (
                <X className="w-5 h-5 text-white" />
              )}
            </Button>
          </header>

          {/* Navigation */}
          <nav className="flex flex-col w-full items-start gap-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {menuItems.map((item) => {
              const isActive = isMenuItemActive(item.path);
              const Icon = item.icon;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`flex min-h-[52px] w-full items-center ${
                    isCollapsed ? 'justify-center px-2' : 'justify-start gap-[18px] px-[18px]'
                  } py-2.5 rounded-lg border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-l-transparent bg-[#e5f3ff] hover:bg-[#d0e7ff]'
                      : 'border-l-transparent hover:bg-white/10 hover:border-l-white/50'
                  }`}
                  onClick={() => {
                    navigateToRoute(item.path);
                    if (onMobileMenuClose) onMobileMenuClose();
                  }}
                >
                  <div className={`inline-flex items-center ${isCollapsed ? 'gap-0' : 'gap-[18px]'}`}>
                    <div className="flex items-center justify-center w-5 h-5">
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-[#007aff]' : 'text-white'}`}
                      />
                    </div>
                    {!isCollapsed && (
                      <span className={`[font-family:'Urbanist',Helvetica] text-sm tracking-[0] leading-tight transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                        isActive ? 'font-bold text-[#007aff]' : 'font-semibold text-white'
                      }`}>
                        {item.label}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* Info Section at Bottom */}
          <div className={`mt-auto pt-4 border-t border-white/20`}>
            <Button
              variant="ghost"
              className={`flex min-h-[52px] w-full items-center ${
                isCollapsed ? 'justify-center px-2' : 'justify-start gap-[18px] px-[18px]'
              } py-2.5 rounded-lg border-l-4 border-l-transparent hover:bg-white/10 hover:border-l-white/50 transition-all duration-200`}
              onClick={() => {
                navigateToRoute('/student/info');
                if (onMobileMenuClose) onMobileMenuClose();
              }}
            >
              <div className={`inline-flex items-center ${isCollapsed ? 'gap-0' : 'gap-[18px]'}`}>
                <div className="flex items-center justify-center w-5 h-5">
                  <Info className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                  <span className="[font-family:'Urbanist',Helvetica] font-semibold text-sm tracking-[0] leading-tight text-white">
                    {t('student.sidebar.info') || 'Info'}
                  </span>
                )}
              </div>
            </Button>
          </div>
        </div>

        {/* Bottom background decoration */}
        <img
          className="absolute top-[496px] left-0 w-full h-[563px] pointer-events-none opacity-10"
          alt="Background decoration bottom"
          src="/assets/images/sidebar-bg-bottom.png"
        />
      </aside>
    </>
  );
};
