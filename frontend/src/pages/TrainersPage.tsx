import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { TrainersManagement } from '../screens/Admin/TrainersManagement';

const TrainersPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <TrainersManagement />
    </DashboardLayout>
  );
};

export default TrainersPage;

