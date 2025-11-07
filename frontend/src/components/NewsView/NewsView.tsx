import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Eye, 
  Heart, 
  Trash2, 
  Edit3, 
  Eye as EyeIcon, 
  ArrowLeft,
  Info,
  Tag,
  Star,
  StarOff,
  ChevronUp,
  ChevronDown,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { useNewsActions } from '../../hooks/useNews';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

interface NewsViewProps {
  newsId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface News {
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
    bio?: string;
  };
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export const NewsView: React.FC<NewsViewProps> = ({ 
  newsId, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const { navigateToRoute } = useSubdomainNavigation();
  const { getNewsById, deleteNews, loading, publishNews, featureNews, likeNews, unlikeNews, incrementViews } = useNewsActions();
  
  // Organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';
  const successColor = organization?.success_color || '#08ab39';
  
  const [news, setNews] = useState<News | null>(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'details'>('content');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoadingNews(true);
        const newsData = await getNewsById(newsId);
        setNews(newsData);
        
        // Incrémenter les vues quand on ouvre l'actualité
        if (newsData) {
          await incrementViews(newsId);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        showError('Erreur', 'Impossible de charger les détails de l\'actualité');
      } finally {
        setLoadingNews(false);
      }
    };

    fetchNews();
  }, [newsId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-yellow-500';
      case 'published': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publié';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  const handleLike = async () => {
    if (!news) return;
    
    try {
      if (isLiked) {
        await unlikeNews(news.id);
        setIsLiked(false);
        setNews(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null);
      } else {
        await likeNews(news.id);
        setIsLiked(true);
        setNews(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le like');
    }
  };

  const handlePublish = async (status: 'draft' | 'published' | 'archived') => {
    if (!news) return;
    
    try {
      await publishNews(news.id, status);
      setNews(prev => prev ? { ...prev, status } : null);
      success('Succès', `Actualité ${status === 'published' ? 'publiée' : status === 'draft' ? 'dépubliée' : 'archivée'}`);
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleFeature = async (featured: boolean) => {
    if (!news) return;
    
    try {
      await featureNews(news.id, featured);
      setNews(prev => prev ? { ...prev, featured } : null);
      success('Succès', `Actualité ${featured ? 'mise en avant' : 'retirée de la mise en avant'}`);
    } catch (error) {
      showError('Erreur', 'Impossible de modifier la mise en avant');
    }
  };

  if (loadingNews) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Chargement des détails de l'actualité...</p>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Actualité non trouvée</p>
          <Button 
            onClick={onClose}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const createdDate = formatDate(news.created_at);
  const updatedDate = formatDate(news.updated_at);
  const publishedDate = news.published_at ? formatDate(news.published_at) : null;

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
      {/* News Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-8 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} text-[19.5px] mb-2`}>
              {news.title}
            </h1>

            {/* Categories and Status */}
            <div className="flex items-center gap-2 mb-2">
              <Badge
                className="bg-[#eee0ff] text-[#8c2ffe] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
              >
                {news.category}
              </Badge>
              <Badge
                className={`${getStatusColor(news.status)} text-white rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]`}
              >
                {getStatusText(news.status)}
              </Badge>
              {news.featured && (
                <Badge
                  className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
                >
                  <Star className="w-3 h-3 mr-1" />
                  En avant
                </Badge>
              )}
              {news.tags && news.tags.length > 0 && (
                <Badge
                  className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
                >
                  {news.tags[0]}
                </Badge>
              )}
            </div>

            {/* News Info */}
            <div className="flex items-center gap-[31px]">
              <div className="flex items-center gap-2.5">
                <Calendar className={`w-4 h-4`} style={{ color: primaryColor }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  Créé le {createdDate.full}
                </span>
              </div>

              {publishedDate && (
                <div className="flex items-center gap-2.5">
                  <Calendar className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                  <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                    Publié le {publishedDate.full}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <Eye className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {news.views_count} vues
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4`} style={{ color: primaryColor }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: primaryColor }}>
                  {news.likes_count} likes
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-4">
            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: primaryColor }}>
                Supprimer
              </span>
            </Button>

            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
              onClick={onEdit}
            >
              <Edit3 className="w-4 h-4" style={{ color: secondaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: secondaryColor }}>
                Modifier
              </span>
            </Button>

            <Button 
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: accentColor }}
              onClick={onClose}
            >
              <EyeIcon className="w-4 h-4 text-white" />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[17px]">
                Fermer
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 p-8 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[63px] shadow-[0px_4px_18.8px_#0000000f] p-1.5 h-auto`}>
              <TabsTrigger
                value="content"
                className="rounded-[33px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
              >
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'content' ? accentColor : secondaryColor }}>
                  Contenu
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                onClick={() => setActiveTab('details')}
              >
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'details' ? accentColor : secondaryColor }}>
                  Détails
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-4 space-y-4">
              {/* News Image */}
              {news.image_url && (
                <div className="relative rounded-[18px] overflow-hidden">
                  <img
                    src={news.image_url}
                    alt={news.title}
                    className="w-full h-[387px] object-cover"
                  />
                </div>
              )}

              {/* Short Description */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-7">
                  <div className="space-y-[17px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                        <Info className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Résumé
                      </h3>
                    </div>
                    <div 
                      className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                      style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                    >
                      {news.short_description}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rich Content */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-7">
                  <div className="space-y-[17px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                        <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Contenu
                      </h3>
                    </div>
                    <div 
                      className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px] prose max-w-none ${isDark ? 'prose-invert' : ''}`}
                      dangerouslySetInnerHTML={{ __html: news.content }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                    Détails de l'actualité
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dates */}
                    <div className="space-y-4">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Dates
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Créé le
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {createdDate.full} à {createdDate.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Modifié le
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {updatedDate.full} à {updatedDate.time}
                            </p>
                          </div>
                        </div>
                        {publishedDate && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5" style={{ color: accentColor }} />
                            <div>
                              <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                Publié le
                              </p>
                              <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                {publishedDate.full} à {publishedDate.time}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-4">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Statistiques
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Vues
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {news.views_count}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Likes
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {news.likes_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {news.tags && news.tags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {news.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="w-[500px] flex flex-col gap-[19px] mt-16">
          {/* Author Card */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-5 space-y-7">
              <div className="flex items-center justify-between">
                <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: successColor }}>
                  Auteur
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {news.author.avatar_url ? (
                  <img
                    className="w-[54px] h-[54px] rounded-full object-cover"
                    alt={news.author.name || 'Auteur'}
                    src={news.author.avatar_url}
                  />
                ) : (
                  <div 
                    className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {news.author.name && news.author.name.trim() 
                      ? news.author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : news.author.email 
                        ? news.author.email.split('@')[0].slice(0, 2).toUpperCase()
                        : 'AU'
                    }
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                    {news.author.name && news.author.name.trim() 
                      ? news.author.name 
                      : news.author.email 
                        ? news.author.email.split('@')[0]
                        : 'Auteur'
                    }
                  </h4>
                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                    {news.author.email}
                  </p>
                  {news.author.bio && (
                    <p className={`[font-family:'Poppins',Helvetica] font-normal text-[12px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                      {news.author.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-5 space-y-7">
              <div className="flex items-center justify-between">
                <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: primaryColor }}>
                  Actions
                </h3>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full rounded-[10px] px-6 py-2 hover:opacity-90" 
                  style={{ backgroundColor: isLiked ? '#ef4444' : primaryColor }}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-white' : ''}`} />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[15px]">
                    {isLiked ? 'Unlike' : 'Like'} ({news.likes_count})
                  </span>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="rounded-[10px] px-3 py-2 hover:opacity-90" 
                    onClick={() => handlePublish(news.status === 'published' ? 'draft' : 'published')}
                  >
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                      {news.status === 'published' ? 'Dépublier' : 'Publier'}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="rounded-[10px] px-3 py-2 hover:opacity-90" 
                    onClick={() => handleFeature(!news.featured)}
                  >
                    {news.featured ? <StarOff className="w-4 h-4 mr-1" /> : <Star className="w-4 h-4 mr-1" />}
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                      {news.featured ? 'Retirer' : 'Mettre en avant'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default NewsView;
