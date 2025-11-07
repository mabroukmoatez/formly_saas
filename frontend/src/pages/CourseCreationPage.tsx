import React from 'react';
import { CourseCreation } from '../screens/CourseCreation';

interface CourseCreationPageProps {
  courseUuid?: string;
}

export const CourseCreationPage: React.FC<CourseCreationPageProps> = ({ courseUuid }) => {
  return <CourseCreation />;
};
