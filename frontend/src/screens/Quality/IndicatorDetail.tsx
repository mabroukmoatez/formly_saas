import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getIndicatorDocuments, getQualityIndicators, getSessionParticipantsForQuality, getQualitySessions, downloadQualityDocument } from '../../services/qualityManagement';
import { useQualityIndicator } from '../../hooks/useQualityIndicator';
import { Loader2, ArrowLeft, Download, Eye, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Users, Calendar, FileText, Trash2, Info, X, ZoomIn } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useOrganization } from '../../contexts/OrganizationContext';
import { AddDocumentModal } from '../../components/QualityDashboard/AddDocumentModal';
import { AddEvidenceModal } from '../../components/QualityDashboard/AddEvidenceModal';
import { QualityIndicator } from '../../services/qualityManagement';
import { apiService } from '../../services/api';

export const IndicatorDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [documentType, setDocumentType] = useState<'procedure' | 'model' | 'evidence' | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  
  const indicatorId = id ? parseInt(id) : 0;
  const { indicator, loading, error, refetch } = useQualityIndicator(indicatorId);
  const [documents, setDocuments] = useState<any>({
    procedures: [],
    models: [],
    evidences: [],
  });
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [allIndicators, setAllIndicators] = useState<QualityIndicator[]>([]);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  
  // Expandable states for hierarchical structure
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionParticipants, setSessionParticipants] = useState<Record<string, any[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState<Record<string, boolean>>({});
  const [coursesData, setCoursesData] = useState<Record<string, any>>({});
  
  // Collapsible states for indicator sections
  const [expandedIndicatorSections, setExpandedIndicatorSections] = useState<Set<string>>(new Set(['indicateur-commun'])); // Open by default
  const [expandedDocumentSections, setExpandedDocumentSections] = useState<Set<string>>(new Set(['preuves'])); // Preuves open by default
  const [showImage, setShowImage] = useState(true); // Image visible par défaut
  const [showImageZoom, setShowImageZoom] = useState(false); // Modal de zoom
  const [imageLoading, setImageLoading] = useState(true); // État de chargement de l'image
  const [imageError, setImageError] = useState(false); // Erreur de chargement de l'image
  
  // Track last loaded indicator ID to prevent duplicate calls
  const lastLoadedIndicatorId = useRef<number | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  // Load documents - memoized to prevent unnecessary re-renders
  const loadDocuments = useCallback(async (force = false) => {
    if (!indicatorId) return;
    
    // Prevent duplicate calls unless forced (e.g., after user action)
    if (!force && (indicatorId === lastLoadedIndicatorId.current || isLoadingRef.current)) {
      return;
    }
    
    lastLoadedIndicatorId.current = indicatorId;
    isLoadingRef.current = true;
    setLoadingDocuments(true);
    try {
      const [proceduresRes, modelsRes, evidencesRes] = await Promise.all([
        getIndicatorDocuments(indicatorId, 'procedure'),
        getIndicatorDocuments(indicatorId, 'model'),
        getIndicatorDocuments(indicatorId, 'evidence'),
      ]);

      // Handle different response structures
      const extractDocuments = (res: any, type: string) => {
        console.log(`🔍 Extracting ${type} documents from response:`, res);
        
        if (!res) {
          console.warn(`⚠️ Empty response for ${type}`);
          return [];
        }
        
        // Case 1: { documents: [...] } - Direct documents array at root (current API structure)
        if (res.documents && Array.isArray(res.documents)) {
          // Filter by type if needed (the API might return all types)
          const filtered = res.documents.filter((doc: any) => doc.type === type);
          console.log(`✅ Found res.documents for ${type}: ${filtered.length} documents (total: ${res.documents.length})`);
          return filtered;
        }
        
        // Case 2: { success: true, data: { documents: [...] } }
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            // Filter by type if needed
            const filtered = res.data.filter((doc: any) => !type || doc.type === type);
            console.log(`✅ Found array in res.data for ${type}:`, filtered.length);
            return filtered;
          }
          if (res.data.documents && Array.isArray(res.data.documents)) {
            const filtered = res.data.documents.filter((doc: any) => !type || doc.type === type);
            console.log(`✅ Found res.data.documents for ${type}:`, filtered.length);
            return filtered;
          }
          if (res.data.data && Array.isArray(res.data.data)) {
            const filtered = res.data.data.filter((doc: any) => !type || doc.type === type);
            console.log(`✅ Found res.data.data for ${type}:`, filtered.length);
            return filtered;
          }
          // Try type-specific fields
          if (res.data.procedures && Array.isArray(res.data.procedures)) {
            console.log(`✅ Found res.data.procedures for ${type}:`, res.data.procedures.length);
            return res.data.procedures;
          }
          if (res.data.models && Array.isArray(res.data.models)) {
            console.log(`✅ Found res.data.models for ${type}:`, res.data.models.length);
            return res.data.models;
          }
          if (res.data.evidences && Array.isArray(res.data.evidences)) {
            console.log(`✅ Found res.data.evidences for ${type}:`, res.data.evidences.length);
            return res.data.evidences;
          }
        }
        
        // Case 3: Direct array
        if (Array.isArray(res)) {
          const filtered = res.filter((doc: any) => !type || doc.type === type);
          console.log(`✅ Found direct array for ${type}:`, filtered.length);
          return filtered;
        }
        
        // Case 4: { data: [...] }
        if (res.data && Array.isArray(res.data)) {
          const filtered = res.data.filter((doc: any) => !type || doc.type === type);
          console.log(`✅ Found res.data array for ${type}:`, filtered.length);
          return filtered;
        }
        
        console.warn(`⚠️ Could not extract documents for ${type}, returning empty array. Response structure:`, JSON.stringify(res, null, 2));
        return [];
      };

      const procedures = extractDocuments(proceduresRes, 'procedure');
      const models = extractDocuments(modelsRes, 'model');
      const evidences = extractDocuments(evidencesRes, 'evidence');
      
      console.log(`📊 Final document counts - Procedures: ${procedures.length}, Models: ${models.length}, Evidences: ${evidences.length}`);
      
      setDocuments({
        procedures,
        models,
        evidences,
      });
    } catch (err) {
      console.error('Error loading documents:', err);
      lastLoadedIndicatorId.current = null; // Reset on error to allow retry
    } finally {
      setLoadingDocuments(false);
      isLoadingRef.current = false;
    }
  }, [indicatorId]);

  // Load documents when indicator changes - only depend on indicatorId
  useEffect(() => {
    if (indicatorId && indicatorId > 0 && indicatorId !== lastLoadedIndicatorId.current && !isLoadingRef.current) {
      loadDocuments(false); // Don't force on initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorId]); // Only depend on indicatorId to prevent loops

  // Load all indicators for sidebar navigation
  useEffect(() => {
    const loadAllIndicators = async () => {
      setLoadingIndicators(true);
      try {
        const response = await getQualityIndicators();
        let indicatorsArray: QualityIndicator[] = [];
        
        if (response && typeof response === 'object') {
          if (response.success === true && response.data) {
            indicatorsArray = response.data.indicators || response.data.data || [];
          } else if (response.indicators && Array.isArray(response.indicators)) {
            indicatorsArray = response.indicators;
          } else if (Array.isArray(response)) {
            indicatorsArray = response;
          } else if (response.data && Array.isArray(response.data)) {
            indicatorsArray = response.data;
          }
        }
        
        setAllIndicators(indicatorsArray);
      } catch (err) {
        console.error('Error loading indicators:', err);
      } finally {
        setLoadingIndicators(false);
      }
    };
    
    loadAllIndicators();
  }, []);

  // Gestion de la touche ESC pour fermer la modal de zoom
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImageZoom) {
        setShowImageZoom(false);
      }
    };

    if (showImageZoom) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body quand la modal est ouverte
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showImageZoom]);

  const handleAddDocument = (type: 'procedure' | 'model') => {
    setDocumentType(type);
    setShowDocumentModal(true);
  };

  const handleAddEvidence = () => {
    setShowEvidenceModal(true);
  };

  const handleViewDocument = async (doc: any) => {
    try {
      // Try to use direct URL first (from API response)
      if (doc.url) {
        window.open(doc.url, '_blank');
        return;
      }
      
      // Fallback to API endpoint if no direct URL
      const response = await downloadQualityDocument(doc.id);
      const url = response?.data?.url || response?.url;
      
      if (url) {
        window.open(url, '_blank');
      } else {
        console.error('No URL available for document:', doc);
        showError('Erreur', 'Impossible d\'ouvrir le document - URL non disponible');
      }
    } catch (err: any) {
      console.error('Error viewing document:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      // Try to use direct URL first (from API response)
      if (doc.url) {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Fallback to API endpoint if no direct URL
      const response = await downloadQualityDocument(doc.id);
      const url = response?.data?.url || response?.url;
      
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = response?.data?.name || response?.name || doc.name || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('No URL available for document:', doc);
        showError('Erreur', 'Impossible de télécharger le document - URL non disponible');
      }
    } catch (err: any) {
      console.error('Error downloading document:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue lors du téléchargement');
    }
  };

  // Group evidences by course → session (Qualiopi logic)
  const groupedEvidences = useMemo(() => {
    const grouped: Record<string, { course: any; sessions: Record<string, { session: any; evidences: any[]; participants?: any[] }> }> = {};
    
    documents.evidences.forEach((evidence: any) => {
      const courseId = evidence.course_id || evidence.courseId || evidence.course?.uuid || evidence.course?.id || 'unknown';
      const sessionId = evidence.session_id || evidence.sessionId || evidence.session?.uuid || evidence.session?.id || 'unknown';
      
      if (!grouped[courseId]) {
        grouped[courseId] = {
          course: evidence.course || { title: 'Formation inconnue', uuid: courseId },
          sessions: {}
        };
      }
      
      if (!grouped[courseId].sessions[sessionId]) {
        grouped[courseId].sessions[sessionId] = {
          session: evidence.session || { title: 'Session inconnue', uuid: sessionId },
          evidences: []
        };
      }
      
      grouped[courseId].sessions[sessionId].evidences.push(evidence);
    });
    
    return grouped;
  }, [documents.evidences]);

  // Group models by course (Qualiopi logic)
  const groupedModels = useMemo(() => {
    const grouped: Record<string, { course: any; models: any[] }> = {};
    
    documents.models.forEach((model: any) => {
      const courseId = model.course_id || model.courseId || model.course?.uuid || model.course?.id || 'unknown';
      
      if (!grouped[courseId]) {
        grouped[courseId] = {
          course: model.course || { title: 'Formation inconnue', uuid: courseId },
          models: []
        };
      }
      
      grouped[courseId].models.push(model);
    });
    
    return grouped;
  }, [documents.models]);

  // Extract course IDs from documents to prevent dependency on memoized objects
  const courseIdsFromDocuments = useMemo(() => {
    const ids = new Set<string>();
    documents.evidences.forEach((evidence: any) => {
      const courseId = evidence.course_id || evidence.courseId || evidence.course?.uuid || evidence.course?.id;
      if (courseId) ids.add(courseId);
    });
    documents.models.forEach((model: any) => {
      const courseId = model.course_id || model.courseId || model.course?.uuid || model.course?.id;
      if (courseId) ids.add(courseId);
    });
    return Array.from(ids);
  }, [documents.evidences, documents.models]);

  // Load course data if missing - depend on course IDs array instead of memoized objects
  useEffect(() => {
    if (courseIdsFromDocuments.length === 0) return;

    const loadCourseData = async () => {
      const courseIdsToLoad = courseIdsFromDocuments.filter(courseId => !coursesData[courseId]);

      for (const courseId of courseIdsToLoad) {
        try {
          const response = await apiService.getCourse(courseId);
          if (response.success && response.data) {
            setCoursesData(prev => ({ ...prev, [courseId]: response.data }));
          }
        } catch (err) {
          console.error(`Error loading course ${courseId}:`, err);
        }
      }
    };

    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdsFromDocuments.join(',')]); // Depend on stringified IDs to prevent loops

  // Load session participants when expanding
  const handleExpandSession = async (sessionId: string, courseId: string) => {
    if (expandedSessions.has(sessionId)) {
      // Collapse
      setExpandedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      return;
    }

    // Expand - load participants if not already loaded
    setExpandedSessions(prev => new Set(prev).add(sessionId));
    
    if (!sessionParticipants[sessionId] && !loadingParticipants[sessionId]) {
      setLoadingParticipants(prev => ({ ...prev, [sessionId]: true }));
      try {
        const response = await getSessionParticipantsForQuality(sessionId);
        let participants: any[] = [];
        
        if (response.success) {
          participants = response.data?.participants || response.data || [];
        } else if (Array.isArray(response)) {
          participants = response;
        }
        
        setSessionParticipants(prev => ({ ...prev, [sessionId]: participants }));
      } catch (err) {
        console.error(`Error loading participants for session ${sessionId}:`, err);
      } finally {
        setLoadingParticipants(prev => ({ ...prev, [sessionId]: false }));
      }
    }
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleIndicatorSection = (sectionId: string) => {
    setExpandedIndicatorSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleDocumentSection = (sectionId: string) => {
    setExpandedDocumentSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Get session status badge
  const getSessionStatusBadge = (session: any) => {
    const now = new Date();
    const startDate = session.start_date ? new Date(session.start_date) : null;
    const endDate = session.end_date ? new Date(session.end_date) : null;
    
    if (startDate && endDate) {
      if (now < startDate) {
        return <Badge className="bg-blue-500 text-white text-xs">À venir</Badge>;
      } else if (now >= startDate && now <= endDate) {
        return <Badge className="bg-purple-500 text-white text-xs">En cours</Badge>;
      } else {
        return <Badge className="bg-gray-500 text-white text-xs">Terminée</Badge>;
      }
    }
    
    if (session.is_private) {
      return <Badge className="bg-gray-400 text-white text-xs">Privée</Badge>;
    }
    
    return null;
  };

  // Get image path for indicator (image 6 = indicator 1, so image 5 + indicatorNumber)
  const getIndicatorImagePath = (indicatorNumber: number): string => {
    const imageNumber = 5 + indicatorNumber; // image 6 = indicator 1, image 7 = indicator 2, etc.
    return `/assets/qalioupi/image ${imageNumber}.png`;
  };

  // Reset image loading state when indicator changes
  useEffect(() => {
    if (indicator?.number) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [indicator?.number]);

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !indicator) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="text-center py-8">
            <p className="text-red-500">Erreur: {error || 'Indicateur non trouvé'}</p>
            <Button onClick={() => navigateToRoute('/quality/indicateurs')} className="mt-4">
              Retour aux indicateurs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get category number from indicator
  const getCategoryNumber = (indicatorNumber: number): number => {
    if (indicatorNumber <= 4) return 1;
    if (indicatorNumber <= 8) return 2;
    if (indicatorNumber <= 12) return 3;
    if (indicatorNumber <= 16) return 4;
    if (indicatorNumber <= 20) return 5;
    if (indicatorNumber <= 24) return 6;
    if (indicatorNumber <= 28) return 7;
    return 8;
  };

  const categoryNumber = getCategoryNumber(indicator?.number || 0);

  return (
    <div className="px-[27px] py-8">
      {/* Navigation Indicateurs 1-32 en haut */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {allIndicators.sort((a, b) => a.number - b.number).map((ind) => (
          <button
            key={ind.id}
            onClick={() => navigateToRoute(`/quality/indicateurs/${ind.id}`)}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
              ind.id === indicatorId
                ? 'bg-[#3B82F6] text-white shadow-md scale-110 font-bold'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#E5E7EB]'
            }`}
          >
            <span className="[font-family:'Poppins',Helvetica] font-semibold text-sm">
              {ind.number}
            </span>
          </button>
        ))}
      </div>

      {/* Structure en deux colonnes - responsive selon l'affichage de l'image */}
      <div className={`grid grid-cols-1 gap-6 ${showImage ? 'lg:grid-cols-[450px_1fr]' : 'lg:grid-cols-1'}`}>
        {/* COLONNE GAUCHE - "Mes indicateurs" avec carte détaillée */}
        {showImage && (
          <div className="space-y-6">
            {/* En-tête "Mes Indicateurs" */}
            <div className="flex items-center justify-between">
              <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Mes Indicateurs
              </h1>
              <button 
                onClick={() => setShowImage(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Masquer l'image"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Carte avec image agrandie et collapsible */}
            <Card className="border-2 border-[#e2e2ea] rounded-[18px] overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Image de l'indicateur
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowImageZoom(true)}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Zoomer"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowImage(false)}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Masquer"
                    >
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex justify-center items-start">
                {/* Image de l'indicateur - agrandie, centrée, cliquable pour zoomer */}
                <div 
                  className="relative cursor-zoom-in group min-h-[400px] flex items-center justify-center"
                  onClick={() => !imageLoading && !imageError && setShowImageZoom(true)}
                >
                  {/* État de chargement - placeholder visible */}
                  {imageLoading && !imageError && (
                    <div className="absolute inset-0 w-auto max-w-[380px] h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
                        <p className="text-xs text-gray-500">Chargement de l'image...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Image - toujours présente mais avec opacité pendant le chargement */}
                  {!imageError && (
                    <img 
                      src={getIndicatorImagePath(indicator?.number || 4)} 
                      alt={`Indicateur ${indicator?.number || 4}`}
                      className={`w-auto max-w-[380px] h-auto rounded-lg object-contain transition-all duration-300 group-hover:scale-105 ${imageLoading ? 'opacity-0 absolute' : 'opacity-100 relative'}`}
                      style={{ maxHeight: '650px' }}
                      onLoad={() => {
                        setImageLoading(false);
                        setImageError(false);
                      }}
                      onError={(e) => {
                        setImageLoading(false);
                        setImageError(true);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  
                  {/* Message d'erreur si l'image ne charge pas */}
                  {imageError && (
                    <div className="w-auto max-w-[380px] h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 text-center px-4">
                        Image non disponible
                      </p>
                    </div>
                  )}
                  
                  {/* Overlay au survol - seulement si l'image est chargée */}
                  {!imageLoading && !imageError && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                        <Eye className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* COLONNE DROITE - Sections */}
        <div className="space-y-6">
          {/* Bouton pour afficher l'image si elle est cachée */}
          {!showImage && (
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                onClick={() => setShowImage(true)}
                className="flex items-center gap-2"
              >
                <ChevronRight className="h-4 w-4" />
                Afficher l'image
              </Button>
            </div>
          )}
          {/* Section "Indicateur X" avec bouton */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Indicateur {indicator?.number || '4'}
              </h2>
              <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                {indicator?.title || 'Analyse du besoin du bénéficiaire'}
              </p>
            </div>
                  <Button 
                    style={{ backgroundColor: primaryColor }}
                    className="text-white hover:opacity-90 border-none shadow-md"
                    onClick={() => {
                const pathParts = window.location.pathname.split('/');
                const subdomainIndex = pathParts.findIndex(p => p && p !== 'quality' && p !== 'indicateurs');
                const subdomain = subdomainIndex > 0 ? pathParts[subdomainIndex] : '';
                const trainingUrl = subdomain 
                  ? `/${subdomain}/quality/indicateurs/${indicator?.id}/formation`
                  : `/quality/indicateurs/${indicator?.id}/formation`;
                window.open(trainingUrl, '_blank');
              }}
            >
              Se former sur cet indicateur
            </Button>
          </div>

          {/* Documents Sections - Collapsibles */}
          <div className="space-y-4">
        {/* Procédures - Collapsible */}
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardHeader>
            <div
              onClick={() => toggleDocumentSection('procedures')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div>
                  <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
                    Procédures {documents.procedures.length}
                  </CardTitle>
                  <p className={`mt-1 [font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Une procédure qualité indique le "comment" et le "pourquoi".
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDocument('procedure');
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                {expandedDocumentSections.has('procedures') ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedDocumentSections.has('procedures') && (
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
                </div>
              ) : documents.procedures.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Aucune procédure ajoutée
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {documents.procedures.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#ebf1ff] hover:border-[#ff7700] transition-colors"
                    >
                      <span className={`[font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {doc.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc);
                          }}
                          title="Voir le document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          title="Télécharger le document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Modèles de document - Collapsible */}
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardHeader>
            <div
              onClick={() => toggleDocumentSection('modeles')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div>
                  <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
                    Modèles de document {documents.models.length}
                  </CardTitle>
                  <p className={`mt-1 [font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Un modèle (appelé aussi "document" en qualité) vous permet de gagner du temps en disposant d'une trame, d'un template "vide" pour respecter vos procédures.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDocument('model');
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                {expandedDocumentSections.has('modeles') ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedDocumentSections.has('modeles') && (
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
                </div>
              ) : documents.models.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Aucun modèle ajouté
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(groupedModels).map(([courseId, { course, models }]) => {
                    const courseData = coursesData[course.uuid || courseId] || course;
                    const isExpanded = expandedCourses.has(courseId);
                    const sessionCount = courseData?.sessions_count || 0;
                    
                    return (
                      <div key={courseId} className="border border-[#ebf1ff] rounded-lg overflow-hidden">
                        {/* Course Header */}
                        <div
                          onClick={() => toggleCourse(courseId)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} />
                            <div className="flex-1">
                              <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                {courseData.title || course.title || 'Formation inconnue'}
                              </h4>
                              <p className={`[font-family:'Poppins',Helvetica] text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Sessions : {sessionCount}
                              </p>
                            </div>
                            <Badge className="bg-gray-200 text-gray-700">{models.length} document{models.length > 1 ? 's' : ''}</Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Expanded Models Table */}
                        {isExpanded && (
                          <div className="border-t border-[#ebf1ff] bg-gray-50/50">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className={`${isDark ? 'bg-gray-700' : 'bg-white'} border-b border-[#ebf1ff]`}>
                                  <tr>
                                    <th className={`px-4 py-3 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Intitulé du fichier
                                    </th>
                                    <th className={`px-4 py-3 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Type du fichier
                                    </th>
                                    <th className={`px-4 py-3 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Date d'ajout
                                    </th>
                                    <th className={`px-4 py-3 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Taille
                                    </th>
                                    <th className={`px-4 py-3 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Ajouté par
                                    </th>
                                    <th className={`px-4 py-3 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {models.map((model: any) => (
                                    <tr key={model.id} className={`border-b border-[#ebf1ff] ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors`}>
                                      <td className={`px-4 py-3 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                        {model.name}
                                      </td>
                                      <td className={`px-4 py-3 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {model.fileType || model.mime_type?.split('/')[1]?.toUpperCase() || 'N/A'}
                                      </td>
                                      <td className={`px-4 py-3 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {formatDate(model.createdAt || model.created_at)}
                                      </td>
                                      <td className={`px-4 py-3 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {model.size || (model.file_size ? `${(model.file_size / 1024).toFixed(1)} KB` : 'N/A')}
                                      </td>
                                      <td className={`px-4 py-3 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {model.createdBy?.name || model.created_by?.name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewDocument(model);
                                            }}
                                            title="Voir le document"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDownloadDocument(model);
                                            }}
                                            title="Télécharger le document"
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="sm">
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Preuves - Collapsible avec hiérarchie Formation → Session → Apprenants */}
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardHeader>
            <div
              onClick={() => toggleDocumentSection('preuves')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div>
                  <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
                    Preuves {documents.evidences.length}
                  </CardTitle>
                  <p className={`mt-1 [font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Une procédure qualité indique le "comment" et le "pourquoi".
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddEvidence();
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                {expandedDocumentSections.has('preuves') ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedDocumentSections.has('preuves') && (
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
                </div>
              ) : documents.evidences.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Aucune preuve ajoutée
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(groupedEvidences).map(([courseId, { course, sessions }]) => {
                    const courseData = coursesData[course.uuid || courseId] || course;
                    const isCourseExpanded = expandedCourses.has(courseId);
                    const sessionEntries = Object.entries(sessions);
                    const totalSessions = sessionEntries.length;
                    
                    return (
                      <div key={courseId} className="border border-[#ebf1ff] rounded-lg overflow-hidden">
                        {/* Course Header */}
                        <div
                          onClick={() => toggleCourse(courseId)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} />
                            <div className="flex-1">
                              <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                {courseData.title || course.title || 'Formation inconnue'}
                              </h4>
                              <p className={`[font-family:'Poppins',Helvetica] text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Sessions : {totalSessions}
                              </p>
                            </div>
                            <Badge className="bg-gray-200 text-gray-700">
                              {sessionEntries.reduce((sum, [, { evidences }]) => sum + evidences.length, 0)} document{sessionEntries.reduce((sum, [, { evidences }]) => sum + evidences.length, 0) > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {isCourseExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Sessions List */}
                        {isCourseExpanded && (
                          <div className="border-t border-[#ebf1ff] bg-gray-50/50">
                            <div className="flex flex-col gap-2 p-3">
                              {sessionEntries.map(([sessionId, { session, evidences }]) => {
                                const isSessionExpanded = expandedSessions.has(sessionId);
                                const participants = sessionParticipants[sessionId] || [];
                                const isLoading = loadingParticipants[sessionId];
                                const totalEvidences = evidences.length;
                                
                                return (
                                  <div key={sessionId} className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-white">
                                    {/* Session Header */}
                                    <div
                                      onClick={() => handleExpandSession(sessionId, courseId)}
                                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h5 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                              {session.title || 'Session inconnue'}
                                            </h5>
                                            {getSessionStatusBadge(session)}
                                          </div>
                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Créé le : {formatDate(session.created_at || session.createdAt)}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`[font-family:'Poppins',Helvetica] text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {totalEvidences} document{totalEvidences > 1 ? 's' : ''}
                                          </span>
                                          {isSessionExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-gray-400" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Expanded Session Content */}
                                    {isSessionExpanded && (
                                      <div className="border-t border-[#e5e7eb] bg-white">
                                        {/* Session Info */}
                                        <div className="p-4 bg-gray-50 border-b border-[#e5e7eb]">
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                👥 Apprenants :
                                              </span>
                                              <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isLoading ? 'Chargement...' : participants.length}
                                              </span>
                                            </div>
                                            {session.start_date && (
                                              <div>
                                                <span className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                  📅 Date de début :
                                                </span>
                                                <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  {formatDate(session.start_date)}
                                                </span>
                                              </div>
                                            )}
                                            {session.end_date && (
                                              <div>
                                                <span className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                  📅 Date de fin :
                                                </span>
                                                <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  {formatDate(session.end_date)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Learners Table */}
                                        {isLoading ? (
                                          <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-[#ff7700]" />
                                          </div>
                                        ) : participants.length > 0 ? (
                                          <div className="p-4 border-t border-[#e5e7eb]">
                                            <h6 className={`mb-3 [font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                              Apprenants : {participants.length}
                                            </h6>
                                            <div className="overflow-x-auto">
                                              <table className="w-full">
                                                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-b border-[#e5e7eb]`}>
                                                  <tr>
                                                    <th className={`px-3 py-2 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                      Nom
                                                    </th>
                                                    <th className={`px-3 py-2 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                      Prénom
                                                    </th>
                                                    <th className={`px-3 py-2 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                      Email
                                                    </th>
                                                    <th className={`px-3 py-2 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                      Téléphone
                                                    </th>
                                                    <th className={`px-3 py-2 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                      Date d'inscription
                                                    </th>
                                                    <th className={`px-3 py-2 text-left [font-family:'Poppins',Helvetica] text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                      Actions
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {participants.map((participant: any) => {
                                                    const user = participant.user || {};
                                                    const nameParts = (user.name || participant.name || participant.first_name || participant.last_name || '').split(' ');
                                                    const lastName = participant.last_name || participant.lastName || nameParts[0] || '';
                                                    const firstName = participant.first_name || participant.firstName || nameParts.slice(1).join(' ') || '';
                                                    
                                                    return (
                                                      <tr key={participant.id || participant.uuid} className={`border-b border-[#e5e7eb] ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors`}>
                                                        <td className={`px-3 py-2 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                          {lastName}
                                                        </td>
                                                        <td className={`px-3 py-2 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                          {firstName}
                                                        </td>
                                                        <td className={`px-3 py-2 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                          {user.email || participant.email || 'N/A'}
                                                        </td>
                                                        <td className={`px-3 py-2 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                          {user.phone || participant.phone || participant.telephone || 'N/A'}
                                                        </td>
                                                        <td className={`px-3 py-2 [font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                          {formatDate(participant.enrollment_date || participant.registration_date || participant.created_at)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                          <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="sm">
                                                              <Eye className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm">
                                                              <Trash2 className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        ) : null}
                                        
                                        {/* Evidence Documents */}
                                        {totalEvidences > 0 && (
                                          <div className="p-4 border-t border-[#e5e7eb]">
                                            <div className="flex items-center justify-between mb-3">
                                              <h6 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                Documents ({totalEvidences})
                                              </h6>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                              {evidences.map((evidence: any) => (
                                                <div
                                                  key={evidence.id}
                                                  className="flex items-center justify-between p-2 rounded border border-[#ebf1ff] hover:border-[#ff7700] transition-colors"
                                                >
                                                  <span className={`[font-family:'Inter',Helvetica] text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                    {evidence.name}
                                                  </span>
                                                  <div className="flex items-center gap-2">
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDocument(evidence);
                                                      }}
                                                      title="Voir le document"
                                                    >
                                                      <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadDocument(evidence);
                                                      }}
                                                      title="Télécharger le document"
                                                    >
                                                      <Download className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {documentType && (
        <AddDocumentModal
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setDocumentType(null);
          }}
          type={documentType}
          indicatorId={indicatorId} // Pre-select current indicator
          onSuccess={async () => {
            setShowDocumentModal(false);
            setDocumentType(null);
            // Reset loading state to force reload
            lastLoadedIndicatorId.current = null;
            isLoadingRef.current = false;
            // Small delay to ensure backend has processed the document
            await new Promise(resolve => setTimeout(resolve, 500));
            // Force reload after user action
            await loadDocuments(true);
            refetch();
          }}
        />
      )}
      <AddEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        onSuccess={async () => {
          setShowEvidenceModal(false);
          // Reset loading state to force reload
          lastLoadedIndicatorId.current = null;
          isLoadingRef.current = false;
          // Small delay to ensure backend has processed the document
          await new Promise(resolve => setTimeout(resolve, 500));
          // Force reload after user action
          await loadDocuments(true);
          refetch();
        }}
      />

      {/* Modal de zoom pour l'image */}
      {showImageZoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowImageZoom(false)}
        >
          {/* Bouton fermer */}
          <button
            onClick={() => setShowImageZoom(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
            title="Fermer (ESC)"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {/* Image zoomée */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={getIndicatorImagePath(indicator?.number || 4)} 
              alt={`Indicateur ${indicator?.number || 4} - Zoom`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
            Cliquez en dehors de l'image ou appuyez sur ESC pour fermer
          </div>
        </div>
      )}
    </div>
  );
};
