import { useState, useEffect, useMemo } from 'react';
import { companiesService, Company } from '../services/Companies';
import { useDebounce } from './useDebounce';

interface CompanyOption {
  value: number;
  label: string;
  city?: string;
  uuid?: string;
}

export const useCompaniesSearch = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchCompanies();
  }, [debouncedSearch]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await companiesService.getCompaniesList({
        search: debouncedSearch || undefined,
      });
      
      
      if (response.success && Array.isArray(response.data)) {
        setCompanies(response.data);
      } else {
        console.warn('⚠️ Condition failed');
        setCompanies([]);
      }
    } catch (error) {
      console.error('❌ Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Transformer les données au format attendu
  const companiesOptions = useMemo((): CompanyOption[] => {
    if (!Array.isArray(companies) || companies.length === 0) {
      return [];
    }
    
    const options = companies.map((company) => {
      return {
        value: company.id,
        label: company.name,
        city: company.city,
        uuid: company.uuid,
      };
    });
    return options;
  }, [companies]);

  return {
    companies: companiesOptions,
    rawCompanies: companies,
    loading,
    searchTerm,
    setSearchTerm,
    refetch: fetchCompanies,
  };
};