import React, { useState, useEffect } from 'react';
import { Search, Loader2, Building2, MapPin, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';

interface CompanyData {
  siret: string;
  siren: string;
  company_name: string;
  enseigne?: string;
  address: string;
  postal_code: string;
  city: string;
  country?: string;
  tva_number?: string;
  is_active: boolean;
}

interface InseeSearchInputProps {
  onSelect: (company: CompanyData) => void;
  placeholder?: string;
  isDark?: boolean;
}

export const InseeSearchInput: React.FC<InseeSearchInputProps> = ({
  onSelect,
  placeholder = 'SIRET, SIREN ou nom d\'entreprise...',
}) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchCompany();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [query]);

  const searchCompany = async () => {
    setLoading(true);
    
    try {
      const response = await apiService.get<any>(
        `/api/organization/commercial/insee/search?q=${encodeURIComponent(query)}`
      );

      if (response.success && response.data) {
        const data = response.data;
        
        if (data.type === 'name') {
          // Multiple results
          setResults(data.results || []);
          setShowResults(true);
        } else {
          // Single result (SIRET/SIREN)
          if (data.result) {
            setResults([data.result]);
            setShowResults(true);
          }
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    } catch (error: any) {
      console.error('Erreur recherche INSEE:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: CompanyData) => {
    onSelect(company);
    setQuery(company.company_name);
    setShowResults(false);
    setResults([]);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <Search className="w-4 h-4 text-gray-400" />
        )}
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`border-0 bg-transparent ${isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
        />
      </div>

      {/* Autocomplete Results */}
      {showResults && results.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-2 max-h-[300px] overflow-y-auto rounded-lg border shadow-lg z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {results.map((company, index) => (
            <div
              key={company.siret + index}
              onClick={() => handleSelect(company)}
              className={`p-4 cursor-pointer border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} last:border-b-0 transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {company.company_name}
                    </h4>
                    {!company.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                        Fermée
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {company.address}, {company.postal_code} {company.city}
                    </p>
                  </div>
                  <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span className="font-mono">SIRET: {company.siret}</span>
                    {company.tva_number && (
                      <span className="ml-3 font-mono">TVA: {company.tva_number}</span>
                    )}
                  </div>
                </div>
                <Check className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && results.length === 0 && !loading && query.length >= 3 && (
        <div className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-lg border shadow-lg z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Aucune entreprise trouvée
          </p>
        </div>
      )}
    </div>
  );
};

