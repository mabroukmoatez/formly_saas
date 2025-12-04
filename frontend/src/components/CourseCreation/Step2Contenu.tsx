import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCourseCreation } from '../../contexts/CourseCreationContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChapterItem } from './ChapterItem';
import { SubChapterItem } from './SubChapterItem';
import { ChapterExpandedContent } from './ChapterExpandedContent';
import { SubChapterExpandedContent } from './SubChapterExpandedContent';
import { ChapterHeader, EmptyChaptersState } from './ChapterHeader';
import { QuizSelectionModal } from './QuizSelectionModal';
import { AddChapterModal } from './AddChapterModal';
import { AddBlockModal } from './AddBlockModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
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
  quizzes?: any[]; // Quiz associations
  quiz_assignments?: any[]; // Alternative property name
  isExpanded: boolean;
  order: number;
  course_section_id?: number | null;
  section?: CourseSection | null;
}

interface Step2ContenuProps {
  onProgressChange?: (progress: number) => void;
}

export const Step2Contenu: React.FC<Step2ContenuProps> = ({ onProgressChange }) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  
  // Use CourseCreationContext
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
    updateContentAdapter,
    deleteContentAdapter,
    createEvaluationAdapter,
    updateEvaluationAdapter,
    deleteEvaluationAdapter,
    uploadSupportFilesAdapter,
    deleteSupportFileAdapter,
  } = useCourseCreation();

  // Blocks state (ALWAYS USED - no choice) - renamed from sections to blocks
  const [sections, setSections] = useState<CourseSection[]>([]); // Keep variable name for API compatibility, but UI shows "Blocks"

  // Local state for UI management
  const [draggedItem, setDraggedItem] = useState<{id: string, type: 'chapter' | 'subchapter' | 'content', chapterId?: string, subChapterId?: string} | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [chapterUpdateTimeouts, setChapterUpdateTimeouts] = useState<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const [subChapterUpdateTimeouts, setSubChapterUpdateTimeouts] = useState<{[key: string]: ReturnType<typeof setTimeout>}>({});
  
  // State for expanded content sections (persists across collapse/expand)
  const [chapterCollapsedSections, setChapterCollapsedSections] = useState<{[key: string]: boolean}>({});
  const [subChapterCollapsedSections, setSubChapterCollapsedSections] = useState<{[key: string]: boolean}>({});
  const [chapterEvaluationEditors, setChapterEvaluationEditors] = useState<{[key: string]: boolean}>({});
  const [subChapterEvaluationEditors, setSubChapterEvaluationEditors] = useState<{[key: string]: boolean}>({});
  // State to track which evaluation type to open when chapter expands
  const [pendingEvaluationType, setPendingEvaluationType] = useState<{[chapterId: string]: 'devoir' | 'examen'}>({});
  
  // Quiz selection modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizModalTarget, setQuizModalTarget] = useState<{chapterId: string; subChapterId?: string} | null>(null);
  
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

  // Convert context chapters to local format for compatibility
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Load chapters and sections on component mount
  useEffect(() => {
    const loadChaptersData = async () => {
      if (!formData.courseUuid) {
        console.log('⚠️ Step2Contenu: No courseUuid yet, skipping chapter load');
        return;
      }
      try {
        console.log('📖 Step2Contenu: Loading chapters for course:', formData.courseUuid);
        await loadChapters(formData.courseUuid);
        await loadSectionsData();
      } catch (error) {
        console.error('❌ Step2Contenu: Error loading chapters:', error);
      }
    };
    loadChaptersData();
  }, [loadChapters, formData.courseUuid]);

  // Load blocks (sections in API, but displayed as "Blocks" in UI)
  const loadSectionsData = async () => {
    try {
      const response: any = await courseCreation.getSections(formData.courseUuid!);
      if (response.success && response.data) {
        setSections(response.data);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
    }
  };

  // Block handlers (sections in API, but displayed as "Blocks" in UI)
  const handleCreateSection = async (data: any) => {
    try {
      const response: any = await courseCreation.createSection(formData.courseUuid!, data);
      if (response.success && response.data) {
        setSections(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error creating block:', error);
      throw error;
    }
  };

  const handleUpdateSection = async (sectionId: number, data: any) => {
    try {
      const response: any = await courseCreation.updateSection(formData.courseUuid!, sectionId, data);
      if (response.success) {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...data } : s));
      }
    } catch (error) {
      console.error('Error updating block:', error);
      throw error;
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    try {
      await courseCreation.deleteSection(formData.courseUuid!, sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
    } catch (error) {
      console.error('Error deleting block:', error);
      throw error;
    }
  };

  // Update local chapters when context chapters change
  useEffect(() => {
    if (contextChapters && contextChapters.length > 0) {
      console.log('📚 Context chapters received:', contextChapters);
      const convertedChapters: Chapter[] = contextChapters.map((chapter: any) => {
        // Handle both snake_case (API) and camelCase (frontend) property names
        const rawSubChapters = chapter.sub_chapters || chapter.subChapters || [];
        const rawContent = chapter.content || [];
        const rawSupportFiles = chapter.support_files || chapter.supportFiles || [];
        const rawEvaluations = chapter.evaluations || [];
        
        // Convert sub-chapters with their nested content
        const convertedSubChapters = rawSubChapters.map((sub: any) => ({
          id: sub.uuid || sub.id,
          title: sub.title || '',
          content: (sub.content || []).map((c: any) => ({
            id: c.uuid || c.id,
            type: c.type || 'text',
            title: c.title,
            content: c.content,
            file: c.file_url || c.file,
            order: c.order || c.order_index || 0,
          })),
          evaluations: sub.evaluations || [],
          supportFiles: sub.support_files || sub.supportFiles || [],
          isExpanded: sub.isExpanded || false,
          order: sub.order || sub.order_index || 0,
        }));
        
        // Convert content items
        const convertedContent = rawContent.map((c: any) => ({
          id: c.uuid || c.id,
          type: c.type || 'text',
          title: c.title,
          content: c.content,
          file: c.file_url || c.file,
          order: c.order || c.order_index || 0,
        }));
        
        console.log(`📖 Chapter ${chapter.title}: ${convertedContent.length} content items, ${convertedSubChapters.length} sub-chapters, ${rawEvaluations.length} evaluations, ${rawSupportFiles.length} support files`);
        
        return {
          id: chapter.uuid || chapter.id,
          title: chapter.title || '',
          content: convertedContent,
          subChapters: convertedSubChapters,
          supportFiles: rawSupportFiles.map((f: any) => ({
            id: f.uuid || f.id,
            name: f.name || f.file_name,
            type: f.type || f.mime_type,
            size: f.size || f.file_size,
            file_url: f.file_url || f.url,
          })),
          evaluations: rawEvaluations,
          quizzes: chapter.quizzes || chapter.quiz_assignments || [],
          isExpanded: chapter.isExpanded || false,
          order: chapter.order || chapter.order_index || 0,
          course_section_id: chapter.course_section_id ?? chapter.section_id ?? chapter.course_section?.id ?? null,
          section: chapter.section ?? chapter.course_section ?? null,
        };
      });
      
      // Always merge context data with local data to preserve content/evaluations/support files
      setChapters(prev => {
        // If no local chapters exist, use context data directly
        if (prev.length === 0) {
          console.log('✅ Using context chapters directly (no local chapters)');
          return convertedChapters;
        }
        
        // Create a map of all chapters - start with context chapters, then merge local data
        const mergedChapters = convertedChapters.map(contextChapter => {
          const localChapter = prev.find(c => c.id === contextChapter.id);
          
          if (!localChapter) {
            // New chapter from context, use it directly
            return contextChapter;
          }
          
          // Check if there are pending updates for this chapter
          const hasPendingChapterUpdate = chapterUpdateTimeouts[localChapter.id];
          const hasPendingSubChapterUpdate = localChapter.subChapters.some(sub => subChapterUpdateTimeouts[sub.id]);
          
          if (hasPendingChapterUpdate || hasPendingSubChapterUpdate) {
            return localChapter; // Keep local state for pending updates
          }
          
          // Merge context data with local data, preserving local UI state
          // But ALWAYS use context data for content/evaluations/supportFiles if local is empty
          const mergedSubChapters = contextChapter.subChapters.map(contextSub => {
            const localSub = localChapter.subChapters.find(s => s.id === contextSub.id);
            if (!localSub) return contextSub;
            
            return {
              ...contextSub,
              isExpanded: localSub.isExpanded, // PRESERVE local expanded state
              // Use context data - it's the source of truth from API
              content: contextSub.content,
              evaluations: contextSub.evaluations,
              supportFiles: contextSub.supportFiles,
            };
          });
          
          return {
            ...contextChapter,
            isExpanded: localChapter.isExpanded, // PRESERVE local expanded state
            // Use context data - it's the source of truth from API
            content: contextChapter.content,
            evaluations: contextChapter.evaluations,
            supportFiles: contextChapter.supportFiles,
            subChapters: mergedSubChapters,
          };
        });
        
        console.log('✅ Merged chapters:', mergedChapters.length);
        return mergedChapters;
      });
    }
  }, [contextChapters, chapterUpdateTimeouts, subChapterUpdateTimeouts]);

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
      Object.values(chapterUpdateTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
      Object.values(subChapterUpdateTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [chapterUpdateTimeouts, subChapterUpdateTimeouts]);

  // Chapter management - Open modal
  const handleAddChapter = (sectionId?: number) => {
    setChapterModalSectionId(sectionId);
    setShowChapterModal(true);
  };

  // Chapter creation - Called from modal
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
          order_index: sectionChapters.length,
          is_published: true,
        };
        
        console.log('🔵 Creating chapter with data:', chapterData);
        console.log('🔵 Section ID:', sectionId, 'Type:', typeof sectionId);
        console.log('🔵 API Call to:', `/api/organization/courses/${formData.courseUuid}/chapters`);
        
        const response: any = await courseCreation.createChapterEnhanced(formData.courseUuid, chapterData);
        
        console.log('✅ Chapter created response:', response);
        console.log('✅ Response data:', response?.data);
        console.log('✅ Chapter course_section_id:', response?.data?.course_section_id);
        
        if (!response?.data?.course_section_id) {
          console.error('⚠️ PROBLÈME: Le backend a retourné un chapitre SANS course_section_id !');
          console.error('⚠️ Données envoyées:', chapterData);
          console.error('⚠️ Réponse reçue:', response?.data);
        }
        
        // Expand the section to show the new chapter
        setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
        
        // Verify the chapter was created with correct section_id
        if (response?.data) {
          const createdChapterUuid = response.data.uuid || response.data.id;
          console.log('✅ Chapter created with UUID:', createdChapterUuid);
          console.log('✅ Chapter course_section_id from response:', response.data.course_section_id);
          
          // If the response doesn't have course_section_id, update it manually
          if (!response.data.course_section_id && sectionId) {
            console.warn('⚠️ Response missing course_section_id, updating manually...');
            try {
              await courseCreation.updateChapterEnhanced(formData.courseUuid, createdChapterUuid, {
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
            console.log('✅ Chapter added to local state with course_section_id:', response.data.course_section_id);
          }
        }
        
        // Reload chapters and sections to ensure consistency
        await loadChapters();
        await loadSectionsData();
        
        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));

      } else {
      const chapterNumber = chapters.length + 1;
      const newChapter = await createChapter({
          title: `Chapitre ${chapterNumber}`,
        description: '',
          order_index: chapterNumber,
      });
      if (newChapter) {
          setChapters(prev => [
            ...prev,
            {
        id: newChapter.uuid,
          title: newChapter.title,
        content: [],
        subChapters: [],
        supportFiles: [],
          evaluations: [],
          quizzes: [],
        isExpanded: true,
        order: prev.length + 1,
              course_section_id: (newChapter as any).course_section_id ?? null,
              section: (newChapter as any).section ?? null,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  };

  const handleChapterTitleChange = async (chapterId: string, title: string) => {
    try {
      // Update local state immediately for better UX
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId ? { ...chapter, title } : chapter
      ));
      
      // Clear existing timeout for this chapter
      if (chapterUpdateTimeouts[chapterId]) {
        clearTimeout(chapterUpdateTimeouts[chapterId]);
      }
      
      // Set new timeout for API call
      const timeout = setTimeout(async () => {
        await updateChapter(chapterId, { title });
        setChapterUpdateTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[chapterId];
          return newTimeouts;
        });
        // Don't reload chapters to avoid collapse - update local state only
        // await loadChapters(); // REMOVED to prevent collapse
      }, 1000); // 1 second delay
      
      setChapterUpdateTimeouts(prev => ({ ...prev, [chapterId]: timeout }));
    } catch (error) {
      console.error('Error updating chapter title:', error);
    }
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
      const newSubChapter = await createSubChapterAdapter(chapterId, {
        title: `SubChapter ${subChapterNumber}`,
        description: '',
        order: subChapterNumber
      });
      if (newSubChapter) {
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { 
              ...chapter, 
              subChapters: [...chapter.subChapters, {
                id: newSubChapter.uuid,
                  title: newSubChapter.title,
                content: [],
                evaluations: [],
                supportFiles: [],
                isExpanded: true,
                order: chapter.subChapters.length + 1,
                course_section_id: null, // Explicitly set to null for sub-chapter-level content
              }]
            } 
          : chapter
      ));
      }
      } catch (error) {
        console.error('Error updating chapter title:', error);
      }
    };

  const handleSubChapterTitleChange = async (chapterId: string, subChapterId: string, title: string) => {
    try {
      // Update local state immediately for better UX
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
      
      // Clear existing timeout for this subchapter
      if (subChapterUpdateTimeouts[subChapterId]) {
        clearTimeout(subChapterUpdateTimeouts[subChapterId]);
      }
      
      // Set new timeout for API call
      const timeout = setTimeout(async () => {
        await updateSubChapterAdapter(chapterId, subChapterId, { title });
        setSubChapterUpdateTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[subChapterId];
          return newTimeouts;
        });
        // Don't reload chapters to avoid collapse - update local state only
        // await loadChapters(); // REMOVED to prevent collapse
      }, 1000); // 1 second delay
      
      setSubChapterUpdateTimeouts(prev => ({ ...prev, [subChapterId]: timeout }));
      } catch (error) {
        console.error('Error updating sub-chapter title:', error);
      }
    };

  const handleContentTitleChange = async (chapterId: string, subChapterId: string, contentId: string, title: string) => {
    try {
      // Update local state immediately for better UX
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
      
      // Update content via API
      await updateContentAdapter(chapterId, contentId, { content: title });
      
      // Don't reload chapters to prevent collapse - data is already updated locally
      // await loadChapters(); // REMOVED to prevent collapse
    } catch (error) {
      console.error('Error updating content title:', error);
    }
  };

  const handleChapterContentTitleChange = async (chapterId: string, contentId: string, title: string) => {
    try {
      // Update local state immediately for better UX
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
      
      // Update content via API
      await updateContentAdapter(chapterId, contentId, { content: title });
      
      // Don't reload chapters to prevent collapse - data is already updated locally
      // await loadChapters(); // REMOVED to prevent collapse
    } catch (error) {
      console.error('Error updating content title:', error);
    }
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

  // Helper functions for managing expanded content state
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

  // Direct chapter content management
  const handleAddChapterContent = async (chapterId: string, type: 'text' | 'video' | 'image', file?: File) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const contentNumber = chapter ? chapter.content.length + 1 : 1;
      
      let contentData: any = {
        type: type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        order: contentNumber,
        sub_chapter_id: null // Explicitly set to null for chapter-level content
      };

      // If it's a file upload, include the file in the API call
      if (file) {
        contentData.file = file;
      }

      // Create content via API (handles both text and file uploads)
      const newContent = await createContentAdapter(chapterId, contentData);
      if (newContent) {
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                isExpanded: chapter.isExpanded, // PRESERVE isExpanded state
                content: [...chapter.content, {
                  id: newContent.uuid,
                  type: type,
                  title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
                  content: newContent.content || '',
                  file: file || null,
                  order: chapter.content.length + 1,
                }]
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error adding chapter content:', error);
    }
  };

  // Content update handlers
  const handleUpdateChapterContent = async (chapterId: string, contentId: string, updates: { title?: string; content?: string }) => {
    try {
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
      
      // Update via API
      await updateContentAdapter(chapterId, contentId, updates);
    } catch (error) {
      console.error('Error updating chapter content:', error);
    }
  };

  const handleUpdateSubChapterContent = async (chapterId: string, subChapterId: string, contentId: string, updates: { title?: string; content?: string }) => {
    try {
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
      
      // Update via API
      await updateContentAdapter(chapterId, contentId, updates);
    } catch (error) {
      console.error('Error updating sub-chapter content:', error);
    }
  };

  // Evaluation management
  const handleAddEvaluation = async (chapterId: string, type: 'devoir' | 'examen', data: any) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const newEvaluation = await createEvaluationAdapter(chapterId, {
        type: type,
        title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} ${chapter ? chapter.evaluations.length + 1 : 1}`,
        description: data.description || '',
        due_date: data.dueDate || null,
        file: data.file || null
        // Omit sub_chapter_id for chapter-level evaluations (will be null in API)
      });
      if (newEvaluation) {
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                evaluations: [...chapter.evaluations, {
                  id: newEvaluation.uuid,
                  type: type,
                  title: newEvaluation.title,
                  description: newEvaluation.description,
                  due_date: newEvaluation.due_date,
                  file: data.file || null,
                  order: chapter.evaluations.length + 1,
                }]
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error adding evaluation:', error);
    }
  };

  // Support file management
  const handleAddSupportFile = async (chapterId: string, file: File) => {
    try {
      // Upload support file via API
      const success = await uploadSupportFilesAdapter([file], chapterId);
      if (success) {
        // Update local state immediately to show the uploaded file
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                supportFiles: [...chapter.supportFiles, {
                  id: `temp-${Date.now()}`, // Temporary ID for immediate display
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  file: file,
                  url: URL.createObjectURL(file) // Create preview URL
                }]
              }
            : chapter
        ));
        
        // Don't reload chapters to prevent collapse - data is already updated locally
        // await loadChapters(); // REMOVED to prevent collapse
      }
    } catch (error) {
      console.error('Error adding support file:', error);
    }
  };

  const handleDeleteChapterContent = async (chapterId: string, contentId: string) => {
    try {
      await deleteContentAdapter(chapterId, contentId);
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              content: chapter.content.filter(content => content.id !== contentId)
            }
          : chapter
      ));
    } catch (error) {
      console.error('Error deleting chapter content:', error);
    }
  };

  // Quiz association management
  const handleAddQuizToChapter = (chapterId: string, subChapterId?: string) => {
    setQuizModalTarget({ chapterId, subChapterId });
    setShowQuizModal(true);
  };

  const handleSelectQuiz = (quizUuid: string, quizTitle: string) => {
    setShowQuizModal(false);
    setQuizModalTarget(null);
    // The association is already done in the modal via quizService.associateQuiz
    // Just reload chapters to show the updated data
    setTimeout(() => {
      loadChapters();
    }, 500);
  };

  // Helper to get chapter UUID from chapter ID
  // In this context, chapter.id is already the UUID
  const getChapterUuid = (chapterId: string) => {
    return chapterId; // The ID is already the UUID in this context
  };

  // Helper to get subchapter UUID from IDs
  // In this context, subChapter.id is already the UUID
  const getSubChapterUuid = (_chapterId: string, subChapterId: string) => {
    return subChapterId; // The ID is already the UUID in this context
  };

  const handleDeleteEvaluation = async (chapterId: string, evaluationId: string) => {
    try {
      await deleteEvaluationAdapter(chapterId, evaluationId);
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              evaluations: chapter.evaluations.filter(evaluation => evaluation.id !== evaluationId)
            }
          : chapter
      ));
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  const handleUpdateEvaluation = async (chapterId: string, evaluationId: string, data: any) => {
    try {
      // Update via API
      const updatedEvaluation = await updateEvaluationAdapter(chapterId, evaluationId, {
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        file: data.file
      });
      
      if (updatedEvaluation) {
        // Update local state with API response
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                evaluations: chapter.evaluations.map(evaluation =>
                  evaluation.id === evaluationId 
                    ? {
                        ...evaluation,
                        title: updatedEvaluation.title,
                        description: updatedEvaluation.description,
                        due_date: updatedEvaluation.due_date,
                        file: data.file || evaluation.file
                      }
                    : evaluation
                )
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
    }
  };

  const handleDeleteSupportFile = async (chapterId: string, fileId: string) => {
    try {
      await deleteSupportFileAdapter(chapterId, fileId);
      // Update local state immediately
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              supportFiles: chapter.supportFiles.filter(file => file.id !== fileId)
            }
          : chapter
      ));
      // Don't reload chapters to prevent collapse - data is already updated locally
      // await loadChapters(); // REMOVED to prevent collapse
    } catch (error) {
      console.error('Error deleting support file:', error);
    }
  };

  // Sub-chapter content management
  const handleAddSubChapterContent = async (chapterId: string, subChapterId: string, type: 'text' | 'video' | 'image', file?: File) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const subChapter = chapter?.subChapters.find(sc => sc.id === subChapterId);
      const contentNumber = subChapter ? subChapter.content.length + 1 : 1;
      
      let contentData: any = {
        type: type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
        order: contentNumber,
        sub_chapter_id: subChapterId
      };

      // If it's a file upload, include the file in the API call
      if (file) {
        contentData.file = file;
      }

      // Create content via API (handles both text and file uploads)
      const newContent = await createContentAdapter(chapterId, contentData);
      if (newContent) {
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                isExpanded: chapter.isExpanded, // PRESERVE chapter isExpanded state
                subChapters: chapter.subChapters.map(subChapter =>
                  subChapter.id === subChapterId 
                    ? {
                        ...subChapter,
                        isExpanded: subChapter.isExpanded, // PRESERVE subChapter isExpanded state
                        content: [...subChapter.content, {
                          id: newContent.uuid,
                          type: type,
                          title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${contentNumber}`,
                          content: newContent.content || '',
                          file: file || null,
                          order: subChapter.content.length + 1,
                        }]
                      }
                    : subChapter
                )
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error adding sub-chapter evaluation:', error);
    }
  };

  // Sub-chapter evaluation management
  const handleAddSubChapterEvaluation = async (chapterId: string, subChapterId: string, type: 'devoir' | 'examen', data: any) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const subChapter = chapter?.subChapters.find(sc => sc.id === subChapterId);
      const newEvaluation = await createEvaluationAdapter(chapterId, {
        type: type,
        title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} ${subChapter ? subChapter.evaluations.length + 1 : 1}`,
        description: data.description || '',
        due_date: data.dueDate || null,
        file: data.file || null,
        sub_chapter_id: subChapterId
      });
      if (newEvaluation) {
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                subChapters: chapter.subChapters.map(subChapter =>
                  subChapter.id === subChapterId 
                    ? {
                        ...subChapter,
                        evaluations: [...subChapter.evaluations, {
                          id: newEvaluation.uuid,
                          type: type,
                          title: newEvaluation.title,
                          description: newEvaluation.description,
                          due_date: newEvaluation.due_date,
                          file: data.file || null,
                          order: subChapter.evaluations.length + 1,
                        }]
                      }
                    : subChapter
                )
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error adding sub-chapter evaluation:', error);
    }
  };

  // Sub-chapter support file management
  const handleAddSubChapterSupportFile = async (chapterId: string, subChapterId: string, file: File) => {
    try {
      // Upload support file via API with sub-chapter ID
      const success = await uploadSupportFilesAdapter([file], chapterId, subChapterId);
      if (success) {
        // Update local state immediately to show the uploaded file
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                subChapters: chapter.subChapters.map(subChapter =>
                  subChapter.id === subChapterId
                    ? {
                        ...subChapter,
                        supportFiles: [...subChapter.supportFiles, {
                          id: `temp-${Date.now()}`, // Temporary ID for immediate display
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          file: file,
                          url: URL.createObjectURL(file) // Create preview URL
                        }]
                      }
                    : subChapter
                )
              }
            : chapter
        ));
        
        // Don't reload chapters to prevent collapse - data is already updated locally
        // await loadChapters(); // REMOVED to prevent collapse
      }
    } catch (error) {
      console.error('Error adding sub-chapter support file:', error);
    }
  };

  const handleDeleteSubChapterContent = async (chapterId: string, subChapterId: string, contentId: string) => {
    try {
      await deleteContentAdapter(chapterId, contentId);
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              subChapters: chapter.subChapters.map(subChapter =>
                subChapter.id === subChapterId 
                  ? {
                      ...subChapter,
                      content: subChapter.content.filter(content => content.id !== contentId)
                    }
                  : subChapter
              )
            }
          : chapter
      ));
    } catch (error) {
      console.error('Error deleting sub-chapter content:', error);
    }
  };

  const handleDeleteSubChapterEvaluation = async (chapterId: string, subChapterId: string, evaluationId: string) => {
    try {
      await deleteEvaluationAdapter(chapterId, evaluationId);
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              subChapters: chapter.subChapters.map(subChapter =>
                subChapter.id === subChapterId
                  ? {
                      ...subChapter,
                      evaluations: subChapter.evaluations.filter(evaluation => evaluation.id !== evaluationId)
                    }
                  : subChapter
              )
            }
          : chapter
      ));
    } catch (error) {
      console.error('Error deleting sub-chapter evaluation:', error);
    }
  };

  const handleUpdateSubChapterEvaluation = async (chapterId: string, subChapterId: string, evaluationId: string, data: any) => {
    try {
      // Update local state immediately
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              subChapters: chapter.subChapters.map(subChapter =>
                subChapter.id === subChapterId
                  ? {
                      ...subChapter,
                      evaluations: subChapter.evaluations.map(evaluation =>
                        evaluation.id === evaluationId 
                          ? {
                              ...evaluation,
                              title: data.title,
                              description: data.description,
                              due_date: data.dueDate,
                              file: data.file || evaluation.file
                            }
                          : evaluation
                      )
                    }
                  : subChapter
              )
            }
          : chapter
      ));
      
      // Update via API
      const updatedEvaluation = await updateEvaluationAdapter(chapterId, evaluationId, {
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        file: data.file
      });
      
      if (updatedEvaluation) {
        // Update local state with API response
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                subChapters: chapter.subChapters.map(subChapter =>
                  subChapter.id === subChapterId
                    ? {
                        ...subChapter,
                        evaluations: subChapter.evaluations.map(evaluation =>
                          evaluation.id === evaluationId 
                            ? {
                                ...evaluation,
                                title: updatedEvaluation.title,
                                description: updatedEvaluation.description,
                                due_date: updatedEvaluation.due_date,
                                file: data.file || evaluation.file
                              }
                            : evaluation
                        )
                      }
                    : subChapter
                )
              }
            : chapter
        ));
      }
    } catch (error) {
      console.error('Error updating sub-chapter evaluation:', error);
    }
  };

  const handleDeleteSubChapterSupportFile = async (chapterId: string, subChapterId: string, fileId: string) => {
    try {
      await deleteSupportFileAdapter(chapterId, fileId);
      // Update local state immediately
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? {
              ...chapter,
              subChapters: chapter.subChapters.map(subChapter =>
                subChapter.id === subChapterId 
                  ? {
                      ...subChapter,
                      supportFiles: subChapter.supportFiles.filter(file => file.id !== fileId)
                    }
                  : subChapter
              )
            }
          : chapter
      ));
      // Don't reload chapters to prevent collapse - data is already updated locally
      // await loadChapters(); // REMOVED to prevent collapse
    } catch (error) {
    }
  };

  // Drag and drop handlers
  const handleDragStart = (_e: React.DragEvent, item: any) => {
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


  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});

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

  // Block creation - Called from modal
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

  const toggleSectionCollapsed = (sectionId: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getChaptersForSection = (sectionId: number) =>
    chapters.filter((ch: Chapter) => ch.course_section_id === sectionId);

  const getOrphanChapters = () =>
    chapters.filter((ch: Chapter) => !ch.course_section_id);

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        <Card className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] ${
          isDark ? 'bg-transparent border-gray-600' : 'bg-transparent border-[#dbd8d8]'
        }`}>
          <CardContent className="p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Contenu du cours
              </h3>
            </div>

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
                            onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                            className={`flex-1 font-semibold ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'}`}
                            placeholder="Nom du block"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{sectionChapters.length} chapitre{sectionChapters.length > 1 ? 's' : ''}</Badge>
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="rounded-md p-2 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
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
                    onAddQuiz={(chapterId) => handleAddQuizToChapter(chapterId)}
                    onAddDevoir={(chapterId) => {
                      // Set pending evaluation type and expand chapter
                      setPendingEvaluationType(prev => ({ ...prev, [chapterId]: 'devoir' }));
                      handleToggleChapterExpanded(chapterId);
                    }}
                    onAddExamin={(chapterId) => {
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
                      onAddDevoir={(chapterId) => {
                        toggleChapterEvaluationEditor(chapterId);
                      }}
                      onAddExamin={(chapterId) => {
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
                          onAddQuiz={(chapterId) => handleAddQuizToChapter(chapterId)}
                          onAddDevoir={(chapterId) => {
                            toggleChapterEvaluationEditor(chapterId);
                          }}
                          onAddExamin={(chapterId) => {
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

      {/* Quiz Selection Modal */}
      {showQuizModal && quizModalTarget && formData.courseUuid && (
        <QuizSelectionModal
          isOpen={showQuizModal}
          onClose={() => {
            setShowQuizModal(false);
            setQuizModalTarget(null);
          }}
          onSelectQuiz={handleSelectQuiz}
          courseUuid={formData.courseUuid}
          chapterUuid={quizModalTarget.subChapterId ? undefined : getChapterUuid(quizModalTarget.chapterId)}
          subChapterUuid={quizModalTarget.subChapterId ? getSubChapterUuid(quizModalTarget.chapterId, quizModalTarget.subChapterId) : undefined}
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
