import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { QuizEdit } from '../components/Quiz/QuizEdit';

export const QuizEditPage: React.FC = () => {
  return (
    <DashboardLayout>
      <QuizEdit />
    </DashboardLayout>
  );
};

