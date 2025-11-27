import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CategoryCreationModal } from './CategoryCreationModal';
import { SubcategoryCreationModal } from './SubcategoryCreationModal';
import { Plus } from 'lucide-react';
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
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            Catégorie/Pratiques De Formation:
          </span>
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

