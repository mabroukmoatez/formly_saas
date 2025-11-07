import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { InvoiceCreation } from '../screens/Admin/InvoiceCreation';

const InvoiceCreationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <InvoiceCreation />
    </DashboardLayout>
  );
};

export default InvoiceCreationPage;

