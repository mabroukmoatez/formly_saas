import { useState, useEffect } from 'react';
import { getLearnerQuestionnaires, Questionnaire } from '../services/learner';

interface UseLearnerQuestionnairesParams {
  status?: 'all' | 'pending' | 'completed' | 'overdue';
  page?: number;
  limit?: number;
}

export const useLearnerQuestionnaires = (params?: UseLearnerQuestionnairesParams) => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerQuestionnaires(params);
      if (response.success && response.data) {
        setQuestionnaires(response.data.questionnaires || []);
        setPagination(response.data.pagination);
      } else {
        setError('Erreur lors du chargement des questionnaires');
      }
    } catch (err: any) {
      console.error('Error fetching questionnaires:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, [params?.status, params?.page]);

  return {
    questionnaires,
    loading,
    error,
    pagination,
    refetch: fetchQuestionnaires
  };
};

