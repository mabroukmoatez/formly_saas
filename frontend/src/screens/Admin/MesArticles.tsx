import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { commercialService } from '../../services/commercial';
import { Article } from '../../services/commercial.types';
import { useToast } from '../../components/ui/toast';
import { Plus, Search, Download, Eye, Edit, Trash2, Package } from 'lucide-react';
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

  useEffect(() => {
    fetchArticles();
  }, [page, selectedCategory]);

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
      setSelectedArticles(new Set(articles.map(a => a.id)));
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

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    
    setDeleting(true);
    try {
      if (articleToDelete === 'bulk') {
        // Delete multiple articles
        const deletePromises = Array.from(selectedArticles).map(id =>
          commercialService.deleteArticle(id)
        );
        await Promise.all(deletePromises);
        success(`${selectedArticles.size} article(s) supprimé(s) avec succès`);
        setSelectedArticles(new Set());
      } else {
        // Delete single article
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
        {/* Filters and Actions */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-4 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} rounded-[10px]`} style={{ width: '400px' }}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                placeholder={t('dashboard.commercial.mes_articles.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
                className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Export to CSV
                    const csvData = articles.map(article => ({
                      'Référence': article.reference || '',
                      'Nom': article.designation || article.name || '',
                      'Prix HT': parseFloat(String(article.price_ht || article.unit_price || 0)),
                      'TVA': parseFloat(String(article.tva || article.tax_rate || 0)),
                      'Catégorie': article.category || '',
                    }));
                    
                    const csv = [
                      Object.keys(csvData[0]).join(','),
                      ...csvData.map(row => Object.values(row).join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
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
                }}
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 h-auto rounded-[10px] border border-dashed ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-[#6a90b9] bg-transparent hover:bg-[#f5f5f5]'}`}
              >
                <Download className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-[#698eac]'}`} />
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#698eac]'} text-[13px]`}>
                  {t('common.export')}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (selectedArticles.size === 0) return;
                  setShowDeleteModal(true);
                  setArticleToDelete('bulk');
                }}
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 h-auto rounded-[10px] border border-dashed ${isDark ? 'border-red-700 bg-red-900/20 hover:bg-red-900/30' : 'border-[#fe2f40] bg-transparent hover:bg-[#fff5f5]'}`}
                disabled={selectedArticles.size === 0}
              >
                <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-[#fe2f40]'}`} />
                <span className={`font-medium ${isDark ? 'text-red-400' : 'text-[#fe2f40]'} text-[13px]`}>
                  {t('common.delete')} ({selectedArticles.size})
                </span>
              </Button>
            </div>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
          >
            <option value="">{t('dashboard.commercial.mes_articles.all_categories')}</option>
            <option value="service">{t('dashboard.commercial.mes_articles.categories.service')}</option>
            <option value="product">{t('dashboard.commercial.mes_articles.categories.product')}</option>
          </select>
        </div>

        {articles.length === 0 ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('common.noDataFound')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className="w-[80px] px-[42px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                    />
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Référence
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Désignation
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Catégorie
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Prix unitaire
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Stock
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow
                    key={article.id}
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-[#007aff14]'} ${selectedArticles.has(article.id) ? 'bg-[#007aff14]' : ''}`}
                  >
                    <TableCell className="px-[42px]">
                      <Checkbox
                        checked={selectedArticles.has(article.id)}
                        onCheckedChange={(checked) => handleSelectArticle(article.id, checked as boolean)}
                        className={`w-5 h-5 rounded-md border ${selectedArticles.has(article.id) ? 'bg-[#007aff14] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                      />
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {article.reference}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {article.name || article.designation}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {article.category || '-'}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                        parseFloat(String(article.unit_price || article.price_ht || 0))
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={article.stock_quantity !== undefined && article.stock_quantity < (article.min_stock || 0) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                        {article.stock_quantity !== undefined ? `${article.stock_quantity} ${article.unit || 'unités'}` : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => {
                            setSelectedArticle(article);
                            setIsEditModalOpen(true);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedArticle(article);
                            setIsEditModalOpen(true);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button 
                          onClick={() => {
                            setArticleToDelete(article.id);
                            setShowDeleteModal(true);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:bg-red-50`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {t('common.page')} {page} {t('common.of')} {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              disabled={page === pagination.total_pages}
              onClick={() => setPage(page + 1)}
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
