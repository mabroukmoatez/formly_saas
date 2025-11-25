import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  MessageSquare, 
  FolderOpen, 
  Calendar,
  FileText,
  User,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Settings,
  HelpCircle,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { fixImageUrl } from '../../lib/utils';
import { NotificationDropdown } from './NotificationDropdown';

interface LearnerLayoutProps {
  children: React.ReactNode;
}

// Navigation items will be created with translations inside the component

export const LearnerLayout: React.FC<LearnerLayoutProps> = ({ children }) => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // false = expanded by default
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Navigation items with translations
  const navigationItems = [
    { icon: LayoutDashboard, label: t('learner.sidebar.dashboard'), path: '/learner/dashboard', id: 'dashboard' },
    { icon: GraduationCap, label: t('learner.sidebar.learning'), path: '/learner/learning', id: 'learning' },
    { icon: FileText, label: t('learner.sidebar.documents'), path: '/learner/documents', id: 'documents' },
    { icon: MessageSquare, label: t('learner.sidebar.messaging'), path: '/learner/messaging', id: 'messaging' },
    { icon: FolderOpen, label: t('learner.sidebar.sharedFolders'), path: '/learner/shared-folders', id: 'folders' },
    { icon: Calendar, label: t('learner.sidebar.calendar'), path: '/learner/calendar', id: 'calendar' },
    { icon: BookOpen, label: t('learner.sidebar.catalog'), path: '/learner/catalog', id: 'catalog' },
  ];
  
  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null;
  
  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };
  
  // Get user initials for avatar
  const getInitials = () => {
    const userAny = user as any;
    if (userAny?.first_name && userAny?.last_name) {
      return `${userAny.first_name[0]}${userAny.last_name[0]}`.toUpperCase();
    }
    if (user?.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  
  const getUserDisplayName = () => {
    const userAny = user as any;
    if (userAny?.first_name && userAny?.last_name) {
      return `${userAny.first_name} ${userAny.last_name}`;
    }
    return user?.name || 'Utilisateur';
  };

  const isActive = (path: string) => {
    const fullPath = getPath(path);
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
  };

  const handleLogout = async () => {
    await logout();
    if (subdomain) {
      navigate(`/${subdomain}/login`);
    } else {
      navigate('/login');
    }
  };
  
  const handleNavigate = (path: string) => {
    navigate(getPath(path));
  };

  return (
    <div className="w-full min-h-screen flex relative bg-[#09294c] overflow-hidden">
      {/* Sidebar - Collapsible */}
      <aside 
        className={`flex flex-col h-screen py-6 relative z-10 flex-shrink-0 bg-[#09294c] transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
        }`}
      >
        <div className={`relative w-full flex flex-col h-full ${sidebarCollapsed ? 'items-center' : 'items-center'}`}>
          {/* Header */}
          <header className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} mb-4 px-2`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-2'} flex-1 min-w-0`}>
              {organization?.organization_logo_url ? (
                <img
                  src={fixImageUrl(organization.organization_logo_url)}
                  alt={organization.organization_name || 'Logo'}
                  className={`object-contain rounded-xl transition-all duration-300 flex-shrink-0 ${
                    sidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div 
                  className={`rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 flex-shrink-0 ${
                    sidebarCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'
                  }`}
                  style={{ backgroundColor: secondaryColor }}
                >
                  {organization?.organization_name?.substring(0, 2).toUpperCase() || 'OF'}
                </div>
              )}
              {!sidebarCollapsed && organization?.organization_name && (
                <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-white text-[25px] tracking-[0] leading-normal truncate flex-1 min-w-0">
                  {organization.organization_name}
                </h1>
              )}
            </div>
            {!sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-1 rounded-full border border-white/20 hover:bg-[#d6e9ff1a] hover:border-[#5dabff] focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-200"
                style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </Button>
            )}
            {sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-1 rounded-lg hover:bg-[#d6e9ff1a] focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors"
                style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            )}
          </header>

          {/* Navigation */}
          <nav className="flex flex-col w-full items-start gap-2 flex-1 overflow-y-auto overflow-x-hidden">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <div key={item.id} className="relative w-full">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigate(item.path)}
                    className={`group flex min-h-[52px] w-full items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg border-l-4 transition-all duration-200 ${
                      active
                        ? 'bg-[#d6e9ff1a] border-l-[#5dabff] shadow-[inset_0_2px_4px_rgba(93,171,255,0.2)] opacity-100'
                        : 'border-l-transparent bg-transparent opacity-70 hover:opacity-100 hover:bg-[#d6e9ff0d] hover:border-l-[#5dabff]/50'
                    }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <div className={`inline-flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
                      <div className="flex items-center justify-center">
                        <Icon 
                          className={`transition-all duration-200 group-hover:scale-110 ${
                            sidebarCollapsed ? 'w-6 h-6' : 'w-6 h-6'
                          }`}
                          style={{
                            color: active ? primaryColor : 'white'
                          }}
                        />
                      </div>
                      {!sidebarCollapsed && (
                        <span className={`[font-family:'Urbanist',Helvetica] font-semibold text-sm tracking-[0] leading-tight transition-colors whitespace-nowrap ${
                          active ? 'text-[#5dabff]' : 'text-white'
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </div>
                    {/* Active indicator - gradient bar on left */}
                    {active && !sidebarCollapsed && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full"
                        style={{
                          background: `linear-gradient(to bottom, ${primaryColor}, ${secondaryColor})`
                        }}
                      />
                    )}
                  </Button>
                </div>
              );
            })}
          </nav>

          {/* Help/Info button */}
          <div className="mt-auto pt-4 border-t border-[#1a3a5c] w-full">
            <Button
              variant="ghost"
              className={`group flex min-h-[52px] w-full items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg hover:bg-[#d6e9ff0d] transition-all duration-200 opacity-70 hover:opacity-100`}
              title={t('learner.sidebar.info')}
            >
              <div className={`inline-flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
                <HelpCircle 
                  className={`w-6 h-6 transition-all duration-200 group-hover:scale-110 group-hover:text-[#5dabff]`}
                  style={{ color: 'white' }}
                />
                {!sidebarCollapsed && (
                  <span className="[font-family:'Urbanist',Helvetica] font-semibold text-white text-sm tracking-[0] leading-tight whitespace-nowrap transition-colors group-hover:text-[#5dabff]">
                    {t('learner.sidebar.info')}
                  </span>
                )}
              </div>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header 
          className="h-[95px] flex items-center justify-between px-8 py-4 relative z-10 flex-shrink-0 bg-[#09294c] shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-b border-[#1a3a5c]"
        >
          <div className="flex items-center gap-4">
            <h1 className="font-normal text-white text-[42px] tracking-[0] leading-[1.6]">
              <span className="font-bold">{t('learner.header.hello')} </span>
              <span className="font-normal">{getUserDisplayName()}</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-6">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-3 cursor-pointer hover:bg-[#d6e9ff1a] transition-all rounded-lg px-3 py-2 group">
                  <div className="inline-flex items-center gap-3">
                    <Avatar className="w-[44px] h-[44px] ring-2 ring-[#5dabff] ring-offset-2 ring-offset-[#09294c]">
                      <AvatarImage src={(user as any)?.image_url} />
                      <AvatarFallback 
                        className="text-white text-base font-bold bg-gradient-to-br from-[#FF8A3D] to-[#ff9600]"
                      >
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="inline-flex flex-col items-start justify-center gap-1">
                      <div className="font-bold text-white text-[15px] tracking-[0] leading-[20px] whitespace-nowrap">
                        {getUserDisplayName()}
                      </div>
                      <Badge 
                        className="px-2 py-1 h-auto rounded-md border-0 bg-gradient-to-r from-[rgba(0,133,255,0.15)] to-[rgba(0,133,255,0.1)] hover:from-[rgba(0,133,255,0.2)] hover:to-[rgba(0,133,255,0.15)] shadow-sm"
                      >
                        <span className="font-semibold text-[#0085FF] text-[9px] tracking-[0] leading-[normal]">
                          {t('learner.header.learner')}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  <ChevronDown className="w-5 h-5 text-white group-hover:text-[#5dabff] transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleNavigate('/learner/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('learner.header.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('/learner/profile?tab=settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('learner.header.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('learner.header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div 
            className={`flex-1 overflow-y-auto w-full rounded-[38px_0px_0px_0px] relative ${
              isDark ? 'bg-gray-800' : 'bg-[#f9fcff]'
            }`}
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="p-8 min-h-full">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-16 flex items-center justify-between px-8 bg-[#09294c] border-t border-[#1a3a5c] flex-shrink-0">
          <div className="text-white text-sm">
            © {new Date().getFullYear()} {organization?.organization_name || 'Formly'}. {t('learner.footer.rights')}.
          </div>
          <div className="flex items-center gap-4 text-white text-sm">
            <button className="hover:text-white/80 transition-colors">{t('learner.footer.help')}</button>
            <button className="hover:text-white/80 transition-colors">{t('learner.footer.support')}</button>
            <button className="hover:text-white/80 transition-colors">{t('learner.footer.contact')}</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
