import React from 'react';
import { CourseCreation } from '../screens/CourseCreation';

interface CourseCreationPageProps {
  courseUuid?: string;
  onCourseSaved?: () => void;
}

export const CourseCreationPage: React.FC<CourseCreationPageProps> = ({ 
  courseUuid,
  onCourseSaved 
}) => {
  return (
    <CourseCreation 
      courseUuid={courseUuid}
      onCourseSaved={onCourseSaved}
    />
  );
};
