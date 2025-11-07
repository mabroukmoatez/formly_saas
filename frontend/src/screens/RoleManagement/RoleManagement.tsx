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

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  users: Array<{
    id: number;
    name: string;
    email: string;
    image_url?: string;
    pivot: {
      organization_role_id: number;
      user_id: number;
    };
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoleStats {
  total_roles: number;
  active_roles: number;
  inactive_roles: number;
  total_permissions: number;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  category: string;
}

export const RoleManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [stats, setStats] = useState<RoleStats>({
    total_roles: 0,
    active_roles: 0,
    inactive_roles: 0,
    total_permissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('roles');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
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

  // Fetch roles and permissions data from API
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrganizationRoles({
        per_page: 15,
        search: searchTerm,
      });
      
      if (response.success) {
        setRoles(response.data.roles.data || []);
        setStats(response.data.stats || {
          total_roles: 0,
          active_roles: 0,
          inactive_roles: 0,
          total_permissions: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to empty data on error
      setRoles([]);
      setStats({
        total_roles: 0,
        active_roles: 0,
        inactive_roles: 0,
        total_permissions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await apiService.getAvailablePermissions();
      if (response.success) {
        // Transform the response data to match our interface
        const permissionsList: Permission[] = [];
        Object.entries(response.data).forEach(([category, perms]: [string, any]) => {
          perms.forEach((perm: any) => {
            permissionsList.push({
              id: perm.id,
              name: perm.name,
              display_name: perm.display_name,
              description: perm.description,
              category: category,
            });
          });
        });
        setPermissions(permissionsList);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    }
  };

  // Refetch roles when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchRoles();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  const handleRoleSelect = (roleId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, roleId]);
    } else {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRoles(roles.map(role => role.id));
    } else {
      setSelectedRoles([]);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = async () => {
    try {
      const roleData = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        is_active: true,
      };

      const response = await apiService.createRole(roleData);
      if (response.success) {
        setCreateModalOpen(false);
        setFormData({
          name: '',
          description: '',
          permissions: [],
        });
        showNotification('success', t('modals.notifications.success.roleCreated'), '');
        fetchRoles(); // Refresh the list
      } else {
        showNotification('error', t('modals.notifications.error.roleCreateFailed'), '');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      showNotification('error', t('modals.notifications.error.roleCreateFailed'), '');
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setEditModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const roleData = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        is_active: selectedRole.is_active,
      };

      const response = await apiService.updateRole(selectedRole.id, roleData);
      if (response.success) {
        setEditModalOpen(false);
        setSelectedRole(null);
        setFormData({
          name: '',
          description: '',
          permissions: [],
        });
        showNotification('success', t('modals.notifications.success.roleUpdated'), '');
        fetchRoles(); // Refresh the list
      } else {
        showNotification('error', t('modals.notifications.error.roleUpdateFailed'), '');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showNotification('error', t('modals.notifications.error.roleUpdateFailed'), '');
    }
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteRole(roleToDelete.id);
      if (response.success) {
        setDeleteModalOpen(false);
        setRoleToDelete(null);
        showNotification('success', t('modals.notifications.success.roleDeleted'), '');
        fetchRoles(); // Refresh the list
      } else {
        showNotification('error', t('modals.notifications.error.roleDeleteFailed'), '');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showNotification('error', t('modals.notifications.error.roleDeleteFailed'), '');
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const handleExportCSV = async () => {
    try {
      // Export CSV côté client avec les données déjà chargées
      const csvContent = generateRolesCSV(filteredRoles);
      const filename = `roles_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Créer le blob et télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('success', 'Export CSV réussi', `${filteredRoles.length} rôles exportés`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showNotification('error', 'Erreur lors de l\'export CSV', '');
    }
  };

  const generateRolesCSV = (roles: Role[]): string => {
    // En-têtes CSV
    const headers = ['Nom', 'Description', 'Permissions', 'Utilisateurs', 'Statut', 'Créé le'];
    
    // Lignes de données
    const rows = roles.map(role => [
      `"${role.name}"`,
      `"${role.description}"`,
      `"${role.permissions.join('; ')}"`,
      role.users.length.toString(),
      role.is_active ? 'Actif' : 'Inactif',
      new Date(role.created_at).toLocaleDateString('fr-FR')
    ]);
    
    // Combiner en-têtes et données
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return csvContent;
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
            {t('roleManagement.title')}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('roleManagement.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className={`grid w-full grid-cols-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <TabsTrigger value="roles">{t('roleManagement.tabs.roles')}</TabsTrigger>
            <TabsTrigger value="permissions">{t('roleManagement.tabs.permissions')}</TabsTrigger>
            <TabsTrigger value="assignments">{t('roleManagement.tabs.assignments')}</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('roleManagement.stats.totalRoles')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {stats.total_roles}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.secondary}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.secondary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('roleManagement.stats.activeRoles')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
                      {stats.active_roles}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.accent}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.accent }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('roleManagement.stats.inactiveRoles')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {stats.inactive_roles}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                    <svg className="w-6 h-6" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('roleManagement.stats.totalPermissions')}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {stats.total_permissions}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Role Management Section */}
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('roleManagement.title')}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('roleManagement.subtitle')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t('roleManagement.actions.searchRole')}
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
                          {t('roleManagement.actions.createRole')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                        <DialogHeader>
                          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                            {t('roleManagement.modals.createRole.title')}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="roleName">{t('roleManagement.modals.createRole.name')}</Label>
                            <Input id="roleName" placeholder="Role name" />
                          </div>
                          <div>
                            <Label htmlFor="roleDescription">{t('roleManagement.modals.createRole.description')}</Label>
                            <Textarea id="roleDescription" placeholder="Role description" />
                          </div>
                          <div>
                            <Label>{t('roleManagement.modals.createRole.permissions')}</Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Checkbox id={`permission-${permission.id}`} />
                                  <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                                    {permission.display_name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                              {t('roleManagement.modals.createRole.cancel')}
                            </Button>
                            <Button 
                              style={{ backgroundColor: colors.primary }}
                              onClick={() => setCreateModalOpen(false)}
                            >
                              {t('roleManagement.modals.createRole.create')}
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

                    <Button variant="outline" onClick={handleExportCSV}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('roleManagement.actions.exportCSV')}
                    </Button>
                  </div>
                </div>

                {/* Role Display */}
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
                              checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
                              onCheckedChange={handleSelectAll}
                                    className="w-5 h-5 rounded-md border-[#6a90b9]"
                            />
                                </div>
                          </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {t('roleManagement.table.name')}
                                </span>
                          </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {t('roleManagement.table.description')}
                                </span>
                          </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {t('roleManagement.table.permissions')}
                                </span>
                          </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {t('roleManagement.table.users')}
                                </span>
                          </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {t('roleManagement.table.status')}
                                </span>
                          </TableHead>
                              <TableHead className="text-center">
                                <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {t('roleManagement.table.actions')}
                                </span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoles.map((role) => (
                              <TableRow 
                                key={role.id} 
                                className="border-b border-[#e2e2ea] hover:bg-[#f9fafb] transition-colors"
                              >
                            <TableCell>
                                  <div className="flex items-center justify-center">
                              <Checkbox
                                checked={selectedRoles.includes(role.id)}
                                onCheckedChange={(checked) => handleRoleSelect(role.id, checked as boolean)}
                                      className="w-5 h-5 rounded-md border-[#6a90b9]"
                              />
                                  </div>
                            </TableCell>
                                <TableCell className="text-center">
                                  <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                              {role.name}
                                  </span>
                            </TableCell>
                                <TableCell className="text-center">
                                  <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#007aff] text-[15px]">
                              {role.description}
                                  </span>
                            </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-wrap justify-center gap-1">
                                {role.permissions.slice(0, 2).map((permission, index) => (
                                      <Badge key={index} variant="outline" className="[font-family:'Urbanist',Helvetica] text-[10px] px-1 py-0.5 bg-[#f3f4f6] text-[#6a90b9] border-[#d1d5db]">
                                    {permission.replace('organization_', '').replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                                {role.permissions.length > 2 && (
                                      <Badge variant="outline" className="[font-family:'Urbanist',Helvetica] text-[10px] px-1 py-0.5 bg-[#f3f4f6] text-[#6a90b9] border-[#d1d5db]">
                                        +{role.permissions.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                                <TableCell className="text-center">
                                  <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                              {role.users.length}
                                  </span>
                            </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={getStatusBadgeVariant(role.is_active)}
                                    className={`[font-family:'Urbanist',Helvetica] text-[12px] px-2 py-1 ${
                                      role.is_active 
                                        ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]' 
                                        : 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
                                    }`}
                                  >
                                {t(`roleManagement.status.${role.is_active ? 'active' : 'inactive'}`)}
                              </Badge>
                            </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditRole(role)}
                                      className="h-8 w-8 p-0 hover:bg-[#f3f4f6]"
                                    >
                                      <svg className="w-4 h-4 text-[#6a90b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                    onClick={() => handleDeleteRole(role)}
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
                    {filteredRoles.map((role) => (
                      <Card key={role.id} className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {role.name}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {role.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRole(role)}
                              className="h-8 w-8 p-0 hover:bg-[#f3f4f6]"
                            >
                              <svg className="w-4 h-4 text-[#6a90b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
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
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Permissions</span>
                            <Badge variant="outline">
                              {role.permissions.length}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Utilisateurs</span>
                            <Badge variant="outline">
                              {role.users.length}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Statut</span>
                            <Badge variant={getStatusBadgeVariant(role.is_active)}>
                              {t(`roleManagement.status.${role.is_active ? 'active' : 'inactive'}`)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {permission.replace('organization_', '').replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedRoles.length} {t('userManagement.actions.selected')}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      {t('roleManagement.actions.previous')}
                    </Button>
                    <Button variant="outline" size="sm">
                      {t('roleManagement.actions.next')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="space-y-6">
              {/* Permissions Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Gestion des Permissions
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Gérez les permissions disponibles pour les rôles
                  </p>
                </div>
              </div>

              {/* Permissions Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {permissions.map((permission) => (
                  <Card key={permission.id} className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {permission.display_name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {permission.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Catégorie</span>
                        <Badge variant="outline">
                          {permission.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nom technique</span>
                        <code className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded`}>
                          {permission.name}
                        </code>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Statut</span>
                        <Badge variant="default">
                          Actif
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Role Assignments
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Role assignment functionality will be implemented here.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Role Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-2xl`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Créer un Nouveau Rôle
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Nom du Rôle</Label>
                <Input 
                  id="role-name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Administrateur" 
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Textarea 
                  id="role-description" 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description du rôle et de ses responsabilités" 
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={formData.permissions.includes(permission.name)}
                        onCheckedChange={() => handlePermissionToggle(permission.name)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                        {permission.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  style={{ backgroundColor: colors.primary }}
                  onClick={handleCreateRole}
                >
                  Créer le Rôle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Role Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-2xl`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Modifier le Rôle
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role-name">Nom du Rôle</Label>
                <Input 
                  id="edit-role-name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Administrateur" 
                />
              </div>
              <div>
                <Label htmlFor="edit-role-description">Description</Label>
                <Textarea 
                  id="edit-role-description" 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description du rôle et de ses responsabilités" 
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-permission-${permission.id}`}
                        checked={formData.permissions.includes(permission.name)}
                        onCheckedChange={() => handlePermissionToggle(permission.name)}
                      />
                      <Label htmlFor={`edit-permission-${permission.id}`} className="text-sm">
                        {permission.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  style={{ backgroundColor: colors.primary }}
                  onClick={handleUpdateRole}
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
          onConfirm={confirmDeleteRole}
          title={t('modals.confirmation.deleteRole.title')}
          message={t('modals.confirmation.deleteRole.message')}
          confirmText={t('modals.confirmation.deleteRole.confirmText')}
          cancelText={t('modals.confirmation.deleteRole.cancelText')}
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
