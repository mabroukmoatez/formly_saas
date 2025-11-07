import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { SupportTickets } from '../screens/Admin/SupportTickets';

const SupportTicketsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <SupportTickets />
    </DashboardLayout>
  );
};

export default SupportTicketsPage;

