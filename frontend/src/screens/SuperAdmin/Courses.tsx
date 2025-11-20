import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BookOpen, Search, Filter, Loader2, Eye, CheckCircle, XCircle, Clock, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const Courses: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const statuses = [
    { value: 'all', label: 'All Courses' },
    { value: '0', label: 'Pending Approval' },
    { value: '1', label: 'Approved' },
    { value: '3', label: 'On Hold' },
    { value: '2', label: 'Rejected' },
  ];

  useEffect(() => {
    fetchCourses();
    fetchStatistics();
  }, [currentPage, selectedStatus]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getCourses({
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.courses contains the courses array
        // and response.data.pagination contains pagination info
        const coursesData = response.data?.courses || response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        // Ensure data is an array
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      showError('Erreur', error.message || 'Impossible de charger les cours');
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await superAdminService.getCourseStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCourses();
  };

  const handleApproveCourse = async (courseId: number) => {
    try {
      await superAdminService.approveCourse(courseId);
      success('Succès', 'Cours approuvé');
      fetchCourses();
      fetchStatistics();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const handleRejectCourse = async (courseId: number) => {
    try {
      await superAdminService.rejectCourse(courseId, 'Rejected by super admin');
      success('Succès', 'Cours rejeté');
      fetchCourses();
      fetchStatistics();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-yellow-500/10 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 1:
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 2:
        return <Badge className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 3:
        return <Badge className="bg-orange-500/10 text-orange-500"><Clock className="w-3 h-3 mr-1" />On Hold</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      case 3: return 'On Hold';
      default: return 'Unknown';
    }
  };

  const handleViewCourse = async (course: any) => {
    setSelectedCourse(course);
    setShowViewModal(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Fetch all courses for export (without pagination)
      const response = await superAdminService.getCourses({
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        per_page: 1000, // Get all courses
        page: 1,
      });

      let coursesToExport: any[] = [];
      if (response.success) {
        const coursesData = response.data?.courses || response.data?.data || response.data;
        coursesToExport = Array.isArray(coursesData) ? coursesData : [];
      }

      if (coursesToExport.length === 0) {
        showError('Erreur', 'Aucun cours à exporter');
        return;
      }

      // Prepare CSV data
      const csvData = coursesToExport.map(course => ({
        'ID': course.id,
        'Titre': course.title || '',
        'Sous-titre': course.subtitle || '',
        'Organisation': course.organization?.organization_name || '-',
        'Instructeur': course.instructor?.name || '-',
        'Catégorie': course.category?.name || '-',
        'Statut': getStatusLabel(course.status),
        'Prix': course.price || '0.00',
        'Devise': course.currency || 'EUR',
        'Inscriptions': course.enrollments_count || 0,
        'Note moyenne': course.average_rating || '0.00',
        'Date de création': course.created_at ? new Date(course.created_at).toLocaleDateString('fr-FR') : '-',
      }));

      // Generate CSV
      const headers = Object.keys(csvData[0]);
      const csv = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `courses_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      success('Succès', `${coursesToExport.length} cours exportés avec succès`);
    } catch (error: any) {
      console.error('Error exporting courses:', error);
      showError('Erreur', error.message || 'Impossible d\'exporter les cours');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-green-500/10">
            <BookOpen className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Course Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage courses across all organizations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting || courses.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {statistics.total_courses || 0}
              </p>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Approved</p>
              <p className={`text-2xl font-bold text-green-500`}>
                {statistics.approved || 0}
              </p>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className={`text-2xl font-bold text-yellow-500`}>
                {statistics.pending || 0}
              </p>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <p className="text-sm text-orange-600">On Hold</p>
              <p className={`text-2xl font-bold text-orange-500`}>
                {statistics.on_hold || 0}
              </p>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Rejected</p>
              <p className={`text-2xl font-bold text-red-500`}>
                {statistics.rejected || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                No courses found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Course</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organization</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Instructor</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enrollments</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <div>
                            <p className="font-semibold">{course.title}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {course.category?.name || 'No category'}
                            </p>
                          </div>
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {course.organization?.organization_name || '-'}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {course.instructor?.name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(course.status)}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {course.enrollments_count || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewCourse(course)}
                              title="Voir les détails"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {course.status === 0 && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-green-500 hover:text-green-600"
                                  onClick={() => handleApproveCourse(course.id)}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleRejectCourse(course.id)}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} courses)
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

      {/* View Course Modal */}
      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowViewModal(false)}>
          <Card 
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Détails du cours
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Titre
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedCourse.title || '-'}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sous-titre
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedCourse.subtitle || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Organisation
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.organization?.organization_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Instructeur
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.instructor?.name || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Catégorie
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.category?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Statut
                    </p>
                    {getStatusBadge(selectedCourse.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Prix
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.price || '0.00'} {selectedCourse.currency || 'EUR'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Inscriptions
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.enrollments_count || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Note moyenne
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.average_rating || '0.00'} / 5
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date de création
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.created_at 
                        ? new Date(selectedCourse.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Description
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCourse.description}
                    </p>
                  </div>
                )}

                {selectedCourse.slug && (
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Slug
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedCourse.slug}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

