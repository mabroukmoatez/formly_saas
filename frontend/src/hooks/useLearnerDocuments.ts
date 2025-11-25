import { useState, useEffect } from 'react';
import { getLearnerDocuments, LearnerDocument } from '../services/learner';

interface UseLearnerDocumentsParams {
  type?: 'all' | 'session_documents' | 'questionnaires';
  session_id?: number;
  page?: number;
  limit?: number;
}

export const useLearnerDocuments = (params?: UseLearnerDocumentsParams) => {
  const [documents, setDocuments] = useState<LearnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerDocuments(params);
      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
        setPagination(response.data.pagination);
      } else {
        setError('Erreur lors du chargement des documents');
      }
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [params?.type, params?.session_id, params?.page]);

  return {
    documents,
    loading,
    error,
    pagination,
    refetch: fetchDocuments
  };
};

