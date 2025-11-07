import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarData } from '../../services/adminManagement';
import type { CalendarData } from '../../services/adminManagement.types';

export const Plannings = (): JSX.Element => {
  const { isDark } = useTheme();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const data = await getCalendarData({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getAllItems = () => {
    if (!calendarData) return [];
    return [...calendarData.events, ...calendarData.sessions].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  };

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `#007aff15` }}
          >
            <CalendarIcon className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Plannings
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Vue calendrier globale des événements et sessions
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={previousMonth} className={isDark ? 'border-gray-600' : ''}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className={`font-semibold min-w-[150px] text-center ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" onClick={nextMonth} className={isDark ? 'border-gray-600' : ''}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
        <CardContent className="p-6">
          {getAllItems().length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>Aucun événement ce mois-ci</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Events List View */}
              {getAllItems().map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    isDark ? 'border-gray-700 bg-gray-700/50' : 'border-[#e8f0f7] bg-[#f7f9fc]'
                  } hover:shadow-md transition-shadow`}
                >
                  {/* Color indicator */}
                  <div
                    className="w-1 h-full min-h-[60px] rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                            {item.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.type === 'event' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {item.type === 'event' ? 'Événement' : 'Session'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                            🗓️ {new Date(item.start).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                            🕐 {new Date(item.start).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} - {new Date(item.end).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {item.location && (
                            <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                              📍 {item.location}
                            </span>
                          )}
                          {item.is_online && (
                            <span className="text-blue-500">🎥 En ligne</span>
                          )}
                        </div>
                        {item.type === 'session' && item.instructor && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className={isDark ? 'text-gray-500' : 'text-[#6a90b9]/70'}>
                              Formateur: {item.instructor.name}
                            </span>
                            {item.students_count !== undefined && (
                              <span className={isDark ? 'text-gray-500' : 'text-[#6a90b9]/70'}>
                                • {item.students_count} participants
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log('View details', item.id)}
                      >
                        Détails
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>Événements</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>Sessions</span>
        </div>
      </div>
    </div>
  );
};

