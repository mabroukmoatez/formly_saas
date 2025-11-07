import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { sessionCreation } from '../../services/sessionCreation';
import { Search, Clock, User, Eye, Edit, Trash2, Plus, Grid3X3, List, X, AlertTriangle, Filter, Download, ChevronDown, ChevronLeft, ChevronRight, Calendar, Users, Play } from 'lucide-react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Session {
  uuid: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number | string;
  price_ht?: number | string;
  duration?: string;
  duration_days?: number;
  session_start_date?: string;
  session_end_date?: string;
  session_start_time?: string;
  session_end_time?: string;
  max_participants?: number;
  current_participants?: number;
  status: number;
  category_id?: number;
  created_at: string;
  updated_at: string;
  image?: string;
  video?: string;
  image_url?: string;
  video_url?: string;
  has_image?: boolean;
  has_video?: boolean;
  currency?: string;
  category?: {
    id: number;
    name: string;
  };
  trainers?: Array<{
    uuid: string;
    name: string;
    email?: string;
    specialization?: string;
  }>;
  participants_count?: number;
  instances_count?: number;
  session_instances?: Array<any>;
}

export const Sessions: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Get organization colors
  const primaryColor = organization?.primary_color || '#3b82f6';
  const secondaryColor = organization?.secondary_color || '#64748b';
  const accentColor = organization?.accent_color || '#f59e0b';

  useEffect(() => {
    loadSessions();
  }, []);

  // Reload sessions when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadSessions();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reload sessions when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filtering
    loadSessions();
  }, [statusFilter, categoryFilter]);

  // Reload sessions when page or items per page changes
  useEffect(() => {
    loadSessions();
  }, [currentPage, itemsPerPage]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionCreation.listOrganizationSessions({
        per_page: itemsPerPage,
        search: searchQuery || undefined,
        category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
        status: statusFilter ? parseInt(statusFilter) : undefined,
      });
      
      if (response.success) {
        const sessionsData = response.data;
        let sessionsList: Session[] = [];
        let paginationInfo = {
          total: 0,
          per_page: itemsPerPage,
          current_page: currentPage,
          last_page: 1,
        };
        
        // Handle Laravel pagination structure: { data: { current_page, data: [...], total, ... } }
        if (sessionsData && sessionsData.data && Array.isArray(sessionsData.data)) {
          sessionsList = sessionsData.data;
          paginationInfo = {
            total: sessionsData.total || 0,
            per_page: sessionsData.per_page || itemsPerPage,
            current_page: sessionsData.current_page || currentPage,
            last_page: sessionsData.last_page || 1,
          };
        } else if (sessionsData && sessionsData.sessions && Array.isArray(sessionsData.sessions.data)) {
          sessionsList = sessionsData.sessions.data;
          if (sessionsData.sessions.pagination) {
            paginationInfo = sessionsData.sessions.pagination;
          } else if (sessionsData.pagination) {
            paginationInfo = sessionsData.pagination;
          }
        } else if (Array.isArray(sessionsData)) {
          sessionsList = sessionsData;
        } else if (sessionsData && Array.isArray(sessionsData.sessions)) {
          sessionsList = sessionsData.sessions;
        } else {
          sessionsList = [];
        }

        console.log('📋 Loaded sessions:', sessionsList.length);
        console.log('📋 First session data:', sessionsList[0]);
        if (sessionsList[0]) {
          console.log('📋 First session image_url:', sessionsList[0].image_url);
          console.log('📋 First session image:', sessionsList[0].image);
          console.log('📋 First session has_image:', sessionsList[0].has_image);
        }
        
        setSessions(sessionsList);
        setTotalItems(paginationInfo.total || sessionsList.length);
        setTotalPages(paginationInfo.last_page || 1);
      } else {
        setSessions([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = () => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/session-creation`);
    } else {
      navigate('/session-creation');
    }
  };

  const handleViewSession = (sessionUuid: string) => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/session-view/${sessionUuid}`);
    } else {
      navigate(`/session-view/${sessionUuid}`);
    }
  };

  const handleEditSession = (sessionUuid: string) => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/session-edit/${sessionUuid}`);
    } else {
      navigate(`/session-edit/${sessionUuid}`);
    }
  };

  const handleDeleteSession = async (sessionUuid: string) => {
    setSessionToDelete(sessionUuid);
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      setLoading(true);
      const response = await sessionCreation.deleteSession(sessionToDelete);
      
      if (response.success) {
        setSessions(prev => prev.filter(session => session.uuid !== sessionToDelete));
      } else {
        console.error('Failed to delete session:', response.message);
      }
    } catch (error: any) {
      console.error('Error deleting session:', error);
      
      if (error.status === 404) {
        setSessions(prev => prev.filter(session => session.uuid !== sessionToDelete));
        console.warn('Session already deleted, removing from list');
      }
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  const cancelDeleteSession = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPaginationInfo = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    return { startItem, endItem };
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="text-white rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm" style={{ backgroundColor: '#10b981' }}>Publiée</Badge>;
      case 0:
        return <Badge className="text-white rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm" style={{ backgroundColor: accentColor }}>Brouillon</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm">Inconnu</Badge>;
    }
  };

  const formatPrice = (price?: number | string) => {
    if (!price && price !== 0) return 'Prix non défini';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Prix non défini';
    return `${numPrice.toFixed(0)} €`;
  };

  const formatDuration = (session: Session) => {
    if (session.duration) {
      return session.duration;
    }
    if (session.duration_days && session.duration_days > 0) {
      return `${session.duration_days} Jours`;
    }
    return 'Durée non définie';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date non définie';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTimeRange = (session: Session) => {
    if (session.session_start_time && session.session_end_time) {
      return `${session.session_start_time} - ${session.session_end_time}`;
    }
    return 'Horaire non défini';
  };

  const getTrainerName = (session: Session) => {
    if (session.trainers && session.trainers.length > 0) {
      return session.trainers[0].name;
    }
    return 'Aucun formateur assigné';
  };

  const getSessionImage = (session: Session) => {
    // Retourner l'image de la session ou un placeholder
    if (session.image_url) {
      // Normalize URL - replace escaped slashes if present
      let imageUrl = session.image_url.replace(/\\\//g, '/');
      // Add /storage/ if URL contains /uploads/ but not /storage/
      if (imageUrl.includes('/uploads/') && !imageUrl.includes('/storage/')) {
        imageUrl = imageUrl.replace('/uploads/', '/storage/uploads/');
      }
      return imageUrl;
    }
    return '/uploads/default/session.jpg';
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full px-6 py-6 flex-1 min-h-0 overflow-hidden">
        <section className="flex flex-col w-full gap-5 flex-1 min-h-0">
          {/* Header Card */}
          <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <CardContent className="flex items-center justify-between p-[21px]">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Calendar className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h1 
                    className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                    style={{ fontFamily: 'Poppins, Helvetica' }}
                  >
                    Gestion des Sessions
                  </h1>
                  <p 
                    className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
                  >
                    Gérez vos sessions de formation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <Button 
                  onClick={handleCreateSession}
                  className="h-10 gap-2.5 px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-all duration-200"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[13px]">
                    Créer une Session
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter and Search Card */}
          <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
            <CardContent className="flex flex-col gap-[26px] p-[21px]">
              <div className="flex items-center justify-between w-full">
                <div className="relative w-[461px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[22.22px] h-[22.22px] text-[#698eac]" />
                  <Input
                    placeholder="Rechercher une session"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-[50px] bg-[#e8f0f7] border-0 rounded-[10px] [font-family:'Poppins',Helvetica] font-medium text-[#698eac] text-[13px] placeholder:text-[#698eac]"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative" ref={filterDropdownRef}>
                    <Button
                      variant="ghost"
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="h-10 gap-2.5 px-4 py-2.5 bg-[#f5f4f4] rounded-[10px] hover:bg-[#e5e4e4] transition-colors"
                    >
                      <Filter className="w-5 h-5 text-[#7e8ca9]" />
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                        Filtrer
                      </span>
                      <ChevronDown className="w-[11px] h-[6.51px] text-[#7e8ca9]" />
                    </Button>
                    
                    {/* Filter Dropdown */}
                    {showFilterDropdown && (
                      <div className="absolute top-12 right-0 bg-white border border-[#e2e2ea] rounded-[10px] shadow-lg z-10 min-w-[200px] p-4">
                        <div className="space-y-4">
                          {/* Status Filter */}
                          <div>
                            <label className="block text-sm font-medium text-[#19294a] mb-2">
                              Statut
                            </label>
                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="w-full p-2 border border-[#e2e2ea] rounded-[8px] text-sm"
                            >
                              <option value="">Tous les statuts</option>
                              <option value="1">Publié</option>
                              <option value="0">Brouillon</option>
                            </select>
                          </div>
                          
                          {/* Category Filter */}
                          {/* Catégories chargées depuis l'API si nécessaire */}
                          
                          {/* Clear Filters */}
                          <div className="pt-2 border-t border-[#e2e2ea]">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setStatusFilter('');
                                setCategoryFilter('');
                                setSearchQuery('');
                              }}
                              className="w-full h-8 text-xs"
                            >
                              Réinitialiser les filtres
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="h-10 gap-2.5 px-4 py-2.5 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors"
                  >
                    <Download className="w-5 h-5 text-[#7e8ca9]" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                      Exporter
                    </span>
                  </Button>

                  {/* View Toggle */}
                  <div className="flex items-center border border-[#e2e2ea] rounded-[10px] overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-none h-10 ${viewMode === 'grid' ? 'text-white' : 'text-[#7e8ca9] hover:bg-[#f5f4f4]'}`}
                      style={viewMode === 'grid' ? { backgroundColor: primaryColor } : {}}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-none h-10 ${viewMode === 'list' ? 'text-white' : 'text-[#7e8ca9] hover:bg-[#f5f4f4]'}`}
                      style={viewMode === 'list' ? { backgroundColor: primaryColor } : {}}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content System */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-stretch' : 'space-y-2'}>
            {(Array.isArray(sessions) ? sessions : []).map((session) => (
              <Card key={session.uuid} className={`bg-white border-[#e2e2ea] rounded-[12px] shadow-sm transition-all duration-200 overflow-hidden group flex flex-col ${
                viewMode === 'grid' 
                  ? 'h-auto min-h-[450px] hover:shadow-lg' 
                  : 'h-[100px] hover:bg-gray-50 hover:border-gray-300'
              }`}>
                {viewMode === 'grid' ? (
                  // Grid View - Card Layout
                  <>
                    {/* Hero Image Area */}
                    <div className="relative h-[200px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
                      {(() => {
                        // Get image source - prioritize image_url, then build from image field
                        const getSessionImage = (s: Session): string | null => {
                          // First priority: image_url (complete URL from API)
                          if (s.image_url) {
                            // Normalize URL - replace escaped slashes if present
                            let normalizedUrl = s.image_url.replace(/\\\//g, '/');
                            // Add /storage/ if URL contains /uploads/ but not /storage/
                            if (normalizedUrl.includes('/uploads/') && !normalizedUrl.includes('/storage/')) {
                              normalizedUrl = normalizedUrl.replace('/uploads/', '/storage/uploads/');
                            }
                            console.log('🖼️ Using image_url:', normalizedUrl);
                            return normalizedUrl;
                          }
                          // Second priority: image field (construct full URL)
                          if (s.image) {
                            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                            let imagePath = s.image.replace(/\\\//g, '/'); // Normalize slashes
                            // If image already starts with http, use as is
                            if (imagePath.startsWith('http')) {
                              // Add /storage/ if URL contains /uploads/ but not /storage/
                              if (imagePath.includes('/uploads/') && !imagePath.includes('/storage/')) {
                                imagePath = imagePath.replace('/uploads/', '/storage/uploads/');
                              }
                              console.log('🖼️ Using full URL from image:', imagePath);
                              return imagePath;
                            }
                            // If image starts with uploads/, use directly with storage
                            if (imagePath.startsWith('uploads/')) {
                              const fullUrl = `${baseUrl}/storage/${imagePath}`;
                              console.log('🖼️ Constructed URL from uploads/:', fullUrl);
                              return fullUrl;
                            }
                            // Otherwise, assume it's in uploads/session/
                            const fullUrl = `${baseUrl}/storage/uploads/session/${imagePath}`;
                            console.log('🖼️ Constructed URL for session:', fullUrl);
                            return fullUrl;
                          }
                          console.log('⚠️ No image found for session:', s.uuid);
                          return null;
                        };
                        
                        const imageSrc = getSessionImage(session);
                        console.log('📸 Final image source for session', session.uuid, ':', imageSrc);
                        
                        return imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={session.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', imageSrc);
                            }}
                            onError={(e) => {
                              console.error('❌ Image failed to load:', imageSrc, e);
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white/40" />
                          </div>
                        );
                      })()}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(session.status)}
                      </div>
                      
                      {/* Video indicator if video exists */}
                      {(session.video_url || session.has_video) && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/50 text-white flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            <span className="text-xs">Vidéo</span>
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Container */}
                    <CardContent className="p-5 flex-1 flex flex-col min-h-0 overflow-hidden">
                      {/* Title */}
                      <h3 className="font-bold text-lg text-[#19294a] mb-3 line-clamp-2 leading-tight [font-family:'Poppins',Helvetica] flex-shrink-0">
                        {session.title}
                      </h3>
                      
                      {/* Category Badge */}
                      {session.category && (
                        <div className="mb-3 flex-shrink-0">
                          <span 
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white min-w-[80px] text-center justify-center"
                            style={{ backgroundColor: secondaryColor }}
                          >
                            {session.category.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Metadata Row */}
                      <div className="space-y-1.5 mb-3 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm text-[#7e8ca9]">
                          <Calendar className="w-4 h-4 text-[#698eac] flex-shrink-0" />
                          <span className="[font-family:'Poppins',Helvetica] truncate text-xs">
                            {formatDate(session.session_start_date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-[#7e8ca9]">
                          <Clock className="w-4 h-4 text-[#698eac] flex-shrink-0" />
                          <span className="[font-family:'Poppins',Helvetica] truncate text-xs">
                            {formatTimeRange(session)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-[#7e8ca9]">
                          <User className="w-4 h-4 text-[#698eac] flex-shrink-0" />
                          <span className="[font-family:'Poppins',Helvetica] truncate text-xs">
                            {getTrainerName(session)}
                          </span>
                        </div>

                        {session.max_participants && (
                          <div className="flex items-center gap-2 text-sm text-[#7e8ca9]">
                            <Users className="w-4 h-4 text-[#698eac] flex-shrink-0" />
                            <span className="[font-family:'Poppins',Helvetica] truncate text-xs">
                              {session.participants_count || 0}/{session.max_participants} participants
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1"></div>
                      
                      {/* Price Display - Always visible at bottom */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#e2e2ea] flex-shrink-0 mt-auto">
                        <div className="flex flex-col">
                          <span 
                            className="font-bold text-xl [font-family:'Poppins',Helvetica]"
                            style={{ color: primaryColor }}
                          >
                            {formatPrice(session.price_ht || session.price || 0)}
                          </span>
                          {session.currency && (
                            <span className="text-xs text-[#7e8ca9]">{session.currency}</span>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 items-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => handleViewSession(session.uuid)}
                            title="Voir"
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => handleEditSession(session.uuid)}
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-[#7e8ca9] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            onClick={() => handleDeleteSession(session.uuid)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  // List View - Compact Horizontal Layout
                  <CardContent className="p-3 h-full">
                    <div className="flex items-center gap-3 w-full h-full">
                      {/* Compact Thumbnail */}
                      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-400 to-purple-600">
                        {(() => {
                          // Get image source - same logic as grid view
                          const getSessionImage = (s: Session): string | null => {
                            if (s.image_url) {
                              // Normalize URL - replace escaped slashes if present
                              let imageUrl = s.image_url.replace(/\\\//g, '/');
                              // Add /storage/ if URL contains /uploads/ but not /storage/
                              if (imageUrl.includes('/uploads/') && !imageUrl.includes('/storage/')) {
                                imageUrl = imageUrl.replace('/uploads/', '/storage/uploads/');
                              }
                              return imageUrl;
                            }
                            if (s.image) {
                              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                              let imagePath = s.image.replace(/\\\//g, '/'); // Normalize slashes
                              if (imagePath.startsWith('http')) {
                                // Add /storage/ if URL contains /uploads/ but not /storage/
                                if (imagePath.includes('/uploads/') && !imagePath.includes('/storage/')) {
                                  imagePath = imagePath.replace('/uploads/', '/storage/uploads/');
                                }
                                return imagePath;
                              }
                              if (imagePath.startsWith('uploads/')) {
                                return `${baseUrl}/storage/${imagePath}`;
                              }
                              return `${baseUrl}/storage/uploads/session/${imagePath}`;
                            }
                            return null;
                          };
                          
                          const imageSrc = getSessionImage(session);
                          
                          return imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={session.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('❌ List view image failed to load:', imageSrc);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Calendar className="w-8 h-8 text-white/50" />
                            </div>
                          );
                        })()}
                        <div className="absolute top-1 left-1">
                          {getStatusBadge(session.status)}
                        </div>
                        {(session.video_url || session.has_video) && (
                          <div className="absolute bottom-1 right-1">
                            <Badge className="bg-black/70 text-white p-0.5">
                              <Play className="w-2.5 h-2.5" />
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Session Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-semibold text-base text-[#19294a] mb-1 line-clamp-1 [font-family:'Poppins',Helvetica]">
                          {session.title}
                        </h3>
                        
                        {session.category && (
                          <div className="mb-1">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: secondaryColor }}
                            >
                              {session.category.name}
                            </span>
                          </div>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-[#7e8ca9]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#698eac]" />
                            <span className="[font-family:'Poppins',Helvetica] truncate">
                              {formatDate(session.session_start_date)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#698eac]" />
                            <span className="[font-family:'Poppins',Helvetica] truncate">
                              {getTrainerName(session)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Price and Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex flex-col items-end">
                          <span 
                            className="font-bold text-lg [font-family:'Poppins',Helvetica] min-w-[60px] text-right"
                            style={{ color: primaryColor }}
                          >
                            {formatPrice(session.price_ht || session.price || 0)}
                          </span>
                          {session.currency && (
                            <span className="text-xs text-[#7e8ca9]">{session.currency}</span>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 items-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => handleViewSession(session.uuid)}
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => handleEditSession(session.uuid)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-[#7e8ca9] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            onClick={() => handleDeleteSession(session.uuid)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:500ms]">
              <CardContent className="flex items-center justify-between p-[21px]">
                {/* Pagination Info */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#7e8ca9] [font-family:'Poppins',Helvetica]">
                    Affichage {getPaginationInfo().startItem} à {getPaginationInfo().endItem} sur {totalItems} sessions
                  </span>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#7e8ca9] [font-family:'Poppins',Helvetica]">Afficher:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                      className="px-2 py-1 border border-[#e2e2ea] rounded-[6px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                    <span className="text-sm text-[#7e8ca9] [font-family:'Poppins',Helvetica]">par page</span>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-[#e2e2ea] rounded-[6px] hover:bg-[#f9f9f9] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className={`h-8 w-8 p-0 rounded-[6px] ${
                            currentPage === 1 
                              ? 'text-white' 
                              : 'border-[#e2e2ea] hover:bg-[#f9f9f9]'
                          }`}
                          style={currentPage === 1 ? { backgroundColor: primaryColor } : {}}
                        >
                          1
                        </Button>
                        {currentPage > 4 && <span className="text-[#7e8ca9] px-1">...</span>}
                      </>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 rounded-[6px] ${
                            currentPage === pageNum 
                              ? 'text-white' 
                              : 'border-[#e2e2ea] hover:bg-[#f9f9f9]'
                          }`}
                          style={currentPage === pageNum ? { backgroundColor: primaryColor } : {}}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-[#7e8ca9] px-1">...</span>}
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className={`h-8 w-8 p-0 rounded-[6px] ${
                            currentPage === totalPages 
                              ? 'text-white' 
                              : 'border-[#e2e2ea] hover:bg-[#f9f9f9]'
                          }`}
                          style={currentPage === totalPages ? { backgroundColor: primaryColor } : {}}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-[#e2e2ea] rounded-[6px] hover:bg-[#f9f9f9] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!Array.isArray(sessions) || sessions.length === 0) && (
            <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
              <CardContent className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-[#e8f0f7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[#698eac]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#19294a] mb-2 [font-family:'Poppins',Helvetica]">
                    Aucune session trouvée
                  </h3>
                  <p className="text-[#7e8ca9] mb-6 [font-family:'Poppins',Helvetica]">
                    Commencez par créer votre première session de formation
                  </p>
                  <Button 
                    onClick={handleCreateSession}
                    className="h-10 gap-2.5 px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-all duration-200 [font-family:'Poppins',Helvetica] font-medium text-white text-[13px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus className="w-5 h-5" />
                    Créer votre première session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full mx-4 relative shadow-2xl">
            <button
              onClick={cancelDeleteSession}
              className="absolute top-4 right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
            >
              <X className="w-4 h-4 text-blue-600" />
            </button>

            <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-red-700 font-medium text-sm [font-family:'Poppins',Helvetica]">
                  Voulez-vous vraiment supprimer cette session ?
                </span>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-gray-800 text-base [font-family:'Poppins',Helvetica]">
                Cette action est irréversible.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={cancelDeleteSession}
                variant="outline"
                className="flex-1 h-12 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-[10px] font-medium [font-family:'Poppins',Helvetica]"
              >
                Non, Annuler
              </Button>
              <Button
                onClick={confirmDeleteSession}
                disabled={loading}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-[10px] font-medium [font-family:'Poppins',Helvetica] flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Suppression...' : 'Oui Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
