import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { GraduationCap, Search, Filter, UserPlus, Loader2, Eye, Ban, CheckCircle, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const Instructors: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchInstructors();
  }, [currentPage]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getInstructors({
        search: searchTerm || undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.data contains the instructors array
        // and response.data.pagination contains pagination info
        const instructorsData = response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        setInstructors(Array.isArray(instructorsData) ? instructorsData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching instructors:', error);
      // Check if endpoint is not implemented yet
      if (error.message?.includes('Not implemented') || error.data?.message?.includes('Not implemented')) {
        showError('Endpoint non disponible', 'Cette fonctionnalité n\'est pas encore implémentée côté backend. Veuillez contacter l\'équipe de développement.');
      } else {
        showError('Erreur', error.message || 'Impossible de charger les instructeurs');
      }
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchInstructors();
  };

  const handleSuspendInstructor = async (userId: number) => {
    try {
      await superAdminService.suspendUser(userId, 'Suspended by super admin');
      success('Succès', 'Instructeur suspendu');
      fetchInstructors();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const handleActivateInstructor = async (userId: number) => {
    try {
      await superAdminService.activateUser(userId);
      success('Succès', 'Instructeur activé');
      fetchInstructors();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const getApprovalStatus = (instructor: any) => {
    if (instructor.is_approved === true) return 'approved';
    if (instructor.is_approved === false) return 'rejected';
    return 'pending';
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-orange-500/10">
            <GraduationCap className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Instructor Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all instructors across organizations
            </p>
          </div>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search instructors..."
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

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                No instructors found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Instructor</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organization</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Courses</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Approval</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructors.map((instructor) => {
                      const approvalStatus = getApprovalStatus(instructor);
                      return (
                        <tr key={instructor.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {instructor.name || instructor.first_name + ' ' + instructor.last_name || 'N/A'}
                          </td>
                          <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {instructor.email}
                          </td>
                          <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {instructor.organization?.organization_name || '-'}
                          </td>
                          <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {instructor.courses_count || 0}
                          </td>
                          <td className="py-3 px-4">
                            {approvalStatus === 'approved' ? (
                              <Badge className="bg-green-500/10 text-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            ) : approvalStatus === 'rejected' ? (
                              <Badge className="bg-red-500/10 text-red-500">
                                <Ban className="w-3 h-3 mr-1" />
                                Rejected
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-500">
                                <Shield className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {instructor.is_active !== false ? (
                              <Badge className="bg-green-500/10 text-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-500">
                                <Ban className="w-3 h-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // View instructor details - you can implement a modal here if needed
                                  console.log('View instructor:', instructor.id);
                                }}
                                title="View details"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {instructor.is_active !== false ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSuspendInstructor(instructor.id)}
                                  title="Suspend instructor"
                                >
                                  <Ban className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleActivateInstructor(instructor.id)}
                                  title="Activate instructor"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} instructors)
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
    </div>
  );
};
