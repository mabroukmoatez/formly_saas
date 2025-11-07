import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useToast } from '../../components/ui/toast';
import { quizService } from '../../services/quiz';
import { QuizCreationHeader } from '../../components/Quiz/QuizCreationHeader';
import { QuizInformationForm } from '../../components/Quiz/QuizInformationForm';
import { QuestionEditor } from '../../components/Quiz/QuestionEditor';
import { DashboardLayout } from '../../components/CommercialDashboard/Layout';
import { AssociationFlow } from '../../components/Quiz/AssociationFlow';

export const QuizCreationContent: React.FC = () => {
  const { quizUuid } = useParams<{ quizUuid?: string }>();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { navigateToRoute, buildRoute } = useSubdomainNavigation();
  const { success, error: showError, warning: showWarning } = useToast();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showAssociationFlow, setShowAssociationFlow] = useState(false);
  const [loadedQuizUuid, setLoadedQuizUuid] = useState<string | undefined>(quizUuid);
  
  // Quiz Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [duration, setDuration] = useState(30);
  const [categories, setCategories] = useState<number[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRemake, setIsRemake] = useState(false);
  const [showAnswerAfter, setShowAnswerAfter] = useState(true);
  
  // Questions
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (quizUuid) {
      loadQuiz();
    }
  }, [quizUuid]);

  const loadQuiz = async () => {
    try {
      const response = await quizService.getQuiz(quizUuid!);
      if (response.success && response.data) {
        const quiz = response.data;
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setThumbnailPreview(quiz.thumbnail || '');
        setDuration(quiz.duration || 30);
        setIsShuffle(quiz.is_shuffle);
        setIsRemake(quiz.is_remake);
        setShowAnswerAfter(quiz.show_answer_after);
        setQuestions(quiz.questions || []);
      }
    } catch (err: any) {
      showError(t('common.error'), t('quiz.messages.createError'));
    }
  };

  const handleAutoSave = async () => {
    setAutoSaving(true);
    // Auto save logic
    setTimeout(() => setAutoSaving(false), 1000);
  };

  const handleSaveDraft = async (moveToNextStep: boolean = false) => {
    if (!title.trim()) {
      showError(t('common.error'), t('quiz.messages.titleRequired'));
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (thumbnail) formData.append('thumbnail', thumbnail);
      formData.append('duration', duration.toString());
      formData.append('is_shuffle', isShuffle ? '1' : '0');
      formData.append('is_remake', isRemake ? '1' : '0');
      formData.append('show_answer_after', showAnswerAfter ? '1' : '0');
      formData.append('status', 'draft');

      let response;
      if (loadedQuizUuid) {
        response = await quizService.updateQuiz(loadedQuizUuid, formData);
      } else {
        response = await quizService.createQuiz(formData);
      }

      if (response.success) {
        success(loadedQuizUuid ? t('quiz.messages.updateSuccess') : t('quiz.messages.createSuccess'));
        
        if (!loadedQuizUuid && response.data?.uuid) {
          const newUuid = response.data.uuid;
          setLoadedQuizUuid(newUuid);
          
          // Update URL without full navigation (to preserve state and avoid reload)
          const newUrl = buildRoute(`/quiz/edit/${newUuid}`);
          window.history.replaceState({}, '', newUrl);
        }

        // Move to next step if requested
        if (moveToNextStep) {
          setCurrentStep(2);
        }
      }
    } catch (err: any) {
      showError(t('common.error'), loadedQuizUuid ? t('quiz.messages.updateError') : t('quiz.messages.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        showWarning(t('quiz.validation.questionsMinimum'), t('quiz.validation.titleRequired'));
        return;
      }
      if (!loadedQuizUuid) {
        // Save and move to next step
        await handleSaveDraft(true);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (questions.length > 0) {
        setShowAssociationFlow(true);
      } else {
        showWarning(t('quiz.validation.questionsMinimum'), t('quiz.validation.questionsMinimumMessage'));
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || (step === 2 && loadedQuizUuid)) {
      setCurrentStep(step);
    }
  };

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <QuizCreationHeader
          currentStep={currentStep}
          totalSteps={2}
          onStepClick={handleStepClick}
          onAutoSave={handleAutoSave}
          onSaveDraft={handleSaveDraft}
          isAutoSaving={autoSaving}
          isSavingDraft={saving}
          quizData={{
            title,
            duration,
            total_questions: questions.length
          }}
        />
        
        <main className="w-full flex justify-center py-7 px-4">
          <div className="w-full max-w-[1396px] space-y-6">
            {currentStep === 1 && (
              <QuizInformationForm
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                thumbnail={thumbnail}
                thumbnailPreview={thumbnailPreview}
                setThumbnail={(file) => {
                  setThumbnail(file);
                  if (file) setThumbnailPreview(URL.createObjectURL(file));
                }}
                duration={duration}
                setDuration={setDuration}
                isShuffle={isShuffle}
                setIsShuffle={setIsShuffle}
                isRemake={isRemake}
                setIsRemake={setIsRemake}
                showAnswerAfter={showAnswerAfter}
                setShowAnswerAfter={setShowAnswerAfter}
              />
            )}

            {currentStep === 2 && loadedQuizUuid && (
              <QuestionEditor
                quizUuid={loadedQuizUuid}
                questions={questions}
                onQuestionsChange={setQuestions}
                onComplete={() => {}}
              />
            )}

            {/* Footer Navigation */}
            <div className="flex justify-between items-center pt-6 pb-4">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'text-white'
                }`}
                style={{ 
                  backgroundColor: currentStep === 1 ? '#e5e7eb' : organization?.primary_color || '#4b5563',
                  color: currentStep === 1 ? '#9ca3af' : 'white'
                }}
              >
                ← {t('common.previous')}
              </button>

              <button
                onClick={handleNextStep}
                className={`px-6 py-3 rounded-lg font-medium transition-colors text-white`}
                style={{ 
                  backgroundColor: currentStep === 2 ? '#16a34a' : (organization?.primary_color || '#2563eb'),
                }}
              >
                {currentStep === 2 ? t('common.submit') : `${t('common.next')} →`}
              </button>
            </div>
          </div>
        </main>

        {showAssociationFlow && loadedQuizUuid && (
          <AssociationFlow
            quizUuid={loadedQuizUuid}
            onClose={() => {
              setShowAssociationFlow(false);
              navigateToRoute('/quiz');
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

