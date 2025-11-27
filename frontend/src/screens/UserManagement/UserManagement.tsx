import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../components/ui/dialog';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { NotificationModal } from '../../components/ui/notification-modal';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

interface User {
  id: number;
  name: string;
  email: string;
  status: number;
  role: number;
  phone_number?: string;
  address?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  organization_roles: Array<{
    id: number;
    name: string;
    description: string;
    permissions: string[];
    is_active: boolean;
  }>;
}

interface UserStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  pending_invitations: number;
}

export const UserManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    admin_users: 0,
    pending_invitations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [exporting, setExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_id: '',
    phone: '',
    address: '',
  });

  // Fetch users data from API
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrganizationUsers({
        per_page: 15,
        search: searchTerm,
      });
      
      if (response.success) {
        setUsers(response.data.users.data || []);
        setStats(response.data.stats || {
          total_users: 0,
          active_users: 0,
          admin_users: 0,
          pending_invitations: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to empty data on error
      setUsers([]);
      setStats({
        total_users: 0,
        active_users: 0,
        admin_users: 0,
        pending_invitations: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Refetch users when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);


  const fetchRoles = async () => {
    try {
      const response = await apiService.getOrganizationRoles();
      if (response.success) {
        // According to the API response, roles are in response.data.roles.data
        setAvailableRoles(response.data.roles.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setAvailableRoles([]);
    }
  };

  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case 1:
        return 'default';
      case 0:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'organization admin':
        return 'default';
      case 'content writer':
        return 'secondary';
      case 'support agent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getUserRoleName = (user: User) => {
    if (user.organization_roles && user.organization_roles.length > 0) {
      return user.organization_roles[0].name;
    }
    return 'Utilisateur';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserSelect = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return t('userManagement.stats.pending');
    
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'À l\'instant';
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) {
        return 'Hier';
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else {
        return activityDate.toLocaleDateString('fr-FR');
      }
    }
  };


  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_id: parseInt(formData.role_id),
        status: 1, // Active by default
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      const response = await apiService.createUser(userData);
      if (response.success) {
        setCreateModalOpen(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role_id: '',
          phone: '',
          address: '',
        });
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await apiService.exportUsersCSV();
      if (response.success) {
        // Create a blob from the base64 content
        const csvContent = atob(response.data.csv_content);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', response.data.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showNotification('error', t('modals.notifications.error.general'), t('modals.notifications.error.userCreateFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteUser(userToDelete.id);
      if (response.success) {
        setDeleteModalOpen(false);
        setUserToDelete(null);
        showNotification('success', t('modals.notifications.success.userDeleted'), '');
        fetchUsers(); // Refresh the list
      } else {
        showNotification('error', t('modals.notifications.error.userDeleteFailed'), '');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', t('modals.notifications.error.userDeleteFailed'), '');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role_id: user.organization_roles[0]?.id?.toString() || '',
      phone: user.phone_number || '',
      address: user.address || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Ensure status is always included - use existing status or default to 1
      const userStatus = selectedUser.status !== undefined && selectedUser.status !== null 
        ? selectedUser.status 
        : 1;

      const userData: any = {
        name: formData.name,
        email: formData.email,
        role_id: parseInt(formData.role_id),
        status: userStatus, // Include status field required by backend
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      // Only include password if provided
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          showNotification('error', t('modals.notifications.error.general'), 'Les mots de passe ne correspondent pas');
          return;
        }
        userData.password = formData.password;
      }

      console.log('Updating user with data:', userData); // Debug log
      console.log('Selected user status:', selectedUser.status); // Debug log
      const response = await apiService.updateUser(selectedUser.id, userData);
      if (response.success) {
        setEditModalOpen(false);
        setSelectedUser(null);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role_id: '',
          phone: '',
          address: '',
        });
        showNotification('success', t('modals.notifications.success.userUpdated'), '');
        fetchUsers(); // Refresh the list
      } else {
        showNotification('error', t('modals.notifications.error.userUpdateFailed'), '');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('error', t('modals.notifications.error.userUpdateFailed'), '');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const getOrganizationColors = () => {
    if (organization?.primary_color) {
      return {
        primary: organization.primary_color,
        secondary: organization.secondary_color || organization.primary_color,
        accent: organization.accent_color || organization.primary_color,
      };
    }
    return {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#1e40af',
    };
  };

  const colors = getOrganizationColors();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('userManagement.title')}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('userManagement.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className={`grid w-full grid-cols-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <TabsTrigger value="users">{t('userManagement.tabs.users')}</TabsTrigger>
            <TabsTrigger value="audit">{t('userManagement.tabs.audit')}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('userManagement.stats.activeUsers')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {stats.active_users}
                    </p>
                    <p className="text-xs text-gray-500">
                      +{stats.active_users} {t('userManagement.stats.thisMonth')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.secondary}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.secondary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('userManagement.stats.administrators')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
                      {stats.admin_users}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('userManagement.stats.privilegedAccess')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.accent}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.accent }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('userManagement.stats.pendingInvitations')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {stats.pending_invitations}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('userManagement.stats.pending')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('userManagement.stats.lastConnection')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {formatLastActivity(users[0]?.updated_at)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {users[0]?.email || 'Aucun utilisateur'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* User Management Section */}
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('userManagement.title')}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('userManagement.subtitle')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t('userManagement.actions.searchUser')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex gap-2">
                    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          style={{ 
                            backgroundColor: colors.primary,
                            color: 'white',
                            borderColor: colors.primary,
                          }}
                          className="hover:opacity-90"
                        >
                          {t('userManagement.actions.createUser')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                        <DialogHeader>
                          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                            {t('userManagement.modals.createUser.title')}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">{t('userManagement.modals.createUser.name')}</Label>
                            <Input 
                              id="name" 
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Jean Dupont" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">{t('userManagement.modals.createUser.email')}</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="user@example.com" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">{t('userManagement.modals.createUser.password')}</Label>
                            <Input 
                              id="password" 
                              type="password" 
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              placeholder="Mot de passe" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">{t('userManagement.modals.createUser.confirmPassword')}</Label>
                            <Input 
                              id="confirmPassword" 
                              type="password" 
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              placeholder="Confirmer le mot de passe" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">{t('userManagement.modals.createUser.role')}</Label>
                            <select 
                              className="w-full p-2 border rounded-md"
                              value={formData.role_id}
                              onChange={(e) => handleInputChange('role_id', e.target.value)}
                            >
                              <option value="">Sélectionner un rôle</option>
                              {availableRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="phone">{t('userManagement.modals.createUser.phone')}</Label>
                            <Input 
                              id="phone" 
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="+33 1 23 45 67 89" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="address">{t('userManagement.modals.createUser.address')}</Label>
                            <Textarea 
                              id="address" 
                              value={formData.address}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              placeholder="Adresse complète" 
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                              {t('userManagement.modals.createUser.cancel')}
                            </Button>
                            <Button 
                              style={{ backgroundColor: colors.primary }}
                              onClick={handleCreateUser}
                            >
                              {t('userManagement.modals.createUser.create')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        onClick={() => setViewMode('list')}
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Liste
                      </Button>
                      <Button
                        variant={viewMode === 'cards' ? 'default' : 'outline'}
                        onClick={() => setViewMode('cards')}
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Cartes
                      </Button>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={handleExportCSV}
                      disabled={exporting}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {exporting ? 'Export...' : t('userManagement.actions.exportCSV')}
                    </Button>
                  </div>
                </div>

                {/* User Display */}
                {viewMode === 'list' ? (
                  <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-[#e2e2ea]">
                              <TableHead className="w-12 text-center">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    className="w-5 h-5 rounded-md border-[#6a90b9]"
                                  />
                                </div>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                                  {t('userManagement.table.name')}
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                                  {t('userManagement.table.email')}
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                                  {t('userManagement.table.role')}
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                                  {t('userManagement.table.status')}
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                                  {t('userManagement.table.actions')}
                                </span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow 
                                key={user.id} 
                                className="border-b border-[#e2e2ea] hover:bg-[#f9fafb] transition-colors"
                              >
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    <Checkbox
                                      checked={selectedUsers.includes(user.id)}
                                      onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                                      className="w-5 h-5 rounded-md border-[#6a90b9]"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <img
                                      src={user.image_url || '/assets/images/avatar.svg'}
                                      alt={user.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                                      {user.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#007aff] text-[15px]">
                                    {user.email}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={getRoleBadgeVariant(getUserRoleName(user))}
                                    className="[font-family:'Urbanist',Helvetica] text-[12px] px-2 py-1"
                                  >
                                    {getUserRoleName(user)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={getStatusBadgeVariant(user.status)}
                                    className={`[font-family:'Urbanist',Helvetica] text-[12px] px-2 py-1 ${
                                      user.status === 1 
                                        ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]' 
                                        : 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
                                    }`}
                                  >
                                    {t(`userManagement.status.${user.status}`)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditUser(user)}
                                      className="h-8 w-8 p-0 hover:bg-[#f3f4f6]"
                                    >
                                      <svg className="w-4 h-4 text-[#6a90b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteUser(user)}
                                      className="h-8 w-8 p-0 hover:bg-[#fee2e2]"
                                    >
                                      <svg className="w-4 h-4 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.image_url || '/assets/images/avatar.svg'}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {user.name}
                              </h3>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8 p-0 hover:bg-[#f3f4f6]"
                            >
                              <svg className="w-4 h-4 text-[#6a90b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="h-8 w-8 p-0 hover:bg-[#fee2e2]"
                            >
                              <svg className="w-4 h-4 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rôle</span>
                            <Badge variant={getRoleBadgeVariant(getUserRoleName(user))}>
                              {getUserRoleName(user)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Statut</span>
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                              {t(`userManagement.status.${user.status}`)}
                            </Badge>
                          </div>
                          
                          {user.phone_number && (
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Téléphone</span>
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {user.phone_number}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dernière activité</span>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {formatLastActivity(user.updated_at)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedUsers.length} {t('userManagement.actions.selected')}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      {t('userManagement.actions.previous')}
                    </Button>
                    <Button variant="outline" size="sm">
                      {t('userManagement.actions.next')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Journal d'Audit des Utilisateurs
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher dans les logs..."
                    className="w-64"
                  />
                  <Button variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exporter
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Audit Log Entry Example */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Connexion</Badge>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date().toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Jean Dupont</strong> s'est connecté depuis l'adresse IP 192.168.1.100
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Modification</Badge>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(Date.now() - 3600000).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Marie Martin</strong> a modifié le profil de <strong>Pierre Durand</strong>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Création</Badge>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(Date.now() - 7200000).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Admin</strong> a créé un nouvel utilisateur <strong>Support Prestashop</strong>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pagination for audit logs */}
              <div className="flex justify-between items-center mt-6">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Affichage de 1 à 3 sur 15 entrées
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm">
                    Suivant
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                {t('userManagement.modals.editUser.title')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{t('userManagement.modals.createUser.name')}</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Jean Dupont" 
                />
              </div>
              <div>
                <Label htmlFor="edit-email">{t('userManagement.modals.createUser.email')}</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com" 
                />
              </div>
              <div>
                <Label htmlFor="edit-password">{t('userManagement.modals.createUser.password')} (optionnel)</Label>
                <Input 
                  id="edit-password" 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Nouveau mot de passe" 
                />
              </div>
              {formData.password && (
                <div>
                  <Label htmlFor="edit-confirmPassword">{t('userManagement.modals.createUser.confirmPassword')}</Label>
                  <Input 
                    id="edit-confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirmer le nouveau mot de passe" 
                  />
                </div>
              )}
              <div>
                <Label htmlFor="edit-role">{t('userManagement.modals.createUser.role')}</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={formData.role_id}
                  onChange={(e) => handleInputChange('role_id', e.target.value)}
                >
                  <option value="">Sélectionner un rôle</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-phone">{t('userManagement.modals.createUser.phone')}</Label>
                <Input 
                  id="edit-phone" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89" 
                />
              </div>
              <div>
                <Label htmlFor="edit-address">{t('userManagement.modals.createUser.address')}</Label>
                <Textarea 
                  id="edit-address" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Adresse complète" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  {t('userManagement.modals.createUser.cancel')}
                </Button>
                <Button 
                  style={{ backgroundColor: colors.primary }}
                  onClick={handleUpdateUser}
                >
                  Mettre à jour
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDeleteUser}
          title={t('modals.confirmation.deleteUser.title')}
          message={t('modals.confirmation.deleteUser.message')}
          confirmText={t('modals.confirmation.deleteUser.confirmText')}
          cancelText={t('modals.confirmation.deleteUser.cancelText')}
          type="danger"
          isLoading={deleting}
        />

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          buttonText={t('modals.notifications.success.closeText')}
          autoClose={true}
          autoCloseDelay={3000}
        />
      </div>
    </DashboardLayout>
  );
};
