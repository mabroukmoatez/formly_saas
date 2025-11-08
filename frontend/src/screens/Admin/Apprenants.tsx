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
  X
} from 'lucide-react';
import { StudentCoursesModal } from '../../components/Students/StudentCoursesModal';
import { StudentFormModal } from '../../components/Students/StudentFormModal';
import { StudentDetailsModal } from '../../components/Students/StudentDetailsModal';
import { useStudentsExportWithSelection } from '../../hooks/useStudentsExport';
import { companiesService } from '../../services/Companies';
import { courseCreation } from '../../services/courseCreation';

export const Apprenants = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  
  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [formations, setFormations] = useState<Array<{id: string; title: string}>>([]);
  const [companies, setCompanies] = useState<Array<{id: number; name: string}>>([]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentForCourses, setStudentForCourses] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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

  // Debounce search term with 2+ character minimum
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only search if 2+ characters or empty (to show all results)
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm);
        // Reset to page 1 when search term changes
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, [page, debouncedSearchTerm, selectedFormation, selectedCompany, dateFrom, dateTo]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await companiesService.getCompaniesList();
        if (response.success && Array.isArray(response.data)) {
          const companyList = response.data.map((company: any) => ({
            id: company.id,
            name: company.name
          }));
          setCompanies(companyList);
        }
      } catch (error) {
        setCompanies([]);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseCreation.getCourses();
        if (response.success && response.data?.courses) {
          const courseList = response.data.courses.data?.map((course: any) => ({
            id: course.uuid || course.id,
            title: course.title
          })) || [];
          setFormations(courseList);
        }
      } catch (error) {
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

      // Build filter params with proper type conversion
      const params: any = {
        page,
        per_page: 10,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      if (selectedCompany && selectedCompany !== '') {
        params.company_id = selectedCompany;
      }

      if (selectedFormation && selectedFormation !== '') {
        params.course_id = selectedFormation;
      }

      if (dateFrom && dateFrom !== '') {
        params.date_from = dateFrom;
      }

      if (dateTo && dateTo !== '') {
        params.date_to = dateTo;
      }

      const response = await studentsService.getStudents(params);

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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFormation('');
    setSelectedCompany('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setIsFormModalOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    // Open modal immediately with basic student data
    // StudentDetailsModal will load full details on open
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
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

  const handleDeleteMultiple = () => {
    if (selectedCount === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setDeleting(true);
    try {
      await studentsService.bulkDelete(selectedIds);
      success('Succès', `${selectedCount} apprenant(s) supprimé(s) avec succès`);
      clearSelection();
      setShowBulkDeleteModal(false);
      fetchStudents();
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer les apprenants');
    } finally {
      setDeleting(false);
    }
  };

  // Export with current filters or selected items
  const handleExport = async (format: 'csv' | 'excel') => {
    if (selectedCount > 0) {
      // Export selected
      await exportSelected();
    } else {
      // Export all with filters
      await exportAll({
        search: debouncedSearchTerm || undefined,
        company_id: selectedCompany || undefined,
        course_id: selectedFormation || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
    }
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
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Apprenants
          </h1>
        </div>
        <button
          onClick={handleCreateStudent}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-5 h-5" />
          Nouvel Apprenant
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Apprenants</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pagination.total || 0}</div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Apprenants Actifs</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {students.filter(s => s.is_active !== false).length}
          </div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sélectionnés</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {selectedCount}
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Rechercher un apprenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2`}
                style={{ focusRing: primaryColor }}
              />
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {(selectedFormation || selectedCompany || dateFrom || dateTo) && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                {[selectedFormation, selectedCompany, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exportingAll || exportingSelected}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="w-5 h-5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exportingAll || exportingSelected}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="w-5 h-5" />
              Excel
            </button>
          </div>

          {selectedCount > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="px-4 py-2 rounded-lg bg-red-600 text-white flex items-center gap-2 hover:bg-red-700"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer ({selectedCount})
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Formation Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Formation
              </label>
              <select
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Toutes les formations</option>
                {formations.map(formation => (
                  <option key={formation.id} value={formation.id}>{formation.title}</option>
                ))}
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Entreprise
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Toutes les entreprises</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date d'inscription - De
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date d'inscription - À
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Clear Filters */}
            {(selectedFormation || selectedCompany || dateFrom || dateTo) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <X className="w-5 h-5" />
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apprenants Table */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden`}>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && isAllSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nom
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prénom
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Téléphone
                </th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Formations
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Entreprise
                </th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Inscription
                </th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Users className={`w-16 h-16 mb-4 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Aucun apprenant trouvé
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const studentId = student.uuid || student.id?.toString() || '';
                  const studentIsSelected = isSelected(studentId);

                  return (
                    <tr
                      key={studentId}
                      className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
                        studentIsSelected ? (isDark ? 'bg-gray-700/50' : 'bg-blue-50') : ''
                      } hover:${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={studentIsSelected}
                          onChange={() => toggleStudent(studentId)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {student.last_name || student.name || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {student.first_name || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {student.email}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {student.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            const studentName = `${student.first_name || ''} ${student.last_name || student.name || ''}`.trim();
                            setStudentForCourses({
                              id: studentId,
                              name: studentName || 'Apprenant'
                            });
                            setIsCoursesModalOpen(true);
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                          } hover:opacity-80 transition-opacity`}
                          disabled={!student.total_courses || student.total_courses === 0}
                        >
                          {student.total_courses || 0}
                        </button>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {student.company?.name || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {student.registration_date
                          ? new Date(student.registration_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className={`p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                          </button>
                          <button
                            onClick={() => {
                              setStudentToDelete(studentId);
                              setShowDeleteModal(true);
                            }}
                            className={`p-2 rounded hover:bg-red-100 transition-colors`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className={`flex items-center justify-center gap-2 px-4 py-4 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-100'
              } ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  page === pageNum
                    ? 'text-white'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={page === pageNum ? { backgroundColor: primaryColor } : {}}
              >
                {pageNum}
              </button>
            ))}

            {pagination.total_pages > 5 && (
              <>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>...</span>
                <button
                  onClick={() => setPage(pagination.total_pages)}
                  className={`px-3 py-1 rounded ${
                    isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pagination.total_pages}
                </button>
              </>
            )}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.total_pages}
              className={`px-3 py-1 rounded ${
                page === pagination.total_pages
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-100'
              } ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Next
            </button>
          </div>
        )}
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

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Confirmer la suppression multiple"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedCount} apprenant(s) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};