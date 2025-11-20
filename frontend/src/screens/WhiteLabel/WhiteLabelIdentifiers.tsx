import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

// Redirige vers la page de gestion des utilisateurs existante
export const WhiteLabelIdentifiers: React.FC = () => {
  const { subdomain } = useSubdomainNavigation();
  
  // Rediriger vers la page de gestion des utilisateurs
  if (subdomain) {
    return <Navigate to={`/${subdomain}/user-management`} replace />;
  }
  return <Navigate to="/user-management" replace />;
};
