import { useState, useEffect } from 'react';
import { getLearnerDashboardStats, DashboardStats } from '../services/learner';

export const useLearnerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

