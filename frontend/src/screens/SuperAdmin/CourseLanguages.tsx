import React, { useState, useEffect } from 'react';
import { Globe, Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { superAdminService } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { CourseLanguageFormModal } from '../../components/SuperAdmin';

export const CourseLanguages: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [editingLanguageId, setEditingLanguageId] = useState<number | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLanguages();
  }, [currentPage]);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getCourseLanguages({
        search: searchTerm || undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.data contains the languages array
        // and response.data.pagination contains pagination info
        const languagesData = response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        setLanguages(Array.isArray(languagesData) ? languagesData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching languages:', error);
      showError('Erreur', error.message || 'Impossible de charger les langues');
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLanguages();
  };

  const handleDelete = async () => {
    if (!selectedLanguage) return;
    setDeleting(true);
    try {
      await superAdminService.deleteCourseLanguage(selectedLanguage.id);
      success('Succès', 'Langue supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedLanguage(null);
      fetchLanguages();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer la langue');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-blue-500/10">
            <Globe className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Course Languages
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage course languages
            </p>
          </div>
        </div>
        <Button 
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => {
            setEditingLanguageId(undefined);
            setShowLanguageModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Language
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : languages.length === 0 ? (
            <div className="text-center py-12">
              <Globe className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No languages found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Code</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Courses</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((language) => (
                      <tr key={language.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{language.name}</td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{language.code}</td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{language.courses_count || 0}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingLanguageId(language.id);
                                setShowLanguageModal(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLanguage(language);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} languages)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.last_page}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLanguage(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer la langue"
        message={`Êtes-vous sûr de vouloir supprimer la langue "${selectedLanguage?.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
        variant="destructive"
      />

      {/* Language Form Modal */}
      <CourseLanguageFormModal
        isOpen={showLanguageModal}
        onClose={() => {
          setShowLanguageModal(false);
          setEditingLanguageId(undefined);
        }}
        onSuccess={() => {
          fetchLanguages();
        }}
        languageId={editingLanguageId}
      />
    </div>
  );
};
