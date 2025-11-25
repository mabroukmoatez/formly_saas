import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  FileText,
  FolderOpen,
  Calendar,
  ChevronLeft,
  HelpCircle as Info
} from 'lucide-react';
import { Button } from '../../ui/button';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { fixImageUrl } from '../../../lib/utils';

const navigationItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/learner/dashboard',
    isActive: true,
  },
  {
    icon: BookOpen,
    label: 'Catalogue de formation',
    path: '/learner/catalog',
    isActive: false,
  },
  {
    icon: GraduationCap,
    label: 'Mon apprentissage',
    path: '/learner/learning',
    isActive: false,
  },
  {
    icon: MessageSquare,
    label: 'Messagerie',
    path: '/learner/messaging',
    isActive: false,
  },
  {
    icon: FileText,
    label: 'Mes résultats',
    path: '/learner/results',
    isActive: false,
  },
  {
    icon: FolderOpen,
    label: 'Dossier partagé',
    path: '/learner/shared-folders',
    isActive: false,
  },
  {
    icon: Calendar,
    label: 'Événements /Actualités',
    path: '/learner/calendar',
    isActive: false,
  },
];

export const DocumentManagementSection: React.FC = () => {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = params.subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };

  const isActive = (path: string) => {
    const fullPath = getPath(path);
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
  };

  return (
    <aside className="flex flex-col h-full justify-between py-4 bg-[#19294a] rounded-[0px_22px_22px_0px]">
      <div className="flex flex-col gap-[69px]">
        <header className="flex items-center justify-between px-2.5 py-1.5">
          <div className="flex items-center gap-[9px]">
            {organization?.organization_logo_url ? (
              <img
                className="w-[43px] h-[43px]"
                alt="Logo"
                src={fixImageUrl(organization.organization_logo_url)}
              />
            ) : (
              <div className="w-[43px] h-[43px] bg-[#007aff] rounded-lg flex items-center justify-center text-white font-bold">
                {organization?.organization_name?.substring(0, 2).toUpperCase() || 'OF'}
              </div>
            )}
            <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-[25px] tracking-[0] leading-[normal] whitespace-nowrap">
              {organization?.organization_name || 'Formly'}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-auto w-auto p-0 hover:bg-transparent"
            onClick={() => {
              // Collapse sidebar logic if needed
            }}
          >
            <ChevronLeft className="w-[23.66px] h-[23.66px] text-white" />
          </Button>
        </header>

        <nav className="flex flex-col gap-[13px] px-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => navigate(getPath(item.path))}
                className={`h-auto w-full justify-start gap-[17px] px-2.5 py-[18px] rounded-xl transition-colors hover:bg-[#e5f3ff]/10 ${
                  active
                    ? 'bg-[#e5f3ff] text-[#007aff] hover:bg-[#e5f3ff]'
                    : 'text-[#ffffff] hover:text-[#ffffff]'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-base tracking-[0] leading-[normal] whitespace-nowrap">
                  {item.label}
                </span>
              </Button>
            );
          })}
        </nav>
      </div>

      <Button
        variant="ghost"
        className="h-auto w-full justify-start gap-[17px] px-2.5 py-[18px] text-[#ffffff] hover:bg-[#e5f3ff]/10 hover:text-[#ffffff] transition-colors"
      >
        <Info className="w-7 h-7 flex-shrink-0" />
        <span className="[font-family:'Urbanist',Helvetica] font-semibold text-base tracking-[0] leading-[normal] whitespace-nowrap">
          InfoIcon
        </span>
      </Button>
    </aside>
  );
};

