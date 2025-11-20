import { useState, useEffect } from 'react';
import { getQualityIndicators, QualityIndicator } from '../services/qualityManagement';

interface UseQualityIndicatorsReturn {
  indicators: QualityIndicator[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useQualityIndicators = (): UseQualityIndicatorsReturn => {
  const [indicators, setIndicators] = useState<QualityIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getQualityIndicators();
      
      console.log('✅ useQualityIndicators response:', response);
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response keys:', response ? Object.keys(response) : 'null');
      
      // Handle API response structure
      // Backend returns: { success: true, data: { indicators: [...] } }
      if (response && typeof response === 'object') {
        // Try multiple possible structures
        let indicatorsArray: any[] = [];
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { indicators: [...] } }
          indicatorsArray = response.data.indicators || response.data.data || [];
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          indicatorsArray = response.data;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          indicatorsArray = response;
        } else if (response.indicators && Array.isArray(response.indicators)) {
          // Structure: { indicators: [...] }
          indicatorsArray = response.indicators;
        }
        
        if (Array.isArray(indicatorsArray) && indicatorsArray.length >= 0) {
          // Map backend fields to frontend interface
          const mappedIndicators = indicatorsArray.map((ind: any) => ({
            id: ind.id,
            number: ind.number,
            title: ind.title,
            description: ind.description,
            category: ind.category,
            status: ind.status === 'not-started' ? 'not_started' : 
                    ind.status === 'in-progress' ? 'in_progress' : 
                    ind.status || 'not_started',
            hasOverlay: ind.hasOverlay || false,
            overlayColor: ind.overlayColor || ind.overlay_color || null,
            overlay_color: ind.overlay_color || ind.overlayColor || null,
            hasDocuments: ind.hasDocuments || (ind.documentCounts?.total > 0) || false,
            isApplicable: ind.isApplicable !== undefined ? ind.isApplicable : true,
            documentCounts: ind.documentCounts || {
              procedures: 0,
              models: 0,
              evidences: 0,
              total: 0
            },
            completionRate: ind.completionRate || 0,
            lastUpdated: ind.lastUpdated || null
          }));
          setIndicators(mappedIndicators);
        } else {
          setError('Format de données invalide: indicators n\'est pas un tableau');
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        setIndicators(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setIndicators(response.data);
      } else {
        console.error('❌ Invalid response format:', response);
        setError('Format de données invalide');
      }
    } catch (err: any) {
      console.error('❌ Error fetching indicators:', err);
      setError(err.message || 'Failed to fetch indicators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  return {
    indicators,
    loading,
    error,
    refetch: fetchIndicators,
  };
};

