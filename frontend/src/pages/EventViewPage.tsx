import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard';
import { EventView } from '../components/EventView';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const EventViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { navigateToRoute } = useSubdomainNavigation();

  const handleClose = () => {
    navigateToRoute('/evenements');
  };

  const handleEdit = () => {
    navigateToRoute(`/evenements/edit/${id}`);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete event:', id);
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">ID d'événement manquant</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <EventView 
        eventId={id}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  );
};
