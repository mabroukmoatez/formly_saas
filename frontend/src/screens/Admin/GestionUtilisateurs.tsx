import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { apiService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Search, 
  PlusCircle,
  Users,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  X,
  Save,
  Lock
} from 'lucide-react';

export const GestionUtilisateurs = (): JSX.Element => {
  const location = useLocation();
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  
  // Determine initial tab based on URL
  const initialTab = location.pathname.includes('role-management') ? 'roles' : 'users';
  
  // State
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_users: 0, active_users: 0, inactive_users: 0, pending_invitations: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role_id: '',
    phone: '',
    address: '',
    password: '' // Only used for edit modal (optional)
  });

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrganizationUsers({ per_page: 50 });
      if (response.success) {
        setUsers(response.data.users.data || []);
        setStats(response.data.stats || { total_users: 0, active_users: 0, inactive_users: 0, pending_invitations: 0 });
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // Check if it's a 403 Forbidden error
      if (error?.status === 403 || error?.message?.includes('permission') || error?.message?.includes('Access denied')) {
        // Redirect to unauthorized page
        navigate('/unauthorized');
      } else {
        showError('Erreur', 'Impossible de charger les utilisateurs');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiService.getOrganizationRoles();
      if (response.success) {
        setRoles(response.data.roles.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      // Check if it's a 403 Forbidden error
      if (error?.status === 403 || error?.message?.includes('permission') || error?.message?.includes('Only Organization Admins')) {
        // Redirect to unauthorized page
        navigate('/unauthorized');
      }
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    else if (diffDays === 1) return 'Hier';
    else if (diffDays < 7) return `Il y a ${diffDays} jours`;
    else return date.toLocaleDateString('fr-FR');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'active' && user.status === 1) ||
                         (selectedFilter === 'inactive' && user.status === 0);
    return matchesSearch && matchesFilter;
  });

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = async () => {
    try {
      if (!organization?.id) {
        showError('Erreur', 'Organisation non trouvée');
        return;
      }

      if (!userFormData.name || !userFormData.email || !userFormData.role_id) {
        showError('Erreur', 'Veuillez remplir tous les champs requis');
        return;
      }

      // Create user without password - backend will send email invitation
      const response = await apiService.createUser({
        name: userFormData.name,
        email: userFormData.email,
        role_id: parseInt(userFormData.role_id),
        phone: userFormData.phone || undefined,
        address: userFormData.address || undefined,
        organization_id: organization.id, // Always assign organization
        status: 1
      });
      
      if (response.success) {
        success('Succès', 'Utilisateur créé avec succès. Un email d\'invitation a été envoyé pour définir son mot de passe.');
        setShowCreateUserModal(false);
        setUserFormData({ name: '', email: '', role_id: '', phone: '', address: '', password: '' });
        fetchUsers();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la création');
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role_id: user.organization_roles?.[0]?.id?.toString() || '',
      phone: user.phone_number || '',
      address: user.address || '',
      password: '' // Empty for edit - only set if admin wants to change password
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const updateData: any = {
        name: userFormData.name,
        email: userFormData.email,
        role_id: parseInt(userFormData.role_id),
        phone: userFormData.phone,
        address: userFormData.address
      };
      if (userFormData.password) {
        updateData.password = userFormData.password;
      }

      const response = await apiService.updateUser(selectedUser.id, updateData);
      if (response.success) {
        success('Succès', 'Utilisateur mis à jour');
        setShowEditUserModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${user.name}?`)) {
      try {
        const response = await apiService.deleteUser(user.id);
        if (response.success) {
          success('Succès', 'Utilisateur supprimé');
          fetchUsers();
        }
      } catch (error: any) {
        showError('Erreur', error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getUserRoleName = (user: any) => {
    return user.organization_roles?.[0]?.name || 'Aucun rôle';
  };

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
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
            <Users className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Gestion des Utilisateurs & Rôles
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Gérez les utilisateurs et rôles de votre organisation
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => activeTab === 'users' ? setShowCreateUserModal(true) : setShowCreateRoleModal(true)}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <PlusCircle className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              {activeTab === 'users' ? 'Nouvel utilisateur' : 'Nouveau rôle'}
            </span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className={`rounded-[10px] ${activeTab === 'users' ? 'text-white' : ''}`}
          style={activeTab === 'users' ? { backgroundColor: primaryColor } : {}}
        >
          <Users className="w-4 h-4 mr-2" />
          Utilisateurs ({stats.total_users})
        </Button>
        <Button
          variant={activeTab === 'roles' ? 'default' : 'outline'}
          onClick={() => setActiveTab('roles')}
          className={`rounded-[10px] ${activeTab === 'roles' ? 'text-white' : ''}`}
          style={activeTab === 'roles' ? { backgroundColor: primaryColor } : {}}
        >
          <Shield className="w-4 h-4 mr-2" />
          Rôles ({roles.length})
        </Button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards - USERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Total Utilisateurs
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {stats.total_users}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Users className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Utilisateurs Actifs
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {stats.active_users}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-green-500/15"
                  >
                    <UserCheck className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Utilisateurs Inactifs
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {stats.total_users - stats.active_users}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-red-500/15"
                  >
                    <UserX className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Invitations En Attente
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {stats.pending_invitations}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${secondaryColor}15` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: secondaryColor }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('all')}
              className={`rounded-[10px] ${selectedFilter === 'all' ? 'text-white' : ''}`}
              style={selectedFilter === 'all' ? { backgroundColor: primaryColor } : {}}
            >
              Tous ({stats.total_users})
            </Button>
            <Button
              variant={selectedFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('active')}
              className={`rounded-[10px] ${selectedFilter === 'active' ? 'text-white' : ''}`}
              style={selectedFilter === 'active' ? { backgroundColor: primaryColor } : {}}
            >
              Actifs ({stats.active_users})
            </Button>
            <Button
              variant={selectedFilter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('inactive')}
              className={`rounded-[10px] ${selectedFilter === 'inactive' ? 'text-white' : ''}`}
              style={selectedFilter === 'inactive' ? { backgroundColor: primaryColor } : {}}
            >
              Inactifs ({stats.total_users - stats.active_users})
            </Button>
          </div>

          {/* Search Bar */}
          <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] mb-6 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardContent className="p-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'bg-[#f7f9fc] border-[#e8f0f7] placeholder:text-[#6a90b9]'}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id}
                className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        {user.image_url ? (
                          <AvatarImage src={user.image_url} />
                        ) : (
                          <AvatarFallback 
                            className="text-white font-semibold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {getInitials(user.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                          {user.name}
                        </p>
                        <Badge 
                          className={`mt-1 text-xs ${user.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {user.status === 1 ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full"
                    >
                      <MoreVertical className="w-4 h-4" style={{ color: primaryColor }} />
                    </Button>
                  </div>

                  <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                        {user.email}
                      </span>
                    </div>
                    {user.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                          {user.phone_number}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                        {getUserRoleName(user)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: isDark ? '#374151' : '#e8f0f7' }}>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
                        Dernière activité
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#19294a]'}`}>
                        {formatDate(user.updated_at || user.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      onClick={() => handleEditUser(user)}
                      className="flex-1 rounded-[10px] flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </Button>
                    <Button
                      onClick={() => handleDeleteUser(user)}
                      variant="outline"
                      className="rounded-[10px] flex items-center justify-center p-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="py-12 text-center">
                <Users className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                  Aucun utilisateur trouvé
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Stats Cards - ROLES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Total Rôles
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {roles.length}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Shield className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Rôles Personnalisés
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {roles.filter(r => r.is_editable).length}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${secondaryColor}15` }}
                  >
                    <Edit className="w-6 h-6" style={{ color: secondaryColor }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                      Total Utilisateurs
                    </p>
                    <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {stats.total_users}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-green-500/15"
                  >
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] mb-6 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardContent className="p-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
                <Input
                  placeholder="Rechercher un rôle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'bg-[#f7f9fc] border-[#e8f0f7] placeholder:text-[#6a90b9]'}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Roles List */}
          <div className="space-y-4">
            {filteredRoles.map((role) => (
              <Card 
                key={role.id}
                className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Shield className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <CardTitle className={`[font-family:'Poppins',Helvetica] font-semibold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                          {role.name}
                        </CardTitle>
                        <p className={`[font-family:'Poppins',Helvetica] text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {role.permissions?.length || 0} permissions
                      </Badge>
                      {role.is_editable ? (
                        <Button
                          onClick={() => {
                            setSelectedRole(role);
                            setShowEditRoleModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="rounded-[8px] flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </Button>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Système
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
                <CardContent className="pt-4">
                  <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Permissions ({role.permissions?.length || 0})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {role.permissions && role.permissions.map((permission: string, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-[8px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}
                      >
                        <div style={{ color: primaryColor }}>
                          <Shield className="w-3 h-3" />
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <Card className={`border-2 rounded-[18px] shadow-[0px_4px_20px_5px_#09294c12] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardContent className="py-12 text-center">
                <Shield className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                  Aucun rôle trouvé
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className={`w-full max-w-2xl border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Nouvel utilisateur
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateUserModal(false)} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Nom complet *
                  </Label>
                  <Input
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Email *
                  </Label>
                  <Input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="jean@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Rôle *
                </Label>
                <Select value={userFormData.role_id} onValueChange={(value) => setUserFormData({ ...userFormData, role_id: value })}>
                  <SelectTrigger className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Info message about password */}
              <div className={`p-3 rounded-[10px] ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start gap-2">
                  <Mail className={`w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                      Invitation par email
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      Un email sera envoyé à l'utilisateur avec un lien pour créer son mot de passe et se connecter.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Téléphone
                </Label>
                <Input
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </CardContent>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <div className="p-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateUserModal(false)} className="rounded-[10px]">
                Annuler
              </Button>
              <Button onClick={handleCreateUser} className="rounded-[10px] flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                <Save className="w-4 h-4" />
                Créer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className={`w-full max-w-2xl border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Modifier utilisateur
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowEditUserModal(false); setSelectedUser(null); }} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Nom complet *
                  </Label>
                  <Input
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Email *
                  </Label>
                  <Input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Nouveau mot de passe
                  </Label>
                  <Input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Rôle *
                  </Label>
                  <Select value={userFormData.role_id} onValueChange={(value) => setUserFormData({ ...userFormData, role_id: value })}>
                    <SelectTrigger className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Téléphone
                </Label>
                <Input
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                />
              </div>
            </CardContent>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <div className="p-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowEditUserModal(false); setSelectedUser(null); }} className="rounded-[10px]">
                Annuler
              </Button>
              <Button onClick={handleUpdateUser} className="rounded-[10px] flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className={`w-full max-w-2xl border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Nouveau rôle
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateRoleModal(false)} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Nom du rôle *
                </Label>
                <Input
                  className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="Ex: Gestionnaire de contenu"
                />
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Description *
                </Label>
                <Textarea
                  className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="Description du rôle..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Permissions
                </Label>
                <div className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                    Sélectionnez les permissions pour ce rôle
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['users.view', 'users.create', 'users.edit', 'courses.view', 'courses.create', 'content.manage'].map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <div className="p-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateRoleModal(false)} className="rounded-[10px]">
                Annuler
              </Button>
              <Button onClick={() => { success('Succès', 'Rôle créé'); setShowCreateRoleModal(false); }} className="rounded-[10px] flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                <Save className="w-4 h-4" />
                Créer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className={`w-full max-w-2xl border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Modifier le rôle
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowEditRoleModal(false); setSelectedRole(null); }} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Nom du rôle *
                </Label>
                <Input
                  defaultValue={selectedRole.name}
                  className={`rounded-[10px] h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                />
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Description *
                </Label>
                <Textarea
                  defaultValue={selectedRole.description}
                  className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Permissions
                </Label>
                <div className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-[#f7f9fc]'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRole.permissions?.map((perm: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} />
            <div className="p-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowEditRoleModal(false); setSelectedRole(null); }} className="rounded-[10px]">
                Annuler
              </Button>
              <Button onClick={() => { success('Succès', 'Rôle mis à jour'); setShowEditRoleModal(false); setSelectedRole(null); }} className="rounded-[10px] flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
