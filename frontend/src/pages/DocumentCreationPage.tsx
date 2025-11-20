import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard';
import { DocumentCreationContent } from '../screens/Admin/DocumentCreationContent';

export const DocumentCreationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <DocumentCreationContent />
    </DashboardLayout>
  );
};

