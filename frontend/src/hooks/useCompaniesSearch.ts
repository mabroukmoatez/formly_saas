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
    console.log('🔄 useEffect triggered - debouncedSearch:', debouncedSearch);
    fetchCompanies();
  }, [debouncedSearch]);

  const fetchCompanies = async () => {
    console.log('🚀 fetchCompanies called');
    setLoading(true);
    try {
      console.log('📞 Calling API with search:', debouncedSearch);
      
      const response = await companiesService.getCompaniesList({
        search: debouncedSearch || undefined,
      });
      
      console.log('📦 Full API Response:', response);
      console.log('✅ response.success:', response.success);
      console.log('📊 response.data:', response.data);
      console.log('🔢 Is array?', Array.isArray(response.data));
      console.log('📏 Array length:', response.data?.length);
      
      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Condition passed, setting companies:', response.data);
        setCompanies(response.data);
        console.log('✅ Companies set successfully');
      } else {
        console.warn('⚠️ Condition failed');
        console.warn('  - response.success:', response.success);
        console.warn('  - Is array:', Array.isArray(response.data));
        setCompanies([]);
      }
    } catch (error) {
      console.error('❌ Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
      console.log('🏁 fetchCompanies finished');
    }
  };

  // ✅ Transformer les données au format attendu
  const companiesOptions = useMemo((): CompanyOption[] => {
    console.log('🔄 useMemo triggered');
    console.log('📦 Raw companies:', companies);
    console.log('📏 Companies length:', companies.length);
    
    if (!Array.isArray(companies) || companies.length === 0) {
      console.warn('⚠️ Companies is empty or not an array');
      return [];
    }
    
    const options = companies.map((company) => {
      console.log('🔄 Transforming company:', company);
      return {
        value: company.id,
        label: company.name,
        city: company.city,
        uuid: company.uuid,
      };
    });
    
    console.log('✅ Transformed options:', options);
    return options;
  }, [companies]);

  // Log final state
  useEffect(() => {
    console.log('📊 Final state - companies:', companies);
    console.log('📊 Final state - companiesOptions:', companiesOptions);
    console.log('📊 Final state - loading:', loading);
  }, [companies, companiesOptions, loading]);

  return {
    companies: companiesOptions,
    rawCompanies: companies,
    loading,
    searchTerm,
    setSearchTerm,
    refetch: fetchCompanies,
  };
};