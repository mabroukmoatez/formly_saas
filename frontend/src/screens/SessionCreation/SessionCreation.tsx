import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { SessionCreationHeader } from '../../components/SessionCreation/SessionCreationHeader';
import { SessionInformationForm } from '../../components/SessionCreation/SessionInformationForm';
import { CollapsibleSections } from '../../components/SessionCreation/CollapsibleSections';
import { Step2Contenu } from '../../components/SessionCreation/Step2Contenu';
import { Step3Documents } from '../../components/SessionCreation/Step3Documents';
import { Step4Questionnaire } from '../../components/SessionCreation/Step4Questionnaire';
import { Step5Formateur } from '../../components/SessionCreation/Step5Formateur';
import { Step6Seances } from '../../components/SessionCreation/Step6Seances';
import { Step7Participants } from '../../components/SessionCreation/Step7Participants';
import { Step8Deroulement } from '../../components/SessionCreation/Step8Deroulement';
import { useSessionCreation, SessionCreationProvider } from '../../contexts/SessionCreationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useToast } from '../../components/ui/toast';

interface SessionCreationProps {
  sessionUuid?: string;
  onSessionCreated?: (sessionUuid: string) => void;
  onSessionSaved?: () => void;
}

const SessionCreationContent: React.FC<SessionCreationProps> = ({
  sessionUuid,
  onSessionSaved
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, warning: showWarning, success: showSuccess } = useToast();
  
  const {
    currentStep,
    setCurrentStep,
    formData,
    updateFormField,
    metadata,
    instances,
    participants,
    chapters,
    documents,
    trainers,
    questionnaires,
    modules,
    objectives,
    additionalFees,
    createSession,
    updateSession,
    loadSession,
    initializeSession,
    loadMetadata,
    generateInstances,
    getInstances,
    cancelInstance,
    enrollParticipant,
    getParticipants,
    updateParticipantStatus,
    markAttendance,
    getAttendanceReport,
    getChapters,
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    createSubChapterAdapter,
    updateSubChapterAdapter,
    deleteSubChapterAdapter,
    createContentAdapter,
    updateContent,
    createEvaluationAdapter,
    uploadSupportFilesAdapter,
    deleteSupportFile,
    getDocuments,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    loadQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deleteQuestionnaire,
    getTrainers,
    searchTrainers,
    assignTrainer,
    updateTrainerPermissions,
    removeTrainer,
    createTrainer,
    updateTrainer,
    loadWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    createWorkflowAction,
    updateWorkflowAction,
    deleteWorkflowAction,
    reorderWorkflowActions,
    toggleWorkflowAction,
    getModules,
    loadModules,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    getObjectives,
    loadObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
    createAdditionalFee,
    updateAdditionalFee,
    deleteAdditionalFee,
    autoSave,
    saveDraft,
    isSaving,
    isLoading,
    uploadIntroVideo,
    uploadIntroImage
  } = useSessionCreation();

  const [isInitialized, setIsInitialized] = useState(false);
  const [step2Progress, setStep2Progress] = useState(0);

  // Initialize session creation
  useEffect(() => {
    if (!isInitialized) {
      loadMetadata().then(() => {
        initializeSession(sessionUuid).then(() => {
          setIsInitialized(true);
        }).catch((error) => {
          console.error('Error initializing session:', error);
          showError(t('sessionCreation.errors.initializationFailed'));
        });
      });
    }
  }, [sessionUuid, initializeSession, loadMetadata, isInitialized, showError, t]);

  // Auto-save effect - seulement si initialisé et UUID existe
  useEffect(() => {
    if (isInitialized && formData.sessionUuid) {
      // Ne pas auto-save si on n'a pas encore de titre (création initiale)
      if (formData.title && formData.title.trim()) {
        autoSave();
      }
    }
  }, [
    isInitialized,
    formData.sessionUuid,
    formData.title,
    formData.description,
    formData.price,
    formData.duration,
    formData.session_start_date,
    formData.session_end_date,
    formData.session_start_time,
    formData.session_end_time,
    autoSave
  ]);

  // Calculate step 2 progress
  useEffect(() => {
    if (currentStep === 2) {
      const totalItems = chapters.length + documents.length;
      const completedItems = chapters.filter(c => c.title.trim()).length + 
                           documents.filter(d => d.name.trim()).length;
      setStep2Progress(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);
    }
  }, [currentStep, chapters, documents]);

  const handleAutoSave = async () => {
    try {
      await autoSave();
      showSuccess(t('sessionCreation.autoSaveSuccess'));
    } catch (error) {
      showError(t('sessionCreation.autoSaveError'));
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      showSuccess(t('sessionCreation.draftSaved'));
    } catch (error) {
      showError(t('sessionCreation.draftSaveError'));
    }
  };

  const handleFileUpload = (field: 'intro_video' | 'intro_image', file: File) => {
    updateFormField(field, file);
  };

  const handleFileUrlUpdate = (field: 'intro_video_url' | 'intro_image_url', url: string) => {
    updateFormField(field, url);
  };

  // Navigation handlers
  const handleNextStep = async () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 8) {
      // Handle session completion
      try {
        const updated = await updateSession();
        if (updated) {
          showSuccess(t('session.completedSuccessfully'));
          // Optionally redirect to session management or dashboard
        }
      } catch (error: any) {
        console.error('Failed to complete session:', error);
        showError(t('session.completionError'));
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= currentStep || stepNumber === 1) {
      setCurrentStep(stepNumber);
    } else {
      showError(
        t('sessionCreation.validation.previousStepsIncomplete'),
        t('sessionCreation.validation.previousStepsIncompleteMessage') || 'Veuillez compléter les étapes précédentes avant d\'accéder à cette étape.'
      );
    }
  };

  const renderCurrentStep = () => {
    if (!isInitialized || !metadata) {
      return <LoadingScreen />;
    }

    switch (currentStep) {
      case 1:
        return (
          <>
            <SessionInformationForm
              formData={formData}
              categories={metadata.categories}
              languages={metadata.languages}
              difficultyLevels={metadata.difficulty_levels}
              onInputChange={updateFormField}
              onFileUpload={handleFileUpload}
              onFileUrlUpdate={handleFileUrlUpdate}
              uploadIntroVideo={uploadIntroVideo}
              uploadIntroImage={uploadIntroImage}
            />
            
            <CollapsibleSections
              sections={[]}
              onSectionClick={() => {
                // Just toggle sections, don't change steps
                // The sections should stay in Step 1
              }}
              modules={modules.map(module => ({
                id: module.uuid || module.id,
                title: module.title,
                description: module.description,
                duration: module.duration || 0,
                order: module.order_index || module.order
              }))}
              objectives={objectives.map(objective => ({
                id: objective.uuid || objective.id,
                text: objective.description || objective.text,
                order: objective.order_index || objective.order
              }))}
              targetAudience={formData.target_audience || ''}
              prerequisites={formData.prerequisites || ''}
              methods={formData.methods || ''}
              priceHT={formData.price_ht || 0}
              vatPercentage={formData.vat_percentage || 20}
              additionalFees={additionalFees.map(fee => ({
                id: fee.uuid || fee.id,
                name: fee.name,
                amount: fee.amount,
                vat_applied: fee.vat_applied || false,
                unit: fee.unit || 'EUR'
              }))}
              specifics={formData.specifics || ''}
              onAddModule={() => createModule({
                title: 'Nouveau module',
                description: '',
                order_index: modules.length + 1
              })}
              onUpdateModule={(id, field, value) => {
                const module = modules.find(m => (m.uuid || m.id) === id);
                if (module) {
                  updateModule(module.uuid || module.id, { [field]: value });
                }
              }}
              onRemoveModule={(id) => {
                const module = modules.find(m => (m.uuid || m.id) === id);
                if (module) {
                  deleteModule(module.uuid || module.id);
                }
              }}
              onReorderModules={(reorderedModules) => {
                reorderModules(reorderedModules);
              }}
              onAddObjective={() => createObjective({
                description: 'Nouvel objectif',
                order_index: objectives.length + 1
              })}
              onUpdateObjective={(id, field, value) => {
                const objective = objectives.find(o => (o.uuid || o.id) === id);
                if (objective) {
                  updateObjective(objective.uuid || objective.id, { [field]: value });
                }
              }}
              onRemoveObjective={(id) => {
                const objective = objectives.find(o => (o.uuid || o.id) === id);
                if (objective) {
                  deleteObjective(objective.uuid || objective.id);
                }
              }}
              onUpdateTargetAudience={(content) => updateFormField('target_audience', content)}
              onUpdatePrerequisites={(content) => updateFormField('prerequisites', content)}
              onUpdateMethods={(content) => updateFormField('methods', content)}
              onUpdatePriceHT={(value) => updateFormField('price_ht', value)}
              onUpdateVATPercentage={(value) => updateFormField('vat_percentage', value)}
              onAddAdditionalFee={() => createAdditionalFee({
                name: 'Nouvelle taxe',
                amount: 0,
                description: '',
                order_index: additionalFees.length + 1
              })}
              onUpdateAdditionalFee={(id, field, value) => {
                const fee = additionalFees.find(f => (f.uuid || f.id) === id);
                if (fee) {
                  updateAdditionalFee(fee.uuid || fee.id, { [field]: value });
                }
              }}
              onRemoveAdditionalFee={(id) => {
                const fee = additionalFees.find(f => (f.uuid || f.id) === id);
                if (fee) {
                  deleteAdditionalFee(fee.uuid || fee.id);
                }
              }}
              onUpdateSpecifics={(content) => updateFormField('specifics', content)}
            />
          </>
        );
      case 2:
        return (
          <Step2Contenu
            chapters={chapters}
            documents={documents}
            onAddChapter={async (chapterData) => {
              await createChapter(chapterData);
              await loadChapters();
            }}
            onUpdateChapter={async (chapterUuid, chapterData) => {
              await updateChapter(chapterUuid, chapterData);
              await loadChapters();
            }}
            onRemoveChapter={async (chapterUuid) => {
              await deleteChapter(chapterUuid);
              await loadChapters();
            }}
            onAddDocument={async (documentData) => {
              await uploadDocument(documentData);
              await loadDocuments();
            }}
            onUpdateDocument={async (documentUuid, documentData) => {
              // Note: Update document API might need to be implemented
              console.log('Update document:', documentUuid, documentData);
            }}
            onRemoveDocument={async (documentUuid) => {
              await deleteDocument(documentUuid);
              await loadDocuments();
            }}
          />
        );
      case 3:
        return <Step3Documents />;
      case 4:
        return <Step4Questionnaire />;
      case 5:
        return <Step5Formateur />;
      case 6:
        return (
          <Step6Seances
            instances={instances}
            trainers={trainers}
            onGenerateInstances={generateInstances}
            onCancelInstance={cancelInstance}
            isLoading={isLoading}
          />
        );
      case 7:
        return (
          <Step7Participants
            participants={participants}
            instances={instances}
            onEnrollParticipant={enrollParticipant}
            onUpdateParticipantStatus={updateParticipantStatus}
            onMarkAttendance={markAttendance}
            onGetAttendanceReport={getAttendanceReport}
            isLoading={isLoading}
          />
        );
      case 8:
        return <Step8Deroulement />;
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SessionCreationHeader
          currentStep={currentStep}
          totalSteps={8}
          onStepClick={handleStepClick}
          onAutoSave={handleAutoSave}
          onSaveDraft={handleSaveDraft}
          isAutoSaving={isSaving}
          isSavingDraft={isSaving}
          step2Progress={step2Progress}
          formData={formData}
        />
        
        <main className="w-full flex justify-center py-7 px-4">
          <div className="w-full max-w-[1396px] space-y-6">
            {renderCurrentStep()}
            
            {/* Footer Navigation */}
            <div className="flex justify-between items-center pt-6 pb-4">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                style={{ 
                  backgroundColor: currentStep === 1 ? '#e5e7eb' : organization?.primary_color || '#4b5563',
                  color: currentStep === 1 ? '#9ca3af' : 'white'
                }}
              >
                {t('common.previous')}
              </button>
              
              <button
                onClick={handleNextStep}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 8
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                style={{ 
                  backgroundColor: currentStep === 8 ? '#16a34a' : (organization?.primary_color || '#2563eb'),
                  color: 'white'
                }}
              >
                {currentStep === 8 ? 'Terminer' : t('common.next')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export const SessionCreation: React.FC<SessionCreationProps> = (props) => {
  return (
    <SessionCreationProvider>
      <SessionCreationContent {...props} />
    </SessionCreationProvider>
  );
};

export default SessionCreation;
