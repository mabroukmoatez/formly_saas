import React from 'react';
import { useParams } from 'react-router-dom';
import { SessionCreation } from '../screens/SessionCreation';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const SessionEditPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();

  const handleSessionSaved = () => {
    // Navigate back to sessions list after saving
    navigateToRoute('/sessions');
  };

  if (!uuid) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">UUID de la session manquant</p>
      </div>
    );
  }

  return (
    <SessionCreation 
      sessionUuid={uuid} 
      onSessionSaved={handleSessionSaved}
    />
  );
};

export default SessionEditPage;

