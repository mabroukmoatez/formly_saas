import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FileText, Search, Plus, Loader2, Eye, Star, Trash2, Edit, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';
import { QualityArticleFormModal } from '../../components/SuperAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

export const QualityArticles: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | undefined>();
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, showFeaturedOnly]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getQualityArticles({
        search: searchTerm || undefined,
        featured: showFeaturedOnly ? true : undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // API returns data in data.articles format
        const articlesData = response.data.articles || response.data;
        setArticles(Array.isArray(articlesData) ? articlesData : []);
        setPagination(response.data.pagination || response.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      showError('Erreur', error.message || 'Impossible de charger les articles');
      setArticles([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (articleId: number) => {
    try {
      await superAdminService.toggleArticleFeatured(articleId);
      success('Succès', 'Article mis à jour');
      fetchArticles();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const handleDeleteArticle = async () => {
    if (!selectedArticle) return;
    setDeleting(true);
    try {
      await superAdminService.deleteQualityArticle(selectedArticle.id);
      success('Succès', 'Article supprimé');
      setShowDeleteModal(false);
      setSelectedArticle(null);
      fetchArticles();
    } catch (error: any) {
      showError('Erreur', error.message);
    } finally {
      setDeleting(false);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-blue-500/10">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Articles Qualité
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gérer les articles qualité Qualiopi pour les organisations
            </p>
          </div>
        </div>
        <Button 
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => {
            setEditingArticleId(undefined);
            setShowArticleModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer un article
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher des articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchArticles()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <Button
          variant={showFeaturedOnly ? 'default' : 'outline'}
          onClick={() => {
            setShowFeaturedOnly(!showFeaturedOnly);
            setCurrentPage(1);
          }}
        >
          <Star className="w-4 h-4 mr-2" />
          Featured
        </Button>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucun article trouvé
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => {
                  const contentText = stripHtml(article.content || '');
                  const summary = article.summary || contentText.substring(0, 150);
                  
                  return (
                    <Card
                      key={article.id}
                      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                                {article.title}
                              </h3>
                              {article.is_featured && (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs mb-3">
                              {article.category || 'Général'}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-3 mb-4`}>
                          {summary}
                          {summary.length >= 150 && '...'}
                        </p>

                        {article.assigned_organizations_count > 0 && (
                          <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {article.assigned_organizations_count} organisation{article.assigned_organizations_count > 1 ? 's' : ''}
                          </p>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedArticle(article);
                              setShowDetailsModal(true);
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingArticleId(article.id);
                              setShowArticleModal(true);
                            }}
                            title="Modifier"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleFeatured(article.id)}
                            title={article.is_featured ? 'Retirer des favoris' : 'Mettre en avant'}
                          >
                            <Star className={`w-3 h-3 ${article.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedArticle(article);
                              setShowDeleteModal(true);
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} articles)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage === pagination.last_page} onClick={() => setCurrentPage(currentPage + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Article Form Modal */}
      <QualityArticleFormModal
        isOpen={showArticleModal}
        onClose={() => {
          setShowArticleModal(false);
          setEditingArticleId(undefined);
        }}
        onSuccess={() => {
          fetchArticles();
        }}
        articleId={editingArticleId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedArticle(null);
        }}
        onConfirm={handleDeleteArticle}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer l'article "${selectedArticle?.title}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
        variant="destructive"
      />

      {/* Article Details Modal */}
      {showDetailsModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowDetailsModal(false)}>
          <Card 
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedArticle.title}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedArticle.category || 'Général'}
                  </Badge>
                  {selectedArticle.is_featured && (
                    <Badge className="bg-yellow-500/10 text-yellow-500">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                      Featured
                    </Badge>
                  )}
                </div>

                {selectedArticle.summary && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Résumé</h3>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedArticle.summary}</p>
                  </div>
                )}

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Contenu</h3>
                  <div 
                    className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
                  />
                </div>

                {selectedArticle.assigned_organizations_count > 0 && (
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Assigné à {selectedArticle.assigned_organizations_count} organisation{selectedArticle.assigned_organizations_count > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

