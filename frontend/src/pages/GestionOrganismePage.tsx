import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { GestionOrganisme } from '../screens/Admin';

const GestionOrganismePage: React.FC = () => {
  return (
    <DashboardLayout>
      <GestionOrganisme />
    </DashboardLayout>
  );
};

export default GestionOrganismePage;

