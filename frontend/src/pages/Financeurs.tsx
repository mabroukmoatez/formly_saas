import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Financeurs } from '../screens/Admin/Financeurs';

const FinanceursPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <Financeurs />
    </DashboardLayout>
  );
};

export default FinanceursPage;
