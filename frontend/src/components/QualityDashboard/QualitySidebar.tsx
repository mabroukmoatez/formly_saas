import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Separator } from '../ui/separator';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Crown,
  Home,
  BarChart3,
  FileText,
  Award,
  Shield,
  UserCheck,
  UserCog,
  Users,
  Briefcase
} from 'lucide-react';

interface QualitySidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export const QualitySidebar: React.FC<QualitySidebarProps> = ({ 
  className = '', 
  isMobileOpen = false, 
  onMobileMenuClose 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to get role icon dynamically
  const getRoleIcon = () => {
    const roleName = user?.role_name?.toLowerCase() || '';
    const organizationRole = user?.organization_roles?.[0]?.toLowerCase() || '';

    // Check role name
    if (roleName.includes('admin') || roleName.includes('administrator')) {
      return Crown;
    }
    if (roleName.includes('manager') || organizationRole.includes('manager')) {
      return Briefcase;
    }
    if (roleName.includes('instructor') || organizationRole.includes('instructor')) {
      return UserCheck;
    }
    if (roleName.includes('content') && roleName.includes('writer')) {
      return FileText;
    }
    if (roleName.includes('quality')) {
      return Award;
    }
    if (roleName.includes('editor')) {
      return UserCog;
    }
    if (roleName.includes('staff') || roleName.includes('membre') || roleName.includes('user')) {
      return Users;
    }
    
    // Default fallback
    return Shield;
  };

  // Function to get role color dynamically
  const getRoleColor = () => {
    const roleName = user?.role_name?.toLowerCase() || '';
    const organizationRole = user?.organization_roles?.[0]?.toLowerCase() || '';

    if (roleName.includes('admin') || organizationRole.includes('admin')) {
      return 'from-amber-400 to-orange-500'; // Gold gradient
    }
    if (roleName.includes('manager') || organizationRole.includes('manager')) {
      return 'from-blue-400 to-purple-500'; // Blue-purple gradient
    }
    if (roleName.includes('instructor') || organizationRole.includes('instructor')) {
      return 'from-green-400 to-emerald-500'; // Green gradient
    }
    if (roleName.includes('content') && roleName.includes('writer')) {
      return 'from-pink-400 to-rose-500'; // Pink gradient
    }
    if (roleName.includes('quality')) {
      return 'from-cyan-400 to-blue-500'; // Cyan gradient
    }
    
    // Default fallback
    return 'from-gray-400 to-gray-500'; // Gray gradient
  };

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

  const sidebarMenuItems = [
    { 
      id: 1, 
      label: "Accueil", 
      icon: Home,
      path: "/quality",
      active: location.pathname.endsWith('/quality')
    },
    { 
      id: 2, 
      label: "Indicateurs", 
      icon: BarChart3,
      path: "/quality/indicateurs",
      active: location.pathname.includes('/quality/indicateurs')
    },
    { 
      id: 3, 
      label: "Documents", 
      icon: FileText,
      path: "/quality/documents",
      active: location.pathname.includes('/quality/documents')
    },
    { 
      id: 4, 
      label: "Bilan pédagogique et financier (BPF)", 
      icon: Award,
      path: "/quality/bpf",
      active: location.pathname.includes('/quality/bpf')
    },
  ];

  const actionCategories = [
    { id: 1, label: "Veille", color: "bg-[#3f5ea9]", hasMenu: true },
    { id: 2, label: "Amélioration Continue", color: "bg-[#3f5ea9]", hasMenu: true },
    { id: 3, label: "Plan développement de compétences", color: "bg-[#3f5ea9]", hasMenu: true },
    { id: 4, label: "Questions Handicap", color: "", hasMenu: true },
    { id: 5, label: "Gestion Des Disfonctionnements", color: "bg-[#3f5ea9]", hasMenu: true },
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
      <aside className={`flex ${isCollapsed ? 'w-[80px]' : 'w-[287px]'} items-start justify-center gap-2.5 px-[13px] py-[17px] overflow-hidden border-r border-solid transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#fffbef] border-[#dadfe8]'} ${className} ${isMobileOpen ? 'fixed left-0 top-0 h-full z-50 lg:relative lg:z-auto' : 'hidden lg:flex'}`}>
        
        {/* Background decorations */}
        <img
          className="absolute left-0 bottom-[101px] w-full h-[563px] pointer-events-none opacity-30"
          alt="Background decoration"
          src="/assets/images/sidebar-bg.png"
        />

        <div className={`relative ${isCollapsed ? 'w-[54px]' : 'w-[259px]'} z-10 flex flex-col h-full`}>
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
                <h1 className={`[font-family:'Urbanist',Helvetica] font-bold text-[25px] ${isDark ? 'text-gray-100' : 'bg-[linear-gradient(90deg,rgba(255,119,0,1)_0%,rgba(255,225,0,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]'}`}>
                  Gestion Qualité
                </h1>
              )}
            </div>
            {!isCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#ff7700] focus-visible:ring-offset-2 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-[#ffe5ca]'}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <Menu className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`} />
              </Button>
            )}
            {isCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#ff7700] focus-visible:ring-offset-2 transition-colors ml-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-[#ffe5ca]'}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`} />
              </Button>
            )}
          </header>

          {/* Navigation */}
          <nav className="flex flex-col w-full items-start gap-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {sidebarMenuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`flex min-h-[52px] w-full items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-[18px] px-[18px]'} py-2.5 rounded-lg border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff7700] focus-visible:ring-offset-2 ${
                  item.active
                    ? isDark 
                      ? "bg-orange-900/40 border-l-[#ff7700] shadow-sm" 
                      : "bg-[#ffe5ca] border-l-[#ff7700] shadow-sm"
                    : isDark
                      ? "border-l-transparent bg-gray-700 shadow-[0px_4px_20px_5px_#09294c12] hover:bg-orange-900/20 hover:border-l-[#ff7700]"
                      : "border-l-transparent bg-white shadow-[0px_4px_20px_5px_#09294c12] hover:bg-[#ffe5ca]/50 hover:border-l-[#ff7700]"
                }`}
                onClick={() => navigateToRoute(item.path)}
              >
                <div className={`inline-flex items-center ${isCollapsed ? 'gap-0' : 'gap-[18px]'}`}>
                  <div className={`p-1 rounded-md ${item.active ? 'bg-[#ff7700]' : isDark ? 'bg-gray-600' : 'bg-[#f5f5f5]'}`}>
                    <item.icon className={`w-4 h-4 ${item.active ? 'text-white' : isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`} />
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`[font-family:'Urbanist',Helvetica] text-base tracking-[0] leading-tight transition-colors whitespace-normal break-words ${
                        item.active
                          ? isDark ? "font-bold text-[#ff9500]" : "font-bold text-[#ff7700]"
                          : isDark ? "font-semibold text-gray-300" : "font-semibold text-[#6a90b9]"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </nav>

          {/* Actions Section */}
          {!isCollapsed && (
            <div className="flex flex-col gap-[22px] mt-auto">
              <Separator className={isDark ? "bg-gray-600" : "bg-[#dadfe8]"} />

              <div className="flex flex-col gap-2.5">
                {/* Actions & Tasks Button */}
                <button className={`flex items-center gap-[18px] px-[18px] py-2.5 rounded-[7px] shadow-[0px_4px_20px_5px_#09294c12] transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-[#ffe5ca]/50'}`}>
                  <div className="w-[19.35px] h-[19.35px] bg-[#ff7700] rounded-sm" />
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[13px] tracking-[0.20px] ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                    Les Actions & Taches
                  </span>
                </button>

                {/* Search Box */}
                <div className={`flex items-center gap-[7.22px] px-[7px] py-[7.94px] rounded-[5.78px] border-[0.72px] ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#cdc1b7]'}`}>
                  <svg className={`w-[18.71px] ${isDark ? 'text-[#ff9500]' : 'text-[#ff7700]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Recherche"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`[font-family:'Poppins',Helvetica] font-medium text-[11.6px] bg-transparent border-none outline-none flex-1 ${isDark ? 'text-[#ff9500] placeholder:text-[#ff9500]/50' : 'text-[#ff7700] placeholder:text-[#ff7700]/50'}`}
                  />
                </div>

                <Separator className={isDark ? "bg-gray-600" : "bg-[#dadfe8]"} />

                {/* Action Categories */}
                <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#dadfe8]">
                  {actionCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between px-3 py-0 rounded-[10px] transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-600/50' : 'hover:bg-white/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        {category.color ? (
                          <div className={`w-2 h-2 ${category.color} rounded-sm`} />
                        ) : (
                          <div className={`w-2 h-2 ${isDark ? 'bg-gray-500' : 'bg-gray-300'} rounded-full`} />
                        )}
                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[13px] tracking-[0.20px] ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                          {category.label}
                        </span>
                      </div>
                      {category.hasMenu && (
                        <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} fill="currentColor" viewBox="0 0 16 16">
                          <circle cx="2" cy="8" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="14" cy="8" r="1.5" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Text Button */}
                <button className={`flex items-center justify-center gap-[7.22px] px-[14.44px] py-[7.94px] rounded-[5.78px] border-[0.72px] border-dashed border-[#ff7700] transition-colors ${isDark ? 'hover:bg-orange-900/20' : 'hover:bg-[#ffe5ca]/30'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#3f5ea9]" />
                    <div className={`flex items-center gap-2.5 px-2 py-0 rounded-[3px] border-[0.5px] border-[#ff9500] ${isDark ? 'bg-orange-900/20' : 'bg-[#ffe5ca29]'}`}>
                      <span className={`[font-family:'Poppins',Helvetica] font-medium text-[13px] tracking-[0.20px] ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                        Text
                      </span>
                    </div>
                  </div>
                </button>

                {/* Add Family Button */}
                <button className={`flex items-center justify-center gap-[7.22px] px-[14.44px] py-[7.94px] rounded-[5.78px] border-[0.72px] border-dashed border-[#ff7700] transition-colors ${isDark ? 'bg-orange-900/40 hover:bg-orange-900/60' : 'bg-[#ffe5ca] hover:bg-[#ffd9b3]'}`}>
                  <svg className="w-[11.05px] h-[11.05px] text-[#ff7700]" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                  </svg>
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#ff7700] text-[11.6px]">
                    Ajouter Une Famille
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* User Profile Section */}
          <div className={`${isCollapsed ? 'mt-4' : 'mt-auto'} pt-4 border-t ${isDark ? 'border-gray-600' : 'border-[#dadfe8]'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-[18px]'} py-3 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white/50'}`}>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRoleColor()} flex items-center justify-center ${isCollapsed ? 'mx-auto' : ''}`}>
                {React.createElement(getRoleIcon(), { className: 'w-4 h-4 text-white' })}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    {user?.role_name || t('sidebar.administrator')}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.organization_roles?.[0] || t('sidebar.qualityAccess')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom background decoration */}
        <img
          className="absolute top-[496px] left-0 w-full h-[563px] pointer-events-none opacity-30"
          alt="Background decoration bottom"
          src="/assets/images/sidebar-bg-bottom.png"
        />
      </aside>
    </>
  );
};
