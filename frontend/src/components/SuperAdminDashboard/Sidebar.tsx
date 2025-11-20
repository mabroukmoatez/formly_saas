import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Building2, 
  CreditCard, 
  Package, 
  Receipt, 
  Server, 
  Ticket, 
  FileText, 
  Shield,
  ChevronDown,
  Menu,
  X,
  Crown,
  Settings,
  Mail,
  Database,
  Users,
  GraduationCap,
  BookOpen,
  Tag,
  Languages,
  Award,
  Newspaper,
  DollarSign,
  Wallet,
  BarChart2,
  TrendingUp,
  MessageSquare,
  LifeBuoy,
  FolderTree,
  Bell,
  CreditCard as CreditCardIcon,
  Calculator,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileMenuClose?: () => void;
}

interface CollapsibleMenuItemProps {
  item: any;
  isCollapsed: boolean;
  isDark: boolean;
  primaryColor: string;
  secondaryColor: string;
  getColorFilter: (color: string) => string;
  isSubItemActive: (subItemId: string) => boolean;
  navigate: (path: string) => void;
  shouldBeOpen: boolean;
}

const CollapsibleMenuItem: React.FC<CollapsibleMenuItemProps> = ({
  item,
  isCollapsed,
  isDark,
  primaryColor,
  secondaryColor,
  getColorFilter,
  isSubItemActive,
  navigate,
  shouldBeOpen
}) => {
  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  React.useEffect(() => {
    setIsOpen(shouldBeOpen);
  }, [shouldBeOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        onClick={toggleOpen}
        className={`flex min-h-[52px] w-full items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between gap-2.5 px-[18px]'} py-2.5 rounded-lg border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          isOpen && item.subItems?.some((subItem: any) => isSubItemActive(subItem.id))
            ? isDark
              ? 'border-l-blue-400 bg-blue-900/20 hover:bg-blue-900/30 shadow-[0px_4px_20px_5px_#09294c12]'
              : 'border-l-blue-500 bg-blue-50/80 hover:bg-blue-100/80 shadow-[0px_4px_20px_5px_#09294c12]'
            : isDark
              ? 'border-l-transparent bg-gray-800 hover:bg-gray-700 hover:border-l-gray-500 shadow-[0px_4px_20px_5px_#09294c12]'
              : 'border-l-transparent bg-white shadow-[0px_4px_20px_5px_#09294c12] hover:bg-gray-50/50 hover:border-l-blue-500'
        }`}
      >
        <div className={`inline-flex items-center ${isCollapsed ? 'gap-0' : 'gap-[18px]'}`}>
          <div className={`flex items-center justify-center w-5 h-5`}>
            <img 
              src={item.icon}
              alt={item.label}
              className="w-5 h-5 object-contain"
              style={{ filter: getColorFilter(primaryColor) }}
            />
          </div>
          {!isCollapsed && (
            <span className={`[font-family:'Urbanist',Helvetica] font-semibold text-sm tracking-[0] leading-tight transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
              isOpen && item.subItems?.some((subItem: any) => isSubItemActive(subItem.id))
                ? 'text-blue-600'
                : 'text-[#6a90b9]'
            }`}>
              {item.label}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          />
        )}
      </Button>
      
      {isOpen && (
        <div className={`flex flex-col items-start gap-0.5 ${isCollapsed ? 'hidden' : 'pl-[32px]'} relative mt-1 rounded-lg ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/30'} py-1`}>
          <div className="flex flex-col items-start w-full">
            {item.subItems?.map((subItem: any) => (
              <Button
                key={subItem.id}
                variant="ghost"
                className={`flex w-full items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-2 px-[12px]'} py-2 rounded-lg h-auto transition-all duration-200 border-l-4 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  subItem.isActive || isSubItemActive(subItem.id)
                    ? isDark 
                      ? "bg-blue-900/40 hover:bg-blue-900/50 border-l-blue-400 shadow-md" 
                      : "bg-blue-50 hover:bg-blue-100 border-l-blue-500 shadow-sm"
                    : isDark
                      ? "border-l-transparent hover:bg-gray-700 hover:border-l-gray-500"
                      : "border-l-transparent hover:bg-gray-50 hover:border-l-blue-300"
                }`}
                onClick={() => navigate(subItem.path)}
              >
                <div className={`inline-flex items-center ${isCollapsed ? 'gap-0' : 'gap-2'}`}>
                  <div className={`p-0.5 rounded-sm ${isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                    <subItem.icon 
                      className="w-3.5 h-3.5"
                      style={{ 
                        color: isSubItemActive(subItem.id) || subItem.isActive 
                          ? primaryColor 
                          : isDark ? secondaryColor : '#6a90b9'
                      }}
                    />
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`[font-family:'Urbanist',Helvetica] text-[12px] tracking-[0] leading-tight transition-colors whitespace-normal break-words ${
                        subItem.isActive || isSubItemActive(subItem.id)
                          ? "font-bold text-[#007aff]"
                          : "font-medium text-[#6a90b9]"
                      }`}
                    >
                      {subItem.label}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
          {!isCollapsed && (
            <img
              className="absolute top-px left-[18px] w-px h-[247px]"
              alt="Connector line"
              src="/assets/icons/separator.svg"
            />
          )}
        </div>
      )}
    </div>
  );
};

export const SuperAdminSidebar: React.FC<SidebarProps> = ({ className = '', isMobileOpen = false, onMobileMenuClose }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const primaryColor = '#007aff';
  const secondaryColor = '#6a90b9';

  // Function to check if a submenu item is active
  const isSubItemActive = (subItemId: string): boolean => {
    const currentPath = location.pathname;
    return currentPath.includes(`/superadmin/${subItemId}`);
  };

  // Function to determine which menu should be open based on current route
  const getMenuToOpen = (): string | null => {
    const currentPath = location.pathname;
    
    if (currentPath.includes('/organizations')) return 'management';
    if (currentPath.includes('/users') || currentPath.includes('/students') || currentPath.includes('/instructors')) return 'users';
    if (currentPath.includes('/courses') || currentPath.includes('/certificates')) return 'courses';
    if (currentPath.includes('/categories') || currentPath.includes('/tags') || currentPath.includes('/languages') || currentPath.includes('/levels')) return 'content';
    if (currentPath.includes('/plans') || currentPath.includes('/subscriptions') || currentPath.includes('/instances') || currentPath.includes('/coupons')) return 'billing';
    if (currentPath.includes('/email-templates') || currentPath.includes('/notifications') || currentPath.includes('/quality-articles')) return 'communications';
    if (currentPath.includes('/reports') || currentPath.includes('/analytics') || currentPath.includes('/margin-simulator') || currentPath.includes('/aws-costs')) return 'reports';
    if (currentPath.includes('/support') || currentPath.includes('/tickets')) return 'support';
    if (currentPath.includes('/settings') || currentPath.includes('/audit-logs') || currentPath.includes('/roles')) return 'system';
    
    return null;
  };

  // Effect to automatically open the appropriate menu when route changes
  React.useEffect(() => {
    const menuToOpen = getMenuToOpen();
    if (menuToOpen) {
      setOpenMenus(prev => new Set([...prev, menuToOpen]));
    }
  }, [location.pathname]);

  // Convert hex color to CSS filter for PNG icons
  const getColorFilter = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;
    
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      
      switch (max) {
        case rNorm:
          h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
          break;
        case gNorm:
          h = ((bNorm - rNorm) / delta + 2) / 6;
          break;
        case bNorm:
          h = ((rNorm - gNorm) / delta + 4) / 6;
          break;
      }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    const invert = 50;
    const sepia = Math.min(100, s);
    const saturate = Math.max(100, s * 3);
    const hueRotate = h - 60;
    const brightness = Math.max(90, 100 - (50 - l));
    const contrast = 100;
    
    return `invert(${invert}%) sepia(${sepia}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrast}%)`;
  };

  const menuItems = [
    {
      id: "dashboard",
      label: t('superadmin.sidebar.dashboard') || 'Dashboard',
      icon: "/assets/icons/sidebar/group-1000003443.png",
      isCollapsible: false,
      path: "/superadmin/dashboard",
    },
    {
      id: "management",
      label: t('superadmin.sidebar.management') || 'Management',
      icon: "/assets/icons/sidebar/group-1000003444.png",
      isCollapsible: true,
      subItems: [
        {
          id: "organizations",
          label: t('superadmin.sidebar.organizations') || 'Organizations',
          icon: Building2,
          path: "/superadmin/organizations",
        },
      ],
    },
    {
      id: "users",
      label: t('superadmin.sidebar.users') || 'Users Management',
      icon: "/assets/icons/sidebar/group-1000003444.png",
      isCollapsible: true,
      subItems: [
        {
          id: "users",
          label: t('superadmin.sidebar.allUsers') || 'All Users',
          icon: Users,
          path: "/superadmin/users",
        },
        {
          id: "students",
          label: t('superadmin.sidebar.students') || 'Students',
          icon: GraduationCap,
          path: "/superadmin/students",
        },
        {
          id: "instructors",
          label: t('superadmin.sidebar.instructors') || 'Instructors',
          icon: GraduationCap,
          path: "/superadmin/instructors",
        },
      ],
    },
    {
      id: "courses",
      label: t('superadmin.sidebar.coursesLearning') || 'Courses & Learning',
      icon: "/assets/icons/sidebar/group-1000003444.png",
      isCollapsible: true,
      subItems: [
        {
          id: "courses",
          label: t('superadmin.sidebar.allCourses') || 'All Courses',
          icon: BookOpen,
          path: "/superadmin/courses",
        },
        {
          id: "certificates",
          label: t('superadmin.sidebar.certificates') || 'Certificates',
          icon: Award,
          path: "/superadmin/certificates",
        },
      ],
    },
    {
      id: "content",
      label: t('superadmin.sidebar.contentManagement') || 'Content Management',
      icon: "/assets/icons/sidebar/group-1000003444.png",
      isCollapsible: true,
      subItems: [
        {
          id: "categories",
          label: t('superadmin.sidebar.categories') || 'Categories',
          icon: FolderTree,
          path: "/superadmin/categories",
        },
        {
          id: "tags",
          label: t('superadmin.sidebar.tags') || 'Tags',
          icon: Tag,
          path: "/superadmin/tags",
        },
        {
          id: "course-languages",
          label: t('superadmin.sidebar.courseLanguages') || 'Course Languages',
          icon: Languages,
          path: "/superadmin/course-languages",
        },
        {
          id: "difficulty-levels",
          label: t('superadmin.sidebar.difficultyLevels') || 'Difficulty Levels',
          icon: BarChart2,
          path: "/superadmin/difficulty-levels",
        },
      ],
    },
    {
      id: "billing",
      label: t('superadmin.sidebar.billing') || 'Billing & Plans',
      icon: "/assets/icons/sidebar/group-1000003445.png",
      isCollapsible: true,
      subItems: [
        {
          id: "plans",
          label: t('superadmin.sidebar.plans') || 'Plans',
          icon: Package,
          path: "/superadmin/plans",
        },
        {
          id: "subscriptions",
          label: t('superadmin.sidebar.subscriptions') || 'Subscriptions',
          icon: Receipt,
          path: "/superadmin/subscriptions",
        },
        {
          id: "instances",
          label: t('superadmin.sidebar.instances') || 'Instances',
          icon: Server,
          path: "/superadmin/instances",
        },
        {
          id: "coupons",
          label: t('superadmin.sidebar.coupons') || 'Coupons',
          icon: Ticket,
          path: "/superadmin/coupons",
        },
      ],
    },
    {
      id: "communications",
      label: t('superadmin.sidebar.communications') || 'Communications',
      icon: "/assets/icons/sidebar/group-1000003444.png",
      isCollapsible: true,
      subItems: [
        {
          id: "quality-articles",
          label: t('superadmin.sidebar.qualityArticles') || 'Articles Qualité',
          icon: FileText,
          path: "/superadmin/quality-articles",
        },
        {
          id: "email-templates",
          label: t('superadmin.sidebar.emailTemplates') || 'Email Templates',
          icon: Mail,
          path: "/superadmin/email-templates",
        },
        {
          id: "notifications",
          label: t('superadmin.sidebar.notifications') || 'Notifications',
          icon: Bell,
          path: "/superadmin/notifications",
        },
      ],
    },
    {
      id: "reports",
      label: t('superadmin.sidebar.reportsAnalytics') || 'Reports & Analytics',
      icon: "/assets/icons/sidebar/group-1000003443.png",
      isCollapsible: true,
      subItems: [
        {
          id: "analytics",
          label: t('superadmin.sidebar.analyticsDashboard') || 'Analytics Dashboard',
          icon: TrendingUp,
          path: "/superadmin/analytics",
        },
        {
          id: "reports",
          label: t('superadmin.sidebar.reports') || 'Reports',
          icon: BarChart3,
          path: "/superadmin/reports",
        },
        {
          id: "margin-simulator",
          label: t('superadmin.sidebar.marginSimulator') || 'Simulateur de Marge',
          icon: Calculator,
          path: "/superadmin/margin-simulator",
        },
        {
          id: "aws-costs",
          label: t('superadmin.sidebar.awsCosts') || 'Coûts AWS',
          icon: Cloud,
          path: "/superadmin/aws-costs",
        },
      ],
    },
    {
      id: "support",
      label: t('superadmin.sidebar.support') || 'Support',
      icon: "/assets/icons/sidebar/group-1000003444.png",
      isCollapsible: true,
      subItems: [
        {
          id: "tickets",
          label: t('superadmin.sidebar.supportTickets') || 'Support Tickets',
          icon: LifeBuoy,
          path: "/superadmin/tickets",
        },
      ],
    },
    {
      id: "system",
      label: t('superadmin.sidebar.system') || 'System',
      icon: "/assets/icons/sidebar/group-1000003445-1.png",
      isCollapsible: true,
      subItems: [
        {
          id: "settings",
          label: t('superadmin.sidebar.systemSettings') || 'System Settings',
          icon: Settings,
          path: "/superadmin/settings",
        },
        {
          id: "audit-logs",
          label: t('superadmin.sidebar.auditLogs') || 'Audit Logs',
          icon: FileText,
          path: "/superadmin/audit-logs",
        },
        {
          id: "roles",
          label: t('superadmin.sidebar.roles') || 'Roles',
          icon: Shield,
          path: "/superadmin/roles",
        },
      ],
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
      <aside className={`flex ${isCollapsed ? 'w-[80px]' : 'w-[287px]'} items-start justify-center gap-2.5 px-[13px] py-[17px] overflow-hidden border-r border-solid transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} ${className} ${isMobileOpen ? 'fixed left-0 top-0 h-full z-50 lg:relative lg:z-auto' : 'hidden lg:flex'}`}>
        {/* Background decorations */}
        <img
          className="absolute left-0 bottom-[101px] w-full h-[563px] pointer-events-none"
          alt="Background decoration"
          src="/assets/images/sidebar-bg.png"
        />

        <div className={`relative ${isCollapsed ? 'w-[54px]' : 'w-[259px]'} z-10 flex flex-col h-full`}>
          {/* Header */}
          <header className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
            <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-[15px]'}`}>
              <img
                className="w-[31px] h-8"
                alt="Formly logo"
                src="/assets/logos/formly-logo.png"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/logos/formly-logo.png';
                }}
              />
              {!isCollapsed && (
                <h1 className={`[font-family:'Urbanist',Helvetica] font-bold text-[25px] tracking-[0] leading-normal transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Super Admin
                </h1>
              )}
            </div>
            {!isCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-1 rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            {isCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-1 rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ml-2"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </header>

          {/* Navigation */}
          <nav className="flex flex-col w-full items-start gap-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {menuItems.map((item) => (
              <div key={item.id} className="w-full">
                {item.isCollapsible ? (
                  <CollapsibleMenuItem
                    item={item}
                    isCollapsed={isCollapsed}
                    isDark={isDark}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    getColorFilter={getColorFilter}
                    isSubItemActive={isSubItemActive}
                    navigate={navigate}
                    shouldBeOpen={openMenus.has(item.id)}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    className={`flex min-h-[52px] w-full items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-[18px] px-[18px]'} py-2.5 rounded-lg border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      isSubItemActive(item.id)
                        ? isDark
                          ? 'border-l-blue-400 bg-blue-900/20 hover:bg-blue-900/30 shadow-[0px_4px_20px_5px_#09294c12]'
                          : 'border-l-blue-500 bg-blue-50/80 hover:bg-blue-100/80 shadow-[0px_4px_20px_5px_#09294c12]'
                        : isDark
                          ? 'border-l-transparent bg-gray-800 hover:bg-blue-900/20 hover:border-l-blue-400 shadow-[0px_4px_20px_5px_#09294c12]'
                          : 'border-l-transparent bg-white shadow-[0px_4px_20px_5px_#09294c12] hover:bg-blue-50/50 hover:border-l-blue-500'
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    <div className={`inline-flex items-center ${isCollapsed ? 'gap-0' : 'gap-[18px]'}`}>
                      <div className={`flex items-center justify-center w-5 h-5`}>
                        <img 
                          src={item.icon}
                          alt={item.label}
                          className="w-5 h-5 object-contain"
                          style={{ filter: getColorFilter(primaryColor) }}
                        />
                      </div>
                      {!isCollapsed && (
                        <span className={`[font-family:'Urbanist',Helvetica] font-semibold text-sm tracking-[0] leading-tight transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                          isSubItemActive(item.id) ? 'text-blue-600' : 'text-[#6a90b9]'
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Button>
                )}
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className={`mt-auto pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-[18px]'} py-3 rounded-lg hover:bg-gray-50 transition-colors ${isDark ? 'hover:bg-gray-700' : ''}`}>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center ${isCollapsed ? 'mx-auto' : ''}`}>
                <Crown className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    {user?.name || 'Super Admin'}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Super Administrator
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom background decoration */}
        <img
          className="absolute top-[496px] left-0 w-full h-[563px] pointer-events-none"
          alt="Background decoration bottom"
          src="/assets/images/sidebar-bg-bottom.png"
        />
      </aside>
    </>
  );
};

