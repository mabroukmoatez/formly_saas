/**
 * SessionDetailsModal Component
 * Modal with tabs: Informations Générales, Séances & Émargement, Déroulement
 */

import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import type { SessionData, SessionSlot, SlotParticipantAttendance, WorkflowAction, SessionTrainer } from './types';

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  slots?: SessionSlot[];
  trainers?: SessionTrainer[];
  workflowActions?: WorkflowAction[];
  onShowQRCode?: (slot: SessionSlot) => void;
  onShowAttendanceCode?: (slot: SessionSlot) => void;
  onEditAttendance?: (slot: SessionSlot, participant: SlotParticipantAttendance, period: 'morning' | 'afternoon') => void;
  onNavigateToEvaluation?: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  onClose,
  session,
  slots = [],
  trainers = [],
  workflowActions = [],
  onShowQRCode,
  onShowAttendanceCode,
  onEditAttendance,
  onNavigateToEvaluation
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [activeTab, setActiveTab] = useState<'general' | 'seances' | 'deroulement'>('general');
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  // ⭐ Utiliser les vraies données passées en props (pas de mock!)
  // Si pas de données, afficher un message approprié
  const realSlots = slots || [];
  const realWorkflowActions = workflowActions || [];

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
          
          <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
            {session.courseTitle}
          </h1>
          
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
              <div className="flex justify-end">
                <Button variant="outline" className="h-10 gap-2 rounded-xl">
                  <Download className="w-4 h-4" />
                  Telecharger Tous Le Feus
                </Button>
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
                // Attendance data - not available from API yet
                const attendance = slot.attendance || { 
                  morning: { present: 0, total: 0, percentage: 0 }, 
                  afternoon: { present: 0, total: 0, percentage: 0 } 
                };
                
                return (
                <div key={slot.uuid} className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {/* Slot Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          📅 Séance {index + 1}/{realSlots.length}
                        </span>
                        <Badge className="bg-white border border-gray-200 text-gray-700">
                          📅 {slotDate}
                        </Badge>
                        <span className="text-gray-400">À</span>
                        <Badge className="bg-white border border-gray-200 text-gray-700">
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
                          <Badge className={`${slot.trainerSigned ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} border-0`}>
                            {slot.trainerSigned ? 'Signé' : 'Non signé'}
                          </Badge>
                          {slot.trainerSignedAt && (
                            <span className="text-xs text-gray-400">{slot.trainerSignedAt}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Télécharger">
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

                  {/* Expanded attendance table - données en attente de l'endpoint API */}
                  {expandedSlots.has(slot.uuid) && (
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {slot.participants && slot.participants.length > 0 ? (
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
                                  <button
                                    onClick={() => onEditAttendance?.(slot, participant, 'morning')}
                                    className={`inline-flex items-center gap-1 ${
                                      participant.morningPresent ? 'text-green-600' : 'text-red-500'
                                    }`}
                                  >
                                    {participant.morningPresent ? 'Présent' : 'Absent'}
                                    <span className="text-blue-500">✏️</span>
                                  </button>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => onEditAttendance?.(slot, participant, 'afternoon')}
                                    className={`inline-flex items-center gap-1 ${
                                      participant.afternoonPresent ? 'text-green-600' : 'text-red-500'
                                    }`}
                                  >
                                    {participant.afternoonPresent ? 'Présent' : 'Absent'}
                                    <span className="text-blue-500">✏️</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 text-sm">Données d'émargement non disponibles</p>
                          <p className="text-gray-400 text-xs mt-1">Endpoint API requis: GET /slots/[slot_uuid]/attendance</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}

          {/* Déroulement Tab */}
          {activeTab === 'deroulement' && (
            <div className="relative">
              {realWorkflowActions.length === 0 ? (
                <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Aucune action de workflow configurée</p>
                  <p className="text-gray-400 text-xs mt-2">Endpoint API requis: GET /course-sessions/[uuid]/workflow-actions</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {realWorkflowActions.map((action, idx) => (
                    <div key={action.uuid} className="relative flex items-start gap-4 pb-4">
                      {/* Timeline line */}
                      {idx < realWorkflowActions.length - 1 && (
                        <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200" />
                      )}
                      
                      {/* Icon */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                        action.status === 'exécuté' 
                          ? 'bg-green-100' 
                          : action.status === 'en_attente'
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                      }`}>
                        {action.type === 'envoi_questionnaire' ? (
                          action.status === 'exécuté' ? (
                            <Users className={`w-5 h-5 ${action.status === 'exécuté' ? 'text-green-600' : 'text-yellow-600'}`} />
                          ) : (
                            <FileText className={`w-5 h-5 ${action.status === 'en_attente' ? 'text-red-600' : 'text-yellow-600'}`} />
                          )
                        ) : (
                          <FileText className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {action.title}
                            </span>
                            {getTargetBadge(action.targetType)}
                          </div>
                          {action.executedAt ? (
                            <span className="text-xs text-green-600">
                              ✓ Exécuté le {action.executedAt}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              ⏱️ Non Exécuté
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={`${action.status === 'exécuté' ? 'bg-green-100 text-green-600' : action.status === 'en_attente' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'} border-0 text-xs`}>
                            {action.status === 'exécuté' ? '✓ Exécuté' : action.status === 'en_attente' ? '⏳ En attente' : '❌ Non exécuté'}
                          </Badge>
                          {action.questionnairesCount && action.questionnairesCount > 0 && (
                            <button className="text-blue-500 text-xs underline">
                              {action.questionnairesCount} Questionnaire(s)
                            </button>
                          )}
                          {action.attachmentsCount !== undefined && action.attachmentsCount > 0 && (
                            <span className="text-xs text-gray-500">{action.attachmentsCount} Fichier(s) joint(s)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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

