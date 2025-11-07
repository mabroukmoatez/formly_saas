import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard';
import { NewsView } from '../components/NewsView/NewsView';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const NewsViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { navigateToRoute } = useSubdomainNavigation();

  const handleClose = () => {
    navigateToRoute('/actualites');
  };

  const handleEdit = () => {
    navigateToRoute(`/actualites/edit/${id}`);
  };

  const handleDelete = () => {
    // Delete functionality handled in the NewsView component
    console.log('Delete news:', id);
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">ID d'actualité manquant</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <NewsView 
        newsId={id}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  );
};

