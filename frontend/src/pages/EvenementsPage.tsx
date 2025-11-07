import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Evenements } from '../screens/Admin';

const EvenementsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <Evenements />
    </DashboardLayout>
  );
};

export default EvenementsPage;

