import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { ActualitesEdit } from '../screens/Admin/ActualitesEdit';

const ActualitesEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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
      <ActualitesEdit newsId={id} />
    </DashboardLayout>
  );
};

export default ActualitesEditPage;

