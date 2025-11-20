import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentProfileScreen } from '../screens/Student/Profile';

const StudentProfile: React.FC = () => {
  return (
    <StudentLayout>
      <StudentProfileScreen />
    </StudentLayout>
  );
};

export default StudentProfile;
