import { useState, useEffect } from 'react';
import { getQualityDocuments, QualityDocument } from '../services/qualityManagement';

interface UseQualityDocumentsReturn {
  documents: QualityDocument[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useQualityDocuments = (type?: 'procedure' | 'template' | 'proof'): UseQualityDocumentsReturn => {
  const [documents, setDocuments] = useState<QualityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📄 Fetching quality documents...', type ? `Type: ${type}` : 'All types');
      
      const data = await getQualityDocuments(type);
      console.log('✅ Documents fetched:', data);
      
      // API returns {documents: [...]} or array directly
      // Extract only the documents array
      const documentsArray = Array.isArray(data) ? data : (data.documents || []);
      setDocuments(documentsArray);
    } catch (err: any) {
      console.error('❌ Error fetching documents:', err);
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [type]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
};

