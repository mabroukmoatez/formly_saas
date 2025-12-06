import React from 'react';
import { X, AlertTriangle, Info, Trash2, Copy } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#3b82f6';

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          warningBg: 'bg-red-50 border-red-200',
          warningText: 'text-red-700',
          confirmIcon: <Trash2 className="w-4 h-4" />,
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          warningBg: 'bg-yellow-50 border-yellow-200',
          warningText: 'text-yellow-700',
          confirmIcon: null,
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          warningBg: 'bg-blue-50 border-blue-200',
          warningText: 'text-blue-700',
          confirmIcon: <Copy className="w-4 h-4" />,
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-[20px] shadow-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
        >
          <X className="w-4 h-4 text-blue-600" />
        </button>

        {/* Warning Header */}
        <div className={`${styles.warningBg} border ${styles.warningBg.includes('red') ? 'border-red-200' : styles.warningBg.includes('yellow') ? 'border-yellow-200' : 'border-blue-200'} rounded-[12px] p-4 m-6 mb-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${styles.iconBg} rounded-full flex items-center justify-center`}>
              {styles.icon}
            </div>
            <span className={`font-medium text-sm [font-family:'Poppins',Helvetica] ${styles.warningText}`}>
              {title}
            </span>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-8 px-6">
          <p className={`text-base [font-family:'Poppins',Helvetica] ${
            isDark ? 'text-gray-300' : 'text-gray-800'
          }`}>
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="flex-1 h-12 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-[10px] font-medium [font-family:'Poppins',Helvetica]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-12 ${styles.confirmButton} rounded-[10px] font-medium [font-family:'Poppins',Helvetica] flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Chargement...</span>
              </>
            ) : (
              <>
                {styles.confirmIcon}
                <span>{confirmText}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
