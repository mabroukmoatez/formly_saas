import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  DollarSign, 
  Clock, 
  FileText, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle, 
  ChevronUp, 
  ChevronDown, 
  Target, 
  List, 
  Box, 
  User, 
  GraduationCap,
  BookOpen,
  Download,
  Play,
  Info,
  Users,
  Settings,
  Save,
  Plus,
  MapPin,
  Video,
  Monitor,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { RichTextEditor } from '../ui/rich-text-editor';
import { RobustVideoPlayer } from '../ui/robust-video-player';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { sessionCreation } from '../../services/sessionCreation';
import { AdvancedDocumentCreationModal } from '../CourseCreation/AdvancedDocumentCreationModal';
import { QuestionnaireCreationModal } from '../CourseCreation/QuestionnaireCreationModal';
import { FlowActionModal } from '../CourseCreation/FlowActionModal';
import { TrainerPermissionsModal } from '../CourseCreation/TrainerPermissionsModal';
import { ConfirmationModal } from '../ui/confirmation-modal';

interface SessionViewProps {
  sessionUuid: string;
  editMode?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: (data: any) => Promise<void>;
}

export const SessionView: React.FC<SessionViewProps> = ({
  sessionUuid,
  editMode = false,
  onClose,
  onEdit,
  onDelete,
  onSave
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const { navigateToRoute } = useSubdomainNavigation();

  // Organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';
  const successColor = organization?.success_color || '#08ab39';

  const [sessionData, setSessionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'contenu' | 'documents' | 'questionnaire' | 'seances' | 'participants' | 'deroulement'>('description');
  const [isObjectivesExpanded, setIsObjectivesExpanded] = useState(true);
  const [isModulesExpanded, setIsModulesExpanded] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  
  // Enhanced data from new APIs
  const [sections, setSections] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  // For chapter editing
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});
  
  // Editable objectives and modules
  const [editableObjectives, setEditableObjectives] = useState<any[]>([]);
  const [editableModules, setEditableModules] = useState<any[]>([]);
  
  // Confirmation modal helper
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmationModal({ ...confirmationModal, isOpen: false });
      }
    });
  };
  
  // Editable session data
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableTargetAudience, setEditableTargetAudience] = useState('');
  const [editablePrerequisites, setEditablePrerequisites] = useState('');
  const [editableMethods, setEditableMethods] = useState('');
  const [editablePrice, setEditablePrice] = useState('');
  const [editableDuration, setEditableDuration] = useState(0);
  
  // Modals
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleSaveEdits = async () => {
    if (!onSave || !sessionData) return;
    
    setSaving(true);
    try {
      const updatedData = {
        title: editableTitle,
        description: editableDescription,
        target_audience: editableTargetAudience,
        prerequisites: editablePrerequisites,
        methods: editableMethods,
        price_ht: editablePrice,
        duration: editableDuration,
        objectives: editableObjectives.length > 0 ? editableObjectives : objectives,
        modules: editableModules.length > 0 ? editableModules : modules,
      };
      
      await onSave(updatedData);
      success('Session mise à jour avec succès');
    } catch (err: any) {
      console.error('Error saving session:', err);
      error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        const response: any = await sessionCreation.getSessionDetails(sessionUuid);
        if (response.success) {
          setSessionData(response.data);
          
          // Set editable data
          if (editMode) {
            setEditableTitle(response.data.title || '');
            setEditableDescription(response.data.description || '');
            setEditableTargetAudience(response.data.target_audience || '');
            setEditablePrerequisites(response.data.prerequisites || '');
            setEditableMethods(response.data.methods || '');
            setEditablePrice(response.data.price_ht || response.data.price || '0');
            setEditableDuration(response.data.duration_days || 0);
          }
        } else {
          error(t('sessionView.loadError'));
        }
      } catch (err: any) {
        console.error('Failed to load session:', err);
        error(t('sessionView.loadError'));
      } finally {
        setLoading(false);
      }
    };

    const loadEnhancedData = async () => {
      try {
        // Load sections
        const sectionsRes = await sessionCreation.getSessionSections(sessionUuid);
        if (sectionsRes.success && sectionsRes.data) {
          setSections(sectionsRes.data);
          // Expand all sections by default
          const sectionIds = sectionsRes.data.map((s: any) => s.id);
          setExpandedSections(new Set(sectionIds));
        }

        // Load chapters
        const chaptersRes = await sessionCreation.getSessionChapters(sessionUuid);
        if (chaptersRes.success && chaptersRes.data) {
          setChapters(chaptersRes.data);
          // Expand all by default
          setExpandedChapters(new Set(chaptersRes.data.map((ch: any) => ch.uuid)));
        }

        // Load documents - Use same endpoint as Step3Documents
        const docsRes = await sessionCreation.getDocumentsEnhanced(sessionUuid, {
          audience: undefined // Load all documents
        });
        console.log('📊 [SessionView] Documents API response:', docsRes);
        if (docsRes.success && docsRes.data) {
          setDocuments(docsRes.data);
          console.log('✅ [SessionView] Documents loaded:', docsRes.data.length, docsRes.data);
        } else {
          console.warn('⚠️ [SessionView] No documents data');
        }

        // Load questionnaires - Use same endpoint as Step4Questionnaire
        const questionnairesRes = await sessionCreation.getQuestionnaires(sessionUuid, {
          audience: 'students'
        });
        console.log('📊 [SessionView] Questionnaires API response:', questionnairesRes);
        if (questionnairesRes.success && questionnairesRes.data) {
          setQuestionnaires(questionnairesRes.data);
          console.log('✅ [SessionView] Questionnaires loaded:', questionnairesRes.data.length, questionnairesRes.data);
        } else {
          console.warn('⚠️ [SessionView] No questionnaires data');
        }

        // Load instances (séances)
        const instancesRes = await sessionCreation.getSessionInstances(sessionUuid);
        if (instancesRes.success && instancesRes.data) {
          setInstances(instancesRes.data);
        }

        // Load participants
        const participantsRes = await sessionCreation.getSessionParticipants(sessionUuid);
        if (participantsRes.success && participantsRes.data) {
          setParticipants(participantsRes.data);
        }

        // Load trainers
        const trainersRes = await sessionCreation.getSessionTrainers(sessionUuid);
        if (trainersRes.success && trainersRes.data) {
          setTrainers(trainersRes.data);
        }

        // Load workflow
        const workflowRes = await sessionCreation.getSessionWorkflow(sessionUuid);
        if (workflowRes.success && workflowRes.data) {
          setWorkflows(workflowRes.data.actions || []);
        }

        // Load objectives
        const objectivesRes = await sessionCreation.getSessionObjectives(sessionUuid);
        console.log('📊 [SessionView] Objectives API response:', objectivesRes);
        if (objectivesRes.success && objectivesRes.data) {
          setObjectives(objectivesRes.data);
          if (editMode) {
            setEditableObjectives(objectivesRes.data);
          }
          console.log('✅ [SessionView] Objectives loaded:', objectivesRes.data.length, objectivesRes.data);
        } else {
          console.warn('⚠️ [SessionView] No objectives data');
        }

        // Load modules
        const modulesRes = await sessionCreation.getSessionModules(sessionUuid);
        console.log('📊 [SessionView] Modules API response:', modulesRes);
        if (modulesRes.success && modulesRes.data) {
          setModules(modulesRes.data);
          if (editMode) {
            setEditableModules(modulesRes.data);
          }
          console.log('✅ [SessionView] Modules loaded:', modulesRes.data.length, modulesRes.data);
        } else {
          console.warn('⚠️ [SessionView] No modules data');
        }
        
        console.log('🎯 [SessionView] Final state:');
        console.log('  - Objectives:', objectivesRes.data?.length || 0);
        console.log('  - Modules:', modulesRes.data?.length || 0);
        console.log('  - Trainers:', trainersRes.data?.length || 0);
        console.log('  - Chapters:', chaptersRes.data?.length || 0);
        console.log('  - Documents:', docsRes.data?.length || 0);
        console.log('  - Questionnaires:', questionnairesRes.data?.length || 0);
      } catch (err: any) {
        console.error('❌ [SessionView] Failed to load enhanced data:', err);
      }
    };

    if (sessionUuid) {
      loadSessionData();
      loadEnhancedData();
    }
  }, [sessionUuid, error, t, editMode]);

  // Initialize editable objectives and modules when editMode changes
  useEffect(() => {
    if (editMode) {
      if (objectives.length > 0 && editableObjectives.length === 0) {
        setEditableObjectives(objectives);
      }
      if (modules.length > 0 && editableModules.length === 0) {
        setEditableModules(modules);
      }
    }
  }, [editMode, objectives, modules]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: string | number) => {
    return parseFloat(price.toString()).toFixed(2);
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return t('sessionView.draft');
      case 1: return t('sessionView.active');
      case 2: return t('sessionView.published');
      default: return t('sessionView.unknown');
    }
  };

  const getInstanceTypeLabel = (type: string) => {
    switch (type) {
      case 'presentiel': return 'Présentiel';
      case 'distanciel': return 'Distanciel';
      case 'e-learning': return 'E-learning';
      default: return type;
    }
  };

  const getInstanceTypeIcon = (type: string) => {
    switch (type) {
      case 'presentiel': return <MapPin className="w-4 h-4" />;
      case 'distanciel': return <Video className="w-4 h-4" />;
      case 'e-learning': return <Monitor className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('sessionView.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
      {/* Session Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-8 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {editMode ? (
              <Input
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white bg-gray-700 border-gray-600' : 'text-[#19294a] bg-white border-gray-300'} text-[19.5px] mb-2 h-auto py-1 px-3`}
                placeholder="Titre de la session"
              />
            ) : (
            <h1 className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} text-[19.5px] mb-2`}>
              {sessionData.title}
            </h1>
            )}

            {/* Categories */}
            <div className="flex items-center gap-2 mb-2">
              {sessionData.category && (
                <Badge
                  className="bg-[#eee0ff] text-[#8c2ffe] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
                >
                  {sessionData.category.name}
                </Badge>
              )}
            </div>

            {/* Session Info */}
            <div className="flex items-center gap-[31px]">
              <div className="flex items-center gap-2.5">
                <DollarSign className={`w-4 h-4`} style={{ color: primaryColor }} />
                {editMode ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={editablePrice}
                      onChange={(e) => setEditablePrice(e.target.value)}
                      className={`w-24 h-7 text-[15.5px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="Prix"
                    />
                    <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                      {sessionData.currency === 'EUR' ? '€' : '$'}
                    </span>
                  </div>
                ) : (
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {formatPrice(sessionData.price_ht || sessionData.price || '0')}{sessionData.currency === 'EUR' ? '€' : '$'}
                </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                {editMode ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={editableDuration}
                      onChange={(e) => setEditableDuration(parseInt(e.target.value) || 0)}
                      className={`w-20 h-7 text-[15.5px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="Heures"
                    />
                    <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                      {t('courseView.hours')}
                    </span>
                  </div>
                ) : (
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {sessionData.duration || 0} {t('courseView.hours')}
                </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {chapters.length} {t('courseView.lessons')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className={`w-4 h-4`} style={{ color: primaryColor }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: primaryColor }}>
                  {t('courseView.version')} 1
                </span>
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  MAJ {formatDate(sessionData.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-4">
            {!editMode && onDelete && (
            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: primaryColor }}>
                {t('common.delete')}
              </span>
            </Button>
            )}

            {editMode ? (
              <Button
                variant="ghost"
                className="h-auto rounded-[13px] px-6 py-3 gap-2 hover:opacity-90"
                style={{ backgroundColor: primaryColor, color: 'white' }}
                onClick={handleSaveEdits}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                      Sauvegarde...
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                      Sauvegarder
                    </span>
                  </>
                )}
              </Button>
            ) : onEdit && (
            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
              onClick={onEdit}
            >
              <Edit3 className="w-4 h-4" style={{ color: secondaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: secondaryColor }}>
                {t('courseView.editCourse')}
              </span>
            </Button>
            )}

            <Button 
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: accentColor }}
              onClick={onClose}
            >
              <Eye className="w-4 h-4 text-white" />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[17px]">
                {t('courseView.closePreview')}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 p-8 overflow-y-auto">
          <div className="flex-1 flex flex-col gap-4">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[63px] shadow-[0px_4px_18.8px_#0000000f] p-1.5 h-auto`}>
                <TabsTrigger
                  value="description"
                  className="rounded-[33px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'description' ? accentColor : secondaryColor }}>
                    {t('courseView.description')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="contenu"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('contenu')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'contenu' ? accentColor : secondaryColor }}>
                    {t('courseView.content')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('documents')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'documents' ? accentColor : secondaryColor }}>
                    {t('courseView.documents')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="questionnaire"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('questionnaire')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'questionnaire' ? accentColor : secondaryColor }}>
                    {t('courseView.questionnaire')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="seances"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('seances')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'seances' ? accentColor : secondaryColor }}>
                    Séances ({instances.length})
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="participants"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('participants')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'participants' ? accentColor : secondaryColor }}>
                    Participants ({participants.length})
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="deroulement"
                  className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                  onClick={() => setActiveTab('deroulement')}
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'deroulement' ? accentColor : secondaryColor }}>
                    {t('courseView.workflow')}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description" className="mt-4 space-y-4">
                {/* Video Player */}
                {sessionData.video_url && (
                  <div className="relative rounded-[18px] overflow-hidden">
                    <RobustVideoPlayer
                      src={(() => {
                        const videoUrl = sessionData.video_url || '';
                        if (videoUrl.includes('/upload/') && !videoUrl.includes('/storage/')) {
                          return videoUrl.replace('/upload/', '/storage/upload/');
                        }
                        return videoUrl;
                      })()}
                      title={sessionData.title}
                      poster={(() => {
                        const imageUrl = sessionData.image_url || '/image.png';
                        if (imageUrl.includes('/upload/') && !imageUrl.includes('/storage/')) {
                          return imageUrl.replace('/upload/', '/storage/upload/');
                        }
                        return imageUrl;
                      })()}
                      size="xl"
                      className="w-full h-[387px]"
                      showControls={true}
                    />
                  </div>
                )}

                {/* Description Content */}
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                  <CardContent className="p-[37px] space-y-7">
                     {/* Description Section */}
                     <div className="space-y-[17px]">
                       <div className="flex items-center gap-2.5">
                         <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                           <Info className="w-5 h-5" style={{ color: primaryColor }} />
                         </div>
                         <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                           {t('courseView.description')}
                         </h3>
                         {editMode && (
                           <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                             ✏️ Éditable
                           </span>
                         )}
                       </div>
                       {editMode ? (
                         <RichTextEditor
                           value={editableDescription}
                           onChange={setEditableDescription}
                           placeholder="Description de la session..."
                           minHeight="120px"
                         />
                       ) : (
                       <div 
                         className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                         style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                         dangerouslySetInnerHTML={{ __html: sessionData.description || t('courseView.noDescription') }}
                       />
                       )}
                     </div>

                     {/* Target Audience Section */}
                     <div className="space-y-[17px]">
                       <div className="flex items-center gap-2.5">
                         <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                           <Users className="w-5 h-5" style={{ color: primaryColor }} />
                         </div>
                         <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                           {t('courseView.targetAudience')}
                         </h3>
                         {editMode && (
                           <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                             ✏️ Éditable
                           </span>
                         )}
                       </div>
                       {editMode ? (
                         <RichTextEditor
                           value={editableTargetAudience}
                           onChange={setEditableTargetAudience}
                           placeholder="Public cible..."
                           minHeight="100px"
                         />
                       ) : (
                       <div 
                         className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                         style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                         dangerouslySetInnerHTML={{ __html: sessionData.target_audience || t('courseView.noTargetAudience') }}
                       />
                       )}
                     </div>

                     {/* Prerequisites Section */}
                     <div className="space-y-[17px]">
                       <div className="flex items-center gap-2.5">
                         <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                           <List className="w-5 h-5" style={{ color: primaryColor }} />
                         </div>
                         <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                           {t('courseView.prerequisites')}
                         </h3>
                         {editMode && (
                           <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                             ✏️ Éditable
                           </span>
                         )}
                       </div>
                       {editMode ? (
                         <RichTextEditor
                           value={editablePrerequisites}
                           onChange={setEditablePrerequisites}
                           placeholder="Prérequis..."
                           minHeight="100px"
                         />
                       ) : (
                       <div 
                         className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                         style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                         dangerouslySetInnerHTML={{ __html: sessionData.prerequisites || t('courseView.noPrerequisites') }}
                       />
                       )}
                     </div>

                     {/* Training Methods Section */}
                     <div className="space-y-[17px]">
                       <div className="flex items-center gap-2.5">
                         <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                           <Settings className="w-5 h-5" style={{ color: primaryColor }} />
                         </div>
                         <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                           {t('courseView.trainingMethods')}
                         </h3>
                         {editMode && (
                           <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                             ✏️ Éditable
                           </span>
                         )}
                       </div>

                      {editMode ? (
                        <RichTextEditor
                          value={editableMethods}
                          onChange={setEditableMethods}
                          placeholder="Méthodes pédagogiques..."
                          minHeight="100px"
                        />
                      ) : sessionData.methods ? (
                        <div className="space-y-1">
                          <div 
                            className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} 
                            style={{ color: isDark ? '#F9FAFB' : '#19294a' }}
                            dangerouslySetInnerHTML={{ __html: sessionData.methods }}
                          />
                          <p className={`[font-family:'Poppins',Helvetica] font-normal text-[17px]`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }}>
                            {t('courseView.trainingMethodDescription')}
                          </p>
                        </div>
                      ) : (
                        <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                          {t('courseView.noTrainingMethods')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            {/* Contenu Tab */}
            <TabsContent value="contenu" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      {t('courseView.content')}
                    </h2>
                  </div>
                  
                  {/* Sections (Blocs) */}
                  {sections.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-3`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                        📁 Blocks de la session ({sections.length})
                      </h3>
                      {sections.map((section: any, sectionIndex: number) => {
                        const isSectionExpanded = expandedSections.has(section.id);
                        const sectionChapters = chapters.filter((ch: any) => {
                          return ch.course_section_id === section.id || ch.section_id === section.id;
                        });
                        
                        return (
                          <div key={section.id} className={`rounded-[13px] border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-[#dadfe8] bg-[#f0f4f8]'}`}>
                            <div className="flex items-start gap-4 p-5">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full text-white [font-family:'Poppins',Helvetica] font-semibold" style={{ backgroundColor: accentColor }}>
                                {sectionIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                    {section.title}
                                  </h3>
                                  <div className="flex items-center gap-1">
                                    {editMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-red-500 hover:bg-red-100"
                                        onClick={() => {
                                          showConfirmation(
                                            'Supprimer le block',
                                            `Êtes-vous sûr de vouloir supprimer le block "${section.title}" et tous ses chapitres ? Cette action est irréversible.`,
                                            async () => {
                                              try {
                                                await sessionCreation.deleteSessionSection(sessionUuid, section.id);
                                                success('Block supprimé');
                                                const sectionsRes = await sessionCreation.getSessionSections(sessionUuid);
                                                if (sectionsRes.success && sectionsRes.data) {
                                                  setSections(sectionsRes.data);
                                                }
                                                const chaptersRes = await sessionCreation.getSessionChapters(sessionUuid);
                                                if (chaptersRes.success && chaptersRes.data) {
                                                  setChapters(chaptersRes.data);
                                                }
                                              } catch (err: any) {
                                                error('Erreur lors de la suppression');
                                              }
                                            }
                                          );
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-auto w-auto p-1"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedSections);
                                        if (isSectionExpanded) {
                                          newExpanded.delete(section.id);
                                        } else {
                                          newExpanded.add(section.id);
                                        }
                                        setExpandedSections(newExpanded);
                                      }}
                                    >
                                      {isSectionExpanded ? (
                                        <ChevronUp className="w-4 h-4" style={{ color: primaryColor }} />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" style={{ color: primaryColor }} />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {section.description && (
                                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15px] mb-3`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    {section.description}
                                  </p>
                                )}
                                <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                  {sectionChapters.length} chapitre{sectionChapters.length > 1 ? 's' : ''}
                                </p>
                                
                                {/* Section's Chapters */}
                                {isSectionExpanded && sectionChapters.length > 0 && (
                                  <div className="ml-4 mt-4 space-y-3">
                                    {sectionChapters.map((chapter: any, chapterIndex: number) => {
                                      const isChapterExpanded = expandedChapters.has(chapter.uuid);
                                      const toggleChapterInSection = () => {
                                        const newExpanded = new Set(expandedChapters);
                                        if (isChapterExpanded) {
                                          newExpanded.delete(chapter.uuid);
                                        } else {
                                          newExpanded.add(chapter.uuid);
                                        }
                                        setExpandedChapters(newExpanded);
                                      };

                                      return (
                                        <div key={chapter.uuid} className={`rounded-[10px] p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} group`}>
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
                                              {chapterIndex + 1}
                                            </div>
                                            {editMode && editingChapter === chapter.uuid ? (
                                              <Input
                                                value={chapterTitles[chapter.uuid] || chapter.title}
                                                onChange={(e) => setChapterTitles({ ...chapterTitles, [chapter.uuid]: e.target.value })}
                                                onBlur={async () => {
                                                  if (chapterTitles[chapter.uuid] && chapterTitles[chapter.uuid] !== chapter.title) {
                                                    try {
                                                      await sessionCreation.updateSessionChapter(chapter.uuid, {
                                                        title: chapterTitles[chapter.uuid]
                                                      });
                                                      success('Chapitre mis à jour');
                                                      const chaptersRes = await sessionCreation.getSessionChapters(sessionUuid);
                                                      if (chaptersRes.success && chaptersRes.data) {
                                                        setChapters(chaptersRes.data);
                                                      }
                                                    } catch (err: any) {
                                                      error('Erreur lors de la mise à jour');
                                                    }
                                                  }
                                                  setEditingChapter(null);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                  }
                                                }}
                                                className={`flex-1 text-[15px] font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                autoFocus
                                              />
                                            ) : (
                                              <>
                                                <span 
                                                  className={`font-medium text-[15px] flex-1 ${editMode ? 'cursor-pointer hover:opacity-70' : ''}`} 
                                                  style={{ color: isDark ? '#F9FAFB' : '#19294a' }}
                                                  onClick={() => {
                                                    if (editMode) {
                                                      setEditingChapter(chapter.uuid);
                                                      setChapterTitles({ ...chapterTitles, [chapter.uuid]: chapter.title });
                                                    }
                                                  }}
                                                >
                                                  {chapter.title}
                                                </span>
                                                {editMode && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                                                    onClick={() => {
                                                      setEditingChapter(chapter.uuid);
                                                      setChapterTitles({ ...chapterTitles, [chapter.uuid]: chapter.title });
                                                    }}
                                                  >
                                                    <Edit3 className="w-3 h-3" />
                                                  </Button>
                                                )}
                                              </>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-auto w-auto p-1"
                                              onClick={toggleChapterInSection}
                                            >
                                              {isChapterExpanded ? (
                                                <ChevronUp className="w-4 h-4" style={{ color: primaryColor }} />
                                              ) : (
                                                <ChevronDown className="w-4 h-4" style={{ color: primaryColor }} />
                                              )}
                                            </Button>
                                          </div>

                                          {/* Chapter Quiz Assignments in Section */}
                                          {isChapterExpanded && (chapter.quizzes || chapter.quiz_assignments) && ((chapter.quizzes?.length || 0) > 0 || (chapter.quiz_assignments?.length || 0) > 0) && (
                                            <div className="mt-3 ml-11 space-y-2">
                                              <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[12px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                Quiz du chapitre:
                                              </h5>
                                              {(chapter.quizzes || chapter.quiz_assignments || []).map((quizAssignment: any) => {
                                                const quiz = quizAssignment.quiz || quizAssignment;
                                                return (
                                                  <div 
                                                    key={quizAssignment.uuid || quizAssignment.id || quiz.uuid}
                                                    className={`flex items-start gap-2 p-2 rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity`} 
                                                    style={{ backgroundColor: isDark ? '#581C87' : '#F3E8FF' }}
                                                    onClick={() => navigateToRoute(`/quiz/${quiz.uuid}`)}
                                                  >
                                                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#A855F7' }}></div>
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-2">
                                                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[12px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                          {quiz.title}
                                                        </span>
                                                        <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#E9D5FF', color: '#7C3AED' }}>
                                                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                            📝 Quiz
                                                          </span>
                                                        </Badge>
                                                      </div>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        {quiz.duration && (
                                                          <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#DDD6FE', color: '#7C3AED' }}>
                                                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                              ⏱️ {quiz.duration} min
                                                            </span>
                                                          </Badge>
                                                        )}
                                                        {quiz.total_questions !== undefined && (
                                                          <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#DDD6FE', color: '#7C3AED' }}>
                                                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                              ❓ {quiz.total_questions} questions
                                                            </span>
                                                          </Badge>
                                                        )}
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Chapitres sans block */}
                  {(() => {
                    const orphanChapters = chapters.filter((ch: any) => {
                      return !ch.course_section_id && !ch.section_id;
                    });
                    
                    if (orphanChapters.length === 0 && sections.length === 0 && chapters.length === 0) {
                      return (
                        <div className={`text-center py-12 rounded-[13px] border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                          <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                            Aucun chapitre pour le moment
                          </p>
                        </div>
                      );
                    }
                    
                    if (orphanChapters.length === 0) return null;
                    
                    return (
                      <div className="space-y-4">
                        <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-3`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                          {sections.length > 0 ? '📄 Chapitres sans block' : '📚 Chapitres de la session'}
                        </h3>
                        {orphanChapters.map((chapter: any, index: number) => {
                        const isExpanded = expandedChapters.has(chapter.uuid);
                        const toggleChapter = () => {
                          const newExpanded = new Set(expandedChapters);
                          if (isExpanded) {
                            newExpanded.delete(chapter.uuid);
                          } else {
                            newExpanded.add(chapter.uuid);
                          }
                          setExpandedChapters(newExpanded);
                        };

                        return (
                          <div key={chapter.uuid} className={`rounded-[13px] hover:opacity-90 transition-colors group`} style={{ backgroundColor: isDark ? '#374151' : '#f9f9f9' }}>
                            <div className="flex items-start gap-4 p-5">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full text-white [font-family:'Poppins',Helvetica] font-semibold" style={{ backgroundColor: primaryColor }}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  {editMode && editingChapter === chapter.uuid ? (
                                    <Input
                                      value={chapterTitles[chapter.uuid] || chapter.title}
                                      onChange={(e) => setChapterTitles({ ...chapterTitles, [chapter.uuid]: e.target.value })}
                                      onBlur={async () => {
                                        if (chapterTitles[chapter.uuid] && chapterTitles[chapter.uuid] !== chapter.title) {
                                          try {
                                            await sessionCreation.updateSessionChapter(chapter.uuid, {
                                              title: chapterTitles[chapter.uuid]
                                            });
                                            success('Chapitre mis à jour');
                                            const chaptersRes = await sessionCreation.getSessionChapters(sessionUuid);
                                            if (chaptersRes.success && chaptersRes.data) {
                                              setChapters(chaptersRes.data);
                                            }
                                          } catch (err: any) {
                                            error('Erreur lors de la mise à jour');
                                          }
                                        }
                                        setEditingChapter(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur();
                                        }
                                      }}
                                      className={`flex-1 text-[17px] font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                      autoFocus
                                    />
                                  ) : (
                                    <>
                                      <h3 
                                        className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${editMode ? 'cursor-pointer hover:opacity-70' : ''}`} 
                                        style={{ color: isDark ? '#F9FAFB' : '#19294a' }}
                                        onClick={() => {
                                          if (editMode) {
                                            setEditingChapter(chapter.uuid);
                                            setChapterTitles({ ...chapterTitles, [chapter.uuid]: chapter.title });
                                          }
                                        }}
                                      >
                                        {chapter.title}
                                      </h3>
                                      {editMode && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => {
                                              setEditingChapter(chapter.uuid);
                                              setChapterTitles({ ...chapterTitles, [chapter.uuid]: chapter.title });
                                            }}
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-red-500 hover:bg-red-100"
                                            onClick={() => {
                                              showConfirmation(
                                                'Supprimer le chapitre',
                                                `Êtes-vous sûr de vouloir supprimer le chapitre "${chapter.title}" ? Cette action est irréversible.`,
                                                async () => {
                                                  try {
                                                    await sessionCreation.deleteSessionChapter(chapter.uuid);
                                                    success('Chapitre supprimé');
                                                    const chaptersRes = await sessionCreation.getSessionChapters(sessionUuid);
                                                    if (chaptersRes.success && chaptersRes.data) {
                                                      setChapters(chaptersRes.data);
                                                    }
                                                  } catch (err: any) {
                                                    error('Erreur lors de la suppression');
                                                  }
                                                }
                                              );
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {chapter.sub_chapters && chapter.sub_chapters.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-auto w-auto p-1"
                                      onClick={toggleChapter}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" style={{ color: primaryColor }} />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" style={{ color: primaryColor }} />
                                      )}
                                    </Button>
                                  )}
                                </div>
                                <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15px] mb-3`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                  {chapter.sub_chapters?.length || 0} sous-chapitres • {(chapter.content?.length || 0) + (chapter.sub_chapters?.reduce((total: number, sub: any) => total + (sub.content?.length || 0), 0) || 0)} éléments de contenu
                                </p>
                                
                                {/* Chapter's own content */}
                                {isExpanded && (
                                  <div className="ml-6 space-y-2 mb-4">
                                    <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[12px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                      Contenu du chapitre: {chapter.content?.length || 0} items
                                    </h5>
                                    {chapter.content && chapter.content.length > 0 ? (
                                      chapter.content.map((contentItem: any, contentIndex: number) => (
                                        <div key={contentItem.uuid} className={`flex items-start gap-2 p-2 rounded-[8px]`} style={{ backgroundColor: isDark ? '#4B5563' : '#f0f4f8' }}>
                                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className={`[font-family:'Poppins',Helvetica] font-medium text-[12px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                {contentItem.title}
                                              </span>
                                              <Badge className="bg-[#ebf1ff] rounded-[6px] px-2 py-0.5" style={{ color: primaryColor }}>
                                                <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                  {contentItem.type}
                                                </span>
                                              </Badge>
                                            </div>
                                            {contentItem.content && (
                                              <div 
                                                className={`[font-family:'Poppins',Helvetica] font-normal text-[11px] mt-1`} 
                                                style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                                              >
                                                {contentItem.content}
                                              </div>
                                            )}
                                            {contentItem.file_url && (
                                              <div className="mt-2">
                                                {contentItem.type === 'image' ? (
                                                  <img 
                                                    src={contentItem.file_url} 
                                                    alt={contentItem.title}
                                                    className="max-w-full h-auto rounded-[8px] border"
                                                    style={{ borderColor: isDark ? '#4B5563' : '#d2d2e7' }}
                                                  />
                                                ) : contentItem.type === 'video' ? (
                                                  <video 
                                                    src={contentItem.file_url} 
                                                    controls
                                                    className="max-w-full h-auto rounded-[8px] border"
                                                    style={{ borderColor: isDark ? '#4B5563' : '#d2d2e7' }}
                                                  >
                                                    Votre navigateur ne supporte pas la balise vidéo.
                                                  </video>
                                                ) : (
                                                  <div className={`p-3 rounded-[8px] border`} style={{ backgroundColor: isDark ? '#374151' : '#f0f4f8', borderColor: isDark ? '#4B5563' : '#d2d2e7' }}>
                                                    <div className="flex items-center gap-2">
                                                      <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                                                      <span className={`[font-family:'Poppins',Helvetica] font-medium text-[12px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                        {contentItem.title}
                                                      </span>
                                                      <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-auto p-1 text-[10px] hover:opacity-90 ml-auto"
                                                        style={{ color: primaryColor }}
                                                        onClick={() => window.open(contentItem.file_url, '_blank')}
                                                      >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Télécharger
                                                      </Button>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className={`p-3 rounded-[8px]`} style={{ backgroundColor: isDark ? '#374151' : '#e8f0f7' }}>
                                        <span className={`[font-family:'Poppins',Helvetica] font-normal text-[11px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                          Aucun contenu direct pour ce chapitre
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Chapter's own evaluations */}
                                {isExpanded && chapter.evaluations && chapter.evaluations.length > 0 && (
                                  <div className="ml-6 space-y-2 mb-4">
                                    <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[12px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                      Évaluations du chapitre:
                                    </h5>
                                    {chapter.evaluations.map((evaluation: any, evalIndex: number) => (
                                      <div key={evaluation.uuid} className={`flex items-start gap-2 p-2 rounded-[8px]`} style={{ backgroundColor: isDark ? '#4B5563' : '#f0f4f8' }}>
                                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: secondaryColor }}></div>
                                        <div className="flex-1">
                                          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[12px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                            {evaluation.title}
                                          </span>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-[#e8f0f7] rounded-[6px] px-2 py-0.5" style={{ color: secondaryColor }}>
                                              <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                {evaluation.type}
                                              </span>
                                            </Badge>
                                            {evaluation.due_date && (
                                              <Badge className="bg-[#f0f8ff] rounded-[6px] px-2 py-0.5" style={{ color: accentColor }}>
                                                <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                  Due: {new Date(evaluation.due_date).toLocaleDateString()}
                                                </span>
                                              </Badge>
                                            )}
                                          </div>
                                          {evaluation.description && (
                                            <div 
                                              className={`[font-family:'Poppins',Helvetica] font-normal text-[11px] mt-1`} 
                                              style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                                            >
                                              {evaluation.description.replace(/<[^>]*>/g, '')}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Chapter's quiz assignments */}
                                {isExpanded && (chapter.quizzes || chapter.quiz_assignments) && ((chapter.quizzes?.length || 0) > 0 || (chapter.quiz_assignments?.length || 0) > 0) && (
                                  <div className="ml-6 space-y-2 mb-4">
                                    <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[12px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                      Quiz du chapitre:
                                    </h5>
                                    {(chapter.quizzes || chapter.quiz_assignments || []).map((quizAssignment: any) => {
                                      const quiz = quizAssignment.quiz || quizAssignment;
                                      return (
                                        <div 
                                          key={quizAssignment.uuid || quizAssignment.id || quiz.uuid} 
                                          className={`flex items-start gap-2 p-2 rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity`} 
                                          style={{ backgroundColor: isDark ? '#581C87' : '#F3E8FF' }}
                                          onClick={() => navigateToRoute(`/quiz/${quiz.uuid}`)}
                                        >
                                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#A855F7' }}></div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className={`[font-family:'Poppins',Helvetica] font-medium text-[12px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                {quiz.title}
                                              </span>
                                              <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#E9D5FF', color: '#7C3AED' }}>
                                                <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                  📝 Quiz
                                                </span>
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                              {quiz.duration && (
                                                <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#DDD6FE', color: '#7C3AED' }}>
                                                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                    ⏱️ {quiz.duration} min
                                                  </span>
                                                </Badge>
                                              )}
                                              {quiz.total_questions !== undefined && (
                                                <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#DDD6FE', color: '#7C3AED' }}>
                                                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                    ❓ {quiz.total_questions} questions
                                                  </span>
                                                </Badge>
                                              )}
                                              {quiz.status && (
                                                <Badge className="rounded-[6px] px-2 py-0.5" style={{ 
                                                  backgroundColor: quiz.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                                                  color: quiz.status === 'active' ? '#065F46' : '#92400E'
                                                }}>
                                                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                    {quiz.status === 'active' ? '✓ Actif' : quiz.status === 'draft' ? '📝 Brouillon' : quiz.status}
                                                  </span>
                                                </Badge>
                                              )}
                                            </div>
                                            {quiz.description && (
                                              <div 
                                                className={`[font-family:'Poppins',Helvetica] font-normal text-[11px] mt-1`} 
                                                style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                                              >
                                                {quiz.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {/* Sub-chapters */}
                                {isExpanded && chapter.sub_chapters && chapter.sub_chapters.length > 0 && (
                                  <div className="ml-6 space-y-3">
                                    {chapter.sub_chapters.map((subChapter: any, subIndex: number) => (
                                      <div key={subChapter.uuid} className={`p-4 rounded-[10px]`} style={{ backgroundColor: isDark ? '#4B5563' : '#f0f4f8' }}>
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="flex items-center justify-center w-8 h-8 rounded-full text-white [font-family:'Poppins',Helvetica] font-semibold text-[14px]" style={{ backgroundColor: secondaryColor }}>
                                            {subIndex + 1}
                                          </div>
                                          <h4 className={`[font-family:'Poppins',Helvetica] font-medium text-[16px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                            {subChapter.title}
                                          </h4>
                                        </div>
                                        
                                        {/* Content items */}
                                        {subChapter.content && subChapter.content.length > 0 && (
                                          <div className="space-y-2">
                                            <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] mb-2`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                              Contenu:
                                            </h5>
                                            {subChapter.content.map((contentItem: any, contentIndex: number) => (
                                              <div key={contentItem.uuid} className={`flex items-start gap-3 p-3 rounded-[8px]`} style={{ backgroundColor: isDark ? '#374151' : '#e8f0f7' }}>
                                                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[14px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                      {contentItem.title}
                                                    </span>
                                                    <Badge className="bg-[#ebf1ff] rounded-[6px] px-2 py-0.5" style={{ color: primaryColor }}>
                                                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                        {contentItem.type}
                                                      </span>
                                                    </Badge>
                                                  </div>
                                                  {contentItem.content && (
                                                    <div 
                                                      className={`[font-family:'Poppins',Helvetica] font-normal text-[13px] mt-1`} 
                                                      style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                                                    >
                                                      {contentItem.content}
                                                    </div>
                                                  )}
                                                  {contentItem.file_url && (
                                                    <div className="mt-2">
                                                      {contentItem.type === 'image' ? (
                                                        <img 
                                                          src={contentItem.file_url} 
                                                          alt={contentItem.title}
                                                          className="max-w-full h-auto rounded-[8px] border"
                                                          style={{ borderColor: isDark ? '#4B5563' : '#d2d2e7' }}
                                                        />
                                                      ) : contentItem.type === 'video' ? (
                                                        <video 
                                                          src={contentItem.file_url} 
                                                          controls
                                                          className="max-w-full h-auto rounded-[8px] border"
                                                          style={{ borderColor: isDark ? '#4B5563' : '#d2d2e7' }}
                                                        >
                                                          Votre navigateur ne supporte pas la balise vidéo.
                                                        </video>
                                                      ) : (
                                                        <div className={`p-3 rounded-[8px] border`} style={{ backgroundColor: isDark ? '#374151' : '#f0f4f8', borderColor: isDark ? '#4B5563' : '#d2d2e7' }}>
                                                          <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                                                            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[12px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                              {contentItem.title}
                                                            </span>
                                                            <Button 
                                                              variant="ghost" 
                                                              size="sm" 
                                                              className="h-auto p-1 text-[10px] hover:opacity-90 ml-auto"
                                                              style={{ color: primaryColor }}
                                                              onClick={() => window.open(contentItem.file_url, '_blank')}
                                                            >
                                                              <Download className="w-3 h-3 mr-1" />
                                                              Télécharger
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Evaluations */}
                                        {subChapter.evaluations && subChapter.evaluations.length > 0 && (
                                          <div className="mt-3 space-y-2">
                                            <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] mb-2`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                              Évaluations:
                                            </h5>
                                            {subChapter.evaluations.map((evaluation: any, evalIndex: number) => (
                                              <div key={evaluation.uuid} className={`flex items-start gap-3 p-3 rounded-[8px]`} style={{ backgroundColor: isDark ? '#374151' : '#e8f0f7' }}>
                                                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: secondaryColor }}></div>
                                                <div className="flex-1">
                                                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[14px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                    {evaluation.title}
                                                  </span>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="bg-[#e8f0f7] rounded-[6px] px-2 py-0.5" style={{ color: secondaryColor }}>
                                                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                        {evaluation.type}
                                                      </span>
                                                    </Badge>
                                                    {evaluation.due_date && (
                                                      <Badge className="bg-[#f0f8ff] rounded-[6px] px-2 py-0.5" style={{ color: accentColor }}>
                                                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                          Due: {new Date(evaluation.due_date).toLocaleDateString()}
                                                        </span>
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  {evaluation.description && (
                                                    <div 
                                                      className={`[font-family:'Poppins',Helvetica] font-normal text-[13px] mt-1`} 
                                                      style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                                                    >
                                                      {evaluation.description.replace(/<[^>]*>/g, '')}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Sub-chapter Quiz Assignments */}
                                        {(subChapter.quizzes || subChapter.quiz_assignments) && ((subChapter.quizzes?.length || 0) > 0 || (subChapter.quiz_assignments?.length || 0) > 0) && (
                                          <div className="mt-3 space-y-2">
                                            <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] mb-2`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                              Quiz:
                                            </h5>
                                            {(subChapter.quizzes || subChapter.quiz_assignments || []).map((quizAssignment: any) => {
                                              const quiz = quizAssignment.quiz || quizAssignment;
                                              return (
                                                <div 
                                                  key={quizAssignment.uuid || quizAssignment.id || quiz.uuid}
                                                  className={`flex items-start gap-3 p-3 rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity`} 
                                                  style={{ backgroundColor: isDark ? '#581C87' : '#F3E8FF' }}
                                                  onClick={() => navigateToRoute(`/quiz/${quiz.uuid}`)}
                                                >
                                                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: '#A855F7' }}></div>
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                      <span className={`[font-family:'Poppins',Helvetica] font-medium text-[14px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                                        {quiz.title}
                                                      </span>
                                                      <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#E9D5FF', color: '#7C3AED' }}>
                                                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                          📝 Quiz
                                                        </span>
                                                      </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                      {quiz.duration && (
                                                        <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#DDD6FE', color: '#7C3AED' }}>
                                                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                            ⏱️ {quiz.duration} min
                                                          </span>
                                                        </Badge>
                                                      )}
                                                      {quiz.total_questions !== undefined && (
                                                        <Badge className="rounded-[6px] px-2 py-0.5" style={{ backgroundColor: '#DDD6FE', color: '#7C3AED' }}>
                                                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                            ❓ {quiz.total_questions} questions
                                                          </span>
                                                        </Badge>
                                                      )}
                                                      {quiz.status && (
                                                        <Badge className="rounded-[6px] px-2 py-0.5" style={{ 
                                                          backgroundColor: quiz.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                                                          color: quiz.status === 'active' ? '#065F46' : '#92400E'
                                                        }}>
                                                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[11px]">
                                                            {quiz.status === 'active' ? '✓ Actif' : quiz.status === 'draft' ? '📝 Brouillon' : quiz.status}
                                                          </span>
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    {quiz.description && (
                                                      <div 
                                                        className={`[font-family:'Poppins',Helvetica] font-normal text-[13px] mt-1`} 
                                                        style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                                                      >
                                                        {quiz.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                        
                                        {/* Support Files */}
                                        {subChapter.support_files && subChapter.support_files.length > 0 && (
                                          <div className="mt-2 space-y-2">
                                            <h5 className={`[font-family:'Poppins',Helvetica] font-medium text-[12px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                              Fichiers de support:
                                            </h5>
                                            {subChapter.support_files.map((supportFile: any, fileIndex: number) => (
                                              <div key={supportFile.uuid || fileIndex} className={`flex items-center gap-2 p-2 rounded-[8px]`} style={{ backgroundColor: isDark ? '#374151' : '#e8f0f7' }}>
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                                                <span className={`[font-family:'Poppins',Helvetica] font-normal text-[12px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                                  {supportFile.name || supportFile.title || 'Support File'}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      {t('courseView.documents')}
                    </h2>
                    {editMode && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDocumentModal(true)}
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          className="h-auto px-3 py-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ajouter Document
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Documents (excluding questionnaires) */}
                  {documents.filter((d: any) => !d.is_questionnaire).length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-3`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                        📚 Documents de la Session ({documents.filter((d: any) => !d.is_questionnaire).length})
                      </h3>
                      {documents.filter((d: any) => !d.is_questionnaire).map((doc: any) => (
                        <div key={doc.uuid || doc.id} className={`rounded-[13px] hover:opacity-90 transition-colors group`} style={{ backgroundColor: isDark ? '#374151' : '#f9f9f9' }}>
                          <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: doc.is_certificate ? '#FFD700' : primaryColor }}>
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                  {doc.name || doc.title}
                                </h3>
                                {doc.description && (
                                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px] mb-2`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    {doc.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge className="bg-[#ebf1ff] rounded-[8px] px-3 py-1" style={{ color: primaryColor }}>
                                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                      {doc.document_type === 'template' ? '📋 Template' : doc.document_type === 'custom_builder' ? '🎨 Custom' : '📤 Upload'}
                                    </span>
                                  </Badge>
                                  {doc.audience_type && (
                                    <Badge className="bg-[#e8f0f7] rounded-[8px] px-3 py-1" style={{ color: secondaryColor }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {doc.audience_type === 'students' ? '👨‍🎓 Étudiants' : doc.audience_type === 'instructors' ? '👨‍🏫 Formateurs' : '🏢 Organisation'}
                                      </span>
                                    </Badge>
                                  )}
                                  {doc.is_certificate && (
                                    <Badge className="bg-[#FFF9E6] rounded-[8px] px-3 py-1" style={{ color: '#FFD700' }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        🎓 Certificat
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.file_url && (
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                  style={{ color: secondaryColor }}
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                  Télécharger
                                </Button>
                              )}
                              {editMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    showConfirmation(
                                      'Supprimer le document',
                                      `Êtes-vous sûr de vouloir supprimer le document "${doc.name || doc.title}" ? Cette action est irréversible.`,
                                      async () => {
                                        try {
                                          await sessionCreation.deleteDocumentEnhanced(sessionUuid, doc.id || doc.uuid);
                                          success('Document supprimé');
                                          const docsRes = await sessionCreation.getDocumentsEnhanced(sessionUuid);
                                          if (docsRes.success && docsRes.data) {
                                            setDocuments(docsRes.data);
                                          }
                                        } catch (err: any) {
                                          error('Erreur lors de la suppression');
                                        }
                                      }
                                    );
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No documents message */}
                  {documents.filter((d: any) => !d.is_questionnaire).length === 0 && (
                    <div className={`text-center py-12 rounded-[13px] border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                        Aucun document pour le moment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questionnaires Tab */}
            <TabsContent value="questionnaire" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      {t('courseView.questionnaire')}
                    </h2>
                    {editMode && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQuestionnaireModal(true)}
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          className="h-auto px-3 py-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ajouter Questionnaire
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Questionnaires */}
                  {questionnaires.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-3`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                        📋 Questionnaires ({questionnaires.length})
                      </h3>
                      {questionnaires.map((questionnaire: any) => (
                        <div key={questionnaire.uuid || questionnaire.id} className={`rounded-[13px] hover:opacity-90 transition-colors group`} style={{ backgroundColor: isDark ? '#374151' : '#f9f9f9' }}>
                          <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: '#007aff' }}>
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                  {questionnaire.name || questionnaire.title}
                                </h3>
                                {questionnaire.description && (
                                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px] mb-2`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    {questionnaire.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                  {questionnaire.questionnaire_type && (
                                    <Badge className="bg-[#E8F0F7] rounded-[8px] px-3 py-1" style={{ color: '#007aff' }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {questionnaire.questionnaire_type === 'pre_course' ? '📋 Pré-formation' : 
                                         questionnaire.questionnaire_type === 'post_course' ? '✅ Post-formation' : 
                                         questionnaire.questionnaire_type === 'mid_course' ? '📊 Mi-parcours' : '⚙️ Personnalisé'}
                                      </span>
                                    </Badge>
                                  )}
                                  {questionnaire.questions && (
                                    <Badge className="bg-[#FFF9E6] rounded-[8px] px-3 py-1" style={{ color: '#ff7700' }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {questionnaire.questions.length} question{questionnaire.questions.length > 1 ? 's' : ''}
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Questions */}
                                {questionnaire.questions && questionnaire.questions.length > 0 && (
                                  <div className="mt-4 ml-4 space-y-2">
                                    <h4 className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] mb-2`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                      Questions:
                                    </h4>
                                    {questionnaire.questions.map((question: any, qIndex: number) => (
                                      <div key={question.uuid || qIndex} className={`flex items-start gap-2 p-3 rounded-[8px]`} style={{ backgroundColor: isDark ? '#4B5563' : '#f0f4f8' }}>
                                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                                        <div className="flex-1">
                                          <p className={`[font-family:'Poppins',Helvetica] font-medium text-[12px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                            {question.question_text || question.text}
                                          </p>
                                          
                                          {/* Display options for multiple choice questions */}
                                          {question.options && question.options.length > 0 ? (
                                            <div className="mb-2">
                                              <p className={`[font-family:'Poppins',Helvetica] font-normal text-[10px] mb-1`} style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                Options:
                                              </p>
                                              <div className="flex flex-wrap gap-1">
                                                {question.options.map((option: any, optionIndex: number) => (
                                                  <Badge 
                                                    key={optionIndex} 
                                                    className="bg-[#f0f8ff] rounded-[4px] px-2 py-0.5" 
                                                    style={{ color: accentColor }}
                                                  >
                                                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[9px]">
                                                      {typeof option === 'string' ? option : option.text || option.label}
                                                    </span>
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          ) : null}
                                          
                                          <div className="flex items-center gap-2">
                                            {question.question_type && (
                                              <Badge className="bg-[#e8f0f7] rounded-[6px] px-2 py-0.5" style={{ color: secondaryColor }}>
                                                <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                  {question.question_type}
                                                </span>
                                              </Badge>
                                            )}
                                            {question.is_required && (
                                              <Badge className="bg-[#fee2e2] rounded-[6px] px-2 py-0.5" style={{ color: '#dc2626' }}>
                                                <span className="[font-family:'Poppins',Helvetica] font-normal text-[10px]">
                                                  Required
                                                </span>
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {questionnaire.file_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                  style={{ color: secondaryColor }}
                                  onClick={() => window.open(questionnaire.file_url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                  PDF
                                </Button>
                              )}
                              {editMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    showConfirmation(
                                      'Supprimer le questionnaire',
                                      `Êtes-vous sûr de vouloir supprimer le questionnaire "${questionnaire.name || questionnaire.title}" ? Toutes les réponses des étudiants seront perdues.`,
                                      async () => {
                                        try {
                                          await sessionCreation.deleteDocumentEnhanced(sessionUuid, questionnaire.id || questionnaire.uuid);
                                          success('Questionnaire supprimé');
                                          const questionnairesRes = await sessionCreation.getQuestionnaires(sessionUuid);
                                          if (questionnairesRes.success && questionnairesRes.data) {
                                            setQuestionnaires(questionnairesRes.data);
                                          }
                                        } catch (err: any) {
                                          error('Erreur lors de la suppression');
                                        }
                                      }
                                    );
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-12 rounded-[13px] border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                        Aucun questionnaire pour le moment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Séances Tab */}
            <TabsContent value="seances" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      📅 Séances ({instances.length})
                    </h2>
                  </div>
                  
                  {instances.length === 0 ? (
                    <div className={`text-center py-12 rounded-[13px] border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                        Aucune séance pour le moment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {instances.map((instance: any, index: number) => {
                        // Build full location string for presentiel
                        const buildLocation = () => {
                          const parts = [];
                          if (instance.location_address) parts.push(instance.location_address);
                          if (instance.location_building) parts.push(instance.location_building);
                          if (instance.location_room) parts.push(`Salle ${instance.location_room}`);
                          if (instance.location_postal_code) parts.push(instance.location_postal_code);
                          if (instance.location_city) parts.push(instance.location_city);
                          if (instance.location_country) parts.push(instance.location_country);
                          return parts.length > 0 ? parts.join(', ') : instance.full_location || 'Non spécifiée';
                        };

                        const getStatusBadgeColor = (status: string) => {
                          switch (status) {
                            case 'completed': return { bg: '#D1FAE5', color: '#065F46', text: '✓ Terminée' };
                            case 'in_progress': return { bg: '#DBEAFE', color: '#1E40AF', text: '▶ En cours' };
                            case 'cancelled': return { bg: '#FEE2E2', color: '#991B1B', text: '✗ Annulée' };
                            case 'scheduled': return { bg: '#FEF3C7', color: '#92400E', text: '📅 Planifiée' };
                            default: return { bg: '#F3F4F6', color: '#374151', text: status };
                          }
                        };

                        const statusBadge = getStatusBadgeColor(instance.status || 'scheduled');

                        return (
                          <div key={instance.uuid || index} className={`rounded-[13px] hover:opacity-90 transition-colors group`} style={{ backgroundColor: isDark ? '#374151' : '#f9f9f9' }}>
                            <div className="p-5 space-y-4">
                              {/* Header with type and status */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full text-white [font-family:'Poppins',Helvetica] font-semibold" style={{ backgroundColor: primaryColor }}>
                                    {index + 1}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getInstanceTypeIcon(instance.instance_type)}
                                    <Badge className="bg-[#ebf1ff] rounded-[8px] px-3 py-1" style={{ color: primaryColor }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {getInstanceTypeLabel(instance.instance_type)}
                                      </span>
                                    </Badge>
                                    <Badge className="rounded-[8px] px-3 py-1" style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {statusBadge.text}
                                      </span>
                                    </Badge>
                                    {instance.is_cancelled && (
                                      <Badge className="bg-[#FEE2E2] rounded-[8px] px-3 py-1" style={{ color: '#991B1B' }}>
                                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                          Annulée
                                        </span>
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Date and Time */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                    {formatDate(instance.start_date)}
                                  </h3>
                                </div>
                                {instance.start_time && (
                                  <div className="flex items-center gap-2 ml-6">
                                    <Clock className="w-4 h-4" style={{ color: secondaryColor }} />
                                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                      {instance.start_time.substring(0, 5)} - {instance.end_time ? instance.end_time.substring(0, 5) : 'Non spécifié'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Présentiel Details */}
                              {instance.instance_type === 'presentiel' && (
                                <div className="space-y-2 ml-6">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
                                    <div className="flex-1">
                                      <h4 className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                        Lieu
                                      </h4>
                                      <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                        {buildLocation()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Distanciel Details */}
                              {instance.instance_type === 'distanciel' && (
                                <div className="space-y-2 ml-6">
                                  {instance.platform_type && (
                                    <div className="flex items-center gap-2">
                                      <Monitor className="w-4 h-4" style={{ color: primaryColor }} />
                                      <Badge className="bg-[#e8f0f7] rounded-[6px] px-2 py-0.5" style={{ color: secondaryColor }}>
                                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[12px]">
                                          {instance.platform_type}
                                        </span>
                                      </Badge>
                                    </div>
                                  )}
                                  {instance.meeting_link && (
                                    <div className="flex items-center gap-2">
                                      <Video className="w-4 h-4" style={{ color: primaryColor }} />
                                      <a 
                                        href={instance.meeting_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`[font-family:'Poppins',Helvetica] font-medium text-[13px] hover:underline`}
                                        style={{ color: primaryColor }}
                                      >
                                        Rejoindre la réunion
                                      </a>
                                    </div>
                                  )}
                                  {instance.meeting_password && (
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-[#FFF9E6] rounded-[6px] px-2 py-0.5" style={{ color: '#ff7700' }}>
                                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[12px]">
                                          🔒 Mot de passe: {instance.meeting_password}
                                        </span>
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* E-learning Details */}
                              {instance.instance_type === 'e-learning' && (
                                <div className="space-y-2 ml-6">
                                  {instance.elearning_platform && (
                                    <div className="flex items-center gap-2">
                                      <Monitor className="w-4 h-4" style={{ color: primaryColor }} />
                                      <Badge className="bg-[#e8f0f7] rounded-[6px] px-2 py-0.5" style={{ color: secondaryColor }}>
                                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[12px]">
                                          {instance.elearning_platform}
                                        </span>
                                      </Badge>
                                    </div>
                                  )}
                                  {instance.elearning_link && (
                                    <div className="flex items-center gap-2">
                                      <Monitor className="w-4 h-4" style={{ color: primaryColor }} />
                                      <a 
                                        href={instance.elearning_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`[font-family:'Poppins',Helvetica] font-medium text-[13px] hover:underline`}
                                        style={{ color: primaryColor }}
                                      >
                                        Accéder à la plateforme
                                      </a>
                                    </div>
                                  )}
                                  {instance.access_start_date && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" style={{ color: secondaryColor }} />
                                      <span className={`[font-family:'Poppins',Helvetica] font-normal text-[12px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                        Accès du {formatDate(instance.access_start_date)} 
                                        {instance.access_end_date && ` au ${formatDate(instance.access_end_date)}`}
                                      </span>
                                    </div>
                                  )}
                                  {instance.is_self_paced !== undefined && (
                                    <Badge className="bg-[#F0F8FF] rounded-[6px] px-2 py-0.5" style={{ color: accentColor }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[12px]">
                                        {instance.is_self_paced ? '⏱️ À votre rythme' : '📅 Horaires fixes'}
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Participants Info */}
                              {(instance.max_participants !== undefined || instance.current_participants !== undefined) && (
                                <div className="flex items-center gap-3 ml-6">
                                  <Users className="w-4 h-4" style={{ color: secondaryColor }} />
                                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    {instance.current_participants || 0} / {instance.max_participants || '∞'} participants
                                  </span>
                                  {instance.max_participants && instance.current_participants >= instance.max_participants && (
                                    <Badge className="bg-[#FEE2E2] rounded-[6px] px-2 py-0.5" style={{ color: '#991B1B' }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[12px]">
                                        Complet
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Trainers */}
                              {instance.trainer_ids && instance.trainer_ids.length > 0 && (
                                <div className="flex items-center gap-2 ml-6">
                                  <User className="w-4 h-4" style={{ color: accentColor }} />
                                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                    {instance.trainer_ids.length} formateur{instance.trainer_ids.length > 1 ? 's' : ''} assigné{instance.trainer_ids.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}

                              {/* Cancellation Reason */}
                              {instance.is_cancelled && instance.cancellation_reason && (
                                <div className="ml-6 p-3 rounded-[8px]" style={{ backgroundColor: isDark ? '#4B5563' : '#FEE2E2' }}>
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: '#991B1B' }} />
                                    <div>
                                      <h4 className={`[font-family:'Poppins',Helvetica] font-medium text-[13px] mb-1`} style={{ color: '#991B1B' }}>
                                        Raison d'annulation
                                      </h4>
                                      <p className={`[font-family:'Poppins',Helvetica] font-normal text-[12px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                        {instance.cancellation_reason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="space-y-4">
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Aucun participant inscrit à cette session
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant) => (
                    <Card key={participant.uuid} className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {participant.user?.name || 'Utilisateur'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {participant.user?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={participant.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {participant.status}
                              </Badge>
                              {participant.progress_percentage !== undefined && (
                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {participant.progress_percentage.toFixed(0)}% complété
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Déroulement Tab */}
            <TabsContent value="deroulement" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      {t('courseView.workflow')}
                    </h2>
                    {editMode && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowWorkflowModal(true)}
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          className="h-auto px-3 py-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ajouter Workflow
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Flow Actions */}
                  {workflows.length > 0 && (
                    <div className="space-y-6 mb-6">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-3`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                        ⚡ Actions Automatisées ({workflows.length})
                      </h3>
                      {workflows.map((action: any, index: number) => {
                        const getActionIcon = () => {
                          if (action.dest_type === 'email') return '📧';
                          if (action.dest_type === 'notification') return '🔔';
                          if (action.dest_type === 'webhook') return '🔗';
                          if (action.type === 'email') return '📧';
                          if (action.type === 'notification') return '🔔';
                          return '⚡';
                        };
                        
                        const getTimingLabel = () => {
                          const refLabels: any = {
                            enrollment: 'inscription',
                            completion: 'fin de la session',
                            start: 'début de la session',
                            custom: 'date personnalisée'
                          };
                          const timeLabels: any = {
                            on: 'Le jour de',
                            before: 'Avant',
                            after: 'Après'
                          };
                          
                          let label = `${timeLabels[action.time_type] || 'Le jour de'} ${refLabels[action.ref_date] || 'l\'inscription'}`;
                          if (action.n_days > 0) {
                            label += ` (${action.n_days} jour${action.n_days > 1 ? 's' : ''})`;
                          }
                          if (action.custom_time) {
                            label += ` à ${action.custom_time.substring(0, 5)}`;
                          }
                          return label;
                        };
                        
                        return (
                          <div key={action.id || action.uuid || index} className="relative pl-8 pb-6 border-l-2 last:border-l-0 last:pb-0 group" style={{ borderColor: isDark ? '#4B5563' : '#d2d2e7' }}>
                            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full border-4 border-white" style={{ backgroundColor: primaryColor }}></div>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {(action.time_type || action.ref_date) && (
                                    <Badge className="bg-[#ffe5ca] rounded-[8px] px-3 py-1" style={{ color: accentColor }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[13px]">
                                        {getTimingLabel()}
                                      </span>
                                    </Badge>
                                  )}
                                  {action.email && (
                                    <Badge className="bg-[#E8F0F7] rounded-[8px] px-3 py-1" style={{ color: primaryColor }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {typeof action.email === 'string' ? action.email : action.email.name}
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[19px] mb-2`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                  {getActionIcon()} {action.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-[#F0F8FF] rounded-[8px] px-3 py-1" style={{ color: '#007aff' }}>
                                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                      {action.dest_type === 'email' || action.type === 'email' ? '📧 Email' : 
                                       action.dest_type === 'notification' || action.type === 'notification' ? '🔔 Notification' : 
                                       action.dest_type === 'webhook' || action.type === 'webhook' ? '🔗 Webhook' : 
                                       action.type || '⚡ Action'}
                                    </span>
                                  </Badge>
                                  {action.files && action.files.length > 0 && (
                                    <Badge className="bg-[#FFF9E6] rounded-[8px] px-3 py-1" style={{ color: '#ff7700' }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        📎 {action.files.length} fichier{action.files.length > 1 ? 's' : ''}
                                      </span>
                                    </Badge>
                                  )}
                                  {action.is_active !== undefined && (
                                    <Badge className={`rounded-[8px] px-3 py-1`} style={{ 
                                      backgroundColor: action.is_active ? '#D1FAE5' : '#FEF3C7',
                                      color: action.is_active ? '#065F46' : '#92400E'
                                    }}>
                                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                        {action.is_active ? '✓ Actif' : '⏸️ Inactif'}
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {editMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    showConfirmation(
                                      'Supprimer l\'action automatique',
                                      `Êtes-vous sûr de vouloir supprimer l'action "${action.title}" ? Cette action est irréversible.`,
                                      async () => {
                                        try {
                                          await sessionCreation.deleteSessionWorkflowAction(sessionUuid, action.uuid || action.id);
                                          success('Workflow supprimé');
                                          const flowRes = await sessionCreation.getWorkflowActions(sessionUuid);
                                          if (flowRes.success && flowRes.data) {
                                            setWorkflows(flowRes.data.actions || flowRes.data || []);
                                          }
                                        } catch (err: any) {
                                          error('Erreur lors de la suppression');
                                        }
                                      }
                                    );
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Supprimer
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* No workflows message */}
                  {workflows.length === 0 && (
                    <div className={`text-center py-12 rounded-[13px] border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <Settings className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                        Aucun workflow pour le moment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="w-[500px] flex flex-col gap-[19px] mt-16">
            {/* Objectives Card */}
            {(editMode ? editableObjectives : objectives).length > 0 && (
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
              <CardContent className="p-5 space-y-7">
                <div className="flex items-center justify-between">
                  <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: successColor }}>
                    Objectifs ({(editMode ? editableObjectives : objectives).length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditableObjectives([...editableObjectives, {
                            uuid: `temp-${Date.now()}`,
                            title: 'Nouvel objectif',
                            description: 'Description de l\'objectif',
                            order_index: editableObjectives.length
                          }]);
                        }}
                        className="h-auto px-2 py-1 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-auto w-auto p-0"
                      onClick={() => setIsObjectivesExpanded(!isObjectivesExpanded)}
                    >
                      {isObjectivesExpanded ? (
                        <ChevronUp className="w-[26px] h-[26px]" style={{ color: secondaryColor }} />
                      ) : (
                        <ChevronDown className="w-[26px] h-[26px]" style={{ color: secondaryColor }} />
                      )}
                    </Button>
                  </div>
                </div>

                {isObjectivesExpanded && (
                  <div className="space-y-2.5">
                    {(editMode ? editableObjectives : objectives).map((objective, index) => (
                      <div key={objective.uuid || index} className="flex items-start gap-3 group">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" />
                        {editMode ? (
                          <div className="flex-1">
                            <Input
                              value={objective.title || ''}
                              onChange={(e) => {
                                const newObjectives = [...editableObjectives];
                                newObjectives[index] = { ...newObjectives[index], title: e.target.value };
                                setEditableObjectives(newObjectives);
                              }}
                              className={`text-xs font-medium mb-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                              placeholder="Titre de l'objectif"
                            />
                            <RichTextEditor
                              value={objective.description || ''}
                              onChange={(newValue) => {
                                const newObjectives = [...editableObjectives];
                                newObjectives[index] = { ...newObjectives[index], description: newValue };
                                setEditableObjectives(newObjectives);
                              }}
                              placeholder="Description de l'objectif"
                              minHeight="60px"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditableObjectives(editableObjectives.filter((_, i) => i !== index));
                              }}
                              className="h-auto px-2 py-1 text-xs text-red-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className={`[font-family:'Poppins',Helvetica] font-medium text-[11px]`} 
                            style={{ color: secondaryColor }}
                          >
                            {objective.title || objective.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Modules Card */}
            {(editMode ? editableModules : modules).length > 0 && (
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
              <CardContent className="p-5 space-y-7">
                <div className="flex items-center justify-between">
                  <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: primaryColor }}>
                    Modules ({(editMode ? editableModules : modules).length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditableModules([...editableModules, {
                            uuid: `temp-${Date.now()}`,
                            title: 'Nouveau module',
                            description: 'Description du module',
                            order_index: editableModules.length
                          }]);
                        }}
                        className="h-auto px-2 py-1 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-auto w-auto p-0"
                      onClick={() => setIsModulesExpanded(!isModulesExpanded)}
                    >
                      {isModulesExpanded ? (
                        <ChevronUp className="w-[26px] h-[26px]" style={{ color: primaryColor }} />
                      ) : (
                        <ChevronDown className="w-[26px] h-[26px]" style={{ color: primaryColor }} />
                      )}
                    </Button>
                  </div>
                </div>

                {isModulesExpanded && (
                  <div className="space-y-2">
                    {(editMode ? editableModules : modules).map((module: any, index: number) => (
                      <div
                        key={module.uuid || index}
                        className={`flex flex-col gap-2 w-full px-[17px] py-3 rounded-[18px] hover:opacity-90 transition-colors group`}
                        style={{ backgroundColor: isDark ? '#374151' : '#e8f0f7' }}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4" style={{ color: primaryColor }} />
                          {editMode ? (
                            <Input
                              value={module.title || ''}
                              onChange={(e) => {
                                const newModules = [...editableModules];
                                newModules[index] = { ...newModules[index], title: e.target.value };
                                setEditableModules(newModules);
                              }}
                              className={`flex-1 text-[11px] font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                              placeholder="Titre du module"
                            />
                          ) : (
                            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[11px] text-left`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              {module.title}
                            </span>
                          )}
                        </div>
                        {editMode ? (
                          <div className="ml-7">
                            <RichTextEditor
                              value={module.description || ''}
                              onChange={(newValue) => {
                                const newModules = [...editableModules];
                                newModules[index] = { ...newModules[index], description: newValue };
                                setEditableModules(newModules);
                              }}
                              placeholder="Description du module"
                              minHeight="50px"
                            />
                          </div>
                        ) : module.description && (
                          <div 
                            className={`[font-family:'Poppins',Helvetica] font-normal text-[10px] text-left ml-7`} 
                            style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                            dangerouslySetInnerHTML={{ __html: module.description }}
                          />
                        )}
                        {editMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditableModules(editableModules.filter((_, i) => i !== index));
                            }}
                            className="h-auto px-2 py-1 text-xs text-red-500 ml-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Supprimer
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Trainers Card */}
            {trainers.length > 0 && (
              <Card className={`rounded-[18px] border`} style={{ backgroundColor: isDark ? '#1E3A8A' : '#e5f3ff', borderColor: primaryColor }}>
                <CardContent className="p-[17px] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      {t('courseView.trainers')} ({trainers.length})
                    </h3>
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTrainerModal(true)}
                        style={{ backgroundColor: `${primaryColor}`, color: 'white' }}
                        className="h-auto px-2 py-1 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-0">
                    {trainers.map((trainer: any, index: number) => {
                      const trainerData = trainer.trainer || trainer;
                      return (
                        <div
                          key={trainerData.uuid || trainerData.id || index}
                          className={`flex items-center gap-3 px-[21px] py-3 rounded-[16.17px] border group relative ${
                            index > 0 ? "-ml-px" : ""
                          }`}
                          style={{ 
                            backgroundColor: isDark ? '#374151' : 'white',
                            borderColor: isDark ? '#4B5563' : '#e8f0f7'
                          }}
                        >
                          {trainerData.avatar_url || trainerData.image_url ? (
                            <img
                              className="w-[54px] h-[54px] rounded-full object-cover"
                              alt={trainerData.name}
                              src={trainerData.avatar_url || trainerData.image_url}
                            />
                          ) : (
                            <div 
                              className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-white font-semibold text-lg"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {trainerData.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'TR'}
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5 flex-1">
                            <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              {trainerData.name}
                            </h4>
                            {trainerData.specialization && (
                              <Badge className="bg-[#ebf1ff] border-[0.83px] rounded-[10.83px] px-2.5 py-0.5 w-fit" style={{ borderColor: primaryColor }}>
                                <GraduationCap className="w-3 h-3" style={{ color: primaryColor }} />
                                <span className={`[font-family:'Poppins',Helvetica] font-medium text-xs ml-2`} style={{ color: primaryColor }}>
                                  {trainerData.specialization}
                                </span>
                              </Badge>
                            )}
                          </div>
                          {editMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                showConfirmation(
                                  'Retirer le formateur',
                                  `Êtes-vous sûr de vouloir retirer ${trainerData.name} de la session ? Il perdra tous ses accès et permissions.`,
                                  async () => {
                                    try {
                                      const trainerId = trainerData.id || trainerData.trainer_id || trainerData.uuid;
                                      await sessionCreation.removeSessionTrainer(sessionUuid, trainerId);
                                      success('Formateur retiré');
                                      const trainersRes = await sessionCreation.getSessionTrainers(sessionUuid);
                                      if (trainersRes.success && trainersRes.data) {
                                        setTrainers(trainersRes.data);
                                      }
                                    } catch (err: any) {
                                      error('Erreur lors de la suppression');
                                    }
                                  }
                                );
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
      </div>

      {/* Trainer Modal */}
      {editMode && (
        <TrainerPermissionsModal
          isOpen={showTrainerModal}
          onClose={() => setShowTrainerModal(false)}
          onSave={async (trainerId: number | string, permissions: any) => {
            try {
              const assignmentData = { instructor_id: trainerId, permissions };
              await sessionCreation.assignSessionTrainer(sessionUuid, assignmentData);
              success('Formateur assigné avec succès');
              // Reload trainers
              const trainersRes = await sessionCreation.getSessionTrainers(sessionUuid);
              if (trainersRes.success && trainersRes.data) {
                setTrainers(trainersRes.data);
              }
              setShowTrainerModal(false);
            } catch (err: any) {
              error(err.message || 'Erreur lors de l\'assignation du formateur');
              throw err;
            }
          }}
          courseUuid={sessionUuid}
          availableTrainers={[]}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

