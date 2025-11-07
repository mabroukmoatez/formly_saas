import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

export interface VariableDefinition {
  key: string;
  label: string;
  description: string;
  example: string;
  category: 'student' | 'course' | 'organization' | 'date' | 'custom';
}

export const AVAILABLE_VARIABLES: VariableDefinition[] = [
  // Student variables
  { key: '{{student_name}}', label: 'Nom de l\'étudiant', description: 'Nom complet de l\'étudiant', example: 'Jean Dupont', category: 'student' },
  { key: '{{student_first_name}}', label: 'Prénom de l\'étudiant', description: 'Prénom de l\'étudiant', example: 'Jean', category: 'student' },
  { key: '{{student_last_name}}', label: 'Nom de famille', description: 'Nom de famille de l\'étudiant', example: 'Dupont', category: 'student' },
  { key: '{{student_email}}', label: 'Email de l\'étudiant', description: 'Adresse email de l\'étudiant', example: 'jean.dupont@example.com', category: 'student' },
  { key: '{{student_phone}}', label: 'Téléphone de l\'étudiant', description: 'Numéro de téléphone', example: '+33 6 12 34 56 78', category: 'student' },
  
  // Course variables
  { key: '{{course_name}}', label: 'Nom du cours', description: 'Titre du cours', example: 'Formation React Avancé', category: 'course' },
  { key: '{{course_description}}', label: 'Description du cours', description: 'Description complète du cours', example: 'Apprenez React...', category: 'course' },
  { key: '{{course_duration}}', label: 'Durée du cours', description: 'Durée en heures', example: '40 heures', category: 'course' },
  { key: '{{course_start_date}}', label: 'Date de début', description: 'Date de début du cours', example: '15/01/2024', category: 'course' },
  { key: '{{course_end_date}}', label: 'Date de fin', description: 'Date de fin du cours', example: '20/02/2024', category: 'course' },
  
  // Organization variables
  { key: '{{organization_name}}', label: 'Nom de l\'organisation', description: 'Nom de l\'organisation', example: 'FormaLy', category: 'organization' },
  { key: '{{organization_address}}', label: 'Adresse de l\'organisation', description: 'Adresse complète', example: '123 Rue Example, 75001 Paris', category: 'organization' },
  { key: '{{organization_email}}', label: 'Email de l\'organisation', description: 'Email de contact', example: 'contact@formaly.com', category: 'organization' },
  { key: '{{organization_phone}}', label: 'Téléphone de l\'organisation', description: 'Numéro de téléphone', example: '+33 1 23 45 67 89', category: 'organization' },
  
  // Entreprise/Company variables (for corporate training)
  { key: '{{entreprise_name}}', label: 'Nom de l\'entreprise', description: 'Nom de l\'entreprise cliente', example: 'Acme Corp', category: 'organization' },
  { key: '{{entreprise_siret}}', label: 'SIRET', description: 'Numéro SIRET de l\'entreprise', example: '123 456 789 00012', category: 'organization' },
  { key: '{{entreprise_address}}', label: 'Adresse de l\'entreprise', description: 'Adresse de l\'entreprise', example: '456 Avenue Client, 69000 Lyon', category: 'organization' },
  
  // Date variables
  { key: '{{current_date}}', label: 'Date actuelle', description: 'Date du jour au format long', example: '15 janvier 2024', category: 'date' },
  { key: '{{current_date_short}}', label: 'Date actuelle (court)', description: 'Date du jour au format court', example: '15/01/2024', category: 'date' },
  { key: '{{current_year}}', label: 'Année actuelle', description: 'Année en cours', example: '2024', category: 'date' },
];

interface VariableSelectorProps {
  selectedVariables: Record<string, string>;
  onVariablesChange: (variables: Record<string, string>) => void;
  availableVariables?: VariableDefinition[];
  customVariables?: Array<{ key: string; label: string }>;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  selectedVariables,
  onVariablesChange,
  availableVariables = AVAILABLE_VARIABLES,
  customVariables = []
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', 'student', 'course', 'organization', 'date', 'custom'] as const;
  const categoryLabels: Record<string, string> = {
    all: 'Toutes',
    student: 'Étudiant',
    course: 'Cours',
    organization: 'Organisation/Entreprise',
    date: 'Dates',
    custom: 'Personnalisées'
  };

  const filteredVariables = availableVariables.filter(v => {
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    const matchesSearch = v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVariableSelect = (variable: VariableDefinition) => {
    // Add or update variable value
    const newVariables = {
      ...selectedVariables,
      [variable.key]: selectedVariables[variable.key] || ''
    };
    onVariablesChange(newVariables);
  };

  const handleVariableValueChange = (key: string, value: string) => {
    onVariablesChange({
      ...selectedVariables,
      [key]: value
    });
  };

  const handleRemoveVariable = (key: string) => {
    const newVariables = { ...selectedVariables };
    delete newVariables[key];
    onVariablesChange(newVariables);
  };

  return (
    <div className={`border rounded-[5px] ${isDark ? 'border-gray-600 bg-gray-800' : 'border-[#6a90b9] bg-white'}`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Label className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Variables Dynamiques
          </Label>
          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {Object.keys(selectedVariables).length} sélectionnée(s)
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`border-t p-4 space-y-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Search and Filter */}
          <div className="space-y-2">
            <Input
              placeholder="Rechercher une variable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
            />
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs transition ${
                    selectedCategory === cat
                      ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                      : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Available Variables List */}
          <div className={`max-h-48 overflow-y-auto space-y-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} p-3 rounded`}>
            {filteredVariables.length === 0 ? (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Aucune variable trouvée
              </p>
            ) : (
              filteredVariables.map(variable => (
                <div
                  key={variable.key}
                  className={`p-2 rounded border cursor-pointer transition ${
                    selectedVariables[variable.key] !== undefined
                      ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleVariableSelect(variable)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {variable.label}
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {variable.description}
                      </div>
                      <code className={`text-xs mt-1 block ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        {variable.key}
                      </code>
                    </div>
                    {selectedVariables[variable.key] !== undefined && (
                      <X 
                        className="w-4 h-4 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVariable(variable.key);
                        }}
                      />
                    )}
                  </div>
                  {selectedVariables[variable.key] !== undefined && (
                    <div className="mt-2">
                      <Input
                        placeholder={`Valeur: ${variable.example}`}
                        value={selectedVariables[variable.key]}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleVariableValueChange(variable.key, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-sm ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selected Variables Summary */}
          {Object.keys(selectedVariables).length > 0 && (
            <div className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Variables sélectionnées ({Object.keys(selectedVariables).length})
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(selectedVariables).map(key => {
                  const variable = availableVariables.find(v => v.key === key);
                  return (
                    <div
                      key={key}
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <span>{variable?.label || key}</span>
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleRemoveVariable(key)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className={`text-xs p-2 rounded ${isDark ? 'bg-blue-900/20 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            💡 Utilisez ces variables dans vos templates. Elles seront remplacées automatiquement lors de la génération du document.
          </div>
        </div>
      )}
    </div>
  );
};

