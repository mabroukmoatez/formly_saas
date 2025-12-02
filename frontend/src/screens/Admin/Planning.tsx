import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import {
  getCalendarData,
  getPlanningOverview,
  getInstanceTypeColor,
  getEventTypeColor,
  getStatusLabel,
  getInstanceTypeLabel,
  type CalendarItem,
  type CalendarData,
  type PlanningOverview
} from '../../services/planning';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Video,
  Filter,
  X,
  BookOpen,
  GraduationCap,
  Monitor,
  Laptop,
  Plus
} from 'lucide-react';

interface Filters {
  search: string;
  type: 'all' | 'event' | 'session_instance' | 'course';
  instance_type: 'all' | 'presentiel' | 'distanciel' | 'hybride' | 'e-learning';
  instructor: string;
  status: 'all' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  formation: string;
  formateur: string;
  dateFrom: string;
  dateTo: string;
}

interface Course {
  id: number;
  uuid: string;
  title: string;
  subtitle: string;
  description: string;
  status: number;
  price: string;
  duration: number;
  duration_days: number;
  course_type: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
  instructors?: Array<{
    id: number;
    name: string;
    email?: string;
  }>;
}

export const Planning = (): JSX.Element => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const { navigateToRoute } = useSubdomainNavigation();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [planningOverview, setPlanningOverview] = useState<PlanningOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [viewType, setViewType] = useState<'all' | 'sessions' | 'events'>('all');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    instance_type: 'all',
    instructor: '',
    status: 'all',
    formation: '',
    formateur: '',
    dateFrom: '',
    dateTo: ''
  });

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Fetch calendar data
  useEffect(() => {
    fetchData();
  }, [currentDate, filters.type, filters.instance_type, filters.status, viewType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const params = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        show_events: filters.type === 'all' || filters.type === 'event',
        show_sessions: filters.type === 'all' || filters.type === 'session_instance',
        instance_type: filters.instance_type !== 'all' ? filters.instance_type : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
      };

      const [calendar, overview] = await Promise.all([
        getCalendarData(params),
        getPlanningOverview({
          start_date: params.start_date,
          end_date: params.end_date,
        }),
      ]);

      setCalendarData(calendar);
      setPlanningOverview(overview);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les données du calendrier');
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Convert courses to calendar items using creation date
  const convertCoursesToCalendarItems = (): CalendarItem[] => {
    if (!planningOverview?.courses) return [];
    
    return planningOverview.courses.map((course: Course) => ({
      id: `course-${course.id}`,
      type: 'course' as const,
      title: course.title,
      description: course.subtitle || course.description?.replace(/<[^>]*>/g, '').substring(0, 100),
      start: course.created_at,
      end: course.created_at,
      color: organization?.primary_color || '#007aff',
      course: {
        id: course.id,
        title: course.title,
        category: course.category?.name
      },
      trainers: course.instructors?.map(instructor => ({
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        is_primary: true
      })),
      status: 'scheduled',
      participants_count: 0
    }));
  };

  // Get all items combined and sorted
  const getAllItems = (): CalendarItem[] => {
    if (!calendarData) return [];
    
    const events = calendarData.events || [];
    const sessions = calendarData.sessions || [];
    const courses = filters.type === 'all' || filters.type === 'course' 
      ? convertCoursesToCalendarItems() 
      : [];
    
    return [...events, ...sessions, ...courses].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  };

  // Filter items
  const getFilteredItems = (): CalendarItem[] => {
    let items = getAllItems();

    // Filtrer par type (Sessions/Événements/Tout)
    if (viewType === 'sessions') {
      items = items.filter(item => item.type === 'session_instance' || item.type === 'course');
    } else if (viewType === 'events') {
      items = items.filter(item => item.type === 'event');
    }
    // viewType === 'all' : pas de filtre

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.session?.title.toLowerCase().includes(searchLower) ||
        item.trainers?.some(t => t.name.toLowerCase().includes(searchLower))
      );
    }

    if (filters.instructor || filters.formateur) {
      const instructorFilter = filters.instructor || filters.formateur;
      items = items.filter(item =>
        item.trainers?.some(t => t.name.toLowerCase().includes(instructorFilter.toLowerCase()))
      );
    }

    // Filtrer par date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      items = items.filter(item => new Date(item.start) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      items = items.filter(item => new Date(item.start) <= toDate);
    }

    return items;
  };

  // Get calendar days (starting with Monday)
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: Array<{ date: Date | null; items: CalendarItem[] }> = [];

    // Add empty days for the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, items: [] });
    }

    // Add days of the month
    const filteredItems = getFilteredItems();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayItems = filteredItems.filter(item => {
        const itemStart = new Date(item.start);
        const itemEnd = new Date(item.end);
        const itemStartDate = new Date(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());
        const itemEndDate = new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate());
        const currentDateOnly = new Date(year, month, day);
        
        // Check if item spans this day
        return currentDateOnly >= itemStartDate && currentDateOnly <= itemEndDate;
      });
      days.push({ date, items: dayItems });
    }

    return days;
  };

  // Get statistics
  const getStats = () => {
    const items = getFilteredItems();
    const coursesCount = (filters.type === 'all' || filters.type === 'course') 
      ? (planningOverview?.courses?.length || 0) 
      : 0;
    
    if (planningOverview) {
      return {
        total: planningOverview.stats.total_instances + planningOverview.stats.total_events + coursesCount,
        events: planningOverview.stats.total_events,
        sessions: planningOverview.stats.total_instances,
        courses: coursesCount,
        participants: planningOverview.stats.total_participants,
        presentiel: planningOverview.stats.instances_by_type?.presentiel || 0,
        distanciel: planningOverview.stats.instances_by_type?.distanciel || 0,
        hybride: planningOverview.stats.instances_by_type?.hybride || 0,
        elearning: planningOverview.stats.instances_by_type?.['e-learning'] || 0
      };
    }
    
    return {
      total: items.length,
      events: items.filter(i => i.type === 'event').length,
      sessions: items.filter(i => i.type === 'session_instance').length,
      courses: items.filter(i => i.type === 'course').length,
      participants: items.reduce((sum, item) => sum + (item.participants_count || 0), 0),
      presentiel: items.filter(i => i.instance_type === 'presentiel').length,
      distanciel: items.filter(i => i.instance_type === 'distanciel').length,
      hybride: items.filter(i => i.instance_type === 'hybride').length,
      elearning: items.filter(i => i.instance_type === 'e-learning').length
    };
  };

  // Utility functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getItemColor = (item: CalendarItem) => {
    if (item.color) return item.color;
    if (item.type === 'course') {
      return '#10b981'; // Green for courses
    }
    if (item.type === 'event') {
      return getEventTypeColor('training'); // Default event color
    }
    if (item.instance_type) {
      return getInstanceTypeColor(item.instance_type);
    }
    return primaryColor;
  };

  // Get icon for instance type
  const getInstanceTypeIcon = (type?: string) => {
    switch (type) {
      case 'presentiel':
        return MapPin;
      case 'distanciel':
        return Video;
      case 'hybride':
        return Monitor;
      case 'e-learning':
        return Laptop;
      default:
        return BookOpen;
    }
  };

  // Check if item spans multiple days
  const isMultiDayEvent = (item: CalendarItem): boolean => {
    const start = new Date(item.start);
    const end = new Date(item.end);
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return startDate.getTime() !== endDate.getTime();
  };

  // Get the span of days for a multi-day event
  const getEventSpan = (item: CalendarItem, currentDate: Date): { start: number; end: number } | null => {
    if (!isMultiDayEvent(item)) return null;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const itemStart = new Date(item.start);
    const itemEnd = new Date(item.end);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const eventStartDate = new Date(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());
    const eventEndDate = new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate());
    
    // Check if event overlaps with current month
    if (eventEndDate < monthStart || eventStartDate > monthEnd) return null;
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const startDay = eventStartDate >= monthStart 
      ? eventStartDate.getDate() + startingDayOfWeek
      : startingDayOfWeek;
    const endDay = eventEndDate <= monthEnd
      ? eventEndDate.getDate() + startingDayOfWeek
      : startingDayOfWeek + new Date(year, month + 1, 0).getDate();
    
    return { start: startDay, end: endDay };
  };

  // Check if item starts on this day
  const isEventStartDay = (item: CalendarItem, date: Date): boolean => {
    const itemStart = new Date(item.start);
    return itemStart.getDate() === date.getDate() &&
           itemStart.getMonth() === date.getMonth() &&
           itemStart.getFullYear() === date.getFullYear();
  };

  const stats = getStats();
  const calendarDays = getCalendarDays();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  // Check if there's any data to display
  const coursesInCalendar = convertCoursesToCalendarItems();
  const hasCalendarItems = (calendarData && (calendarData.events.length > 0 || calendarData.sessions.length > 0)) || coursesInCalendar.length > 0;
  const hasCourses = planningOverview && planningOverview.courses && planningOverview.courses.length > 0;
  const totalCourses = planningOverview?.courses?.length || 0;

  return (
    <div className="flex flex-col min-h-0 px-[27px] py-8 gap-6">
      {/* Titre du mois et contrôles - selon Figma */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-3xl ${
          isDark ? 'text-white' : 'text-[#19294a]'
        }`}>
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h1>

        <div className="flex items-center gap-4">
          {/* Bouton Créer Une Nouvelle Session */}
          <Button
            className="h-[42px] px-6 rounded-[12px] text-white flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
            onClick={() => navigateToRoute('/session-creation')}
          >
            <Plus className="w-5 h-5" />
            Créer Une Nouvelle Session
          </Button>
          
          {/* Onglets Sessions/Événements/Tout */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-[12px] p-1">
            {[
              { value: 'sessions' as const, label: 'Sessions' },
              { value: 'events' as const, label: 'Événements' },
              { value: 'all' as const, label: 'Tout' }
            ].map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                onClick={() => setViewType(tab.value)}
                className={`h-8 px-4 rounded-[10px] ${
                  viewType === tab.value
                    ? 'bg-white dark:bg-gray-700 text-[#007aff] font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Vues Month/Week */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-[12px] p-1">
            {[
              { value: 'month' as const, label: 'Month' },
              { value: 'week' as const, label: 'week' }
            ].map((view) => (
              <Button
                key={view.value}
                variant="ghost"
                onClick={() => setViewMode(view.value)}
                className={`h-8 px-4 rounded-[10px] ${
                  viewMode === view.value
                    ? 'bg-white dark:bg-gray-700 text-[#007aff] font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {view.label}
              </Button>
            ))}
          </div>

          {/* Navigation mois */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className={`h-10 w-10 rounded-[12px] ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-[#e2e2ea] hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className={`h-10 w-10 rounded-[12px] ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-[#e2e2ea] hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtre */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Recherche Une Formation"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className={`pl-10 h-[42px] rounded-[12px] ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
            }`}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-[42px] px-4 rounded-[12px] flex items-center gap-2 ${
            isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-[#e2e2ea] hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtre
          <ChevronRight className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
        </Button>
      </div>

      {/* Modal de filtres conforme au Figma */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-[18px] max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 space-y-6">
              {/* Formation */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Formation
                  </label>
                  <select
                    value={filters.formation}
                    onChange={(e) => setFilters({ ...filters, formation: e.target.value })}
                    className={`w-full px-3 py-2 rounded-[12px] border-2 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#e2e2ea] text-gray-900'
                    }`}
                  >
                    <option value="">Sélectionner</option>
                    {/* Options de formations à charger depuis l'API */}
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, formation: '' })}
                  className="ml-2"
                >
                  Reset
                </Button>
              </div>

              {/* Formateur */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Formateur
                  </label>
                  <select
                    value={filters.formateur}
                    onChange={(e) => setFilters({ ...filters, formateur: e.target.value })}
                    className={`w-full px-3 py-2 rounded-[12px] border-2 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#e2e2ea] text-gray-900'
                    }`}
                  >
                    <option value="">Sélectionner</option>
                    {/* Options de formateurs à charger depuis l'API */}
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, formateur: '' })}
                  className="ml-2"
                >
                  Reset
                </Button>
              </div>

              {/* Status avec radio buttons */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </label>
                  <select
                    value={filters.status === 'all' ? 'ALL' : filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value === 'ALL' ? 'all' : e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-[12px] border-2 mb-3 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#e2e2ea] text-gray-900'
                    }`}
                  >
                    <option value="ALL">ALL</option>
                  </select>
                  <div className="flex gap-3">
                    {[
                      { value: 'scheduled', label: 'à venir', color: '#3b82f6', bgColor: '#dbeafe' },
                      { value: 'ongoing', label: 'en cours', color: '#f97316', bgColor: '#fed7aa' },
                      { value: 'completed', label: 'terminée', color: '#10b981', bgColor: '#d1fae5' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setFilters({ ...filters, status: status.value as any })}
                        className={`flex-1 px-4 py-3 rounded-[12px] font-medium text-sm ${
                          filters.status === status.value
                            ? 'ring-2 ring-offset-2'
                            : ''
                        }`}
                        style={{
                          backgroundColor: filters.status === status.value ? status.bgColor : (isDark ? '#374151' : '#f3f4f6'),
                          color: status.color,
                          ringColor: status.color
                        }}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                  className="ml-2"
                >
                  Reset
                </Button>
              </div>

              {/* Date Range */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date Range
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        placeholder="09-10-2025"
                        className={`w-full rounded-[12px] border-2 pr-10 ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#e2e2ea] text-gray-900'
                        }`}
                      />
                      <CalendarIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 relative">
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        placeholder="09-11-2025"
                        className={`w-full rounded-[12px] border-2 pr-10 ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#e2e2ea] text-gray-900'
                        }`}
                      />
                      <CalendarIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })}
                  className="ml-2"
                >
                  Reset
                </Button>
              </div>

              {/* Type De Formation */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type De Formation
                  </label>
                  <select
                    value={filters.instance_type === 'all' ? '' : filters.instance_type}
                    onChange={(e) => setFilters({ ...filters, instance_type: e.target.value === '' ? 'all' : e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-[12px] border-2 mb-3 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#e2e2ea] text-gray-900'
                    }`}
                  >
                    <option value="">Sélectionner</option>
                  </select>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'distanciel', label: 'Distanciel', color: '#a855f7', dotColor: '#a855f7' },
                      { value: 'presentiel', label: 'Présentiel', color: '#10b981', dotColor: '#10b981' },
                      { value: 'e-learning', label: 'E-Learning', color: '#ec4899', dotColor: '#ec4899' },
                      { value: 'hybride', label: 'Hybride', color: '#f97316', dotColor: '#f97316' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFilters({ ...filters, instance_type: type.value as any })}
                        className={`px-4 py-2 rounded-[12px] font-medium text-sm flex items-center gap-2 ${
                          filters.instance_type === type.value
                            ? 'ring-2 ring-offset-2'
                            : ''
                        }`}
                        style={{
                          backgroundColor: filters.instance_type === type.value 
                            ? (isDark ? '#374151' : '#f3f4f6')
                            : (isDark ? '#1f2937' : '#ffffff'),
                          color: type.color,
                          borderColor: type.color,
                          borderWidth: filters.instance_type === type.value ? '2px' : '1px',
                          ringColor: type.color
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.dotColor }}
                        />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, instance_type: 'all' })}
                  className="ml-2"
                >
                  Reset
                </Button>
              </div>

              {/* Bouton Appliquer les filtres */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  className="px-6 rounded-[12px] text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => {
                    setShowFilters(false);
                    fetchData();
                  }}
                >
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Calendar Grid */}
       <div className={`flex-1 rounded-[18px] border-2 overflow-hidden ${
         isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'
       }`}>
         {!hasCalendarItems ? (
           /* Empty State */
           <div className="flex flex-col items-center justify-center h-full p-8">
             <CalendarIcon className={`w-20 h-20 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
             <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-xl mb-2 ${
               isDark ? 'text-gray-300' : 'text-gray-700'
             }`}>
               Aucun événement programmé
             </h3>
             <p className={`[font-family:'Inter',Helvetica] text-sm text-center max-w-md mb-4 ${
               isDark ? 'text-gray-400' : 'text-gray-500'
             }`}>
               Il n'y a actuellement aucune session, cours en direct ou événement programmé pour ce mois.
             </p>
             {hasCourses && (
               <div className={`mt-4 p-4 rounded-[10px] max-w-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                 <p className={`[font-family:'Inter',Helvetica] text-sm text-center ${
                   isDark ? 'text-gray-300' : 'text-blue-700'
                 }`}>
                   💡 Vous avez <strong>{totalCourses} cours</strong> disponibles. 
                   Pour qu'ils apparaissent dans le calendrier, vous devez créer des <strong>sessions</strong> ou des <strong>cours en direct</strong> avec des dates spécifiques.
                 </p>
               </div>
             )}
             <div className="flex gap-3 mt-6">
               <Button
                 className="rounded-[10px]"
                 style={{ backgroundColor: primaryColor }}
                 onClick={() => {
                   success('Info', 'Fonctionnalité de création en cours de développement');
                 }}
               >
                 <BookOpen className="w-5 h-5 mr-2" />
                 Créer une session
               </Button>
               <Button
                 variant="outline"
                 className={`rounded-[10px] ${
                   isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'
                 }`}
                 onClick={() => {
                   success('Info', 'Fonctionnalité de création en cours de développement');
                 }}
               >
                 <Video className="w-5 h-5 mr-2" />
                 Créer un cours en direct
               </Button>
             </div>
           </div>
         ) : (
           <>
             {/* Week days header */}
             <div className={`grid grid-cols-7 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
               {weekDays.map((day) => (
                 <div
                   key={day}
                   className={`p-4 text-center [font-family:'Inter',Helvetica] font-semibold text-sm ${
                     isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                   }`}
                 >
                   {day}
                 </div>
               ))}
             </div>

             {/* Calendar days */}
             <div className="grid grid-cols-7 auto-rows-fr" style={{ height: 'calc(100% - 60px)' }}>
          {calendarDays.map((day, index) => {
            if (!day.date) {
              return (
                <div
                  key={index}
                  className={`border-r border-b ${isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}
                  style={{ minHeight: '120px' }}
                />
              );
            }

            // Separate single-day and multi-day events
            const singleDayItems: CalendarItem[] = [];
            const multiDayItems: CalendarItem[] = [];

            day.items.forEach(item => {
              if (isMultiDayEvent(item)) {
                multiDayItems.push(item);
              } else {
                singleDayItems.push(item);
              }
            });

            // Filter multi-day items that span this day
            const spanningMultiDayItems = multiDayItems.filter(item => {
              const itemStart = new Date(item.start);
              const itemEnd = new Date(item.end);
              const itemStartDate = new Date(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());
              const itemEndDate = new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate());
              const currentDateOnly = new Date(day.date!.getFullYear(), day.date!.getMonth(), day.date!.getDate());
              return currentDateOnly >= itemStartDate && currentDateOnly <= itemEndDate;
            });

            const maxVisibleItems = 3;
            const visibleSingleDayItems = singleDayItems.slice(0, maxVisibleItems);
            const remainingCount = singleDayItems.length - maxVisibleItems;

            return (
              <div
                key={index}
                className={`border-r border-b p-2 relative overflow-hidden ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                } ${
                  isToday(day.date) ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''
                }`}
                style={{ minHeight: '120px' }}
              >
                {/* Day number */}
                <div className={`text-base font-bold mb-2 ${
                  isToday(day.date)
                    ? 'text-white bg-[#007aff] rounded-full w-8 h-8 flex items-center justify-center'
                    : isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {day.date.getDate()}
                </div>

                {/* Multi-day event spans - positioned absolutely */}
                {spanningMultiDayItems.map((item, multiIndex) => {
                  const itemStart = new Date(item.start);
                  const itemEnd = new Date(item.end);
                  const itemStartDate = new Date(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());
                  const itemEndDate = new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate());
                  const currentDateOnly = new Date(day.date!.getFullYear(), day.date!.getMonth(), day.date!.getDate());
                  const isStart = currentDateOnly.getTime() === itemStartDate.getTime();
                  const isEnd = currentDateOnly.getTime() === itemEndDate.getTime();
                  const isMiddle = !isStart && !isEnd;
                  const itemColor = getItemColor(item);
                  const Icon = item.instance_type ? getInstanceTypeIcon(item.instance_type) : BookOpen;

                  return (
                    <div
                      key={`multi-${item.id}-${index}`}
                      className="absolute left-0 right-0 h-6 flex items-center z-10"
                      style={{ 
                        top: `${40 + (multiIndex * 28)}px`,
                        backgroundColor: itemColor + '15',
                        borderLeft: isStart ? `3px solid ${itemColor}` : 'none',
                        borderRight: isEnd ? `3px solid ${itemColor}` : 'none',
                        borderTop: isMiddle ? `1px solid ${itemColor}40` : 'none',
                        borderBottom: isMiddle ? `1px solid ${itemColor}40` : 'none',
                      }}
                      onClick={() => setSelectedItem(item)}
                    >
                      {isStart && (
                        <div className="flex items-center gap-1 px-2 truncate w-full">
                          <Icon className="w-3 h-3 flex-shrink-0" style={{ color: itemColor }} />
                          <span 
                            className="text-xs font-medium truncate"
                            style={{ color: itemColor }}
                          >
                            {item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Single day events - positioned relative to avoid overlap with multi-day */}
                <div 
                  className="space-y-1.5 mt-1 relative z-20"
                  style={{ marginTop: spanningMultiDayItems.length > 0 ? `${spanningMultiDayItems.length * 28 + 4}px` : '4px' }}
                >
                  {visibleSingleDayItems.map((item) => {
                    const itemColor = getItemColor(item);
                    const Icon = item.instance_type ? getInstanceTypeIcon(item.instance_type) : BookOpen;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left p-2 rounded-lg transition-all hover:shadow-md ${
                          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: itemColor + '15',
                          borderLeft: `3px solid ${itemColor}`
                        }}
                      >
                        {/* Badge with icon and label */}
                        <div className="flex items-center gap-1 mb-1">
                          <Badge
                            className="h-5 px-2 py-0 flex items-center gap-1 rounded-md"
                            style={{
                              backgroundColor: itemColor + '20',
                              color: itemColor,
                              border: `1px solid ${itemColor}40`
                            }}
                          >
                            <Icon className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">
                              {item.instance_type 
                                ? getInstanceTypeLabel(item.instance_type)
                                : item.type === 'event' ? 'Événement' : 'Cours'}
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Title (truncated) */}
                        <div 
                          className={`text-xs font-semibold truncate mb-0.5 ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                          }`}
                          style={{ color: itemColor }}
                        >
                          {item.title}
                        </div>
                        
                        {/* Time */}
                        <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTime(item.start)}
                        </div>
                      </button>
                    );
                  })}

                  {/* Overflow indicator */}
                  {remainingCount > 0 && (
                    <button
                      onClick={() => {
                        // Show first remaining item
                        setSelectedItem(singleDayItems[maxVisibleItems]);
                      }}
                      className={`w-full text-center py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:bg-gray-700/50' 
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      +{remainingCount} Plus
                    </button>
                  )}
                </div>
              </div>
            );
          })}
             </div>
           </>
         )}
       </div>

       {/* Modal - Item Details */}
       {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-[18px] max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="sticky top-0 z-10 p-6 border-b" style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                     <Badge
                       className="h-auto py-1 px-3"
                       style={{
                         backgroundColor: getItemColor(selectedItem) + '20',
                         color: getItemColor(selectedItem)
                       }}
                     >
                       {selectedItem.type === 'event' ? 'Événement' : 
                        selectedItem.type === 'course' ? 'Cours' : 'Session'}
                     </Badge>
                    {selectedItem.instance_type && (
                      <Badge
                        className="h-auto py-1 px-3"
                        style={{
                          backgroundColor: getInstanceTypeColor(selectedItem.instance_type) + '20',
                          color: getInstanceTypeColor(selectedItem.instance_type)
                        }}
                      >
                        {selectedItem.instance_type === 'presentiel' && <MapPin className="w-3 h-3 mr-1" />}
                        {selectedItem.instance_type === 'distanciel' && <Video className="w-3 h-3 mr-1" />}
                        {selectedItem.instance_type === 'hybride' && <Monitor className="w-3 h-3 mr-1" />}
                        {selectedItem.instance_type === 'e-learning' && <Laptop className="w-3 h-3 mr-1" />}
                        {getInstanceTypeLabel(selectedItem.instance_type)}
                      </Badge>
                    )}
                    {selectedItem.status && (
                      <Badge className={`h-auto py-1 px-3 ${
                        selectedItem.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        selectedItem.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                        selectedItem.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getStatusLabel(selectedItem.status)}
                      </Badge>
                    )}
                  </div>
                  <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-2xl ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    {selectedItem.title}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

             {/* Modal Content */}
             <div className="p-6 space-y-6">
               {/* Date & Time */}
               <div className="flex items-center gap-4">
                 <div className={`flex items-center gap-2 px-4 py-2 rounded-[10px] ${
                   isDark ? 'bg-gray-700' : 'bg-gray-100'
                 }`}>
                   <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                   <span className={`[font-family:'Inter',Helvetica] font-medium text-sm ${
                     isDark ? 'text-white' : 'text-gray-700'
                   }`}>
                     {selectedItem.type === 'course' ? 'Créé le ' : ''}
                     {new Date(selectedItem.start).toLocaleDateString('fr-FR', {
                       weekday: 'long',
                       day: 'numeric',
                       month: 'long',
                       year: 'numeric'
                     })}
                   </span>
                 </div>
                 {selectedItem.type !== 'course' && (
                   <div className={`flex items-center gap-2 px-4 py-2 rounded-[10px] ${
                     isDark ? 'bg-gray-700' : 'bg-gray-100'
                   }`}>
                     <span className={`[font-family:'Inter',Helvetica] font-medium text-sm ${
                       isDark ? 'text-white' : 'text-gray-700'
                     }`}>
                       {formatTime(selectedItem.start)} - {formatTime(selectedItem.end)}
                     </span>
                   </div>
                 )}
               </div>

              {/* Location */}
              {selectedItem.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5" style={{ color: secondaryColor }} />
                  <div>
                    <div className={`[font-family:'Inter',Helvetica] font-semibold text-sm mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Lieu
                    </div>
                    <div className={`[font-family:'Inter',Helvetica] font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedItem.location}
                    </div>
                  </div>
                </div>
              )}

              {/* Course Info */}
              {selectedItem.course && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <div className={`[font-family:'Inter',Helvetica] font-semibold text-sm mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Cours associé
                    </div>
                    <div className={`[font-family:'Inter',Helvetica] font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedItem.course.title}
                    </div>
                  </div>
                </div>
              )}

              {/* Trainers */}
              {selectedItem.trainers && selectedItem.trainers.length > 0 && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 mt-0.5" style={{ color: secondaryColor }} />
                  <div className="flex-1">
                    <div className={`[font-family:'Inter',Helvetica] font-semibold text-sm mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {selectedItem.trainers.length > 1 ? 'Formateurs' : 'Formateur'}
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedItem.trainers.map((trainer) => (
                        <div key={trainer.id} className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 rounded-[10px]">
                            <AvatarFallback
                              className="rounded-[10px] text-white font-semibold"
                              style={{ backgroundColor: trainer.is_primary ? primaryColor : secondaryColor }}
                            >
                              {getInitials(trainer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className={`[font-family:'Inter',Helvetica] font-semibold flex items-center gap-2 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {trainer.name}
                              {trainer.is_primary && (
                                <Badge className="h-auto py-0.5 px-2 text-xs" style={{ backgroundColor: primaryColor }}>
                                  Principal
                                </Badge>
                              )}
                            </div>
                            {trainer.email && (
                              <div className={`[font-family:'Inter',Helvetica] text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {trainer.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedItem.participants_count !== undefined && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <div className={`[font-family:'Inter',Helvetica] font-semibold text-sm mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Participants
                    </div>
                    <div className={`[font-family:'Inter',Helvetica] font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedItem.participants_count} inscrits
                      {selectedItem.max_participants && ` / ${selectedItem.max_participants} places`}
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              {selectedItem.meeting_link && (
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <div className={`[font-family:'Inter',Helvetica] font-semibold text-sm mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Lien de réunion
                    </div>
                    <a
                      href={selectedItem.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`[font-family:'Inter',Helvetica] font-medium underline ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      Rejoindre la réunion
                    </a>
                    {selectedItem.platform_type && (
                      <div className={`[font-family:'Inter',Helvetica] text-xs mt-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Plateforme: {selectedItem.platform_type}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex justify-end gap-3 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setSelectedItem(null)}
                className="rounded-[10px]"
              >
                Fermer
              </Button>
              <Button
                className="rounded-[10px]"
                style={{ backgroundColor: primaryColor }}
              >
                Voir les détails
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

