import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { useQualityTaskCategories } from '../../hooks/useQualityTaskCategories';
import { usePermissions } from '../../hooks/usePermissions';
import { QUALITY_SIDEBAR_PERMISSIONS, shouldShowMenuItem } from '../../utils/permissionMappings';
import { CreateTaskCategoryModal } from './CreateTaskCategoryModal';
import { RenameTaskCategoryModal } from './RenameTaskCategoryModal';
import { deleteTaskCategory, QualityTaskCategory } from '../../services/qualityManagement';
import { useToast } from '../ui/toast';
import { fixImageUrl } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Trash2, Edit } from 'lucide-react';
import {
  HomeIcon,
  IndicatorsIcon,
  DocumentsIcon,
  BPFIcon,
  TrainingIcon,
  ActionsIcon,
  SearchIcon,
  DotsIcon,
  AddFamilyIcon,
  LogoIcon
} from '../ui/qualite/SidebarIcons';

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
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useQualityTaskCategories();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QualityTaskCategory | null>(null);

  // Get organization logo URL
  const getOrganizationLogo = (): string => {
    if (organization?.organization_logo_url) {
      return fixImageUrl(organization.organization_logo_url);
    }
    return '/assets/logos/formly-logo.png';
  };

  // Get organization name
  const getOrganizationName = (): string => {
    return organization?.organization_name || 'Formly';
  };

  const { hasPermission, hasAnyPermission, hasAllPermissions, isOrganizationAdmin } = usePermissions();

  const sidebarMenuItems = useMemo(() => {
    const allMenuItems = [
      {
        id: 1,
        idKey: "quality",
        label: "Accueil",
        icon: HomeIcon,
        path: "/quality",
        active: location.pathname.endsWith('/quality')
      },
      {
        id: 2,
        idKey: "indicateurs",
        label: "Indicateurs",
        icon: IndicatorsIcon,
        path: "/quality/indicateurs",
        active: location.pathname.includes('/quality/indicateurs')
      },
      {
        id: 3,
        idKey: "documents",
        label: "Documents",
        icon: DocumentsIcon,
        path: "/quality/documents",
        active: location.pathname.includes('/quality/documents')
      },
      {
        id: 4,
        idKey: "articles",
        label: "Articles",
        icon: TrainingIcon, // Using TrainingIcon as placeholder or if it matches "Se Former" / Articles intent
        path: "/quality/articles",
        active: location.pathname.includes('/quality/articles')
      },
      {
        id: 5,
        idKey: "bpf",
        label: "Bilan pédagogique et financier (BPF)",
        icon: BPFIcon,
        path: "/quality/bpf",
        active: location.pathname.includes('/quality/bpf')
      },
    ];

    // Filtrer les éléments selon les permissions
    return allMenuItems.filter(item =>
      shouldShowMenuItem(
        item.idKey,
        QUALITY_SIDEBAR_PERMISSIONS,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isOrganizationAdmin
      )
    );
  }, [location.pathname, hasPermission, hasAnyPermission, hasAllPermissions, isOrganizationAdmin]);

  const handleRenameCategory = (category: QualityTaskCategory) => {
    setSelectedCategory(category);
    setShowRenameModal(true);
  };

  const handleDeleteCategory = async (category: QualityTaskCategory) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer la famille "${category.name}" ?`)) {
      return;
    }

    try {
      const response = await deleteTaskCategory(category.id);
      if (response.success) {
        success('Famille supprimée avec succès');
        refetchCategories();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la suppression');
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <aside className={`flex flex-col ${isCollapsed ? 'w-[70px]' : 'w-[240px]'} h-[100vh] my-[10px] ml-[10px] bg-white border border-[#d2d2e8] rounded-[18px] py-[10px] transition-all duration-300 ${className} ${isMobileOpen ? 'fixed left-0 top-0 z-50' : 'hidden lg:flex'}`}>

        {/* Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} py-5 shrink-0`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-2.5'}`}>
            <img
              className="w-6 h-6 object-contain"
              alt={`${getOrganizationName()} logo`}
              src={getOrganizationLogo()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/logos/formly-logo.png';
              }}
            />
            {!isCollapsed && (
              <span className="font-['Urbanist'] font-bold text-[20px] text-[#6a90ba] leading-none truncate max-w-[130px]">
                {getOrganizationName()}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-1 text-[#6a90ba] hover:bg-[#ffe6ca]/50"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <LogoIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center mb-4 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-1 text-[#6a90ba] hover:bg-[#ffe6ca]/50"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <LogoIcon className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 px-3 shrink-0">
          {sidebarMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigateToRoute(item.path)}
              className={`
                group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} 
                h-[44px] rounded-[6px] cursor-pointer transition-all duration-200
                ${item.active
                  ? 'bg-[#ffe6ca] shadow-[0px_4px_20px_5px_rgba(9,41,76,0.07)]'
                  : 'bg-transparent hover:bg-[#ffe6ca]/30'}
              `}
            >
              <div className={`shrink-0 ${item.active ? 'text-[#FF7700]' : 'text-[#6A90BA]'}`}>
                <item.icon className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <span className={`
                  font-['Urbanist'] text-[14px] font-bold leading-relaxed
                  ${item.active ? 'text-[#FF7700]' : 'text-[#6A90BA]'}
                `}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Flexible Spacer */}
        <div className="flex-1 min-h-[16px]" />

        {/* Actions Section */}
        <div className="flex flex-col shrink overflow-hidden px-3 mb-2 border-t border-[#ffe4cc] pt-3">
          {!isCollapsed && (
            <div className="flex items-center gap-3 mb-3 px-2 shrink-0">
              <ActionsIcon className="w-4 h-4 text-[#FF7700]" />
              <span className="font-['Poppins'] font-medium text-[11px] text-slate-800 tracking-[0.2px] uppercase">
                LES ACTIONS & TACHES
              </span>
            </div>
          )}

          {/* Search */}
          {!isCollapsed ? (
            <div className="relative shrink-0 mb-3 border-b border-[#ffe4cc] pb-3">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#FF7700]">
                <SearchIcon className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Recherche"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cec2b7] rounded-[5px] text-[11px] text-[#FF7700] placeholder-[#FF7700] font-['Poppins'] focus:outline-none focus:border-[#FF7700]"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-3 shrink-0">
              <SearchIcon className="w-4 h-4 text-[#FF7700]" />
            </div>
          )}

          {/* Categories List */}
          <div className="overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
            {categoriesLoading ? (
              <div className="flex justify-center py-3">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#ff7700]"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`
                      group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'} 
                      py-1.5 rounded-[8px] hover:bg-[#ffe6ca]/30 transition-colors cursor-pointer
                    `}
                    onClick={() => {
                      // Handle category click if needed
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-[2px] h-[16px] rounded-full shrink-0`} style={{ backgroundColor: category.color || '#ffe6ca' }} />
                      {!isCollapsed && (
                        <span className="font-['Poppins'] font-medium text-[12px] text-slate-800 tracking-[0.2px] truncate">
                          {category.name}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && !category.is_system && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all">
                            <DotsIcon className="w-3.5 h-3.5 text-[#92929D]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameCategory(category); }}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> <span className="text-xs">Renommer</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> <span className="text-xs">Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Family Button */}
          {!isCollapsed && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 mt-3 flex items-center justify-center gap-2 py-1.5 w-full bg-[#ffe6ca] border border-dashed border-[#FF7700] rounded-[5px] hover:bg-[#ffd9b3] transition-colors"
            >
              <AddFamilyIcon className="w-2.5 h-2.5 text-[#FF7700]" />
              <span className="font-['Poppins'] font-medium text-[11px] text-[#FF7700]">
                Ajouter une Famille
              </span>
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 mt-3 flex items-center justify-center w-full h-8 bg-[#ffe6ca] border border-dashed border-[#FF7700] rounded-[5px] hover:bg-[#ffd9b3] transition-colors"
            >
              <AddFamilyIcon className="w-3 h-3 text-[#FF7700]" />
            </button>
          )}
        </div>

        {/* User Profile - Simplified for new design */}
        <div className="p-3 mt-auto shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF7700] to-[#FFCC00] flex items-center justify-center text-white font-bold text-[10px]">
              {user?.name?.[0] || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-[13px] font-bold text-slate-800 truncate">
                  {user?.name}
                </span>
                <span className="text-[11px] text-gray-500 truncate">
                  {user?.role_name || 'Utilisateur'}
                </span>
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* Modals */}
      <CreateTaskCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetchCategories();
          setShowCreateModal(false);
        }}
      />
      <RenameTaskCategoryModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={() => {
          refetchCategories();
          setShowRenameModal(false);
          setSelectedCategory(null);
        }}
      />
    </>
  );
};
