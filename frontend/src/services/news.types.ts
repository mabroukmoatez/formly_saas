// Types pour le système d'actualités
export interface News {
  id: string;
  title: string;
  category: string;
  image_url?: string;
  short_description: string;
  content: string; // Rich text HTML
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  tags: string[];
  author: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
  };
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface NewsDetails extends News {
  is_liked?: boolean;
}

export interface NewsListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  author_id?: number;
  date_from?: string;
  date_to?: string;
  sort?: 'created_at' | 'updated_at' | 'published_at' | 'title' | 'views_count' | 'likes_count';
  order?: 'asc' | 'desc';
}

export interface CreateNewsData {
  title: string;
  category: string;
  short_description: string;
  content: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  tags?: string[];
  image?: File;
  published_at?: string;
}

export interface UpdateNewsData {
  title?: string;
  category?: string;
  short_description?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  tags?: string[];
  image?: File;
  published_at?: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  news_count: number;
}

export interface NewsStatistics {
  total_news: number;
  published_news: number;
  draft_news: number;
  archived_news: number;
  featured_news: number;
  total_views: number;
  total_likes: number;
  most_viewed: {
    id: string;
    title: string;
    views_count: number;
  };
  most_liked: {
    id: string;
    title: string;
    likes_count: number;
  };
  categories_stats: Array<{
    category: string;
    count: number;
    views: number;
  }>;
}

// Types de réponses API
export interface NewsListResponse {
  success: boolean;
  data: {
    news: News[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
    meta: {
      total_news: number;
      published_news: number;
      draft_news: number;
      archived_news: number;
      featured_news: number;
    };
  };
  message: string;
}

export interface NewsDetailsResponse {
  success: boolean;
  data: NewsDetails;
  message: string;
}

export interface NewsCreateResponse {
  success: boolean;
  data: News;
  message: string;
}

export interface NewsUpdateResponse {
  success: boolean;
  data: News;
  message: string;
}

export interface NewsDeleteResponse {
  success: boolean;
  message: string;
}

export interface NewsCategoriesResponse {
  success: boolean;
  data: NewsCategory[];
  message?: string;
}

export interface NewsStatisticsResponse {
  success: boolean;
  data: NewsStatistics;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
