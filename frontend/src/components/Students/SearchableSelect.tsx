import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

// ✅ Type flexible qui accepte les deux formats
interface Option {
  id?: number;           // Format original
  value?: number;        // Nouveau format
  name?: string;         // Format original
  label?: string;        // Nouveau format
  city?: string;
}

interface SearchableSelectProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  options: Option[];
  loading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
  onSearchChange?: (search: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  loading = false,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  noOptionsMessage = 'No options found',
  onSearchChange,
  error,
  label,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Fonction helper pour obtenir l'ID (compatible avec les deux formats)
  const getOptionId = (option: Option): number => {
    return option.value ?? option.id ?? 0;
  };

  // ✅ Fonction helper pour obtenir le nom (compatible avec les deux formats)
  const getOptionName = (option: Option): string => {
    return option.label ?? option.name ?? '';
  };

  // ✅ Trouver l'option sélectionnée (compatible avec les deux formats)
  const selectedOption = options.find(opt => getOptionId(opt) === value);

  // ✅ Filtrer localement si pas de recherche serveur
  const filteredOptions = onSearchChange 
    ? options 
    : options.filter(opt => 
        getOptionName(opt).toLowerCase().includes(searchTerm.toLowerCase())
      );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);

  const handleSelect = (option: Option) => {
    const optionId = getOptionId(option);
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Selected Value Display */}
      <div
        className={`
          w-full px-3 py-2 border rounded-md cursor-pointer
          flex items-center justify-between
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          hover:border-gray-400 transition-colors
          bg-white
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? (
            <div>
              <div className="font-medium">{getOptionName(selectedOption)}</div>
              {selectedOption.city && (
                <div className="text-xs text-gray-500">{selectedOption.city}</div>
              )}
            </div>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center space-x-1">
          {selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                Chargement...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {noOptionsMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const optionId = getOptionId(option);
                const optionName = getOptionName(option);
                
                return (
                  <div
                    key={optionId}
                    className={`
                      px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors
                      ${value === optionId ? 'bg-blue-50 text-blue-700' : ''}
                    `}
                    onClick={() => handleSelect(option)}
                  >
                    <div className="font-medium">{optionName}</div>
                    {option.city && (
                      <div className="text-xs text-gray-500">{option.city}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};