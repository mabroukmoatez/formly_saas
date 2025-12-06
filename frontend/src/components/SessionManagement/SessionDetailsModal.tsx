/**
 * SessionDetailsModal Component
 * Modal with tabs: Informations Générales, Séances & Émargement, Déroulement
 * 
 * Connecté aux endpoints:
 * - GET /course-sessions/{uuid}/slots/{slotUuid}/attendance
 * - POST /course-sessions/{uuid}/slots/{slotUuid}/attendance
 * - GET /course-sessions/{uuid}/workflow-actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  X, 
  Calendar, 
  Clock, 
  Download,
  ChevronDown,
  ChevronUp,
  QrCode,
  ExternalLink,
  MapPin,
  Video,
  User,
  Check,
  FileText,
  Users,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { courseSessionService } from '../../services/courseSession';
import { sessionOverrideService } from '../../services/sessionOverride';
import type { SlotAttendance, WorkflowAction as ApiWorkflowAction, AttendanceCode } from '../../services/courseSession.types';
import type { SessionData, SessionSlot, SlotParticipantAttendance, WorkflowAction, SessionTrainer } from './types';

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  sessionUuid?: string; // UUID pour les appels API
  slots?: SessionSlot[];
  trainers?: SessionTrainer[];
  workflowActions?: WorkflowAction[];
  onShowQRCode?: (slot: SessionSlot) => void;
  onShowAttendanceCode?: (slot: SessionSlot) => void;
  onEditAttendance?: (slot: SessionSlot, participant: SlotParticipantAttendance, period: 'morning' | 'afternoon') => void;
  onNavigateToEvaluation?: () => void;
  onRefresh?: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  onClose,
  session,
  sessionUuid,
  slots = [],
  trainers = [],
  workflowActions: initialWorkflowActions = [],
  onShowQRCode,
  onShowAttendanceCode,
  onEditAttendance,
  onNavigateToEvaluation,
  onRefresh
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [activeTab, setActiveTab] = useState<'general' | 'seances' | 'deroulement'>('general');
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  
  // ==================== ÉTAT POUR LES DONNÉES API ====================
  const [slotAttendanceData, setSlotAttendanceData] = useState<Record<string, SlotAttendance>>({});
  const [workflowActions, setWorkflowActions] = useState<ApiWorkflowAction[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<Record<string, boolean>>({});
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [attendanceCodes, setAttendanceCodes] = useState<Record<string, AttendanceCode>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Slots réels depuis les props
  const realSlots = slots || [];
  
  // Workflow actions - utiliser les données API si chargées, sinon les props
  const realWorkflowActions = workflowActions.length > 0 ? workflowActions : initialWorkflowActions;

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  /**
   * Charge les données d'émargement pour une séance spécifique
   */
  const loadSlotAttendance = useCallback(async (slotUuid: string) => {
    if (!sessionUuid || loadingAttendance[slotUuid] || slotAttendanceData[slotUuid]) return;
    
    setLoadingAttendance(prev => ({ ...prev, [slotUuid]: true }));
    try {
      const response = await courseSessionService.getSlotAttendance(sessionUuid, slotUuid);
      if (response.success && response.data) {
        setSlotAttendanceData(prev => ({ ...prev, [slotUuid]: response.data }));
      }
    } catch (error) {
      console.error('Erreur chargement émargement:', error);
    } finally {
      setLoadingAttendance(prev => ({ ...prev, [slotUuid]: false }));
    }
  }, [sessionUuid, loadingAttendance, slotAttendanceData]);

  /**
   * Charge les actions du workflow (override de session ou du cours)
   */
  const loadWorkflowActions = useCallback(async () => {
    if (!sessionUuid || loadingWorkflow) return;
    
    setLoadingWorkflow(true);
    try {
      // D'abord, essayer de charger les workflow actions override de la session
      try {
        const overrideResponse = await sessionOverrideService.getEffectiveWorkflowActions(sessionUuid);
        if (overrideResponse.success && overrideResponse.data?.workflow_actions) {
          const actions = overrideResponse.data.workflow_actions;
          // Transformer les actions override en format attendu
          const transformedActions = actions.map((action: any) => ({
            uuid: action.uuid,
            type: action.action_type || action.type,
            target_type: action.target_type || action.targetType,
            target: action.target || action.target_uuid,
            status: action.status || 'pending',
            scheduled_for: action.scheduled_for || action.scheduledFor,
            executed_at: action.executed_at || action.executedAt,
            options: action.options || {},
            questionnaires: action.questionnaires || [],
            attachments: action.attachments || [],
            is_from_course: action.is_from_course !== false,
            is_new: action.is_new || false,
            is_modified: action.is_modified || false
          }));
          setWorkflowActions(transformedActions);
          return;
        }
      } catch (overrideError) {
        console.warn('Override workflow actions not available, trying standard endpoint:', overrideError);
      }

      // Sinon, utiliser l'endpoint standard
      const response = await courseSessionService.getWorkflowActions(sessionUuid);
      if (response.success && response.data) {
        setWorkflowActions(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement workflow:', error);
    } finally {
      setLoadingWorkflow(false);
    }
  }, [sessionUuid, loadingWorkflow]);

  /**
   * Charge le code de présence (QR Code)
   */
  const loadAttendanceCode = useCallback(async (slotUuid: string, period?: 'morning' | 'afternoon') => {
    if (!sessionUuid) return null;
    
    try {
      const response = await courseSessionService.getAttendanceCode(sessionUuid, slotUuid, { period });
      if (response.success && response.data) {
        setAttendanceCodes(prev => ({ ...prev, [slotUuid]: response.data }));
        return response.data;
      }
    } catch (error) {
      console.error('Erreur chargement code présence:', error);
    }
    return null;
  }, [sessionUuid]);

  /**
   * Marque la présence d'un participant
   */
  const handleMarkAttendance = useCallback(async (
    slotUuid: string, 
    participantUuid: string, 
    period: 'morning' | 'afternoon', 
    present: boolean
  ) => {
    if (!sessionUuid) return;
    
    setSavingAttendance(true);
    try {
      await courseSessionService.markAttendance(sessionUuid, slotUuid, {
        participant_uuid: participantUuid,
        period,
        present,
        signature_method: 'manual'
      });
      // Recharger les données d'émargement
      setSlotAttendanceData(prev => {
        const newData = { ...prev };
        delete newData[slotUuid];
        return newData;
      });
      await loadSlotAttendance(slotUuid);
    } catch (error) {
      console.error('Erreur marquage présence:', error);
    } finally {
      setSavingAttendance(false);
    }
  }, [sessionUuid, loadSlotAttendance]);

  /**
   * Exécute une action de workflow
   */
  const handleExecuteWorkflow = useCallback(async (actionUuid: string) => {
    if (!sessionUuid) return;
    
    try {
      await courseSessionService.executeWorkflowAction(sessionUuid, actionUuid);
      await loadWorkflowActions();
    } catch (error) {
      console.error('Erreur exécution workflow:', error);
    }
  }, [sessionUuid, loadWorkflowActions]);

  /**
   * Télécharge la feuille d'émargement
   */
  const handleDownloadAttendance = useCallback(async (slotUuid: string) => {
    if (!sessionUuid) return;
    
    try {
      const blob = await courseSessionService.exportSlotAttendance(sessionUuid, slotUuid, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emargement_${slotUuid}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement émargement:', error);
    }
  }, [sessionUuid]);

  /**
   * Télécharge toutes les feuilles d'émargement
   */
  const handleDownloadAllAttendance = useCallback(async () => {
    if (!sessionUuid) return;
    
    try {
      const blob = await courseSessionService.exportAllAttendance(sessionUuid, 'zip');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emargement_session_${sessionUuid}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement émargement:', error);
    }
  }, [sessionUuid]);

  // ==================== EFFECTS ====================

  // Charger le workflow quand on ouvre l'onglet "Déroulement"
  useEffect(() => {
    if (isOpen && activeTab === 'deroulement' && sessionUuid && workflowActions.length === 0) {
      loadWorkflowActions();
    }
  }, [isOpen, activeTab, sessionUuid, workflowActions.length, loadWorkflowActions]);

  // Charger l'émargement quand on expand une séance
  useEffect(() => {
    expandedSlots.forEach(slotUuid => {
      if (!slotAttendanceData[slotUuid] && !loadingAttendance[slotUuid]) {
        loadSlotAttendance(slotUuid);
      }
    });
  }, [expandedSlots, slotAttendanceData, loadingAttendance, loadSlotAttendance]);

  const toggleSlot = (uuid: string) => {
    setExpandedSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) newSet.delete(uuid);
      else newSet.add(uuid);
      return newSet;
    });
  };

  const getStatusBadge = (status: SessionSlot['status']) => {
    switch (status) {
      case 'terminée':
        return <Badge className="bg-green-100 text-green-600 border-0">✓ Terminée</Badge>;
      case 'en_cours':
        return <Badge className="bg-green-100 text-green-600 border-0">✓ En Cours</Badge>;
      case 'effectuée':
        return <Badge className="bg-green-100 text-green-600 border-0">✓ Effectuée</Badge>;
      case 'à_venir':
        return <Badge className="bg-gray-100 text-gray-600 border-0">⏱️ À Venir</Badge>;
    }
  };

  const getModeBadge = (mode: SessionSlot['mode']) => {
    switch (mode) {
      case 'présentiel':
        return <Badge className="bg-green-100 text-green-600 border-0">↗️ Présentiel</Badge>;
      case 'distanciel':
        return <Badge className="bg-blue-100 text-blue-600 border-0">💻 Distanciel</Badge>;
      case 'e-learning':
        return <Badge className="bg-green-100 text-green-600 border-0">🎓 E-Learning</Badge>;
      case 'hybride':
        return <Badge className="bg-purple-100 text-purple-600 border-0">🔄 Hybride</Badge>;
    }
  };

  const getTargetBadge = (target: WorkflowAction['targetType']) => {
    switch (target) {
      case 'formateur':
        return <Badge className="bg-blue-100 text-blue-600 border-0 text-xs">👤 Formateur</Badge>;
      case 'apprenant':
        return <Badge className="bg-green-100 text-green-600 border-0 text-xs">🎓 Apprenant</Badge>;
      case 'entreprise':
        return <Badge className="bg-purple-100 text-purple-600 border-0 text-xs">🏢 Entreprise</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className="text-center py-6 px-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
          
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
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Mode :</span>
            <Badge className="bg-[#e8f5e9] text-[#2e7d32] border-0 rounded-full px-3">🌐 {session.mode}</Badge>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[
              { id: 'general', label: 'Informations Générales' },
              { id: 'seances', label: 'Séances & Émargement' },
              { id: 'deroulement', label: 'Deroulement' }
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-full px-6 py-2 font-medium ${
                  activeTab === tab.id ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
                style={activeTab === tab.id ? { backgroundColor: primaryColor } : {}}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Informations Générales Tab */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-2 gap-6">
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  📅 Session :
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white border border-gray-200 text-gray-700">
                      📅 {session.startDate}
                    </Badge>
                    <span className="text-gray-400">À</span>
                    <Badge className="bg-white border border-gray-200 text-gray-700">
                      🕐 09:00
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 ml-2">↳</span>
                    <Badge className="bg-white border border-gray-200 text-gray-700">
                      📅 {session.endDate}
                    </Badge>
                    <span className="text-gray-400">À</span>
                    <Badge className="bg-white border border-gray-200 text-gray-700">
                      🕐 17:00
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  👤 Formateur(s) :
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(trainers && trainers.length > 0) ? (
                    trainers.map((trainer, idx) => (
                      <Badge key={trainer.uuid || idx} className="bg-white border border-gray-200 text-gray-700">
                        👤 {trainer.name}
                      </Badge>
                    ))
                  ) : (session.trainers && session.trainers.length > 0) ? (
                    session.trainers.map((trainer, idx) => (
                      <Badge key={idx} className="bg-white border border-gray-200 text-gray-700">
                        👤 {trainer.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Aucun formateur assigné</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Séances & Émargement Tab */}
          {activeTab === 'seances' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  className="h-10 gap-2 rounded-xl"
                  onClick={handleDownloadAllAttendance}
                >
                  <Download className="w-4 h-4" />
                  Télécharger toutes les feuilles
                </Button>
                {onRefresh && (
                  <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={onRefresh}>
                    <RefreshCw className="w-4 h-4" />
                    Actualiser
                  </Button>
                )}
              </div>

              {realSlots.length === 0 ? (
                <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Aucune séance planifiée pour cette session</p>
                </div>
              ) : realSlots.map((slot, index) => {
                // Normalize slot data from API (handle both formats)
                const slotDate = slot.date || slot.start_date || '-';
                const slotStartTime = slot.startTime || slot.start_time || '-';
                const slotEndTime = slot.endTime || slot.end_time || '-';
                const slotStatus = slot.status || 'à_venir';
                const slotMode = slot.mode || slot.instance_type || 'présentiel';
                const slotMeetingLink = slot.meetingLink || slot.meeting_link;
                const slotAddress = slot.address || slot.location_address;
                
                // ⭐ Utiliser les données d'émargement de l'API si disponibles
                const apiAttendance = slotAttendanceData[slot.uuid];
                const attendance = apiAttendance || slot.attendance || { 
                  morning: { present: 0, absent: 0, total: 0, percentage: 0 }, 
                  afternoon: { present: 0, absent: 0, total: 0, percentage: 0 } 
                };
                const isLoadingThisSlot = loadingAttendance[slot.uuid];
                const trainerSigned = apiAttendance?.trainer_signed ?? slot.trainerSigned ?? false;
                const trainerSignedAt = apiAttendance?.trainer_signed_at ?? slot.trainerSignedAt;
                
                return (
                <div key={slot.uuid} className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
                  {/* Slot Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          📅 Séance {index + 1}/{realSlots.length}
                          {(slot as any).title && (slot as any).title !== `Séance ${index + 1}` && (
                            <span className="ml-2 font-normal text-gray-500">- {(slot as any).title}</span>
                          )}
                        </span>
                        <Badge className="bg-blue-50 border border-blue-200 text-blue-700">
                          📅 {slotDate}
                        </Badge>
                        <Badge className="bg-purple-50 border border-purple-200 text-purple-700">
                          🕐 {slotStartTime} - {slotEndTime}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(slotStatus as any)}
                        {getModeBadge(slotMode as any)}
                        {(slotStatus === 'en_cours' || slotMeetingLink) && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => slotMeetingLink && window.open(slotMeetingLink, '_blank')}>
                            <ExternalLink className="w-3 h-3" />
                            Rejoindre ↗
                          </Button>
                        )}
                        {slotAddress && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" title={slotAddress}>
                            <MapPin className="w-3 h-3" />
                            Plus D'infos ↗
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => onShowQRCode?.(slot)}
                          title="Afficher QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => onShowAttendanceCode?.(slot)}
                          title="Code de présence"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {/* Émargement row - données en attente de l'endpoint API */}
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Émargement
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Matin :</span>
                          <span className="text-blue-500 font-medium">{attendance.morning.present}/{attendance.morning.total}</span>
                          <span className="text-gray-400">{attendance.morning.percentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Après-Midi :</span>
                          <span className="text-orange-500 font-medium">{attendance.afternoon.present}/{attendance.afternoon.total}</span>
                          <span className="text-gray-400">{attendance.afternoon.percentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Formateur :</span>
                          <Badge className={`${trainerSigned ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} border-0`}>
                            {trainerSigned ? 'Signé' : 'Non signé'}
                          </Badge>
                          {trainerSignedAt && (
                            <span className="text-xs text-gray-400">{new Date(trainerSignedAt).toLocaleString('fr-FR')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isLoadingThisSlot && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0" 
                            title="Télécharger feuille d'émargement"
                            onClick={() => handleDownloadAttendance(slot.uuid)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => toggleSlot(slot.uuid)}
                            title={expandedSlots.has(slot.uuid) ? 'Réduire' : 'Voir participants'}
                          >
                            {expandedSlots.has(slot.uuid) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded attendance table - connecté à l'API */}
                  {expandedSlots.has(slot.uuid) && (
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {isLoadingThisSlot ? (
                        <div className="p-6 text-center">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
                          <p className="text-gray-500 text-sm">Chargement des données d'émargement...</p>
                        </div>
                      ) : apiAttendance?.participants && apiAttendance.participants.length > 0 ? (
                        <table className="w-full">
                          <thead>
                            <tr className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                              <th className={`px-4 py-2 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Nom & Prénom de l'apprenant
                              </th>
                              <th className={`px-4 py-2 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Signature matin
                              </th>
                              <th className={`px-4 py-2 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Signature après-midi
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {apiAttendance.participants.map(participant => (
                              <tr key={participant.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                <td className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium">
                                      {participant.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium">{participant.name}</p>
                                      <p className="text-xs text-gray-500">{participant.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => handleMarkAttendance(slot.uuid, participant.uuid, 'morning', !participant.morning_present)}
                                    disabled={savingAttendance}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                                      participant.morning_present 
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                        : participant.morning_present === false
                                        ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                  >
                                    {participant.morning_present ? '✓ Présent' : participant.morning_present === false ? '✗ Absent' : '— Non marqué'}
                                    {participant.morning_signature_method && (
                                      <span className="text-xs opacity-60">({participant.morning_signature_method})</span>
                                    )}
                                  </button>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => handleMarkAttendance(slot.uuid, participant.uuid, 'afternoon', !participant.afternoon_present)}
                                    disabled={savingAttendance}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                                      participant.afternoon_present 
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                        : participant.afternoon_present === false
                                        ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                  >
                                    {participant.afternoon_present ? '✓ Présent' : participant.afternoon_present === false ? '✗ Absent' : '— Non marqué'}
                                    {participant.afternoon_signature_method && (
                                      <span className="text-xs opacity-60">({participant.afternoon_signature_method})</span>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : slot.participants && slot.participants.length > 0 ? (
                        // Fallback vers les données des props si pas de données API
                        <table className="w-full">
                          <thead>
                            <tr className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                              <th className={`px-4 py-2 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Nom & Prénom de l'apprenant
                              </th>
                              <th className={`px-4 py-2 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Signature matin
                              </th>
                              <th className={`px-4 py-2 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Signature après-midi
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {slot.participants.map(participant => (
                              <tr key={participant.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                <td className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {participant.name}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span className={participant.morningPresent ? 'text-green-600' : 'text-red-500'}>
                                    {participant.morningPresent ? '✓ Présent' : '✗ Absent'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span className={participant.afternoonPresent ? 'text-green-600' : 'text-red-500'}>
                                    {participant.afternoonPresent ? '✓ Présent' : '✗ Absent'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 text-sm">Aucun participant inscrit à cette séance</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => loadSlotAttendance(slot.uuid)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recharger
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}

          {/* Déroulement Tab - connecté à l'API */}
          {activeTab === 'deroulement' && (
            <div className="relative">
              {/* Header avec bouton refresh */}
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Actions automatisées
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadWorkflowActions}
                  disabled={loadingWorkflow}
                >
                  {loadingWorkflow ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="ml-2">Actualiser</span>
                </Button>
              </div>

              {loadingWorkflow ? (
                <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <Loader2 className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-spin" />
                  <p className="text-gray-500">Chargement du workflow...</p>
                </div>
              ) : realWorkflowActions.length === 0 ? (
                <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Aucune action de workflow configurée</p>
                  <p className="text-gray-400 text-xs mt-2">Les actions seront affichées ici une fois configurées</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {realWorkflowActions.map((action: any, idx: number) => {
                    // Normaliser les données (supporter API et props)
                    const actionStatus = action.status || 'pending';
                    const actionType = action.type || action.action_type;
                    const targetType = action.target_type || action.targetType;
                    const executedAt = action.executed_at || action.executedAt;
                    const scheduledFor = action.scheduled_for || action.scheduledFor;
                    const questionnaires = action.questionnaires || [];
                    const attachments = action.attachments || [];
                    
                    return (
                    <div key={action.uuid} className="relative flex items-start gap-4 pb-4">
                      {/* Timeline line */}
                      {idx < realWorkflowActions.length - 1 && (
                        <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200" />
                      )}
                      
                      {/* Icon */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                        actionStatus === 'executed' 
                          ? 'bg-green-100' 
                          : actionStatus === 'pending'
                          ? 'bg-blue-100'
                          : actionStatus === 'not_executed'
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                      }`}>
                        {actionType === 'send_questionnaire' ? (
                          <FileText className={`w-5 h-5 ${
                            actionStatus === 'executed' ? 'text-green-600' : 
                            actionStatus === 'pending' ? 'text-blue-600' : 'text-yellow-600'
                          }`} />
                        ) : actionType === 'generate_certificate' || actionType === 'send_certificate' ? (
                          <Check className={`w-5 h-5 ${
                            actionStatus === 'executed' ? 'text-green-600' : 'text-yellow-600'
                          }`} />
                        ) : (
                          <Users className={`w-5 h-5 ${
                            actionStatus === 'executed' ? 'text-green-600' : 'text-yellow-600'
                          }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {action.title}
                            </span>
                            {targetType && (
                              <Badge className={`text-xs border-0 ${
                                targetType === 'apprenant' ? 'bg-green-100 text-green-600' :
                                targetType === 'formateur' ? 'bg-blue-100 text-blue-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {targetType === 'apprenant' ? '🎓 Apprenant' :
                                 targetType === 'formateur' ? '👤 Formateur' :
                                 '🏢 Entreprise'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {executedAt ? (
                              <span className="text-xs text-green-600">
                                ✓ Exécuté le {new Date(executedAt).toLocaleString('fr-FR')}
                              </span>
                            ) : scheduledFor ? (
                              <span className="text-xs text-blue-600">
                                ⏱️ Planifié le {new Date(scheduledFor).toLocaleString('fr-FR')}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                ⏱️ Non planifié
                              </span>
                            )}
                            {actionStatus !== 'executed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleExecuteWorkflow(action.uuid)}
                              >
                                Exécuter
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={`border-0 text-xs ${
                            actionStatus === 'executed' ? 'bg-green-100 text-green-600' : 
                            actionStatus === 'pending' ? 'bg-blue-100 text-blue-600' : 
                            actionStatus === 'not_executed' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {actionStatus === 'executed' ? '✓ Exécuté' : 
                             actionStatus === 'pending' ? '⏳ En attente' : 
                             actionStatus === 'not_executed' ? '❌ Non exécuté' :
                             '⏭️ Ignoré'}
                          </Badge>
                          {questionnaires.length > 0 && (
                            <button className="text-blue-500 text-xs underline">
                              {questionnaires.length} Questionnaire(s)
                            </button>
                          )}
                          {attachments.length > 0 && (
                            <span className="text-xs text-gray-500">{attachments.length} Fichier(s) joint(s)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;

