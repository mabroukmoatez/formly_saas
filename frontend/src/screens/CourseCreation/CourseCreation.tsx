import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { CourseCreationHeader } from '../../components/CourseCreation/CourseCreationHeader';
import { CourseInformationForm } from '../../components/CourseCreation/CourseInformationForm';
import { CollapsibleSections } from '../../components/CourseCreation/CollapsibleSections';
import { Step2Contenu } from '../../components/CourseCreation/Step2Contenu';
import { Step3DocumentsNew } from '../../components/CourseCreation/Step3DocumentsNew';
import { Step4QuestionnaireNew } from '../../components/CourseCreation/Step4QuestionnaireNew';
import { Step5FormateurNew } from '../../components/CourseCreation/Step5FormateurNew';
import { Step6WorkflowNew } from '../../components/CourseCreation/Step6WorkflowNew';
import { useCourseCreation, CourseCreationProvider, CourseCreationFormData } from '../../contexts/CourseCreationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useToast } from '../../components/ui/toast';

interface CourseCreationProps {
  courseUuid?: string;
  onCourseCreated?: (courseUuid: string) => void;
  onCourseSaved?: () => void;
}

const CourseCreationContent: React.FC<CourseCreationProps> = ({
  courseUuid,
  onCourseSaved
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
    loadSubcategories,
    loadCategories,
    modules,
    objectives,
    additionalFees,
    categories,
    subChapters: _subChapters,
    subcategories,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    createObjective,
    updateObjective,
    deleteObjective,
    createAdditionalFee,
    updateAdditionalFee,
    deleteAdditionalFee,
    autoSave,
    saveDraft,
    isSaving,
    initializeCourse,
    uploadIntroVideo,
    uploadIntroImage,
    updateCourseStatus
  } = useCourseCreation();

  const [isInitialized, setIsInitialized] = useState(false);
  const [localModules, setLocalModules] = useState(modules);
  const [localObjectives, setLocalObjectives] = useState(objectives);
  const [moduleDurations, setModuleDurations] = useState<{[key: string]: number}>({});
  const [moduleUpdateTimeouts, setModuleUpdateTimeouts] = useState<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const [objectiveUpdateTimeouts, setObjectiveUpdateTimeouts] = useState<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const [selectedPracticeIds, setSelectedPracticeIds] = useState<number[]>(formData.formation_practice_ids || []);

  // Load module durations from localStorage
  useEffect(() => {
    if (formData.courseUuid) {
      const savedDurations = localStorage.getItem(`moduleDurations_${formData.courseUuid}`);
      if (savedDurations) {
        try {
          setModuleDurations(JSON.parse(savedDurations));
        } catch (error) {
          console.error('Error loading module durations:', error);
        }
      }
    }
  }, [formData.courseUuid]);

  // Save module durations to localStorage
  useEffect(() => {
    if (formData.courseUuid && Object.keys(moduleDurations).length > 0) {
      localStorage.setItem(`moduleDurations_${formData.courseUuid}`, JSON.stringify(moduleDurations));
    }
  }, [moduleDurations, formData.courseUuid]);

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

  // Initialize course data when component mounts or courseUuid changes
  useEffect(() => {
    if (courseUuid && !isInitialized) {
      initializeCourse(courseUuid).then(() => {
        setIsInitialized(true);
      });
    } else if (!courseUuid) {
      initializeCourse().then(() => {
        setIsInitialized(true);
      });
    }
  }, [courseUuid, initializeCourse, isInitialized]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (isInitialized && formData.courseUuid) {
      const autoSaveInterval = setInterval(() => {
        autoSave();
      }, 120000); // Auto-save every 2 minutes to reduce API calls

      return () => clearInterval(autoSaveInterval);
    }
  }, [isInitialized, formData.courseUuid, autoSave]);

  // Debounced auto-save on form changes
  useEffect(() => {
    if (isInitialized && formData.courseUuid) {
      const timeoutId = setTimeout(() => {
        autoSave();
      }, 5000); // Auto-save 5 seconds after last change to reduce frequency

      return () => clearTimeout(timeoutId);
    }
  }, [
    formData.title, 
    formData.subtitle, 
    formData.description, 
    formData.category_id,
    formData.subcategory_id,
    formData.course_language_id,
    formData.difficulty_level_id,
    formData.duration,
    formData.duration_days,
    formData.target_audience,
    formData.prerequisites,
    formData.price,
    formData.currency,
    isInitialized, 
    formData.courseUuid, 
    autoSave
  ]);

  const handleInputChange = (field: string, value: any) => {
    // Map form fields to context fields
    const fieldMapping: { [key: string]: string } = {
      'title': 'title',
      'subtitle': 'subtitle',
      'description': 'description',
      'category_id': 'category_id',
      'subcategory_id': 'subcategory_id',
      'course_language_id': 'course_language_id',
      'difficulty_level_id': 'difficulty_level_id',
      'duration': 'duration',
      'duration_days': 'duration_days',
      'target_audience': 'target_audience',
      'prerequisites': 'prerequisites',
      'tags': 'tags',
      'youtube_video_id': 'youtube_video_id',
      'intro_video_url': 'intro_video_url',
      'intro_image_url': 'intro_image_url'
    };

    const contextField = fieldMapping[field] || field;
    
    // All fields are now properly mapped
    updateFormField(contextField as keyof CourseCreationFormData, value);

    // Load subcategories when category changes
    if (contextField === 'category_id' && value) {
      loadSubcategories(value);
      // reset subcategory when category changes
      updateFormField('subcategory_id', null);
    }
  };

  const handleFileUpload = (field: 'intro_video' | 'intro_image', file: File) => {
    // Map file upload fields to context fields
    if (field === 'intro_video') {
      updateFormField('intro_video', file);
    } else if (field === 'intro_image') {
      updateFormField('intro_image', file);
    }
  };

  const handleFileUrlUpdate = (field: 'intro_video_url' | 'intro_image_url', url: string) => {
    // Map file URL fields to context fields
    if (field === 'intro_video_url') {
      updateFormField('intro_video_url', url);
    } else if (field === 'intro_image_url') {
      updateFormField('intro_image_url', url);
    }
  };

  const handlePracticesChanged = (practiceIds: number[]) => {
    setSelectedPracticeIds(practiceIds);
    updateFormField('formation_practice_ids', practiceIds);
  };

  const handleAutoSave = () => {
    autoSave();
  };

  const handleSaveDraft = () => {
    saveDraft();
    if (onCourseSaved) {
      onCourseSaved();
    }
  };

  // Transform formData to match CourseInformationForm expectations
  const transformedFormData = {
    title: formData.title || '',
    subtitle: formData.subtitle || '',
    description: formData.description || '',
    formation_action: formData.formation_action || 'Actions de formation',
    category_id: formData.category_id,
    subcategory_id: formData.subcategory_id,
    course_language_id: formData.course_language_id,
    difficulty_level_id: formData.difficulty_level_id,
    duration: formData.duration || 0,
    duration_days: formData.duration_days || 0,
    target_audience: formData.target_audience || '',
    prerequisites: formData.prerequisites || '',
    tags: formData.tags || [],
    youtube_video_id: formData.youtube_video_id || '',
    intro_video: formData.intro_video,
    intro_image: formData.intro_image,
    intro_video_url: formData.intro_video_url || '',
    intro_image_url: formData.intro_image_url || '',
    courseUuid: formData.courseUuid
  };

  // Calculate total module hours
  const totalModuleHours = Object.values(moduleDurations).reduce((sum, hours) => sum + hours, 0);

  // Prepare data for CollapsibleSections
  const collapsibleSectionsData = {
    modules: localModules.map(module => ({
      id: module.uuid,
      title: module.title,
      description: module.description,
      duration: moduleDurations[module.uuid] || 0,
      order: module.order_index
    })),
    objectives: localObjectives.map(objective => ({
      id: objective.uuid,
      text: objective.description,
      order: objective.order_index
    })),
    targetAudience: formData.target_audience || '',
    prerequisites: formData.prerequisites || '',
    methods: formData.methods || '',
    priceHT: formData.price_ht || 0,
    vatPercentage: 20, // Default value
    additionalFees: additionalFees.map(fee => ({
      id: fee.uuid,
      name: fee.name,
      amount: fee.amount,
      vat_applied: false, // Default value since not in interface
      unit: 'EUR' // Default value since not in interface
    })),
    specifics: formData.specifics || '',
    evaluationModalities: formData.evaluation_modalities || '',
    accessModalities: formData.access_modalities || '',
    accessibility: formData.accessibility || '',
    contacts: formData.contacts || '',
    updateDate: formData.update_date || ''
  };

  // Handlers for CollapsibleSections
  const handleAddModule = () => {
    console.log('Adding new module...');
    createModule({
      title: 'Nouveau module',
      description: '',
      order_index: localModules.length + 1
    });
  };

  const handleUpdateModule = (id: string, field: string, value: any) => {
    console.log('Updating module:', id, field, value);
    const module = localModules.find(m => m.uuid === id);
    if (module) {
      // Handle duration separately since it's not in the API
      if (field === 'duration') {
        setModuleDurations(prev => ({ ...prev, [id]: value }));
        return; // Don't make API call for duration
      }
      
      // Convert field names to match API expectations
      const apiField = field === 'order' ? 'order_index' : field;
      
      // Update local state immediately for better UX
      setLocalModules(prev => prev.map(m => 
        m.uuid === id ? { ...m, [apiField]: value } : m
      ));
      
      // Clear existing timeout for this module
      if (moduleUpdateTimeouts[id]) {
        clearTimeout(moduleUpdateTimeouts[id]);
      }
      
      // Set new timeout for API call
      const timeout = setTimeout(() => {
        updateModule(module.uuid, { [apiField]: value });
        setModuleUpdateTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      }, 1000); // 1 second delay
      
      setModuleUpdateTimeouts(prev => ({ ...prev, [id]: timeout }));
    }
  };

  const handleRemoveModule = (id: string) => {
    console.log('Removing module:', id);
    const module = modules.find(m => m.uuid === id);
    if (module) {
      // Clean up duration state
      setModuleDurations(prev => {
        const newDurations = { ...prev };
        delete newDurations[id];
        return newDurations;
      });
      
      deleteModule(module.uuid);
    }
  };

  const handleReorderModules = (reorderedModules: any[]) => {
    console.log('Reordering modules:', reorderedModules);
    const moduleUuids = reorderedModules.map(m => {
      const module = modules.find(mod => mod.uuid === m.id);
      return module?.uuid || '';
    }).filter(uuid => uuid !== '');
    reorderModules(moduleUuids);
  };

  const handleAddObjective = () => {
    console.log('Adding new objective...');
    createObjective({
      title: 'Nouvel objectif',
      description: 'Description de l\'objectif',
      order_index: localObjectives.length + 1
    });
  };

  const handleUpdateObjective = (id: string, field: string, value: any) => {
    console.log('Updating objective:', id, field, value);
    const objective = localObjectives.find(o => o.uuid === id);
    if (objective) {
      // Convert field names to match API expectations
      const apiField = field === 'text' ? 'description' : (field === 'order' ? 'order_index' : field);
      
      // Update local state immediately for better UX
      setLocalObjectives(prev => prev.map(o => 
        o.uuid === id ? { ...o, [apiField]: value } : o
      ));
      
      // Clear existing timeout for this objective
      if (objectiveUpdateTimeouts[id]) {
        clearTimeout(objectiveUpdateTimeouts[id]);
      }
      
      // Set new timeout for API call
      const timeout = setTimeout(() => {
        updateObjective(objective.uuid, { [apiField]: value });
        setObjectiveUpdateTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      }, 1000); // 1 second delay
      
      setObjectiveUpdateTimeouts(prev => ({ ...prev, [id]: timeout }));
    }
  };

  const handleRemoveObjective = (id: string) => {
    console.log('Removing objective:', id);
    const objective = objectives.find(o => o.uuid === id);
    if (objective) {
      deleteObjective(objective.uuid);
    }
  };

  const handleUpdateTargetAudience = (content: string) => {
    updateFormField('target_audience', content);
  };

  const handleUpdatePrerequisites = (content: string) => {
    updateFormField('prerequisites', content);
  };

  const handleUpdateMethods = (content: string) => {
    console.log('Update methods:', content);
    updateFormField('methods', content);
  };

  const handleUpdatePriceHT = (value: number) => {
    console.log('Update price HT:', value);
    updateFormField('price_ht', value);
  };

  const handleUpdateVATPercentage = (value: number) => {
    console.log('Update VAT percentage:', value);
    updateFormField('vat_percentage', value);
  };

  const handleAddAdditionalFee = (initialData?: { name: string; amount: number; description: string }) => {
    console.log('Adding new additional fee...', initialData);
    createAdditionalFee({
      name: initialData?.name || 'Nouvelle taxe',
      amount: initialData?.amount || 0,
      description: initialData?.description || '',
      order_index: additionalFees.length + 1
    });
  };

  const handleUpdateAdditionalFee = (id: string, field: string, value: any) => {
    console.log('Updating additional fee:', id, field, value);
    const fee = additionalFees.find(f => f.uuid === id);
    if (fee) {
      // Convert field names to match API expectations
      const apiField = field === 'order' ? 'order_index' : field;
      updateAdditionalFee(fee.uuid, { [apiField]: value });
    }
  };

  const handleRemoveAdditionalFee = (id: string) => {
    console.log('Removing additional fee:', id);
    const fee = additionalFees.find(f => f.uuid === id);
    if (fee) {
      deleteAdditionalFee(fee.uuid);
    }
  };

  const handleUpdateSpecifics = (content: string) => {
    console.log('Update specifics:', content);
    updateFormField('specifics', content);
  };

  // Validation function to check if step is complete
  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        // Step 1 requires: title, description, category, modules AND objectives
        return formData.title && formData.title.trim() !== '' && 
               formData.description && formData.description.trim() !== '' &&
               formData.category_id !== null &&
               modules.length > 0 &&         // Au moins 1 module
               objectives.length > 0;        // Au moins 1 objectif
      case 2:
        return true; // Content is optional (can be added later)
      case 3:
        return true; // Documents are optional
      case 4:
        return true; // Questionnaires are optional
      case 5:
        return true; // Trainers are optional
      case 6:
        return true; // Workflow is optional
      default:
        return false;
    }
  };

  // Navigation handlers with validation
  const handleNextStep = async () => {
    if (currentStep < 6) {
      if (isStepComplete(currentStep)) {
        setCurrentStep(currentStep + 1);
      } else {
        // Message personnalisé selon l'étape
        if (currentStep === 1) {
          if (modules.length === 0 || objectives.length === 0) {
            showWarning(
              'Informations manquantes',
              `Veuillez ajouter au moins ${modules.length === 0 ? '1 module' : ''} ${modules.length === 0 && objectives.length === 0 ? 'et ' : ''}${objectives.length === 0 ? '1 objectif pédagogique' : ''} avant de continuer.`
            );
          } else {
            showWarning(
              t('courseCreation.validation.stepIncomplete'),
              'Veuillez remplir le titre, la description et sélectionner une catégorie.'
            );
          }
      } else {
        showWarning(
          t('courseCreation.validation.stepIncomplete'),
          t('courseCreation.validation.stepIncompleteMessage') || 'Veuillez remplir tous les champs requis avant de continuer.'
        );
        }
      }
    } else if (currentStep === 6) {
      // Handle course completion
      try {
        const updated = await updateCourseStatus('active');
        if (updated) {
          showSuccess(t('course.completedSuccessfully'));
          // Optionally redirect to course management or dashboard
          // You can add navigation logic here
        }
      } catch (error: any) {
        console.error('Failed to complete course:', error);
        showError(t('course.completionError'));
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= currentStep || isStepComplete(stepNumber - 1)) {
      setCurrentStep(stepNumber);
      // Scroll to the corresponding section
      const sectionElement = document.querySelector(`[data-section-id="${stepNumber}"]`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      showError(
        t('courseCreation.validation.previousStepsIncomplete'),
        t('courseCreation.validation.previousStepsIncompleteMessage') || 'Veuillez compléter les étapes précédentes avant d\'accéder à cette étape.'
      );
    }
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Transform formData to match header expectations
  const headerFormData = {
    title: formData.title || '',
    subtitle: formData.subtitle || '',
    description: formData.description || '',
    category_id: formData.category_id,
    course_language_id: formData.course_language_id,
    difficulty_level_id: formData.difficulty_level_id,
    price_ht: formData.price || 0,
    vat_percentage: 20, // Default value
    additional_fees: [], // Not in context formData
    duration: formData.duration || 0,
    duration_days: formData.duration_days || 0,
    target_audience: formData.target_audience || '',
    prerequisites: formData.prerequisites || '',
    tags: formData.tags || []
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <CourseCreationHeader
            currentStep={currentStep}
            totalSteps={6}
            onStepClick={handleStepClick}
            onAutoSave={handleAutoSave}
            onSaveDraft={handleSaveDraft}
        isAutoSaving={isSaving}
        isSavingDraft={isSaving}
        formData={headerFormData}
      />
      
      <main className="w-full flex justify-center pb-7 px-4">
        <div className="w-full max-w-[1396px] space-y-6">
          {/* Render content based on current step */}
          {currentStep === 1 && (
            <>
            <CourseInformationForm
              formData={transformedFormData}
              categories={categories}
              subcategories={subcategories}
              onInputChange={handleInputChange}
              onFileUpload={handleFileUpload}
              onFileUrlUpdate={handleFileUrlUpdate}
              uploadIntroVideo={uploadIntroVideo}
              uploadIntroImage={uploadIntroImage}
              onCategoryCreated={loadCategories}
              onSubcategoryCreated={() => {
                if (formData.category_id) {
                  loadSubcategories(formData.category_id);
                }
              }}
            />

              <CollapsibleSections
                sections={[]}
                onSectionClick={() => {
                  // Just toggle sections, don't change steps
                  // The sections should stay in Step 1
                }}
                modules={collapsibleSectionsData.modules}
                objectives={collapsibleSectionsData.objectives}
                targetAudience={collapsibleSectionsData.targetAudience}
                prerequisites={collapsibleSectionsData.prerequisites}
                methods={collapsibleSectionsData.methods}
                priceHT={collapsibleSectionsData.priceHT}
                vatPercentage={collapsibleSectionsData.vatPercentage}
                additionalFees={collapsibleSectionsData.additionalFees}
                specifics={collapsibleSectionsData.specifics}
                onAddModule={handleAddModule}
                onUpdateModule={handleUpdateModule}
                onRemoveModule={handleRemoveModule}
                onReorderModules={handleReorderModules}
                onAddObjective={handleAddObjective}
                onUpdateObjective={handleUpdateObjective}
                onRemoveObjective={handleRemoveObjective}
                onUpdateTargetAudience={handleUpdateTargetAudience}
                onUpdatePrerequisites={handleUpdatePrerequisites}
                onUpdateMethods={handleUpdateMethods}
                onUpdatePriceHT={handleUpdatePriceHT}
                onUpdateVATPercentage={handleUpdateVATPercentage}
                onAddAdditionalFee={handleAddAdditionalFee}
                onUpdateAdditionalFee={handleUpdateAdditionalFee}
                onRemoveAdditionalFee={handleRemoveAdditionalFee}
                onUpdateSpecifics={handleUpdateSpecifics}
                evaluationModalities={collapsibleSectionsData.evaluationModalities}
                accessModalities={collapsibleSectionsData.accessModalities}
                accessibility={collapsibleSectionsData.accessibility}
                contacts={collapsibleSectionsData.contacts}
                updateDate={collapsibleSectionsData.updateDate}
                onUpdateEvaluationModalities={(content) => updateFormField('evaluation_modalities', content)}
                onUpdateAccessModalities={(content) => updateFormField('access_modalities', content)}
                onUpdateAccessibility={(content) => updateFormField('accessibility', content)}
                onUpdateContacts={(content) => updateFormField('contacts', content)}
                onUpdateUpdateDate={(content) => updateFormField('update_date', content)}
                    />
            </>
          )}
          
          {currentStep === 2 && <Step2Contenu />}
          {currentStep === 3 && <Step3DocumentsNew />}
          {currentStep === 4 && <Step4QuestionnaireNew />}
          {currentStep === 5 && <Step5FormateurNew />}
          {currentStep === 6 && <Step6WorkflowNew />}
          
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
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                currentStep === 6
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'text-white'
              }`}
              style={{ 
                backgroundColor: currentStep === 6 ? '#16a34a' : (organization?.primary_color || '#0066FF'),
                color: 'white',
                fontSize: '16px',
                padding: '12px 32px'
              }}
            >
              {currentStep === 6 ? 'Soumettre' : t('common.next')}
            </button>
                      </div>
                    </div>
        </main>
        </div>
  );
};

export const CourseCreation: React.FC = () => {
  return (
    <DashboardLayout>
      <CourseCreationProvider>
        <CourseCreationContent
          courseUuid={undefined}
          onCourseCreated={(uuid) => {
            console.log('Course created:', uuid);
            // Handle course creation success
          }}
          onCourseSaved={() => {
            console.log('Course saved');
            // Handle course save success
          }}
        />
      </CourseCreationProvider>
    </DashboardLayout>
  );
};
