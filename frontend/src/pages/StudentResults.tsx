import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentResultsScreen } from '../screens/Student/Results';

const StudentResults: React.FC = () => {
  return (
    <StudentLayout>
      <StudentResultsScreen />
    </StudentLayout>
  );
};

export default StudentResults;
