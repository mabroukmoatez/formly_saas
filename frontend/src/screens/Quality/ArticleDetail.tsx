import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getQualityArticle } from '../../services/qualityManagement';
import { Loader2, ArrowLeft, Calendar, User, Share2, BookOpen, Award, TrendingUp, Eye, GraduationCap, CheckCircle, Building2, FileText, Newspaper } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { QualityArticle } from '../../services/qualityManagement';

export const ArticleDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  const { error: showError } = useToast();
  
  const [article, setArticle] = useState<QualityArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    if (!id) {
      setError('ID d\'article manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const articleId = parseInt(id, 10);
      
      if (!articleId || articleId === 0 || isNaN(articleId)) {
        setError('ID d\'article invalide');
        setLoading(false);
        return;
      }

      const response = await getQualityArticle(articleId);
      
      // Handle different response structures
      let articleData: QualityArticle | null = null;
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          articleData = response.data;
        } else if (response.id || response.title) {
          articleData = response as QualityArticle;
        } else if (response.data && (response.data.id || response.data.title)) {
          articleData = response.data;
        }
      }
      
      if (articleData) {
        setArticle(articleData);
      } else {
        setError('Article non trouvé');
      }
    } catch (err: any) {
      console.error('Error loading article:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Une erreur est survenue lors du chargement de l\'article';
      setError(errorMessage);
      try {
        showError('Erreur', errorMessage);
      } catch (toastError) {
        // Ignore toast errors
        console.error('Toast error:', toastError);
      }
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  // Get icon for category
  const getCategoryIcon = (category: string | null | undefined) => {
    if (!category) return Newspaper;
    const cat = category.toLowerCase();
    if (cat.includes('rncp')) return Award;
    if (cat.includes('accompagnement')) return User;
    if (cat.includes('veille')) return TrendingUp;
    if (cat.includes('qualiopi')) return CheckCircle;
    if (cat.includes('audit')) return Eye;
    if (cat.includes('formation')) return GraduationCap;
    if (cat.includes('vae') || cat.includes('validation')) return FileText;
    if (cat.includes('organisme') || cat.includes('cfa')) return Building2;
    return Newspaper;
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Calculate read time
  const calculateReadTime = (htmlContent: string | null | undefined): string => {
    if (!htmlContent) return '1 min';
    const textContent = htmlContent.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="text-center py-8">
            <p className={`text-red-500 mb-4 [font-family:'Poppins',Helvetica]`}>
              {error || 'Article non trouvé'}
            </p>
            <Button
              onClick={() => navigateToRoute('/quality/articles')}
              className="bg-[#007aff] hover:bg-[#0066cc] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(article.category);
  const hasImage = article.image && article.image.trim() !== '';
  const articleDate = article.date || article.createdAt || '';
  const readTime = calculateReadTime(article.content);

  return (
    <div className="px-[27px] py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigateToRoute('/quality/articles')}
          className="flex items-center gap-2 p-0 h-auto"
        >
          <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'} hover:underline`}>
            Articles
          </span>
        </button>
        <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
          {' > '}
        </span>
        <span className={`[font-family:'Poppins',Helvetica] text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>
          {article.title}
        </span>
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigateToRoute('/quality/articles')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="[font-family:'Poppins',Helvetica]">Retour aux articles</span>
      </Button>

      {/* Article Header Card */}
      <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
        <CardContent className="p-0">
          {/* Featured Image */}
          {hasImage ? (
            <div className="w-full h-[400px] rounded-t-[18px] overflow-hidden">
              <img
                src={article.image.startsWith('http') ? article.image : `http://localhost:8000${article.image}`}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector('.default-icon')) {
                    parent.className = 'w-full h-[400px] rounded-t-[18px] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center';
                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    icon.setAttribute('class', 'w-24 h-24 text-blue-400 default-icon');
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
            <div className="w-full h-[400px] rounded-t-[18px] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <CategoryIcon className="w-24 h-24 text-blue-400" />
            </div>
          )}

          {/* Article Info */}
          <div className="p-6">
            {/* Category Badge */}
            {article.category && (
              <Badge className="h-auto px-3 py-1 bg-blue-100 text-[#007aff] mb-4 inline-flex items-center gap-2">
                <CategoryIcon className="h-4 w-4" />
                {article.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-3xl mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              {article.title}
            </h1>

            {/* Description */}
            {article.description && (
              <p className={`[font-family:'Poppins',Helvetica] text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                {article.description}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex items-center gap-6 flex-wrap pb-4 border-b border-[#e2e2ea]">
              {articleDate && (
                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} />
                  <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {formatDate(articleDate)}
                  </span>
                </div>
              )}
              
              {article.content && (
                <div className="flex items-center gap-2">
                  <BookOpen className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} />
                  <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {readTime} de lecture
                  </span>
                </div>
              )}

              {article.author && (
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`} />
                  <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    {article.author.name || 'Auteur inconnu'}
                  </span>
                </div>
              )}

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: article.title,
                      text: article.description || '',
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    // You could show a toast here
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Content */}
      <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
        <CardContent className="p-6">
          {article.content ? (
            <div 
              className={`article-content [font-family:'Poppins',Helvetica] ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}
              dangerouslySetInnerHTML={{ __html: article.content }}
              style={{
                lineHeight: '1.75',
              }}
            />
          ) : (
            <p className={`[font-family:'Poppins',Helvetica] text-base ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
              {article.description || 'Aucun contenu disponible pour cet article.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* External URL Link */}
      {article.url && (
        <Card className="border-2 border-[#e2e2ea] rounded-[18px] mt-6">
          <CardContent className="p-6">
            <Button
              onClick={() => window.open(article.url, '_blank')}
              className="w-full bg-[#007aff] hover:bg-[#0066cc] text-white"
            >
              Lire l'article complet
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

