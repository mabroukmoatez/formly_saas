import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { ChargesDepenses } from '../screens/Admin/ChargesDepenses';

const ChargesDepensesPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <ChargesDepenses />
    </DashboardLayout>
  );
};

export default ChargesDepensesPage;

