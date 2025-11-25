import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { COMMERCIAL_SIDEBAR_PERMISSIONS, shouldShowMenuItem } from '../../utils/permissionMappings';
import { fixImageUrl } from '../../lib/utils';
import { 
  BarChart3, 
  FileText, 
  Receipt, 
  Package, 
  CreditCard, 
  Users, 
  Settings, 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  FileImage, 
  Clock, 
  ChevronDown,
  Menu,
  X,
  Crown,
  Shield,
  UserCheck,
  UserCog,
  Award,
  Briefcase,
  GraduationCap,
  Building2,
  Wallet,
  Palette,
  Sparkles
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
  navigateToRoute: (route: string) => void;
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
  navigateToRoute,
  shouldBeOpen
}) => {
  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  // Update open state when shouldBeOpen changes
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
                onClick={() => {
                  if (subItem.id === 'tableau-de-bord') {
                    navigateToRoute('/dashboard');
                  } else if (subItem.id === 'mes-facture') {
                    navigateToRoute('/mes-factures');
                  } else if (subItem.id === 'mes-devis') {
                    navigateToRoute('/mes-devis');
                  } else if (subItem.id === 'mes-article') {
                    navigateToRoute('/mes-articles');
                  } else if (subItem.id === 'charges-depenses') {
                    navigateToRoute('/charges-depenses');
                  } else if (subItem.id === 'gestion-organisme') {
                    navigateToRoute('/gestion-organisme');
                  } else if (subItem.id === 'messagerie') {
                    navigateToRoute('/messagerie');
                  } else if (subItem.id === 'actualites') {
                    navigateToRoute('/actualites');
                  } else if (subItem.id === 'evenements') {
                    navigateToRoute('/evenements');
                  } else if (subItem.id === 'plannings') {
                    navigateToRoute('/plannings');
                  } else if (subItem.id === 'rapports-statistiques') {
                    navigateToRoute('/rapports-statistiques');
                  } else if (subItem.id === 'statistiques') {
                    navigateToRoute('/statistiques');
                  } else if (subItem.id === 'gestion-formations') {
                    navigateToRoute('/gestion-formations');
                  } else if (subItem.id === 'sessions') {
                    navigateToRoute('/sessions');
                  } else if (subItem.id === 'gestion-quizz') {
                    navigateToRoute('/quiz');
                  } else if (subItem.id === 'supports-pedagogiques') {
                    navigateToRoute('/supports-pedagogiques');
                  } else if (subItem.id === 'formateurs') {
                    navigateToRoute('/formateurs');
                  } else if (subItem.id === 'apprenants') {
                    navigateToRoute('/apprenants');
                  } else if (subItem.id === 'entreprises') {
                    navigateToRoute('/entreprises');
                  } else if (subItem.id === 'financeurs') {
                    navigateToRoute('/financeurs');
                  } else if (subItem.id === 'marque-blanche-identite') {
                    navigateToRoute('/white-label/identite');
                  } else if (subItem.id === 'marque-blanche-bibliotheque') {
                    navigateToRoute('/white-label/bibliotheque');
                  } else if (subItem.id === 'marque-blanche-identifiants') {
                    navigateToRoute('/white-label/identifiants');
                  } else if (subItem.id === 'marque-blanche-formules') {
                    navigateToRoute('/white-label/formules');
                  } else if (subItem.path) {
                    navigateToRoute(subItem.path);
                  }
                }}
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

export const CommercialSidebar: React.FC<SidebarProps> = ({ className = '', isMobileOpen = false, onMobileMenuClose }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const { navigateToRoute } = useSubdomainNavigation();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const { hasPermission, hasAnyPermission, hasAllPermissions, isOrganizationAdmin } = usePermissions();

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

  // Function to check if a submenu item is active
  const isSubItemActive = (subItemId: string): boolean => {
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    // Remove subdomain from path if present
    const route = pathSegments.length > 1 ? `/${pathSegments[pathSegments.length - 1]}` : currentPath;
    
    switch (subItemId) {
      case 'tableau-de-bord':
        return route === '/dashboard';
      case 'mes-facture':
        return route === '/mes-factures';
      case 'mes-devis':
        return route === '/mes-devis';
      case 'mes-article':
        return route === '/mes-articles';
      case 'charges-depenses':
        return route === '/charges-depenses';
      case 'statistiques':
        return route === '/statistiques';
      case 'gestion-formations':
        return route === '/gestion-formations';
      case 'sessions':
        return route === '/sessions';
      case 'gestion-quizz':
        return route === '/quiz' || route.startsWith('/quiz/');
      case 'supports-pedagogiques':
        return route === '/supports-pedagogiques';
      case 'creation-cours':
        return route === '/course-creation';
      case 'formateurs':
        return route === '/formateurs';
      case 'apprenants':
        return route === '/apprenants';
      case 'entreprises':
        return route === '/entreprises';
      case 'financeurs':
        return route === '/financeurs';
      case 'gestion-organisme':
        return route === '/gestion-organisme';
      case 'messagerie':
        return route === '/messagerie';
      case 'actualites':
        return route === '/actualites';
      case 'evenements':
        return route === '/evenements';
      case 'plannings':
        return route === '/plannings';
      case 'rapports-statistiques':
        return route === '/rapports-statistiques';
      case 'marque-blanche-identite':
        return route === '/white-label/identite';
      case 'marque-blanche-bibliotheque':
        return route === '/white-label/bibliotheque';
      case 'marque-blanche-identifiants':
        return route === '/white-label/identifiants' || route === '/user-management';
      case 'marque-blanche-formules':
        return route === '/white-label/formules';
      default:
        return false;
    }
  };

  // Function to determine which menu should be open based on current route
  const getMenuToOpen = (): string | null => {
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    const route = pathSegments.length > 1 ? `/${pathSegments[pathSegments.length - 1]}` : currentPath;
    
    // Check which submenu item is active and return its parent menu
    if (['/dashboard', '/mes-factures', '/mes-devis', '/mes-articles', '/charges-depenses'].includes(route)) {
      return 'gestion-commerciale';
    }
    if (['/statistiques', '/gestion-formations', '/sessions', '/quiz', '/supports-pedagogiques', '/course-creation'].includes(route) || route.startsWith('/quiz/')) {
      return 'gestion-formations';
    }
    if (['/formateurs', '/apprenants', '/entreprises', '/financeurs'].includes(route)) {
      return 'parties-prenantes';
    }
    if (['/gestion-organisme', '/messagerie', '/actualites', '/evenements', '/plannings', '/rapports-statistiques'].includes(route)) {
      return 'gestion-administrative';
    }
    if (['/white-label', '/white-label/identite', '/white-label/bibliotheque', '/white-label/identifiants', '/white-label/formules', '/user-management'].includes(route) || route.startsWith('/white-label/')) {
      return 'marque-blanche';
    }
    
    return null;
  };

  // Effect to automatically open the appropriate menu when route changes
  React.useEffect(() => {
    const menuToOpen = getMenuToOpen();
    if (menuToOpen) {
      setOpenMenus(prev => new Set([...prev, menuToOpen]));
    }
  }, [location.pathname]);

  // Get organization logo URL
  const getOrganizationLogo = (): string => {
    if (organization?.organization_logo_url) {
      return fixImageUrl(organization.organization_logo_url);
    }
    return '/assets/logos/formly-logo.png'; // Fallback to Formly logo
  };

  // Get organization name
  const getOrganizationName = (): string => {
    return organization?.organization_name || 'Formly';
  };

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Convert hex color to CSS filter for PNG icons
  const getColorFilter = (hexColor: string) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB (0-255)
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Convert RGB to HSL
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
    
    // Convert to degrees and percentages
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    // Generate CSS filter
    // Strategy: invert base, add sepia for warmth, saturate for vibrancy, hue-rotate to target color
    const invert = 50; // Start with a neutral base
    const sepia = Math.min(100, s); // More saturation = more sepia
    const saturate = Math.max(100, s * 3); // Amplify saturation
    const hueRotate = h - 60; // Adjust hue (60 is the sepia base hue)
    const brightness = Math.max(90, 100 - (50 - l)); // Adjust brightness based on lightness
    const contrast = 100;
    
    return `invert(${invert}%) sepia(${sepia}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrast}%)`;
  };

  // Filtrer les éléments du menu selon les permissions
  const menuItems = useMemo(() => {
    const allMenuItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "/assets/icons/sidebar/group-1000003443.png",
        isCollapsible: false,
      },
      {
        id: "gestion-commerciale",
        label: t('dashboard.sidebar.commercialManagement'),
        icon: "/assets/icons/sidebar/group-1000003443.png",
        isCollapsible: true,
        subItems: [
          {
            id: "tableau-de-bord",
            label: t('dashboard.sidebar.dashboard'),
            icon: BarChart3,
          },
          {
            id: "mes-facture",
            label: t('dashboard.sidebar.myInvoices'),
            icon: Receipt,
          },
          {
            id: "mes-devis",
            label: t('dashboard.sidebar.myQuotes'),
            icon: FileText,
          },
          {
            id: "mes-article",
            label: t('dashboard.sidebar.myArticles'),
            icon: Package,
          },
          {
            id: "charges-depenses",
            label: t('dashboard.sidebar.chargesExpenses'),
            icon: CreditCard,
          },
        ],
      },
      {
        id: "gestion-administrative",
        label: t('dashboard.sidebar.administrativeManagement'),
        icon: "/assets/icons/sidebar/group-1000003444.png",
        isCollapsible: true,
        subItems: [
          {
            id: "gestion-organisme",
            label: t('dashboard.sidebar.organizationManagement'),
            icon: Settings,
          },
          {
            id: "messagerie",
            label: t('dashboard.sidebar.messaging'),
            icon: MessageSquare,
          },
          {
            id: "actualites",
            label: t('dashboard.sidebar.news'),
            icon: FileText,
          },
          {
            id: "evenements",
            label: t('dashboard.sidebar.events'),
            icon: Calendar,
          },
          {
            id: "plannings",
            label: t('dashboard.sidebar.schedules'),
            icon: Clock,
          },
          {
            id: "rapports-statistiques",
            label: t('dashboard.sidebar.reportsStatistics'),
            icon: BarChart3,
          },
        ],
      },
      {
        id: "gestion-formations",
        label: t('dashboard.sidebar.trainingManagement'),
        icon: "/assets/icons/sidebar/group-1000003445.png",
        isCollapsible: true,
        subItems: [
          {
            id: "statistiques",
            label: "Statistiques",
            icon: BarChart3,
          },
          {
            id: "gestion-formations",
            label: "Gestion des formations",
            icon: BookOpen,
          },
          {
            id: "sessions",
            label: "Sessions",
            icon: Clock,
          },
          {
            id: "gestion-quizz",
            label: "Gestion Des Quizz",
            icon: ClipboardList,
          },
          {
            id: "supports-pedagogiques",
            label: "Supports Pédagogiques",
            icon: FileImage,
          },
        ],
      },
      {
        id: "parties-prenantes",
        label: t('dashboard.sidebar.stakeholders'),
        icon: "/assets/icons/sidebar/group-1000003446.png",
        isCollapsible: true,
        subItems: [
          {
            id: "formateurs",
            label: t('dashboard.sidebar.trainers'),
            icon: GraduationCap,
          },
          {
            id: "apprenants",
            label: t('dashboard.sidebar.learners'),
            icon: Users,
          },
          {
            id: "entreprises",
            label: t('dashboard.sidebar.companies'),
            icon: Building2,
          },
          {
            id: "financeurs",
            label: t('dashboard.sidebar.funders'),
            icon: Wallet,
          },
        ],
      },
      {
        id: "gestion-qualite",
        label: t('dashboard.sidebar.qualityManagement'),
        icon: "/assets/icons/sidebar/group-1000003445-1.png",
        isCollapsible: false,
      },
      {
        id: "marque-blanche",
        label: t('dashboard.sidebar.whiteLabel'),
        icon: "/assets/icons/sidebar/group-1000003444.png",
        isCollapsible: true,
        subItems: [
          {
            id: "marque-blanche-identite",
            label: t('dashboard.sidebar.whiteLabelIdentity') || 'Identité',
            icon: Palette,
            path: "/white-label/identite",
          },
          {
            id: "marque-blanche-bibliotheque",
            label: t('dashboard.sidebar.whiteLabelLibrary') || 'Bibliothèque',
            icon: BookOpen,
            path: "/white-label/bibliotheque",
          },
          {
            id: "marque-blanche-identifiants",
            label: t('dashboard.sidebar.whiteLabelIdentifiers') || 'Gestion Des Identifiants',
            icon: Users,
            path: "/white-label/identifiants",
          },
          {
            id: "marque-blanche-formules",
            label: t('dashboard.sidebar.whiteLabelPlans') || 'Formules',
            icon: Sparkles,
            path: "/white-label/formules",
          },
        ],
      },
    ];

    // Filtrer les éléments selon les permissions
    return allMenuItems
      .map(item => {
        // Vérifier si l'élément parent doit être affiché
        const showParent = shouldShowMenuItem(
          item.id,
          COMMERCIAL_SIDEBAR_PERMISSIONS,
          hasPermission,
          hasAnyPermission,
          hasAllPermissions,
          isOrganizationAdmin
        );

        if (!showParent) {
          return null;
        }

        // Si l'élément a des sous-éléments, filtrer ceux-ci aussi
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(subItem =>
            shouldShowMenuItem(
              subItem.id,
              COMMERCIAL_SIDEBAR_PERMISSIONS,
              hasPermission,
              hasAnyPermission,
              hasAllPermissions,
              isOrganizationAdmin
            )
          );

          // Si aucun sous-élément n'est visible, ne pas afficher le parent
          if (filteredSubItems.length === 0) {
            return null;
          }

          return {
            ...item,
            subItems: filteredSubItems,
          };
        }

        return item;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [t, hasPermission, hasAnyPermission, hasAllPermissions, isOrganizationAdmin]);

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
                      alt={`${getOrganizationName()} logo`}
                      src={getOrganizationLogo()}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/logos/formly-logo.png';
                      }}
                    />
                    {!isCollapsed && (
                      <h1 className={`[font-family:'Urbanist',Helvetica] font-bold text-[25px] tracking-[0] leading-normal transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {getOrganizationName()}
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
                      <Menu
                        className="w-5 h-5"
                      />
                    </Button>
                  )}
                  {isCollapsed && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 p-1 rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ml-2"
                      onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                      <X
                        className="w-5 h-5"
                      />
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
                          navigateToRoute={navigateToRoute}
                          shouldBeOpen={openMenus.has(item.id)}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          className={`flex min-h-[52px] w-full items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-[18px] px-[18px]'} py-2.5 rounded-lg border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                            isDark
                              ? 'border-l-transparent bg-gray-800 hover:bg-blue-900/20 hover:border-l-blue-400 shadow-[0px_4px_20px_5px_#09294c12]'
                              : 'border-l-transparent bg-white shadow-[0px_4px_20px_5px_#09294c12] hover:bg-blue-50/50 hover:border-l-blue-500'
                          }`}
                          onClick={() => {
                            if (item.id === 'dashboard') {
                              navigateToRoute('/dashboard');
                            } else if (item.id === 'marque-blanche') {
                              navigateToRoute('/white-label');
                            } else if (item.id === 'gestion-qualite') {
                              navigateToRoute('/quality');
                            }
                          }}
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
                              <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#6a90b9] text-sm tracking-[0] leading-tight transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
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
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRoleColor()} flex items-center justify-center ${isCollapsed ? 'mx-auto' : ''}`}>
              {React.createElement(getRoleIcon(), { className: 'w-4 h-4 text-white' })}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {user?.role_name || t('sidebar.administrator')}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.organization_roles?.[0] || t('sidebar.systemAccess')}
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
