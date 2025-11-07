import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { EvenementsCreation } from '../screens/Admin';

const EvenementsCreationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <EvenementsCreation />
    </DashboardLayout>
  );
};

export default EvenementsCreationPage;

