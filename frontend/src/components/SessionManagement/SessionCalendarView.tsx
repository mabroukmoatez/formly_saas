/**
 * SessionCalendarView Component
 * Calendar view for sessions with month and week views
 */

import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  List
} from 'lucide-react';
import type { CalendarSession, SessionFilters } from './types';

interface SessionCalendarViewProps {
  sessions: CalendarSession[];
  currentDate: Date;
  viewMode: 'month' | 'week';
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: 'month' | 'week') => void;
  onSessionClick: (session: CalendarSession) => void;
  onDayClick?: (date: Date, sessions: CalendarSession[]) => void;
  onSwitchToList?: () => void;
  onCreateSession?: () => void;
}

// Color mapping for session modes
const MODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'présentiel': { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  'distanciel': { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  'e-learning': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'hybride': { bg: '#f3e8ff', border: '#a855f7', text: '#7c3aed' },
};

export const SessionCalendarView: React.FC<SessionCalendarViewProps> = ({
  sessions,
  currentDate,
  viewMode,
  filters,
  onFiltersChange,
  onDateChange,
  onViewModeChange,
  onSessionClick,
  onDayClick,
  onSwitchToList,
  onCreateSession
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [selectedDaySessions, setSelectedDaySessions] = useState<CalendarSession[]>([]);

  // French month names
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

  // Get calendar days for month view
  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  // Get week days for week view
  const getWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date): CalendarSession[] => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.filter(s => s.date === dateStr);
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    onDateChange(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    onDateChange(newDate);
  };

  const handleDayClick = (date: Date, daySessions: CalendarSession[]) => {
    if (daySessions.length > 4) {
      setSelectedDayDate(date);
      setSelectedDaySessions(daySessions);
      setShowDayModal(true);
    }
    onDayClick?.(date, daySessions);
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h} ${ampm}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getSessionColor = (mode: string) => {
    return MODE_COLORS[mode] || MODE_COLORS['présentiel'];
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Session
        </h1>
        <Button 
          className="h-10 gap-2 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
          onClick={onCreateSession}
        >
          + Créer Une Nouvelle Session
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Recherche Une Formation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 h-10 rounded-xl w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
          </div>
          
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-xl"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter className="w-4 h-4" />
            Filtre
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Month/Week Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <h2 className={`text-xl font-bold min-w-[200px] text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <div className="flex items-center gap-1 rounded-xl border p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('month')}
              className="rounded-lg"
              style={viewMode === 'month' ? { backgroundColor: primaryColor } : {}}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('week')}
              className="rounded-lg"
              style={viewMode === 'week' ? { backgroundColor: primaryColor } : {}}
            >
              week
            </Button>
          </div>

          <Button
            variant="outline"
            className="h-10 gap-2 rounded-xl"
            onClick={onSwitchToList}
          >
            <List className="w-4 h-4" />
            Vue Liste
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          {/* Day Headers */}
          <div className="grid grid-cols-7">
            {dayNames.map(day => (
              <div 
                key={day} 
                className={`py-3 text-center text-sm font-medium border-b ${
                  isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {getMonthDays.map(({ date, isCurrentMonth }, idx) => {
              const daySessions = getSessionsForDate(date);
              const displaySessions = daySessions.slice(0, 4);
              const moreCount = daySessions.length - 4;

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 border-b border-r cursor-pointer transition-colors ${
                    isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'
                  } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                  onClick={() => handleDayClick(date, daySessions)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday(date) 
                      ? 'w-6 h-6 rounded-full flex items-center justify-center text-white'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  style={isToday(date) ? { backgroundColor: primaryColor } : {}}
                  >
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {displaySessions.map(session => {
                      const colors = getSessionColor(session.mode);
                      return (
                        <div
                          key={session.uuid}
                          className="text-xs px-2 py-1 rounded truncate"
                          style={{ 
                            backgroundColor: colors.bg,
                            borderLeft: `3px solid ${colors.border}`,
                            color: colors.text
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClick(session);
                          }}
                        >
                          ⊙ {session.title}
                        </div>
                      );
                    })}
                    {moreCount > 0 && (
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        + {moreCount} Plus
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <div className="flex">
            {/* Time Column */}
            <div className="w-16 flex-shrink-0">
              <div className={`h-12 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-xs p-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  GMT<br />+1
                </div>
              </div>
              {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                <div 
                  key={hour} 
                  className={`h-16 border-b text-xs text-right pr-2 pt-1 ${
                    isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
                  }`}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {getWeekDays.map((date, idx) => {
              const daySessions = getSessionsForDate(date);
              
              return (
                <div key={idx} className="flex-1 border-l">
                  {/* Day Header */}
                  <div className={`h-12 border-b text-center py-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {dayNames[idx]}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday(date) ? '' : isDark ? 'text-white' : 'text-gray-900'
                    }`}
                    style={isToday(date) ? { color: '#ef4444' } : {}}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                  
                  {/* Time slots */}
                  <div className="relative">
                    {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                      <div 
                        key={hour} 
                        className={`h-16 border-b border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                      />
                    ))}
                    
                    {/* Sessions */}
                    {daySessions.map(session => {
                      const startHour = parseInt(session.startTime.split(':')[0]);
                      const endHour = parseInt(session.endTime.split(':')[0]);
                      const startMin = parseInt(session.startTime.split(':')[1]) || 0;
                      const duration = endHour - startHour + (startMin > 0 ? 0 : 0);
                      const top = (startHour - 7) * 64 + (startMin / 60) * 64;
                      const height = Math.max(duration * 64, 32);
                      const colors = getSessionColor(session.mode);

                      return (
                        <div
                          key={session.uuid}
                          className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: colors.bg,
                            borderLeft: `3px solid ${colors.border}`,
                          }}
                          onClick={() => onSessionClick(session)}
                        >
                          <div className="text-xs font-medium truncate" style={{ color: colors.text }}>
                            ⊙ {session.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* GMT column on right */}
            <div className="w-16 flex-shrink-0 border-l">
              <div className={`h-12 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-xs p-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  GMT<br />+1
                </div>
              </div>
              {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                <div 
                  key={hour} 
                  className={`h-16 border-b text-xs pl-2 pt-1 ${
                    isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
                  }`}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day Sessions Modal */}
      {showDayModal && selectedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDayModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <button
              onClick={() => setShowDayModal(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className={`text-xl font-bold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedDayDate.getDate()} {monthNames[selectedDayDate.getMonth()]} {selectedDayDate.getFullYear()}
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedDaySessions.map(session => {
                const colors = getSessionColor(session.mode);
                return (
                  <div
                    key={session.uuid}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
                    style={{ 
                      backgroundColor: colors.bg,
                      borderLeft: `4px solid ${colors.border}`
                    }}
                    onClick={() => {
                      setShowDayModal(false);
                      onSessionClick(session);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.text }}>⊙</span>
                      <span className="font-medium truncate" style={{ color: colors.text }}>
                        {session.title}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: colors.text }}>
                      {session.startTime} - {session.endTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionCalendarView;

