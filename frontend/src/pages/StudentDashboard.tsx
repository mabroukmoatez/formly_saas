import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentDashboardScreen } from '../screens/Student/Dashboard';

const StudentDashboard: React.FC = () => {
  return (
    <StudentLayout>
      <StudentDashboardScreen />
    </StudentLayout>
  );
};

export default StudentDashboard;
