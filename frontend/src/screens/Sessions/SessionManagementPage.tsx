/**
 * SessionManagementPage
 * Complete session management page integrating all session views
 * Matches Figma designs for session list, calendar, details, and dashboards
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useToast } from '../../components/ui/toast';

// Session Management Components
import {
  SessionListView,
  SessionCalendarView,
  SessionDashboard,
  SessionParticipantsView,
  SessionDetailsModal,
  AttendanceModal,
  AttendanceEditModal,
  type SessionData,
  type CalendarSession,
  type SessionFilters,
  type SessionParticipant,
  type SessionTrainer,
  type SessionSlot,
  type SlotParticipantAttendance
} from '../../components/SessionManagement';

// Course Selection Modal (from SessionCreation - working version)
import { CourseSelectionModal } from '../../components/SessionCreation/CourseSelectionModal';

// Services
import { courseSessionService } from '../../services/courseSession';
import type { CourseSessionListItem, CourseSession } from '../../services/courseSession.types';

type ViewMode = 'list' | 'calendar' | 'dashboard' | 'participants';

export const SessionManagementPage: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Data state
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [calendarSessions, setCalendarSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected session state (for dashboard/participants view)
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<{ uuid: string; name: string; avatar?: string } | null>(null);
  const [dashboardViewType, setDashboardViewType] = useState<'apprenant' | 'formateur'>('apprenant');

  // Participants data
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [trainers, setTrainers] = useState<SessionTrainer[]>([]);

  // Filters
  const [filters, setFilters] = useState<SessionFilters>({
    formation: '',
    formateur: '',
    status: 'all',
    type: 'all'
  });

  // Modal states
  const [showCourseSelectModal, setShowCourseSelectModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'qr' | 'code'>('code');
  const [selectedSlot, setSelectedSlot] = useState<SessionSlot | null>(null);
  const [showAttendanceEditModal, setShowAttendanceEditModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<SlotParticipantAttendance | null>(null);

  // Transform API session to component format
  const transformSession = (s: CourseSessionListItem | CourseSession): SessionData => {
    const getMode = (): SessionData['mode'] => {
      const mode = s.delivery_mode;
      if (mode === 'presentiel') return 'présentiel';
      if (mode === 'distanciel') return 'distanciel';
      if (mode === 'e-learning') return 'e-learning';
      return 'hybride';
    };

    return {
      uuid: s.uuid,
      title: s.title || s.display_title,
      courseTitle: s.course?.title || s.display_title,
      courseUuid: s.course?.uuid || '',
      status: getSessionStatus(s),
      startDate: formatDate(s.start_date),
      endDate: formatDate(s.end_date),
      mode: getMode(),
      maxParticipants: s.participants.max || 30,
      currentParticipants: s.participants.confirmed || 0,
      trainers: (s.trainers || []).map((t: any) => ({
        uuid: t.uuid || String(t.id),
        user_uuid: String(t.id),
        name: t.name,
        email: ''
      })),
      image: s.course?.image_url
    };
  };

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await courseSessionService.listSessions({
        per_page: 100
      });
      
      if (response.success && response.data) {
        // Transform API data to our types
        const transformedSessions: SessionData[] = response.data.map(transformSession);
        setSessions(transformedSessions);

        // Transform for calendar view
        const calSessions: CalendarSession[] = transformedSessions.flatMap(s => {
          return [{
            uuid: s.uuid,
            title: s.courseTitle || s.title,
            date: s.startDate ? formatDateISO(s.startDate) : '',
            startTime: '09:00',
            endTime: '17:00',
            mode: s.mode,
            color: getModeColor(s.mode)
          }];
        });
        setCalendarSessions(calSessions);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      showError('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load participants when viewing a session
  const loadParticipants = useCallback(async (sessionUuid: string) => {
    try {
      const response = await courseSessionService.getParticipants(sessionUuid);
      if (response.success && response.data) {
        // API returns { data: { session: {...}, participants: [...] } }
        const respData = response.data as any;
        const participantsList = respData.participants || (Array.isArray(respData) ? respData : []);
        
        const transformedParticipants: SessionParticipant[] = participantsList.map((p: any) => ({
          uuid: p.uuid,
          user_uuid: String(p.user_id),
          name: p.user?.name || 'Participant',
          email: p.user?.email || '',
          phone: p.user?.phone || '',
          avatar: p.user?.avatar_url,
          company: '',
          companyName: '',
          status: p.status === 'enrolled' ? 'registered' : p.status,
          enrollmentDate: formatDate(p.enrollment_date),
          price: p.tarif,
          successStatus: null
        }));
        setParticipants(transformedParticipants);
      }
    } catch (err) {
      console.error('Error loading participants:', err);
    }
  }, []);

  // Handlers
  const handleViewSession = (uuid: string) => {
    // Navigate to full session dashboard page
    navigateToRoute(`/session-view/${uuid}`);
  };

  const handleEditSession = (uuid: string) => {
    navigateToRoute(`/session-edit/${uuid}`);
  };

  const handleDeleteSessions = async (uuids: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${uuids.length} session(s) ?`)) return;
    
    try {
      for (const uuid of uuids) {
        await courseSessionService.deleteSession(uuid);
      }
      success(`${uuids.length} session(s) supprimée(s)`);
      loadSessions();
    } catch (err) {
      showError('Erreur lors de la suppression');
    }
  };

  const handleCreateSession = () => {
    setShowCourseSelectModal(true);
  };

  const handleCourseSelected = (course: any) => {
    // Close modal and navigate to session creation with pre-selected course
    setShowCourseSelectModal(false);
    navigateToRoute(`/session-creation?courseUuid=${course.uuid}`);
  };

  const handleViewModeChange = (mode: 'table' | 'calendar') => {
    setViewMode(mode === 'table' ? 'list' : 'calendar');
  };

  const handleCalendarSessionClick = (session: CalendarSession) => {
    const fullSession = sessions.find(s => s.uuid === session.uuid);
    if (fullSession) {
      setSelectedSession(fullSession);
      setShowSessionDetailsModal(true);
    }
  };

  const handleViewParticipantDashboard = (participantUuid: string) => {
    const participant = participants.find(p => p.uuid === participantUuid);
    if (participant && selectedSession) {
      setSelectedParticipant({
        uuid: participant.uuid,
        name: participant.name,
        avatar: participant.avatar
      });
      setDashboardViewType('apprenant');
      setViewMode('dashboard');
    }
  };

  const handleShowQRCode = (slot: SessionSlot) => {
    setSelectedSlot(slot);
    setAttendanceMode('qr');
    setShowAttendanceModal(true);
  };

  const handleShowAttendanceCode = (slot: SessionSlot) => {
    setSelectedSlot(slot);
    setAttendanceMode('code');
    setShowAttendanceModal(true);
  };

  const handleEditAttendance = (slot: SessionSlot, participant: SlotParticipantAttendance, period: 'morning' | 'afternoon') => {
    setSelectedSlot(slot);
    setEditingParticipant(participant);
    setShowAttendanceEditModal(true);
  };

  const handleSaveAttendance = (data: { present: boolean; reason?: string }) => {
    // TODO: Call API to update attendance
    console.log('Save attendance:', data);
    setShowAttendanceEditModal(false);
    success('Présence mise à jour');
  };

  const handleNavigateToEvaluation = () => {
    if (selectedSession) {
      setShowSessionDetailsModal(false);
      setViewMode('dashboard');
      setDashboardViewType('apprenant');
    }
  };

  // Utility functions
  const getSessionStatus = (session: CourseSessionListItem | CourseSession | any): SessionData['status'] => {
    const status = session.status;
    if (status === 'completed') return 'terminée';
    if (status === 'in_progress') return 'en_cours';
    if (status === 'cancelled' || status === 'postponed') return 'terminée';
    return 'à_venir';
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateISO = (dateStr: string): string => {
    // Convert "DD/MM/YYYY" to "YYYY-MM-DD"
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const getModeColor = (mode: string): string => {
    const colors: Record<string, string> = {
      'présentiel': '#22c55e',
      'distanciel': '#3b82f6',
      'e-learning': '#f59e0b',
      'hybride': '#a855f7'
    };
    return colors[mode] || '#9ca3af';
  };

  // Render content based on view mode
  const renderContent = () => {
    // Loading state
    if (loading && sessions.length === 0) {
      return <LoadingScreen />;
    }

    // Dashboard view
    if (viewMode === 'dashboard' && selectedSession) {
      return (
        <SessionDashboard
          session={selectedSession}
          participant={selectedParticipant || undefined}
          viewType={dashboardViewType}
          onTabChange={(tab) => console.log('Tab changed:', tab)}
        />
      );
    }

    // Participants view
    if (viewMode === 'participants' && selectedSession) {
      return (
        <SessionParticipantsView
          session={selectedSession}
          participants={participants}
          trainers={trainers}
          onViewParticipant={handleViewParticipantDashboard}
          onDeleteParticipant={(uuid) => handleDeleteSessions([uuid])}
          onSendCertificate={(uuids) => console.log('Send certificates:', uuids)}
          onMarkFailed={(uuids) => console.log('Mark failed:', uuids)}
        />
      );
    }

    // Calendar view
    if (viewMode === 'calendar') {
      return (
        <SessionCalendarView
          sessions={calendarSessions}
          currentDate={currentDate}
          viewMode={calendarMode}
          filters={filters}
          onFiltersChange={setFilters}
          onDateChange={setCurrentDate}
          onViewModeChange={setCalendarMode}
          onSessionClick={handleCalendarSessionClick}
          onSwitchToList={() => setViewMode('list')}
          onCreateSession={handleCreateSession}
        />
      );
    }

    // Default: List view
    return (
      <SessionListView
        sessions={sessions}
        loading={loading}
        filters={filters}
        onFiltersChange={setFilters}
        onView={handleViewSession}
        onEdit={handleEditSession}
        onDelete={handleDeleteSessions}
        onCreateSession={handleCreateSession}
        onViewModeChange={handleViewModeChange}
        viewMode="table"
      />
    );
  };

  return (
    <DashboardLayout>
      {renderContent()}

      {/* All Modals - rendered ONCE */}
      {selectedSession && (
        <>
          <SessionDetailsModal
            isOpen={showSessionDetailsModal}
            onClose={() => setShowSessionDetailsModal(false)}
            session={selectedSession}
            onShowQRCode={handleShowQRCode}
            onShowAttendanceCode={handleShowAttendanceCode}
            onEditAttendance={handleEditAttendance}
            onNavigateToEvaluation={handleNavigateToEvaluation}
          />

          <AttendanceModal
            isOpen={showAttendanceModal}
            onClose={() => setShowAttendanceModal(false)}
            session={selectedSession}
            slot={selectedSlot || undefined}
            mode={attendanceMode}
          />
        </>
      )}

      <CourseSelectionModal
        isOpen={showCourseSelectModal}
        onClose={() => setShowCourseSelectModal(false)}
        onSelectCourse={handleCourseSelected}
      />

      {editingParticipant && (
        <AttendanceEditModal
          isOpen={showAttendanceEditModal}
          onClose={() => setShowAttendanceEditModal(false)}
          participantName={editingParticipant.name}
          currentStatus={editingParticipant.morningPresent}
          onSave={handleSaveAttendance}
        />
      )}
    </DashboardLayout>
  );
};

export default SessionManagementPage;

