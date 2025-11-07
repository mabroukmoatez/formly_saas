import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Entreprises } from '../screens/Admin/Entreprises';

const EntreprisesPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <Entreprises />
    </DashboardLayout>
  );
};

export default EntreprisesPage;
