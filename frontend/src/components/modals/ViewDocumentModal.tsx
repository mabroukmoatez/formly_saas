import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ViewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate?: () => void | Promise<void>;
  documentTitle?: string;
  documentUrl?: string;
  children?: React.ReactNode;
}

export const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  documentTitle = 'Document.pdf',
  documentUrl,
  children,
}) => {
  const { isDark } = useTheme();
  const [isValidating, setIsValidating] = React.useState(false);

  const handleValidate = async () => {
    if (!onValidate) return;

    setIsValidating(true);
    try {
      await onValidate();
      onClose();
    } catch (error) {
      console.error('Error validating document:', error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      onClick={onClose}
    >
      <div
        className={`relative w-full flex flex-col rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)] ${
          isDark ? 'bg-gray-800' : 'bg-[var(--color-bg-white)]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(876px, 95vw)',
          maxHeight: 'min(719px, 90vh)',
          height: '719px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2
            className={`font-semibold text-lg ${
              isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            {documentTitle}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Viewer Area */}
        <div
          className={`flex-1 overflow-y-auto p-6 ${
            isDark ? 'bg-gray-900' : 'bg-gray-50'
          }`}
          style={{
            minHeight: 0,
          }}
        >
          {children ? (
            children
          ) : documentUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              {documentUrl.endsWith('.pdf') ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-full rounded-lg border border-gray-300 dark:border-gray-600"
                  title={documentTitle}
                />
              ) : documentUrl.match(/\.(jpg|jpeg|png|gif|svg)$/i) ? (
                <img
                  src={documentUrl}
                  alt={documentTitle}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div
                  className={`p-8 text-center ${
                    isDark ? 'text-gray-400' : 'text-[var(--color-text-secondary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  <p>Aperçu non disponible pour ce type de fichier</p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-4 inline-block"
                  >
                    Ouvrir dans un nouvel onglet
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex items-center justify-center h-full ${
                isDark ? 'text-gray-400' : 'text-[var(--color-text-secondary)]'
              }`}
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              <div className="text-center">
                <div className="mb-4 text-6xl">📄</div>
                <p>Aucun document à afficher</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Validate Button */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-center flex-shrink-0">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="px-12 py-3 rounded-full font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          >
            {isValidating ? 'Validation...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
};
