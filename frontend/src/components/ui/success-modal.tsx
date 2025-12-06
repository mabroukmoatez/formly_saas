import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#3b82f6';

  if (!isOpen) return null;

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

        {/* Modal Content */}
        <div className="p-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className={`text-center font-bold text-xl mb-2 [font-family:'Poppins',Helvetica] ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            {title}
          </h2>

          {/* Message */}
          <p className={`text-center text-base mb-6 [font-family:'Poppins',Helvetica] ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="h-12 px-8 rounded-[10px] font-medium [font-family:'Poppins',Helvetica] text-white text-[13px] hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: primaryColor }}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

