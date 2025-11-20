import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentSharedFolderScreen } from '../screens/Student/SharedFolder';

const StudentSharedFolder: React.FC = () => {
  return (
    <StudentLayout>
      <StudentSharedFolderScreen />
    </StudentLayout>
  );
};

export default StudentSharedFolder;
