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
  SessionActionModal,
  CreateSessionModal,
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
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
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
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [workflowActions, setWorkflowActions] = useState<any[]>([]);

  // Filters
  const [filters, setFilters] = useState<SessionFilters>({
    formation: '',
    formateur: '',
    status: 'all',
    type: 'all'
  });

  // Modal states
  const [showCourseSelectModal, setShowCourseSelectModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showSessionActionModal, setShowSessionActionModal] = useState(false);
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

  const handleCreateSessionClick = () => {
    setShowCreateSessionModal(true);
  };

  const handleCreateSessionSubmit = (data: any) => {
    console.log('Create session data:', data);
    setShowCreateSessionModal(false);
    setShowCourseSelectModal(true);
  };

  const handleCourseSelected = (course: any) => {
    setShowCourseSelectModal(false);
    navigateToRoute(`/session-creation?courseUuid=${course.uuid}`);
  };

  const handleViewModeChange = (mode: 'table' | 'calendar') => {
    setViewMode(mode === 'table' ? 'list' : 'calendar');
  };

  // Load full session data for modal
  const loadFullSessionData = useCallback(async (sessionUuid: string) => {
    try {
      // Load full session details
      const sessionResponse = await courseSessionService.getSession(sessionUuid);
      if (!sessionResponse.success || !sessionResponse.data) {
        throw new Error('Impossible de charger la session');
      }

      const apiSession = sessionResponse.data;
      const transformedSession = transformSession(apiSession);
      setSelectedSession(transformedSession);

      // Load trainers
      let sessionTrainers: SessionTrainer[] = [];
      if (apiSession.trainers && apiSession.trainers.length > 0) {
        sessionTrainers = apiSession.trainers.map((t: any) => ({
          uuid: t.uuid || String(t.id),
          user_uuid: String(t.id || t.user_id),
          name: t.name || t.user?.name || 'Formateur',
          email: t.email || t.user?.email || ''
        }));
      }
      setTrainers(sessionTrainers);

      // Load slots
      try {
        const slotsResponse = await courseSessionService.getSlots(sessionUuid);
        if (slotsResponse.success && slotsResponse.data) {
          const responseData = slotsResponse.data as any;
          const slotsData = responseData.slots || responseData;
          const slotsList = Array.isArray(slotsData) ? slotsData : [];
          
          const transformedSlots: SessionSlot[] = slotsList.map((slot: any) => ({
            uuid: slot.uuid || String(slot.id),
            title: slot.title || `Séance du ${formatDate(slot.start_date)}`,
            date: formatDate(slot.start_date),
            startTime: slot.start_time || '09:00',
            endTime: slot.end_time || '17:00',
            status: slot.status || 'scheduled',
            participants: []
          }));
          setSlots(transformedSlots);
        }
      } catch (err) {
        console.warn('Impossible de charger les séances:', err);
        if (apiSession.slots && apiSession.slots.length > 0) {
          const transformedSlots: SessionSlot[] = apiSession.slots.map((slot: any) => ({
            uuid: slot.uuid || String(slot.id),
            title: slot.title || `Séance du ${formatDate(slot.start_date)}`,
            date: formatDate(slot.start_date),
            startTime: slot.start_time || '09:00',
            endTime: slot.end_time || '17:00',
            status: slot.status || 'scheduled',
            participants: []
          }));
          setSlots(transformedSlots);
        } else {
          setSlots([]);
        }
      }

      // Load workflow actions
      try {
        const apiData = apiSession as any;
        if (apiData.effective_workflow_actions && Array.isArray(apiData.effective_workflow_actions)) {
          const transformedWorkflowActions = apiData.effective_workflow_actions.map((action: any) => ({
            uuid: action.uuid,
            type: action.action_type || action.type,
            target_type: action.target_type || action.targetType,
            target: action.target || action.target_uuid,
            status: action.status || 'pending',
            scheduled_for: action.scheduled_for || action.scheduledFor,
            executed_at: action.executed_at || action.executedAt,
            options: action.options || {},
            questionnaires: action.questionnaires || [],
            attachments: action.attachments || []
          }));
          setWorkflowActions(transformedWorkflowActions);
        } else {
          setWorkflowActions([]);
        }
      } catch (err) {
        console.warn('Impossible de charger les actions du workflow:', err);
        setWorkflowActions([]);
      }
    } catch (err) {
      console.error('Error loading full session data:', err);
      showError('Erreur lors du chargement des détails de la session');
    }
  }, [showError]);

  const handleCalendarSessionClick = async (session: CalendarSession) => {
    const fullSession = sessions.find(s => s.uuid === session.uuid);
    if (fullSession) {
      // Load full session data before showing modal
      await loadFullSessionData(session.uuid);
      setShowSessionActionModal(true);
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
          onCreateSession={handleCreateSessionClick}
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
        onCreateSession={handleCreateSessionClick}
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
          <SessionActionModal
            isOpen={showSessionActionModal}
            onClose={() => setShowSessionActionModal(false)}
            onViewDetails={() => setShowSessionDetailsModal(true)}
            onViewEvaluation={() => {
              setViewMode('dashboard');
              setDashboardViewType('apprenant');
            }}
          />

          <SessionDetailsModal
            isOpen={showSessionDetailsModal}
            onClose={() => setShowSessionDetailsModal(false)}
            session={selectedSession}
            sessionUuid={selectedSession.uuid}
            slots={slots}
            trainers={trainers}
            workflowActions={workflowActions}
            onShowQRCode={handleShowQRCode}
            onShowAttendanceCode={handleShowAttendanceCode}
            onEditAttendance={handleEditAttendance}
            onNavigateToEvaluation={handleNavigateToEvaluation}
            onRefresh={loadFullSessionData.bind(null, selectedSession.uuid)}
          />

          <AttendanceModal
            isOpen={showAttendanceModal}
            onClose={() => setShowAttendanceModal(false)}
            session={selectedSession}
            slot={selectedSlot || undefined}
            mode={attendanceMode}
            sessionUuid={selectedSession.uuid}
          />
        </>
      )}

      <CreateSessionModal
        isOpen={showCreateSessionModal}
        onClose={() => setShowCreateSessionModal(false)}
        onCreate={handleCreateSessionSubmit}
      />

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
