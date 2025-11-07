import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { CommercialDashboard } from '../components/CommercialDashboard/Dashboard';

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <CommercialDashboard />
    </DashboardLayout>
  );
};

export default DashboardPage;

