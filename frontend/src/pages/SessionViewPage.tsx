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

// Circular Progress for global dashboard
const CircularProgress: React.FC<{ value: number; color?: string; bgColor?: string; size?: number }> = ({ 
  value, color = '#f97316', bgColor = '#ffedd5', size = 80 
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" 
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
          className="transition-all duration-500" />
      </svg>
      <span className="absolute text-lg font-semibold" style={{ color }}>{value}%</span>
    </div>
  );
};

// Gauge Chart - Exact Figma Design (red left → blue right)
const GaugeChart: React.FC<{ value: number; size?: number }> = ({ value, size = 140 }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2 - 5;
  
  // Calculate needle angle (0% = 180° left, 100% = 0° right)
  const needleAngle = 180 - (percentage / 100) * 180;
  const needleLength = radius - 10;
  const needleX = centerX + needleLength * Math.cos(needleAngle * Math.PI / 180);
  const needleY = centerY - needleLength * Math.sin(needleAngle * Math.PI / 180);
  
  // Arc path helper - draw clockwise (0 1 instead of 0 0)
  const describeArc = (startAngle: number, endAngle: number) => {
    const start = {
      x: centerX + radius * Math.cos(Math.PI * startAngle / 180),
      y: centerY - radius * Math.sin(Math.PI * startAngle / 180)
    };
    const end = {
      x: centerX + radius * Math.cos(Math.PI * endAngle / 180),
      y: centerY - radius * Math.sin(Math.PI * endAngle / 180)
    };
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 30 }}>
      <svg width={size} height={size / 2 + 15} viewBox={`0 0 ${size} ${size / 2 + 15}`}>
        {/* Red segment (0-25%) - LEFT */}
        <path d={describeArc(180, 135)} fill="none" stroke="#ef4444" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Orange segment (25-50%) */}
        <path d={describeArc(135, 90)} fill="none" stroke="#f97316" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Green segment (50-75%) */}
        <path d={describeArc(90, 45)} fill="none" stroke="#22c55e" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Blue segment (75-100%) - RIGHT */}
        <path d={describeArc(45, 0)} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth} strokeLinecap="round" />
        
        {/* Needle */}
        <line x1={centerX} y1={centerY} x2={needleX} y2={needleY} stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <circle cx={centerX} cy={centerY} r="8" fill="#374151" />
        <circle cx={centerX} cy={centerY} r="4" fill="#6b7280" />
      </svg>
      <div className="text-2xl font-bold text-[#0066FF] -mt-1">{value}%</div>
    </div>
  );
};

// Line Chart with gradient - Figma style (no mocked data)
const LineChartSmall: React.FC<{ data?: Array<{ value: number }>; color?: string; height?: number }> = ({ 
  data, color = '#22c55e', height = 80 
}) => {
  // Return empty state if no data
  if (!data || data.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl" 
        style={{ height }}
      >
        Données non disponibles
      </div>
    );
  }
  
  const chartData = data;
  const maxValue = Math.max(...chartData.map(d => d.value), 100);
  const minValue = Math.min(...chartData.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const smoothPath = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    if (i === 0) return `M ${x},${y}`;
    const prevX = ((i - 1) / (chartData.length - 1)) * 100;
    const prevY = 100 - ((chartData[i - 1].value - minValue) / range) * 100;
    return `Q ${(prevX + x) / 2},${prevY} ${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height, backgroundColor: '#f8fafc' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
        ))}
        <path d={`${smoothPath} L 100,100 L 0,100 Z`} fill="url(#chartGradient)" />
        <path d={smoothPath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
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
  const [workflowActions, setWorkflowActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Statistics state (from API)
  const [sessionStats, setSessionStats] = useState<{
    tauxRecommandation: number;
    dureeMoyenneConnexion: string;
    tauxAssiduite: number;
    presenceHistory: Array<{ value: number }>;
  }>({
    tauxRecommandation: 0,
    dureeMoyenneConnexion: '-',
    tauxAssiduite: 0,
    presenceHistory: []
  });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');

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
  // Uses override values when available, otherwise falls back to course values
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

    // Use override values if available, otherwise use course values
    // title_override is set → use apiSession.title (which contains the override)
    // title_override is null → apiSession.title might still have value from display_title
    const effectiveTitle = apiSession.title || apiSession.display_title || apiSession.course?.title || '';
    const courseOriginalTitle = apiSession.course?.title || apiSession.display_title || '';
    
    // Check if values are inherited or overridden
    const apiData = apiSession as any;
    const titleInherited = apiData.title_inherited !== false; // Default to inherited if not specified
    const descriptionInherited = apiData.description_inherited !== false;
    const priceInherited = apiData.pricing?.price_inherited !== false;

    return {
      uuid: apiSession.uuid,
      // Session's effective title (override or inherited)
      title: effectiveTitle,
      // Original course title for reference
      courseTitle: courseOriginalTitle,
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
      image: apiSession.image_url || apiSession.course?.image_url,
      // Override indicators
      titleInherited,
      descriptionInherited,
      priceInherited,
      // Reference code
      referenceCode: apiData.reference_code,
      // Description and price (with override support)
      description: apiSession.description || apiData.course?.description,
      priceHT: apiSession.pricing?.effective_price 
        ? parseFloat(apiSession.pricing.effective_price) 
        : apiData.pricing?.price_ht
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
    console.log('Transforming slots:', apiSlots);
    
    return apiSlots.map((s: any, index) => {
      const getSlotStatus = (): SessionSlot['status'] => {
        const status = s.status?.toLowerCase();
        if (status === 'completed') return 'effectuée';
        if (status === 'in_progress') return 'en_cours';
        if (status === 'cancelled') return 'terminée';
        if (status === 'scheduled') return 'à_venir';
        return 'à_venir';
      };

      const getSlotMode = (): SessionSlot['mode'] => {
        const type = s.instance_type?.toLowerCase();
        if (type === 'presentiel') return 'présentiel';
        if (type === 'distanciel') return 'distanciel';
        if (type === 'e-learning') return 'e-learning';
        if (type === 'hybrid') return 'hybride';
        return 'présentiel';
      };

      // Default attendance - will be loaded from API when slot is expanded
      const totalParticipants = slotParticipants.length;

      return {
        uuid: s.uuid,
        slotNumber: index + 1,
        title: s.title || `Séance ${index + 1}`,
        description: s.description,
        // Date formats - handle both API formats
        date: formatDate(s.start_date),
        start_date: s.start_date,
        startTime: s.start_time || '09:00',
        start_time: s.start_time,
        endTime: s.end_time || '17:00',
        end_time: s.end_time,
        status: getSlotStatus(),
        mode: getSlotMode(),
        instance_type: s.instance_type,
        // Location info
        location: s.location_room,
        location_room: s.location_room,
        location_address: s.location_address,
        location_city: s.location_city,
        address: s.location_address ? `${s.location_address}${s.location_city ? ', ' + s.location_city : ''}` : null,
        // Online info
        meeting_link: s.meeting_link,
        platform_type: s.platform_type,
        // Trainer info
        trainer_uuids: s.trainer_uuids || [],
        trainers: s.trainers || [],
        // Attendance placeholders
        attendance: {
          morning: { present: 0, total: totalParticipants, percentage: 0 },
          afternoon: { present: 0, total: totalParticipants, percentage: 0 }
        },
        // Map participants for this slot
        participants: slotParticipants.map(p => ({
          uuid: p.uuid,
          name: p.name,
          email: p.email,
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

      // Extract workflow actions from session if available (override)
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

      // 3. Load slots (séances)
      try {
        console.log('Loading slots for session:', sessionUuid);
        const slotsResponse = await courseSessionService.getSlots(sessionUuid);
        console.log('Slots API response:', slotsResponse);
        
        if (slotsResponse.success && slotsResponse.data) {
          // API returns { data: { session: {...}, slots: [...] } } or { data: [...] }
          const responseData = slotsResponse.data as any;
          const slotsData = responseData.slots || responseData;
          const slotsList = Array.isArray(slotsData) ? slotsData : [];
          
          console.log('Slots loaded:', slotsList.length, 'slots');
          
          setSlots(transformSlots(slotsList, loadedParticipants));
        }
      } catch (err) {
        console.warn('Impossible de charger les séances via API dédiée:', err);
        // Fallback: Use slots from session response if available
        if (apiSession.slots && apiSession.slots.length > 0) {
          console.log('Using slots from session response:', apiSession.slots.length, 'slots');
          setSlots(transformSlots(apiSession.slots, loadedParticipants));
        } else {
          console.log('No slots found');
          setSlots([]);
        }
      }

      // 4. Load session statistics
      try {
        const statsResponse = await courseSessionService.getSessionStatistics(sessionUuid);
        if (statsResponse.success && statsResponse.data) {
          const stats = statsResponse.data as any;
          setSessionStats({
            tauxRecommandation: stats.taux_recommandation_global || stats.tauxRecommandation || 0,
            dureeMoyenneConnexion: stats.duree_moyenne_connexion_global || stats.dureeMoyenneConnexion || '-',
            tauxAssiduite: stats.taux_assiduite_global || stats.tauxAssiduite || 0,
            presenceHistory: stats.presence_history || stats.presenceHistory || []
          });
        }
      } catch (err) {
        console.warn('Impossible de charger les statistiques:', err);
        // Keep default values
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
            {/* Session Title - shows override if set */}
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0095A8]'}`}>
              {session.title}
            </h1>
            
            {/* Show course title if different (i.e., session has custom title) */}
            {session.title !== session.courseTitle && (
              <p className="text-sm text-gray-500 mt-1">
                Cours : {session.courseTitle}
                <Badge className="ml-2 bg-orange-100 text-orange-600 border-0 text-xs">
                  Titre personnalisé
                </Badge>
              </p>
            )}
            
            {/* Reference code if available */}
            {(session as any).referenceCode && (
              <p className="text-xs text-gray-400 mt-1">
                Réf: {(session as any).referenceCode}
              </p>
            )}
            
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

          {/* KPIs globaux - Exact Figma Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* 1. Nombres d'apprenants */}
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Nombres D'apprenants</span>
              </div>
              <p className="text-4xl font-bold text-green-500">{participants.length}</p>
            </div>
            
            {/* 2. Taux De Recommandation avec cercle */}
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm text-gray-500">Taux De Recommandation</span>
              </div>
              <div className="flex justify-center">
                <CircularProgress value={sessionStats.tauxRecommandation} color="#f97316" bgColor="#fff3e0" size={90} />
              </div>
            </div>
            
            {/* 3. Durée Moyenne De Connexion avec graphique */}
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} relative`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Durée Moyenne De Connexion</span>
                <button className="ml-auto text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeWidth="2" d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
              </div>
              <p className="text-3xl font-bold text-green-500 mb-3">{sessionStats.dureeMoyenneConnexion}</p>
              {sessionStats.presenceHistory.length > 0 ? (
                <LineChartSmall data={sessionStats.presenceHistory} color="#22c55e" height={70} />
              ) : (
                <div className="h-[70px] flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl">
                  Données non disponibles
                </div>
              )}
            </div>
            
            {/* 4. Taux D'assiduité avec gauge */}
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} relative`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Taux D'assiduité</span>
                <button className="ml-auto text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeWidth="2" d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-center">
                <GaugeChart value={sessionStats.tauxAssiduite} size={130} />
              </div>
            </div>
          </div>

          {/* Liste des participants/formateurs */}
          <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            {/* Toggle Apprenant/Formateur + Export */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <Input 
                  placeholder={dashboardViewType === 'apprenant' ? "Recherche Apprenants" : "Recherche Formateurs"}
                  className="w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    (() => {
                      const filteredParticipants = participants.filter(p => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          (p.name && p.name.toLowerCase().includes(query)) ||
                          (p.email && p.email.toLowerCase().includes(query)) ||
                          (p.phone && p.phone.toLowerCase().includes(query)) ||
                          (p.company && p.company.toLowerCase().includes(query)) ||
                          (p.companyName && p.companyName.toLowerCase().includes(query))
                        );
                      });
                      return filteredParticipants.length > 0 ? (
                      filteredParticipants.map((p) => (
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
                          {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun participant inscrit'}
                        </td>
                      </tr>
                    );
                    })()
                  ) : (
                    (() => {
                      const filteredTrainers = trainers.filter(t => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          (t.name && t.name.toLowerCase().includes(query)) ||
                          (t.email && t.email.toLowerCase().includes(query))
                        );
                      });
                      return filteredTrainers.length > 0 ? (
                      filteredTrainers.map((t) => (
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
                          {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun formateur assigné'}
                        </td>
                      </tr>
                    );
                    })()
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
        sessionUuid={sessionUuid}
        slots={slots}
        trainers={trainers}
        workflowActions={workflowActions}
        onShowQRCode={handleShowQRCode}
        onShowAttendanceCode={handleShowAttendanceCode}
        onEditAttendance={handleEditAttendance}
        onRefresh={loadSessionData}
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
