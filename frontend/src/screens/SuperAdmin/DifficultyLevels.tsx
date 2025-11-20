import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { DifficultyLevelFormModal } from '../../components/SuperAdmin';

export const DifficultyLevels: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<number | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLevels();
  }, [currentPage]);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getDifficultyLevels({
        search: searchTerm || undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.data contains the levels array
        // and response.data.pagination contains pagination info
        const levelsData = response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        setLevels(Array.isArray(levelsData) ? levelsData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching difficulty levels:', error);
      showError('Erreur', error.message || 'Impossible de charger les niveaux de difficulté');
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLevels();
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;
    setDeleting(true);
    try {
      await superAdminService.deleteDifficultyLevel(selectedLevel.id);
      success('Succès', 'Niveau de difficulté supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedLevel(null);
      fetchLevels();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le niveau de difficulté');
    } finally {
      setDeleting(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'bg-green-500/10 text-green-500';
    if (level <= 4) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-purple-500/10">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Difficulty Levels
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage course difficulty levels
            </p>
          </div>
        </div>
        <Button 
          className="bg-purple-500 hover:bg-purple-600"
          onClick={() => {
            setEditingLevelId(undefined);
            setShowLevelModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Level
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search difficulty levels..."
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
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : levels.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No difficulty levels found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Level</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Courses</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level) => (
                      <tr key={level.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{level.name}</td>
                        <td className="py-3 px-4">
                          <Badge className={getLevelColor(level.level || level.value || 1)}>
                            Level {level.level || level.value || 1}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{level.courses_count || 0}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingLevelId(level.id);
                                setShowLevelModal(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLevel(level);
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
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} levels)
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
          setSelectedLevel(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer le niveau de difficulté"
        message={`Êtes-vous sûr de vouloir supprimer le niveau "${selectedLevel?.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
        variant="destructive"
      />

      {/* Difficulty Level Form Modal */}
      <DifficultyLevelFormModal
        isOpen={showLevelModal}
        onClose={() => {
          setShowLevelModal(false);
          setEditingLevelId(undefined);
        }}
        onSuccess={() => {
          fetchLevels();
        }}
        levelId={editingLevelId}
      />
    </div>
  );
};
