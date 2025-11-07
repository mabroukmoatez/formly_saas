import { useState, useEffect, useCallback, useMemo } from 'react';
import { newsService } from '../services/news';
import {
  News,
  NewsDetails,
  NewsListParams,
  CreateNewsData,
  UpdateNewsData,
  NewsCategory,
  NewsStatistics
} from '../services/news.types';

/**
 * Hook pour récupérer la liste des actualités
 */
export const useNews = (params?: NewsListParams) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0
  });
  const [meta, setMeta] = useState({
    total_news: 0,
    published_news: 0,
    draft_news: 0,
    archived_news: 0,
    featured_news: 0
  });

  // Stabiliser les paramètres pour éviter les re-renders infinis
  const stableParams = useMemo(() => params, [
    params?.page,
    params?.per_page,
    params?.search,
    params?.category,
    params?.status,
    params?.featured,
    params?.author_id,
    params?.date_from,
    params?.date_to,
    params?.sort,
    params?.order
  ]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.getNews(stableParams);
      
      if (response.success) {
        setNews(response.data.news);
        setPagination(response.data.pagination);
        setMeta(response.data.meta);
      } else {
        setError('Erreur lors du chargement des actualités');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des actualités');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    news,
    loading,
    error,
    pagination,
    meta,
    refetch: fetchNews
  };
};

/**
 * Hook pour gérer une actualité spécifique
 */
export const useNewsItem = (newsId: string | null) => {
  const [news, setNews] = useState<NewsDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    if (!newsId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.getNewsById(newsId);
      
      if (response.success) {
        setNews(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'actualité');
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    if (newsId) {
      fetchNews();
    }
  }, [newsId, fetchNews]);

  return {
    news,
    loading,
    error,
    refetch: fetchNews
  };
};

/**
 * Hook pour récupérer les catégories d'actualités
 */
export const useNewsCategories = () => {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.getNewsCategories();
      
      if (response.success) {
        setCategories(response.data);
      } else {
        setError('Erreur lors du chargement des catégories');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
};

/**
 * Hook pour gérer les actions sur les actualités
 */
export const useNewsActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNews = async (data: CreateNewsData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.createNews(data);
      console.log('🔍 News creation response:', response);
      
      // Check if response is successful (201 Created or 200 OK)
      // Sometimes the API returns the object directly without success wrapper
      if (response && (response.success || response.data || response.id)) {
        return true;
      } else {
        setError(response?.message || 'Erreur lors de la création de l\'actualité');
        return false;
      }
    } catch (err: any) {
      console.error('🔍 News creation error:', err);
      
      // If it's a 201 status, treat as success
      if (err?.status === 201 || err?.response?.status === 201) {
        return true;
      }
      
      // Handle validation errors
      if (err?.details?.errors) {
        const validationErrors = Object.values(err.details.errors).flat().join(', ');
        setError(validationErrors);
        return false;
      }
      
      if (err?.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(', ');
        setError(validationErrors);
        return false;
      }
      
      const errorMessage = err?.details?.message || err?.response?.data?.message || err?.message || 'Erreur lors de la création de l\'actualité';
      setError(errorMessage);
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateNews = async (newsId: string, data: UpdateNewsData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.updateNews(newsId, data);
      
      if (response.success || response.data) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de la modification de l\'actualité');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la modification de l\'actualité';
      setError(errorMessage);
      
      // Gérer les erreurs de validation
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(', ');
        setError(validationErrors);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNews = async (newsId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.deleteNews(newsId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de la suppression de l\'actualité');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de l\'actualité';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const publishNews = async (newsId: string, status: 'draft' | 'published' | 'archived'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.publishNews(newsId, status);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de la modification du statut');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la modification du statut';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const featureNews = async (newsId: string, featured: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.featureNews(newsId, featured);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de la modification de la mise en avant');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la modification de la mise en avant';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const likeNews = async (newsId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.likeNews(newsId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erreur lors du like');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du like';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unlikeNews = async (newsId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.unlikeNews(newsId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erreur lors du unlike');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du unlike';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (newsId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.incrementViews(newsId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de l\'incrémentation des vues');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'incrémentation des vues';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.uploadImage(file);
      
      if (response.success) {
        return response.data.image_url;
      } else {
        setError(response.message || 'Erreur lors de l\'upload de l\'image');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'upload de l\'image';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getNewsById = async (newsId: string): Promise<News | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.getNewsById(newsId);
      
      // Si la réponse contient directement les données de l'actualité (pas de structure success/data)
      if (response && response.id) {
        return response;
      }
      
      // Si c'est une structure avec success/data
      if (response.success) {
        return response.data;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement de l\'actualité';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createNews,
    updateNews,
    deleteNews,
    publishNews,
    featureNews,
    likeNews,
    unlikeNews,
    incrementViews,
    uploadImage,
    getNewsById
  };
};

/**
 * Hook pour gérer les statistiques des actualités
 */
export const useNewsStatistics = () => {
  const [statistics, setStatistics] = useState<NewsStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsService.getNewsStatistics();
      
      if (response.success) {
        setStatistics(response.data);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};
