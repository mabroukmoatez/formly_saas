import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { sessionCreation } from '../../services/sessionCreation';
import { Search, Eye, Edit, Trash2, Plus, X, AlertTriangle, Filter, Download, ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import { DashboardLayout } from '../../components/CommercialDashboard';
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
  session_instances?: Array<{
    uuid: string;
    instance_type?: 'presentiel' | 'distanciel' | 'e-learning' | 'hybride';
    start_date?: string;
    end_date?: string;
    status?: string;
  }>;
}

interface Category {
  id: number;
  name: string;
}

interface Trainer {
  uuid: string;
  name: string;
  email?: string;
}

export const Sessions: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'à venir' | 'en cours' | 'terminée'>('all');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<'all' | 'presentiel' | 'distanciel' | 'e-learning' | 'hybride'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const sessionTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Filter data
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Get organization colors
  const primaryColor = organization?.primary_color || '#3b82f6';

  useEffect(() => {
    loadCategories();
    loadTrainers();
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
  }, [statusFilter, categoryFilter, trainerFilter, sessionTypeFilter, startDateFilter, endDateFilter]);

  // Reload sessions when calendar date changes (for calendar view)
  useEffect(() => {
    if (viewMode === 'calendar') {
      loadSessions();
    }
  }, [currentCalendarDate, calendarView, viewMode]);

  // Reload sessions when page or items per page changes
  useEffect(() => {
    loadSessions();
  }, [currentPage, itemsPerPage]);

  // Close filter modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
        if (sessionTypeDropdownRef.current && sessionTypeDropdownRef.current.contains(event.target as Node)) {
          return; // Don't close if clicking inside session type dropdown
        }
        setShowFilterModal(false);
        setShowSessionTypeDropdown(false);
      }
    };

    if (showFilterModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterModal]);

  // Close session type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sessionTypeDropdownRef.current && !sessionTypeDropdownRef.current.contains(event.target as Node)) {
        setShowSessionTypeDropdown(false);
      }
    };

    if (showSessionTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSessionTypeDropdown]);

  const loadCategories = async () => {
    try {
      const response: any = await sessionCreation.getSessionCategories();
      if (response.success && response.data) {
        setCategories(Array.isArray(response.data) ? response.data : response.data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTrainers = async () => {
    try {
      const response: any = await sessionCreation.getAllTrainers({ per_page: 100 });
      if (response.success && response.data) {
        const trainersData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setTrainers(trainersData);
      }
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response: any = await sessionCreation.listOrganizationSessions({
        per_page: itemsPerPage,
        search: searchQuery || undefined,
        category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
        trainer_id: trainerFilter || undefined,
      });
      
      if (response.success) {
        const sessionsData = response.data;
        let sessionsList: Session[] = [];
        
        // Handle Laravel pagination structure: { data: { current_page, data: [...], total, ... } }
        if (sessionsData && sessionsData.data && Array.isArray(sessionsData.data)) {
          sessionsList = sessionsData.data;
        } else if (sessionsData && sessionsData.sessions && Array.isArray(sessionsData.sessions.data)) {
          sessionsList = sessionsData.sessions.data;
        } else if (Array.isArray(sessionsData)) {
          sessionsList = sessionsData;
        } else if (sessionsData && Array.isArray(sessionsData.sessions)) {
          sessionsList = sessionsData.sessions;
        } else {
          sessionsList = [];
        }

        // Apply client-side filters
        let filteredSessions = sessionsList;
        
        // Filter by status
        if (statusFilter !== 'all') {
          filteredSessions = filteredSessions.filter(session => {
            const sessionStatus = getSessionStatus(session);
            return sessionStatus === statusFilter;
          });
        }
        
        // Filter by session type
        if (sessionTypeFilter !== 'all') {
          filteredSessions = filteredSessions.filter(session => {
            const sessionType = getSessionType(session);
            return sessionType === sessionTypeFilter;
          });
        }
        
        // Filter by date range
        if (startDateFilter) {
          filteredSessions = filteredSessions.filter(session => {
            if (!session.session_start_date) return false;
            return new Date(session.session_start_date) >= new Date(startDateFilter);
          });
        }
        
        if (endDateFilter) {
          filteredSessions = filteredSessions.filter(session => {
            if (!session.session_end_date) return false;
            return new Date(session.session_end_date) <= new Date(endDateFilter);
          });
        }
        
        setSessions(filteredSessions);
        setTotalItems(filteredSessions.length);
        setTotalPages(Math.ceil(filteredSessions.length / itemsPerPage));
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
      const response: any = await sessionCreation.deleteSession(sessionToDelete);
      
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

  // Calculate session status based on dates
  const getSessionStatus = (session: Session): 'à venir' | 'en cours' | 'terminée' => {
    if (!session.session_start_date || !session.session_end_date) {
      return 'à venir';
    }
    
    const now = new Date();
    const startDate = new Date(session.session_start_date);
    const endDate = new Date(session.session_end_date);
    
    if (now < startDate) {
      return 'à venir';
    } else if (now >= startDate && now <= endDate) {
      return 'en cours';
    } else {
      return 'terminée';
    }
  };

  // Get session type from instances
  const getSessionType = (session: Session): 'presentiel' | 'distanciel' | 'e-learning' | 'hybride' | null => {
    if (session.session_instances && session.session_instances.length > 0) {
      const types = session.session_instances
        .map(inst => inst.instance_type)
        .filter(Boolean) as string[];
      
      if (types.length === 0) return null;
      
      // If multiple types, it's hybrid
      const uniqueTypes = [...new Set(types)];
      if (uniqueTypes.length > 1) {
        return 'hybride';
      }
      
      return uniqueTypes[0] as 'presentiel' | 'distanciel' | 'e-learning' | 'hybride';
    }
    return null;
  };

  const getStatusBadge = (session: Session) => {
    const status = getSessionStatus(session);
    const colors = {
      'à venir': { bg: '#DBEAFE', text: '#1E40AF' },
      'en cours': { bg: '#FED7AA', text: '#9A3412' },
      'terminée': { bg: '#D1FAE5', text: '#065F46' }
    };
    
    return (
      <Badge 
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{ 
          backgroundColor: colors[status].bg, 
          color: colors[status].text 
        }}
      >
        {status}
      </Badge>
    );
  };

  const getSessionTypeBadge = (session: Session) => {
    const type = getSessionType(session);
    if (!type) return null;
    
    const typeConfig = {
      'distanciel': { label: 'Distanciel', dotColor: '#8B5CF6' },
      'presentiel': { label: 'Présentiel', dotColor: '#10B981' },
      'e-learning': { label: 'E-Learning', dotColor: '#EC4899' },
      'hybride': { label: 'Hybride', dotColor: '#F97316' }
    };
    
    const config = typeConfig[type];
    if (!config) return null;
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.dotColor }}
        />
        <span className="text-sm text-gray-700">{config.label}</span>
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date non définie';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration?: string | number, durationDays?: number) => {
    // If duration_days is provided, show it
    if (durationDays && durationDays > 0) {
      return `${durationDays} jour${durationDays > 1 ? 's' : ''}`;
    }
    
    // If duration is provided (in minutes or as string)
    if (duration) {
      // If it's a string like "2 jours" or "40h", return as-is
      if (typeof duration === 'string' && isNaN(Number(duration))) {
        return duration;
      }
      
      // If it's a number (minutes), convert to readable format
      const minutes = typeof duration === 'string' ? parseInt(duration) : duration;
      if (!isNaN(minutes) && minutes > 0) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
          return `${hours}h ${mins}min`;
        } else if (hours > 0) {
          return `${hours}h`;
        } else {
          return `${mins}min`;
        }
      }
    }
    
    return '-';
  };

  const getTrainerNames = (session: Session) => {
    if (session.trainers && session.trainers.length > 0) {
      const names = session.trainers.map(t => t.name).join(', ');
      const count = session.trainers.length;
      return count > 1 ? `${names.split(',')[0]} +${count - 1}` : names;
    }
    return 'Aucun formateur';
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadSessions();
    setShowFilterModal(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Get paginated sessions for current page
  const paginatedSessions = sessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calendar view functions
  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      if (!session.session_start_date || !session.session_end_date) return false;
      const startDate = new Date(session.session_start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(session.session_end_date);
      endDate.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const getWeekDays = (date: Date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    weekStart.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSessionColor = (session: Session) => {
    const type = getSessionType(session);
    const colors = {
      'presentiel': '#10B981', // Green
      'distanciel': '#8B5CF6', // Purple
      'e-learning': '#EC4899', // Pink
      'hybride': '#F97316' // Orange
    };
    return type ? colors[type] : '#6B7280'; // Gray default
  };

  const formatMonthYear = (date: Date) => {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const navigateCalendarMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentCalendarDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    
    // Get previous month's days to fill the first week
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    const daysBefore = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      daysBefore.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month's days
    const currentDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month's days to fill the last week
    const totalDays = daysBefore.length + currentDays.length;
    const remainingDays = 42 - totalDays; // 6 weeks * 7 days
    const nextDays = [];
    for (let i = 1; i <= remainingDays; i++) {
      nextDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return [...daysBefore, ...currentDays, ...nextDays];
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full px-6 py-6 flex-1 min-h-0 overflow-hidden">
        <section className="flex flex-col w-full gap-5 flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Session
            </h1>
            <Button 
              onClick={handleCreateSession}
              className="h-10 gap-2.5 px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-5 h-5" />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[13px]">
                + Créer Une Nouvelle Session
              </span>
            </Button>
          </div>

          {/* Search and Actions Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#698eac]" />
              <Input
                placeholder="Recherche Une Formation"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="h-10 pl-12 bg-white border border-[#e2e2ea] rounded-[10px] [font-family:'Poppins',Helvetica] font-medium text-[#698eac] text-[13px] placeholder:text-[#698eac]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterModal(true)}
                  className="h-10 gap-2 px-4 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors"
                >
                  <Filter className="w-5 h-5 text-[#7e8ca9]" />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                    Filtre
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                </Button>
              </div>

              <Button
                variant="outline"
                className="h-10 gap-2 px-4 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors"
              >
                <Download className="w-5 h-5 text-[#7e8ca9]" />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                  Export Excel
                </span>
              </Button>

              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
                className="h-10 gap-2 px-4 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors"
                style={viewMode === 'calendar' ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : {}}
              >
                <CalendarIcon className="w-5 h-5" style={{ color: viewMode === 'calendar' ? 'white' : '#7e8ca9' }} />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]" style={{ color: viewMode === 'calendar' ? 'white' : '#7e8ca9' }}>
                  Vue Calendrier
                </span>
              </Button>
              
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                className="h-10 gap-2 px-4 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors"
                style={viewMode === 'table' ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : {}}
              >
                <List className="w-5 h-5" style={{ color: viewMode === 'table' ? 'white' : '#7e8ca9' }} />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]" style={{ color: viewMode === 'table' ? 'white' : '#7e8ca9' }}>
                  Vue Liste
                </span>
              </Button>
            </div>
          </div>

          {/* Calendar View Header */}
          {viewMode === 'calendar' && (
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#698eac]" />
                <Input
                  placeholder="Recherche une Formation"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="h-10 pl-12 bg-white border border-[#e2e2ea] rounded-[10px] [font-family:'Poppins',Helvetica] font-medium text-[#698eac] text-[13px] placeholder:text-[#698eac]"
                />
              </div>

              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterModal(true)}
                  className="h-10 gap-2 px-4 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors bg-white"
                >
                  <Filter className="w-5 h-5 text-[#7e8ca9]" />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                    Filtre
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateCalendarMonth('prev')}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 text-[#7e8ca9]" />
                </Button>
                <span className="text-sm font-medium text-[#19294a] [font-family:'Poppins',Helvetica] min-w-[120px] text-center">
                  {formatMonthYear(currentCalendarDate)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateCalendarMonth('next')}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4 text-[#7e8ca9]" />
                </Button>
              </div>

              <div className="flex items-center border border-[#e2e2ea] rounded-[10px] overflow-hidden bg-white">
                <Button
                  variant={calendarView === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCalendarView('month')}
                  className={`px-4 py-2 rounded-none h-10 text-sm ${
                    calendarView === 'month' ? 'text-white' : 'text-[#7e8ca9] hover:bg-[#f5f4f4]'
                  }`}
                  style={calendarView === 'month' ? { backgroundColor: primaryColor } : {}}
                >
                  Month
                </Button>
                <Button
                  variant={calendarView === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCalendarView('week')}
                  className={`px-4 py-2 rounded-none h-10 text-sm ${
                    calendarView === 'week' ? 'text-white' : 'text-[#7e8ca9] hover:bg-[#f5f4f4]'
                  }`}
                  style={calendarView === 'week' ? { backgroundColor: primaryColor } : {}}
                >
                  week
                </Button>
              </div>
            </div>
          )}

          {/* Calendar Month View */}
          {viewMode === 'calendar' && calendarView === 'month' && (
            <Card className="w-full border-[#e2e2ea] rounded-[18px] overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica] py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentCalendarDate).map((dayInfo, index) => {
                    const daySessions = getSessionsForDate(dayInfo.date);
                    const maxVisible = 4;
                    const visibleSessions = daySessions.slice(0, maxVisible);
                    const remainingCount = daySessions.length - maxVisible;
                    const isToday = dayInfo.date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] border border-[#e2e2ea] rounded p-1 ${
                          !dayInfo.isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'
                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className={`text-xs font-medium mb-1 ${
                          dayInfo.isCurrentMonth ? 'text-[#19294a]' : 'text-gray-400'
                        } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                          {dayInfo.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {visibleSessions.map((session) => {
                            const color = getSessionColor(session);
                            const startDate = session.session_start_date ? new Date(session.session_start_date) : null;
                            const endDate = session.session_end_date ? new Date(session.session_end_date) : null;
                            if (!startDate || !endDate) return null;
                            
                            startDate.setHours(0, 0, 0, 0);
                            endDate.setHours(23, 59, 59, 999);
                            const checkDate = new Date(dayInfo.date);
                            checkDate.setHours(0, 0, 0, 0);
                            
                            const isStart = checkDate.toDateString() === startDate.toDateString();
                            const isEnd = checkDate.toDateString() === endDate.toDateString();
                            const isMiddle = checkDate > startDate && checkDate < endDate;
                            
                            return (
                              <div
                                key={session.uuid}
                                className="text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: color }}
                                onClick={() => handleViewSession(session.uuid)}
                                title={session.title}
                              >
                                {isStart || (!isMiddle && !isEnd) ? (
                                  session.title.length > 20 ? `${session.title.substring(0, 20)}...` : session.title
                                ) : (
                                  <span className="opacity-75">•</span>
                                )}
                              </div>
                            );
                          })}
                          {remainingCount > 0 && (
                            <div className="text-xs text-gray-500 px-2 py-1">
                              + {remainingCount} Plus
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Week View */}
          {viewMode === 'calendar' && calendarView === 'week' && (
            <Card className="w-full border-[#e2e2ea] rounded-[18px] overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica] py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getWeekDays(currentCalendarDate).map((day, index) => {
                    const daySessions = getSessionsForDate(day);
                    const maxVisible = 6;
                    const visibleSessions = daySessions.slice(0, maxVisible);
                    const remainingCount = daySessions.length - maxVisible;
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isCurrentMonth = day.getMonth() === currentCalendarDate.getMonth();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[400px] border border-[#e2e2ea] rounded p-2 ${
                          !isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'
                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-2 ${
                          isCurrentMonth ? 'text-[#19294a]' : 'text-gray-400'
                        } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {visibleSessions.map((session) => {
                            const color = getSessionColor(session);
                            const startDate = session.session_start_date ? new Date(session.session_start_date) : null;
                            const endDate = session.session_end_date ? new Date(session.session_end_date) : null;
                            const isStart = startDate && day.toDateString() === startDate.toDateString();
                            const isEnd = endDate && day.toDateString() === endDate.toDateString();
                            const isMiddle = startDate && endDate && 
                              day > startDate && day < endDate;
                            
                            return (
                              <div
                                key={session.uuid}
                                className="text-xs px-2 py-1.5 rounded text-white cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: color }}
                                onClick={() => handleViewSession(session.uuid)}
                                title={session.title}
                              >
                                {isStart || (!isMiddle && !isEnd) ? (
                                  <div className="truncate">{session.title}</div>
                                ) : (
                                  <div className="opacity-75">•</div>
                                )}
                              </div>
                            );
                          })}
                          {remainingCount > 0 && (
                            <div className="text-xs text-gray-500 px-2 py-1">
                              + {remainingCount} Plus
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
          <Card className="w-full border-[#e2e2ea] rounded-[18px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f5f5f5] border-b border-[#e2e2ea]">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      intitulé de la Formation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      <div className="flex items-center gap-2">
                        Type de session
                        <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      <div className="flex items-center gap-2">
                        Status
                        <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      <div className="flex items-center gap-2">
                        Durée
                        <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      <div className="flex items-center gap-2">
                        Date de début
                        <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      <div className="flex items-center gap-2">
                        Date de fin
                        <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      <div className="flex items-center gap-2">
                        Nombre De Participants
                        <ChevronDown className="w-4 h-4 text-[#7e8ca9]" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        Aucune session trouvée
                      </td>
                    </tr>
                  ) : (
                    paginatedSessions.map((session) => (
                      <tr key={session.uuid} className="border-b border-[#e2e2ea] hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">
                            {session.title}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {getSessionTypeBadge(session) || (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(session)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">
                            {formatDuration(session.duration, session.duration_days)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">
                            {formatDate(session.session_start_date)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">
                            {formatDate(session.session_end_date)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">
                            {session.participants_count || 0}/{session.max_participants || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          )}

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
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleItemsPerPageChange(parseInt(e.target.value))}
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

      {/* Filter Modal - Mobile Style like Figma */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 md:items-center">
          <div 
            ref={filterModalRef}
            className="bg-white rounded-t-[20px] md:rounded-[20px] w-full md:max-w-md md:w-auto md:mx-4 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white z-10 border-b border-[#e2e2ea] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#19294a] [font-family:'Poppins',Helvetica]">
                Filtres
              </h2>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Formation Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="[font-family:'Poppins',Helvetica] font-semibold text-sm text-[#19294a]">
                    Formation
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('')}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                    className="w-full h-10 px-4 pr-10 rounded-[10px] bg-[#f5f5f5] border border-[#e2e2ea] text-[#19294a] [font-family:'Poppins',Helvetica] text-sm appearance-none"
                  >
                    <option value="">Sélectionner</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e8ca9] pointer-events-none" />
                </div>
              </div>

              {/* Formateur Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="[font-family:'Poppins',Helvetica] font-semibold text-sm text-[#19294a]">
                    Formateur
                  </label>
                  <button
                    type="button"
                    onClick={() => setTrainerFilter('')}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={trainerFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTrainerFilter(e.target.value)}
                    className="w-full h-10 px-4 pr-10 rounded-[10px] bg-[#f5f5f5] border border-[#e2e2ea] text-[#19294a] [font-family:'Poppins',Helvetica] text-sm appearance-none"
                  >
                    <option value="">Sélectionner</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.uuid} value={trainer.uuid}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e8ca9] pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="[font-family:'Poppins',Helvetica] font-semibold text-sm text-[#19294a]">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <div className="relative mb-3">
                  <select
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
                    className="w-full h-10 px-4 pr-10 rounded-[10px] bg-[#f5f5f5] border border-[#e2e2ea] text-[#19294a] [font-family:'Poppins',Helvetica] text-sm appearance-none"
                  >
                    <option value="all">ALL</option>
                    <option value="à venir">à venir</option>
                    <option value="en cours">en cours</option>
                    <option value="terminée">terminée</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e8ca9] pointer-events-none" />
                </div>
                {/* Radio Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('à venir')}
                    className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'à venir'
                        ? 'bg-[#DBEAFE] text-[#1E40AF]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    à venir
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('en cours')}
                    className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'en cours'
                        ? 'bg-[#FED7AA] text-[#9A3412]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    en cours
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('terminée')}
                    className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'terminée'
                        ? 'bg-[#D1FAE5] text-[#065F46]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    terminée
                  </button>
                </div>
                {/* Date Range */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDateFilter(e.target.value)}
                      className="w-full h-10 px-4 pr-10 rounded-[10px] bg-[#f5f5f5] border border-[#e2e2ea] text-[#19294a] [font-family:'Poppins',Helvetica] text-sm"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e8ca9] pointer-events-none" />
                  </div>
                  <span className="text-sm font-medium text-[#19294a] [font-family:'Poppins',Helvetica]">À</span>
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDateFilter(e.target.value)}
                      className="w-full h-10 px-4 pr-10 rounded-[10px] bg-[#f5f5f5] border border-[#e2e2ea] text-[#19294a] [font-family:'Poppins',Helvetica] text-sm"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e8ca9] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Type De La Session Filter */}
              <div className="relative" ref={sessionTypeDropdownRef}>
                <div className="flex items-center justify-between mb-3">
                  <label className="[font-family:'Poppins',Helvetica] font-semibold text-sm text-[#19294a]">
                    Type De La Session
                  </label>
                  <button
                    type="button"
                    onClick={() => setSessionTypeFilter('all')}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <div className="relative">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSessionTypeDropdown(!showSessionTypeDropdown)}
                      className="w-full h-10 px-4 pr-10 rounded-[10px] bg-[#f5f5f5] border border-[#e2e2ea] text-left [font-family:'Poppins',Helvetica] text-sm flex items-center justify-between"
                    >
                      <span className={sessionTypeFilter === 'all' ? 'text-gray-500' : 'text-[#19294a]'}>
                        {sessionTypeFilter === 'all' 
                          ? 'Sélectionner' 
                          : sessionTypeFilter === 'distanciel' 
                            ? 'Distanciel' 
                            : sessionTypeFilter === 'presentiel'
                              ? 'Présentiel'
                              : sessionTypeFilter === 'e-learning'
                                ? 'E-Learning'
                                : 'Hybride'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#7e8ca9] transition-transform ${showSessionTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu - Bottom Sheet Style */}
                    {showSessionTypeDropdown && (
                      <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-x-auto md:bottom-auto md:top-full md:mt-1 z-50 bg-white border-t md:border-t-0 md:border border-[#e2e2ea] rounded-t-[20px] md:rounded-[10px] shadow-lg overflow-hidden max-h-[50vh] md:max-h-96 overflow-y-auto">
                        <div className="md:hidden px-4 py-3 border-b border-[#e2e2ea] flex items-center justify-between">
                          <span className="font-semibold text-[#19294a] [font-family:'Poppins',Helvetica]">Type De La Session</span>
                          <button
                            type="button"
                            onClick={() => setShowSessionTypeDropdown(false)}
                            className="w-8 h-8 flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <div className="py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSessionTypeFilter('distanciel');
                              setShowSessionTypeDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                              sessionTypeFilter === 'distanciel' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#8B5CF6' }} />
                            <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">Distanciel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionTypeFilter('presentiel');
                              setShowSessionTypeDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                              sessionTypeFilter === 'presentiel' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#10B981' }} />
                            <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">Présentiel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionTypeFilter('e-learning');
                              setShowSessionTypeDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                              sessionTypeFilter === 'e-learning' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#EC4899' }} />
                            <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">E-Learning</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionTypeFilter('hybride');
                              setShowSessionTypeDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                              sessionTypeFilter === 'hybride' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#F97316' }} />
                            <span className="text-sm text-[#19294a] [font-family:'Poppins',Helvetica]">Hybride</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="sticky bottom-0 bg-white border-t border-[#e2e2ea] px-6 py-4">
              <Button
                onClick={applyFilters}
                className="w-full h-12 rounded-[10px] font-medium [font-family:'Poppins',Helvetica] text-white text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </div>
      )}

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
