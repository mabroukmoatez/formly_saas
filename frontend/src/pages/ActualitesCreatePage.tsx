import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { ActualitesCreate } from '../screens/Admin';

const ActualitesCreatePage: React.FC = () => {
  return (
    <DashboardLayout>
      <ActualitesCreate />
    </DashboardLayout>
  );
};

export default ActualitesCreatePage;
