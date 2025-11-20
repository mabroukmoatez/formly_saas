import { useState, useEffect, useCallback } from 'react';
import { getQualityArticles, QualityArticle } from '../services/qualityManagement';

interface UseQualityArticlesParams {
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface UseQualityArticlesReturn {
  articles: QualityArticle[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  } | null;
  refetch: () => void;
}

export const useQualityArticles = (params: UseQualityArticlesParams = {}): UseQualityArticlesReturn => {
  const [articles, setArticles] = useState<QualityArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
  } | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getQualityArticles({
        category: params.category,
        featured: params.featured,
        search: params.search,
        page: params.page || 1,
        limit: params.limit || 10,
      });

      // Handle different response structures
      let articlesArray: QualityArticle[] = [];
      let paginationData = null;

      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { articles: [...], pagination: {...} } }
          articlesArray = response.data.articles || response.data.data || [];
          paginationData = response.data.pagination || null;
        } else if (response.articles && Array.isArray(response.articles)) {
          // Structure: { articles: [...], pagination: {...} }
          articlesArray = response.articles;
          paginationData = response.pagination || null;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          articlesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          articlesArray = response.data;
        }
      }
      
      console.log('📰 useQualityArticles - Articles récupérés:', articlesArray.length, articlesArray);

      setArticles(articlesArray);
      setPagination(paginationData);
    } catch (err: any) {
      console.error('Error fetching quality articles:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des articles');
      setArticles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [params.category, params.featured, params.search, params.page, params.limit]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    pagination,
    refetch: fetchArticles,
  };
};

