import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
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
  Laptop
} from 'lucide-react';

interface Filters {
  search: string;
  type: 'all' | 'event' | 'session_instance' | 'course';
  instance_type: 'all' | 'presentiel' | 'distanciel' | 'e-learning';
  instructor: string;
  status: 'all' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
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

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [planningOverview, setPlanningOverview] = useState<PlanningOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    instance_type: 'all',
    instructor: '',
    status: 'all'
  });

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Fetch calendar data
  useEffect(() => {
    fetchData();
  }, [currentDate, filters.type, filters.instance_type, filters.status]);

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

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.session?.title.toLowerCase().includes(searchLower) ||
        item.trainers?.some(t => t.name.toLowerCase().includes(searchLower))
      );
    }

    if (filters.instructor) {
      items = items.filter(item =>
        item.trainers?.some(t => t.name.toLowerCase().includes(filters.instructor.toLowerCase()))
      );
    }

    return items;
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

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
        const itemDate = new Date(item.start);
        return itemDate.getDate() === day &&
          itemDate.getMonth() === month &&
          itemDate.getFullYear() === year;
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

  const stats = getStats();
  const calendarDays = getCalendarDays();
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-3xl ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            Planning
          </h1>
          <p className={`[font-family:'Poppins',Helvetica] text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-[#6a90b9]'
          }`}>
            Calendrier des cours, sessions et événements
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={goToToday}
            className={`h-10 px-4 rounded-[10px] ${
              isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'
            }`}
          >
            Aujourd'hui
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className={`h-10 w-10 rounded-[10px] ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className={`[font-family:'Poppins',Helvetica] font-semibold text-lg min-w-[180px] text-center ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className={`h-10 w-10 rounded-[10px] ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-[10px] ${
            isDark ? 'bg-gray-800' : 'bg-[#f8f9fa]'
          }`}>
            <CalendarIcon className="w-5 h-5" style={{ color: primaryColor }} />
            <span className={`[font-family:'Inter',Helvetica] font-semibold text-sm ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {stats.total} événements
            </span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-[10px] ${
            isDark ? 'bg-gray-800' : 'bg-[#f8f9fa]'
          }`}>
            <Users className="w-5 h-5" style={{ color: secondaryColor }} />
            <span className={`[font-family:'Inter',Helvetica] font-semibold text-sm ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {stats.participants} participants
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={`pl-10 rounded-[10px] ${
                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-4 rounded-[10px] ${
              isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtres
            {(filters.type !== 'all' || filters.instance_type !== 'all' || filters.status !== 'all' || filters.instructor) && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <span className="text-xs text-white">!</span>
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={`flex flex-col gap-4 p-4 rounded-[10px] ${
          isDark ? 'bg-gray-800' : 'bg-[#f8f9fa]'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Type:
              </span>
               <div className="flex gap-2">
                 {[
                   { value: 'all', label: 'Tous' },
                   { value: 'course', label: 'Cours' },
                   { value: 'event', label: 'Événements' },
                   { value: 'session_instance', label: 'Sessions' }
                 ].map((type) => (
                  <Button
                    key={type.value}
                    variant={filters.type === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ ...filters, type: type.value as any })}
                    className="h-8 rounded-[8px]"
                    style={filters.type === type.value ? { backgroundColor: primaryColor } : {}}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Format:
              </span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Tous', icon: null },
                  { value: 'presentiel', label: 'Présentiel', icon: MapPin },
                  { value: 'distanciel', label: 'Distanciel', icon: Video },
                  { value: 'e-learning', label: 'E-learning', icon: Laptop }
                ].map((format) => (
                  <Button
                    key={format.value}
                    variant={filters.instance_type === format.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ ...filters, instance_type: format.value as any })}
                    className="h-8 rounded-[8px] flex items-center gap-1"
                    style={filters.instance_type === format.value ? { backgroundColor: primaryColor } : {}}
                  >
                    {format.icon && <format.icon className="w-3 h-3" />}
                    {format.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Statut:
              </span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'scheduled', label: 'Programmée' },
                  { value: 'ongoing', label: 'En cours' },
                  { value: 'completed', label: 'Terminée' }
                ].map((status) => (
                  <Button
                    key={status.value}
                    variant={filters.status === status.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ ...filters, status: status.value as any })}
                    className="h-8 rounded-[8px]"
                    style={filters.status === status.value ? { backgroundColor: primaryColor } : {}}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ search: '', type: 'all', instance_type: 'all', instructor: '', status: 'all' })}
            className="self-end"
          >
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
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
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`border-r border-b p-2 overflow-y-auto ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              } ${!day.date ? 'bg-gray-50 dark:bg-gray-900' : ''} ${
                day.date && isToday(day.date) ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''
              }`}
            >
              {day.date && (
                <>
                  <div className={`text-sm font-semibold mb-2 ${
                    isToday(day.date)
                      ? 'text-white bg-[#007aff] rounded-full w-7 h-7 flex items-center justify-center'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.items.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all hover:shadow-md ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: getItemColor(item) + '20',
                          borderLeft: `3px solid ${getItemColor(item)}`
                        }}
                      >
                        <div className="font-semibold truncate" style={{ color: getItemColor(item) }}>
                          {formatTime(item.start)}
                        </div>
                        <div className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.title}
                        </div>
                        {item.is_online && (
                          <Video className="w-3 h-3 mt-1" style={{ color: getItemColor(item) }} />
                        )}
                      </button>
                    ))}
                    {day.items.length > 3 && (
                      <div className={`text-xs text-center py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        +{day.items.length - 3} autres
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
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

