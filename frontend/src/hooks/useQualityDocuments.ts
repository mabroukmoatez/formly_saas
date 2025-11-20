import { useState, useEffect } from 'react';
import { getQualityDocuments, QualityDocument } from '../services/qualityManagement';

interface UseQualityDocumentsReturn {
  documents: QualityDocument[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useQualityDocuments = (type?: 'procedure' | 'model' | 'evidence'): UseQualityDocumentsReturn => {
  const [documents, setDocuments] = useState<QualityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (type) {
        params.type = type;
      }
      
      const response = await getQualityDocuments(params);
      
      console.log('✅ useQualityDocuments response:', response);
      
      // Handle API response structure
      // Backend returns: { success: true, data: { documents: [...], pagination: {...} } }
      if (response && typeof response === 'object') {
        let docsArray: any[] = [];
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { documents: [...] } }
          docsArray = response.data.documents || response.data.data || [];
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          docsArray = response.data;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          docsArray = response;
        } else if (response.documents && Array.isArray(response.documents)) {
          // Structure: { documents: [...] }
          docsArray = response.documents;
        }
        
        if (Array.isArray(docsArray)) {
          setDocuments(docsArray);
        } else {
          console.error('❌ Invalid documents format:', response);
          setError('Format de données invalide: documents n\'est pas un tableau');
        }
      } else {
        console.error('❌ Invalid response format:', response);
        setError('Format de données invalide');
      }
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

