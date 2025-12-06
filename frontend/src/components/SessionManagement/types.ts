/**
 * Session Management Types
 * Complete type definitions for the session management system
 */

// ============ Core Types ============

export interface SessionParticipant {
  uuid: string;
  user_uuid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  company?: string;
  companyName?: string;
  status: 'registered' | 'confirmed' | 'attended' | 'completed' | 'cancelled';
  enrollmentDate: string;
  price?: number;
  successStatus?: 'réussi' | 'échoué' | 'en_cours' | null;
  formationsCount?: number;
  role?: 'apprenant' | 'formateur';
}

export interface SessionTrainer {
  uuid: string;
  user_uuid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  specialization?: string;
  date?: string;
}

export interface SessionSlot {
  uuid: string;
  slotNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'terminée' | 'en_cours' | 'effectuée' | 'à_venir';
  mode: 'présentiel' | 'distanciel' | 'e-learning' | 'hybride';
  location?: string;
  address?: string;
  meetingLink?: string;
  attendance: {
    morning: { present: number; total: number; percentage: number };
    afternoon: { present: number; total: number; percentage: number };
  };
  trainerSigned?: boolean;
  trainerSignedAt?: string;
  participants?: SlotParticipantAttendance[];
}

export interface SlotParticipantAttendance {
  uuid: string;
  name: string;
  morningPresent: boolean;
  morningSignedAt?: string;
  afternoonPresent: boolean;
  afternoonSignedAt?: string;
}

export interface SessionQuestionnaire {
  uuid: string;
  title: string;
  type: 'satisfaction' | 'evaluation' | 'pre-formation' | 'post-formation';
  status: 'pas_remplis' | 'remplis' | 'en_attente';
  filledAt?: string;
  thumbnail?: string;
  questionsCount?: number;
}

export interface SessionQuiz {
  uuid: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  slotNumber?: number;
  slotDate?: string;
  score: number;
  maxScore: number;
  answeredAt?: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  uuid: string;
  text: string;
  type: 'single' | 'multiple' | 'true_false';
  points: number;
  maxPoints: number;
  isCorrect: boolean;
  options: QuizOption[];
  studentAnswer?: string[];
  correctAnswer?: string[];
}

export interface QuizOption {
  uuid: string;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
  imageUrl?: string;
}

export interface SessionEvaluation {
  uuid: string;
  title: string;
  type: 'devoir' | 'examen';
  chapterTitle: string;
  subChapterTitle?: string;
  dueDate: string;
  status: 'pas_envoyé' | 'envoyé' | 'corrigé';
  studentSubmission?: {
    submittedAt?: string;
    fileUrl?: string;
    isLate?: boolean;
  };
  correction?: {
    correctedAt?: string;
    correctedBy?: string;
    fileUrl?: string;
  };
}

export interface SessionEmail {
  uuid: string;
  date: string;
  time: string;
  recipient: {
    name: string;
    email: string;
  };
  type: string;
  subject: string;
  status: 'planifié' | 'envoyé' | 'reçu_et_ouvert' | 'échec';
  openedAt?: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  uuid: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
}

export interface WorkflowAction {
  uuid: string;
  title: string;
  type: 'envoi_questionnaire' | 'envoi_document' | 'notification' | 'autre';
  targetType: 'formateur' | 'apprenant' | 'entreprise';
  status: 'en_attente' | 'exécuté' | 'non_exécuté';
  executedAt?: string;
  questionnairesCount?: number;
  attachmentsCount?: number;
}

// ============ Statistics Types ============

export interface ParticipantStats {
  evaluationsRepondus: number;
  tauxRecommandation: number;
  tauxRpanseQuestion: number;
  tauxReussite: number;
  tauxSatisfaction: number;
  dureeMoyenneConnexion: string;
  tauxAssiduite: number;
  presenceHistory?: Array<{ date: string; value: number }>;
}

export interface TrainerStats {
  clarteExplications: number;
  maitriseSubjet: number;
  pedagogie: number;
  rythmeAdaptation: number;
  disponibiliteEcoute: number;
  qualiteSupports: number;
  miseEnPratique: number;
}

export interface ChapterQuizSummary {
  chapterId: string;
  chapterTitle: string;
  slotInfo: string;
  averageScore: number;
  maxScore: number;
  quizzes: SessionQuiz[];
}

// ============ Session Data Types ============

export interface SessionData {
  uuid: string;
  title: string;
  courseTitle: string;
  courseUuid: string;
  status: 'à_venir' | 'en_cours' | 'terminée';
  startDate: string;
  endDate: string;
  mode: 'présentiel' | 'distanciel' | 'e-learning' | 'hybride';
  maxParticipants: number;
  currentParticipants: number;
  trainers: SessionTrainer[];
  duration?: string;
  durationDays?: number;
  image?: string;
  modules?: number;
  // Override indicators
  referenceCode?: string;
  titleInherited?: boolean;
  descriptionInherited?: boolean;
  priceInherited?: boolean;
  // Override values (when different from course)
  description?: string;
  priceHT?: number;
}

// ============ Filter Types ============

export interface SessionFilters {
  formation: string;
  formateur: string;
  status: 'all' | 'à venir' | 'en cours' | 'terminée';
  type: 'all' | 'présentiel' | 'distanciel' | 'e-learning' | 'hybride';
  startDate?: string;
  endDate?: string;
}

// ============ Calendar Types ============

export interface CalendarSession {
  uuid: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: 'présentiel' | 'distanciel' | 'e-learning' | 'hybride';
  color: string;
}

// ============ Modal Props Types ============

export interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  onNavigateToEvaluation?: () => void;
}

export interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  slot?: SessionSlot;
  mode: 'qr' | 'code';
}

export interface AttendanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: SlotParticipantAttendance;
  onSave: (data: { present: boolean; reason?: string }) => void;
}

// ============ Component Props Types ============

export interface SessionDashboardProps {
  sessionUuid: string;
  participantUuid?: string;
  viewType: 'apprenant' | 'formateur';
}

export interface SessionListViewProps {
  sessions: SessionData[];
  loading?: boolean;
  onView: (uuid: string) => void;
  onEdit: (uuid: string) => void;
  onDelete: (uuid: string) => void;
  onCreateSession: () => void;
  selectedSessions?: string[];
  onSelectionChange?: (uuids: string[]) => void;
}

export interface SessionCalendarViewProps {
  sessions: CalendarSession[];
  currentDate: Date;
  viewMode: 'month' | 'week';
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: 'month' | 'week') => void;
  onSessionClick: (session: CalendarSession) => void;
  onDayClick?: (date: Date, sessions: CalendarSession[]) => void;
}

export interface CourseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (courseUuid: string, dates: { startDate: string; endDate: string }) => void;
}

