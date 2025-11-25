import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useNews, useNewsActions } from '../../hooks/useNews';
import { useToast } from '../../components/ui/toast';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  User,
  Calendar,
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
  const primaryColor = organization?.primary_color || '#3b82f6';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

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

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target as Node)) {
        setShowAuthorDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    if (showAuthorDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthorDropdown, showStatusDropdown]);

  const handleSelectAuthor = (authorId: string) => {
    setSelectedAuthor(authorId === selectedAuthor ? '' : authorId);
    setShowAuthorDropdown(false);
  };

  const getSelectedAuthorName = () => {
    if (!selectedAuthor) return 'Ajouté Par';
    const author = authors.find(a => a.id.toString() === selectedAuthor);
    return author ? author.name : 'Ajouté Par';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return {
          text: 'À venir',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-300 dark:border-blue-700'
        };
      case 'draft':
        return {
          text: 'Brouillon',
          bg: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-600'
        };
      case 'archived':
        return {
          text: 'Passée',
          bg: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          border: 'border-green-300 dark:border-green-700'
        };
      default:
        return {
          text: status,
          bg: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-600'
        };
    }
  };

  // Obtenir la liste unique des auteurs (hook doit être avant le return conditionnel)
  const authors = useMemo(() => {
    const authorMap = new Map();
    news.forEach(item => {
      if (!authorMap.has(item.author.id)) {
        authorMap.set(item.author.id, item.author);
      }
    });
    return Array.from(authorMap.values());
  }, [news]);

  // Filtrer les actualités (hook doit être avant le return conditionnel)
  const filteredNews = useMemo(() => {
    let filtered = news;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.short_description.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    }

    if (selectedStatus) {
      if (selectedStatus === 'upcoming') {
        // Filtrer les actualités à venir (publiées avec published_at dans le futur)
        filtered = filtered.filter(item => {
          if (item.status !== 'published' || !item.published_at) return false;
          const publishedDate = new Date(item.published_at);
          const now = new Date();
          return publishedDate > now;
        });
      } else {
        filtered = filtered.filter(item => item.status === selectedStatus);
      }
    }

    if (selectedAuthor) {
      filtered = filtered.filter(item => item.author.id.toString() === selectedAuthor);
    }

    // Trier par date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [news, searchTerm, selectedStatus, selectedAuthor, sortOrder]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${isDark ? 'bg-gray-900' : 'bg-[#fafbfc]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Chargement des actualités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-[#fafbfc]'}`}>
      {/* Container principal avec max-width */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* En-tête de Page */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0"
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
            
            {/* Bouton Nouvelle Actualités - Même style que les évènements */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigateToRoute('/actualites/create')}
                className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
                style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
              >
                <Plus className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
                  Nouvelle Actualités
                </span>
              </Button>
            </div>
          </div>

          {/* Barre de Recherche et Actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Barre de Recherche */}
            <div className="relative flex-1 min-w-[400px] max-w-[460px]">
              <div 
                className={`relative flex items-center rounded-[16px] h-[52px] px-[14px] border transition-colors ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-[#e8f4f8] border-transparent'
                }`}
                style={!isDark ? { backgroundColor: '#e8f4f8' } : undefined}
              >
                <Search 
                  className={`w-5 h-5 mr-3 flex-shrink-0 ${
                    isDark ? 'text-gray-400' : 'text-[#64748b]'
                  }`}
                />
                <Input
                  placeholder="Titre, Mot-Clé"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`flex-1 border-0 bg-transparent p-0 h-auto text-[15px] font-normal placeholder:text-[#64748b] focus-visible:ring-0 focus-visible:ring-offset-0 ${
                    isDark 
                      ? 'text-white placeholder:text-gray-500' 
                      : 'text-[#1e293b]'
                  }`}
                  style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
                />
              </div>
            </div>

            {/* Groupe de Filtres et Bouton */}
            <div className="flex items-center gap-3">
              {/* Filtre Date De Création */}
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-[12px] h-[52px] border transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                    : 'bg-white border-[#e2e8f0] hover:bg-gray-50 text-[#64748b]'
                }`}
                style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-[15px] font-medium">Date De Création</span>
                <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
              </button>

              {/* Filtre Ajouté Par */}
              <div className="relative" ref={authorDropdownRef}>
                <button
                  onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-[12px] h-[52px] border transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                      : 'bg-white border-[#e2e8f0] hover:bg-gray-50 text-[#64748b]'
                  } ${selectedAuthor ? (isDark ? 'border-blue-500' : 'border-blue-500 bg-blue-50') : ''}`}
                  style={{ 
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    ...(selectedAuthor && !isDark ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#3b82f6' } : {})
                  }}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[15px] font-medium">{getSelectedAuthorName()}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAuthorDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showAuthorDropdown && (
                  <div 
                    className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto ${
                      isDark 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-white border border-gray-200'
                    }`}
                    style={{ 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <button
                      onClick={() => handleSelectAuthor('')}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        !selectedAuthor
                          ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                    >
                      <span>Tous les auteurs</span>
                    </button>
                    {authors.map((author) => (
                      <button
                        key={author.id}
                        onClick={() => handleSelectAuthor(author.id.toString())}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                          selectedAuthor === author.id.toString()
                            ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                            : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                        }`}
                      >
                        <Avatar className="w-6 h-6">
                          {author.avatar_url ? (
                            <AvatarImage 
                              src={author.avatar_url} 
                              alt={author.name}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback 
                            className="text-white text-xs font-semibold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {author.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{author.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtre Statut */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-[12px] h-[52px] border transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                      : 'bg-white border-[#e2e8f0] hover:bg-gray-50 text-[#64748b]'
                  } ${selectedStatus ? (isDark ? 'border-blue-500' : 'border-blue-500 bg-blue-50') : ''}`}
                  style={{ 
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    ...(selectedStatus && !isDark ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#3b82f6' } : {})
                  }}
                >
                  <span className="text-[15px] font-medium">
                    {selectedStatus === 'published' ? 'Publiées' :
                     selectedStatus === 'draft' ? 'Brouillons' :
                     selectedStatus === 'archived' ? 'Passées' :
                     selectedStatus === 'upcoming' ? 'À venir' :
                     'Statut'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showStatusDropdown && (
                  <div 
                    className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-[100] ${
                      isDark 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-white border border-gray-200'
                    }`}
                    style={{ 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedStatus('');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        !selectedStatus
                          ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                    >
                      <span>Tous les statuts</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatus('upcoming');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        selectedStatus === 'upcoming'
                          ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                    >
                      <span>À venir</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatus('published');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        selectedStatus === 'published'
                          ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                    >
                      <span>Publiées</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatus('draft');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        selectedStatus === 'draft'
                          ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                    >
                      <span>Brouillons</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatus('archived');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        selectedStatus === 'archived'
                          ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                    >
                      <span>Passées</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Toggle Vue Grid/List */}
              <div className={`inline-flex items-center rounded-[12px] border p-1 h-[52px] ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e8f0]'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-[6px] transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={viewMode === 'grid' ? { backgroundColor: isDark ? undefined : '#eff6ff' } : undefined}
                >
                  <Grid 
                    className={`w-5 h-5 ${
                      viewMode === 'grid' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                    style={viewMode === 'grid' ? { color: primaryColor } : undefined}
                  />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-[6px] transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={viewMode === 'list' ? { backgroundColor: isDark ? undefined : '#eff6ff' } : undefined}
                >
                  <List 
                    className={`w-5 h-5 ${
                      viewMode === 'list' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                    style={viewMode === 'list' ? { color: primaryColor } : undefined}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de Cards */}
        {filteredNews.length > 0 ? (
          <div 
            className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
                : 'flex flex-col gap-4'
            }`}
          >
            {filteredNews.map((newsItem) => (
              <NewsCard
                key={newsItem.id}
                news={newsItem}
                isDark={isDark}
                viewMode={viewMode}
                primaryColor={primaryColor}
                onEdit={handleEditNews}
                onDelete={handleDeleteNewsClick}
                onView={handleViewNews}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Newspaper className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Aucune actualité trouvée
            </h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm ? 'Aucun résultat pour votre recherche' : 'Commencez par créer votre première actualité'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigateToRoute('/actualites/create')}
                className="gap-2 h-auto py-2.5 px-6 rounded-lg font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                Créer une actualité
              </Button>
            )}
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
