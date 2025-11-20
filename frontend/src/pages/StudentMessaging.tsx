import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentMessagingScreen } from '../screens/Student/Messaging';

const StudentMessaging: React.FC = () => {
  return (
    <StudentLayout>
      <StudentMessagingScreen />
    </StudentLayout>
  );
};

export default StudentMessaging;
