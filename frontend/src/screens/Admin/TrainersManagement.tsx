import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { trainersService } from '../../services/trainers';
import { Trainer } from '../../services/trainers.types';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  GraduationCap,
  Loader2,
  Calendar,
  TrendingUp,
  Star
} from 'lucide-react';
import { TrainerFormModal } from '../../components/Trainers/TrainerFormModal';
import { TrainerDetailsModal } from '../../components/Trainers/TrainerDetailsModal';
import { TrainerCoursesModal } from '../../components/Trainers/TrainerCoursesModal';

export const TrainersManagement = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState<'name' | 'trainings' | 'collaboration_date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [selectedTrainers, setSelectedTrainers] = useState<Set<string>>(new Set());
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [trainerForCourses, setTrainerForCourses] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, [page, selectedSort, sortOrder, selectedStatus, searchTerm]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await trainersService.getTrainers({
        page,
        per_page: 12,
        search: searchTerm || undefined,
        sort_by: selectedSort,
        sort_order: sortOrder,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      
      if (response.success && response.data) {
        setTrainers(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err: any) {
      console.error('Error fetching trainers:', err);
      showError(t('common.error'), 'Impossible de charger les formateurs');
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchTrainers();
    }
  };

  const handleCreateTrainer = () => {
    setSelectedTrainer(null);
    setIsFormModalOpen(true);
  };

  const handleEditTrainer = async (trainer: Trainer) => {
    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) {
        showError('Erreur', 'ID du formateur manquant');
        return;
      }
      
      // Charger les données complètes du trainer depuis l'API
      const response = await trainersService.getTrainerById(trainerId);
      if (response.success && response.data) {
        setSelectedTrainer(response.data.trainer);
        setIsFormModalOpen(true);
      } else {
        showError('Erreur', 'Impossible de charger les données du formateur');
      }
    } catch (err: any) {
      console.error('Error loading trainer for edit:', err);
      showError('Erreur', 'Impossible de charger les données du formateur');
    }
  };

  const handleViewTrainer = async (trainer: Trainer) => {
    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;
      
      const response = await trainersService.getTrainerById(trainerId);
      if (response.success && response.data) {
        setSelectedTrainer(response.data.trainer);
        setIsDetailsModalOpen(true);
      }
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger les détails du formateur');
    }
  };

  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;
    
    setDeleting(true);
    try {
      await trainersService.deleteTrainer(trainerToDelete);
      success('Succès', 'Formateur supprimé avec succès');
      setShowDeleteModal(false);
      setTrainerToDelete(null);
      fetchTrainers();
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer le formateur');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrainers(new Set(trainers.map(t => t.uuid || t.id?.toString() || '').filter(Boolean)));
    } else {
      setSelectedTrainers(new Set());
    }
  };

  const handleSelectTrainer = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTrainers);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTrainers(newSelected);
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-700' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-700' },
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
    };
    const statusInfo = statusMap[status || 'active'] || statusMap.active;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const allSelected = selectedTrainers.size === trainers.length && trainers.length > 0;
  const someSelected = selectedTrainers.size > 0 && selectedTrainers.size < trainers.length;

  if (loading && trainers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <GraduationCap className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.sidebar.trainers')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Gérez vos formateurs et leurs disponibilités
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleCreateTrainer}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              Ajouter un formateur
            </span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col gap-4 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className={`flex items-center gap-4 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} rounded-[10px] flex-1 min-w-[300px]`}>
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
            <Input
              placeholder="Rechercher un formateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
            />
          </div>

          {/* Sort */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value as any)}
            className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
          >
            <option value="name">Trier par nom</option>
            <option value="trainings">Trier par formations</option>
            <option value="collaboration_date">Trier par date de collaboration</option>
          </select>

          {/* Sort Order */}
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`px-4 py-2.5 rounded-[10px] ${isDark ? 'border-gray-600 bg-gray-700' : 'border-[#d5d6da] bg-white'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        {trainers.length === 0 ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Aucun formateur trouvé
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className="w-[80px] px-[42px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      className={`w-5 h-5 rounded-md border ${allSelected || someSelected ? 'bg-[#e5f3ff] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                    />
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Nom
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Spécialisation
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Statut
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Sessions
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Formations
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Note moyenne
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((trainer) => {
                  const trainerId = trainer.uuid || trainer.id?.toString() || '';
                  return (
                    <TableRow
                      key={trainerId}
                      className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-[#007aff14]'} ${selectedTrainers.has(trainerId) ? 'bg-[#007aff14]' : ''}`}
                    >
                      <TableCell className="px-[42px]">
                        <Checkbox
                          checked={selectedTrainers.has(trainerId)}
                          onCheckedChange={(checked) => handleSelectTrainer(trainerId, checked as boolean)}
                          className={`w-5 h-5 rounded-md border ${selectedTrainers.has(trainerId) ? 'bg-[#007aff14] border-[#007aff]' : 'bg-white border-[#d5d6da]'}`}
                        />
                      </TableCell>
                      <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {trainer.first_name && trainer.last_name 
                          ? `${trainer.first_name} ${trainer.last_name}`
                          : trainer.name || 'N/A'}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {trainer.specialization || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(trainer.status)}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                        {trainer.total_sessions || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => {
                            const trainerName = trainer.first_name && trainer.last_name
                              ? `${trainer.first_name} ${trainer.last_name}`
                              : trainer.name || 'Formateur';
                            setTrainerForCourses({ 
                              id: trainerId, 
                              name: trainerName 
                            });
                            setIsCoursesModalOpen(true);
                          }}
                          className={`font-medium text-[15px] hover:underline transition-all ${
                            trainer.total_courses && trainer.total_courses > 0
                              ? isDark 
                                ? 'text-blue-400 hover:text-blue-300' 
                                : 'text-[#007aff] hover:text-[#0056b3]'
                              : isDark 
                                ? 'text-gray-500 cursor-not-allowed' 
                                : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!trainer.total_courses || trainer.total_courses === 0}
                          title={trainer.total_courses && trainer.total_courses > 0 ? 'Voir les formations' : 'Aucune formation'}
                        >
                          {trainer.total_courses || 0}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                            {trainer.average_rating != null && !isNaN(Number(trainer.average_rating)) 
                              ? Number(trainer.average_rating).toFixed(1) 
                              : '0.0'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center gap-2.5">
                          <button 
                            onClick={() => handleViewTrainer(trainer)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                          </button>
                          <button 
                            onClick={() => handleEditTrainer(trainer)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" style={{ color: primaryColor }} />
                          </button>
                          <button 
                            onClick={() => {
                              setTrainerToDelete(trainerId);
                              setShowDeleteModal(true);
                            }}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:bg-red-50`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </Button>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Page {page} sur {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              disabled={page === pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <TrainerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedTrainer(null);
        }}
        trainer={selectedTrainer}
        onSave={() => {
          setIsFormModalOpen(false);
          setSelectedTrainer(null);
          fetchTrainers();
        }}
      />

      {/* Details Modal */}
      <TrainerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTrainer(null);
        }}
        trainer={selectedTrainer}
      />

      {/* Courses Modal */}
      {trainerForCourses && (
        <TrainerCoursesModal
          isOpen={isCoursesModalOpen}
          onClose={() => {
            setIsCoursesModalOpen(false);
            setTrainerForCourses(null);
          }}
          trainerId={trainerForCourses.id}
          trainerName={trainerForCourses.name}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTrainerToDelete(null);
        }}
        onConfirm={handleDeleteTrainer}
        title="Voulez-vous vraiment supprimer ce formateur ?"
        message="Cette action est irréversible. Le formateur sera définitivement supprimé."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

