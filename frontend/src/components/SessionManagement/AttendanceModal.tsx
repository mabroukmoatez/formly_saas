/**
 * AttendanceModal Component
 * Modal for QR Code and Numeric Code attendance verification
 * Connecté au backend: GET /course-sessions/{uuid}/slots/{slot}/attendance-code
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Badge } from '../ui/badge';
import { X, Calendar, Clock, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { courseSessionService } from '../../services/courseSession';
import type { SessionData, SessionSlot } from './types';
import { fixImageUrl } from '../../lib/utils';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  slot?: SessionSlot;
  mode: 'qr' | 'code';
  sessionUuid?: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
  slot,
  mode = 'code',
  sessionUuid
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [attendanceCode, setAttendanceCode] = useState('--- - ---');
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [codeInfo, setCodeInfo] = useState<any>(null);

  // Load attendance code from backend
  const loadAttendanceCode = useCallback(async (regenerate = false) => {
    const uuid = sessionUuid || session.uuid;
    if (!uuid || !slot?.uuid) {
      setError('Session ou séance non définie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await courseSessionService.getAttendanceCode(uuid, slot.uuid, {
        regenerate
      });

      if (response.success && response.data) {
        const code = response.data.numeric_code || response.data.code;
        // Format code as "XXX - XXX"
        if (code && code.length === 6) {
          setAttendanceCode(`${code.slice(0, 3)} - ${code.slice(3)}`);
        } else {
          setAttendanceCode(code || '--- - ---');
        }

        setQrValue(response.data.qr_code_url ||
          `${window.location.origin}/attendance/${uuid}/${slot.uuid}?code=${code}`);
      } else {
        throw new Error('Impossible de récupérer le code');
      }
    } catch (err: any) {
      console.error('Error loading attendance code:', err);
      setError(err.message || 'Erreur lors du chargement du code');
      // Fallback: generate temporary code
      const code1 = Math.floor(100 + Math.random() * 900);
      const code2 = Math.floor(100 + Math.random() * 900);
      setAttendanceCode(`${code1} - ${code2}`);
      setQrValue(`${window.location.origin}/attendance/${uuid}/${slot.uuid}?code=${code1}${code2}`);
    } finally {
      setLoading(false);
    }
  }, [session.uuid, sessionUuid, slot?.uuid]);

  // Load code info
  const loadCodeInfo = useCallback(async () => {
    const uuid = sessionUuid || session.uuid;
    if (!uuid || !slot?.uuid) return;

    try {
      const response = await courseSessionService.getAttendanceCodeInfo(uuid, slot.uuid);
      if (response.success && response.data) {
        setCodeInfo(response.data);
      }
    } catch (err) {
      console.warn('Code info endpoint not available:', err);
    }
  }, [sessionUuid, session.uuid, slot?.uuid]);

  useEffect(() => {
    if (isOpen && slot?.uuid) {
      loadAttendanceCode();
      loadCodeInfo();
    }
  }, [isOpen, slot?.uuid, loadAttendanceCode, loadCodeInfo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {organization?.organization_logo_url || organization?.organization_logo ? (
            <img
              src={fixImageUrl(organization.organization_logo_url || organization.organization_logo || '')}
              alt={organization.organization_name || 'Organization'}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(organization?.organization_name || 'O').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-2xl font-bold" style={{ color: primaryColor }}>
            {organization?.organization_name || 'Formly'}
          </span>
        </div>

        {/* Course Title */}
        <h1 className="text-center text-xl font-bold mb-1" style={{ color: primaryColor }}>
          {session.courseTitle || 'Nom De Formation'}
        </h1>

        {/* Session Title */}
        <p className={`text-center mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Session: {session.title || 'titre de la session'}
        </p>

        {/* Date and Time */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Badge className={`bg-gray-100 text-gray-700 border-0 gap-1 ${isDark ? 'bg-gray-800 text-gray-300' : ''}`}>
            <Calendar className="w-4 h-4" />
            {slot?.date || '10 Jan 2026'}
          </Badge>
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>À</span>
          <Badge className={`bg-gray-100 text-gray-700 border-0 gap-1 ${isDark ? 'bg-gray-800 text-gray-300' : ''}`}>
            <Clock className="w-4 h-4" />
            {slot?.startTime || '09:00'}
          </Badge>
          <Badge className={`bg-gray-100 text-gray-700 border-0 gap-1 ${isDark ? 'bg-gray-800 text-gray-300' : ''}`}>
            <Clock className="w-4 h-4" />
            {slot?.endTime || '12:00'}
          </Badge>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">Chargement du code...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => loadAttendanceCode(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : mode === 'qr' ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="text-center mb-4 flex items-center justify-center gap-4">
              <button
                onClick={() => loadAttendanceCode(true)}
                className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Régénérer
              </button>
              <button
                onClick={() => setShowInfoModal(true)}
                className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                Plus d'infos
              </button>
            </div>
          </>
        ) : (
          <div className="text-center mb-8">
            <div
              className="text-7xl font-bold tracking-wider"
              style={{
                color: '#1a2744',
                fontFamily: "'Poppins', sans-serif",
                letterSpacing: '0.1em'
              }}
            >
              {attendanceCode}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => loadAttendanceCode(true)}
                className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Régénérer le code
              </button>
              <button
                onClick={() => setShowInfoModal(true)}
                className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                Plus d'infos
              </button>
            </div>
          </div>
        )}

        {/* Instruction */}
        <p className={`text-center text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {mode === 'qr'
            ? 'Scannez le code QR pour confirmer votre présence'
            : 'Entrez ce code dans l\'application pour confirmer votre présence'
          }
        </p>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowInfoModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Informations Code de Présence
            </h2>

            {codeInfo ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Code</p>
                  <p className={`font-mono text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {codeInfo.code || attendanceCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valide jusqu'à</p>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {codeInfo.valid_until ? new Date(codeInfo.valid_until).toLocaleString('fr-FR') : slot?.endTime || 'Fin de séance'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Période</p>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {codeInfo.period === 'morning' ? 'Matin' : codeInfo.period === 'afternoon' ? 'Après-midi' : 'Toute la journée'}
                  </p>
                </div>
                {codeInfo.instructions && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Instructions</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(codeInfo as any).instructions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Code:</strong> {attendanceCode}
                </p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Séance:</strong> {slot?.mode} - {slot?.date}
                </p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Date:</strong> {slot?.date} de {slot?.startTime} à {slot?.endTime}
                </p>
                <p className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Entrez ce code dans l'application mobile ou web pour confirmer votre présence à cette séance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Attendance Edit Modal for editing presence status
interface AttendanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  currentStatus: boolean;
  onSave: (data: { present: boolean; reason?: string }) => void;
}

export const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  isOpen,
  onClose,
  participantName,
  currentStatus,
  onSave
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [isPresent, setIsPresent] = useState(currentStatus);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setIsPresent(currentStatus);
    setReason('');
  }, [currentStatus, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-sm rounded-xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Participant Name */}
        <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {participantName}
        </h3>

        {/* Status Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setIsPresent(true)}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${isPresent
              ? 'border-green-500 bg-green-50 text-green-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              {isPresent && <span className="text-green-500">✓</span>}
              Présent
            </span>
          </button>
          <button
            onClick={() => setIsPresent(false)}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${!isPresent
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
          >
            Absent
          </button>
        </div>

        {/* Reason input (shown when absent) */}
        {!isPresent && (
          <div className="mb-4">
            <label className={`block text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Entrez la raison de l'absence..."
              className={`w-full p-2 rounded-lg border resize-none h-20 ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200'
                }`}
            />
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={() => onSave({ present: isPresent, reason: isPresent ? undefined : reason })}
          className="w-full py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          Valider
        </button>
      </div>
    </div>
  );
};

export default AttendanceModal;

