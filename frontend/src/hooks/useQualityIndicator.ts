import { useState, useEffect, useCallback } from 'react';
import { getQualityIndicator, QualityIndicator } from '../services/qualityManagement';

export const useQualityIndicator = (id: number) => {
  const [indicator, setIndicator] = useState<QualityIndicator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id || id === 0) {
      setLoading(false);
      setError('ID d\'indicateur invalide');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getQualityIndicator(id);
      
      console.log('✅ useQualityIndicator response:', response);
      
      // Handle API response structure
      // Backend returns: { success: true, data: { id: 1, number: 1, ... } }
      if (response && typeof response === 'object') {
        let indicatorData: any = null;
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { id: 1, ... } }
          indicatorData = response.data;
        } else if ('id' in response && 'number' in response) {
          // Direct indicator object: { id: 1, number: 1, ... }
          indicatorData = response;
        } else if (response.data && 'id' in response.data) {
          // Structure: { data: { id: 1, ... } }
          indicatorData = response.data;
        }
        
        if (indicatorData && indicatorData.id) {
          // Map backend fields to frontend interface
          const mappedIndicator: QualityIndicator = {
            id: indicatorData.id,
            number: indicatorData.number,
            title: indicatorData.title,
            description: indicatorData.description,
            category: indicatorData.category,
            status: indicatorData.status === 'not-started' ? 'not_started' : 
                    indicatorData.status === 'in-progress' ? 'in_progress' : 
                    indicatorData.status || 'not_started',
            hasOverlay: indicatorData.hasOverlay || false,
            overlayColor: indicatorData.overlayColor || indicatorData.overlay_color || null,
            overlay_color: indicatorData.overlay_color || indicatorData.overlayColor || null,
            hasDocuments: indicatorData.hasDocuments || (indicatorData.documentCounts?.total > 0) || false,
            isApplicable: indicatorData.isApplicable !== undefined ? indicatorData.isApplicable : true,
            documentCounts: indicatorData.documentCounts || {
              procedures: 0,
              models: 0,
              evidences: 0,
              total: 0
            },
            completionRate: indicatorData.completionRate || 0,
            lastUpdated: indicatorData.lastUpdated || null
          };
          setIndicator(mappedIndicator);
        } else {
          console.error('❌ Invalid indicator format:', response);
          setError(response.error?.message || 'Erreur lors du chargement');
        }
      } else {
        console.error('❌ Invalid response format:', response);
        setError('Format de données invalide');
      }
    } catch (err: any) {
      console.error('Error loading indicator:', err);
      setError(
        err.response?.data?.error?.message ||
        err.message || 
        'Une erreur est survenue'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && id !== 0) {
      refetch();
    } else {
      setLoading(false);
      setError('ID d\'indicateur invalide');
    }
  }, [id, refetch]);

  return { indicator, loading, error, refetch };
};

