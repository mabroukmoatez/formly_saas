import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';
import { getPlanningOverview, getCalendarData as getPlanningCalendarData } from '../../services/planning';
import type { SessionInstance, OrganizationEvent, PlanningOverview } from '../../services/planning';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

type FilterType = 'all' | 'sessions' | 'events';
type ViewMode = 'month' | 'week';

interface CalendarItem {
  id: string | number;
  title: string;
  start: string;
  end: string;
  color: string;
  type: 'session' | 'event';
  location?: string;
  is_online?: boolean;
  description?: string;
  instructor?: { name: string };
  students_count?: number;
  instance_type?: string;
  dates?: Array<{ date: string; start_time: string; end_time: string }>;
}

// Session colors by type
const SESSION_COLORS: Record<string, string> = {
  'presentiel': '#ff9500',    // Orange
  'distanciel': '#007aff',    // Blue
  'e-learning': '#34c759',    // Green
  'hybride': '#af52de',       // Purple
  'default': '#5ac8fa',       // Light blue
};

const EVENT_COLOR = '#e5f3ff'; // Light blue for events
const EVENT_BORDER_COLOR = '#007aff';

export const Plannings = (): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const primaryColor = organization?.primary_color || '#007aff';

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [instances, setInstances] = useState<SessionInstance[]>([]);
  const [events, setEvents] = useState<OrganizationEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on view mode
      let startDate: Date;
      let endDate: Date;
      
      if (viewMode === 'week') {
        const dayOfWeek = currentDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() + diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        // For month view, include days from prev/next months visible on calendar
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        // Go back to Monday of the first week
        const firstDayOfWeek = startDate.getDay();
        const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToSubtract);
        
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        // Go forward to Sunday of the last week
        const lastDayOfWeek = endDate.getDay();
        const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
        endDate.setDate(endDate.getDate() + daysToAdd);
      }

      // Use the planning overview API which returns all needed data
      const planningData = await getPlanningOverview({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      if (planningData) {
        // Set sessions
        if (planningData.sessions) {
          setSessions(planningData.sessions);
        }
        
        // Set instances (these have specific dates/times)
        if (planningData.upcoming_instances) {
          setInstances(planningData.upcoming_instances);
        }
        
        // Set events
        if (planningData.events) {
          setEvents(planningData.events);
        }
      }

      // Also try calendar data for additional items
      try {
        const calendarData = await getPlanningCalendarData({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          show_events: true,
          show_sessions: true,
        });
        
        // Merge any additional instances from calendar
        if (calendarData?.sessions && calendarData.sessions.length > 0) {
          const existingIds = new Set(instances.map(i => i.uuid || i.id));
          const newInstances = calendarData.sessions
            .filter(s => !existingIds.has(s.id))
            .map(s => ({
              id: s.id,
              uuid: String(s.id),
              title: s.title,
              instance_type: (s.instance_type || 'presentiel') as 'presentiel' | 'distanciel' | 'hybride' | 'e-learning',
              start_date: s.start,
              end_date: s.end,
              start_time: '09:00',
              end_time: '17:00',
              duration_minutes: 480,
              max_participants: s.max_participants || 0,
              current_participants: s.current_participants || 0,
              status: (s.status || 'scheduled') as 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed',
              is_active: true,
              is_cancelled: false,
              trainers: s.trainers || [],
              participants_count: s.participants_count || 0,
              attendance_tracked: false,
              attendance_required: false,
            }));
          
          if (newInstances.length > 0) {
            setInstances(prev => [...prev, ...newInstances]);
          }
        }
      } catch (calendarError) {
        console.log('Calendar data not available, using planning overview only');
      }

    } catch (error) {
      console.error('Error fetching planning data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get session color based on type
  const getSessionColor = (session: any): string => {
    const instanceType = session.session_instances?.[0]?.instance_type || session.instance_type;
    return SESSION_COLORS[instanceType] || SESSION_COLORS.default;
  };

  // Combine and filter items
  const allItems = useMemo((): CalendarItem[] => {
    const items: CalendarItem[] = [];

    // Add session instances (these have actual scheduled dates/times)
    if (filterType === 'all' || filterType === 'sessions') {
      // First, add items from instances array (from API)
      instances.forEach((instance) => {
        const instanceType = instance.instance_type || 'presentiel';
        const color = SESSION_COLORS[instanceType] || SESSION_COLORS.default;
        const title = instance.session?.title || instance.title;
        
        items.push({
          id: instance.uuid || instance.id,
          title: title,
          start: instance.start_date,
          end: instance.end_date || instance.start_date,
          color: color,
          type: 'session',
          instance_type: instanceType,
          instructor: instance.trainers?.[0] ? { name: instance.trainers[0].name } : undefined,
          students_count: instance.participants_count,
          location: instance.location_address,
          is_online: instance.location_type === 'online',
          description: instance.session?.description,
        });
      });
      
      // Also process sessions that may have embedded instances
      sessions.forEach(session => {
        const sessionInstances = session.session_instances || [];
        
        if (sessionInstances.length > 0) {
          // Create calendar items for each embedded instance
          sessionInstances.forEach((instance: any, idx: number) => {
            // Check if already added from instances array
            const existingItem = items.find(i => 
              i.id === instance.uuid || 
              i.id === `${session.uuid}-${idx}`
            );
            if (existingItem) return;
            
            const instanceType = instance.instance_type || 'default';
            const color = SESSION_COLORS[instanceType] || SESSION_COLORS.default;
            
            items.push({
              id: `${session.uuid}-${idx}`,
              title: session.title,
              start: instance.start_date || session.session_start_date || session.created_at,
              end: instance.start_date || session.session_end_date || session.session_start_date || session.created_at,
              color: color,
              type: 'session',
              instance_type: instanceType,
              instructor: session.trainers?.[0] ? { name: session.trainers[0].name } : undefined,
              students_count: session.participants_count,
            });
          });
        } else if (session.session_start_date) {
          // Fallback: use session dates if no instances
          const existingItem = items.find(i => i.id === session.uuid || i.id === session.id);
          if (!existingItem) {
            items.push({
              id: session.uuid || session.id,
              title: session.title,
              start: session.session_start_date,
              end: session.session_end_date || session.session_start_date,
              color: getSessionColor(session),
              type: 'session',
              instance_type: session.instance_type || 'default',
              instructor: session.trainers?.[0] ? { name: session.trainers[0].name } : undefined,
              students_count: session.participants_count,
            });
          }
        }
      });
    }

    // Add events
    if (filterType === 'all' || filterType === 'events') {
      events.forEach(event => {
        items.push({
          id: event.id,
          title: event.title,
          start: event.start_date,
          end: event.end_date || event.start_date,
          color: EVENT_BORDER_COLOR,
          type: 'event',
          location: event.location,
          is_online: !!event.meeting_link,
          description: event.description,
        });
      });
    }

    // Filter by search term
    if (searchTerm) {
      return items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  }, [sessions, instances, events, filterType, searchTerm]);

  // Calendar navigation
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  // Get days for month view
  const getDaysInMonth = (): { date: Date; isCurrentMonth: boolean }[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Get the first day of the week (Monday = 1)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Add days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  // Get days for week view
  const getWeekDays = (): Date[] => {
    const days: Date[] = [];
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get items for a specific date
  const getItemsForDate = (date: Date): CalendarItem[] => {
    return allItems.filter(item => {
      const itemStart = new Date(item.start);
      const itemEnd = new Date(item.end);
      itemStart.setHours(0, 0, 0, 0);
      itemEnd.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= itemStart && checkDate <= itemEnd;
    });
  };

  // Format date for display
  const formatMonthYear = (date: Date): string => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Format date with day
  const formatDateWithDay = (date: Date): string => {
    return `${date.getDate()} ${formatMonthYear(date)}`;
  };

  // Get hours for week view
  const getHours = (): string[] => {
    const hours: string[] = [];
    for (let i = 7; i <= 21; i++) {
      hours.push(`${i} ${i < 12 ? 'AM' : 'PM'}`);
    }
    return hours;
  };

  // Handle event click
  const handleEventClick = (item: CalendarItem) => {
    setSelectedEvent(item);
    setShowEventModal(true);
  };

  // Get instance type label
  const getInstanceTypeLabel = (type?: string): string => {
    const labels: Record<string, string> = {
      'presentiel': 'Présentiel',
      'distanciel': 'Distanciel',
      'e-learning': 'E-Learning',
      'hybride': 'Hybride',
    };
    return labels[type || ''] || type || '';
  };

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`} style={{ width: '280px' }}>
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Recherche Une Formation"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm" style={{ color: primaryColor }}>Filtre</span>
          </Button>
        </div>

      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Month/Year Title */}
        <h1 
          className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}
          style={{ fontFamily: 'Poppins, Helvetica', color: primaryColor }}
        >
          {viewMode === 'week' ? formatDateWithDay(currentDate) : formatMonthYear(currentDate)}
        </h1>

        {/* Tabs and Navigation */}
        <div className="flex items-center gap-4">
          {/* Filter Tabs */}
          <div className={`flex items-center rounded-[10px] border overflow-hidden ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterType('sessions')}
              className={`px-4 py-2 rounded-none h-10 text-sm ${
                filterType === 'sessions' 
                  ? 'bg-white text-[#19294a] font-medium' 
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              style={filterType === 'sessions' ? { backgroundColor: '#e5f3ff', color: primaryColor } : {}}
            >
              Sessions
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterType('events')}
              className={`px-4 py-2 rounded-none h-10 text-sm ${
                filterType === 'events' 
                  ? 'bg-white text-[#19294a] font-medium' 
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              style={filterType === 'events' ? { backgroundColor: '#e5f3ff', color: primaryColor } : {}}
            >
              Evenements
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-none h-10 text-sm ${
                filterType === 'all' 
                  ? 'font-medium' 
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              style={filterType === 'all' ? { backgroundColor: '#e5f3ff', color: primaryColor } : {}}
            >
              Tout
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className={`flex items-center rounded-[10px] border overflow-hidden ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-none h-10 text-sm ${
                viewMode === 'month' ? 'font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              style={viewMode === 'month' ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-none h-10 text-sm ${
                viewMode === 'week' ? 'font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              style={viewMode === 'week' ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              week
            </Button>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('prev')}
              className={`h-10 w-10 p-0 rounded-full ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('next')}
              className={`h-10 w-10 p-0 rounded-full ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </div>

      {/* Month View Calendar */}
      {viewMode === 'month' && (
        <Card className={`border-2 rounded-[18px] overflow-hidden ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardContent className="p-0">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-[#e2e2ea]">
              {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((day, index) => (
                <div 
                  key={day} 
                  className={`text-center py-4 text-sm font-semibold ${
                    index >= 5 ? 'text-[#007aff]' : isDark ? 'text-gray-300' : 'text-[#19294a]'
                  } [font-family:'Poppins',Helvetica] border-r border-[#e2e2ea] last:border-r-0`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((dayInfo, index) => {
                const dayItems = getItemsForDate(dayInfo.date);
                const maxVisible = 5;
                const visibleItems = dayItems.slice(0, maxVisible);
                const remainingCount = dayItems.length - maxVisible;
                const isToday = dayInfo.date.toDateString() === new Date().toDateString();
                const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b border-[#e2e2ea] last:border-r-0 p-2 ${
                      !dayInfo.isCurrentMonth ? 'bg-gray-50 opacity-50' : isWeekend ? 'bg-[#f8fafc]' : 'bg-white'
                    } ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''} ${isDark ? 'bg-gray-800' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      !dayInfo.isCurrentMonth ? 'text-gray-400' : 
                      isWeekend ? 'text-[#007aff]' : isDark ? 'text-gray-300' : 'text-[#19294a]'
                    } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                      {dayInfo.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {visibleItems.map((item) => (
                        <div
                          key={item.id}
                          className={`text-xs px-2 py-1.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity truncate flex items-center gap-1 ${
                            item.type === 'event' 
                              ? 'bg-[#e5f3ff] text-[#007aff] border border-[#007aff]' 
                              : 'text-white font-medium'
                          }`}
                          style={item.type === 'session' ? { backgroundColor: item.color } : {}}
                          onClick={() => handleEventClick(item)}
                          title={item.title}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: item.type === 'event' ? '#007aff' : 'white' }} 
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div className="text-xs text-[#6a90b9] px-2 py-1 cursor-pointer hover:text-[#007aff] font-medium">
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

      {/* Week View Calendar */}
      {viewMode === 'week' && (
        <Card className={`border-2 rounded-[18px] overflow-hidden ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardContent className="p-0">
            {/* Days Header */}
            <div className="grid grid-cols-8 border-b border-[#e2e2ea]">
              <div className="text-center py-4 text-sm font-semibold text-gray-500 border-r border-[#e2e2ea]">
                GMT<br/>+1
              </div>
              {getWeekDays().map((day, index) => {
                const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
                const isToday = day.toDateString() === new Date().toDateString();
                const isWeekend = index >= 5;
                return (
                  <div 
                    key={index} 
                    className={`text-center py-4 border-r border-[#e2e2ea] last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-semibold ${isWeekend ? 'text-[#007aff]' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
                      {dayNames[index]}
                    </div>
                    <div className={`text-lg font-bold ${isWeekend ? 'text-[#007aff]' : 'text-[#19294a]'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid with positioned sessions */}
            <div className="relative" style={{ height: `${15 * 60}px` }}>
              {/* Hour grid lines */}
              {getHours().map((hour, hourIndex) => (
                <div 
                  key={hour} 
                  className="absolute left-0 right-0 border-b border-[#e2e2ea]" 
                  style={{ top: `${hourIndex * 60}px`, height: '60px' }}
                >
                  <div className="grid grid-cols-8 h-full">
                    <div className={`text-xs text-gray-500 border-r border-[#e2e2ea] flex items-start justify-center pt-1 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      {hour}
                    </div>
                    {getWeekDays().map((_, dayIndex) => {
                      const isWeekend = dayIndex >= 5;
                      return (
                        <div 
                          key={dayIndex}
                          className={`border-r border-[#e2e2ea] last:border-r-0 ${
                            isWeekend ? 'bg-[#f8fafc]' : ''
                          } ${isDark ? 'bg-gray-800' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Sessions and Events overlay */}
              <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                <div /> {/* Empty first column for time labels */}
                {getWeekDays().map((day, dayIndex) => {
                  const dayItems = getItemsForDate(day);
                  const isWeekend = dayIndex >= 5;
                  
                  return (
                    <div key={dayIndex} className="relative pointer-events-auto">
                      {dayItems.map((item, itemIndex) => {
                        // Calculate position based on item index to spread across hours
                        // Each item gets a different starting hour
                        const startHour = 8 + (itemIndex % 6); // Start between 8AM and 1PM
                        const duration = 2 + (itemIndex % 4); // Duration 2-5 hours
                        const topOffset = (startHour - 7) * 60; // 7 AM is hour 0
                        const height = duration * 60;
                        // Offset for overlapping items
                        const leftOffset = Math.floor(itemIndex / 6) * 5;
                        
                        return (
                          <div
                            key={item.id}
                            className={`absolute rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden ${
                              item.type === 'event' ? 'border border-[#007aff]' : ''
                            }`}
                            style={{
                              backgroundColor: item.type === 'event' ? '#e5f3ff' : `${item.color}15`,
                              borderLeft: `4px solid ${item.color}`,
                              top: `${topOffset}px`,
                              height: `${height}px`,
                              left: `${4 + leftOffset}px`,
                              right: '4px',
                              zIndex: 10 + itemIndex,
                            }}
                            onClick={() => handleEventClick(item)}
                          >
                            <div className={`text-xs font-medium ${
                              item.type === 'event' ? 'text-[#007aff]' : ''
                            }`} style={{ color: item.type === 'session' ? item.color : undefined }}>
                              <span className="inline-block w-2 h-2 rounded-full mr-1 flex-shrink-0" 
                                style={{ backgroundColor: item.color }} 
                              />
                              <span className="line-clamp-2">{item.title}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side time labels */}
            <div className="absolute right-0 top-0 w-14 pointer-events-none" style={{ marginTop: '73px' }}>
              {getHours().map((hour) => (
                <div key={`right-${hour}`} className="text-xs text-gray-400 text-right pr-2" style={{ height: '60px', lineHeight: '14px' }}>
                  {hour.replace(' AM', ' AM').replace(' PM', ' PM')}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Detail Modal - Figma Style */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-lg rounded-[18px] p-6`}>
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <Badge className="bg-transparent text-[#6a90b9] text-sm font-normal px-0">
              {selectedEvent?.type === 'event' ? '📅 Événement' : '📚 Session'}
            </Badge>
          </div>
          
          {/* Title */}
          <DialogHeader className="mb-6">
            <DialogTitle 
              className="text-xl font-semibold text-center"
              style={{ color: primaryColor }}
            >
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            {/* Dates Grid */}
            {selectedEvent?.dates && selectedEvent.dates.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {selectedEvent.dates.map((d, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-xl border-2 text-center ${
                      isDark ? 'border-gray-600 bg-gray-700' : 'border-[#e2e2ea] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-sm text-[#6a90b9] mb-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <span className={`${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>À</span>
                      <span className="flex items-center gap-1">
                        <span className="text-[#6a90b9]">⏱</span>
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>{d.start_time}</span>
                      </span>
                      <span className={`${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>-</span>
                      <span className="flex items-center gap-1">
                        <span className="text-[#6a90b9]">⏱</span>
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>{d.end_time}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <div 
                  className={`p-3 rounded-xl border-2 text-center ${
                    isDark ? 'border-gray-600 bg-gray-700' : 'border-[#e2e2ea] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-sm text-[#6a90b9]">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {selectedEvent?.start && new Date(selectedEvent.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {selectedEvent?.end && selectedEvent.start !== selectedEvent.end && (
                        <> - {new Date(selectedEvent.end).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {selectedEvent?.description && (
              <div>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Description
                </h4>
                <div className={`p-4 rounded-xl border-2 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-[#e2e2ea] bg-white'}`}>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                    {selectedEvent.description}
                  </p>
                </div>
              </div>
            )}

            {/* Session Type Badge */}
            {selectedEvent?.type === 'session' && selectedEvent.instance_type && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>Type:</span>
                <Badge 
                  className="rounded-md font-medium"
                  style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
                >
                  {getInstanceTypeLabel(selectedEvent.instance_type)}
                </Badge>
              </div>
            )}

            {/* Location */}
            {selectedEvent?.location && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#6a90b9]">📍</span>
                <span className={isDark ? 'text-gray-300' : 'text-[#19294a]'}>{selectedEvent.location}</span>
              </div>
            )}

            {/* Online indicator */}
            {selectedEvent?.is_online && (
              <div className="flex items-center gap-2 text-sm" style={{ color: primaryColor }}>
                <span>🎥</span>
                <span>En ligne</span>
              </div>
            )}

            {/* Fermer Button */}
            <div className="flex justify-end pt-2">
              <Button 
                onClick={() => setShowEventModal(false)}
                variant="outline"
                className={`px-6 rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-[#e2e2ea] text-[#19294a]'}`}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
