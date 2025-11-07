import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { MesFactures } from '../screens/Admin/MesFactures';

const MesFacturesPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <MesFactures />
    </DashboardLayout>
  );
};

export default MesFacturesPage;

