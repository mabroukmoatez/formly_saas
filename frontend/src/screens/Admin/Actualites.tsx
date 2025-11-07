import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useNews, useNewsActions } from '../../hooks/useNews';
import { useToast } from '../../components/ui/toast';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Upload,
  Calendar,
  User,
  Eye,
  Heart,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Star,
  StarOff,
  Newspaper
} from 'lucide-react';
import { NewsCard } from '../../components/NewsCard';

interface NewsItem {
  id: string;
  title: string;
  category: string;
  image_url?: string;
  short_description: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  tags: string[];
  author: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export const Actualites = (): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  
  // Stabiliser les paramètres pour éviter les re-renders infinis
  const newsParams = useMemo(() => ({
    per_page: 12,
    sort: 'created_at' as const,
    order: 'desc' as const
  }), []);
  
  const { news, loading, error, pagination, meta, refetch } = useNews(newsParams);
  const { deleteNews, publishNews, featureNews } = useNewsActions();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  // Organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // TODO: Implémenter la recherche en temps réel
  };

  const handleDeleteNews = async () => {
    if (!newsToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteNews(newsToDelete.id);
      if (result) {
        success('Succès', 'Actualité supprimée avec succès');
        refetch();
      } else {
        showError('Erreur', 'Impossible de supprimer l\'actualité');
      }
    } catch (error) {
      showError('Erreur', 'Une erreur est survenue');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setNewsToDelete(null);
    }
  };

  const handlePublishNews = async (news: NewsItem, status: 'draft' | 'published' | 'archived') => {
    try {
      const result = await publishNews(news.id, status);
      if (result) {
        success('Succès', `Actualité ${status === 'published' ? 'publiée' : status === 'draft' ? 'dépubliée' : 'archivée'} avec succès`);
        refetch();
      } else {
        showError('Erreur', 'Impossible de modifier le statut');
      }
    } catch (error) {
      showError('Erreur', 'Une erreur est survenue');
    }
  };

  const handleFeatureNews = async (news: NewsItem, featured: boolean) => {
    try {
      const result = await featureNews(news.id, featured);
      if (result) {
        success('Succès', `Actualité ${featured ? 'mise en avant' : 'retirée de la mise en avant'} avec succès`);
        refetch();
      } else {
        showError('Erreur', 'Impossible de modifier la mise en avant');
      }
    } catch (error) {
      showError('Erreur', 'Une erreur est survenue');
    }
  };

  const handleViewNews = (newsId: string) => {
    navigateToRoute(`/actualites/${newsId}`);
  };

  const handleEditNews = (newsId: string) => {
    navigateToRoute(`/actualites/edit/${newsId}`);
  };

  const handleDeleteNewsClick = (newsId: string) => {
    const newsItem = news.find(n => n.id === newsId);
    if (newsItem) {
      setNewsToDelete(newsItem);
      setShowDeleteModal(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Chargement des actualités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-[27px] py-8`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Newspaper className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                Actualités
              </h1>
              <p 
                className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
              >
                Gérez vos actualités et articles
              </p>
            </div>
          </div>
          
          <Button 
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
            onClick={() => navigateToRoute('/actualites/create')}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              Nouvelle actualité
            </span>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <Input
              placeholder="Rechercher une actualité..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
          
          <div className="flex items-center gap-2">
        <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-9 w-9 p-0"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
        </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total
                  </p>
                  <p className={`[font-family:'Poppins',Helvetica] font-semibold text-[20px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {meta.total_news}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Eye className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Publiées
                  </p>
                  <p className={`[font-family:'Poppins',Helvetica] font-semibold text-[20px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {meta.published_news}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                  <Star className="w-5 h-5" style={{ color: accentColor }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Brouillons
                  </p>
                  <p className={`[font-family:'Poppins',Helvetica] font-semibold text-[20px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {meta.draft_news}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${secondaryColor}20` }}>
                  <Edit className="w-5 h-5" style={{ color: secondaryColor }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    En avant
                  </p>
                  <p className={`[font-family:'Poppins',Helvetica] font-semibold text-[20px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {meta.featured_news}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                  <Star className="w-5 h-5" style={{ color: accentColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News Grid/List */}
        <div className={`${viewMode === 'grid' ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'gap-3 grid-cols-1'}`}>
            {news.map((newsItem) => (
            <NewsCard
              key={newsItem.id}
              news={newsItem}
              isDark={isDark}
              viewMode={viewMode}
              onEdit={handleEditNews}
              onDelete={handleDeleteNewsClick}
              onView={handleViewNews}
            />
            ))}
          </div>

        {/* Empty State */}
        {news.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
              <Eye className="w-12 h-12" style={{ color: primaryColor }} />
            </div>
            <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Aucune actualité
            </h3>
            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px] mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Commencez par créer votre première actualité
            </p>
            <Button 
              className="h-auto rounded-[13px] px-4 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              onClick={() => navigateToRoute('/actualites/create')}
            >
              <Plus className="w-5 h-5 text-white" />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[16px]">
                Créer une actualité
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteNews}
        title="Voulez-vous vraiment supprimer cette actualité ?"
        message="Cette action est irréversible. L'actualité sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};