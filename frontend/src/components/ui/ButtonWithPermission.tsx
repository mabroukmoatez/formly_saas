import React from 'react';
import { Button, ButtonProps } from './button';
import { usePermissions } from '../../hooks/usePermissions';
import { UnauthorizedMessage } from './UnauthorizedMessage';

interface ButtonWithPermissionProps extends ButtonProps {
  /**
   * Permission requise pour afficher le bouton
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
   * Afficher le message de non-autorisation au lieu de masquer le bouton
   */
  showMessage?: boolean;
  
  /**
   * Message personnalisé à afficher si non autorisé
   */
  unauthorizedMessage?: string;
  
  /**
   * Afficher le bouton désactivé au lieu de le masquer
   */
  showDisabled?: boolean;
  
  /**
   * Tooltip à afficher quand le bouton est désactivé
   */
  disabledTooltip?: string;
}

/**
 * Composant Button avec vérification de permissions
 * 
 * @example
 * // Bouton avec permission unique (masqué si non autorisé)
 * <ButtonWithPermission 
 *   permission="organization_manage_users"
 *   onClick={handleCreateUser}
 * >
 *   Créer un utilisateur
 * </ButtonWithPermission>
 * 
 * @example
 * // Bouton qui affiche un message si non autorisé
 * <ButtonWithPermission 
 *   permission="organization_manage_users"
 *   showMessage={true}
 *   onClick={handleCreateUser}
 * >
 *   Créer un utilisateur
 * </ButtonWithPermission>
 * 
 * @example
 * // Bouton désactivé si non autorisé
 * <ButtonWithPermission 
 *   permission="organization_manage_users"
 *   showDisabled={true}
 *   disabledTooltip="Vous n'avez pas la permission de créer des utilisateurs"
 *   onClick={handleCreateUser}
 * >
 *   Créer un utilisateur
 * </ButtonWithPermission>
 */
export const ButtonWithPermission: React.FC<ButtonWithPermissionProps> = ({
  permission,
  anyPermission,
  allPermissions,
  requireAdmin = false,
  showMessage = false,
  unauthorizedMessage,
  showDisabled = false,
  disabledTooltip,
  children,
  onClick,
  disabled,
  ...buttonProps
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

  // Si showDisabled est activé, toujours afficher le bouton mais le désactiver si non autorisé
  if (showDisabled) {
    return (
      <>
        <Button
          {...buttonProps}
          onClick={hasAccess ? onClick : undefined}
          disabled={disabled || !hasAccess}
          title={!hasAccess ? (disabledTooltip || unauthorizedMessage) : buttonProps.title}
          className={`${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''} ${buttonProps.className || ''}`}
        >
          {children}
        </Button>
        {!hasAccess && showMessage && (
          <UnauthorizedMessage message={unauthorizedMessage} size="sm" />
        )}
      </>
    );
  }

  // Si non autorisé et qu'on ne doit pas afficher de message, ne rien afficher
  if (!hasAccess && !showMessage) {
    return null;
  }

  // Si non autorisé et qu'on doit afficher un message
  if (!hasAccess && showMessage) {
    return <UnauthorizedMessage message={unauthorizedMessage} />;
  }

  // Si autorisé, afficher le bouton normalement
  return (
    <Button
      {...buttonProps}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

