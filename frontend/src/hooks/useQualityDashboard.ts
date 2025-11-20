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
      
      console.log('✅ useQualityDashboard response:', response);
      
      // Handle API response structure
      // Backend returns: { success: true, data: { overview: {...}, indicators: {...}, ... } }
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { overview: {...}, ... } }
          setData(response.data as DashboardStats);
        } else if ('overview' in response || 'indicators' in response) {
          // Direct DashboardStats object: { overview: {...}, indicators: {...}, ... }
          setData(response as DashboardStats);
        } else {
          console.error('❌ Invalid dashboard format:', response);
          setError('Format de données invalide');
        }
      } else {
        console.error('❌ Invalid response format:', response);
        setError('Format de données invalide');
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(
        err.response?.data?.error?.message ||
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

