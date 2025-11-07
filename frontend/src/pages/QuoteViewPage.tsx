import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { QuoteViewContent } from '../screens/Admin/QuoteViewContent';

export const QuoteViewPage: React.FC = () => {
  return (
    <DashboardLayout>
      <QuoteViewContent />
    </DashboardLayout>
  );
};

