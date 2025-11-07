import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Actualites } from '../screens/Admin';

const ActualitesPage: React.FC = () => {
  return (
    <DashboardLayout>
      <Actualites />
    </DashboardLayout>
  );
};

export default ActualitesPage;