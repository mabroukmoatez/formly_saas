import React from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

export type DeleteType = 'quiz' | 'block' | 'chapter' | 'subchapter' | 'document' | 'questionnaire' | 'custom';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: DeleteType;
  itemName?: string;
  customMessage?: string;
  isLoading?: boolean;
}

const deleteMessages: Record<DeleteType, string> = {
  quiz: 'Voulez-vous vraiment supprimer cette Quiz ?',
  block: 'Voulez-vous vraiment supprimer Ce Bloc ?',
  chapter: 'Voulez-vous vraiment supprimer Ce chapitre ?',
  subchapter: 'Voulez-vous vraiment supprimer Ce Sous Chapitre ?',
  document: 'Voulez-vous vraiment supprimer ce document ?',
  questionnaire: 'Voulez-vous vraiment supprimer ce questionnaire ?',
  custom: 'Voulez-vous vraiment supprimer cet élément ?',
};

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  itemName,
  customMessage,
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  if (!isOpen) return null;

  const message = customMessage || deleteMessages[type] || 'Voulez-vous vraiment supprimer cet élément ?';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-lg shadow-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isDark
              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2 mb-6">
            <p className={`text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {message}
            </p>
            {itemName && (
              <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {itemName}
              </p>
            )}
            <p className={`text-center font-bold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Cette action est irréversible.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className={`${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                borderColor: primaryColor,
                color: primaryColor,
              }}
            >
              Non, Annuler
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="text-white flex items-center gap-2"
              style={{
                backgroundColor: '#EF4444',
                borderColor: '#EF4444',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Oui Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

