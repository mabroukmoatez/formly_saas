import React from 'react';
import { StudentLayout } from '../components/StudentDashboard';
import { StudentCatalogueScreen } from '../screens/Student/Catalogue';

const StudentCatalogue: React.FC = () => {
  return (
    <StudentLayout>
      <StudentCatalogueScreen />
    </StudentLayout>
  );
};

export default StudentCatalogue;
