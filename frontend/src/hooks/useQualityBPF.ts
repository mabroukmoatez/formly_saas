import { useState, useEffect, useCallback } from 'react';
import { getQualityBPFs, getQualityBPF, getBPFArchives, QualityBPF } from '../services/qualityManagement';

interface BPFArchive {
  id: number;
  year: number;
  status: 'submitted' | 'approved';
  submittedDate: string;
  createdAt: string;
  data: any;
}

interface UseQualityBPFReturn {
  currentBPF: QualityBPF | null;
  archives: BPFArchive[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchArchives: () => Promise<void>;
}

export const useQualityBPF = (): UseQualityBPFReturn => {
  const [currentBPF, setCurrentBPF] = useState<QualityBPF | null>(null);
  const [archives, setArchives] = useState<BPFArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentBPF = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await getQualityBPFs({ year: currentYear, status: 'draft' });
      
      console.log('✅ useQualityBPF (current) response:', response);
      
      // Handle API response structure
      // Backend returns: { success: true, data: { bpfs: [...] } }
      if (response && typeof response === 'object') {
        let bpfsArray: any[] = [];
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { bpfs: [...] } }
          bpfsArray = response.data.bpfs || response.data.data || [];
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          bpfsArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          bpfsArray = response.data;
        } else if (response.bpfs && Array.isArray(response.bpfs)) {
          // Structure: { bpfs: [...] }
          bpfsArray = response.bpfs;
        }
        
        const bpfs = Array.isArray(bpfsArray) ? bpfsArray : [];
        // Get the most recent draft BPF for current year
        const draftBPF = bpfs.find((bpf: QualityBPF) => bpf.year === currentYear && bpf.status === 'draft') || null;
        setCurrentBPF(draftBPF);
      }
    } catch (err: any) {
      console.error('Error fetching current BPF:', err);
      // Don't set error for current BPF, it might not exist yet
    }
  }, []);

  const fetchArchives = useCallback(async () => {
    try {
      const response = await getBPFArchives();
      
      console.log('✅ useQualityBPF (archives) response:', response);
      
      // Handle API response structure
      // Backend returns: { success: true, data: { archives: [...] } }
      if (response && typeof response === 'object') {
        let archivesArray: any[] = [];
        
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { archives: [...] } }
          archivesArray = response.data.archives || response.data.data || [];
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          archivesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          archivesArray = response.data;
        } else if (response.archives && Array.isArray(response.archives)) {
          // Structure: { archives: [...] }
          archivesArray = response.archives;
        }
        
        setArchives(Array.isArray(archivesArray) ? archivesArray : []);
      }
    } catch (err: any) {
      console.error('Error fetching BPF archives:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des archives');
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchCurrentBPF(), fetchArchives()]);
    setLoading(false);
  }, [fetchCurrentBPF, fetchArchives]);

  const refetchArchives = useCallback(async () => {
    await fetchArchives();
  }, [fetchArchives]);

  useEffect(() => {
    refetch();
  }, []);

  return {
    currentBPF,
    archives,
    loading,
    error,
    refetch,
    refetchArchives,
  };
};

