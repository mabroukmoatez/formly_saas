import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Article } from '../../services/commercial.types';
import { useToast } from '../../components/ui/toast';
import { Plus, Search, Edit, Trash2, Package, ChevronDown, ChevronUp, Menu, ArrowUpDown, FileSpreadsheet } from 'lucide-react';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { ArticleCreationModal } from '../../components/CommercialDashboard/ArticleCreationModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

type SortField = 'reference' | 'designation' | 'category' | 'price_ht' | 'tva' | 'price_ttc' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export const MesArticles = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown]);

  useEffect(() => {
    fetchArticles();
  }, [page, selectedCategory, searchTerm]);

  // Helper function to normalize values
  const normalizeValue = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value;
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await commercialService.getArticles({
        page,
        per_page: 12,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
      });
      if (response.success && response.data) {
        setArticles(response.data.data || []);
        setPagination(response.data.pagination || { total: 0, total_pages: 0 });
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      showError(t('common.error'), 'Impossible de charger les articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(new Set(articles.map(a => String(a.id))));
    } else {
      setSelectedArticles(new Set());
    }
  };

  const handleSelectArticle = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedArticles(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
        case 'price_ht':
          aValue = normalizeValue(a.price_ht || a.unit_price);
          bValue = normalizeValue(b.price_ht || b.unit_price);
          break;
        case 'tva':
          aValue = normalizeValue(a.tva || a.tax_rate);
          bValue = normalizeValue(b.tva || b.tax_rate);
          break;
        case 'price_ttc':
          const aPriceHT = normalizeValue(a.price_ht || a.unit_price);
          const aTVA = normalizeValue(a.tva || a.tax_rate);
          aValue = aPriceHT * (1 + aTVA / 100);
          const bPriceHT = normalizeValue(b.price_ht || b.unit_price);
          const bTVA = normalizeValue(b.tva || b.tax_rate);
          bValue = bPriceHT * (1 + bTVA / 100);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'fr', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [articles, sortField, sortDirection]);

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    
    setDeleting(true);
    try {
      if (articleToDelete === 'bulk') {
        const deletePromises = Array.from(selectedArticles).map(id =>
          commercialService.deleteArticle(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedArticles.size} article(s) supprimé(s) avec succès`);
        setSelectedArticles(new Set());
      } else {
        await commercialService.deleteArticle(articleToDelete);
        success('Article supprimé avec succès');
      }
      fetchArticles();
      setShowDeleteModal(false);
      setArticleToDelete(null);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer l\'article');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteArticle = () => {
    setShowDeleteModal(false);
    setArticleToDelete(null);
  };

  const formatCurrency = (value: number | string | undefined): string => {
    const numValue = normalizeValue(value);
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const calculateTTC = (priceHT: number | string | undefined, tva: number | string | undefined): number => {
    const ht = normalizeValue(priceHT);
    const tvaRate = normalizeValue(tva);
    return ht * (1 + tvaRate / 100);
  };

  const handleExportExcel = async () => {
    try {
      const csvData = sortedArticles.map(article => {
        const priceHT = normalizeValue(article.price_ht || article.unit_price);
        const tva = normalizeValue(article.tva || article.tax_rate);
        const priceTTC = calculateTTC(priceHT, tva);
        return {
          'Référence': article.reference || '',
          'Désignation': article.designation || article.name || '',
          'Catégorie': article.category || '',
          'Montant HT': priceHT,
          'Montant TVA': priceHT * (tva / 100),
          'Montant TTC': priceTTC,
          'Dernière MAJ': formatDate(article.updated_at),
        };
      });
      
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `articles_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      success('Articles exportés avec succès');
    } catch (err) {
      showError('Erreur', 'Impossible d\'exporter les articles');
    }
  };

  const allSelected = selectedArticles.size === articles.length && articles.length > 0;
  const someSelected = selectedArticles.size > 0 && selectedArticles.size < articles.length;

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: primaryColor }}></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Package className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.commercial.mes_articles.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('dashboard.commercial.mes_articles.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              {t('dashboard.commercial.mes_articles.create')}
            </span>
          </Button>
        </div>
      </div>

      {/* Filters and Table Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Search, Export and Delete */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-3 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-[10px]`} style={{ width: '400px' }}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                placeholder="Rechercher Un Article"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setTimeout(() => {
                    if (e.target.value === searchTerm) {
                      fetchArticles();
                    }
                  }, 500);
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
                className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
              />
            </div>

            {/* Export Excel Button */}
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : ''}`}
              style={{ 
                borderColor: isDark ? undefined : primaryColor,
                borderStyle: 'dashed',
              }}
            >
              <FileSpreadsheet className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="font-medium text-sm" style={{ color: primaryColor }}>
                Export Excel
              </span>
            </Button>

            {/* Delete Button */}
            <Button
              variant="outline"
              onClick={() => {
                if (selectedArticles.size === 0) return;
                setShowDeleteModal(true);
                setArticleToDelete('bulk');
              }}
              disabled={selectedArticles.size === 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border-2 border-dashed ${isDark ? 'border-red-700 bg-red-900/20 hover:bg-red-900/30' : 'border-red-500 bg-transparent hover:bg-red-50'} ${selectedArticles.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                borderColor: selectedArticles.size > 0 ? '#ef4444' : undefined,
                borderStyle: 'dashed',
              }}
            >
              <Trash2 className={`w-4 h-4 ${selectedArticles.size > 0 ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`font-medium text-sm ${selectedArticles.size > 0 ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Supprimer {selectedArticles.size > 0 && `(${selectedArticles.size})`}
              </span>
            </Button>
          </div>

          {/* Right: Sort */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={sortDropdownRef}>
              <Button
                variant="outline"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 h-auto rounded-[10px] border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-transparent hover:bg-gray-50'}`}
              >
                <ArrowUpDown className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Trier
                </span>
                <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
              </Button>
              {showSortDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
                  <div className="p-2">
                    {(['reference', 'designation', 'category', 'price_ttc', 'updated_at'] as SortField[]).map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          handleSort(field);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                      >
                        {field === 'reference' && 'Référence'}
                        {field === 'designation' && 'Désignation'}
                        {field === 'category' && 'Catégorie'}
                        {field === 'price_ttc' && 'Montant TTC'}
                        {field === 'updated_at' && 'Dernière MAJ'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {sortedArticles.length === 0 ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('common.noDataFound')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className="w-[50px] px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAllExpanded(!allExpanded)}
                        className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
                      >
                        <Menu className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      </button>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      />
                    </div>
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
                  <TableHead 
                    className={`text-left font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] cursor-pointer hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} px-4 py-3 select-none`}
                    onClick={() => handleSort('price_ht')}
                  >
                    <div className="flex items-center gap-2">
                      Montant HT
                      {sortField === 'price_ht' ? (
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
                    onClick={() => handleSort('tva')}
                  >
                    <div className="flex items-center gap-2">
                      Montant TVA
                      {sortField === 'tva' ? (
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
                    onClick={() => handleSort('price_ttc')}
                  >
                    <div className="flex items-center gap-2">
                      Montant TTC
                      {sortField === 'price_ttc' ? (
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
                    onClick={() => handleSort('updated_at')}
                  >
                    <div className="flex items-center gap-2">
                      Dernière MAJ
                      {sortField === 'updated_at' ? (
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
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px] px-4 py-3`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedArticles.map((article) => {
                  const priceHT = normalizeValue(article.price_ht || article.unit_price);
                  const tva = normalizeValue(article.tva || article.tax_rate);
                  const priceTTC = calculateTTC(priceHT, tva);
                  const tvaAmount = priceHT * (tva / 100);
                  const isSelected = selectedArticles.has(String(article.id));
                  
                  return (
                    <TableRow
                      key={String(article.id)}
                      className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-gray-50'} ${isSelected ? 'bg-[#E3F5FF]' : ''}`}
                    >
                      <TableCell className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectArticle(String(article.id), checked as boolean)}
                          className={`w-5 h-5 rounded-md border ${isSelected ? 'bg-[#2196F3] border-[#2196F3]' : 'bg-white border-[#d5d6da]'}`}
                        />
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} text-[15px]`}>
                        {article.reference || '-'}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : ''} text-[15px]`}>
                        <span style={{ color: primaryColor }} className="cursor-pointer hover:underline">
                          {article.designation || article.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium italic ${isDark ? 'text-gray-300' : 'text-blue-500'} text-[15px]`}>
                        {article.category || 'catégorie'}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {formatCurrency(priceHT)}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {formatCurrency(tvaAmount)}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {formatCurrency(priceTTC)}
                      </TableCell>
                      <TableCell className={`px-4 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {formatDate(article.updated_at)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedArticle(article);
                              setIsEditModalOpen(true);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} transition-all`}
                            title="Modifier"
                          >
                            <Edit className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                          </button>
                          <button 
                            onClick={() => {
                              setArticleToDelete(String(article.id));
                              setShowDeleteModal(true);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} transition-all`}
                            title="Supprimer"
                          >
                            <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 0 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className={`${isDark ? 'border-gray-600' : ''}`}
            >
              {t('common.previous')}
            </Button>
            <span className={`px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('common.page')} {page} {t('common.of')} {pagination.total_pages || 1}
            </span>
            <Button
              variant="outline"
              disabled={page >= (pagination.total_pages || 1)}
              onClick={() => setPage(page + 1)}
              className={`${isDark ? 'border-gray-600' : ''}`}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Article Creation Modal */}
      <ArticleCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedArticle(null);
        }}
        onSave={() => {
          setIsModalOpen(false);
          setSelectedArticle(null);
          fetchArticles();
        }}
      />

      {/* Article Edit Modal */}
      <ArticleCreationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedArticle(null);
        }}
        article={selectedArticle}
        onSave={() => {
          setIsEditModalOpen(false);
          setSelectedArticle(null);
          fetchArticles();
        }}
      />

      {/* Confirmation Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteArticle}
        onConfirm={confirmDeleteArticle}
        title={articleToDelete === 'bulk' 
          ? `Voulez-vous vraiment supprimer ${selectedArticles.size} article(s) ?`
          : "Voulez-vous vraiment supprimer cet article ?"}
        message="Cette action est irréversible. L'article sera définitivement supprimé."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};
