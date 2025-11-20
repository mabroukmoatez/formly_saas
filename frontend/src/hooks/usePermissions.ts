import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../config/constants';

/**
 * Hook pour gérer les permissions de l'organisation
 * Basé sur la documentation des rôles utilisateur
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Organization Admin a toutes les permissions
    if (user.is_organization_admin) {
      return true;
    }

    // Vérifier si l'utilisateur a la permission dans sa liste
    return user.permissions?.includes(permission) || false;
  };

  /**
   * Vérifie si l'utilisateur a au moins une des permissions spécifiées
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;

    // Organization Admin a toutes les permissions
    if (user.is_organization_admin) {
      return true;
    }

    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Vérifie si l'utilisateur a toutes les permissions spécifiées
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;

    // Organization Admin a toutes les permissions
    if (user.is_organization_admin) {
      return true;
    }

    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Vérifie si l'utilisateur est Organization Admin
   */
  const isOrganizationAdmin = (): boolean => {
    return user?.is_organization_admin || false;
  };

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;

    // Vérifier dans organization_roles
    const hasOrgRole = user.organization_roles?.some(
      role => role.toLowerCase() === roleName.toLowerCase()
    ) || false;

    // Vérifier dans role_name
    const hasMainRole = user.role_name?.toLowerCase() === roleName.toLowerCase();

    return hasOrgRole || hasMainRole;
  };

  /**
   * Obtient toutes les permissions de l'utilisateur
   */
  const getUserPermissions = (): string[] => {
    return user?.permissions || [];
  };

  /**
   * Obtient tous les rôles de l'utilisateur
   */
  const getUserRoles = (): string[] => {
    const roles: string[] = [];
    
    if (user?.role_name) {
      roles.push(user.role_name);
    }
    
    if (user?.organization_roles) {
      roles.push(...user.organization_roles);
    }
    
    return roles;
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOrganizationAdmin,
    hasRole,
    getUserPermissions,
    getUserRoles,
  };
};

