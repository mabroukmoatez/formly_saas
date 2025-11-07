import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Planning } from '../screens/Admin';

const PlanningsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <Planning />
    </DashboardLayout>
  );
};

export default PlanningsPage;

