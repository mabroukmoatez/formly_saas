import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSessionCreation } from '../../contexts/SessionCreationContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChapterItem } from './ChapterItem';
import { SubChapterItem } from './SubChapterItem';
import { ChapterExpandedContent } from './ChapterExpandedContent';
import { SubChapterExpandedContent } from './SubChapterExpandedContent';
import { ChapterHeader, EmptyChaptersState } from './ChapterHeader';
import { QuizSelectionModal } from '../CourseCreation/QuizSelectionModal';
import { AddChapterModal } from '../CourseCreation/AddChapterModal';
import { AddBlockModal } from '../CourseCreation/AddBlockModal';
import { DeleteConfirmationModal } from '../CourseCreation/DeleteConfirmationModal';
import { InheritedBanner, SectionOverrideHeader } from './OverrideIndicator';
import { courseCreation } from '../../services/courseCreation';
import { CourseSection } from '../../services/courseCreation.types';

interface ContentItem {
  id: string;
  type: 'video' | 'text' | 'image';
  title: string | null;
  content: string | null;
  file: string | File | null;
  order: number;
}

interface SubChapter {
  id: string;
  title: string;
  content: ContentItem[];
  evaluations: any[];
  supportFiles: any[];
  isExpanded: boolean;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  content: ContentItem[];
  subChapters: SubChapter[];
  supportFiles: any[];
  evaluations: any[];
  quizzes?: any[];
  quiz_assignments?: any[];
  isExpanded: boolean;
  order: number;
  course_section_id?: number | null;
  section?: CourseSection | null;
}

interface Step2ContenuProps {
  onProgressChange?: (progress: number) => void;
}

interface DraggedItem {
  id: string;
  type: 'chapter' | 'subchapter' | 'content';
  chapterId?: string;
  subChapterId?: string;
}

export const Step2Contenu: React.FC<Step2ContenuProps> = ({ onProgressChange }) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  
  // Use SessionCreationContext
  const {
    chapters: contextChapters,
    formData,
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    createSubChapterAdapter,
    updateSubChapterAdapter,
    deleteSubChapterAdapter,
    createContentAdapter,
    updateContent,
    deleteContent,
    createEvaluationAdapter,
    uploadSupportFilesAdapter,
    deleteSupportFile,
    // Override system
    isSessionMode,
    hasChaptersOverride,
    courseTemplate,
    resetChaptersToTemplate,
  } = useSessionCreation();

  // Sections state
  const [sections, setSections] = useState<CourseSection[]>([]);

  // Local state for UI management
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  
  // Use refs for timeouts to avoid memory leaks
  const chapterUpdateTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const subChapterUpdateTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // State for expanded content sections
  const [chapterCollapsedSections, setChapterCollapsedSections] = useState<Record<string, boolean>>({});
  const [subChapterCollapsedSections, setSubChapterCollapsedSections] = useState<Record<string, boolean>>({});
  const [chapterEvaluationEditors, setChapterEvaluationEditors] = useState<Record<string, boolean>>({});
  const [subChapterEvaluationEditors, setSubChapterEvaluationEditors] = useState<Record<string, boolean>>({});
  
  // Quiz selection modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizModalTarget, setQuizModalTarget] = useState<{ chapterId: string; subChapterId?: string } | null>(null);

  // Chapter creation modal state
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterModalSectionId, setChapterModalSectionId] = useState<number | undefined>(undefined);

  // Block creation modal state
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    type: 'quiz' | 'block' | 'chapter' | 'subchapter';
    onConfirm: () => void;
    itemName?: string;
  } | null>(null);

  // State to track which evaluation type to open when chapter expands
  const [pendingEvaluationType, setPendingEvaluationType] = useState<{ [chapterId: string]: 'devoir' | 'examen' }>({});

  // Section UI state
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});

  // Load chapters and sections on component mount
  // Use courseUuid for all COURSE content operations
  useEffect(() => {
    const loadChaptersData = async () => {
      console.log('[Step2Contenu] Loading chapters for courseUuid:', formData.courseUuid);
      try {
        await loadChapters();
        console.log('[Step2Contenu] Chapters loaded successfully');
        // Load sections if courseUuid is available (content is from COURSE)
        if (formData.courseUuid) {
          await loadSectionsData();
          console.log('[Step2Contenu] Sections loaded successfully');
        }
      } catch (error) {
        console.error('[Step2Contenu] Error loading chapters:', error);
      }
    };
    
    if (formData.courseUuid) {
    loadChaptersData();
    } else {
      console.log('[Step2Contenu] No courseUuid yet, waiting...');
    }
  }, [loadChapters, formData.courseUuid]);

  // Load sections from COURSE API (not session API)
  const loadSectionsData = async () => {
    if (!formData.courseUuid) return;
    
    try {
      const response: any = await courseCreation.getSections(formData.courseUuid);
      if (response.success && response.data) {
        setSections(response.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  // Initialize collapsed sections state when sections change
  useEffect(() => {
    setCollapsedSections((prev) => {
      const next: Record<number, boolean> = {};
      sections.forEach((section) => {
        // Nouveau block ? Ouvert par défaut (false = ouvert)
        next[section.id] = prev[section.id] ?? false;
      });
      return next;
    });
  }, [sections]);

  // Section handlers - Use COURSE API (not session API)
  const handleCreateSection = async (data: any) => {
    if (!formData.courseUuid) return;
    
    try {
      const response: any = await courseCreation.createSection(formData.courseUuid, data);
      if (response.success && response.data) {
        setSections(prev => [...prev, response.data]);
        // Expand the newly created section
        setCollapsedSections(prev => ({ ...prev, [response.data.id]: false }));
      }
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  };

  const handleUpdateSection = async (sectionId: number, data: any) => {
    if (!formData.courseUuid) return;
    
    try {
      const response: any = await courseCreation.updateSection(formData.courseUuid, sectionId, data);
      if (response.success) {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...data } : s));
      }
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!formData.courseUuid) return;
    
    try {
      await courseCreation.deleteSection(formData.courseUuid!, sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      // Clean up collapsed state
      setCollapsedSections(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  };

  // Convert context chapters to local format
  useEffect(() => {
    console.log('[Step2Contenu] contextChapters changed:', {
      count: contextChapters?.length || 0,
      courseUuid: formData.courseUuid,
      contextChapters
    });
    
    if (!contextChapters || contextChapters.length === 0) {
      console.log('[Step2Contenu] No chapters in context, skipping conversion');
      return;
    }

    // Handle both snake_case (API) and camelCase (existing) naming conventions
    const convertedChapters: Chapter[] = contextChapters.map((chapter: any) => {
      // Support both naming conventions: sub_chapters (API) and subChapters (existing)
      const subChaptersArray = chapter.sub_chapters || chapter.subChapters || [];
      // Support both naming conventions: support_files (API) and supportFiles (existing)
      const supportFilesArray = chapter.support_files || chapter.supportFiles || [];
      
      return {
      id: chapter.uuid || chapter.id,
      title: chapter.title || '',
      content: Array.isArray(chapter.content) ? chapter.content.map((item: any) => ({
        ...item,
        id: item.uuid || item.id,
          type: item.type || 'text',
          title: item.title || null,
          content: item.content || null,
        url: item.file_url || item.url,
          file: item.file || null,
          order: item.order || item.order_index || 0
      })) : [],
        subChapters: Array.isArray(subChaptersArray) ? subChaptersArray.map((subChapter: any) => {
          const subChapterSupportFiles = subChapter.support_files || subChapter.supportFiles || [];
          return {
        ...subChapter,
        id: subChapter.uuid || subChapter.id,
        content: Array.isArray(subChapter.content) ? subChapter.content.map((item: any) => ({
          ...item,
          id: item.uuid || item.id,
              type: item.type || 'text',
              title: item.title || null,
              content: item.content || null,
          url: item.file_url || item.url,
              file: item.file || null,
              order: item.order || item.order_index || 0
        })) : [],
        evaluations: Array.isArray(subChapter.evaluations) ? subChapter.evaluations.map((evaluation: any) => ({
          ...evaluation,
          id: evaluation.uuid || evaluation.id
        })) : [],
            supportFiles: Array.isArray(subChapterSupportFiles) ? subChapterSupportFiles.map((file: any) => ({
          ...file,
          id: file.uuid || file.id,
              url: file.file_url || file.url,
              name: file.name || file.file_name || 'File',
              type: file.type || 'application/octet-stream',
              size: file.size || file.file_size || 0
      })) : [],
            isExpanded: subChapter.isExpanded || false,
            order: subChapter.order ?? subChapter.order_index ?? 0
          };
        }) : [],
        supportFiles: Array.isArray(supportFilesArray) ? supportFilesArray.map((file: any) => ({
        ...file,
        id: file.uuid || file.id,
          url: file.file_url || file.url,
          name: file.name || file.file_name || 'File',
          type: file.type || 'application/octet-stream',
          size: file.size || file.file_size || 0
      })) : [],
      evaluations: Array.isArray(chapter.evaluations) ? chapter.evaluations.map((evaluation: any) => ({
        ...evaluation,
          id: evaluation.uuid || evaluation.id,
          type: evaluation.type || 'devoir',
          title: evaluation.title || '',
          description: evaluation.description || '',
          due_date: evaluation.due_date || null,
          file_url: evaluation.file_url || null
      })) : [],
      quizzes: Array.isArray(chapter.quizzes) ? chapter.quizzes : Array.isArray(chapter.quiz_assignments) ? chapter.quiz_assignments : [],
      isExpanded: chapter.isExpanded || false,
      order: chapter.order ?? chapter.order_index ?? 0,
      course_section_id: chapter.course_section_id ?? chapter.section_id ?? chapter.course_section?.id ?? null,
      section: chapter.section ?? chapter.course_section ?? null,
      };
    });
    
    console.log('[Step2Contenu] Converted chapters:', convertedChapters.map(c => ({
      title: c.title,
      contentCount: c.content.length,
      evaluationsCount: c.evaluations.length,
      supportFilesCount: c.supportFiles.length,
      subChaptersCount: c.subChapters.length
    })));
    
    setChapters(prev => {
      // If no local chapters exist, use context data
      if (prev.length === 0) {
        return convertedChapters;
      }
      
      // Merge context data with local data
      const hasPendingUpdates = (chapterId: string) => {
        return !!chapterUpdateTimeoutsRef.current[chapterId];
      };

      const hasPendingSubChapterUpdates = (subChapterId: string) => {
        return !!subChapterUpdateTimeoutsRef.current[subChapterId];
      };

      return prev.map(localChapter => {
        const contextChapter = convertedChapters.find(c => c.id === localChapter.id);
        
        if (!contextChapter) {
          return localChapter;
        }

        // Skip update if there are pending changes
        if (hasPendingUpdates(localChapter.id)) {
          return localChapter;
        }

        // Merge sub-chapters
        const mergedSubChapters = contextChapter.subChapters.map(contextSubChapter => {
          const localSubChapter = localChapter.subChapters.find(sc => sc.id === contextSubChapter.id);
          
          if (!localSubChapter) {
            return contextSubChapter;
          }

          // Skip update if there are pending changes
          if (hasPendingSubChapterUpdates(localSubChapter.id)) {
            return localSubChapter;
          }

          return {
            ...contextSubChapter,
            isExpanded: localSubChapter.isExpanded,
          };
        }).concat(
          // Add any local sub-chapters that don't exist in context
          localChapter.subChapters.filter(
            localSub => !contextChapter.subChapters.find(sc => sc.id === localSub.id)
          )
        );

        return {
          ...contextChapter,
          isExpanded: localChapter.isExpanded,
          subChapters: mergedSubChapters,
        };
      }).concat(
        // Add any context chapters that don't exist locally
        convertedChapters.filter(
          contextChapter => !prev.find(c => c.id === contextChapter.id)
        )
      );
    });
  }, [contextChapters]);

  // Calculate progress
  const calculateProgress = useCallback(() => {
    if (chapters.length === 0) return 0;
    
    let totalSections = 0;
    let completedSections = 0;
    
    chapters.forEach(chapter => {
      totalSections++;
      if (chapter.title.trim().length > 0) {
        completedSections++;
      }
      
      chapter.subChapters.forEach(subChapter => {
        totalSections++;
        if (subChapter.title.trim().length > 0) {
          completedSections++;
        }
        
        subChapter.content.forEach(content => {
          totalSections++;
          if (content.title && content.title.trim().length > 0) {
            completedSections++;
          }
        });
      });
    });
    
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  }, [chapters]);

  // Update progress when chapters change
  useEffect(() => {
    const newProgress = calculateProgress();
    onProgressChange?.(newProgress);
  }, [calculateProgress, onProgressChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(chapterUpdateTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      Object.values(subChapterUpdateTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Chapter management - Open modal
  const handleAddChapter = (sectionId?: number) => {
    setChapterModalSectionId(sectionId);
    setShowChapterModal(true);
  };

  // Chapter creation - Called from modal (use COURSE API)
  const handleConfirmChapter = async (title: string) => {
    if (!formData.courseUuid) return;
    try {
      const sectionId = chapterModalSectionId;
      if (sectionId !== undefined) {
        const sectionChapters = chapters.filter(chapter => chapter.course_section_id === sectionId);
        
        const chapterData = {
          course_section_id: Number(sectionId), // Force conversion to number
          title: title || `Chapitre ${sectionChapters.length + 1}`,
          description: '',
          order: sectionChapters.length,
        };
        
        const response: any = await courseCreation.createChapter(formData.courseUuid!, chapterData as any);
        
        if (!response?.data?.course_section_id) {
          console.error('⚠️ PROBLÈME: Le backend a retourné un chapitre SANS course_section_id !');
        }
        
        // Expand the section to show the new chapter
        setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
        
        // Verify the chapter was created with correct section_id
        if (response?.data) {
          const createdChapterUuid = response.data.uuid || response.data.id;
          
          // If the response doesn't have course_section_id, update it manually
          if (!response.data.course_section_id && sectionId) {
            try {
              await courseCreation.updateChapter(formData.courseUuid!, createdChapterUuid, {
                course_section_id: sectionId
              } as any);
              // Reload to get updated data
              await loadChapters();
              await loadSectionsData();
            } catch (updateError) {
              console.error('❌ Error updating chapter section_id:', updateError);
            }
          } else {
            // Add the chapter directly to local state to avoid delay
            const newChapterLocal: Chapter = {
              id: response.data.uuid,
              title: response.data.title,
              content: [],
              subChapters: [],
              supportFiles: [],
              evaluations: [],
              quizzes: [],
              isExpanded: true,
              order: response.data.order_index || 0,
              course_section_id: response.data.course_section_id,
              section: response.data.section || null,
            };
            
            setChapters(prev => [...prev, newChapterLocal]);
          }
        }
        
        // Reload chapters and sections to ensure consistency
        await loadChapters();
        await loadSectionsData();
        
        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));

      } else {
        const chapterNumber = chapters.length + 1;
        const success = await createChapter({
          title: title || `Chapitre ${chapterNumber}`,
          description: '',
          order_index: chapterNumber,
        } as any);
        if (success) {
          // Reload chapters to get the actual UUID from the backend
          await loadChapters();
        }
      }
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  };

  const handleChapterTitleChange = async (chapterId: string, title: string) => {
    // Update local state immediately
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId ? { ...chapter, title } : chapter
    ));
    
    // Clear existing timeout
    if (chapterUpdateTimeoutsRef.current[chapterId]) {
      clearTimeout(chapterUpdateTimeoutsRef.current[chapterId]);
    }
    
    // Set new timeout
    chapterUpdateTimeoutsRef.current[chapterId] = setTimeout(async () => {
      try {
        await updateChapter(chapterId, { title });
        delete chapterUpdateTimeoutsRef.current[chapterId];
        await loadChapters();
      } catch (error) {
        console.error('Error updating chapter title:', error);
        delete chapterUpdateTimeoutsRef.current[chapterId];
      }
    }, 1000);
  };

  const handleToggleChapterExpanded = (chapterId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId ? { ...chapter, isExpanded: !chapter.isExpanded } : chapter
    ));
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    setDeleteModalConfig({
      type: 'chapter',
      onConfirm: async () => {
        try {
          await deleteChapter(chapterId);
          setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
        } catch (error) {
          console.error('Error deleting chapter:', error);
        }
      },
      itemName: chapter?.title,
    });
    setShowDeleteModal(true);
  };

  // SubChapter management
  const handleAddSubChapter = async (chapterId: string) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const subChapterNumber = chapter ? chapter.subChapters.length + 1 : 1;
      
      await createSubChapterAdapter(chapterId, {
        title: `Sous-chapitre ${subChapterNumber}`,
        description: '',
        order: subChapterNumber
      });
      
      await loadChapters();
    } catch (error) {
      console.error('Error adding sub-chapter:', error);
    }
  };

  const handleSubChapterTitleChange = async (chapterId: string, subChapterId: string, title: string) => {
    // Update local state immediately
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            subChapters: chapter.subChapters.map(subChapter =>
              subChapter.id === subChapterId ? { ...subChapter, title } : subChapter
            )
          }
        : chapter
    ));
    
    // Clear existing timeout
    if (subChapterUpdateTimeoutsRef.current[subChapterId]) {
      clearTimeout(subChapterUpdateTimeoutsRef.current[subChapterId]);
    }
    
    // Set new timeout
    subChapterUpdateTimeoutsRef.current[subChapterId] = setTimeout(async () => {
      try {
        await updateSubChapterAdapter(chapterId, subChapterId, { title });
        delete subChapterUpdateTimeoutsRef.current[subChapterId];
        await loadChapters();
      } catch (error) {
        console.error('Error updating sub-chapter title:', error);
        delete subChapterUpdateTimeoutsRef.current[subChapterId];
      }
    }, 1000);
  };

  const handleToggleSubChapterExpanded = (chapterId: string, subChapterId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            subChapters: chapter.subChapters.map(subChapter =>
              subChapter.id === subChapterId ? { ...subChapter, isExpanded: !subChapter.isExpanded } : subChapter
            )
          }
        : chapter
    ));
  };

  const handleDeleteSubChapter = async (chapterId: string, subChapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const subChapter = chapter?.subChapters.find(sc => sc.id === subChapterId);
    setDeleteModalConfig({
      type: 'subchapter',
      onConfirm: async () => {
        try {
          await deleteSubChapterAdapter(chapterId, subChapterId);
          setChapters(prev => prev.map(chapter => 
            chapter.id === chapterId 
              ? {
                  ...chapter,
                  subChapters: chapter.subChapters.filter(subChapter => subChapter.id !== subChapterId)
                }
              : chapter
          ));
        } catch (error) {
          console.error('Error deleting sub-chapter:', error);
        }
      },
      itemName: subChapter?.title,
    });
    setShowDeleteModal(true);
  };

  // Content management
  const handleContentTitleChange = async (chapterId: string, subChapterId: string, contentId: string, title: string) => {
    // Update local state immediately
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            subChapters: chapter.subChapters.map(subChapter =>
              subChapter.id === subChapterId 
                ? {
                    ...subChapter,
                    content: subChapter.content.map(content =>
                      content.id === contentId ? { ...content, title } : content
                    )
                  }
                : subChapter
            )
          }
        : chapter
    ));
    
    try {
      await updateContent(chapterId, contentId, { title });
      await loadChapters();
    } catch (error) {
      console.error('Error updating content title:', error);
      await loadChapters();
    }
  };

  const handleChapterContentTitleChange = async (chapterId: string, contentId: string, title: string) => {
    // Update local state immediately
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            content: chapter.content.map(content =>
              content.id === contentId ? { ...content, title } : content
            )
          }
        : chapter
    ));
    
    try {
      await updateContent(chapterId, contentId, { title });
      await loadChapters();
    } catch (error) {
      console.error('Error updating chapter content title:', error);
      await loadChapters();
    }
  };

  // Helper functions for section state
  const toggleChapterSection = (chapterId: string, sectionKey: string) => {
    const key = `${chapterId}_${sectionKey}`;
    setChapterCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isChapterSectionCollapsed = (chapterId: string, sectionKey: string) => {
    const key = `${chapterId}_${sectionKey}`;
    return chapterCollapsedSections[key] || false;
  };

  const toggleSubChapterSection = (subChapterId: string, sectionKey: string) => {
    const key = `${subChapterId}_${sectionKey}`;
    setSubChapterCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSubChapterSectionCollapsed = (subChapterId: string, sectionKey: string) => {
    const key = `${subChapterId}_${sectionKey}`;
    return subChapterCollapsedSections[key] || false;
  };

  const toggleChapterEvaluationEditor = (chapterId: string) => {
    setChapterEvaluationEditors(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const isChapterEvaluationEditorOpen = (chapterId: string) => {
    return chapterEvaluationEditors[chapterId] || false;
  };

  const toggleSubChapterEvaluationEditor = (subChapterId: string) => {
    setSubChapterEvaluationEditors(prev => ({
      ...prev,
      [subChapterId]: !prev[subChapterId]
    }));
  };

  const isSubChapterEvaluationEditorOpen = (subChapterId: string) => {
    return subChapterEvaluationEditors[subChapterId] || false;
  };

  // Chapter content handlers
  const handleAddChapterContent = async (chapterId: string, type: 'text' | 'video' | 'image', file?: File) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const contentNumber = chapter ? chapter.content.length + 1 : 1;
      
      const contentData: any = {
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        order: contentNumber,
        sub_chapter_id: null
      };

      if (file) {
        contentData.file = file;
      }

      await createContentAdapter(chapterId, contentData);
      await loadChapters();
    } catch (error) {
      console.error('Error adding chapter content:', error);
    }
  };

  const handleUpdateChapterContent = async (chapterId: string, contentId: string, updates: { title?: string; content?: string }) => {
    // Update local state immediately
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            content: chapter.content.map(content =>
              content.id === contentId ? { ...content, ...updates } : content
            )
          }
        : chapter
    ));
    
    try {
      await updateContent(chapterId, contentId, updates);
      await loadChapters();
    } catch (error) {
      console.error('Error updating chapter content:', error);
      await loadChapters();
    }
  };

  const handleDeleteChapterContent = async (chapterId: string, contentId: string) => {
    try {
      await deleteContent(chapterId, contentId);
      await loadChapters();
    } catch (error) {
      console.error('Error deleting chapter content:', error);
    }
  };

  // Sub-chapter content handlers
  const handleAddSubChapterContent = async (chapterId: string, subChapterId: string, type: 'text' | 'video' | 'image', file?: File) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const subChapter = chapter?.subChapters.find(sc => sc.id === subChapterId);
      const contentNumber = subChapter ? subChapter.content.length + 1 : 1;
      
      const contentData: any = {
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        order: contentNumber,
        sub_chapter_id: subChapterId
      };

      if (file) {
        contentData.file = file;
      }

      await createContentAdapter(chapterId, contentData);
      await loadChapters();
    } catch (error) {
      console.error('Error adding sub-chapter content:', error);
    }
  };

  const handleUpdateSubChapterContent = async (chapterId: string, subChapterId: string, contentId: string, updates: { title?: string; content?: string }) => {
    // Update local state immediately
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            subChapters: chapter.subChapters.map(subChapter =>
              subChapter.id === subChapterId 
                ? {
                    ...subChapter,
                    content: subChapter.content.map(content =>
                      content.id === contentId ? { ...content, ...updates } : content
                    )
                  }
                : subChapter
            )
          }
        : chapter
    ));
    
    try {
      await updateContent(chapterId, contentId, updates);
      await loadChapters();
    } catch (error) {
      console.error('Error updating sub-chapter content:', error);
      await loadChapters();
    }
  };

  const handleDeleteSubChapterContent = async (chapterId: string, _subChapterId: string, contentId: string) => {
    try {
      await deleteContent(chapterId, contentId);
      await loadChapters();
    } catch (error) {
      console.error('Error deleting sub-chapter content:', error);
    }
  };

  // Evaluation handlers
  const handleAddEvaluation = async (chapterId: string, type: 'devoir' | 'examen', data: any) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      await createEvaluationAdapter(chapterId, {
        type,
        title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} ${chapter ? chapter.evaluations.length + 1 : 1}`,
        description: data.description || '',
        due_date: data.dueDate || null,
        file: data.file || null
      });
      await loadChapters();
    } catch (error) {
      console.error('Error adding evaluation:', error);
    }
  };

  const handleAddSubChapterEvaluation = async (chapterId: string, subChapterId: string, type: 'devoir' | 'examen', data: any) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const subChapter = chapter?.subChapters.find(sc => sc.id === subChapterId);
      
      await createEvaluationAdapter(chapterId, {
        type,
        title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} ${subChapter ? subChapter.evaluations.length + 1 : 1}`,
        description: data.description || '',
        due_date: data.dueDate || null,
        file: data.file || null,
        sub_chapter_id: subChapterId
      });
      await loadChapters();
    } catch (error) {
      console.error('Error adding sub-chapter evaluation:', error);
    }
  };

  const handleDeleteEvaluation = async (_chapterId: string, _evaluationId: string) => {
    try {
      // TODO: Implement delete evaluation API call
      await loadChapters();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  const handleUpdateEvaluation = async (_chapterId: string, _evaluationId: string, _data: any) => {
    try {
      // TODO: Implement update evaluation API call
      await loadChapters();
    } catch (error) {
      console.error('Error updating evaluation:', error);
    }
  };

  const handleDeleteSubChapterEvaluation = async (_chapterId: string, _subChapterId: string, _evaluationId: string) => {
    try {
      // TODO: Implement delete evaluation API call
      await loadChapters();
    } catch (error) {
      console.error('Error deleting sub-chapter evaluation:', error);
    }
  };

  const handleUpdateSubChapterEvaluation = async (_chapterId: string, _subChapterId: string, _evaluationId: string, _data: any) => {
    try {
      // TODO: Implement update evaluation API call
      await loadChapters();
    } catch (error) {
      console.error('Error updating sub-chapter evaluation:', error);
    }
  };

  // Support file handlers
  const handleAddSupportFile = async (chapterId: string, file: File) => {
    try {
      // Update local state immediately to show the uploaded file
      const fileObject = {
        id: `temp-${Date.now()}-${Math.random()}`,
        name: file.name,
        file_name: file.name,
        file: file,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      };
      
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              supportFiles: [...chapter.supportFiles, fileObject]
            }
          : chapter
      ));

      // Upload support file via API
      const success = await uploadSupportFilesAdapter([file], chapterId);
      if (success) {
        // Reload chapters to get the actual file data from backend
        await loadChapters();
      } else {
        // If upload failed, remove the temporary file from local state
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                supportFiles: chapter.supportFiles.filter(f => f.id !== fileObject.id)
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error uploading support file:', error);
      // Remove temporary file on error
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              supportFiles: chapter.supportFiles.filter(f => !f.id?.startsWith('temp-'))
            }
          : chapter
      ));
    }
  };

  const handleAddSubChapterSupportFile = async (chapterId: string, subChapterId: string, file: File) => {
    try {
      // Update local state immediately to show the uploaded file
      const fileObject = {
        id: `temp-${Date.now()}-${Math.random()}`,
        name: file.name,
        file_name: file.name,
        file: file,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      };
      
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              subChapters: chapter.subChapters.map(subChapter =>
                subChapter.id === subChapterId
                  ? {
                      ...subChapter,
                      supportFiles: [...subChapter.supportFiles, fileObject]
                    }
                  : subChapter
              )
            }
          : chapter
      ));

      // Upload support file via API
      const success = await uploadSupportFilesAdapter([file], chapterId, subChapterId);
      if (success) {
        // Reload chapters to get the actual file data from backend
        await loadChapters();
      } else {
        // If upload failed, remove the temporary file from local state
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                subChapters: chapter.subChapters.map(subChapter =>
                  subChapter.id === subChapterId
                    ? {
                        ...subChapter,
                        supportFiles: subChapter.supportFiles.filter(f => f.id !== fileObject.id)
                      }
                    : subChapter
                )
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error uploading sub-chapter support file:', error);
      // Remove temporary file on error
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              subChapters: chapter.subChapters.map(subChapter =>
                subChapter.id === subChapterId
                  ? {
                      ...subChapter,
                      supportFiles: subChapter.supportFiles.filter(f => !f.id?.startsWith('temp-'))
                    }
                  : subChapter
              )
            }
          : chapter
      ));
    }
  };

  const handleDeleteSupportFile = async (chapterId: string, fileId: string) => {
    try {
      await deleteSupportFile(chapterId, fileId);
      await loadChapters();
    } catch (error) {
      console.error('Error deleting support file:', error);
    }
  };

  const handleDeleteSubChapterSupportFile = async (chapterId: string, _subChapterId: string, fileId: string) => {
    try {
      await deleteSupportFile(chapterId, fileId);
      await loadChapters();
    } catch (error) {
      console.error('Error deleting sub-chapter support file:', error);
    }
  };

  // Quiz handlers
  const handleAddQuizToChapter = (chapterId: string, subChapterId?: string) => {
    setQuizModalTarget({ chapterId, subChapterId });
    setShowQuizModal(true);
  };

  const handleSelectQuiz = (_quizUuid: string, _quizTitle: string) => {
    setShowQuizModal(false);
    setQuizModalTarget(null);
    setTimeout(() => {
      loadChapters();
    }, 500);
  };

  // Drag and drop handlers
  const handleDragStart = (_e: React.DragEvent, item: DraggedItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverItem(id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };


  const toggleSectionCollapsed = (sectionId: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Block creation - Called from modal (use COURSE API)
  const handleConfirmBlock = async (title: string) => {
    if (!formData.courseUuid) return;
    try {
      await handleCreateSection({
        title: title || `Block ${sections.length + 1}`,
        order: sections.length,
        is_published: true
      });
      await loadSectionsData();
    } catch (error) {
      console.error('Error adding block:', error);
    }
  };

  // Open block modal
  const handleAddBlock = () => {
    setShowBlockModal(true);
  };

  // Helper functions
  const getChaptersForSection = (sectionId: number) =>
    chapters.filter(ch => ch.course_section_id === sectionId);

  const getOrphanChapters = () =>
    chapters.filter(ch => !ch.course_section_id);

  // Helper to get chapter UUID from chapter ID
  // In this context, chapter.id is already the UUID
  const getChapterUuid = (chapterId: string | undefined): string | null => {
    if (!chapterId || chapterId === 'undefined' || chapterId === 'null') {
      console.error('Invalid chapterId provided to getChapterUuid:', chapterId);
      return null;
    }
    // Find the chapter to ensure it exists and has a valid UUID
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) {
      console.error('Chapter not found for ID:', chapterId);
      return null;
    }
    return chapter.id; // The ID is already the UUID in this context
  };

  // Helper to get subchapter UUID from IDs
  // In this context, subChapter.id is already the UUID
  const getSubChapterUuid = (chapterId: string | undefined, subChapterId: string | undefined): string | null => {
    if (!subChapterId || subChapterId === 'undefined' || subChapterId === 'null') {
      console.error('Invalid subChapterId provided to getSubChapterUuid:', subChapterId);
      return null;
    }
    if (!chapterId || chapterId === 'undefined') {
      console.error('Invalid chapterId provided to getSubChapterUuid:', chapterId);
      return null;
    }
    // Find the chapter and subchapter to ensure they exist
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) {
      console.error('Chapter not found for ID:', chapterId);
      return null;
    }
    const subChapter = chapter.subChapters.find(sc => sc.id === subChapterId);
    if (!subChapter) {
      console.error('SubChapter not found for ID:', subChapterId);
      return null;
    }
    return subChapter.id; // The ID is already the UUID in this context
  };

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        
        {/* Session Mode Banner - Shows when chapters are inherited from course */}
        {isSessionMode && !hasChaptersOverride && courseTemplate && (
          <InheritedBanner 
            courseName={courseTemplate.title}
            isVisible={true}
            onCustomize={() => {
              // Any modification will trigger the override initialization
            }}
          />
        )}
        
        <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
          isDark ? 'bg-transparent border-gray-600' : 'bg-transparent border-[#dbd8d8]'
        }`}>
          <CardContent className="p-5 flex flex-col gap-6">
            {/* Section Header with Reset Button for Session Mode */}
            <SectionOverrideHeader
              title="Contenu du cours"
              description={isSessionMode && hasChaptersOverride ? "Chapitres personnalisés pour cette session" : undefined}
              hasOverrides={isSessionMode && hasChaptersOverride}
              onResetAll={isSessionMode ? resetChaptersToTemplate : undefined}
            />

            {sections.length === 0 ? (
              <div 
                className={`relative min-h-[400px] rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
              >
                {/* Blurred background image */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url('/assets/images/step2.png')`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'blur(2px)'
                  }}
                />
                {/* Overlay for better text readability */}
                <div className={`absolute inset-0 ${
                  isDark ? 'bg-black/50' : 'bg-white/70'
                }`} />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
                  <div className="text-center mb-8">
                    <h3 className={`text-lg font-medium mb-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      Aucun block pour le moment. Ajoutez-en un pour structurer vos chapitres.
                    </h3>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleAddBlock}
                      className="flex items-center gap-2 px-6 py-3"
                      style={{ 
                        backgroundColor: isDark ? 'rgba(147, 51, 234, 0.8)' : '#9333EA',
                        borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : '#C084FC',
                        color: '#FFFFFF'
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un Bloc
                    </Button>
                    <Button
                      onClick={() => handleAddChapter()}
                      className="flex items-center gap-2 px-6 py-3"
                      style={{ 
                        backgroundColor: primaryColor,
                        color: '#FFFFFF'
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un chapitre
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, index) => {
                  const sectionChapters = getChaptersForSection(section.id);
                  const isCollapsed = collapsedSections[section.id] ?? false;
                  
                  return (
                    <div
                      key={section.id}
                      className={`rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 items-center gap-3">
                          <button
                            onClick={() => toggleSectionCollapsed(section.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${isDark ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'}`}
                            aria-label={isCollapsed ? 'Déplier le block' : 'Replier le block'}
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Block {index + 1}
                          </span>
                          <Input
                            value={section.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSection(section.id, { title: e.target.value })}
                            className={`flex-1 font-semibold ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'}`}
                            placeholder="Nom du block"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{sectionChapters.length} chapitre{sectionChapters.length > 1 ? 's' : ''}</Badge>
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="rounded-md p-2 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
                            aria-label="Supprimer le block"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="border-t px-4 pb-4 pt-4">
                          <ChapterHeader onAddChapter={() => handleAddChapter(section.id)} className="mb-4" />

                          {sectionChapters.length === 0 ? (
                            <EmptyChaptersState className={`rounded-lg border border-dashed py-10 ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
                          ) : (
                            <div className="space-y-4">
                              {sectionChapters.map((chapter) => (
                                <ChapterItem
                                  key={chapter.id || `chapter-${chapter.order}`}
                                  chapter={chapter}
                                  isDragging={draggedItem?.id === chapter.id}
                                  isDragOver={dragOverItem === chapter.id}
                                  onTitleChange={handleChapterTitleChange}
                                  onToggleExpanded={handleToggleChapterExpanded}
                                  onDeleteChapter={handleDeleteChapter}
                                  onDragStart={handleDragStart}
                                  onDragOver={handleDragOver}
                                  onDragEnd={handleDragEnd}
                                  onAddQuiz={(chapterId: string) => handleAddQuizToChapter(chapterId)}
                                  onAddDevoir={(chapterId: string) => {
                                    // Set pending evaluation type and expand chapter
                                    setPendingEvaluationType(prev => ({ ...prev, [chapterId]: 'devoir' }));
                                    handleToggleChapterExpanded(chapterId);
                                  }}
                                  onAddExamin={(chapterId: string) => {
                                    // Set pending evaluation type and expand chapter
                                    setPendingEvaluationType(prev => ({ ...prev, [chapterId]: 'examen' }));
                                    handleToggleChapterExpanded(chapterId);
                                  }}
                                >
                                  <ChapterExpandedContent
                                    chapter={chapter}
                                    onAddContent={handleAddChapterContent}
                                    onUpdateContent={handleUpdateChapterContent}
                                    onAddEvaluation={handleAddEvaluation}
                                    onUpdateEvaluation={handleUpdateEvaluation}
                                    onAddQuiz={(chapterId) => handleAddQuizToChapter(chapterId)}
                                    onAddSubChapter={handleAddSubChapter}
                                    onAddDevoir={(chapterId: string) => {
                                      // Set pending evaluation type and open editor
                                      setPendingEvaluationType(prev => ({ ...prev, [chapterId]: 'devoir' }));
                                      toggleChapterEvaluationEditor(chapterId);
                                    }}
                                    onAddExamin={(chapterId: string) => {
                                      // Set pending evaluation type and open editor
                                      setPendingEvaluationType(prev => ({ ...prev, [chapterId]: 'examen' }));
                                      toggleChapterEvaluationEditor(chapterId);
                                    }}
                                    pendingEvaluationType={pendingEvaluationType[chapter.id] || null}
                                    onPendingEvaluationTypeHandled={() => {
                                      setPendingEvaluationType(prev => {
                                        const newState = { ...prev };
                                        delete newState[chapter.id];
                                        return newState;
                                      });
                                    }}
                                    onAddSupportFile={handleAddSupportFile}
                                    onDeleteContent={handleDeleteChapterContent}
                                    onDeleteEvaluation={handleDeleteEvaluation}
                                    onDeleteSupportFile={handleDeleteSupportFile}
                                    onTitleChange={handleChapterContentTitleChange}
                                    toggleSection={toggleChapterSection}
                                    isSectionCollapsed={isChapterSectionCollapsed}
                                    toggleEvaluationEditor={toggleChapterEvaluationEditor}
                                    isEvaluationEditorOpen={isChapterEvaluationEditorOpen}
                                  >
                                    {chapter.subChapters.map((subChapter) => (
                                      <SubChapterItem
                                        key={subChapter.id || `subchapter-${subChapter.order}`}
                                        subChapter={subChapter}
                                        chapterId={chapter.id}
                                        isDragging={draggedItem?.id === subChapter.id}
                                        isDragOver={dragOverItem === subChapter.id}
                                        onTitleChange={handleSubChapterTitleChange}
                                        onToggleExpanded={handleToggleSubChapterExpanded}
                                        onDeleteSubChapter={handleDeleteSubChapter}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragEnd={handleDragEnd}
                                      >
                                        <SubChapterExpandedContent
                                          subChapter={subChapter}
                                          chapterId={chapter.id}
                                          onAddContent={handleAddSubChapterContent}
                                          onUpdateContent={handleUpdateSubChapterContent}
                                          onAddEvaluation={handleAddSubChapterEvaluation}
                                          onUpdateEvaluation={handleUpdateSubChapterEvaluation}
                                          onAddQuiz={(chapterId: string, subChapterId: string) => handleAddQuizToChapter(chapterId, subChapterId)}
                                          onAddSupportFile={handleAddSubChapterSupportFile}
                                          onDeleteContent={handleDeleteSubChapterContent}
                                          onDeleteEvaluation={handleDeleteSubChapterEvaluation}
                                          onDeleteSupportFile={handleDeleteSubChapterSupportFile}
                                          onTitleChange={handleContentTitleChange}
                                          toggleSection={toggleSubChapterSection}
                                          isSectionCollapsed={isSubChapterSectionCollapsed}
                                          toggleEvaluationEditor={toggleSubChapterEvaluationEditor}
                                          isEvaluationEditorOpen={isSubChapterEvaluationEditorOpen}
                                        />
                                      </SubChapterItem>
                                    ))}
                                  </ChapterExpandedContent>
                                </ChapterItem>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Orphan Chapters (without section) */}
            {getOrphanChapters().length > 0 && (
              <div className={`rounded-xl border border-dashed ${isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-100/30'}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Chapitres sans block
                      </span>
                      <Badge variant="outline">{getOrphanChapters().length} chapitre{getOrphanChapters().length > 1 ? 's' : ''}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {getOrphanChapters().map((chapter) => (
                      <ChapterItem
                        key={chapter.id || `chapter-${chapter.order}`}
                        chapter={chapter}
                        isDragging={draggedItem?.id === chapter.id}
                        isDragOver={dragOverItem === chapter.id}
                        onTitleChange={handleChapterTitleChange}
                        onToggleExpanded={handleToggleChapterExpanded}
                        onDeleteChapter={handleDeleteChapter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                      >
                        <ChapterExpandedContent
                          chapter={chapter}
                          onAddContent={handleAddChapterContent}
                          onUpdateContent={handleUpdateChapterContent}
                          onAddEvaluation={handleAddEvaluation}
                          onUpdateEvaluation={handleUpdateEvaluation}
                          onAddQuiz={(chapterId: string) => handleAddQuizToChapter(chapterId)}
                          onAddDevoir={(chapterId: string) => {
                            toggleChapterEvaluationEditor(chapterId);
                          }}
                          onAddExamin={(chapterId: string) => {
                            toggleChapterEvaluationEditor(chapterId);
                          }}
                          pendingEvaluationType={pendingEvaluationType[chapter.id] || null}
                          onPendingEvaluationTypeHandled={() => {
                            setPendingEvaluationType(prev => {
                              const newState = { ...prev };
                              delete newState[chapter.id];
                              return newState;
                            });
                          }}
                          onAddSupportFile={handleAddSupportFile}
                          onDeleteContent={handleDeleteChapterContent}
                          onDeleteEvaluation={handleDeleteEvaluation}
                          onDeleteSupportFile={handleDeleteSupportFile}
                          onTitleChange={handleChapterContentTitleChange}
                          toggleSection={toggleChapterSection}
                          isSectionCollapsed={isChapterSectionCollapsed}
                          toggleEvaluationEditor={toggleChapterEvaluationEditor}
                          isEvaluationEditorOpen={isChapterEvaluationEditorOpen}
                        >
                          {chapter.subChapters.map((subChapter) => (
                            <SubChapterItem
                              key={subChapter.id || `subchapter-${subChapter.order}`}
                              subChapter={subChapter}
                              chapterId={chapter.id}
                              isDragging={draggedItem?.id === subChapter.id}
                              isDragOver={dragOverItem === subChapter.id}
                              onTitleChange={handleSubChapterTitleChange}
                              onToggleExpanded={handleToggleSubChapterExpanded}
                              onDeleteSubChapter={handleDeleteSubChapter}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDragEnd={handleDragEnd}
                            >
                              <SubChapterExpandedContent
                                subChapter={subChapter}
                                chapterId={chapter.id}
                                onAddContent={handleAddSubChapterContent}
                                onUpdateContent={handleUpdateSubChapterContent}
                                onAddEvaluation={handleAddSubChapterEvaluation}
                                onUpdateEvaluation={handleUpdateSubChapterEvaluation}
                                onAddQuiz={(chapterId, subChapterId) => handleAddQuizToChapter(chapterId, subChapterId)}
                                onAddSupportFile={handleAddSubChapterSupportFile}
                                onDeleteContent={handleDeleteSubChapterContent}
                                onDeleteEvaluation={handleDeleteSubChapterEvaluation}
                                onDeleteSupportFile={handleDeleteSubChapterSupportFile}
                                onTitleChange={handleContentTitleChange}
                                toggleSection={toggleSubChapterSection}
                                isSectionCollapsed={isSubChapterSectionCollapsed}
                                toggleEvaluationEditor={toggleSubChapterEvaluationEditor}
                                isEvaluationEditorOpen={isSubChapterEvaluationEditorOpen}
                              />
                            </SubChapterItem>
                          ))}
                        </ChapterExpandedContent>
                      </ChapterItem>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Only show "Add Block" button when there are already blocks */}
            {sections.length > 0 && (
              <button
                onClick={handleAddBlock}
                className={`w-full rounded-lg border-2 border-dashed p-4 text-sm font-medium transition ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-gray-200' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'}`}
              >
                <Plus className="mr-2 inline h-4 w-4" />
                Ajouter un block
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quiz Selection Modal - use courseUuid for course content */}
      {showQuizModal && quizModalTarget && formData.courseUuid && (
        <QuizSelectionModal
          isOpen={showQuizModal}
          onClose={() => {
            setShowQuizModal(false);
            setQuizModalTarget(null);
          }}
          onSelectQuiz={handleSelectQuiz}
          courseUuid={formData.courseUuid!}
          chapterUuid={quizModalTarget.subChapterId ? undefined : getChapterUuid(quizModalTarget.chapterId) || undefined}
          subChapterUuid={quizModalTarget.subChapterId ? (getSubChapterUuid(quizModalTarget.chapterId, quizModalTarget.subChapterId) || undefined) : undefined}
          isSession={false}
        />
      )}

      {/* Add Chapter Modal */}
      <AddChapterModal
        isOpen={showChapterModal}
        onClose={() => {
          setShowChapterModal(false);
          setChapterModalSectionId(undefined);
        }}
        onConfirm={handleConfirmChapter}
      />

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
        }}
        onConfirm={handleConfirmBlock}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteModalConfig && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteModalConfig(null);
          }}
          onConfirm={deleteModalConfig.onConfirm}
          type={deleteModalConfig.type}
          itemName={deleteModalConfig.itemName}
        />
      )}
    </section>
  );
};