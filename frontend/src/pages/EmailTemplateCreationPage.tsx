import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard';
import { EmailTemplateCreation } from '../screens/WhiteLabel/EmailTemplateCreation';

export const EmailTemplateCreationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <EmailTemplateCreation />
    </DashboardLayout>
  );
};

