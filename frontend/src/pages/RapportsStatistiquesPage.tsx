import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { RapportsStatistiques } from '../screens/Admin';

const RapportsStatistiquesPage: React.FC = () => {
  return (
    <DashboardLayout>
      <RapportsStatistiques />
    </DashboardLayout>
  );
};

export default RapportsStatistiquesPage;

