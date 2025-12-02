import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  User
} from 'lucide-react';
import { fixImageUrl } from '../../lib/utils';

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
  primaryColor?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return {
        text: 'À venir',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-800 dark:text-blue-200',
        border: 'border border-blue-300 dark:border-blue-700'
      };
    case 'draft':
      return {
        text: 'Brouillon',
        bg: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        border: 'border border-gray-300 dark:border-gray-600'
      };
    case 'archived':
      return {
        text: 'Passée',
        bg: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-800 dark:text-green-200',
        border: 'border border-green-300 dark:border-green-700'
      };
    default:
      return {
        text: status,
        bg: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        border: 'border border-gray-300 dark:border-gray-600'
      };
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  if (avatarUrl.startsWith('uploads/') || avatarUrl.startsWith('/uploads/')) {
    return `${baseUrl}/storage/${avatarUrl.replace(/^\/+/, '')}`;
  }
  return `${baseUrl}${avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl}`;
};

export const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  isDark, 
  viewMode,
  primaryColor = '#3b82f6',
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const statusBadge = getStatusBadge(news.status);
  const dateFormatted = formatDate(news.created_at);
  const avatarUrl = getAvatarUrl(news.author.avatar_url);

  // Vue Liste
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onView(news.id)}
        className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[20px] overflow-hidden cursor-pointer transition-all duration-250 ease-out hover:shadow-lg hover:-translate-y-0.5 ${
          isDark ? 'hover:border-gray-600' : 'hover:border-gray-300'
        }`}
        style={{
          boxShadow: isDark 
            ? '0 1px 3px rgba(0, 0, 0, 0.05)' 
            : '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex h-full">
          {/* Image - Prend toute la hauteur */}
          <div className="relative w-80 overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex-shrink-0 self-stretch">
            {news.image_url ? (
              <img 
                src={fixImageUrl(news.image_url)} 
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ minHeight: '100%' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-80" />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 p-6 flex flex-col min-h-[200px]">
            {/* Badges et Date */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-[14px] font-semibold ${isDark ? 'text-blue-400' : 'text-[#3b82f6]'}`}>
                {news.category}
              </span>
              <Badge 
                className={`${statusBadge.bg} ${statusBadge.textColor} ${statusBadge.border} rounded-[8px] px-3 py-1 text-[13px] font-medium`}
              >
                {statusBadge.text}
              </Badge>
            </div>

            {/* Titre */}
            <h3 
              className={`text-[20px] font-bold mb-3 line-clamp-2 ${
                isDark ? 'text-white' : 'text-[#0f172a]'
              }`}
              style={{ 
                fontFamily: 'Inter, -apple-system, sans-serif',
                lineHeight: '1.3'
              }}
            >
              {news.title}
            </h3>

            {/* Description */}
            <p 
              className={`text-[15px] mb-6 line-clamp-2 ${
                isDark ? 'text-gray-400' : 'text-[#64748b]'
              }`}
              style={{ 
                fontFamily: 'Inter, -apple-system, sans-serif',
                lineHeight: '1.5'
              }}
            >
              {news.short_description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
              {/* Auteur et Date */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-9 h-9">
                    {avatarUrl ? (
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={news.author.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback 
                      className="text-white text-xs font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {getInitials(news.author.name || news.author.email || 'A')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col">
                  <span 
                    className={`text-[14px] font-medium ${
                      isDark ? 'text-[#1e293b]' : 'text-[#1e293b]'
                    }`}
                    style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
                  >
                    {news.author.name}
                  </span>
                  <span 
                    className={`text-[13px] ${
                      isDark ? 'text-gray-500' : 'text-[#94a3b8]'
                    }`}
                    style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
                  >
                    {dateFormatted}
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className={`h-8 w-8 rounded-md p-0 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-100 text-[#94a3b8] hover:text-gray-700'
                  }`}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                
                {showMenu && (
                  <div 
                    className={`absolute right-0 bottom-full mb-2 w-44 rounded-lg shadow-xl z-[100] ${
                      isDark 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-white border border-gray-200'
                    } overflow-visible`}
                    style={{ 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(news.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-200' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(news.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-200' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
      </div>
    );
  }

  // Vue Grid
  return (
    <div
      onClick={() => onView(news.id)}
      className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[20px] overflow-hidden cursor-pointer transition-all duration-250 ease-out hover:shadow-xl hover:-translate-y-0.5 ${
        isDark ? 'hover:border-gray-600' : 'hover:border-gray-300'
      }`}
      style={{
        boxShadow: isDark 
          ? '0 1px 3px rgba(0, 0, 0, 0.05)' 
          : '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        {news.image_url ? (
          <img 
            src={fixImageUrl(news.image_url)} 
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-80" />
        )}
      </div>

      {/* Contenu */}
      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[14px] font-semibold ${isDark ? 'text-blue-400' : 'text-[#3b82f6]'}`}>
            {news.category}
          </span>
          <Badge 
            className={`${statusBadge.bg} ${statusBadge.textColor} ${statusBadge.border} rounded-[8px] px-3 py-1 text-[13px] font-medium`}
          >
            {statusBadge.text}
          </Badge>
        </div>

        {/* Titre */}
        <h3 
          className={`text-[20px] font-bold mb-3 line-clamp-2 ${
            isDark ? 'text-white' : 'text-[#0f172a]'
          }`}
          style={{ 
            fontFamily: 'Inter, -apple-system, sans-serif',
            lineHeight: '1.3'
          }}
        >
          {news.title}
        </h3>

        {/* Description */}
        <p 
          className={`text-[15px] mb-6 line-clamp-2 ${
            isDark ? 'text-gray-400' : 'text-[#64748b]'
          }`}
          style={{ 
            fontFamily: 'Inter, -apple-system, sans-serif',
            lineHeight: '1.5'
          }}
        >
          {news.short_description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Auteur et Date */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-9 h-9">
                {avatarUrl ? (
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={news.author.name}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback 
                  className="text-white text-xs font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getInitials(news.author.name || news.author.email || 'A')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col">
              <span 
                className={`text-[14px] font-medium ${
                  isDark ? 'text-[#1e293b]' : 'text-[#1e293b]'
                }`}
                style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
              >
                {news.author.name}
              </span>
              <span 
                className={`text-[13px] ${
                  isDark ? 'text-gray-500' : 'text-[#94a3b8]'
                }`}
                style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
              >
                {dateFormatted}
              </span>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`h-8 w-8 rounded-md p-0 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-[#94a3b8] hover:text-gray-700'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            
            {showMenu && (
              <div 
                className={`absolute right-0 bottom-full mb-2 w-44 rounded-lg shadow-xl z-[100] ${
                  isDark 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                } overflow-visible`}
                style={{ 
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(news.id);
                    setShowMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Voir
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(news.id);
                    setShowMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
  );
};
