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
  TrendingUp,
  FileText,
  Mail,
  X,
  Check
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
import { courseSessionService } from '../../services/courseSession';

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

// Gauge/Speedometer Component - Exact Figma Design (red left → blue right)
const GaugeChart: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
}> = ({ value, size = 180, strokeWidth = 24, showValue = true }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size - strokeWidth) / 2 - 10;
  
  // Calculate needle angle (0% = 180° left, 100% = 0° right)
  const needleAngle = 180 - (percentage / 100) * 180;
  const needleLength = radius - 15;
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
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 40 }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Red segment (0-25%) - LEFT */}
        <path
          d={describeArc(180, 135)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Orange segment (25-50%) */}
        <path
          d={describeArc(135, 90)}
          fill="none"
          stroke="#f97316"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Green segment (50-75%) */}
        <path
          d={describeArc(90, 45)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Blue segment (75-100%) - RIGHT */}
        <path
          d={describeArc(45, 0)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#374151"
          strokeWidth="4"
          strokeLinecap="round"
          className="drop-shadow-sm"
        />
        {/* Needle center circle */}
        <circle cx={centerX} cy={centerY} r="10" fill="#374151" className="drop-shadow-sm" />
        <circle cx={centerX} cy={centerY} r="6" fill="#6b7280" />
      </svg>
      
      {/* Value display */}
      {showValue && (
        <div className="text-3xl font-bold text-[#0066FF] -mt-2">
          {value}%
        </div>
      )}
    </div>
  );
};

// Line Chart Component - With Gradient Fill like Figma
const LineChart: React.FC<{
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
  showGrid?: boolean;
}> = ({ data, height = 120, color = '#22c55e', showGrid = true }) => {
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
  
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Create smooth curve path using quadratic bezier
  const smoothPath = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    
    if (i === 0) return `M ${x},${y}`;
    
    const prevX = ((i - 1) / (chartData.length - 1)) * 100;
    const prevY = 100 - ((chartData[i - 1].value - minValue) / range) * 100;
    const cpX = (prevX + x) / 2;
    
    return `Q ${cpX},${prevY} ${x},${y}`;
  }).join(' ');

  const areaPath = `${smoothPath} L 100,100 L 0,100 Z`;

  return (
    <div className="w-full relative rounded-xl overflow-hidden" style={{ height, backgroundColor: '#f8fafc' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`lineGradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="50%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {showGrid && [0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Area fill with gradient */}
        <path
          d={areaPath}
          fill={`url(#lineGradient-${color.replace('#', '')})`}
        />
        
        {/* Smooth curved line */}
        <path
          d={smoothPath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
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
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  
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

      // Load individual statistics if participant is selected
      if (participant?.uuid) {
        try {
          if (viewType === 'apprenant') {
            const statsResponse = await courseSessionService.getParticipantStatistics(session.uuid, participant.uuid);
            if (statsResponse.success && statsResponse.data) {
              const stats = statsResponse.data;
              setParticipantStats({
                evaluationsRepondus: stats.evaluations_repondus || 0,
                tauxRecommandation: stats.taux_recommandation || 0,
                tauxRpanseQuestion: stats.taux_reponse_question || 0,
                tauxReussite: stats.taux_reussite || 0,
                tauxSatisfaction: stats.taux_satisfaction || 0,
                dureeMoyenneConnexion: stats.duree_moyenne_connexion || '0min',
                tauxAssiduite: stats.taux_assiduite || 0,
                presenceHistory: stats.presence_history || []
              });
            }
          } else if (viewType === 'formateur') {
            const statsResponse = await courseSessionService.getTrainerStatistics(session.uuid, participant.uuid);
            if (statsResponse.success && statsResponse.data) {
              const stats = statsResponse.data;
              setTrainerStats({
                clarteExplications: stats.clarte_explications || 0,
                maitriseSubjet: stats.maitrise_sujet || 0,
                pedagogie: stats.pedagogie || 0,
                rythmeAdaptation: stats.rythme_adaptation || 0,
                disponibiliteEcoute: stats.disponibilite_ecoute || 0,
                qualiteSupports: stats.qualite_supports || 0,
                miseEnPratique: stats.mise_en_pratique || 0
              });
            }
          }
        } catch (err) {
          console.warn('Stats endpoint not available yet:', err);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [session.uuid, participant?.uuid, viewType]);

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
        
        {/* Session title - shows override if set */}
        <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
          {session.title}
        </h1>
        
        {/* Show course title if different (session has custom title) */}
        {session.title !== session.courseTitle && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Cours : {session.courseTitle}
            </span>
            <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">
              Titre personnalisé
            </Badge>
          </div>
        )}
        
        {/* Reference code if available */}
        {session.referenceCode && (
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Réf: {session.referenceCode}
          </p>
        )}
        
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Session :
          </span>
          <Badge className={`border-0 rounded-full px-3 ${
            session.status === 'terminée' ? 'bg-gray-100 text-gray-600' :
            session.status === 'en_cours' ? 'bg-[#e8f5e9] text-[#2e7d32]' :
            'bg-blue-100 text-blue-600'
          }`}>
            {session.status === 'terminée' ? 'Terminée' : 
             session.status === 'en_cours' ? 'En-cours' : 'À venir'}
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
              <div className="flex justify-center py-2">
                <GaugeChart 
                  value={participantStats.tauxAssiduite} 
                  size={140} 
                  strokeWidth={14}
                  showValue={true}
                />
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
                  onClick={() => {
                    setShowDateFilter(!showDateFilter);
                    setShowStatusFilter(false);
                  }}
                >
                  {dateFilter || 'Date'}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {showDateFilter && (
                  <div className={`absolute top-full mt-2 w-48 rounded-xl shadow-lg border z-20 p-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setShowDateFilter(false);
                      }}
                      className="w-full"
                    />
                    {dateFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateFilter('');
                          setShowDateFilter(false);
                        }}
                        className="w-full mt-2"
                      >
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl"
                  onClick={() => {
                    setShowStatusFilter(!showStatusFilter);
                    setShowDateFilter(false);
                  }}
                >
                  {statusFilter === 'all' ? 'Status' : statusFilter === 'remplis' ? 'Remplis' : 'Pas Remplis'}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {showStatusFilter && (
                  <div className={`absolute top-full mt-2 w-40 rounded-xl shadow-lg border z-20 p-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {['all', 'remplis', 'pas_remplis'].map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status as any);
                          setShowStatusFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          statusFilter === status
                            ? 'bg-blue-100 text-blue-600'
                            : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {status === 'all' ? 'Tous' : status === 'remplis' ? 'Remplis' : 'Pas Remplis'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Questionnaire Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionnaires
                .filter(q => {
                  const matchesSearch = !searchQuery || 
                    q.title.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || 
                    (statusFilter === 'remplis' && q.status === 'remplis') ||
                    (statusFilter === 'pas_remplis' && q.status === 'pas_remplis');
                  return matchesSearch && matchesStatus;
                })
                .map((q) => (
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
        {activeTab === 'quiz' && viewType === 'apprenant' && participant && (
          <QuizTabContent 
            isDark={isDark} 
            primaryColor={primaryColor}
            sessionUuid={session.uuid}
            participantUuid={participant.uuid}
          />
        )}

        {/* Tab Content - Evaluation (for apprenant only) */}
        {activeTab === 'evaluation' && viewType === 'apprenant' && participant && (
          <EvaluationTabContent 
            isDark={isDark} 
            primaryColor={primaryColor}
            sessionUuid={session.uuid}
            participantUuid={participant.uuid}
          />
        )}

        {/* Tab Content - Suivi E-Mail */}
        {activeTab === 'suivi_email' && (
          <EmailTrackingTabContent 
            isDark={isDark} 
            primaryColor={primaryColor} 
            viewType={viewType}
            sessionUuid={session.uuid}
            participantUuid={viewType === 'apprenant' ? participant?.uuid : undefined}
            trainerUuid={viewType === 'formateur' ? participant?.uuid : undefined}
          />
        )}
      </div>
    </div>
  );
};

// Quiz Tab Component - Connected to API
const QuizTabContent: React.FC<{ 
  isDark: boolean; 
  primaryColor: string;
  sessionUuid: string;
  participantUuid: string;
}> = ({ isDark, sessionUuid, participantUuid }) => {
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<ChapterQuizSummary[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!sessionUuid || !participantUuid) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await courseSessionService.getParticipantQuizzes(sessionUuid, participantUuid);
        if (response.success && response.data) {
          const data = response.data;
          const chaptersData = data.chapters || [];
          setChapters(chaptersData.map((ch: any) => ({
            chapterId: ch.chapter_uuid,
            chapterTitle: ch.chapter_title,
            slotInfo: ch.slot_info,
            averageScore: ch.average_score,
            maxScore: ch.max_score,
            quizzes: ch.quizzes || []
          })));
        } else {
          setChapters([]);
        }
      } catch (err) {
        console.warn('Quizzes endpoint not available:', err);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuizzes();
  }, [sessionUuid, participantUuid]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Aucun quiz disponible
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Les résultats des quiz de l'apprenant apparaîtront ici une fois qu'ils seront complétés.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quiz content will be displayed here when data is available */}
    </div>
  );
};

// Evaluation Tab Component - Connected to API
const EvaluationTabContent: React.FC<{ 
  isDark: boolean; 
  primaryColor: string;
  sessionUuid: string;
  participantUuid: string;
}> = ({ isDark, sessionUuid, participantUuid }) => {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<SessionEvaluation[]>([]);

  useEffect(() => {
    const loadEvaluations = async () => {
      if (!sessionUuid || !participantUuid) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await courseSessionService.getParticipantEvaluations(sessionUuid, participantUuid);
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          setEvaluations(data.map((evaluation: any) => ({
            uuid: evaluation.uuid,
            title: evaluation.title,
            type: evaluation.type === 'devoir' ? 'devoir' : 'examen',
            chapterTitle: evaluation.chapter_title,
            subChapterTitle: evaluation.sub_chapter_title,
            dueDate: evaluation.due_date,
            status: evaluation.status === 'corrigé' ? 'corrigé' : 
                   evaluation.status === 'envoyé' ? 'envoyé' : 'pas_envoyé',
            studentSubmission: evaluation.student_submission ? {
              submittedAt: evaluation.student_submission.submitted_at,
              fileUrl: evaluation.student_submission.file_url,
              isLate: evaluation.student_submission.is_late
            } : undefined,
            correction: evaluation.correction ? {
              correctedAt: evaluation.correction.corrected_at,
              correctedBy: evaluation.correction.corrected_by,
              fileUrl: evaluation.correction.file_url
            } : undefined
          })));
        } else {
          setEvaluations([]);
        }
      } catch (err) {
        console.warn('Evaluations endpoint not available:', err);
        setEvaluations([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvaluations();
  }, [sessionUuid, participantUuid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Aucune évaluation disponible
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Les devoirs et examens de l'apprenant apparaîtront ici une fois qu'ils seront disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Evaluations will be displayed here when data is available */}
    </div>
  );
};

// Email Tracking Tab Component - Connected to API
const EmailTrackingTabContent: React.FC<{ 
  isDark: boolean; 
  primaryColor: string; 
  viewType: 'apprenant' | 'formateur';
  sessionUuid: string;
  participantUuid?: string;
  trainerUuid?: string;
}> = ({ isDark, sessionUuid, participantUuid, trainerUuid, viewType }) => {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<SessionEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadEmails = async () => {
      if (!sessionUuid) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        let response;
        if (viewType === 'apprenant' && participantUuid) {
          response = await courseSessionService.getParticipantEmails(sessionUuid, participantUuid);
        } else if (viewType === 'formateur' && trainerUuid) {
          response = await courseSessionService.getTrainerEmails(sessionUuid, trainerUuid);
        } else {
          setEmails([]);
          setLoading(false);
          return;
        }
        
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          setEmails(data.map((email: any) => ({
            uuid: email.uuid,
            date: email.date,
            time: email.time,
            recipient: email.recipient || { name: '', email: '' },
            type: email.type,
            subject: email.subject,
            status: email.status === 'planifié' ? 'planifié' :
                   email.status === 'envoyé' ? 'envoyé' :
                   email.status === 'reçu_et_ouvert' ? 'reçu_et_ouvert' : 'échec',
            openedAt: email.opened_at,
            attachments: email.attachments || []
          })));
        } else {
          setEmails([]);
        }
      } catch (err) {
        console.warn('Emails endpoint not available:', err);
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmails();
  }, [sessionUuid, participantUuid, trainerUuid, viewType]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const filteredEmails = emails.filter(email => 
    !searchQuery ||
    email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.recipient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.recipient?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (emails.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
        <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Aucun email envoyé
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          {viewType === 'apprenant' 
            ? "L'historique des emails envoyés à l'apprenant apparaîtra ici (convocations, rappels, etc.)."
            : "L'historique des emails envoyés au formateur apparaîtra ici."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher un email"
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

      {/* Table with real data */}
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
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Pièce jointe</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Sujet</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email) => (
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
                    {email.attachments.length > 0 && (
                      <>
                        <Badge className="bg-gray-100 text-gray-600 border-0 text-xs gap-1">
                          📄 {email.attachments[0]?.name}
                        </Badge>
                        {email.attachments.length > 1 && (
                          <Badge className="bg-blue-100 text-blue-600 border-0 text-xs">
                            +{email.attachments.length - 1}
                          </Badge>
                        )}
                      </>
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
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun email trouvé'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionDashboard;

