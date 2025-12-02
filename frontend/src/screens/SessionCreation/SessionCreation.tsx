/**
 * Session Creation Screen
 * 
 * Flux de création de session basée sur un cours:
 * 1. Modal de sélection de cours
 * 2. Stepper avec données du cours pré-remplies
 * 3. Steps: Info → Contenu → Documents → Questionnaires → Formateurs → Séances → Participants → Workflow
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { SessionCreationHeader } from '../../components/SessionCreation/SessionCreationHeader';
import { SessionInformationForm } from '../../components/SessionCreation/SessionInformationForm';
import { CollapsibleSections } from '../../components/CourseCreation/CollapsibleSections';
import { Step2Contenu } from '../../components/SessionCreation/Step2Contenu';
import { Step3DocumentsNew } from '../../components/SessionCreation/Step3DocumentsNew';
import { Step4QuestionnaireNew } from '../../components/SessionCreation/Step4QuestionnaireNew';
import { Step5FormateurNew } from '../../components/SessionCreation/Step5FormateurNew';
import { Step6Seances } from '../../components/SessionCreation/Step6Seances';
import { Step7Participants } from '../../components/SessionCreation/Step7Participants';
import { Step8WorkflowNew } from '../../components/SessionCreation/Step8WorkflowNew';
import { CourseSelectionModal } from '../../components/SessionCreation/CourseSelectionModal';
import { useSessionCreation, SessionCreationProvider } from '../../contexts/SessionCreationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useToast } from '../../components/ui/toast';
import { apiService } from '../../services/api';

// Course type for selection modal
interface SelectedCourse {
  id: number;
  uuid: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  intro_image_url?: string;
  price?: number;
  price_ht?: number;
  duration?: number;
  duration_days?: number;
  status?: number;
  isPublished?: boolean;
  is_published?: boolean;
  created_at?: string;
  category?: {
    id: number;
    name: string;
  };
}

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
    loadSubcategories,
    generateInstances,
    getInstances,
    cancelInstance,
    enrollParticipant,
    enrollMultipleParticipants,
    getParticipants,
    updateParticipantStatus,
    updateParticipantTarif,
    updateParticipantType,
    deleteParticipant,
    deleteMultipleParticipants,
    exportParticipants,
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
    uploadIntroImage,
    loadFromCourse
  } = useSessionCreation();

  const [isInitialized, setIsInitialized] = useState(false);
  const [step2Progress, setStep2Progress] = useState(0);
  const [localModules, setLocalModules] = useState(modules);
  const [localObjectives, setLocalObjectives] = useState(objectives);
  const [moduleUpdateTimeouts, setModuleUpdateTimeouts] = useState<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const [objectiveUpdateTimeouts, setObjectiveUpdateTimeouts] = useState<{[key: string]: ReturnType<typeof setTimeout>}>({});
  
  // Course selection modal state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [courseDataLoaded, setCourseDataLoaded] = useState(false); // Track if course data is fully loaded

  // Show course selection modal when creating a new session (no sessionUuid)
  useEffect(() => {
    if (!sessionUuid && !selectedCourse && !isInitialized) {
      setShowCourseModal(true);
    }
  }, [sessionUuid, selectedCourse, isInitialized]);

  // Handle course selection and pre-fill data using single API call
  const handleCourseSelected = async (course: SelectedCourse) => {
    setShowCourseModal(false);
    setIsLoadingCourse(true);
    setCourseDataLoaded(false); // Reset flag

    try {
      // ⭐ Use single API to get ALL course data at once
      console.log('[SessionCreation] Loading all course data from creation-data API:', course.uuid);
      const courseResponse = await apiService.get(`/api/organization/courses/${course.uuid}/creation-data`);
      
      if (courseResponse.success && courseResponse.data) {
        const { course: courseData, step1_basic_info, additional_data, additional_course_data, step2_structure, step3_documents, step4_questionnaires, step5_trainers } = courseResponse.data;
        
        // ⭐ CRITICAL: Set courseUuid FIRST - this is needed for all COURSE API calls
        updateFormField('courseUuid', course.uuid);
        
        // Pre-fill form with course data from step1_basic_info
        const basicInfo = step1_basic_info || courseData || {};
        updateFormField('title', basicInfo.title || '');
        updateFormField('subtitle', basicInfo.subtitle || '');
        updateFormField('description', basicInfo.description || '');
        updateFormField('category_id', basicInfo.category?.id || null);
        updateFormField('subcategory_id', basicInfo.subcategory?.id || null);
        updateFormField('session_language_id', basicInfo.language?.id || null);
        updateFormField('difficulty_level_id', basicInfo.difficulty_level?.id || null);
        updateFormField('price', parseFloat(basicInfo.price) || 0);
        updateFormField('price_ht', parseFloat(basicInfo.price_ht) || 0);
        updateFormField('vat_percentage', parseFloat(basicInfo.vat_percentage) || 20);
        updateFormField('duration', basicInfo.duration || 0);
        updateFormField('duration_days', basicInfo.duration_days || 0);
        updateFormField('target_audience', basicInfo.target_audience || '');
        updateFormField('prerequisites', basicInfo.prerequisites || '');
        updateFormField('methods', basicInfo.methods || '');
        updateFormField('specifics', basicInfo.specifics || '');
        updateFormField('evaluation_modalities', basicInfo.evaluation_modalities || '');
        updateFormField('access_modalities', basicInfo.access_modalities || '');
        updateFormField('accessibility', basicInfo.accessibility || '');
        updateFormField('contacts', basicInfo.contacts || '');
        updateFormField('intro_image_url', basicInfo.image_url || '');
        updateFormField('intro_video_url', basicInfo.video_url || '');
        
        // Keep the default formation_action (don't override with custom text)
        if (basicInfo.formation_action) {
          updateFormField('formation_action', basicInfo.formation_action);
        }

        // ⭐ IMPORTANT: Set ALL course content directly in context (using loadFromCourse which now uses same API)
        // loadFromCourse will handle the state update for modules, objectives, chapters, documents, questionnaires
        await loadFromCourse(course.uuid);
        
        // Now set course as selected - this will trigger initializeSession
        // But course data is already loaded, so it won't be overwritten
        setSelectedCourse(course);
        setCourseDataLoaded(true);
        
        console.log('[SessionCreation] All course data loaded successfully:', {
          title: basicInfo.title,
          modules: additional_course_data?.modules?.length || 0,
          objectives: additional_data?.objectives?.length || 0,
          chapters: step2_structure?.chapters?.length || 0,
          documents: step3_documents?.documents?.length || 0,
          questionnaires: step4_questionnaires?.questionnaires?.length || 0,
          trainers: step5_trainers?.trainers?.length || 0
        });
        
        showSuccess(`Données complètes du cours "${basicInfo.title}" chargées`);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      showWarning('Certaines données du cours n\'ont pas pu être chargées');
      setCourseDataLoaded(true); // Still allow initialization even if course load failed
      setSelectedCourse(course);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  // Initialize session creation
  useEffect(() => {
    // For existing session (editing): initialize immediately
    // For new session from course: wait for course data to be loaded first
    const shouldInitialize = !isInitialized && (
      sessionUuid || // Editing existing session
      (selectedCourse && courseDataLoaded) // New session from course, data loaded
    );
    
    if (shouldInitialize) {
      console.log('[SessionCreation] Initializing session...', { sessionUuid, selectedCourse: selectedCourse?.title, courseDataLoaded });
      loadMetadata().then(() => {
        initializeSession(sessionUuid).then(() => {
          setIsInitialized(true);
        }).catch((error) => {
          console.error('Error initializing session:', error);
          showError(t('sessionCreation.errors.initializationFailed'));
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUuid, isInitialized, selectedCourse, courseDataLoaded]); // Also depend on courseDataLoaded

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

  // Sync local modules with context modules
  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

  // Sync local objectives with context objectives
  useEffect(() => {
    setLocalObjectives(objectives);
  }, [objectives]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(moduleUpdateTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
      Object.values(objectiveUpdateTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [moduleUpdateTimeouts, objectiveUpdateTimeouts]);

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

  const handleInputChange = (field: string, value: any) => {
    updateFormField(field as keyof typeof formData, value);
    
    // Load subcategories when category changes
    if (field === 'category_id' && value) {
      loadSubcategories(value);
      // Reset subcategory when category changes
      updateFormField('subcategory_id', null);
    }
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
              subcategories={metadata.subcategories || []}
              onInputChange={handleInputChange}
              onFileUpload={handleFileUpload}
              onFileUrlUpdate={handleFileUrlUpdate}
              uploadIntroVideo={uploadIntroVideo}
              uploadIntroImage={uploadIntroImage}
              onCategoryCreated={loadMetadata}
              onSubcategoryCreated={() => {
                if (formData.category_id) {
                  loadSubcategories(formData.category_id);
                }
              }}
              selectedPracticeIds={formData.formation_practice_ids || []}
              onPracticesChanged={(practiceIds) => updateFormField('formation_practice_ids', practiceIds)}
            />
            
            <CollapsibleSections
              sections={[]}
              onSectionClick={() => {
                // Just toggle sections, don't change steps
                // The sections should stay in Step 1
              }}
              modules={localModules.map(module => ({
                id: module.uuid || module.id,
                title: module.title,
                description: module.description,
                duration: module.duration || 0,
                order: module.order_index || module.order
              }))}
              objectives={localObjectives.map(objective => ({
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
                const module = localModules.find(m => (m.uuid || m.id) === id);
                if (module) {
                  // Convert field names to match API expectations
                  const apiField = field === 'order' ? 'order_index' : field;
                  
                  // Update local state immediately for better UX
                  setLocalModules(prev => prev.map(m => 
                    (m.uuid || m.id) === id ? { ...m, [apiField]: value } : m
                  ));
                  
                  // Clear existing timeout for this module
                  if (moduleUpdateTimeouts[id]) {
                    clearTimeout(moduleUpdateTimeouts[id]);
                  }
                  
                  // Set new timeout for API call
                  const timeout = setTimeout(() => {
                    updateModule(module.uuid || module.id, { [apiField]: value });
                    setModuleUpdateTimeouts(prev => {
                      const newTimeouts = { ...prev };
                      delete newTimeouts[id];
                      return newTimeouts;
                    });
                  }, 1000); // 1 second delay
                  
                  setModuleUpdateTimeouts(prev => ({ ...prev, [id]: timeout }));
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
                const objective = localObjectives.find(o => (o.uuid || o.id) === id);
                if (objective) {
                  // Convert field names to match API expectations
                  const apiField = field === 'text' ? 'description' : (field === 'order' ? 'order_index' : field);
                  
                  // Update local state immediately for better UX
                  setLocalObjectives(prev => prev.map(o => 
                    (o.uuid || o.id) === id ? { ...o, [apiField]: value } : o
                  ));
                  
                  // Clear existing timeout for this objective
                  if (objectiveUpdateTimeouts[id]) {
                    clearTimeout(objectiveUpdateTimeouts[id]);
                  }
                  
                  // Set new timeout for API call
                  const timeout = setTimeout(() => {
                    updateObjective(objective.uuid || objective.id, { [apiField]: value });
                    setObjectiveUpdateTimeouts(prev => {
                      const newTimeouts = { ...prev };
                      delete newTimeouts[id];
                      return newTimeouts;
                    });
                  }, 1000); // 1 second delay
                  
                  setObjectiveUpdateTimeouts(prev => ({ ...prev, [id]: timeout }));
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
              evaluationModalities={formData.evaluation_modalities || ''}
              accessModalities={formData.access_modalities || ''}
              accessibility={formData.accessibility || ''}
              contacts={formData.contacts || ''}
              updateDate={formData.update_date || ''}
              onUpdateEvaluationModalities={(content) => updateFormField('evaluation_modalities', content)}
              onUpdateAccessModalities={(content) => updateFormField('access_modalities', content)}
              onUpdateAccessibility={(content) => updateFormField('accessibility', content)}
              onUpdateContacts={(content) => updateFormField('contacts', content)}
              onUpdateUpdateDate={(content) => updateFormField('update_date', content)}
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
        return <Step3DocumentsNew />;
      case 4:
        return <Step4QuestionnaireNew />;
      case 5:
        return <Step5FormateurNew />;
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
            onEnrollMultipleParticipants={enrollMultipleParticipants}
            onUpdateParticipantStatus={updateParticipantStatus}
            onUpdateParticipantTarif={updateParticipantTarif}
            onUpdateParticipantType={updateParticipantType}
            onDeleteParticipant={deleteParticipant}
            onDeleteMultipleParticipants={deleteMultipleParticipants}
            onExportParticipants={exportParticipants}
            onMarkAttendance={markAttendance}
            onGetAttendanceReport={getAttendanceReport}
            isLoading={isLoading}
          />
        );
      case 8:
        return <Step8WorkflowNew />;
      default:
        return null;
    }
  };

  // Show course selection modal
  if (showCourseModal && !sessionUuid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <CourseSelectionModal
          isOpen={showCourseModal}
          onClose={() => {
            // If user closes without selecting, redirect back
            window.history.back();
          }}
          onSelectCourse={handleCourseSelected}
        />
      </div>
    );
  }

  if (!isInitialized || isLoadingCourse) {
    return <LoadingScreen />;
  }

  return (
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
      
      <main className="w-full flex justify-center pb-7 px-4">
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
  );
};

export const SessionCreation: React.FC<SessionCreationProps> = (props) => {
  return (
    <DashboardLayout>
      <SessionCreationProvider>
        <SessionCreationContent {...props} />
      </SessionCreationProvider>
    </DashboardLayout>
  );
};

export default SessionCreation;
