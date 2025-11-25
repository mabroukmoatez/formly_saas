import { useState, useEffect } from 'react';
import { getLearnerCourses, LearnerCourse } from '../services/learner';

interface UseLearnerCoursesParams {
  status?: 'all' | 'in_progress' | 'completed' | 'not_started';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'progress' | 'name' | 'start_date' | 'end_date';
}

export const useLearnerCourses = (params?: UseLearnerCoursesParams) => {
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerCourses(params);
      if (response.success && response.data) {
        setCourses(response.data.courses || []);
        setPagination(response.data.pagination);
      } else {
        setError('Erreur lors du chargement des formations');
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [params?.status, params?.category, params?.search, params?.page, params?.sort]);

  return {
    courses,
    loading,
    error,
    pagination,
    refetch: fetchCourses
  };
};

