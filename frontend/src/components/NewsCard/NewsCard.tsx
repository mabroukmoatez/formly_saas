import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  User,
  Heart,
  Star
} from 'lucide-react';

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

interface NewsCardProps {
  news: NewsItem;
  isDark: boolean;
  viewMode: 'grid' | 'list';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });
  const year = date.getFullYear();
  return { day, month, year };
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

export const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  isDark, 
  viewMode, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const dateInfo = formatDate(news.created_at);

  // List view
  if (viewMode === 'list') {
    return (
      <Card className={`border-2 rounded-[12px] overflow-hidden hover:shadow-lg transition-all duration-300 group ${
        isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-[#e2e2ea] bg-white hover:border-[#007aff]/20'
      }`}>
        <div className="flex">
          {/* Image en pleine hauteur */}
          <div className="relative w-80 h-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
            {news.image_url ? (
              <img 
                src={news.image_url} 
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500" />
            )}
            
            {/* Badge de catégorie */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isDark ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-[#007aff]'
              } backdrop-blur-sm`}>
                {news.category}
              </span>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 py-4 pr-4 pl-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Titre et date */}
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${getStatusColor(news.status)} text-white rounded-[30px] px-2.5 py-0.5 text-[11px] font-medium`}>
                    {getStatusText(news.status)}
                  </Badge>
                  {news.featured && (
                    <Badge className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-2.5 py-0.5 text-[11px] font-medium">
                      <Star className="w-3 h-3 mr-1 inline" />
                      En avant
                    </Badge>
                  )}
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
                    {dateInfo.day} {dateInfo.month} {dateInfo.year}
                  </span>
                </div>

                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  {news.title}
                </h3>

                <p className={`[font-family:'Poppins',Helvetica] text-sm line-clamp-1 mb-3 ${
                  isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                }`}>
                  {news.short_description}
                </p>

                {/* Informations compactes */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
                    <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                      {news.views_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
                    <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                      {news.likes_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
                    <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                      {news.author.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu actions */}
              <div className="relative ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMenu(!showMenu)}
                  className={`h-8 w-8 rounded-full ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {showMenu && (
                  <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  } overflow-hidden z-10`}>
                    <button
                      onClick={() => {
                        onView(news.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </button>
                    <button
                      onClick={() => {
                        onEdit(news.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        onDelete(news.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className={`border-2 rounded-[18px] overflow-hidden hover:shadow-xl transition-all duration-300 group ${
      isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-[#e2e2ea] bg-white hover:border-[#007aff]/20'
    }`}>
      {/* Image de l'actualité */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
        {news.image_url ? (
          <img 
            src={news.image_url} 
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500" />
        )}
        
        {/* Badge de catégorie */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isDark ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-[#007aff]'
          } backdrop-blur-sm`}>
            {news.category}
          </span>
        </div>

        {/* Featured badge */}
        {news.featured && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              En avant
            </Badge>
          </div>
        )}

        {/* Menu actions */}
        <div className="absolute top-4 right-4">
          {!news.featured && <div className="w-10" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className={`h-8 w-8 rounded-full ${
              isDark ? 'bg-gray-900/80 hover:bg-gray-800' : 'bg-white/90 hover:bg-white'
            } backdrop-blur-sm ${news.featured ? 'mt-2' : ''}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          
          {showMenu && (
            <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } overflow-hidden z-10`}>
              <button
                onClick={() => {
                  onView(news.id);
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Eye className="h-4 w-4" />
                Voir
              </button>
              <button
                onClick={() => {
                  onEdit(news.id);
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Edit className="h-4 w-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  onDelete(news.id);
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {/* Date badge */}
        <div className="flex items-center gap-3 mb-4">
          <Badge className={`${getStatusColor(news.status)} text-white rounded-[30px] px-2.5 py-0.5 text-[11px] font-medium`}>
            {getStatusText(news.status)}
          </Badge>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
            {dateInfo.day} {dateInfo.month} {dateInfo.year}
          </span>
        </div>

        {/* Titre */}
        <div className="mb-3">
          <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mt-1 line-clamp-2 ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            {news.title}
          </h3>
        </div>

        {/* Description */}
        <p className={`[font-family:'Poppins',Helvetica] text-sm line-clamp-2 mb-4 ${
          isDark ? 'text-gray-400' : 'text-[#6a90b9]'
        }`}>
          {news.short_description}
        </p>

        {/* Informations supplémentaires */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Eye className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {news.views_count}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {news.likes_count}
            </span>
          </div>
        </div>

        {/* Auteur */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            {news.author.avatar_url ? (
              <img 
                src={news.author.avatar_url} 
                alt={news.author.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-semibold">
                {(news.author.name?.trim() || news.author.email || 'A').split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
              Auteur
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
              {news.author.name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

