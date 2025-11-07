import React, { useMemo } from 'react';
import type { CalendarData, DayStatus } from '@/types/trainer';
import './styles/Calendar.scss';

interface CalendarProps {
  calendarData: CalendarData | null;
  selectedMonth: Date;
  onMonthChange: (newMonth: Date) => void;
  trainerUuid: string;
  isEditMode?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  calendarData,
  selectedMonth,
  onMonthChange,
  trainerUuid,
  isEditMode = false,
}) => {
  // Générer les jours du mois
  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Jours de remplissage au début (pour aligner le calendrier)
    const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Ajuster pour commencer le lundi
    
    const days: Array<{ date: number | null; status?: DayStatus; fullDate?: string }> = [];
    
    // Ajouter les jours vides au début
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null });
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= totalDays; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = calendarData?.days?.[fullDate] || 'disponible';
      days.push({ date: day, status, fullDate });
    }
    
    return days;
  }, [selectedMonth, calendarData]);

  // Navigation mois précédent
  const handlePreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onMonthChange(newMonth);
  };

  // Navigation mois suivant
  const handleNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onMonthChange(newMonth);
  };

  // Formater le nom du mois
  const monthName = selectedMonth.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Capitaliser la première lettre
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Obtenir la classe CSS selon le statut
  const getDayClassName = (status?: DayStatus): string => {
    if (!status) return 'calendar-day';
    
    switch (status) {
      case 'en_formation':
        return 'calendar-day day-in-training';
      case 'disponible':
        return 'calendar-day day-available';
      case 'indisponible':
        return 'calendar-day day-unavailable';
      default:
        return 'calendar-day';
    }
  };

  return (
    <div className="calendar-container">
      {/* Header avec navigation */}
      <div className="calendar-header">
        <h3 className="calendar-title">{capitalizedMonthName}</h3>
        <div className="calendar-navigation">
          <button 
            type="button"
            onClick={handlePreviousMonth} 
            className="btn-nav btn-prev"
            aria-label="Mois précédent"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            type="button"
            onClick={handleNextMonth} 
            className="btn-nav btn-next"
            aria-label="Mois suivant"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot legend-dot-training"></span>
          <span className="legend-label">En Formation</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-available"></span>
          <span className="legend-label">Disponible</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-unavailable"></span>
          <span className="legend-label">Indisponible</span>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="calendar-grid">
        {/* Jours de la semaine */}
        <div className="calendar-weekdays">
          <div className="weekday">S</div>
          <div className="weekday">M</div>
          <div className="weekday">T</div>
          <div className="weekday">W</div>
          <div className="weekday">T</div>
          <div className="weekday">F</div>
          <div className="weekday">S</div>
        </div>

        {/* Jours du mois */}
        <div className="calendar-days">
          {daysInMonth.map((day, index) => (
            <div 
              key={index} 
              className={day.date ? getDayClassName(day.status) : 'calendar-day day-empty'}
              data-date={day.fullDate}
              title={day.date && day.status ? 
                day.status === 'en_formation' ? 'En formation' :
                day.status === 'disponible' ? 'Disponible' :
                'Indisponible'
                : ''
              }
            >
              {day.date && (
                <span className="day-number">{day.date}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Note si pas de données */}
      {!calendarData && (
        <div className="calendar-note">
          <i className="fas fa-info-circle"></i>
          <p>Aucune donnée de disponibilité pour ce mois</p>
        </div>
      )}
    </div>
  );
};

