import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { QuoteCreation } from '../screens/Admin/QuoteCreation';

export const QuoteCreationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <QuoteCreation />
    </DashboardLayout>
  );
};

