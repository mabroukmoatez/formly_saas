import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Video,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useLearnerCalendar } from '../../hooks/useLearnerCalendar';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { CalendarEvent } from '../../services/learner';

export const Calendar: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'sessions' | 'events' | 'deadlines'>('all');
  const [courseFilter, setCourseFilter] = useState<number | null>(null);

  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { events, loading, error, refetch } = useLearnerCalendar({
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    type: typeFilter === 'all' ? undefined : typeFilter,
    course_id: courseFilter || undefined,
    period: 'month'
  });

  const primaryColor = organization?.primary_color || '#007aff';

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Users className="h-4 w-4" />;
      case 'event':
        return <CalendarIcon className="h-4 w-4" />;
      case 'deadline':
        return <FileText className="h-4 w-4" />;
      case 'test':
        return <FileText className="h-4 w-4" />;
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-blue-500';
      case 'event':
        return 'bg-purple-500';
      case 'deadline':
        return 'bg-red-500';
      case 'test':
        return 'bg-orange-500';
      case 'assignment':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500 text-white">À venir</Badge>;
      case 'live':
        return <Badge className="bg-green-500 text-white">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500 text-white">Terminé</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Annulé</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const filteredEvents = events.filter(event => {
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    if (courseFilter && event.course?.id !== courseFilter) return false;
    return true;
  });

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 p-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`min-h-24 p-2 border rounded-lg ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm font-semibold mb-1 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded cursor-pointer ${getEventColor(event.type)} text-white truncate`}
                    onClick={() => setSelectedEvent(event)}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
                Calendrier
              </h1>
              <p className="text-gray-500 mt-1">
                Consultez vos sessions, événements et échéances
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[200px] text-center">
                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tous les types</option>
                  <option value="sessions">Sessions</option>
                  <option value="events">Événements</option>
                  <option value="deadlines">Échéances</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all');
                    setCourseFilter(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendar View */}
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => refetch()} className="mt-4">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                {renderMonthView()}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Événements à venir</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.filter(e => e.status === 'upcoming' || e.status === 'live').length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun événement à venir</p>
              ) : (
                <div className="space-y-4">
                  {filteredEvents
                    .filter(e => e.status === 'upcoming' || e.status === 'live')
                    .slice(0, 10)
                    .map(event => (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className={`p-2 rounded ${getEventColor(event.type)} text-white`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{event.title}</h3>
                            {getStatusBadge(event.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(event.start_date)}</span>
                              {event.end_date && (
                                <span> - {formatDate(event.end_date)}</span>
                              )}
                            </div>
                            {event.start_date && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(event.start_date)}</span>
                                {event.end_date && (
                                  <span> - {formatTime(event.end_date)}</span>
                                )}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.course && (
                              <div className="text-gray-500">{event.course.name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Detail Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md m-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedEvent.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEvent(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEvent.description && (
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(selectedEvent.start_date)}</span>
                      {selectedEvent.end_date && (
                        <span> - {formatDate(selectedEvent.end_date)}</span>
                      )}
                    </div>
                    {selectedEvent.start_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatTime(selectedEvent.start_date)}</span>
                        {selectedEvent.end_date && (
                          <span> - {formatTime(selectedEvent.end_date)}</span>
                        )}
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.course && (
                      <div className="text-gray-600">
                        Formation: {selectedEvent.course.name}
                      </div>
                    )}
                    {selectedEvent.instructor && (
                      <div className="text-gray-600">
                        Formateur: {selectedEvent.instructor.name}
                      </div>
                    )}
                    {selectedEvent.requires_attendance && (
                      <Badge className="bg-blue-500 text-white">Émargement requis</Badge>
                    )}
                    {selectedEvent.recording_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(selectedEvent.recording_url, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Voir l'enregistrement
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};

