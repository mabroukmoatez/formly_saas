import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentEventsScreen } from '../screens/Student/Events';

const StudentEvents: React.FC = () => {
  return (
    <StudentLayout>
      <StudentEventsScreen />
    </StudentLayout>
  );
};

export default StudentEvents;
