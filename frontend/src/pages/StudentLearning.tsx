import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentLearningScreen } from '../screens/Student/Learning';

const StudentLearning: React.FC = () => {
  return (
    <StudentLayout>
      <StudentLearningScreen />
    </StudentLayout>
  );
};

export default StudentLearning;
