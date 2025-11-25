import { useState, useEffect } from 'react';
import { getLearnerCalendar, CalendarEvent } from '../services/learner';

interface UseLearnerCalendarParams {
  start_date?: string;
  end_date?: string;
  type?: 'all' | 'sessions' | 'events' | 'deadlines';
  course_id?: number;
  period?: 'week' | 'month' | 'year';
}

export const useLearnerCalendar = (params?: UseLearnerCalendarParams) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerCalendar(params);
      if (response.success && response.data) {
        setEvents(response.data.events || []);
        setPeriod(response.data.period);
      } else {
        setError('Erreur lors du chargement du calendrier');
      }
    } catch (err: any) {
      console.error('Error fetching calendar:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [params?.start_date, params?.end_date, params?.type, params?.course_id, params?.period]);

  return {
    events,
    loading,
    error,
    period,
    refetch: fetchCalendar
  };
};

