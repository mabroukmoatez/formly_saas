import { apiService } from './api';
import {
  NewsListResponse,
  NewsDetailsResponse,
  NewsCreateResponse,
  NewsUpdateResponse,
  NewsDeleteResponse,
  NewsCategoriesResponse,
  NewsStatisticsResponse,
  NewsListParams,
  CreateNewsData,
  UpdateNewsData,
  ApiResponse,
  News
} from './news.types';

class NewsService {
  /**
   * Récupère la liste des actualités avec pagination et filtres
   */
  async getNews(params?: NewsListParams): Promise<NewsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params?.author_id) queryParams.append('author_id', params.author_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);

    const endpoint = '/api/news' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const response = await apiService.get<NewsListResponse>(endpoint);
    return response;
  }

  /**
   * Récupère les détails d'une actualité
   */
  async getNewsById(newsId: string): Promise<NewsDetailsResponse> {
    const response = await apiService.get<NewsDetailsResponse>(`/api/news/${newsId}`);
    return response;
  }

  /**
   * Crée une nouvelle actualité
   */
  async createNews(data: CreateNewsData): Promise<NewsCreateResponse> {
    // Créer FormData pour supporter l'upload d'image
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('short_description', data.short_description);
    formData.append('content', data.content);
    
    if (data.status) {
      formData.append('status', data.status);
    }
    
    // Send featured as "1" or "0" for FormData (Laravel expects this format for booleans)
    const featuredValue = data.featured !== undefined ? (data.featured ? '1' : '0') : '0';
    formData.append('featured', featuredValue);
    
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', data.tags.join(','));
    }
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.published_at) {
      formData.append('published_at', data.published_at);
    }

    const response = await apiService.post<NewsCreateResponse>('/api/news', formData);
    return response;
  }

  /**
   * Met à jour une actualité existante
   */
  async updateNews(newsId: string, data: UpdateNewsData): Promise<NewsUpdateResponse> {
    // Créer FormData pour supporter l'upload d'image
    const formData = new FormData();
    
    if (data.title) {
      formData.append('title', data.title);
    }
    
    if (data.category) {
      formData.append('category', data.category);
    }
    
    if (data.short_description) {
      formData.append('short_description', data.short_description);
    }
    
    if (data.content) {
      formData.append('content', data.content);
    }
    
    if (data.status) {
      formData.append('status', data.status);
    }
    
    // Send featured as "1" or "0" for FormData (Laravel expects this format for booleans)
    if (data.featured !== undefined) {
      formData.append('featured', data.featured ? '1' : '0');
    }
    
    if (data.tags) {
      formData.append('tags', data.tags.join(','));
    }
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.published_at) {
      formData.append('published_at', data.published_at);
    }

    const response = await apiService.put<NewsUpdateResponse>(`/api/news/${newsId}`, formData);
    return response;
  }

  /**
   * Supprime une actualité
   */
  async deleteNews(newsId: string): Promise<NewsDeleteResponse> {
    const response = await apiService.delete<NewsDeleteResponse>(`/api/news/${newsId}`);
    return response;
  }

  /**
   * Publie/Dépublie une actualité
   */
  async publishNews(newsId: string, status: 'draft' | 'published' | 'archived'): Promise<ApiResponse<News>> {
    const response = await apiService.patch<ApiResponse<News>>(`/api/news/${newsId}/publish`, {
      status
    });
    return response;
  }

  /**
   * Met en avant/Retire de la mise en avant une actualité
   */
  async featureNews(newsId: string, featured: boolean): Promise<ApiResponse<News>> {
    const response = await apiService.patch<ApiResponse<News>>(`/api/news/${newsId}/feature`, {
      featured
    });
    return response;
  }

  /**
   * Incrémente le compteur de vues
   */
  async incrementViews(newsId: string): Promise<ApiResponse<{ views_count: number }>> {
    const response = await apiService.post<ApiResponse<{ views_count: number }>>(`/api/news/${newsId}/view`);
    return response;
  }

  /**
   * Like/Unlike une actualité
   */
  async likeNews(newsId: string): Promise<ApiResponse<{ likes_count: number; is_liked: boolean }>> {
    const response = await apiService.post<ApiResponse<{ likes_count: number; is_liked: boolean }>>(`/api/news/${newsId}/like`);
    return response;
  }

  async unlikeNews(newsId: string): Promise<ApiResponse<{ likes_count: number; is_liked: boolean }>> {
    const response = await apiService.delete<ApiResponse<{ likes_count: number; is_liked: boolean }>>(`/api/news/${newsId}/like`);
    return response;
  }

  /**
   * Récupère les catégories d'actualités
   */
  async getNewsCategories(): Promise<NewsCategoriesResponse> {
    const response = await apiService.get<{ success: boolean; data: string[]; message: string }>('/api/news/categories');
    
    // Transformer les strings en objets NewsCategory
    const categories = response.data.map((name: string, index: number) => ({
      id: index + 1,
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: `Catégorie ${name}`,
      news_count: 0 // Le backend ne fournit pas ce compteur
    }));

    return {
      success: response.success,
      data: categories,
      message: response.message
    };
  }

  /**
   * Récupère les statistiques des actualités
   */
  async getNewsStatistics(): Promise<NewsStatisticsResponse> {
    const response = await apiService.get<NewsStatisticsResponse>('/api/news/statistics');
    return response;
  }

  /**
   * Upload une image pour une actualité
   */
  async uploadImage(file: File): Promise<ApiResponse<{ image_url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiService.post<ApiResponse<{ image_url: string }>>('/api/news/upload-image', formData);
    return response;
  }
}

export const newsService = new NewsService();
