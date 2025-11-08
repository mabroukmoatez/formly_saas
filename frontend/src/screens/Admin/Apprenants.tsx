import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { studentsService } from '../../services/Students';
import { Student } from '../../services/Students.types';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  Loader2,
  Users,
  Download,
  Filter,
  ChevronDown
} from 'lucide-react';
import { StudentCoursesModal } from '../../components/Students/StudentCoursesModal';
import { StudentFormModal } from '../../components/Students/StudentFormModal';
import { StudentDetailsModal } from '../../components/Students/StudentDetailsModal';
import { useStudentsExportWithSelection } from '../../hooks/useStudentsExport';
import api from '../../services/api';

export const Apprenants = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  
  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [formations, setFormations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentForCourses, setStudentForCourses] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Hook pour la gestion de l'export et de la sélection
  const studentIds = useMemo(() => 
    students.map(s => s.uuid || s.id?.toString() || '').filter(Boolean),
    [students]
  );
const {
  selectedCount,
  selectedIds,
  toggleStudent,
  toggleAll,
  isSelected,
  isAllSelected,
  exportSelected,
  exportAll,
  exportingSelected,
  exportingAll,
  selectedError,
  selectedSuccess,
  allError,
  allSuccess,
  clearSelection,
} = useStudentsExportWithSelection(studentIds);

  useEffect(() => {
    fetchStudents();
  }, [page, searchTerm]);

  useEffect(() => {
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/organization/companies/list');
      if (response.success && Array.isArray(response.data)) {
        const companyNames = response.data.map((company: any) => company.name);
        setCompanies(companyNames);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };
  fetchCompanies();
}, []);

useEffect(() => {
  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/organization/courses/');
      if (response.success && response.data?.courses) {
        const courseNames = response.data.courses.data?.map((course: any) => course.title) || [];
        setFormations(courseNames);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setFormations([]);
    }
  };
  fetchCourses();
}, []);
  // Afficher les messages de succès/erreur pour les exports
  useEffect(() => {
    if (selectedSuccess) {
      success('Succès', selectedSuccess);
    }
    if (allSuccess) {
      success('Succès', allSuccess);
    }
  }, [selectedSuccess, allSuccess, success]);

  useEffect(() => {
    if (selectedError) {
      showError('Erreur', selectedError);
    }
    if (allError) {
      showError('Erreur', allError);
    }
  }, [selectedError, allError, showError]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsService.getStudents({
        page,
        per_page: 10,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        const studentsData = Array.isArray(response.data) ? response.data : [];
        setStudents(studentsData);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err: any) {
      showError(t('common.error'), 'Impossible de charger les apprenants');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchStudents();
  };

  const resetFilters = () => {
    setSelectedFormation('');
    setSelectedCompany('');
    setDateFrom('');
    setDateTo('');
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setIsFormModalOpen(true);
  };

  const handleEditStudent = async (student: Student) => {
    try {
      const studentId = student.uuid || student.id?.toString();
      if (!studentId) {
        showError('Erreur', 'ID de l\'apprenant manquant');
        return;
      }
      
      const response = await studentsService.getStudentById(studentId);
      if (response.success && response.data) {
        setSelectedStudent(response.data.student);
        setIsFormModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error loading student for edit:', err);
      showError('Erreur', 'Impossible de charger les données de l\'apprenant');
    }
  };

  const handleViewStudent = async (student: Student) => {
    try {
      const studentId = student.uuid || student.id?.toString();
      if (!studentId) return;
      
      const response = await studentsService.getStudentById(studentId);
      if (response.success && response.data) {
        setSelectedStudent(response.data.student);
        setIsDetailsModalOpen(true);
      }
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger les détails de l\'apprenant');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    setDeleting(true);
    try {
      await studentsService.deleteStudent(studentToDelete);
      success('Succès', 'Apprenant supprimé avec succès');
      setShowDeleteModal(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer l\'apprenant');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedCount === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedCount} apprenant(s) ?`)) {
      return;
    }
    
    try {
      await studentsService.deleteMultipleStudents(selectedIds);
      success('Succès', `${selectedCount} apprenant(s) supprimé(s) avec succès`);
      clearSelection();
      fetchStudents();
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer les apprenants');
    }
  };

  // Export avec les filtres actuels
  const handleExportAllWithFilters = async () => {
    await exportAll({
      search: searchTerm || undefined,
    });
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = selectedFormation || selectedCompany || dateFrom || dateTo;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 px-[27px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 
            className={`font-bold text-[28px] ${isDark ? 'text-white' : 'text-[#19294a]'}`}
            style={{ fontFamily: 'Poppins, Helvetica' }}
          >
            Gestion des apprenants
          </h1>
          
          <Button
            onClick={handleCreateStudent}
            className="inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="font-medium text-[15px] text-white">
              Ajouter Apprenant
            </span>
          </Button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-[10px] ${
            isDark ? 'bg-gray-800' : 'bg-[#f8f9fa]'
          }`}>
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Titre, Mot-Clé"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border-0 bg-transparent ${
                isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-700 placeholder:text-gray-400'
              } focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
            />
          </div>

          {/* Filter Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={`px-4 py-2.5 rounded-[10px] border ${
              isDark ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            <span>Filtre</span>
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {/* Bulk Delete Button - Modern Design */}
          {selectedCount > 0 && (
            <Button
              onClick={handleDeleteMultiple}
              variant="outline"
              className={`px-4 py-2.5 rounded-[10px] border ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isDark ? undefined : `${primaryColor}10`,
                borderColor: isDark ? undefined : `${primaryColor}30`
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" style={{ color: primaryColor }} />
              <span style={{ color: primaryColor }}>Supprimer ({selectedCount})</span>
            </Button>
          )}

          {/* Export Excel Button - Modern Design */}
          {selectedCount > 0 ? (
            <Button
              onClick={() => exportSelected()}
              disabled={exportingSelected}
              variant="outline"
              className={`px-4 py-2.5 rounded-[10px] border ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isDark ? undefined : `${primaryColor}10`,
                borderColor: isDark ? undefined : `${primaryColor}30`
              }}
            >
              {exportingSelected ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" style={{ color: primaryColor }} />
              ) : (
                <Download className="w-4 h-4 mr-2" style={{ color: primaryColor }} />
              )}
              <span style={{ color: primaryColor }}>Export EXCEL ({selectedCount})</span>
            </Button>
          ) : (
            <Button
              onClick={handleExportAllWithFilters}
              disabled={exportingAll}
              variant="outline"
              className={`px-4 py-2.5 rounded-[10px] border ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isDark ? undefined : `${primaryColor}10`,
                borderColor: isDark ? undefined : `${primaryColor}30`
              }}
            >
              {exportingAll ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" style={{ color: primaryColor }} />
              ) : (
                <Download className="w-4 h-4 mr-2" style={{ color: primaryColor }} />
              )}
              <span style={{ color: primaryColor }}>Export EXCEL</span>
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={`mb-6 p-6 rounded-xl border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Formation Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Formation
                  </label>
                  <select
                    value={selectedFormation}
                    onChange={(e) => setSelectedFormation(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-${primaryColor}`}
                  >
                    <option value="">Sélectionner</option>
                    {formations.map(formation => (
                      <option key={formation} value={formation}>{formation}</option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Entreprise
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-${primaryColor}`}
                  >
                    <option value="">Sélectionner</option>
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date D'inscription
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="De"
                      className={`flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>À</span>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="À"
                      className={`flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:flex-shrink-0">
                {hasActiveFilters && (
                  <Button
                    onClick={resetFilters}
                    variant="ghost"
                    className="text-sm"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  onClick={applyFilters}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white px-6"
                >
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={`rounded-[18px] border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } overflow-hidden`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Liste des Apprenants
            </h2>
            {selectedCount > 0 && (
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {students.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-16">
              <Users className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Aucun apprenant trouvé
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="px-3 py-3 text-left w-10">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={(checked) => toggleAll()}
                          className="w-5 h-5"
                        />
                      </th>
                      <th className={`px-3 py-3 text-left text-sm font-semibold min-w-[100px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Nom
                      </th>
                      <th className={`px-3 py-3 text-left text-sm font-semibold min-w-[100px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Prénom
                      </th>
                      <th className={`px-3 py-3 text-left text-sm font-semibold min-w-[180px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Email
                      </th>
                      <th className={`px-3 py-3 text-left text-sm font-semibold min-w-[120px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Téléphone
                      </th>
                      <th className={`px-3 py-3 text-center text-sm font-semibold min-w-[140px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Formations
                      </th>
                      <th className={`px-3 py-3 text-left text-sm font-semibold min-w-[150px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Entreprise
                      </th>
                      <th className={`px-3 py-3 text-center text-sm font-semibold min-w-[120px] ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Inscription
                      </th>
                      <th className={`px-3 py-3 text-center text-sm font-semibold w-24 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const studentId = student.uuid || student.id?.toString() || '';
                      const studentIsSelected = isSelected(studentId);
                      
                      return (
                        <tr
                          key={studentId}
                          className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
                            studentIsSelected ? (isDark ? 'bg-gray-700/50' : 'bg-blue-50/50') : ''
                          } hover:${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} transition-colors`}
                        >
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={studentIsSelected}
                              onCheckedChange={() => toggleStudent(studentId)}
                              className="w-5 h-5"
                            />
                          </td>
                          <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {student.last_name?.charAt(0) || student.name?.charAt(0) || 'U'}
                              </div>
                              <span className="truncate">{student.last_name || student.name || '-'}</span>
                            </div>
                          </td>
                          <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {student.first_name || '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            <span className="truncate block">{student.email}</span>
                          </td>
                          <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {student.phone || '-'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => {
                                const studentName = `${student.first_name || ''} ${student.last_name || student.name || ''}`.trim();
                                setStudentForCourses({
                                  id: studentId,
                                  name: studentName || 'Apprenant'
                                });
                                setIsCoursesModalOpen(true);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                !student.total_courses || student.total_courses === 0
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'hover:opacity-80'
                              }`}
                              style={{
                                backgroundColor: `${primaryColor}15`,
                                color: primaryColor,
                                border: `1px solid ${primaryColor}30`
                              }}
                              disabled={!student.total_courses || student.total_courses === 0}
                            >
                              {student.total_courses || 0}
                            </button>
                          </td>
                          <td className={`px-3 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            <span className="truncate block">{student.company?.name || '-'}</span>
                          </td>
                          <td className={`px-3 py-3 text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {student.registration_date
                              ? new Date(student.registration_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              : '-'}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewStudent(student)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                              </button>
                              <button
                                onClick={() => {
                                  setStudentToDelete(studentId);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className={`flex items-center justify-center gap-2 px-6 py-4 border-t ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <Button
                    variant="ghost"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className={isDark ? 'text-gray-300' : ''}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(10, pagination.total_pages) }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'ghost'}
                      onClick={() => setPage(pageNum)}
                      className={page === pageNum ? '' : (isDark ? 'text-gray-300' : '')}
                      style={page === pageNum ? { backgroundColor: primaryColor } : {}}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  
                  {pagination.total_pages > 10 && (
                    <>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>...</span>
                      <Button
                        variant="ghost"
                        onClick={() => setPage(pagination.total_pages)}
                        className={isDark ? 'text-gray-300' : ''}
                      >
                        {pagination.total_pages}
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    disabled={page === pagination.total_pages}
                    onClick={() => setPage(page + 1)}
                    className={isDark ? 'text-gray-300' : ''}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSave={() => {
          setIsFormModalOpen(false);
          setSelectedStudent(null);
          fetchStudents();
        }}
      />

      <StudentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onEdit={(student) => {
          setIsDetailsModalOpen(false);
          setSelectedStudent(student);
          setIsFormModalOpen(true);
        }}
        onDelete={(studentId) => {
          setStudentToDelete(studentId);
          setShowDeleteModal(true);
        }}
      />

      {studentForCourses && (
        <StudentCoursesModal
          isOpen={isCoursesModalOpen}
          onClose={() => {
            setIsCoursesModalOpen(false);
            setStudentForCourses(null);
          }}
          studentId={studentForCourses.id}
          studentName={studentForCourses.name}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleDeleteStudent}
        title={t('students.deleteConfirmTitle')}
        message={t('students.deleteConfirmMessage')}
        confirmText={t('students.confirmDelete')}
        cancelText={t('students.cancelDelete')}
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};