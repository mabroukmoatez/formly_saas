import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Newspaper, BookOpen, TrendingUp, Eye, Award, Users, GraduationCap, CheckCircle, Building2, Car, Laptop, Loader2 } from 'lucide-react';
import { useQualityArticles } from '../../hooks/useQualityArticles';
import { QualityArticle } from '../../services/qualityManagement';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

const categories = [
  { id: 'RNCP', name: 'RNCP', icon: Award, color: 'bg-blue-500' },
  { id: 'Accompagnement professionnel', name: 'Accompagnement professionnel', icon: Users, color: 'bg-green-500' },
  { id: 'Veille', name: 'Veille', icon: TrendingUp, color: 'bg-purple-500' },
  { id: 'Qualiopi', name: 'Qualiopi', icon: CheckCircle, color: 'bg-orange-500' },
  { id: 'Audit de surveillance', name: 'Audit de surveillance', icon: Eye, color: 'bg-red-500' },
  { id: 'Formation Professionnelle', name: 'Formation Professionnelle', icon: GraduationCap, color: 'bg-indigo-500' },
  { id: 'Validation des acquis de l\'expérience', name: 'Validation des acquis de l\'expérience', icon: BookOpen, color: 'bg-teal-500' },
  { id: 'Organismes de Formation', name: 'Organismes de Formation', icon: Building2, color: 'bg-cyan-500' },
  { id: 'Centre de formation d\'apprentis', name: 'Centre de formation d\'apprentis', icon: Building2, color: 'bg-pink-500' },
  { id: 'Bilan de compétence', name: 'Bilan de compétence', icon: CheckCircle, color: 'bg-yellow-500' },
  { id: 'Auto-écoles', name: 'Auto-écoles', icon: Car, color: 'bg-gray-500' },
  { id: 'Technology', name: 'Technology', icon: Laptop, color: 'bg-slate-500' },
];

// Map category names from API to category IDs
const mapCategoryToId = (category: string | null): string | null => {
  if (!category) return null;
  const found = categories.find(c => c.name === category);
  return found ? found.id : null;
};

const mapIdToCategoryName = (id: string | null): string | null => {
  if (!id) return null;
  const found = categories.find(c => c.id === id);
  return found ? found.name : null;
};

// Format date helper
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateString;
  }
};

// Calculate read time from content
const calculateReadTime = (content: string | null | undefined): string => {
  if (!content) return '2 min';
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
};

export const Articles = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Map selected category ID to API category name
  const apiCategory = useMemo(() => {
    return mapIdToCategoryName(selectedCategoryId);
  }, [selectedCategoryId]);

  // Fetch articles from API
  const { articles, loading, error, pagination, refetch } = useQualityArticles({
    category: apiCategory || undefined,
    search: searchTerm || undefined,
    page: 1,
    limit: 50, // Load more articles initially
  });

  // Filter articles locally if needed (additional client-side filtering)
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Category filter is handled by API, but we do client-side as fallback
      if (selectedCategoryId && article.category) {
        const articleCategoryId = mapCategoryToId(article.category);
        if (articleCategoryId !== selectedCategoryId) return false;
      }
      return true;
    });
  }, [articles, selectedCategoryId]);

  return (
    <div className="px-[27px] py-8">
      <div className="flex flex-row gap-6">
        {/* Articles List (Left Side - Big Div) */}
        <div className="flex-1 min-w-0">
          <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px]`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
                Articles
                {selectedCategoryId && `- ${categories.find(c => c.id === selectedCategoryId)?.name}`}
                {pagination && ` (${pagination.totalItems})`}
              </CardTitle>
              {selectedCategoryId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategoryId(null)}
                  className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}
                >
                  {t('quality.articles.clearFilter')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-20">
                  <Newspaper className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                    {searchTerm || selectedCategoryId ? t('quality.articles.noArticlesFound') : t('quality.articles.noArticlesAvailable')}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
                    {searchTerm || selectedCategoryId
                      ? t('quality.articles.noArticlesSearchHint')
                      : t('quality.articles.noArticlesComingSoon')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article: QualityArticle) => {
                    const categoryId = mapCategoryToId(article.category);
                    const category = categories.find(c => c.id === categoryId);
                    const CategoryIcon = category?.icon || Newspaper;
                    const readTime = calculateReadTime(article.content);

                    return (
                      <Card
                        key={article.id}
                        className={`cursor-pointer transition-all hover:shadow-lg border-2 ${isDark ? 'border-gray-700 hover:border-gray-600 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        onClick={() => {
                          if (article.url) {
                            window.open(article.url, '_blank');
                          } else {
                            navigateToRoute(`/quality/articles/${article.id}`);
                          }
                        }}
                      >
                        {(() => {
                          const hasImage = article.image && article.image.trim() !== '';
                          const CategoryIcon = category?.icon || Newspaper;

                          return hasImage ? (
                            <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                              <img
                                src={article.image.startsWith('http') ? article.image : `http://localhost:8000${article.image}`}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Replace with default image on error
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent && !parent.querySelector('.default-icon')) {
                                    parent.className = 'w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center';
                                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                    icon.setAttribute('class', 'w-16 h-16 text-blue-400 default-icon');
                                    icon.setAttribute('fill', 'none');
                                    icon.setAttribute('stroke', 'currentColor');
                                    icon.setAttribute('viewBox', '0 0 24 24');
                                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    path.setAttribute('stroke-linecap', 'round');
                                    path.setAttribute('stroke-linejoin', 'round');
                                    path.setAttribute('stroke-width', '2');
                                    path.setAttribute('d', 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z');
                                    icon.appendChild(path);
                                    parent.appendChild(icon);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
                              <CategoryIcon className="w-16 h-16 text-blue-400" />
                            </div>
                          );
                        })()}
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            {category && (
                              <Badge className={`${category.color} text-white`}>
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {category.name}
                              </Badge>
                            )}
                            {article.featured && (
                              <Badge className="bg-yellow-500 text-white">
                                ⭐ Mis en avant
                              </Badge>
                            )}
                          </div>
                          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                            {article.title}
                          </h3>
                          <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                            {article.description || article.content?.replace(/<[^>]*>/g, '').substring(0, 150) || 'Aucune description disponible'}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                              {article.author?.name || 'Auteur inconnu'}
                            </span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                              {formatDate(article.date || article.createdAt)} • {readTime}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories (Right Side - Small Div) */}
        <div className="w-[250px] shrink-0">
          <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px] sticky top-4`}>
            <CardHeader>
              <CardTitle className={`${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica] font-semibold text-lg`}>
                Catégories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {categories.map((category) => {
                  const isSelected = selectedCategoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(isSelected ? null : category.id)}
                      className={`text-left px-3 py-2 rounded-md transition-colors text-sm [font-family:'Poppins',Helvetica] ${isSelected
                          ? isDark
                            ? 'bg-blue-900/40 text-blue-400 font-medium'
                            : 'bg-blue-50 text-blue-600 font-medium'
                          : isDark
                            ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
