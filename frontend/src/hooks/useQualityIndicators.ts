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
      console.log('📊 Fetching quality indicators...');
      
      const data = await getQualityIndicators();
      console.log('✅ Indicators fetched:', data);
      
      // API returns {indicators: [...], summary: {...}}
      // Extract only the indicators array
      const indicatorsArray = Array.isArray(data) ? data : (data.indicators || []);
      setIndicators(indicatorsArray);
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

