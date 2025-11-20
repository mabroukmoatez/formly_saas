import { useState, useEffect, useCallback } from 'react';
import { getQualityTasks, QualityTask } from '../services/qualityManagement';

interface UseQualityTasksReturn {
  tasks: QualityTask[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useQualityTasks = (params?: {
  category_id?: number;
  status?: 'todo' | 'in_progress' | 'done' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}): UseQualityTasksReturn => {
  const [tasks, setTasks] = useState<QualityTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getQualityTasks(params);
      
      console.log('✅ useQualityTasks response:', response);
      
      // Handle different response structures
      // Backend returns: { success: true, data: { tasks: [...] } }
      if (response && typeof response === 'object') {
        let tasksArray: any[] = [];
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { tasks: [...] } }
          tasksArray = response.data.tasks || response.data.data || [];
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          tasksArray = response.data;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          tasksArray = response;
        } else if (response.tasks && Array.isArray(response.tasks)) {
          // Structure: { tasks: [...] }
          tasksArray = response.tasks;
        }
        
        if (Array.isArray(tasksArray)) {
          setTasks(tasksArray);
        } else {
          console.error('❌ Invalid tasks format:', response);
          setError('Format de données invalide: tasks n\'est pas un tableau');
        }
      } else {
        console.error('❌ Invalid response format:', response);
        setError('Format de données invalide');
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  }, [params?.category_id, params?.status, params?.priority]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
};

