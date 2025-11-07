import React, { useState, useMemo } from 'react';
import type { TrainerSession } from '@/types/trainer';
import './styles/SessionsList.scss';

interface SessionsListProps {
  sessions: TrainerSession[];
  trainerUuid: string;
  onRefresh?: () => void;
}

type TabType = 'prochaines' | 'en-cours' | 'passees';

export const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  trainerUuid,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('en-cours');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  // Filtrer les sessions par type
  const filteredSessions = useMemo(() => {
    const now = new Date();
    
    return sessions.filter(session => {
      const startDate = new Date(session.start_date);
      const endDate = new Date(session.end_date);
      
      switch (activeTab) {
        case 'prochaines':
          return startDate > now;
        case 'en-cours':
          return startDate <= now && endDate >= now;
        case 'passees':
          return endDate < now;
        default:
          return false;
      }
    });
  }, [sessions, activeTab]);

  // Grouper les sessions par formation
  const sessionsByCourse = useMemo(() => {
    const grouped: Record<string, {
      course: {
        uuid: string;
        title: string;
        image: string | null;
      };
      sessions: TrainerSession[];
    }> = {};

    filteredSessions.forEach(session => {
      const courseUuid = session.course?.uuid || 'unknown';
      
      if (!grouped[courseUuid]) {
        grouped[courseUuid] = {
          course: {
            uuid: courseUuid,
            title: session.course?.title || 'Formation inconnue',
            image: session.course?.image || null,
          },
          sessions: [],
        };
      }
      
      grouped[courseUuid].sessions.push(session);
    });

    return Object.values(grouped);
  }, [filteredSessions]);

  // Toggle expansion d'une formation
  const toggleCourseExpansion = (courseUuid: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseUuid)) {
        newSet.delete(courseUuid);
      } else {
        newSet.add(courseUuid);
      }
      return newSet;
    });
  };

  // Formater les dates
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startFormatted = start.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    const endFormatted = end.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  // Calculer la progression d'une session
  const calculateProgress = (session: TrainerSession): number => {
    if (!session.total_seances || session.total_seances === 0) return 0;
    return Math.round((session.completed_seances / session.total_seances) * 100);
  };

  // Obtenir la classe CSS pour la barre de progression
  const getProgressBarClass = (progress: number): string => {
    if (progress >= 70) return 'progress-bar progress-high';
    if (progress >= 30) return 'progress-bar progress-medium';
    return 'progress-bar progress-low';
  };

  return (
    <div className="sessions-list-container">
      {/* Header */}
      <div className="sessions-header">
        <h3 className="sessions-title">Liste Des Sessions</h3>
      </div>

      {/* Onglets */}
      <div className="sessions-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'prochaines' ? 'active' : ''}`}
          onClick={() => setActiveTab('prochaines')}
        >
          Prochaines
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'en-cours' ? 'active' : ''}`}
          onClick={() => setActiveTab('en-cours')}
        >
          En-cours
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'passees' ? 'active' : ''}`}
          onClick={() => setActiveTab('passees')}
        >
          Passées
        </button>
      </div>

      {/* Contenu */}
      <div className="sessions-content">
        {sessionsByCourse.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>Aucune session {activeTab === 'prochaines' ? 'à venir' : activeTab === 'en-cours' ? 'en cours' : 'passée'}</p>
          </div>
        ) : (
          <div className="courses-list">
            {sessionsByCourse.map(({ course, sessions: courseSessions }) => {
              const isExpanded = expandedCourses.has(course.uuid);
              
              return (
                <div key={course.uuid} className="course-item">
                  {/* En-tête de la formation */}
                  <div 
                    className="course-header"
                    onClick={() => toggleCourseExpansion(course.uuid)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleCourseExpansion(course.uuid);
                      }
                    }}
                  >
                    <div className="course-info">
                      <div className="course-icon">
                        {course.image ? (
                          <img src={course.image} alt={course.title} />
                        ) : (
                          <div className="course-icon-placeholder">
                            <i className="fas fa-graduation-cap"></i>
                          </div>
                        )}
                      </div>
                      <h4 className="course-title">{course.title}</h4>
                    </div>
                    <button 
                      type="button"
                      className={`toggle-button ${isExpanded ? 'expanded' : ''}`}
                      aria-label={isExpanded ? 'Réduire' : 'Développer'}
                    >
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                    </button>
                  </div>

                  {/* Sessions de la formation */}
                  {isExpanded && (
                    <div className="sessions-details">
                      {courseSessions.map((session, index) => {
                        const progress = calculateProgress(session);
                        
                        return (
                          <div key={session.uuid} className="session-item">
                            <div className="session-header">
                              <h5 className="session-title">
                                Session {index + 1} : {session.name || 'Titre De Session'}
                              </h5>
                              <div className="session-stats">
                                <span className="session-progress-percentage">{progress}%</span>
                              </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="progress-container">
                              <div className={getProgressBarClass(progress)}>
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Informations de la session */}
                            <div className="session-info">
                              <div className="session-dates">
                                <i className="far fa-calendar"></i>
                                <span>{formatDateRange(session.start_date, session.end_date)}</span>
                              </div>
                              <div className="session-seances">
                                <span className="seances-label">Séance :</span>
                                <span className="seances-count">
                                  {session.completed_seances}/{session.total_seances || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

