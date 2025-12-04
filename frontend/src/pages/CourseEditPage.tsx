import React from 'react';
import { useParams } from 'react-router-dom';
import { CourseCreation } from '../screens/CourseCreation';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const CourseEditPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();

  const handleCourseSaved = () => {
    // Navigate back to formations list after saving
    navigateToRoute('/gestion-des-formations');
  };

  if (!uuid) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">UUID du cours manquant</p>
      </div>
    );
  }

  return (
    <CourseCreation 
      courseUuid={uuid} 
      onCourseSaved={handleCourseSaved}
    />
  );
};

export default CourseEditPage;
