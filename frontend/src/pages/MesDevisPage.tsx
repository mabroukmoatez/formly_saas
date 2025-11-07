import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { MesDevis } from '../screens/Admin/MesDevis';

const MesDevisPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <MesDevis />
    </DashboardLayout>
  );
};

export default MesDevisPage;

