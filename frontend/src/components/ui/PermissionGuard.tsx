import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { UnauthorizedMessage } from './UnauthorizedMessage';

interface PermissionGuardProps {
  /**
   * Permission requise pour afficher le contenu
   */
  permission?: string;
  
  /**
   * Permissions alternatives (l'utilisateur doit avoir au moins une)
   */
  anyPermission?: string[];
  
  /**
   * Toutes les permissions requises (l'utilisateur doit avoir toutes)
   */
  allPermissions?: string[];
  
  /**
   * Vérifier si l'utilisateur est Organization Admin
   */
  requireAdmin?: boolean;
  
  /**
   * Contenu à afficher si autorisé
   */
  children: ReactNode;
  
  /**
   * Message personnalisé à afficher si non autorisé
   */
  unauthorizedMessage?: string;
  
  /**
   * Afficher le message de non-autorisation ou simplement masquer le contenu
   */
  showMessage?: boolean;
  
  /**
   * Contenu alternatif à afficher si non autorisé (au lieu du message par défaut)
   */
  fallback?: ReactNode;
}

/**
 * Composant pour protéger le contenu basé sur les permissions
 * 
 * @example
 * // Vérifier une permission unique
 * <PermissionGuard permission="organization_manage_users">
 *   <Button>Créer un utilisateur</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Vérifier plusieurs permissions (au moins une)
 * <PermissionGuard anyPermission={["organization_view_users", "organization_manage_users"]}>
 *   <UserList />
 * </PermissionGuard>
 * 
 * @example
 * // Masquer sans message
 * <PermissionGuard permission="organization_manage_users" showMessage={false}>
 *   <Button>Créer</Button>
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  anyPermission,
  allPermissions,
  requireAdmin = false,
  children,
  unauthorizedMessage,
  showMessage = true,
  fallback,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isOrganizationAdmin } = usePermissions();

  // Vérifier les permissions
  let hasAccess = false;

  if (requireAdmin) {
    hasAccess = isOrganizationAdmin();
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  } else {
    // Si aucune permission n'est spécifiée, autoriser l'accès
    hasAccess = true;
  }

  // Si autorisé, afficher le contenu
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si non autorisé et qu'on ne doit pas afficher de message, ne rien afficher
  if (!showMessage) {
    return null;
  }

  // Si un fallback est fourni, l'utiliser
  if (fallback) {
    return <>{fallback}</>;
  }

  // Afficher le message de non-autorisation
  return <UnauthorizedMessage message={unauthorizedMessage} />;
};

