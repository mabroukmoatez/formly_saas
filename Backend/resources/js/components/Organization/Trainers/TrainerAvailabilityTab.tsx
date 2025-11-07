import React, { useState, useEffect } from 'react';
import { Calendar } from './Calendar';
import { SessionsList } from './SessionsList';
import { fetchTrainerSessions, fetchTrainerCalendar } from '@/services/api/trainers';
import type { TrainerSession, CalendarData } from '@/types/trainer';
import './styles/TrainerAvailabilityTab.scss';

interface TrainerAvailabilityTabProps {
  trainerUuid: string;
  isEditMode?: boolean;
}

export const TrainerAvailabilityTab: React.FC<TrainerAvailabilityTabProps> = ({
  trainerUuid,
  isEditMode = false,
}) => {
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [trainerUuid, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les sessions assignées
      const sessionsResponse = await fetchTrainerSessions(trainerUuid);
      setSessions(sessionsResponse.data || []);

      // Charger les données du calendrier
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const calendarResponse = await fetchTrainerCalendar(trainerUuid, year, month);
      setCalendarData(calendarResponse.data || null);

    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth);
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="trainer-availability-tab">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trainer-availability-tab">
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-retry">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-availability-tab">
      <div className="availability-container">
        {/* Calendrier à gauche */}
        <div className="calendar-section">
          <Calendar
            calendarData={calendarData}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            trainerUuid={trainerUuid}
            isEditMode={isEditMode}
          />
        </div>

        {/* Liste des sessions à droite */}
        <div className="sessions-section">
          <SessionsList
            sessions={sessions}
            trainerUuid={trainerUuid}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

