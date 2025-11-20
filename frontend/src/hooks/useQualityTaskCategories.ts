import { useState, useEffect } from 'react';
import { getTaskCategories, QualityTaskCategory } from '../services/qualityManagement';

export const useQualityTaskCategories = () => {
  const [categories, setCategories] = useState<QualityTaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTaskCategories();
      
      console.log('✅ useQualityTaskCategories response:', response);
      
      // Handle different response structures
      // Backend returns: { success: true, data: { categories: [...] } }
      if (response && typeof response === 'object') {
        let catsArray: any[] = [];
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { categories: [...] } }
          catsArray = response.data.categories || response.data.data || [];
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          catsArray = response.data;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          catsArray = response;
        } else if (response.categories && Array.isArray(response.categories)) {
          // Structure: { categories: [...] }
          catsArray = response.categories;
        }
        
        if (Array.isArray(catsArray)) {
          setCategories(catsArray);
        } else {
          console.error('❌ Invalid categories format:', response);
          setError('Format de données invalide: categories n\'est pas un tableau');
        }
      } else {
        console.error('❌ Invalid response format:', response);
        setError('Format de données invalide');
      }
    } catch (err: any) {
      console.error('Error loading task categories:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { categories, loading, error, refetch };
};

