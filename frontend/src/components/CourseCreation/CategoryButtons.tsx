import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CategoryCreationModal } from './CategoryCreationModal';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { courseCreation } from '../../services/courseCreation';
import { sessionCreation } from '../../services/sessionCreation';
import { useToast } from '../ui/toast';

interface CategoryButtonsProps {
  selectedCategory: { id: number; name: string } | null;
  selectedSubcategory: { id: number; name: string } | null;
  categories: Array<{ id: number; name: string; is_custom?: boolean }>;
  subcategories?: Array<{ id: number; name: string; category_id: number }>;
  onCategorySelected: (category: { id: number; name: string } | null) => void;
  onSubcategorySelected?: (subcategory: { id: number; name: string } | null) => void;
  onCategoryCreated?: () => void;
  onSubcategoryCreated?: () => void;
  courseUuid?: string;
  sessionUuid?: string;
  isSession?: boolean;
  selectedPracticeIds?: number[];
  onPracticesChanged?: (practiceIds: number[]) => void;
}

export const CategoryButtons: React.FC<CategoryButtonsProps> = ({
  selectedCategory,
  selectedSubcategory,
  categories,
  subcategories: _subcategories,
  onCategorySelected,
  onSubcategorySelected: _onSubcategorySelected,
  onCategoryCreated,
  onSubcategoryCreated: _onSubcategoryCreated,
  courseUuid,
  sessionUuid,
  isSession = false,
  selectedPracticeIds = [],
  onPracticesChanged
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Pratiques de formation avec checkboxes
  const [formationPractices, setFormationPractices] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedPracticeIdsLocal, setSelectedPracticeIdsLocal] = useState<Set<number>>(new Set(selectedPracticeIds));
  const onPracticesChangedRef = useRef(onPracticesChanged);
  const hasLoadedPracticesRef = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onPracticesChangedRef.current = onPracticesChanged;
  }, [onPracticesChanged]);

  // Load formation practices from API
  useEffect(() => {
    const loadPractices = async () => {
      try {
        const response = isSession
          ? await sessionCreation.getFormationPractices() as { success: boolean; data?: Array<{ id: number; code: string; name: string }> }
          : await courseCreation.getFormationPractices() as { success: boolean; data?: Array<{ id: number; code: string; name: string }> };
        if (response.success && response.data) {
          setFormationPractices(response.data);
        }
      } catch (error) {
        console.error('Error loading formation practices:', error);
      }
    };
    loadPractices();
  }, [isSession]);

  // Load course/session practices if courseUuid or sessionUuid is provided
  useEffect(() => {
    const currentUuid = isSession ? sessionUuid : courseUuid;
    if (!currentUuid || hasLoadedPracticesRef.current) return;

    const loadPractices = async () => {
      try {
        const response = isSession && sessionUuid
          ? await sessionCreation.getSessionFormationPractices(sessionUuid) as { success: boolean; data?: { practices: Array<{ id: number }> } }
          : !isSession && courseUuid
            ? await courseCreation.getCourseFormationPractices(courseUuid) as { success: boolean; data?: { practices: Array<{ id: number }> } }
            : null;

        if (response?.success && response.data?.practices) {
          const practiceIds = response.data.practices.map((p: { id: number }) => p.id);
          setSelectedPracticeIdsLocal(new Set(practiceIds));
          hasLoadedPracticesRef.current = true;
          // Only call onPracticesChanged if values actually changed
          const currentIds = Array.from(selectedPracticeIdsLocal).sort().join(',');
          const newIds = practiceIds.sort().join(',');
          if (currentIds !== newIds && onPracticesChangedRef.current) {
            onPracticesChangedRef.current(practiceIds);
          }
        }
      } catch (error) {
        console.error(`Error loading ${isSession ? 'session' : 'course'} practices:`, error);
      }
    };

    loadPractices();
  }, [courseUuid, sessionUuid, isSession]);

  // Reset hasLoadedPracticesRef when UUID changes
  useEffect(() => {
    hasLoadedPracticesRef.current = false;
  }, [courseUuid, sessionUuid]);

  // Sync with prop changes (but avoid infinite loop)
  useEffect(() => {
    const propIds = new Set(selectedPracticeIds);
    const localIds = selectedPracticeIdsLocal;
    const propIdsStr = Array.from(propIds).sort().join(',');
    const localIdsStr = Array.from(localIds).sort().join(',');

    // Only update if they're actually different
    if (propIdsStr !== localIdsStr) {
      setSelectedPracticeIdsLocal(propIds);
    }
  }, [selectedPracticeIds, selectedPracticeIdsLocal]);

  const togglePractice = async (practiceId: number) => {
    const newSet = new Set(selectedPracticeIdsLocal);
    if (newSet.has(practiceId)) {
      newSet.delete(practiceId);
    } else {
      newSet.add(practiceId);
    }
    setSelectedPracticeIdsLocal(newSet);

    const practiceIdsArray = Array.from(newSet);
    if (onPracticesChanged) {
      onPracticesChanged(practiceIdsArray);
    }

    // Save to backend if courseUuid or sessionUuid exists
    if (isSession && sessionUuid) {
      try {
        await sessionCreation.updateSessionFormationPractices(sessionUuid, practiceIdsArray);
      } catch (error) {
        console.error('Error updating session formation practices:', error);
        // Revert on error
        setSelectedPracticeIdsLocal(new Set(selectedPracticeIds));
      }
    } else if (!isSession && courseUuid) {
      try {
        await courseCreation.updateCourseFormationPractices(courseUuid, practiceIdsArray);
      } catch (error) {
        console.error('Error updating course formation practices:', error);
        // Revert on error
        setSelectedPracticeIdsLocal(new Set(selectedPracticeIds));
      }
    }
  };

  const customCategoriesCount = categories.filter(cat => cat.is_custom).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const handleCategoryCreated = async (newCategory: { id: number; name: string }) => {
    // Select the new category immediately (it will be in the list after refresh)
    onCategorySelected({ ...newCategory, is_custom: true });

    // Then refresh categories list to include it
    if (onCategoryCreated) {
      // Call it but don't wait - selection is already done
      onCategoryCreated();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
            Catégorie/Pratiques De Formation:
          </span>
        </div>

        {/* Single Dropdown Button */}
        <div className="relative w-full" ref={categoryDropdownRef}>
          <Button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`w-full h-auto py-4 px-6 rounded-[18px] border-2 border-dashed font-semibold text-[17px] transition-all ${isDark
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              : 'bg-white border-[#0066FF] hover:bg-[#E8F3FF]'
              }`}
            style={{
              borderColor: primaryColor,
              color: primaryColor
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {selectedCategory ? selectedCategory.name : 'Sélectionner une catégorie'}
              <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </span>
          </Button>

          {/* Dropdown with all categories + create new option */}
          {showCategoryDropdown && (
            <div className={`absolute left-0 top-full mt-2 w-full rounded-lg shadow-lg border z-50 max-h-[400px] overflow-y-auto ${isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              <div className="py-1">
                {/* Predefined categories */}
                {categories.filter(cat => !cat.is_custom).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      onCategorySelected(category);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedCategory?.id === category.id
                      ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <span>{category.name}</span>
                    {selectedCategory?.id === category.id && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}

                {/* Custom categories if any */}
                {categories.filter(cat => cat.is_custom).length > 0 && (
                  <>
                    <div className={`px-4 py-2 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                      Catégories personnalisées
                    </div>
                    {categories.filter(cat => cat.is_custom).map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          onCategorySelected(category);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedCategory?.id === category.id
                          ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <span>{category.name}</span>
                        {selectedCategory?.id === category.id && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {categories.length === 0 && (
                  <div className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucune catégorie disponible
                  </div>
                )}

                {/* Separator + Create new option */}
                <div className={`border-t my-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryDropdown(false);
                    setIsCategoryModalOpen(true);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${isDark
                    ? 'text-cyan-400 hover:bg-gray-700'
                    : 'text-cyan-600 hover:bg-cyan-50'
                    }`}
                  style={{ color: primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Créer une nouvelle catégorie</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal création catégorie */}
      <CategoryCreationModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        existingCustomCount={customCategoriesCount}
      />
    </>
  );
};

