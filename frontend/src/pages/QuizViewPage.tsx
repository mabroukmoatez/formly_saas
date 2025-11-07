import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { QuizView } from '../components/Quiz/QuizView';

export const QuizViewPage: React.FC = () => {
  return (
    <DashboardLayout>
      <QuizView />
    </DashboardLayout>
  );
};

