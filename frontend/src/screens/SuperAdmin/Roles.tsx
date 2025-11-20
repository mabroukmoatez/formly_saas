import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, Role } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { RoleFormModal } from '../../components/SuperAdmin';

export const SuperAdminRoles: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | undefined>();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les rôles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setDeleting(true);
    try {
      await superAdminService.deleteRole(selectedRole.id);
      success('Succès', 'Rôle supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le rôle');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#007aff15' }}>
            <Shield className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Rôles & Permissions
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Gérer les rôles et permissions
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingRoleId(undefined);
          setShowRoleModal(true);
        }} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Shield className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun rôle</p>
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {role.name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {role.slug}
                      </p>
                    </div>
                  </div>
                  {role.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Actif</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactif</span>
                  )}
                </div>
                
                {role.description && (
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {role.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Type:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {role.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Niveau:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {role.level}
                    </span>
                  </div>
                  {role.permissions && (
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permissions:</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {role.permissions.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingRoleId(role.id);
                    setShowRoleModal(true);
                  }} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(role); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedRole(null); }}
        onConfirm={handleDelete}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${selectedRole?.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
      />

      <RoleFormModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRoleId(undefined);
        }}
        onSuccess={() => {
          fetchRoles();
          setShowRoleModal(false);
          setEditingRoleId(undefined);
        }}
        roleId={editingRoleId}
      />
    </section>
  );
};

