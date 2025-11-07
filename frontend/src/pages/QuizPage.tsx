import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { QuizList } from '../components/Quiz/QuizList';

export const QuizPage: React.FC = () => {
  return (
    <DashboardLayout>
      <QuizList />
    </DashboardLayout>
  );
};

export default QuizPage;

