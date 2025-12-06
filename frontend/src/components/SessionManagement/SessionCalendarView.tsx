/**
 * SessionCalendarView Component
 * Calendar view for sessions with month and week views
 * Matches Figma design with expanded filters and specific styling
 */

import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
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

// Color mapping for session modes (Pill style)
const MODE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'présentiel': { bg: '#dcfce7', border: '#22c55e', text: '#166534' }, // Green
  'distanciel': { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' }, // Blue
  'e-learning': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }, // Yellow/Orange
  'hybride': { bg: '#f3e8ff', border: '#a855f7', text: '#7c3aed' },    // Purple
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

  const formatHour = (hour: number) => {
    return `${hour}:00`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getSessionStyle = (mode: string) => {
    return MODE_STYLES[mode] || MODE_STYLES['présentiel'];
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-[#f5f5f5]'} min-h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Session
        </h1>
        <Button
          className="h-10 gap-2 rounded-xl text-white px-6"
          style={{ backgroundColor: primaryColor }}
          onClick={onCreateSession}
        >
          + Créer Une Nouvelle Session
        </Button>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Recherche Une Formation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 h-10 rounded-xl border-0 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
          />
        </div>

        {/* Formation Filter */}
        <div className="w-[200px]">
          <Select value={filters.formation} onValueChange={(val) => onFiltersChange({ ...filters, formation: val })}>
            <SelectTrigger className={`h-10 rounded-xl border-0 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <SelectValue placeholder="Formation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formateur Filter */}
        <div className="w-[200px]">
          <Select value={filters.formateur} onValueChange={(val) => onFiltersChange({ ...filters, formateur: val })}>
            <SelectTrigger className={`h-10 rounded-xl border-0 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <SelectValue placeholder="Formateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les formateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-[150px]">
          <Select value={filters.status} onValueChange={(val) => onFiltersChange({ ...filters, status: val as any })}>
            <SelectTrigger className={`h-10 rounded-xl border-0 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status</SelectItem>
              <SelectItem value="à venir">À venir</SelectItem>
              <SelectItem value="en cours">En cours</SelectItem>
              <SelectItem value="terminée">Terminée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="w-[150px]">
          <Select value={filters.type} onValueChange={(val) => onFiltersChange({ ...filters, type: val as any })}>
            <SelectTrigger className={`h-10 rounded-xl border-0 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <SelectValue placeholder="Type De Formation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type</SelectItem>
              <SelectItem value="présentiel">Présentiel</SelectItem>
              <SelectItem value="distanciel">Distanciel</SelectItem>
              <SelectItem value="e-learning">E-Learning</SelectItem>
              <SelectItem value="hybride">Hybride</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button
          variant="ghost"
          className="text-blue-500 hover:text-blue-600"
          onClick={() => onFiltersChange({ formation: '', formateur: '', status: 'all', type: 'all' })}
        >
          Reset
        </Button>
      </div>

      {/* Calendar Navigation & View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-2xl font-bold text-blue-500`}>
            {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={navigatePrevious} className="rounded-full w-8 h-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext} className="rounded-full w-8 h-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('month')}
              className={`rounded-lg px-4 ${viewMode === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('week')}
              className={`rounded-lg px-4 ${viewMode === 'week' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              week
            </Button>
          </div>

          <Button
            variant="outline"
            className="h-9 gap-2 rounded-xl bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
            onClick={onSwitchToList}
          >
            <List className="w-4 h-4" />
            Vue Liste
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {dayNames.map(day => (
              <div
                key={day}
                className={`py-4 text-center text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-[140px]">
            {getMonthDays.map(({ date, isCurrentMonth }, idx) => {
              const daySessions = getSessionsForDate(date);
              const displaySessions = daySessions.slice(0, 3);
              const moreCount = daySessions.length - 3;
              const isTodayDate = isToday(date);

              return (
                <div
                  key={idx}
                  className={`p-2 border-b border-r relative group transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'
                    } ${!isCurrentMonth ? 'opacity-40 bg-gray-50/50' : ''}`}
                  onClick={() => onDayClick?.(date, daySessions)}
                >
                  <div className={`text-sm font-medium mb-2 ml-1 ${isTodayDate
                      ? 'text-blue-500'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-1.5">
                    {displaySessions.map(session => {
                      const style = getSessionStyle(session.mode);
                      return (
                        <div
                          key={session.uuid}
                          className="text-[10px] px-2 py-1 rounded-md truncate cursor-pointer transition-transform hover:scale-[1.02]"
                          style={{
                            backgroundColor: style.bg,
                            border: `1px solid ${style.border}`,
                            color: style.text
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClick(session);
                          }}
                        >
                          <span className="mr-1">●</span>
                          {session.title}
                        </div>
                      );
                    })}
                    {moreCount > 0 && (
                      <div className="text-[10px] font-medium text-blue-500 px-2">
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
        <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex">
            {/* Time Column */}
            <div className="w-16 flex-shrink-0 border-r border-gray-100">
              <div className="h-14 border-b border-gray-100"></div>
              {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                <div
                  key={hour}
                  className={`h-20 border-b border-gray-100 text-xs text-right pr-3 pt-2 ${isDark ? 'text-gray-400' : 'text-gray-400'
                    }`}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 flex overflow-x-auto">
              {getWeekDays.map((date, idx) => {
                const daySessions = getSessionsForDate(date);
                const isTodayDate = isToday(date);

                return (
                  <div key={idx} className="flex-1 min-w-[120px] border-r border-gray-100 last:border-r-0">
                    {/* Day Header */}
                    <div className={`h-14 border-b border-gray-100 text-center py-2 ${isTodayDate ? 'bg-blue-50/50' : ''
                      }`}>
                      <div className={`text-xs font-medium mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {dayNames[idx]}
                      </div>
                      <div className={`text-lg font-bold ${isTodayDate ? 'text-blue-500' : isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div className="relative h-[1040px]">
                      {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                        <div
                          key={hour}
                          className="h-20 border-b border-gray-50"
                        />
                      ))}

                      {/* Sessions */}
                      {daySessions.map(session => {
                        const startHour = parseInt(session.startTime.split(':')[0]);
                        const endHour = parseInt(session.endTime.split(':')[0]);
                        const startMin = parseInt(session.startTime.split(':')[1]) || 0;

                        const startOffset = startHour - 8;
                        if (startOffset < 0) return null;

                        const top = (startOffset * 80) + (startMin / 60 * 80);
                        const duration = (endHour - startHour) + ((parseInt(session.endTime.split(':')[1]) || 0) - startMin) / 60;
                        const height = Math.max(duration * 80, 40);

                        const style = getSessionStyle(session.mode);

                        return (
                          <div
                            key={session.uuid}
                            className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: style.bg,
                              border: `1px solid ${style.border}`,
                              color: style.text
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSessionClick(session);
                            }}
                          >
                            <div className="text-xs font-semibold truncate">
                              {session.title}
                            </div>
                            <div className="text-[10px] opacity-80 truncate">
                              {session.startTime} - {session.endTime}
                            </div>
                            <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] bg-white/50 font-medium">
                              {session.mode}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
