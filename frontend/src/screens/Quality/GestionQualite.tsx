import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, Users, Newspaper, Award, TrendingUp, Eye, GraduationCap, CheckCircle, Building2, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useQualityInitialization } from '../../hooks/useQualityInitialization';
import { useQualityDashboard } from '../../hooks/useQualityDashboard';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { AddDocumentModal } from '../../components/QualityDashboard/AddDocumentModal';
import { AddEvidenceModal } from '../../components/QualityDashboard/AddEvidenceModal';
import { AddAuditModal } from '../../components/QualityDashboard/AddAuditModal';
import { IndicatorSettingsModal } from '../../components/QualityDashboard/IndicatorSettingsModal';
import { useQualityArticles } from '../../hooks/useQualityArticles';
import { useQualityTasks } from '../../hooks/useQualityTasks';
import { useOrganization } from '../../contexts/OrganizationContext';

export const GestionQualite = (): JSX.Element => {
  const { initialized, loading: initLoading, error: initError, initialize } = useQualityInitialization();
  const { data, loading, error, refetch } = useQualityDashboard(!initialized);
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  
  // Fetch articles separately since they might not be in dashboard response
  const { articles: fetchedArticles, loading: articlesLoading } = useQualityArticles({
    page: 1,
    limit: 5, // Show only 5 recent articles in dashboard
  });
  
  // Fetch recent tasks (Trello-style) for dashboard
  const { tasks: recentTasks, loading: tasksLoading } = useQualityTasks({
    // Get recent tasks (limit to 5 most recent)
  });
  
  // Modal states
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);


  // Show loading while checking initialization
  if (initLoading) {
    return (
      <div className="px-[27px] py-8">
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show initialization prompt if not initialized
  if (!initialized) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#ff7700] bg-white'} rounded-[18px] p-8 text-center max-w-2xl mx-auto`}>
          <div className="mb-6">
            <h2 className="text-4xl font-bold mb-4 bg-[linear-gradient(90deg,rgba(255,119,0,1)_0%,rgba(255,225,0,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Poppins',Helvetica]">
              Bienvenue dans Gestion Qualité! 🎉
            </h2>
            <p className={`text-lg mb-6 [font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
              Cliquez ci-dessous pour initialiser votre système de gestion qualité
            </p>
          </div>
          
          <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-[#fffbef] border-2 border-[#ffe5ca]'} rounded-[18px] p-6 mb-6`}>
            <h3 className={`font-semibold text-xl mb-4 [font-family:'Poppins',Helvetica] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>Ce qui sera créé:</h3>
            <ul className="text-left space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>32 Indicateurs Qualiopi</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>5 Catégories d'actions par défaut</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>Système de gestion de documents</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>Suivi des audits</span>
              </li>
            </ul>
          </div>

          {initError && (
            <div className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-2 border-red-200'} rounded-[18px] p-4 mb-4`}>
              <p className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-red-400' : 'text-red-600'}`}>{initError}</p>
            </div>
          )}

          <Button
            onClick={async () => {
              const success = await initialize();
              if (success) {
                refetch();
              }
            }}
            disabled={initLoading}
            className="h-auto px-8 py-4 text-lg font-semibold bg-[linear-gradient(90deg,rgba(255,119,0,1)_0%,rgba(255,225,0,1)_100%)] text-white rounded-[32px] hover:opacity-90 [font-family:'Poppins',Helvetica]"
          >
            {initLoading ? 'Initialisation...' : 'Initialiser le Système Qualité'}
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading while fetching dashboard
  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <div className="animate-pulse flex gap-7">
          <div className="flex-1 space-y-6">
            <div className={`h-64 rounded-[18px] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className={`h-96 rounded-[18px] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className="grid grid-cols-2 gap-6">
              <div className={`h-96 rounded-[18px] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className={`h-96 rounded-[18px] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
          </div>
          <div className="w-[400px] space-y-6">
            <div className={`h-64 rounded-[18px] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className={`h-64 rounded-[18px] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 ${isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'} rounded-[18px] p-6`}>
          <h3 className={`text-lg font-semibold mb-2 [font-family:'Poppins',Helvetica] ${isDark ? 'text-red-400' : 'text-red-700'}`}>Erreur</h3>
          <p className={`mb-4 [font-family:'Poppins',Helvetica] ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
          <Button onClick={refetch} style={{ backgroundColor: primaryColor }} className="text-white hover:opacity-90">Réessayer</Button>
        </Card>
      </div>
    );
  }

  // Show empty state
  if (!data) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px] p-6 text-center`}>
          <p className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>Aucune donnée disponible</p>
          <Button onClick={refetch} style={{ backgroundColor: primaryColor }} className="mt-4 text-white hover:opacity-90">Actualiser</Button>
        </Card>
      </div>
    );
  }

  // Extract data from API response (only when data exists)
  const qualityIndicators = data?.indicators?.indicatorsList || [];
  const actionTasks = data?.actions?.recentActions || [];
  const recentFiles = data?.recentDocuments || [];
  
  // Tasks data (Trello-style)
  const tasksStats = data?.tasks || {
    total: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0
  };
  const taskCategories = data?.taskCategories || [];
  
  // Use recent tasks from API or fallback to dashboard data
  // Limit to 5 most recent tasks for dashboard display
  const displayTasks = recentTasks.slice(0, 5).length > 0 
    ? recentTasks.slice(0, 5) 
    : actionTasks; // Fallback to old actions if no tasks available
  
  
  // Handle both old 'articles' and new 'qualiopiNews' structure
  // Also fetch articles separately if not in dashboard response
  const dashboardArticles = data?.qualiopiNews || data?.articles || [];
  const articles = (dashboardArticles && dashboardArticles.length > 0) ? dashboardArticles : (fetchedArticles || []);
  
  // Debug: Log articles for troubleshooting
  console.log('📰 Dashboard articles:', {
    dashboardArticles: dashboardArticles?.length || 0,
    fetchedArticles: fetchedArticles?.length || 0,
    finalArticles: articles?.length || 0,
    articlesLoading
  });
  
  // Handle both old 'nextAudit' and new 'auditCountdown' structure
  const nextAudit = data?.nextAudit || (data?.auditCountdown ? {
    id: 0,
    type: "Audit prévu",
    date: data.auditCountdown.date,
    daysRemaining: data.auditCountdown.days,
    status: 'scheduled' as const,
    auditor: data.auditCountdown.auditor ? {
      name: data.auditCountdown.auditor,
      contact: '',
      phone: ''
    } : undefined,
    createdAt: new Date().toISOString()
  } : null);


  return (
    <div style={{
      padding: 'var(--space-6)',
      fontFamily: 'var(--font-primary)',
      minHeight: '100vh'
    }}>
      {/* Page Title Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-[#ecf1fd]'}`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 'var(--font-semibold)',
                fontSize: 'var(--text-3xl)',
                color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
              }}
            >
              Gestion Qualité
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                marginTop: '4px',
                color: isDark ? '#D1D5DB' : 'var(--color-text-secondary)'
              }}
            >
              Tableau de bord de votre système de gestion qualité Qualiopi
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-7)',
        flexWrap: 'wrap'
      }}>
        {/* Main Content */}
        <div className="flex flex-col gap-7 flex-1">
        {/* Quality System Card */}
        <Card style={{
          border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-medium)'}`,
          backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CardHeader style={{ paddingBottom: 'var(--space-6)' }}>
            <CardTitle style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-xl)',
              color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
            }}>
              Système Qualité
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-[29px]">
            {/* Document Stats Donut Chart */}
            <div className="flex flex-col items-center gap-[12.51px]">
              <div className="relative w-[127px] h-[127px]">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="procedureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff7700" />
                      <stop offset="100%" stopColor="#ff9500" />
                    </linearGradient>
                    <linearGradient id="modelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#25c9b5" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                    <linearGradient id="evidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#d7e07f" />
                      <stop offset="100%" stopColor="#e5f3a0" />
                    </linearGradient>
                  </defs>
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e8f0f7"
                    strokeWidth="8"
                  />
                  {/* Calculate percentages */}
                  {(() => {
                    const total = data.overview.totalDocuments || 1;
                    const procedures = data.overview.procedures || 0;
                    const models = data.overview.models || 0;
                    const evidences = data.overview.evidences || 0;
                    
                    const procPercent = (procedures / total) * 100;
                    const modelPercent = (models / total) * 100;
                    const evidencePercent = (evidences / total) * 100;
                    
                    const circumference = 2 * Math.PI * 40;
                    const procOffset = circumference - (procPercent / 100) * circumference;
                    const modelOffset = procOffset - (modelPercent / 100) * circumference;
                    const evidenceOffset = modelOffset - (evidencePercent / 100) * circumference;
                    
                    return (
                      <>
                        {/* Procedures arc */}
                        {procedures > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#procedureGradient)"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={procOffset}
                            strokeLinecap="round"
                          />
                        )}
                        {/* Models arc */}
                        {models > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#modelGradient)"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={modelOffset}
                            strokeLinecap="round"
                          />
                        )}
                        {/* Evidences arc */}
                        {evidences > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#evidenceGradient)"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={evidenceOffset}
                            strokeLinecap="round"
                          />
                        )}
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className={`[font-family:'Poppins',Helvetica] font-semibold text-lg ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {data.overview.totalDocuments}
                    </div>
                  <div className={`[font-family:'Poppins',Helvetica] font-normal text-xs ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    document{data.overview.totalDocuments !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-[5.09px]">
                <div className="flex items-center gap-[6.79px]">
                  <div className="bg-[#ff7700] rounded-full w-2 h-2" />
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[8.6px] ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    {data.overview.procedures} Procédure{data.overview.procedures !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-[6.79px]">
                  <div className="bg-[#25c9b5] rounded-full w-2 h-2" />
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[8.6px] ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    {data.overview.models} Modèle{data.overview.models !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-[6.79px]">
                  <div className="bg-[#d7e07f] rounded-full w-2 h-2" />
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[8.6px] ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    {data.overview.evidences} Preuve{data.overview.evidences !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Types */}
            <div className="flex gap-8 flex-1">
              {/* Procedures */}
              <div className="flex flex-col gap-3.5 flex-1">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#ff7700] rounded-full w-2 h-2" />
                    <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[10.4px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Procédures
                    </span>
                  </div>
                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-xs ${isDark ? 'text-gray-400' : 'text-[#455a85]'}`}>
                    Objectif Qualité : au Moins 1 Modèle Doit Être Associé À Chaque Indicateur.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`h-auto px-3 py-1 rounded-[32px] border-[0.72px] [font-family:'Poppins',Helvetica] font-medium text-[9.1px] ${isDark ? 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600' : 'bg-[#e5f3ff] border-[#007aff] text-[#007aff]'}`}
                  onClick={() => setShowProcedureModal(true)}
                >
                  Ajouter Ma Procédure
                </Button>
              </div>

              {/* Models */}
              <div className="flex flex-col justify-between flex-1">
                <div className="flex flex-col gap-[9px]">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#25c9b5] rounded-full w-2 h-2" />
                    <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[10.4px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Modèles
                    </span>
                  </div>
                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-xs ${isDark ? 'text-gray-400' : 'text-[#455a85]'}`}>
                    Objectif Qualité : au Moins 1 Modèle Doit Être Associé À Chaque Indicateur.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`h-auto px-3 py-1 rounded-[32px] border-[0.72px] [font-family:'Poppins',Helvetica] font-medium text-[9.1px] ${isDark ? 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600' : 'bg-[#e5f3ff] border-[#007aff] text-[#007aff]'}`}
                  onClick={() => setShowModelModal(true)}
                >
                  Ajouter Ma Première Modeles
                </Button>
              </div>

              {/* Evidence */}
              <div className="flex flex-col justify-between flex-1">
                <div className="flex flex-col gap-[9px]">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#d7e07f] rounded-full w-2 h-2" />
                    <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[10.4px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Preuves
                    </span>
                  </div>
                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-xs ${isDark ? 'text-gray-400' : 'text-[#455a85]'}`}>
                    Objectif Qualité : Au Moins 1 Preuve Doit Être Associée À Chaque Indicateur.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`h-auto px-3 py-1 rounded-[32px] border-[0.72px] [font-family:'Poppins',Helvetica] font-medium text-[9.1px] ${isDark ? 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600' : 'bg-[#e5f3ff] border-[#007aff] text-[#007aff]'}`}
                  onClick={() => setShowEvidenceModal(true)}
                >
                  Ajouter Ma Première Preuves
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualiopi Indicators */}
        <Card style={{
          border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-medium)'}`,
          backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CardHeader>
            <CardTitle style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-xl)',
              color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
            }}>
              Indicateurs Qualiopi
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              {qualityIndicators.map((indicator) => {
                // Calculate percentage for this indicator based on applicability
                const isApplicable = indicator.isApplicable !== false;
                const indicatorPercentage = isApplicable ? 100 : 0;
                
                return (
                <div
                  key={indicator.number}
                    onClick={() => navigateToRoute(`/quality/indicateurs/${indicator.id}`)}
                    className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-full border-[3.49px] cursor-pointer transition-all ${
                    indicator.status === 'completed' 
                      ? 'border-[#25c9b5] bg-[#25c9b5]/10' 
                      : 'border-[#e8f0f7] hover:border-[#ff7700]'
                  }`}
                    title={`Indicateur ${indicator.number} - ${indicatorPercentage}% applicable`}
                  >
                    {/* Circular progress indicator */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={isApplicable ? '#007aff' : '#e8f0f7'}
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - indicatorPercentage / 100)}`}
                        className="transition-all"
                      />
                    </svg>
                    <span className={`relative z-10 [font-family:'Poppins',Helvetica] font-semibold text-[12.4px] text-center ${
                      indicator.status === 'completed' ? 'text-[#25c9b5]' : isApplicable ? 'text-[#007aff]' : 'text-gray-400'
                  }`}>
                    {indicator.number}
                  </span>
                  {indicator.hasOverlay && indicator.status === 'completed' && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-[#25c9b5] rounded-full border-2 border-white z-20" />
                  )}
                </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              className={`h-auto px-[14.44px] py-[7.94px] rounded-[5.78px] border-[0.72px] border-dashed self-start ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-[#ebf1ff] border-[#6a90b9]'}`}
              onClick={() => setShowSettingsModal(true)}
            >
              <span className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                Paramètres Des Indicateurs
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Actions & Recent Files Row */}
        <div style={{ display: 'flex', gap: 'var(--space-7)', flexWrap: 'wrap' }}>
          {/* Actions & Tasks */}
          <Card style={{
            border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-medium)'}`,
            backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            flex: '1',
            minWidth: '300px'
          }}>
            <CardHeader>
              <CardTitle style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 'var(--font-medium)',
                fontSize: 'var(--text-base)',
                color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
              }}>
                Les Actions & Taches
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {displayTasks.length > 0 ? (
                displayTasks.map((task: any) => (
                <Card key={task.id} className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-[#d2d2e7] bg-white'} rounded-[14.36px] cursor-pointer hover:border-[#007aff] transition-colors`} onClick={() => navigateToRoute('/quality/actions')}>
                  <CardContent className="p-[18px] flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        {/* For Trello tasks: show category name */}
                        {task.category?.name && (
                          <Badge className="h-auto px-1 py-[3px] bg-[#e8f0f7] rounded-[3.59px] [font-family:'Poppins',Helvetica] font-medium text-slate-800 text-[13px] tracking-[0.20px]">
                            <div className="w-2 h-2 mr-2" style={{ backgroundColor: task.category.color || '#306bff' }} />
                            {task.category.name}
                          </Badge>
                        )}
                        {/* For old actions: show category */}
                        {task.category && !task.category.name && (
                          <Badge className="h-auto px-1 py-[3px] bg-[#e8f0f7] rounded-[3.59px] [font-family:'Poppins',Helvetica] font-medium text-slate-800 text-[13px] tracking-[0.20px]">
                            <div className="w-2 h-2 bg-[#306bff] mr-2" />
                            {task.category}
                          </Badge>
                        )}
                        {task.subcategory && (
                          <Badge className="h-auto px-1 py-[3px] bg-[#e5f3ff] rounded-[3.59px] [font-family:'Inter',Helvetica] font-medium text-[#007aff] text-[10.8px]">
                            {task.subcategory}
                          </Badge>
                        )}
                        {task.priority && (
                          <Badge className="h-auto px-[5px] py-1 bg-[#ffe5ca] rounded-[3.59px] [font-family:'Inter',Helvetica] font-medium text-[#ff7700] text-[10.8px]">
                            {task.priority === 'low' ? 'Faible' : task.priority === 'medium' ? 'Moyenne' : task.priority === 'high' ? 'Élevée' : task.priority === 'urgent' ? 'Urgente' : task.priority}
                          </Badge>
                        )}
                        {/* Show status badge for Trello tasks */}
                        {task.status && task.status !== 'todo' && (
                          <Badge className={`h-auto px-[5px] py-1 rounded-[3.59px] [font-family:'Inter',Helvetica] font-medium text-[10.8px] ${
                            task.status === 'done' ? 'bg-green-100 text-green-800' : 
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status === 'done' ? '✓ Terminée' : task.status === 'in_progress' ? 'En cours' : task.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-[5px]">
                      <h3 className={`[font-family:'Inter',Helvetica] font-semibold text-[16.1px] ${isDark ? 'text-white' : 'text-[#0d062d]'}`}>
                        {task.title}
                      </h3>
                      <p className={`[font-family:'Inter',Helvetica] font-normal text-[10.8px] ${isDark ? 'text-gray-400' : 'text-[#787486]'}`}>
                        {task.description || 'Aucune description'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
              ) : (
                <div className="text-center py-8">
                  <p className={`[font-family:'Poppins',Helvetica] mb-2 ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>Aucune action pour le moment</p>
                  <p className={`text-sm [font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-400' : 'text-[#6a90b9]/70'}`}>Créez votre première action pour commencer</p>
                </div>
              )}

              <Button
                variant="outline"
                className={`h-auto px-[14.44px] py-[7.94px] rounded-[5.78px] border-[0.72px] border-dashed self-start mt-auto ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-[#e5f3ff] border-[#6a90b9]'}`}
                onClick={() => navigateToRoute('/quality/actions')}
              >
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[13px] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                  Voir Tous Les Actions
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Files */}
          <Card style={{
            border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-medium)'}`,
            backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            flex: '1',
            minWidth: '300px'
          }}>
            <CardHeader>
              <CardTitle style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 'var(--font-semibold)',
                fontSize: 'var(--text-xl)',
                color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
              }}>
                Derniers éléments ajoutés
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentFiles.length > 0 ? (
                recentFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-4 p-3 rounded-[10px] border ${isDark ? 'border-gray-600 hover:border-orange-600' : 'border-[#ebf1ff] hover:border-[#ff7700]'} transition-colors cursor-pointer`}
                >
                  <div className={`flex items-center justify-center p-[17px] ${file.bgColor} rounded-xl`}>
                    <span className="text-2xl">📄</span>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <h4 className={`[font-family:'Inter',Helvetica] font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                      {file.name}
                    </h4>
                    {file.indicatorIds ? (
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-[6.97px] px-0 py-[4.18px]">
                          {file.indicatorIds.map((num) => (
                            <div
                              key={num}
                              className="flex items-center justify-center w-4 h-4 bg-[#6a90b9] rounded-full"
                            >
                              <span className="[font-family:'Poppins',Helvetica] font-semibold text-white text-[7.4px] text-center">
                                {num}
                              </span>
                            </div>
                          ))}
                        </div>
                        {file.showIndicatorCount && (
                          <span className={`[font-family:'Inter',Helvetica] font-semibold text-xs ${isDark ? 'text-gray-400' : 'text-[#00000066]'}`}>
                            +3 Indicateurs
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5">
                        <span className={`[font-family:'Inter',Helvetica] font-semibold text-xs ${isDark ? 'text-gray-400' : 'text-[#00000066]'}`}>
                          {file.type.toUpperCase()}
                        </span>
                        {file.size && (
                          <span className={`[font-family:'Inter',Helvetica] font-semibold text-xs ${isDark ? 'text-gray-400' : 'text-[#00000066]'}`}>
                            {file.size}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-8">
                  <p className={`[font-family:'Poppins',Helvetica] mb-2 ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>Aucun document pour le moment</p>
                  <p className={`text-sm [font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-400' : 'text-[#6a90b9]/70'}`}>Téléchargez votre premier document pour commencer</p>
                </div>
              )}

              <Button
                variant="outline"
                className={`h-auto px-[14.44px] py-[7.94px] rounded-[5.78px] border-[0.72px] border-dashed self-start mt-4 ${isDark ? 'bg-gray-700 border-blue-500 hover:bg-gray-600' : 'bg-[#e5f3ff] border-[#007aff]'}`}
                onClick={() => setShowEvidenceModal(true)}
              >
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[13px] ${isDark ? 'text-blue-400' : 'text-[#007aff]'}`}>
                  Ajouter Un Éléments
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Right Sidebar */}
      <aside style={{
        width: 'var(--container-right)',
        minWidth: '280px',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-7)'
      }}>
        {/* Next Audit */}
        {nextAudit ? (
          <Card style={{
            border: `2px solid ${isDark ? '#4B5563' : 'var(--color-success)'}`,
            backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <CardHeader>
              <CardTitle style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 'var(--font-semibold)',
                fontSize: 'var(--text-xl)',
                textAlign: 'center',
                color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
              }}>
                Prochain audit
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className={`flex items-center justify-center px-6 py-0.5 rounded-[18px] ${isDark ? 'bg-orange-900/40' : 'bg-[#ffe5ca]'}`}>
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${isDark ? 'text-orange-400' : 'text-[#ff7700]'}`}>
                  J- {nextAudit.daysRemaining}
                </span>
              </div>

              <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-700' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {nextAudit.type}
                    </span>
                    <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                      {new Date(nextAudit.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {nextAudit.auditor && (
                      <span className={`[font-family:'Poppins',Helvetica] font-normal text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                        {nextAudit.auditor.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAuditModal(true)}>
                      📝
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAuditModal(true)}>
                      📅
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        ) : (
          <Card style={{
            border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-medium)'}`,
            backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <CardHeader>
              <CardTitle style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 'var(--font-semibold)',
                fontSize: 'var(--text-xl)',
                textAlign: 'center',
                color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
              }}>
                Prochain audit
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className={`[font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>Aucun audit programmé</p>
              <Button style={{ backgroundColor: primaryColor }} className="mt-4 text-white hover:opacity-90" onClick={() => setShowAuditModal(true)}>Planifier un audit</Button>
            </CardContent>
          </Card>
        )}

        {/* Articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="flex items-center justify-between">
            <h2 style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-xl)',
              color: isDark ? '#FFFFFF' : 'var(--color-text-primary)'
            }}>
              Article
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {articlesLoading && articles.length === 0 ? (
            <Card style={{
              border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-light)'}`,
              backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <CardContent className="p-8 text-center">
                <p style={{
                  fontFamily: 'var(--font-primary)',
                  color: isDark ? '#D1D5DB' : 'var(--color-text-secondary)'
                }}>Chargement des articles...</p>
              </CardContent>
            </Card>
          ) : articles.length > 0 ? (
            articles.map((article: any) => {
              // Format date if needed
              const articleDate = article.date || (article.created_at ? new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '');
              const articleCategory = article.category || 'Article';
              const articleTitle = article.title || 'Sans titre';
              const articleDescription = article.description || '';
              
              // Get icon for category
              const getCategoryIcon = (category: string) => {
                const cat = category.toLowerCase();
                if (cat.includes('rncp')) return Award;
                if (cat.includes('accompagnement')) return Users;
                if (cat.includes('veille')) return TrendingUp;
                if (cat.includes('qualiopi')) return CheckCircle;
                if (cat.includes('audit')) return Eye;
                if (cat.includes('formation')) return GraduationCap;
                if (cat.includes('vae') || cat.includes('validation')) return FileText;
                if (cat.includes('organisme') || cat.includes('cfa')) return Building2;
                return Newspaper;
              };
              
              const CategoryIcon = getCategoryIcon(articleCategory);
              const hasImage = article.image && article.image.trim() !== '';
              
              return (
              <Card
                  key={article.id || article.uuid}
                  style={{
                    border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-light)'}`,
                    backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover:shadow-md"
                  onClick={() => {
                    if (article.url) {
                      window.open(article.url, '_blank');
                    } else {
                      navigateToRoute(`/quality/articles/${article.id || article.uuid}`);
                    }
                  }}
              >
                <CardContent className="p-4 flex flex-col gap-4">
                  {article.featured ? (
                    <>
                        {hasImage ? (
                          <div className="w-full h-[187.28px] rounded-2xl overflow-hidden">
                            <img 
                              src={article.image.startsWith('http') ? article.image : `http://localhost:8000${article.image}`}
                              alt={articleTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Replace with default image on error
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent && !parent.querySelector('.default-icon')) {
                                  const defaultDiv = document.createElement('div');
                                  defaultDiv.className = `w-full h-full ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-100 to-blue-200'} flex items-center justify-center default-icon`;
                                  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                  iconSvg.setAttribute('class', `w-16 h-16 ${isDark ? 'text-blue-400' : 'text-blue-400'}`);
                                  iconSvg.setAttribute('fill', 'none');
                                  iconSvg.setAttribute('stroke', 'currentColor');
                                  iconSvg.setAttribute('viewBox', '0 0 24 24');
                                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('stroke-linecap', 'round');
                                  path.setAttribute('stroke-linejoin', 'round');
                                  path.setAttribute('stroke-width', '2');
                                  path.setAttribute('d', 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z');
                                  iconSvg.appendChild(path);
                                  defaultDiv.appendChild(iconSvg);
                                  parent.appendChild(defaultDiv);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`w-full h-[187.28px] rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-100 to-blue-200'} flex items-center justify-center`}>
                            <CategoryIcon className={`w-16 h-16 ${isDark ? 'text-blue-400' : 'text-blue-400'}`} />
                          </div>
                        )}
                      <div className="flex flex-col gap-4">
                        <Badge className={`h-auto w-fit ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-[#007aff]'}`}>
                            {articleCategory}
                        </Badge>
                        <div className="flex flex-col gap-1">
                          <span className={`[font-family:'Inter',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                              {articleDate}
                          </span>
                          <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                              {articleTitle}
                          </h3>
                            {articleDescription && (
                          <p className={`[font-family:'Inter',Helvetica] font-normal text-sm line-clamp-3 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                                {articleDescription}
                          </p>
                            )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3.5">
                        {hasImage ? (
                          <div className="w-[71px] h-[75px] rounded-2xl overflow-hidden flex-shrink-0">
                            <img 
                              src={article.image.startsWith('http') ? article.image : `http://localhost:8000${article.image}`}
                              alt={articleTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Replace with default image on error
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent && !parent.querySelector('.default-icon')) {
                                  parent.className = 'w-[71px] h-[75px] rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 flex items-center justify-center';
                                  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                  icon.setAttribute('class', 'w-8 h-8 text-blue-400 default-icon');
                                  icon.setAttribute('fill', 'none');
                                  icon.setAttribute('stroke', 'currentColor');
                                  icon.setAttribute('viewBox', '0 0 24 24');
                                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('stroke-linecap', 'round');
                                  path.setAttribute('stroke-linejoin', 'round');
                                  path.setAttribute('stroke-width', '2');
                                  path.setAttribute('d', 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z');
                                  icon.appendChild(path);
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-[71px] h-[75px] rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 flex items-center justify-center">
                            <CategoryIcon className="w-8 h-8 text-blue-400" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                          <span className={`[font-family:'Inter',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                              {articleDate}
                          </span>
                          <Badge className={`h-auto w-fit text-xs ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-[#007aff]'}`}>
                              {articleCategory}
                          </Badge>
                        </div>
                          <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] line-clamp-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                            {articleTitle}
                        </h3>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })
          ) : (
            <Card style={{
              border: `2px solid ${isDark ? '#4B5563' : 'var(--color-border-light)'}`,
              backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-white)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <CardContent className="p-8 text-center">
                <p style={{
                  fontFamily: 'var(--font-primary)',
                  marginBottom: 'var(--space-2)',
                  color: isDark ? '#D1D5DB' : 'var(--color-text-secondary)'
                }}>Aucun article pour le moment</p>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-primary)',
                  color: isDark ? '#9CA3AF' : 'var(--color-text-tertiary)',
                  opacity: '0.7'
                }}>Les articles apparaîtront ici</p>
              </CardContent>
            </Card>
          )}
        </div>
      </aside>
      </div>

      {/* Modals */}
      <AddDocumentModal
        isOpen={showProcedureModal}
        onClose={() => setShowProcedureModal(false)}
        type="procedure"
        onSuccess={async () => {
          setShowProcedureModal(false);
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 300));
          await refetch();
        }}
      />
      <AddDocumentModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        type="model"
        onSuccess={async () => {
          setShowModelModal(false);
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 300));
          await refetch();
        }}
      />
      <AddEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        onSuccess={async () => {
          setShowEvidenceModal(false);
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 300));
          await refetch();
        }}
      />
      <AddAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onSuccess={() => {
          refetch();
          setShowAuditModal(false);
        }}
      />
      <IndicatorSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSuccess={() => {
          refetch();
          setShowSettingsModal(false);
        }}
      />
    </div>
  );
};


