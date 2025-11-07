import React from 'react';
import { useParams } from 'react-router-dom';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useToast } from '../ui/toast';
import { quizService } from '../../services/quiz';
import { QuizView } from './QuizView';

export const QuizEdit: React.FC = () => {
  const { quizUuid } = useParams<{ quizUuid: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error } = useToast();

  const handleSave = async (updatedData: any) => {
    try {
      if (!quizUuid) {
        throw new Error('UUID du quiz manquant');
      }

      console.log('💾 Preparing to save quiz with data:', updatedData);

      const formData = new FormData();
      
      // Suivre EXACTEMENT la documentation QUIZ_UPDATE_API_DOC.md
      
      // Champs texte/nombre - ajouter seulement si définis
      if (updatedData.title !== undefined) {
        formData.append('title', updatedData.title);
      }
      if (updatedData.description !== undefined) {
        formData.append('description', updatedData.description);
      }
      if (updatedData.duration !== undefined) {
        formData.append('duration', updatedData.duration.toString());
      }
      
      // ⚠️ IMPORTANT: Booleans doivent être des strings "0" ou "1"
      if (updatedData.is_shuffle !== undefined) {
        formData.append('is_shuffle', updatedData.is_shuffle ? '1' : '0');
      }
      if (updatedData.is_remake !== undefined) {
        formData.append('is_remake', updatedData.is_remake ? '1' : '0');
      }
      if (updatedData.show_answer_during !== undefined) {
        formData.append('show_answer_during', updatedData.show_answer_during ? '1' : '0');
      }
      if (updatedData.show_answer_after !== undefined) {
        formData.append('show_answer_after', updatedData.show_answer_after ? '1' : '0');
      }
      
      // Status
      if (updatedData.status !== undefined) {
        formData.append('status', updatedData.status);
      }
      
      // ⚠️ IMPORTANT: category_ids doit être stringifié
      if (updatedData.category_ids !== undefined && Array.isArray(updatedData.category_ids)) {
        formData.append('category_ids', JSON.stringify(updatedData.category_ids));
      }

      // Log FormData contents
      console.log('📤 FormData being sent:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await quizService.updateQuiz(quizUuid, formData);
      console.log('📥 Backend response:', response);
      console.log('📥 Backend returned data:', response.data);
      console.log('📥 Title in response:', response.data?.title);
      console.log('📥 Description in response:', response.data?.description);
      console.log('📥 Duration in response:', response.data?.duration);
      
      if (response.success) {
        success('Quiz mis à jour avec succès');
        console.log('✅ Quiz updated successfully, redirecting...');
        
        // Vérifier si les données ont vraiment été mises à jour
        if (response.data?.description !== updatedData.description) {
          console.warn('⚠️ WARNING: Description not updated!');
          console.warn('   Sent:', updatedData.description);
          console.warn('   Received:', response.data?.description);
        }
        if (response.data?.title !== updatedData.title) {
          console.warn('⚠️ WARNING: Title not updated!');
          console.warn('   Sent:', updatedData.title);
          console.warn('   Received:', response.data?.title);
        }
        
        setTimeout(() => {
          navigateToRoute(`/quiz/${quizUuid}`);
        }, 1000);
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      console.error('❌ Error updating quiz:', err);
      error(err.message || 'Impossible de mettre à jour le quiz');
      throw err;
    }
  };

  const handleClose = () => {
    navigateToRoute(`/quiz/${quizUuid}`);
  };

  if (!quizUuid) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">UUID du quiz manquant</p>
      </div>
    );
  }

  return (
    <QuizView
      quizUuid={quizUuid}
      editMode={true}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

