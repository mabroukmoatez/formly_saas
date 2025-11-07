import { useState, useEffect } from 'react';
import { getDashboardStats, DashboardStats } from '../services/qualityManagement';

/**
 * Hook to fetch and manage quality dashboard data
 * @param skip - If true, skip the initial fetch (use when not initialized)
 */
export const useQualityDashboard = (skip = false) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!skip) {
      fetchDashboardData();
    }
  }, [skip]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDashboardStats();
      
      // The backend wraps the response in { success, data }
      // But getDashboardStats already returns response.data
      // So we check if it has the expected structure
      if (response && typeof response === 'object') {
        setData(response as DashboardStats);
      } else {
        setError('Format de données invalide');
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(
        err.details?.error?.message || 
        err.message || 
        'Une erreur s\'est produite lors du chargement du tableau de bord'
      );
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchDashboardData 
  };
};

