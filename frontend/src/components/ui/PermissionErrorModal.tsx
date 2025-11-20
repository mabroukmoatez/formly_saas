import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface PermissionErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * Modal pour afficher les erreurs de permission
 */
export const PermissionErrorModal: React.FC<PermissionErrorModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const defaultMessage = t('common.permissions.unauthorized') || 'Vous n\'avez pas la permission d\'effectuer cette action.';
  const displayMessage = message || defaultMessage;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t('common.permissions.insufficientPermissions') || 'Permissions insuffisantes'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div className={`p-4 rounded-full ${isDark ? 'bg-amber-900/20' : 'bg-amber-100'}`}>
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Title and Message */}
          <div className="text-center space-y-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
              {t('common.permissions.insufficientPermissions') || 'Permissions insuffisantes'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {displayMessage}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('common.permissions.contactAdmin') || 'Contactez votre administrateur pour obtenir les permissions nécessaires.'}
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className={`w-full ${
              isDark 
                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {t('common.close') || 'Fermer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

