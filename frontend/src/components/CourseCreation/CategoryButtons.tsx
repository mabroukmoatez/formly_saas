import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CategoryCreationModal } from './CategoryCreationModal';
import { SubcategoryCreationModal } from './SubcategoryCreationModal';
import { Plus, ChevronRight } from 'lucide-react';
import { courseCreation } from '../../services/courseCreation';
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
  selectedPracticeIds = [],
  onPracticesChanged
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#0066FF';
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isActivitiesDropdownOpen, setIsActivitiesDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const activitiesDropdownRef = useRef<HTMLDivElement>(null);
  
  // Pratiques de formation avec checkboxes
  const [formationPractices, setFormationPractices] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedPracticeIdsLocal, setSelectedPracticeIdsLocal] = useState<Set<number>>(new Set(selectedPracticeIds));
  
  // Load formation practices from API
  useEffect(() => {
    const loadPractices = async () => {
      try {
        const response = await courseCreation.getFormationPractices() as { success: boolean; data?: Array<{ id: number; code: string; name: string }> };
        if (response.success && response.data) {
          setFormationPractices(response.data);
        }
      } catch (error) {
        console.error('Error loading formation practices:', error);
      }
    };
    loadPractices();
  }, []);
  
  // Load course practices if courseUuid is provided
  useEffect(() => {
    if (courseUuid) {
      const loadCoursePractices = async () => {
        try {
          const response = await courseCreation.getCourseFormationPractices(courseUuid) as { success: boolean; data?: { practices: Array<{ id: number }> } };
          if (response.success && response.data?.practices) {
            const practiceIds = response.data.practices.map((p: { id: number }) => p.id);
            setSelectedPracticeIdsLocal(new Set(practiceIds));
            if (onPracticesChanged) {
              onPracticesChanged(practiceIds);
            }
          }
        } catch (error) {
          console.error('Error loading course practices:', error);
        }
      };
      loadCoursePractices();
    }
  }, [courseUuid, onPracticesChanged]);
  
  // Sync with prop changes
  useEffect(() => {
    setSelectedPracticeIdsLocal(new Set(selectedPracticeIds));
  }, [selectedPracticeIds]);
  
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
    
    // Save to backend if courseUuid exists
    if (courseUuid) {
      try {
        await courseCreation.updateCourseFormationPractices(courseUuid, practiceIdsArray);
      } catch (error) {
        console.error('Error updating formation practices:', error);
        // Revert on error
        setSelectedPracticeIdsLocal(new Set(selectedPracticeIds));
      }
    }
  };
  
  const customCategoriesCount = categories.filter(cat => cat.is_custom).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activitiesDropdownRef.current && !activitiesDropdownRef.current.contains(event.target as Node)) {
        setIsActivitiesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryCreated = async (newCategory: { id: number; name: string }) => {
    // Select the new category immediately (it will be in the list after refresh)
    onCategorySelected({ ...newCategory, is_custom: true });
    
    // Then refresh categories list to include it
    if (onCategoryCreated) {
      // Call it but don't wait - selection is already done
      onCategoryCreated();
    }
  };

  const handleSubcategoryCreated = (newSubcategory: { id: number; name: string; category_id: number }) => {
    // Select the subcategory
    if (_onSubcategorySelected) {
      _onSubcategorySelected(newSubcategory);
    }
    // Refresh subcategories list
    if (_onSubcategoryCreated) {
      _onSubcategoryCreated();
    }
    setIsSubcategoryModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Label avec lien */}
        <div className="flex items-center gap-2">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            Catégorie/Pratiques De Formation:
          </span>
          <div className="relative inline-block z-10" ref={activitiesDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                
                if (activitiesDropdownRef.current) {
                  const rect = activitiesDropdownRef.current.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + 8,
                    left: rect.left
                  });
                }
                
                setIsActivitiesDropdownOpen(!isActivitiesDropdownOpen);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              className={`text-[17px] font-medium hover:underline flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-blue-400' : 'text-[#0066FF]'
              }`}
              style={{ color: primaryColor }}
            >
              Actions de formation <ChevronRight className={`inline w-4 h-4 transition-transform ${isActivitiesDropdownOpen ? 'rotate-90' : ''}`} />
            </button>
            
            {isActivitiesDropdownOpen && dropdownPosition && (
              <div 
                className={`fixed z-[9999] rounded-[18px] border border-solid shadow-lg min-w-[320px] ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-[#e2e2ea]'
                }`}
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                {/* Header avec titre */}
                <div 
                  className={`px-4 py-3 rounded-t-[18px] ${
                    isDark ? 'bg-blue-900/30' : 'bg-[#E8F3FF]'
                  }`}
                  style={!isDark ? { backgroundColor: '#E8F3FF' } : {}}
                >
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                    isDark ? 'text-blue-300' : 'text-[#19294a]'
                  }`} style={!isDark ? { color: '#19294a' } : {}}>
                    Actions de formation
                  </h3>
                </div>
                
                {/* Liste avec checkboxes */}
                <div className="p-2">
                  {formationPractices.map((practice) => {
                    const isChecked = selectedPracticeIdsLocal.has(practice.id);
                    return (
                      <label
                        key={practice.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isDark 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePractice(practice.id);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div 
                          className="relative flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePractice(practice.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              togglePractice(practice.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePractice(practice.id);
                            }}
                            className="sr-only"
                          />
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                              isChecked
                                ? isDark 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'bg-[#0066FF] border-[#0066FF]'
                                : isDark
                                  ? 'bg-transparent border-gray-500'
                                  : 'bg-white border-gray-300'
                            }`}
                            style={isChecked ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                          >
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                          isDark ? 'text-white' : 'text-[#19294a]'
                        }`}>
                          {practice.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deux grands boutons */}
        <div className="flex gap-4">
          {/* Bouton Ajouter Catégorie */}
          <Button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className={`flex-1 h-auto py-4 px-6 rounded-[18px] border-2 border-dashed font-semibold text-[17px] transition-all ${
              isDark 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                : 'bg-white border-[#0066FF] hover:bg-[#E8F3FF]'
            }`}
            style={{ 
              borderColor: primaryColor,
              color: primaryColor
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter Catégorie
          </Button>

          {/* Bouton Ajouter Sous-catégorie */}
          <Button
            type="button"
            onClick={() => {
              if (!selectedCategory && categories.length > 0) {
                showError('Erreur', 'Veuillez d\'abord sélectionner une catégorie');
                return;
              }
              setIsSubcategoryModalOpen(true);
            }}
            disabled={!selectedCategory && categories.length === 0}
            className={`flex-1 h-auto py-4 px-6 rounded-[18px] border-2 border-dashed font-semibold text-[17px] transition-all ${
              (!selectedCategory && categories.length === 0)
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                  : 'bg-white border-[#0066FF] hover:bg-[#E8F3FF]'
            }`}
            style={{ 
              borderColor: (selectedCategory || categories.length > 0) ? primaryColor : undefined,
              color: (selectedCategory || categories.length > 0) ? primaryColor : undefined
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter Sous-catégorie
          </Button>
        </div>

        {/* Affichage de la catégorie sélectionnée */}
        {selectedCategory && (
          <div className={`px-[17px] py-3 rounded-[18px] border border-solid ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-[#e2e2ea]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                  isDark ? 'text-gray-400' : 'text-[#718096]'
                }`}>
                  Catégorie sélectionnée:
                </span>
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  {selectedCategory.name}
                  {selectedCategory.is_custom && (
                    <span className={`ml-2 text-sm font-normal ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      (Personnalisée)
                    </span>
                  )}
                </span>
              </div>
              {selectedSubcategory && (
                <div className="flex items-center gap-2">
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                    isDark ? 'text-gray-400' : 'text-[#718096]'
                  }`}>
                    Sous-catégorie:
                  </span>
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ${
                    isDark ? 'text-gray-300' : 'text-[#19294a]'
                  }`}>
                    {selectedSubcategory.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal création catégorie */}
      <CategoryCreationModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        existingCustomCount={customCategoriesCount}
      />

      {/* Modal création sous-catégorie */}
      <SubcategoryCreationModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        onSuccess={handleSubcategoryCreated}
        categoryId={selectedCategory?.id || null}
        categories={categories}
      />
    </>
  );
};

