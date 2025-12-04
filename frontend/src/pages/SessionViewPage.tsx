import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/CommercialDashboard';
import { LoadingScreen } from '../components/LoadingScreen';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';
import { useTheme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Eye, Users, AlertTriangle, Filter, Download, Star, Clock, ThumbsUp, Trash2 } from 'lucide-react';

// Simple Circular Progress for global dashboard
const CircularProgress: React.FC<{ value: number; color?: string; bgColor?: string }> = ({ 
  value, color = '#f97316', bgColor = '#ffedd5' 
}) => {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" 
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-lg font-semibold" style={{ color }}>{value}%</span>
    </div>
  );
};

// New Session Management Components
import {
  SessionDashboard,
  SessionParticipantsView,
  SessionDetailsModal,
  AttendanceModal,
  AttendanceEditModal,
  type SessionData,
  type SessionParticipant,
  type SessionTrainer,
  type SessionSlot,
  type SlotParticipantAttendance
} from '../components/SessionManagement';

// Services
import { courseSessionService } from '../services/courseSession';
import type { 
  CourseSession, 
  SessionParticipant as APISessionParticipant,
  SessionSlot as APISessionSlot 
} from '../services/courseSession.types';

type ViewMode = 'dashboard' | 'participants' | 'details';

export const SessionViewPage: React.FC = () => {
  const { sessionUuid } = useParams<{ sessionUuid: string }>();
  const [searchParams] = useSearchParams();
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [dashboardViewType, setDashboardViewType] = useState<'apprenant' | 'formateur'>('apprenant');

  // Data state
  const [session, setSession] = useState<SessionData | null>(null);
  const [rawSession, setRawSession] = useState<CourseSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [trainers, setTrainers] = useState<SessionTrainer[]>([]);
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected participant for dashboard
  const [selectedParticipant, setSelectedParticipant] = useState<{ uuid: string; name: string; avatar?: string } | null>(null);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'qr' | 'code'>('code');
  const [selectedSlot, setSelectedSlot] = useState<SessionSlot | null>(null);
  const [showAttendanceEditModal, setShowAttendanceEditModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<SlotParticipantAttendance | null>(null);

  // Transform API session to component SessionData
  const transformSession = (apiSession: CourseSession): SessionData => {
    const getStatus = (): SessionData['status'] => {
      if (apiSession.status === 'completed') return 'terminée';
      if (apiSession.status === 'in_progress') return 'en_cours';
      return 'à_venir';
    };

    const getMode = (): SessionData['mode'] => {
      const mode = apiSession.delivery_mode;
      if (mode === 'presentiel') return 'présentiel';
      if (mode === 'distanciel') return 'distanciel';
      if (mode === 'e-learning') return 'e-learning';
      return 'hybride';
    };

    return {
      uuid: apiSession.uuid,
      title: apiSession.title || apiSession.display_title,
      courseTitle: apiSession.course?.title || apiSession.display_title,
      courseUuid: apiSession.course?.uuid || '',
      status: getStatus(),
      startDate: formatDate(apiSession.start_date),
      endDate: formatDate(apiSession.end_date),
      mode: getMode(),
      maxParticipants: apiSession.participants.max || 30,
      currentParticipants: apiSession.participants.confirmed || 0,
      trainers: (apiSession.trainers || []).map(t => ({
        uuid: t.uuid,
        user_uuid: String(t.id),
        name: t.name,
        email: t.email || ''
      })),
      duration: apiSession.total_hours ? `${apiSession.total_hours}h` : undefined,
      durationDays: apiSession.total_days || undefined,
      image: apiSession.course?.image_url
    };
  };

  // Transform API participants to component format
  const transformParticipants = (apiParticipants: APISessionParticipant[]): SessionParticipant[] => {
    return apiParticipants.map(p => ({
      uuid: p.uuid,
      user_uuid: String(p.user_id),
      name: p.user?.name || 'Participant',
      email: p.user?.email || '',
      phone: '',
      avatar: p.user?.avatar_url,
      company: '',
      companyName: '',
      status: p.status === 'enrolled' ? 'registered' : p.status as any,
      enrollmentDate: formatDate(p.enrollment_date),
      price: p.tarif,
      successStatus: null
    }));
  };

  // Transform API slots to component format
  const transformSlots = (apiSlots: APISessionSlot[], slotParticipants: SessionParticipant[]): SessionSlot[] => {
    return apiSlots.map((s, index) => {
      const getSlotStatus = (): SessionSlot['status'] => {
        if (s.status === 'completed') return 'effectuée';
        if (s.status === 'in_progress') return 'en_cours';
        if (s.status === 'cancelled') return 'terminée';
        return 'à_venir';
      };

      const getSlotMode = (): SessionSlot['mode'] => {
        const type = s.instance_type;
        if (type === 'presentiel') return 'présentiel';
        if (type === 'distanciel') return 'distanciel';
        if (type === 'e-learning') return 'e-learning';
        return 'hybride';
      };

      // Default attendance - in real app this would come from API
      const totalParticipants = slotParticipants.length;

      return {
        uuid: s.uuid,
        slotNumber: index + 1,
        date: formatDate(s.start_date),
        startTime: s.start_time || '09:00',
        endTime: s.end_time || '17:00',
        status: getSlotStatus(),
        mode: getSlotMode(),
        location: s.location_room,
        attendance: {
          morning: { present: 0, total: totalParticipants, percentage: 0 },
          afternoon: { present: 0, total: totalParticipants, percentage: 0 }
        },
        participants: slotParticipants.map(p => ({
          uuid: p.uuid,
          name: p.name,
          morningPresent: false,
          afternoonPresent: false
        }))
      };
    });
  };

  // Format date helper
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr || '';
    }
  };

  // Load all session data from API
  const loadSessionData = useCallback(async () => {
    if (!sessionUuid) {
      setError('UUID de session non fourni');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Load session details
      const sessionResponse = await courseSessionService.getSession(sessionUuid);
      
      if (!sessionResponse.success || !sessionResponse.data) {
        throw new Error('Impossible de charger la session');
      }

      const apiSession = sessionResponse.data;
      console.log('Session loaded:', apiSession);
      setRawSession(apiSession);
      setSession(transformSession(apiSession));

      // Extract trainers from session (or from course if not in session)
      let sessionTrainers: SessionTrainer[] = [];
      
      // 1. Try to get trainers from session
      if (apiSession.trainers && apiSession.trainers.length > 0) {
        sessionTrainers = apiSession.trainers.map((t: any) => ({
          uuid: t.uuid || String(t.id),
          user_uuid: String(t.id || t.user_id),
          name: t.name || t.user?.name || 'Formateur',
          email: t.email || t.user?.email || ''
        }));
        console.log('Trainers from session:', sessionTrainers);
      }
      
      // 2. If no trainers in session, try to get from course
      if (sessionTrainers.length === 0 && apiSession.course?.uuid) {
        try {
          const { courseCreation } = await import('../services/courseCreation');
          const courseResponse = await courseCreation.getCourse(apiSession.course.uuid);
          if (courseResponse.success && courseResponse.data) {
            const courseData = courseResponse.data;
            // Try trainers from course
            const courseTrainers = courseData.trainers || courseData.course_trainers || [];
            if (courseTrainers.length > 0) {
              sessionTrainers = courseTrainers.map((t: any) => ({
                uuid: t.uuid || t.user_uuid || String(t.id),
                user_uuid: String(t.user_id || t.id),
                name: t.name || t.user?.name || t.trainer?.name || 'Formateur',
                email: t.email || t.user?.email || t.trainer?.email || ''
              }));
              console.log('Trainers from course:', sessionTrainers);
            }
          }
        } catch (err) {
          console.warn('Could not load trainers from course:', err);
        }
      }
      
      setTrainers(sessionTrainers);

      // 2. Load participants
      let loadedParticipants: SessionParticipant[] = [];
      try {
        const participantsResponse = await courseSessionService.getParticipants(sessionUuid);
        if (participantsResponse.success && participantsResponse.data) {
          // API returns { data: { session: {...}, participants: [...] } }
          const participantsData = (participantsResponse.data as any).participants || participantsResponse.data;
          const participantsList = Array.isArray(participantsData) ? participantsData : [];
          
          loadedParticipants = transformParticipants(participantsList);
          setParticipants(loadedParticipants);

          // ⭐ NE PAS auto-sélectionner le premier participant
          // Par défaut on montre le dashboard global de la session
          // Le participant ne sera sélectionné que quand on clique sur son nom
        }
      } catch (err) {
        console.warn('Impossible de charger les participants:', err);
        setParticipants([]);
      }

      // 3. Load slots
      try {
        const slotsResponse = await courseSessionService.getSlots(sessionUuid);
        if (slotsResponse.success && slotsResponse.data) {
          // API returns { data: { session: {...}, slots: [...] } }
          const slotsData = (slotsResponse.data as any).slots || slotsResponse.data;
          const slotsList = Array.isArray(slotsData) ? slotsData : [];
          
          setSlots(transformSlots(slotsList, loadedParticipants));
        }
      } catch (err) {
        console.warn('Impossible de charger les séances:', err);
        // Use slots from session if available
        if (apiSession.slots && apiSession.slots.length > 0) {
          setSlots(transformSlots(apiSession.slots, loadedParticipants));
        } else {
          setSlots([]);
        }
      }

    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Erreur lors du chargement de la session');
    } finally {
      setLoading(false);
    }
  }, [sessionUuid]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Check URL params for initial view
  useEffect(() => {
    const view = searchParams.get('view');
    const participant = searchParams.get('participant');
    const type = searchParams.get('type');
    
    if (view === 'participants') {
      setViewMode('participants');
    } else if (view === 'details') {
      setShowDetailsModal(true);
    }
    
    if (type === 'formateur') {
      setDashboardViewType('formateur');
    }
    
    if (participant && participants.length > 0) {
      const p = participants.find(p => p.uuid === participant);
      if (p) {
        setSelectedParticipant({ uuid: p.uuid, name: p.name, avatar: p.avatar });
      }
    }
  }, [searchParams, participants]);

  // Handlers
  const handleBack = () => {
    navigateToRoute('/session-management');
  };

  const handleEdit = () => {
    navigateToRoute(`/session-edit/${sessionUuid}`);
  };

  const handleViewParticipant = (participantUuid: string) => {
    const p = participants.find(p => p.uuid === participantUuid);
    if (p) {
      setSelectedParticipant({ uuid: p.uuid, name: p.name, avatar: p.avatar });
      setDashboardViewType('apprenant');
      setViewMode('dashboard');
    }
  };

  const handleDeleteParticipant = async (uuid: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) return;
    
    try {
      const response = await courseSessionService.removeParticipant(sessionUuid!, uuid);
      if (response.success) {
        success('Participant supprimé avec succès');
        loadSessionData();
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la suppression du participant');
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

  const handleSaveAttendance = async (data: { present: boolean; reason?: string }) => {
    // TODO: Call API to update attendance when endpoint is available
    // For now just update locally
    if (editingParticipant && selectedSlot) {
      setSlots(prevSlots => prevSlots.map(slot => {
        if (slot.uuid === selectedSlot.uuid && slot.participants) {
          return {
            ...slot,
            participants: slot.participants.map(p => {
              if (p.uuid === editingParticipant.uuid) {
                return {
                  ...p,
                  morningPresent: data.present,
                  afternoonPresent: data.present
                };
              }
              return p;
            })
          };
        }
        return slot;
      }));
    }
    setShowAttendanceEditModal(false);
    success('Présence mise à jour');
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <LoadingScreen />
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className={`text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux sessions
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // No session found
  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Session non trouvée</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux sessions
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Participants view
  if (viewMode === 'participants') {
    return (
      <DashboardLayout>
        <div className="mb-4 px-6 pt-4">
          <Button variant="ghost" onClick={() => setViewMode('dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Button>
        </div>
        <SessionParticipantsView
          session={session}
          participants={participants}
          trainers={trainers}
          onViewParticipant={handleViewParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onSendCertificate={(uuids) => {
            console.log('Send certificates:', uuids);
            success('Certificats envoyés avec succès');
          }}
          onMarkFailed={(uuids) => {
            console.log('Mark failed:', uuids);
            success('Participants marqués comme échoués');
          }}
        />
      </DashboardLayout>
    );
  }

  // Dashboard view (default)
  return (
    <DashboardLayout>
      {/* Navigation bar */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux sessions
          </Button>
          
          {/* Bouton retour au dashboard global si un participant est sélectionné */}
          {selectedParticipant && (
            <Button 
              variant="ghost" 
              onClick={() => setSelectedParticipant(null)} 
              className="gap-2 text-blue-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard global
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDetailsModal(true)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Détails session
          </Button>
          
          {/* View type toggle - seulement si on est en vue globale */}
          {!selectedParticipant && (
            <div className={`flex items-center gap-2 rounded-full p-1 ml-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setDashboardViewType('apprenant')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  dashboardViewType === 'apprenant' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-500'
                }`}
              >
                Apprenant
              </button>
              <button
                onClick={() => setDashboardViewType('formateur')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  dashboardViewType === 'formateur' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-500'
                }`}
              >
                Formateur
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard - Global ou Individuel selon la sélection */}
      {selectedParticipant ? (
        // ⭐ Vue individuelle: Dashboard d'un participant/formateur spécifique
        <SessionDashboard
          session={session}
          participant={selectedParticipant}
          viewType={dashboardViewType}
          onTabChange={(tab) => console.log('Tab changed:', tab)}
        />
      ) : (
        // ⭐ Vue globale: Dashboard de la session + liste participants/formateurs
        <div className="p-6">
          {/* En-tête de la session */}
          <div className="text-center mb-8">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0095A8]'}`}>
              {session.courseTitle}
            </h1>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-sm text-gray-500">Session :</span>
              <Badge className="bg-green-100 text-green-700 border-0">
                {session.status === 'en_cours' ? 'En-cours' : session.status === 'terminée' ? 'Terminée' : 'À venir'}
              </Badge>
              <span className="text-sm text-gray-500">📅 {session.startDate} - 📅 {session.endDate}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-sm text-gray-500">Modalités :</span>
              <Badge className="bg-green-100 text-green-600 border-0">
                🌐 {session.mode}
              </Badge>
            </div>
          </div>

          {/* KPIs globaux */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Nombres d'apprenants</span>
              </div>
              <p className="text-3xl font-bold text-green-500">{participants.length}</p>
            </div>
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm text-gray-500">Taux De Recommandation</span>
              </div>
              <div className="w-20 h-20 mx-auto">
                <CircularProgress value={0} color="#f97316" bgColor="#ffedd5" />
              </div>
            </div>
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-sm text-gray-500">Durée Moyenne De Connexion</span>
              </div>
              <p className="text-3xl font-bold text-cyan-500">-</p>
            </div>
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Taux D'assiduité</span>
              </div>
              <p className="text-3xl font-bold text-blue-500">0%</p>
            </div>
          </div>

          {/* Liste des participants/formateurs */}
          <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            {/* Toggle Apprenant/Formateur + Export */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <Input 
                  placeholder="Recherche Apprenants" 
                  className="w-64"
                />
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtre
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={dashboardViewType === 'apprenant' ? 'font-semibold' : 'text-gray-500'}>Apprenant</span>
                  <button
                    onClick={() => setDashboardViewType(dashboardViewType === 'apprenant' ? 'formateur' : 'apprenant')}
                    className={`relative w-12 h-6 rounded-full transition-colors ${dashboardViewType === 'formateur' ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dashboardViewType === 'formateur' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={dashboardViewType === 'formateur' ? 'font-semibold' : 'text-gray-500'}>Formateur</span>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Table - avec overflow scroll pour les écrans petits */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className={`text-left text-sm font-medium text-gray-500 ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                    <th className="p-4 w-10"></th>
                    <th className="p-4 min-w-[180px]">Nom & Prénom</th>
                    <th className="p-4 min-w-[200px]">Email</th>
                    <th className="p-4 min-w-[130px]">Téléphone</th>
                    {dashboardViewType === 'apprenant' && (
                      <>
                        <th className="p-4 min-w-[120px]">Formations Attribuées</th>
                        <th className="p-4 min-w-[130px]">Entreprise Affiliée</th>
                        <th className="p-4 min-w-[120px]">Statut De Réussite</th>
                      </>
                    )}
                    {dashboardViewType === 'formateur' && (
                      <th className="p-4 min-w-[120px]">Tarif De La Formation</th>
                    )}
                    <th className="p-4 min-w-[120px]">Date D'inscription</th>
                    <th className="p-4 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboardViewType === 'apprenant' ? (
                    participants.length > 0 ? (
                      participants.map((p) => (
                        <tr 
                          key={p.uuid}
                          onClick={() => {
                            setSelectedParticipant({ uuid: p.uuid, name: p.name, avatar: p.avatar });
                            setDashboardViewType('apprenant');
                          }}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="p-4">
                            <input type="checkbox" className="w-4 h-4 rounded" onClick={(e) => e.stopPropagation()} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  p.name?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-medium whitespace-nowrap">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">{p.email}</td>
                          <td className="p-4 text-gray-500">{p.phone || '-'}</td>
                          <td className="p-4">
                            {p.price ? (
                              <Badge className="bg-cyan-100 text-cyan-700 border-0">{p.price} €</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-500">{p.companyName || '-'}</td>
                          <td className="p-4">
                            {p.successStatus === 'passed' ? (
                              <Badge className="bg-green-100 text-green-700 border-0">Réussi</Badge>
                            ) : p.successStatus === 'failed' ? (
                              <Badge className="bg-red-100 text-red-700 border-0">Échoué</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-500 whitespace-nowrap">{p.enrollmentDate}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewParticipant(p.uuid); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteParticipant(p.uuid); }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">
                          Aucun participant inscrit
                        </td>
                      </tr>
                    )
                  ) : (
                    trainers.length > 0 ? (
                      trainers.map((t) => (
                        <tr 
                          key={t.uuid}
                          onClick={() => {
                            setSelectedParticipant({ uuid: t.uuid, name: t.name });
                            setDashboardViewType('formateur');
                          }}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="p-4">
                            <input type="checkbox" className="w-4 h-4 rounded" onClick={(e) => e.stopPropagation()} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {t.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium whitespace-nowrap">{t.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">{t.email || '-'}</td>
                          <td className="p-4 text-gray-500">-</td>
                          <td className="p-4 text-gray-500 whitespace-nowrap">-</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          Aucun formateur assigné
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SessionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        session={session}
        slots={slots}
        onShowQRCode={handleShowQRCode}
        onShowAttendanceCode={handleShowAttendanceCode}
        onEditAttendance={handleEditAttendance}
        onNavigateToEvaluation={() => {
          setShowDetailsModal(false);
          setViewMode('dashboard');
        }}
      />

      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        session={session}
        slot={selectedSlot || undefined}
        mode={attendanceMode}
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

export default SessionViewPage;
