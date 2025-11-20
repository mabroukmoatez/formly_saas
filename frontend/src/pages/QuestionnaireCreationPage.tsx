import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard';
import { QuestionnaireCreationContent } from '../screens/Admin/QuestionnaireCreationContent';

export const QuestionnaireCreationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <QuestionnaireCreationContent />
    </DashboardLayout>
  );
};

