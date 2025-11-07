import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { SessionView } from '../components/SessionView/SessionView';
import { sessionCreation } from '../services/sessionCreation';
import { useToast } from '../components/ui/toast';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const SessionEditPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error } = useToast();

  const handleSave = async (updatedData: any) => {
    try {
      if (!uuid) {
        throw new Error('UUID de la session manquant');
      }

      // Call API to update session
      const response = await sessionCreation.updateSession(uuid, updatedData);
      
      if (response.success) {
        success('Session mise à jour avec succès');
        // Redirect to view page after save
        setTimeout(() => {
          navigateToRoute(`/session-view/${uuid}`);
        }, 1000);
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      console.error('Error updating session:', err);
      error(err.message || 'Impossible de mettre à jour la session');
      throw err;
    }
  };

  const handleClose = () => {
    navigateToRoute(`/session-view/${uuid}`);
  };

  if (!uuid) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">UUID de la session manquant</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SessionView
        sessionUuid={uuid}
        editMode={true}
        onSave={handleSave}
        onClose={handleClose}
      />
    </DashboardLayout>
  );
};

export default SessionEditPage;

