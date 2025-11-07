import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/adminManagement';
import type { AdminDashboardStats } from '../services/adminManagement.types';

interface UseAdminDashboardReturn {
  stats: AdminDashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: (period?: 'week' | 'month' | 'year') => Promise<void>;
}

export const useAdminDashboard = (initialPeriod?: 'week' | 'month' | 'year'): UseAdminDashboardReturn => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (period?: 'week' | 'month' | 'year') => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Fetching admin dashboard stats...');
      
      const data = await getDashboardStats(period || initialPeriod);
      console.log('✅ Dashboard stats fetched:', data);
      
      setStats(data);
    } catch (err: any) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(initialPeriod);
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

