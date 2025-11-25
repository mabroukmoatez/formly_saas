import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Article } from '../../services/commercial.types';
import { useToast } from '../ui/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface ArticleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle?: (article: Article) => void; // For single selection (optional)
  onSelectArticles?: (articles: Article[]) => void; // For multiple selection (preferred)
}

export const ArticleSearchModal: React.FC<ArticleSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  onSelectArticles,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'reference' | 'designation' | 'category'>('reference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
      setSelectedArticles(new Set());
      console.log('Modal opened - isMultipleMode:', !!onSelectArticles, 'onSelectArticles provided:', !!onSelectArticles, 'onSelectArticle provided:', !!onSelectArticle);
    }
  }, [isOpen, searchTerm, onSelectArticles, onSelectArticle]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await commercialService.getArticles({
        page: 1,
        per_page: 100, // Increase to show more articles
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setArticles(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      showError('Erreur', 'Impossible de charger les articles');
    } finally {
      setLoading(false);
    }
  };

  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'reference':
          aValue = a.reference || '';
          bValue = b.reference || '';
          break;
        case 'designation':
          aValue = a.designation || a.name || '';
          bValue = b.designation || b.name || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'fr', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [articles, sortField, sortDirection]);

  const handleSort = (field: 'reference' | 'designation' | 'category') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleArticleSelection = (article: Article) => {
    console.log('toggleArticleSelection called for article:', article.id, 'current selection:', Array.from(selectedArticles));
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(String(article.id))) {
      newSelected.delete(String(article.id));
      console.log('Article deselected, new size:', newSelected.size);
    } else {
      newSelected.add(String(article.id));
      console.log('Article selected, new size:', newSelected.size);
    }
    setSelectedArticles(newSelected);
    console.log('Updated selectedArticles:', Array.from(newSelected));
  };

  // Determine if we're in multiple selection mode
  // If onSelectArticles is provided, always use multiple mode (ignore onSelectArticle)
  const isMultipleMode = !!onSelectArticles;
  
  // Debug: Always log the mode when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('=== ArticleSearchModal Debug ===');
      console.log('isMultipleMode:', isMultipleMode);
      console.log('onSelectArticles provided:', !!onSelectArticles);
      console.log('onSelectArticle provided:', !!onSelectArticle);
      console.log('selectedArticles.size:', selectedArticles.size);
    }
  }, [isOpen, isMultipleMode, onSelectArticles, onSelectArticle, selectedArticles.size]);


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(new Set(sortedArticles.map(a => String(a.id))));
    } else {
      setSelectedArticles(new Set());
    }
  };

  const handleConfirmSelection = () => {
    console.log('handleConfirmSelection called', { 
      hasOnSelectArticles: !!onSelectArticles, 
      selectedCount: selectedArticles.size,
      selectedIds: Array.from(selectedArticles),
      sortedArticlesCount: sortedArticles.length
    });
    
    if (!onSelectArticles) {
      console.warn('onSelectArticles not provided, cannot confirm multiple selection');
      return;
    }
    
    if (selectedArticles.size === 0) {
      console.warn('No articles selected');
      return;
    }
    
    const selected = sortedArticles.filter(a => selectedArticles.has(String(a.id)));
    console.log('Calling onSelectArticles with', selected.length, 'articles:', selected.map(a => ({ id: a.id, reference: a.reference })));
    
    if (selected.length > 0) {
      onSelectArticles(selected);
      setSelectedArticles(new Set()); // Clear selection
      onClose();
    }
  };

  const allSelected = sortedArticles.length > 0 && sortedArticles.every(a => selectedArticles.has(String(a.id)));
  const someSelected = sortedArticles.some(a => selectedArticles.has(String(a.id))) && !allSelected;

  if (!isOpen) return null;

  console.log('Rendering modal - isMultipleMode:', isMultipleMode, 'onSelectArticles:', !!onSelectArticles, 'selectedArticles.size:', selectedArticles.size);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        // Prevent closing when clicking overlay in multiple mode
        if (isMultipleMode && e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Prevented closing modal in multiple mode (overlay click)');
          return;
        }
        // Allow closing in single mode
        if (!isMultipleMode && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`relative w-[90%] max-w-[900px] max-h-[85vh] overflow-hidden rounded-lg border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Articles
          </h2>
          
          {/* Search Bar - Centered */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg flex-1 mx-8 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ maxWidth: '400px' }}>
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
            <Input
              placeholder="Rechercher Un Article"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
            onClick={onClose}
          >
            <X className="h-5 w-5" style={{ color: primaryColor }} />
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto`} style={{ borderColor: primaryColor }}></div>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
              </div>
            </div>
          ) : sortedArticles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Aucun article trouvé
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700 hover:bg-transparent' : 'border-gray-200 hover:bg-transparent'}`}>
                  <TableHead className="w-[50px] px-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      style={someSelected && !allSelected ? { opacity: 0.7 } : {}}
                    />
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center gap-2">
                      Référence
                      {sortField === 'reference' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('designation')}
                  >
                    <div className="flex items-center gap-2">
                      Désignation
                      {sortField === 'designation' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Catégorie
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-100" style={{ color: primaryColor }} />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedArticles.map((article) => (
                  <TableRow
                    key={String(article.id)}
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} ${selectedArticles.has(String(article.id)) ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''} cursor-pointer`}
                    onClick={(e) => {
                      // Don't stop propagation completely, just prevent closing
                      const target = e.target as HTMLElement;
                      // Skip if clicking on checkbox
                      if (target.closest('input[type="checkbox"]') || target.closest('[role="checkbox"]')) {
                        return;
                      }
                      
                      console.log('TableRow clicked, isMultipleMode:', isMultipleMode, 'article.id:', article.id);
                      
                      // CRITICAL: In multiple mode, NEVER close the modal
                      if (isMultipleMode) {
                        console.log('Multiple mode - toggling selection, NOT closing modal');
                        toggleArticleSelection(article);
                        // DO NOT CLOSE MODAL
                        return;
                      }
                      
                      // Single mode - select and close
                      if (onSelectArticle && !onSelectArticles) {
                        console.log('Single mode - selecting and closing');
                        onSelectArticle(article);
                        onClose();
                      }
                    }}
                  >
                    <TableCell className="px-4 py-4" onClick={(e) => {
                      e.stopPropagation();
                    }}>
                      <Checkbox
                        checked={selectedArticles.has(String(article.id))}
                        onCheckedChange={(checked) => {
                          console.log('Checkbox onCheckedChange:', checked, 'isMultipleMode:', isMultipleMode, 'article.id:', article.id);
                          // ALWAYS use multiple mode if onSelectArticles is provided
                          if (isMultipleMode) {
                            // Multiple selection mode - just toggle (modal stays open)
                            console.log('Checkbox clicked in multiple mode - toggling');
                            toggleArticleSelection(article);
                            // DO NOT CLOSE MODAL
                          } else if (onSelectArticle && !onSelectArticles) {
                            // Single selection mode - select and close
                            console.log('Checkbox clicked in single mode - selecting and closing');
                            onSelectArticle(article);
                            onClose();
                          }
                        }}
                        className={`w-5 h-5 rounded-md border ${selectedArticles.has(String(article.id)) ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      />
                    </TableCell>
                    <TableCell className={`px-4 py-4 font-medium text-[15px]`} style={{ color: primaryColor }}>
                      {article.reference || '-'}
                    </TableCell>
                    <TableCell className={`px-4 py-4 font-medium text-[15px]`} style={{ color: primaryColor }}>
                      {article.designation || article.name || 'Article sans nom'}
                    </TableCell>
                    <TableCell className={`px-4 py-4 font-medium text-[15px]`} style={{ color: primaryColor }}>
                      {article.category || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isMultipleMode ? (
              <span>{selectedArticles.size} article(s) sélectionné(s)</span>
            ) : (
              <span>Cliquez sur un article pour l'ajouter</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className={isDark ? 'bg-gray-800 border-gray-600' : ''}
            >
              Annuler
            </Button>
            {/* Always show Add button if onSelectArticles is provided */}
            {(isMultipleMode || onSelectArticles) && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Add button clicked, selectedArticles:', selectedArticles.size, 'selectedIds:', Array.from(selectedArticles));
                  handleConfirmSelection();
                }}
                disabled={selectedArticles.size === 0}
                style={{ 
                  backgroundColor: selectedArticles.size > 0 ? primaryColor : '#9CA3AF',
                  opacity: selectedArticles.size > 0 ? 1 : 0.5
                }}
                className="text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                Ajouter {selectedArticles.size > 0 && `(${selectedArticles.size})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

