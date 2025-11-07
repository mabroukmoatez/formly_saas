import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard';
import { SessionView } from '../components/SessionView';
import { useParams } from 'react-router-dom';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const SessionViewPage: React.FC = () => {
  const { sessionUuid } = useParams<{ sessionUuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();

  const handleClose = () => {
    navigateToRoute('/session-management');
  };

  const handleEdit = () => {
    navigateToRoute(`/session-edit/${sessionUuid}`);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete session:', sessionUuid);
  };

  if (!sessionUuid) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Session UUID not provided</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SessionView
        sessionUuid={sessionUuid}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  );
};

