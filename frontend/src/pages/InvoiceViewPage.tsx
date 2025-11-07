import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { InvoiceViewContent } from '../screens/Admin/InvoiceViewContent';

const InvoiceViewPage: React.FC = () => {
  return (
    <DashboardLayout>
      <InvoiceViewContent />
    </DashboardLayout>
  );
};

export default InvoiceViewPage;

