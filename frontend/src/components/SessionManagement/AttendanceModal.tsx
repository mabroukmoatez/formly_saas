/**
 * AttendanceModal Component
 * Modal for QR Code and Numeric Code attendance verification
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Badge } from '../ui/badge';
import { X, Calendar, Clock, HelpCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { SessionData, SessionSlot } from './types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  slot?: SessionSlot;
  mode: 'qr' | 'code';
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
  slot,
  mode = 'code'
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  // Generate a random attendance code
  const [attendanceCode, setAttendanceCode] = useState('457 - 875');
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    // Generate unique attendance code and QR value
    const code1 = Math.floor(100 + Math.random() * 900);
    const code2 = Math.floor(100 + Math.random() * 900);
    setAttendanceCode(`${code1} - ${code2}`);
    
    // QR value could be a URL or unique identifier
    setQrValue(`https://formly.com/attendance/${session.uuid}/${slot?.uuid || 'slot'}?code=${code1}${code2}`);
  }, [session.uuid, slot?.uuid]);

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
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: primaryColor }}>Formly</span>
        </div>

        {/* Course Title */}
        <h1 className="text-center text-xl font-bold mb-1" style={{ color: primaryColor }}>
          {session.courseTitle || 'Nom De Formation'}
        </h1>
        
        {/* Session Title */}
        <p className={`text-center mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Sessoin: {session.title || 'titre de la session'}
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

        {/* QR Code or Numeric Code */}
        {mode === 'qr' ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG 
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="text-center mb-4">
              <button className="text-red-500 text-sm hover:underline inline-flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                not working?
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
          </div>
        )}

        {/* Instruction */}
        <p className={`text-center text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {mode === 'qr' 
            ? 'Scan the code to confirm your Presence'
            : 'Scan the code to confirm your Presence'
          }
        </p>
      </div>
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
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
              isPresent 
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
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
              !isPresent 
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
              className={`w-full p-2 rounded-lg border resize-none h-20 ${
                isDark 
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

