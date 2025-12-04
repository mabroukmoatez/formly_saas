/**
 * SessionDashboard Component
 * Main dashboard showing session statistics for apprenant or formateur
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  Filter, 
  Download,
  ChevronDown,
  Eye,
  Send,
  RefreshCw,
  Star,
  Info,
  Clock,
  ThumbsUp,
  MessageSquare,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import type { 
  SessionData, 
  ParticipantStats, 
  TrainerStats,
  SessionQuestionnaire,
  SessionQuiz,
  SessionEvaluation,
  SessionEmail,
  ChapterQuizSummary
} from './types';
import { sessionCreation } from '../../services/sessionCreation';

// Circular Progress Component
const CircularProgress: React.FC<{
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showPercentage?: boolean;
  label?: string;
}> = ({ 
  value, 
  maxValue = 100, 
  size = 100, 
  strokeWidth = 8, 
  color = '#0066FF',
  bgColor = '#E8F3FF',
  showPercentage = true,
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold" style={{ color }}>
          {showPercentage ? `${Math.round(percentage)}%` : value}
        </span>
      </div>
    </div>
  );
};

// Gauge/Speedometer Component  
const GaugeChart: React.FC<{
  value: number;
  size?: number;
}> = ({ value, size = 160 }) => {
  const percentage = Math.min(value, 100);
  const angle = (percentage / 100) * 180;
  
  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc segments */}
        <path
          d={`M 10 ${size / 2} A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size / 2 - 20} 15`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={`M ${size / 2 - 15} 12 A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size / 2 + 15} 12`}
          fill="none"
          stroke="#f97316"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={`M ${size / 2 + 20} 15 A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="#22c55e"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={`M ${size - 10} ${size / 2} A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size - 25} ${size / 2 - 25}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + (size / 2 - 30) * Math.cos((180 - angle) * Math.PI / 180)}
          y2={size / 2 - (size / 2 - 30) * Math.sin((180 - angle) * Math.PI / 180)}
          stroke="#374151"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={size / 2} cy={size / 2} r="8" fill="#374151" />
      </svg>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-[#0066FF]">
        {value}%
      </div>
    </div>
  );
};

// Line Chart Component
const LineChart: React.FC<{
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
}> = ({ data, height = 120, color = '#22c55e' }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 100);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#lineGradient)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  value: string | number;
  valueColor?: string;
  children?: React.ReactNode;
  className?: string;
  isDark: boolean;
}> = ({ icon, iconBgColor, title, value, valueColor = '#0066FF', children, className = '', isDark }) => (
  <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBgColor }}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</span>
    </div>
    {children || (
      <div className="text-3xl font-bold" style={{ color: valueColor }}>{value}</div>
    )}
  </div>
);

interface SessionDashboardProps {
  session: SessionData;
  participant?: {
    uuid: string;
    name: string;
    avatar?: string;
  };
  viewType: 'apprenant' | 'formateur';
  onTabChange?: (tab: string) => void;
}

export const SessionDashboard: React.FC<SessionDashboardProps> = ({
  session,
  participant,
  viewType,
  onTabChange
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';
  
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'quiz' | 'evaluation' | 'suivi_email'>('questionnaire');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Data loading states
  const [loading, setLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<SessionQuestionnaire[]>([]);
  const [participantStats, setParticipantStats] = useState<ParticipantStats>({
    evaluationsRepondus: 0,
    tauxRecommandation: 0,
    tauxRpanseQuestion: 0,
    tauxReussite: 0,
    tauxSatisfaction: 0,
    dureeMoyenneConnexion: '0min',
    tauxAssiduite: 0,
    presenceHistory: []
  });
  const [trainerStats, setTrainerStats] = useState<TrainerStats>({
    clarteExplications: 0,
    maitriseSubjet: 0,
    pedagogie: 0,
    rythmeAdaptation: 0,
    disponibiliteEcoute: 0,
    qualiteSupports: 0,
    miseEnPratique: 0
  });

  // Load data from API
  const loadDashboardData = useCallback(async () => {
    if (!session.uuid) return;
    
    setLoading(true);
    try {
      // Load questionnaires
      const questionnairesResponse = await sessionCreation.getSessionQuestionnaires(session.uuid);
      if (questionnairesResponse.success && questionnairesResponse.data) {
        const apiQuestionnaires = Array.isArray(questionnairesResponse.data) 
          ? questionnairesResponse.data 
          : [];
        
        const transformedQuestionnaires: SessionQuestionnaire[] = apiQuestionnaires.map((q: any) => ({
          uuid: q.uuid || q.id,
          title: q.title || q.name || 'Questionnaire',
          type: q.type || 'evaluation',
          status: q.is_completed || q.status === 'completed' ? 'remplis' : 'pas_remplis',
          filledAt: q.completed_at || q.filled_at,
          thumbnail: q.thumbnail_url || q.thumbnail,
          questionsCount: q.questions_count || q.questionsCount
        }));
        
        setQuestionnaires(transformedQuestionnaires);
        
        // Calculate stats from questionnaires
        const filledCount = transformedQuestionnaires.filter(q => q.status === 'remplis').length;
        const totalCount = transformedQuestionnaires.length;
        
        setParticipantStats(prev => ({
          ...prev,
          evaluationsRepondus: filledCount,
          tauxRpanseQuestion: totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0
        }));
      }

      // Try to load additional stats if available
      // These endpoints may not exist yet, so we handle errors gracefully
      try {
        // If there's a stats endpoint, use it
        // const statsResponse = await sessionCreation.getSessionStats(session.uuid);
        // For now, we'll calculate what we can from available data
      } catch {
        // Stats endpoint doesn't exist yet
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [session.uuid]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs = viewType === 'apprenant' 
    ? ['questionnaire', 'quiz', 'evaluation', 'suivi_email'] as const
    : ['questionnaire', 'suivi_email'] as const;

  // Show loading indicator
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
      {/* Header */}
      <div className="text-center py-6">
        {participant && (
          <div className="flex items-center justify-center gap-3 mb-4">
            {participant.avatar ? (
              <img src={participant.avatar} alt={participant.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                {participant.name.charAt(0)}
              </div>
            )}
            <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {participant.name}
            </span>
          </div>
        )}
        
        <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
          {session.courseTitle}
        </h1>
        
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Session :
          </span>
          <Badge className="bg-[#e8f5e9] text-[#2e7d32] border-0 rounded-full px-3">
            En-cours
          </Badge>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            📅 {session.startDate} - 📅 {session.endDate}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Modalités :</span>
          <Badge className="bg-[#e8f5e9] text-[#2e7d32] border-0 rounded-full px-3">
            🌐 {session.mode}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 pb-6">
        {viewType === 'apprenant' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Row 1 */}
            <div className="space-y-4">
              <StatsCard
                icon={<CheckCircle className="w-4 h-4 text-[#2e7d32]" />}
                iconBgColor="#e8f5e9"
                title="Evaluations Répondus"
                value={participantStats.evaluationsRepondus}
                isDark={isDark}
              />
              <StatsCard
                icon={<MessageSquare className="w-4 h-4 text-[#e53935]" />}
                iconBgColor="#ffebee"
                title="Taux De Rpanse De Qustion"
                value={`${participantStats.tauxRpanseQuestion}%`}
                valueColor="#e53935"
                isDark={isDark}
              />
              <StatsCard
                icon={<TrendingUp className="w-4 h-4 text-[#1976d2]" />}
                iconBgColor="#e3f2fd"
                title="Taux De Réussite"
                value={`${participantStats.tauxReussite}%`}
                valueColor="#1976d2"
                isDark={isDark}
              />
            </div>

            {/* Taux de Recommandation */}
            <StatsCard
              icon={<Star className="w-4 h-4 text-[#ff9800]" />}
              iconBgColor="#fff3e0"
              title="Taux De Recommandation"
              value=""
              isDark={isDark}
            >
              <div className="flex justify-center mt-2">
                <CircularProgress 
                  value={participantStats.tauxRecommandation} 
                  color="#ff9800"
                  bgColor="#fff3e0"
                  size={100}
                />
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                  <span>Taux De Satisfaction</span>
                </div>
                <div className="flex justify-center mt-2">
                  <CircularProgress 
                    value={participantStats.tauxSatisfaction} 
                    color="#22c55e"
                    bgColor="#e8f5e9"
                    size={80}
                  />
                </div>
              </div>
            </StatsCard>

            {/* Durée Moyenne */}
            <StatsCard
              icon={<Clock className="w-4 h-4 text-[#ff9800]" />}
              iconBgColor="#fff3e0"
              title="Durée Moyenne De Connexion / Présence"
              value=""
              isDark={isDark}
              className="col-span-1"
            >
              <div className="text-4xl font-bold text-[#22c55e] mb-4">
                {participantStats.dureeMoyenneConnexion}
              </div>
              <LineChart 
                data={participantStats.presenceHistory || []} 
                color="#22c55e"
                height={80}
              />
              <Info className="w-4 h-4 text-gray-400 absolute top-4 right-4" />
            </StatsCard>

            {/* Taux d'assiduité */}
            <StatsCard
              icon={<ThumbsUp className="w-4 h-4 text-[#1976d2]" />}
              iconBgColor="#e3f2fd"
              title="Taux D'assiduité"
              value=""
              isDark={isDark}
            >
              <div className="text-4xl font-bold text-[#0066FF] mb-2 text-center">
                {participantStats.tauxAssiduite}%
              </div>
              <div className="flex justify-center">
                <GaugeChart value={participantStats.tauxAssiduite} size={140} />
              </div>
            </StatsCard>
          </div>
        ) : (
          /* Trainer Stats */
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                icon={<CheckCircle className="w-4 h-4 text-[#2e7d32]" />}
                iconBgColor="#e8f5e9"
                title="Clarté Des Explications Du Formateur."
                value={`${trainerStats.clarteExplications}%`}
                valueColor="#22c55e"
                isDark={isDark}
              />
              <StatsCard
                icon={<TrendingUp className="w-4 h-4 text-[#e53935]" />}
                iconBgColor="#ffebee"
                title="Maîtrise Du Sujet Par Le Formateur"
                value={`${trainerStats.maitriseSubjet}%`}
                valueColor="#ff9800"
                isDark={isDark}
              />
              <StatsCard
                icon={<Users className="w-4 h-4 text-[#1976d2]" />}
                iconBgColor="#e3f2fd"
                title="Pédagogie & Accompagnement (Méthodes, Feedbacks, Reformulations)."
                value={`${trainerStats.pedagogie}%`}
                valueColor="#0066FF"
                isDark={isDark}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'Rythme & Adaptation Au Niveau Du Groupe.', value: trainerStats.rythmeAdaptation, color: '#ff9800' },
                { title: 'Disponibilité & Écoute (Réponses Aux Questions, Bienveillance)', value: trainerStats.disponibiliteEcoute, color: '#22c55e' },
                { title: 'Qualité Des Supports & Démonstrations (Utilité, Lisibilité).', value: trainerStats.qualiteSupports, color: '#ff9800' },
                { title: 'Mise En Pratique (Exercices, Cas Concrets, Transférabilité).', value: trainerStats.miseEnPratique, color: '#22c55e' },
              ].map((stat, idx) => (
                <StatsCard
                  key={idx}
                  icon={<Star className="w-4 h-4" style={{ color: stat.color }} />}
                  iconBgColor={stat.color === '#22c55e' ? '#e8f5e9' : '#fff3e0'}
                  title={stat.title}
                  value=""
                  isDark={isDark}
                >
                  <div className="flex justify-center mt-2">
                    <CircularProgress 
                      value={stat.value} 
                      color={stat.color}
                      bgColor={stat.color === '#22c55e' ? '#e8f5e9' : '#fff3e0'}
                      size={90}
                    />
                  </div>
                </StatsCard>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {tabs.map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => handleTabChange(tab)}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                activeTab === tab 
                  ? 'text-white shadow-md' 
                  : isDark ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-300'
              }`}
              style={activeTab === tab ? { backgroundColor: primaryColor } : {}}
            >
              {tab === 'questionnaire' && 'Questionnaire'}
              {tab === 'quiz' && 'Quiz'}
              {tab === 'evaluation' && 'Evaluation'}
              {tab === 'suivi_email' && 'Suivi E-Mail'}
            </Button>
          ))}
        </div>

        {/* Tab Content - Questionnaire */}
        {activeTab === 'questionnaire' && (
          <div>
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher Par Nom Du Questionnaire"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 h-10 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                />
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  Date
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  Status
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Questionnaire Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionnaires.map((q) => (
                <div 
                  key={q.uuid}
                  className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail placeholder */}
                    <div className="w-24 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <div className="space-y-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-1 bg-blue-300 rounded" style={{ width: `${60 - i * 10}px` }} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {q.title}
                      </h3>
                      {q.status === 'pas_remplis' ? (
                        <span className="text-red-500 text-sm">Pas Remplis</span>
                      ) : (
                        <span className="text-green-500 text-sm">Replis le : {q.filledAt}</span>
                      )}
                      
                      <div className="mt-2">
                        {q.status === 'pas_remplis' ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs rounded-full gap-1 text-red-500 bg-red-50 hover:bg-red-100 border-0"
                          >
                            Relancer
                            <Send className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs rounded-full gap-1"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Eye className="w-3 h-3" />
                            Apercu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content - Quiz (for apprenant only) */}
        {activeTab === 'quiz' && viewType === 'apprenant' && (
          <QuizTabContent isDark={isDark} primaryColor={primaryColor} />
        )}

        {/* Tab Content - Evaluation (for apprenant only) */}
        {activeTab === 'evaluation' && viewType === 'apprenant' && (
          <EvaluationTabContent isDark={isDark} primaryColor={primaryColor} />
        )}

        {/* Tab Content - Suivi E-Mail */}
        {activeTab === 'suivi_email' && (
          <EmailTrackingTabContent isDark={isDark} primaryColor={primaryColor} viewType={viewType} />
        )}
      </div>
    </div>
  );
};

// Quiz Tab Component
const QuizTabContent: React.FC<{ isDark: boolean; primaryColor: string }> = ({ isDark, primaryColor }) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(new Set());

  const chapters: ChapterQuizSummary[] = [
    {
      chapterId: '1',
      chapterTitle: 'Design Basics',
      slotInfo: 'Séance : 2/12',
      averageScore: 8,
      maxScore: 17,
      quizzes: [
        {
          uuid: 'q1',
          title: 'La Diffirance Entre Adobe Et Canva',
          chapterId: '1',
          chapterTitle: 'Design Basics',
          answeredAt: '08/04/2025',
          score: 4,
          maxScore: 13,
          questions: [
            {
              uuid: 'qq1',
              text: 'What Is The Software Used For Vector',
              type: 'multiple',
              points: 0,
              maxPoints: 1,
              isCorrect: false,
              options: [
                { uuid: 'o1', text: 'Adobe Photoshop', isCorrect: false, isSelected: true },
                { uuid: 'o2', text: 'Adobe Illustrator', isCorrect: true, isSelected: true },
                { uuid: 'o3', text: 'Adobe Indesign', isCorrect: false, isSelected: false },
              ]
            },
            {
              uuid: 'qq2',
              text: 'Select The Mascot Logo From These Logos',
              type: 'single',
              points: 4,
              maxPoints: 4,
              isCorrect: true,
              options: [
                { uuid: 'o4', text: 'Image 1', isCorrect: false, isSelected: false },
                { uuid: 'o5', text: 'Image 2', isCorrect: true, isSelected: true },
                { uuid: 'o6', text: 'Image 3', isCorrect: false, isSelected: false },
                { uuid: 'o7', text: 'Image 4', isCorrect: false, isSelected: false },
              ]
            },
            {
              uuid: 'qq3',
              text: 'Photoshop Is The Best Tool For Photo Editing',
              type: 'true_false',
              points: 0,
              maxPoints: 5,
              isCorrect: false,
              options: [
                { uuid: 'o8', text: 'Vrais', isCorrect: true, isSelected: false },
                { uuid: 'o9', text: 'Faus', isCorrect: false, isSelected: true },
              ]
            }
          ]
        }
      ]
    },
    {
      chapterId: '2',
      chapterTitle: 'Ui Ux Basics',
      slotInfo: 'Séance : 4/12',
      averageScore: 12,
      maxScore: 14,
      quizzes: []
    }
  ];

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleQuiz = (id: string) => {
    setExpandedQuizzes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {chapters.map(chapter => (
        <div key={chapter.chapterId} className={`rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          {/* Chapter Header */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleChapter(chapter.chapterId)}
          >
            <div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Chapitre {chapter.chapterId} | {chapter.chapterTitle}
              </span>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {chapter.slotInfo}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Moyenne</span>
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                {String(chapter.averageScore).padStart(2, '0')}<span className="text-gray-400">/{chapter.maxScore}</span>
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedChapters.has(chapter.chapterId) ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Chapter Content */}
          {expandedChapters.has(chapter.chapterId) && chapter.quizzes.map(quiz => (
            <div key={quiz.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Quiz Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleQuiz(quiz.uuid)}
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-[#fff3e0] text-[#ff9800] border-0 font-semibold">QUIZ</Badge>
                  <div>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{quiz.title}</span>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Date De Réponse : {quiz.answeredAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Note</span>
                  <span className="text-xl font-bold" style={{ color: primaryColor }}>
                    {String(quiz.score).padStart(2, '0')}<span className="text-gray-400">/{quiz.maxScore}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedQuizzes.has(quiz.uuid) ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Quiz Questions */}
              {expandedQuizzes.has(quiz.uuid) && (
                <div className={`px-4 pb-4 space-y-4 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  {quiz.questions.map((q, qIdx) => (
                    <div key={q.uuid} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Question {qIdx + 1} : {q.text}
                          </span>
                          {q.type === 'multiple' && <span className="text-red-500 text-sm">{'{After Click}'}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${q.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} border-0`}>
                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Barem : {q.points}/{q.maxPoints}
                      </div>
                      
                      {/* Options */}
                      <div className="space-y-2 ml-4">
                        {q.options.map(opt => (
                          <div 
                            key={opt.uuid}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              opt.isCorrect && opt.isSelected
                                ? 'bg-green-100 border border-green-300'
                                : opt.isSelected && !opt.isCorrect
                                ? 'bg-red-50 border border-red-200'
                                : opt.isCorrect
                                ? 'bg-green-50 border border-green-200'
                                : isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                opt.isCorrect ? 'border-green-500 bg-green-500' : opt.isSelected ? 'border-red-500' : 'border-gray-300'
                              }`}>
                                {opt.isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <span className={opt.isCorrect ? 'text-green-700' : opt.isSelected && !opt.isCorrect ? 'text-red-600' : ''}>
                                {opt.text}
                              </span>
                            </div>
                            {opt.isSelected && (
                              <Badge className="bg-blue-100 text-blue-600 border-0 text-xs">
                                Étudiant Sélectionné
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Evaluation Tab Component
const EvaluationTabContent: React.FC<{ isDark: boolean; primaryColor: string }> = ({ isDark, primaryColor }) => {
  const evaluations: SessionEvaluation[] = [
    { uuid: '1', title: "Titre De L'evaluation 1", type: 'devoir', chapterTitle: 'Titre de Chapitre', subChapterTitle: 'Titre de sous Chapitre', dueDate: '2025-05-28', status: 'pas_envoyé' },
    { uuid: '2', title: "Titre De L'evaluation 2", type: 'examen', chapterTitle: 'Titre de Chapitre', subChapterTitle: 'Titre de sous Chapitre', dueDate: '2025-05-28', status: 'pas_envoyé' },
    { uuid: '3', title: "Titre De L'evaluation 3", type: 'examen', chapterTitle: 'Titre de Chapitre', subChapterTitle: 'Titre de sous Chapitre', dueDate: '2025-05-28', status: 'envoyé', studentSubmission: { submittedAt: '29/05/2025', isLate: true } },
    { uuid: '4', title: "Titre De L'evaluation 4", type: 'devoir', chapterTitle: 'Titre de Chapitre', subChapterTitle: 'Titre de sous Chapitre', dueDate: '2025-05-28', status: 'envoyé', studentSubmission: { submittedAt: '10/12/2025' } },
    { uuid: '5', title: "Titre De L'evaluation 5", type: 'devoir', chapterTitle: 'Titre de Chapitre', subChapterTitle: 'Titre de sous Chapitre', dueDate: '2025-05-28', status: 'corrigé', studentSubmission: { submittedAt: '10/12/2025' }, correction: { correctedAt: '10/12/2025', correctedBy: 'Nom De Formateur' } },
  ];

  return (
    <div className="space-y-4">
      {evaluations.map(evaluation => (
        <div 
          key={evaluation.uuid}
          className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {evaluation.title}
                  </span>
                  <Badge className={`${evaluation.type === 'devoir' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'} border-0 text-xs`}>
                    {evaluation.type === 'devoir' ? 'Devoir' : 'Examin'}
                  </Badge>
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Chapitre : {evaluation.chapterTitle} | Sous Chapitre : {evaluation.subChapterTitle}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Date D'échéance : {evaluation.dueDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Student submission column */}
              <div className="text-center min-w-[180px]">
                {evaluation.status === 'pas_envoyé' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 text-xs rounded-lg gap-1 ${isDark ? 'border-gray-600' : ''}`}
                      disabled
                    >
                      <Download className="w-3 h-3" />
                      Télécharger Documment
                    </Button>
                    <div className="text-red-500 text-xs mt-1 flex items-center justify-center gap-1">
                      Pas Envoyé
                      <Button size="sm" variant="ghost" className="h-5 p-0 text-red-500 hover:text-red-600">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Relancer
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs rounded-lg gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Télécharger Document
                    </Button>
                    <div className={`text-xs mt-1 ${evaluation.studentSubmission?.isLate ? 'text-red-500' : 'text-green-500'}`}>
                      Envoyé par l'étudiant : {evaluation.studentSubmission?.submittedAt}
                      {evaluation.studentSubmission?.isLate && (
                        <Badge className="bg-red-100 text-red-600 border-0 ml-1 text-xs">Retard</Badge>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Correction column */}
              <div className="text-center min-w-[180px]">
                {evaluation.status === 'corrigé' ? (
                  <>
                    <Button
                      size="sm"
                      className="h-8 text-xs rounded-lg gap-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Download className="w-3 h-3" />
                      Télécharger Document
                    </Button>
                    <div className="text-green-500 text-xs mt-1">
                      corrigé par : {evaluation.correction?.correctedBy} {evaluation.correction?.correctedAt}
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 text-xs rounded-lg gap-1 ${isDark ? 'border-gray-600' : ''}`}
                      disabled
                    >
                      <Download className="w-3 h-3" />
                      Télécharger Documment
                    </Button>
                    <div className="text-red-500 text-xs mt-1 flex items-center justify-center gap-1">
                      Pas corrigé
                      {evaluation.status === 'envoyé' && (
                        <Button size="sm" variant="ghost" className="h-5 p-0 text-red-500 hover:text-red-600">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Relancer
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Email Tracking Tab Component
const EmailTrackingTabContent: React.FC<{ isDark: boolean; primaryColor: string; viewType: 'apprenant' | 'formateur' }> = ({ isDark, primaryColor, viewType }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const emails: SessionEmail[] = [
    { uuid: '1', date: '2025-09-24', time: '10:12', recipient: { name: 'Jean Dupont', email: 'Contact.Benadra@Gmail.Com' }, type: "Convocation Lien D'emargement", subject: 'Convocation À La Formation...', status: 'planifié', attachments: [{ uuid: 'a1', name: 'facture.pdf', type: 'pdf' }] },
    { uuid: '2', date: '2025-09-24', time: '10:12', recipient: { name: 'Jean Dupont', email: 'Contact.Benadra@Gmail.Com' }, type: "Convocation Lien D'emargement", subject: 'Convocation À La Formation...', status: 'envoyé', attachments: [{ uuid: 'a2', name: 'Convoca...', type: 'pdf' }, { uuid: 'a3', name: '', type: 'pdf' }, { uuid: 'a4', name: '', type: 'pdf' }, { uuid: 'a5', name: '', type: 'pdf' }] },
    { uuid: '3', date: '2025-09-24', time: '10:12', recipient: { name: 'Jean Dupont', email: 'Contact.Benadra@Gmail.Com' }, type: "Convocation Lien D'emargement", subject: 'Convocation À La Formation...', status: 'reçu_et_ouvert', openedAt: '17/10/2025 03:19', attachments: [{ uuid: 'a6', name: 'facture.pdf', type: 'pdf' }] },
    { uuid: '4', date: '2025-09-24', time: '10:12', recipient: { name: 'Jean Dupont', email: 'Contact.Benadra@Gmail.Com' }, type: "Convocation Lien D'emargement", subject: 'Convocation À La Formation...', status: 'envoyé', attachments: [{ uuid: 'a7', name: 'facture.pdf', type: 'pdf' }] },
    { uuid: '5', date: '2025-09-24', time: '10:12', recipient: { name: 'Jean Dupont', email: 'Contact.Benadra@Gmail.Com' }, type: "Convocation Lien D'emargement", subject: 'Convocation À La Formation...', status: 'échec', attachments: [{ uuid: 'a8', name: 'facture.pdf', type: 'pdf' }] },
  ];

  const getStatusBadge = (status: SessionEmail['status']) => {
    switch (status) {
      case 'planifié':
        return <Badge className="bg-blue-100 text-blue-600 border-0">● Planifié</Badge>;
      case 'envoyé':
        return <Badge className="bg-green-100 text-green-600 border-0">● Envoyé</Badge>;
      case 'reçu_et_ouvert':
        return <Badge className="bg-green-100 text-green-600 border-0">● Reçu et ouvert</Badge>;
      case 'échec':
        return <Badge className="bg-red-100 text-red-600 border-0">● Échec</Badge>;
    }
  };

  return (
    <div>
      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Recherche Une Formation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 h-10 rounded-xl w-80 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
          </div>
          <Button variant="outline" className="h-10 gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filtre
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" className="h-10 gap-2 rounded-xl">
          <Download className="w-4 h-4" />
          Export Excel
        </Button>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
        <table className="w-full">
          <thead>
            <tr className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" className="rounded" />
              </th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Date <ChevronDown className="w-4 h-4 inline ml-1" />
              </th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Destinataire</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Type</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Piece Joint</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Sujet</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email, idx) => (
              <tr key={email.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{email.date}</div>
                  <div className="text-xs text-blue-500">{email.time}</div>
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{email.recipient.name}</div>
                  <div className="text-xs text-blue-500">{email.recipient.email}</div>
                </td>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {email.type}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs gap-1">
                      📄 {email.attachments[0]?.name}
                    </Badge>
                    {email.attachments.length > 1 && (
                      <Badge className="bg-blue-100 text-blue-600 border-0 text-xs">
                        +{email.attachments.length - 1}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {email.subject}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(email.status)}
                  {email.openedAt && (
                    <div className="text-xs text-gray-500 mt-1">Le {email.openedAt}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionDashboard;

