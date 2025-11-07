import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { CourseView } from '../components/CourseView/CourseView';
import { courseCreation } from '../services/courseCreation';
import { useToast } from '../components/ui/toast';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';

export const CourseEditPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error } = useToast();

  const handleSave = async (updatedData: any) => {
    try {
      if (!uuid) {
        throw new Error('UUID du cours manquant');
      }

      // Call API to update course
      const response = await courseCreation.updateCourse(uuid, updatedData);
      
      if (response.success) {
        success('Cours mis à jour avec succès');
        // Redirect to view page after save
        setTimeout(() => {
          navigateToRoute(`/course-view/${uuid}`);
        }, 1000);
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      console.error('Error updating course:', err);
      error(err.message || 'Impossible de mettre à jour le cours');
      throw err;
    }
  };

  const handleClose = () => {
    navigateToRoute(`/course-view/${uuid}`);
  };

  if (!uuid) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">UUID du cours manquant</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <CourseView
        courseUuid={uuid}
        editMode={true}
        onSave={handleSave}
        onClose={handleClose}
      />
    </DashboardLayout>
  );
};

export default CourseEditPage;

