import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard';
import { CourseView } from '../components/CourseView';
import { useParams } from 'react-router-dom';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const CourseViewPage: React.FC = () => {
  const { courseUuid } = useParams<{ courseUuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();

  const handleClose = () => {
    navigateToRoute('/gestion-formations');
  };

  const handleEdit = () => {
    navigateToRoute(`/course-edit/${courseUuid}`);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete course:', courseUuid);
  };

  if (!courseUuid) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Course UUID not provided</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <CourseView
        courseUuid={courseUuid}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  );
};
