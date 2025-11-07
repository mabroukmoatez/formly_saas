import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Apprenants } from '../screens/Admin/Apprenants.tsx';

const ApprenantsPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <Apprenants />
    </DashboardLayout>
  );
};

export default ApprenantsPage;

