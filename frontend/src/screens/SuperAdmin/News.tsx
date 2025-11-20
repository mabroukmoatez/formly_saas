import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Newspaper, Search, Plus, Loader2, Eye, Send, Trash2, Edit } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const News: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'regulation', label: 'Réglementations' },
    { value: 'update', label: 'Mises à jour' },
    { value: 'announcement', label: 'Annonces' },
  ];

  useEffect(() => {
    fetchNews();
  }, [currentPage, selectedCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getNews({
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // API might return data in data.news or data.articles format
        const newsData = response.data.news || response.data.articles || response.data;
        setNews(Array.isArray(newsData) ? newsData : []);
        setPagination(response.data.pagination || response.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching news:', error);
      showError('Erreur', error.message || 'Impossible de charger les actualités');
      setNews([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNews = async (newsId: number) => {
    try {
      await superAdminService.publishNews(newsId);
      success('Succès', 'Actualité publiée');
      fetchNews();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    
    try {
      await superAdminService.deleteNews(newsId);
      success('Succès', 'Actualité supprimée');
      fetchNews();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-indigo-500/10">
            <Newspaper className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Actualités Qualiopi
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gérer les actualités et nouvelles réglementations Qualiopi
            </p>
          </div>
        </div>
        <Button className="bg-indigo-500 hover:bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" />
          Créer une actualité
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher des actualités..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchNews()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Aucune actualité trouvée</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.title}
                          </h3>
                          {item.is_published ? (
                            <Badge className="bg-green-500/10 text-green-500">Publiée</Badge>
                          ) : (
                            <Badge className="bg-gray-500/10 text-gray-500">Brouillon</Badge>
                          )}
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                          {item.content?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category || 'Général'}
                          </Badge>
                          {item.distributions_count > 0 && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Distribuée à {item.distributions_count} organisations
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3" />
                        </Button>
                        {!item.is_published && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => handlePublishNews(item.id)}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteNews(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} actualités)
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
    </div>
  );
};

