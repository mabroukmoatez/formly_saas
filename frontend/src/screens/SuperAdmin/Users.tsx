import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Users as UsersIcon, Search, Filter, UserPlus, Loader2, Eye, Shield, Ban, CheckCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { UserFormModal } from '../../components/SuperAdmin';

export const Users: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | undefined>();
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const roles = [
    { value: 'all', label: 'All Users' },
    { value: 'student', label: 'Students' },
    { value: 'instructor', label: 'Instructors' },
    { value: 'admin', label: 'Admins' },
    { value: 'superadmin', label: 'Super Admins' },
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getUsers({
        search: searchTerm || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.data contains the users array
        // and response.data.pagination contains pagination info
        const usersData = response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        // Ensure data is an array
        setUsers(Array.isArray(usersData) ? usersData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // Check if endpoint is not implemented yet
      if (error.message?.includes('Not implemented') || error.data?.message?.includes('Not implemented')) {
        showError('Endpoint non disponible', 'Cette fonctionnalité n\'est pas encore implémentée côté backend. Veuillez contacter l\'équipe de développement.');
      } else {
        showError('Erreur', error.message || 'Impossible de charger les utilisateurs');
      }
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleViewUser = async (userId: number) => {
    try {
      setLoadingDetails(true);
      const response = await superAdminService.getUser(userId);
      if (response.success) {
        setUserDetails(response.data);
        setSelectedUser(response.data);
        setShowDetailsModal(true);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les détails de l\'utilisateur');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    try {
      await superAdminService.suspendUser(selectedUser.id, 'Suspended by super admin');
      success('Succès', 'Utilisateur suspendu');
      setShowSuspendModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const handleActivateUser = async () => {
    if (!selectedUser) return;
    try {
      await superAdminService.activateUser(selectedUser.id);
      success('Succès', 'Utilisateur activé');
      setShowActivateModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-purple-500/10">
            <UsersIcon className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              User Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all users across organizations
            </p>
          </div>
        </div>
        <Button 
          className="bg-purple-500 hover:bg-purple-600"
          onClick={() => {
            setEditingUserId(undefined);
            setShowUserModal(true);
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
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
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                No users found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>User</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organization</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {user.name}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-blue-500/10 text-blue-500">
                            {user.role || 'User'}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {user.organization?.organization_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {user.is_active ? (
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
                              onClick={() => handleViewUser(user.id)}
                              title="View details"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {user.is_active ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowSuspendModal(true);
                                }}
                                title="Suspend user"
                              >
                                <Ban className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowActivateModal(true);
                                }}
                                title="Activate user"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
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
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} users)
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

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailsModal(false)}>
          <Card 
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>User Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{userDetails?.name || selectedUser.name}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{userDetails?.email || selectedUser.email}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                    <p className="mt-1">
                      <Badge className="bg-blue-500/10 text-blue-500">
                        {userDetails?.role || selectedUser.role || 'User'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                    <p className="mt-1">
                      {userDetails?.is_active !== false || selectedUser.is_active ? (
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
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organization</label>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {userDetails?.organization?.organization_name || selectedUser.organization?.organization_name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Created At</label>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {userDetails?.created_at || selectedUser.created_at 
                        ? new Date(userDetails?.created_at || selectedUser.created_at).toLocaleString('fr-FR')
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleSuspendUser}
        title="Suspendre l'utilisateur"
        message={`Êtes-vous sûr de vouloir suspendre l'utilisateur "${selectedUser?.name}" ?`}
        confirmText="Suspendre"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Activate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleActivateUser}
        title="Activer l'utilisateur"
        message={`Êtes-vous sûr de vouloir activer l'utilisateur "${selectedUser?.name}" ?`}
        confirmText="Activer"
        cancelText="Annuler"
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUserId(undefined);
        }}
        onSuccess={() => {
          fetchUsers();
        }}
        userId={editingUserId}
      />
    </div>
  );
};

