/**
 * AttendanceCodeValidator Component
 * Permet à un apprenant de valider sa présence avec un code numérique
 * Connecté au backend: POST /course-sessions/{uuid}/slots/{slot}/validate-attendance-code
 */

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { courseSessionService } from '../../services/courseSession';
import { useToast } from '../ui/toast';

interface AttendanceCodeValidatorProps {
  isOpen: boolean;
  onClose: () => void;
  sessionUuid: string;
  slotUuid: string;
  participantUuid: string;
  period: 'morning' | 'afternoon';
}

export const AttendanceCodeValidator: React.FC<AttendanceCodeValidatorProps> = ({
  isOpen,
  onClose,
  sessionUuid,
  slotUuid,
  participantUuid,
  period
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleValidate = async () => {
    if (!code || code.length < 6) {
      showError('Code invalide', 'Le code doit contenir au moins 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      // Remove spaces and dashes from code
      const cleanCode = code.replace(/[\s-]/g, '');
      
      const response = await courseSessionService.validateAttendanceCode(sessionUuid, slotUuid, {
        code: cleanCode,
        participant_uuid: participantUuid,
        period
      });

      if (response.success && response.data?.validated) {
        setValidated(true);
        success('Présence confirmée', `Votre présence a été enregistrée le ${new Date(response.data.signed_at).toLocaleString('fr-FR')}`);
        setTimeout(() => {
          onClose();
          setCode('');
          setValidated(false);
        }, 2000);
      } else {
        throw new Error(response.message || 'Code invalide ou expiré');
      }
    } catch (err: any) {
      console.error('Error validating code:', err);
      showError('Erreur', err.message || 'Le code est invalide ou a expiré. Veuillez demander un nouveau code au formateur.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {validated ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Présence confirmée !
            </h2>
            <p className="text-gray-500">
              Votre présence a été enregistrée avec succès.
            </p>
          </div>
        ) : (
          <>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Confirmer votre présence
            </h2>
            
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Entrez le code de présence fourni par le formateur pour confirmer votre présence.
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Code de présence
                </label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    // Only allow numbers, spaces, and dashes
                    const value = e.target.value.replace(/[^0-9\s-]/g, '');
                    setCode(value);
                  }}
                  placeholder="Ex: 721 222 ou 721-222"
                  className="text-center text-2xl font-mono tracking-wider"
                  maxLength={8}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleValidate}
                disabled={loading || code.length < 6}
                className="w-full h-12 text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Confirmer la présence'
                )}
              </Button>
            </div>

            <p className={`text-xs mt-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Période: {period === 'morning' ? 'Matin' : 'Après-midi'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

