import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { studentsService } from '../services/Students';
import type { GetStudentsParams } from '../services/Students.types';

interface UseStudentsExportWithSelectionReturn {
  // Selection state
  selectedCount: number;
  selectedIds: string[];
  
  // Selection actions
  toggleStudent: (id: string) => void;
  toggleAll: () => void;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  clearSelection: () => void;
  
  // Export selected
  exportSelected: () => Promise<boolean>;
  exportingSelected: boolean;
  selectedError: string | null;
  selectedSuccess: string | null;
  
  // Export all
  exportAll: (filters?: GetStudentsParams) => Promise<boolean>;
  exportingAll: boolean;
  allError: string | null;
  allSuccess: string | null;
}

/**
 * Hook personnalisé pour gérer la sélection et l'export des apprenants
 */
export const useStudentsExportWithSelection = (
  availableIds: string[]
): UseStudentsExportWithSelectionReturn => {
  
  // États de sélection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // États d'export sélection
  const [exportingSelected, setExportingSelected] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [selectedSuccess, setSelectedSuccess] = useState<string | null>(null);
  
  // États d'export tous
  const [exportingAll, setExportingAll] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);
  const [allSuccess, setAllSuccess] = useState<string | null>(null);

  // ✅ FIX : Utiliser une ref pour stocker les IDs précédents et éviter le re-render
  const prevAvailableIdsRef = useRef<string>('');

  // ✅ FIX : Créer une clé stable basée sur les IDs disponibles
  const availableIdsKey = useMemo(() => {
    return availableIds.sort().join(',');
  }, [availableIds]);

  // ✅ FIX : Ne synchroniser que si les IDs ont vraiment changé
  useEffect(() => {
    if (prevAvailableIdsRef.current !== availableIdsKey) {
      prevAvailableIdsRef.current = availableIdsKey;
      
      // Ne garder que les IDs qui existent toujours
      setSelectedIds(prev => {
        const filtered = prev.filter(id => availableIds.includes(id));
        // Ne mettre à jour que si nécessaire
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }
  }, [availableIdsKey, availableIds]);

  // ✅ Mémoriser le Set pour les recherches rapides
  const availableIdsSet = useMemo(() => new Set(availableIds), [availableIds]);

  // Fonction pour basculer la sélection d'un étudiant
  const toggleStudent = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Fonction pour tout sélectionner/désélectionner
  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.length === availableIds.length && prev.length > 0) {
        return [];
      } else {
        return [...availableIds];
      }
    });
  }, [availableIds]);

  // Vérifier si un étudiant est sélectionné
  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  // ✅ Mémoriser isAllSelected
  const isAllSelected = useMemo(() => {
    return availableIds.length > 0 && 
           selectedIds.length === availableIds.length;
  }, [availableIds.length, selectedIds.length]);

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Fonction d'export des apprenants sélectionnés
  const exportSelected = useCallback(async (): Promise<boolean> => {
    // Réinitialiser les messages
    setSelectedError(null);
    setSelectedSuccess(null);

    if (selectedIds.length === 0) {
      setSelectedError('Veuillez sélectionner au moins un apprenant');
      return false;
    }

    setExportingSelected(true);

    try {
      console.log('📤 Export sélection - IDs:', selectedIds);
      
      // ✅ S'assurer que selectedIds est un tableau de strings simples
      const cleanIds = selectedIds.filter(id => typeof id === 'string' && id.length > 0);
      
      if (cleanIds.length === 0) {
        throw new Error('IDs invalides');
      }

      // Appeler le service avec les IDs
      const blob = await studentsService.exportSelectedStudents(cleanIds);
      
      // Créer l'URL de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apprenants_selectionnes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSelectedSuccess(`${cleanIds.length} apprenant(s) exporté(s) avec succès`);
      return true;
      
    } catch (error: any) {
      console.error('❌ Erreur export sélection:', error);
      setSelectedError(
        error?.response?.data?.message || 
        error?.message || 
        'Erreur lors de l\'export des apprenants sélectionnés'
      );
      return false;
    } finally {
      setExportingSelected(false);
    }
  }, [selectedIds]);

  // Fonction d'export de tous les apprenants avec filtres
  const exportAll = useCallback(async (filters?: GetStudentsParams): Promise<boolean> => {
    // Réinitialiser les messages
    setAllError(null);
    setAllSuccess(null);

    setExportingAll(true);

    try {
      console.log('📤 Export tous - Filtres:', filters);
      
      // Appeler le service avec les filtres
      const blob = await studentsService.exportStudents(filters);
      
      // Créer l'URL de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apprenants_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setAllSuccess('Export réalisé avec succès');
      return true;
      
    } catch (error: any) {
      console.error('❌ Erreur export tous:', error);
      setAllError(
        error?.response?.data?.message || 
        error?.message || 
        'Erreur lors de l\'export des apprenants'
      );
      return false;
    } finally {
      setExportingAll(false);
    }
  }, []);

  return {
    // Selection
    selectedCount: selectedIds.length,
    selectedIds,
    toggleStudent,
    toggleAll,
    isSelected,
    isAllSelected,
    clearSelection,
    
    // Export selected
    exportSelected,
    exportingSelected,
    selectedError,
    selectedSuccess,
    
    // Export all
    exportAll,
    exportingAll,
    allError,
    allSuccess,
  };
};