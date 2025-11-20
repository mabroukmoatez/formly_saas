import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { PermissionErrorModal } from '../components/ui/PermissionErrorModal';
import { setPermissionErrorHandler } from '../utils/permissionErrorHandler';

interface PermissionErrorContextType {
  showPermissionError: (message?: string) => void;
}

const PermissionErrorContext = createContext<PermissionErrorContextType | undefined>(undefined);

interface PermissionErrorProviderProps {
  children: ReactNode;
}

/**
 * Provider pour gérer l'affichage global des erreurs de permission
 */
export const PermissionErrorProvider: React.FC<PermissionErrorProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const showPermissionError = useCallback((message?: string) => {
    setErrorMessage(message);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setErrorMessage(undefined);
  }, []);

  // Enregistrer le handler global au montage du composant
  useEffect(() => {
    setPermissionErrorHandler(showPermissionError);
    return () => {
      setPermissionErrorHandler(() => {});
    };
  }, [showPermissionError]);

  return (
    <PermissionErrorContext.Provider value={{ showPermissionError }}>
      {children}
      <PermissionErrorModal
        isOpen={isOpen}
        onClose={handleClose}
        message={errorMessage}
      />
    </PermissionErrorContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'erreur de permission
 */
export const usePermissionError = (): PermissionErrorContextType => {
  const context = useContext(PermissionErrorContext);
  if (context === undefined) {
    throw new Error('usePermissionError must be used within a PermissionErrorProvider');
  }
  return context;
};

