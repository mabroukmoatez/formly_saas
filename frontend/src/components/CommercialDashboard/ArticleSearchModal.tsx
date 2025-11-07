import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { commercialService } from '../../services/commercial';
import { Article } from '../../services/commercial.types';
import { useToast } from '../ui/toast';

interface ArticleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
}

export const ArticleSearchModal: React.FC<ArticleSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { error: showError } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
    }
  }, [isOpen, searchTerm]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await commercialService.getArticles({
        page: 1,
        per_page: 20,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setArticles(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      showError('Erreur', 'Impossible de charger les articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = (article: Article) => {
    onSelectArticle(article);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className={`relative w-[90%] max-w-[800px] max-h-[80vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <h2 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Rechercher Un Article
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            onClick={onClose}
          >
            <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50'} border`}>
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <Input
              placeholder="Rechercher par nom, référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border-0 flex-1 ${isDark ? 'bg-transparent text-white' : 'bg-transparent'}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col overflow-y-auto p-6 max-h-[calc(80vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? 'border-white' : 'border-gray-800'}`}></div>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Aucun article trouvé
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelectArticle(article)}
                  className={`text-left p-4 rounded-lg border transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {article.designation || article.name || 'Article sans nom'}
                      </div>
                      <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Référence: {article.reference}
                      </div>
                      {article.description && (
                        <div className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {article.description}
                        </div>
                      )}
                      {article.category && (
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {article.category}
                        </div>
                      )}
                    </div>
                    <div className={`text-right ml-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <div className="font-bold text-xl">
                        {parseFloat(article.price_ttc || article.price_ht || String(article.unit_price || '0')).toFixed(2)} €
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {article.unit || 'unité'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <Button
            variant="outline"
            onClick={onClose}
            className={isDark ? 'bg-gray-800 border-gray-600' : ''}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};

