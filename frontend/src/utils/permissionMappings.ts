/**
 * Mapping des permissions pour les éléments du sidebar et autres composants
 * Basé sur la documentation des rôles utilisateur
 */

export interface MenuItemPermission {
  /**
   * Permission requise pour afficher cet élément
   */
  permission?: string;
  
  /**
   * Permissions alternatives (au moins une requise)
   */
  anyPermission?: string[];
  
  /**
   * Toutes les permissions requises
   */
  allPermissions?: string[];
  
  /**
   * Requiert Organization Admin
   */
  requireAdmin?: boolean;
}

/**
 * Mapping des permissions pour les éléments du sidebar Commercial
 */
export const COMMERCIAL_SIDEBAR_PERMISSIONS: Record<string, MenuItemPermission> = {
  // Dashboard principal
  dashboard: {
    // Tous les utilisateurs authentifiés peuvent voir le dashboard
  },
  
  // Gestion Commerciale
  'gestion-commerciale': {
    anyPermission: [
      'organization_view_finances',
      'organization_manage_payments',
      'organization_view_reports',
    ],
  },
  'tableau-de-bord': {
    anyPermission: [
      'organization_view_finances',
      'organization_view_reports',
    ],
  },
  'mes-facture': {
    anyPermission: [
      'organization_view_finances',
      'organization_manage_payments',
    ],
  },
  'mes-devis': {
    anyPermission: [
      'organization_view_finances',
      'organization_manage_payments',
    ],
  },
  'mes-article': {
    anyPermission: [
      'organization_view_finances',
      'organization_manage_payments',
    ],
  },
  'charges-depenses': {
    anyPermission: [
      'organization_view_finances',
      'organization_manage_payments',
    ],
  },
  
  // Gestion Administrative
  'gestion-administrative': {
    anyPermission: [
      'organization_manage_users',
      'organization_view_users',
      'organization_manage_settings',
      'organization_view_reports',
    ],
  },
  'gestion-utilisateurs': {
    anyPermission: [
      'organization_manage_users',
      'organization_view_users',
    ],
  },
  'gestion-organisme': {
    permission: 'organization_manage_settings',
  },
  'messagerie': {
    anyPermission: [
      'organization_manage_support',
      'organization_view_support',
    ],
  },
  'actualites': {
    anyPermission: [
      'organization_create_content',
      'organization_edit_content',
      'organization_view_content',
    ],
  },
  'evenements': {
    anyPermission: [
      'organization_create_content',
      'organization_edit_content',
      'organization_view_content',
    ],
  },
  'plannings': {
    anyPermission: [
      'organization_manage_sessions',
      'organization_view_sessions',
    ],
  },
  'rapports-statistiques': {
    permission: 'organization_view_reports',
  },
  
  // Gestion des Formations
  'gestion-formations': {
    anyPermission: [
      'organization_manage_courses',
      'organization_view_courses',
      'organization_manage_sessions',
      'organization_view_sessions',
    ],
  },
  'statistiques': {
    permission: 'organization_view_reports',
  },
  'gestion-formations': {
    anyPermission: [
      'organization_manage_courses',
      'organization_view_courses',
    ],
  },
  'sessions': {
    anyPermission: [
      'organization_manage_sessions',
      'organization_view_sessions',
    ],
  },
  'gestion-quizz': {
    anyPermission: [
      'organization_manage_courses',
      'organization_view_courses',
    ],
  },
  'supports-pedagogiques': {
    anyPermission: [
      'organization_create_content',
      'organization_edit_content',
      'organization_view_content',
    ],
  },
  
  // Parties Prenantes
  'parties-prenantes': {
    anyPermission: [
      'organization_view_users',
      'organization_view_students',
      'organization_manage_students',
    ],
  },
  'formateurs': {
    anyPermission: [
      'organization_view_users',
      'organization_manage_users',
    ],
  },
  'apprenants': {
    anyPermission: [
      'organization_view_students',
      'organization_manage_students',
    ],
  },
  'entreprises': {
    anyPermission: [
      'organization_view_users',
      'organization_view_students',
    ],
  },
  'financeurs': {
    anyPermission: [
      'organization_view_users',
      'organization_view_finances',
    ],
  },
  
  // Gestion Qualité
  'gestion-qualite': {
    anyPermission: [
      'organization_view_content',
      'organization_approve_courses',
      'organization_view_courses',
    ],
  },
  
  // Marque Blanche
  'marque-blanche': {
    permission: 'organization_manage_branding',
  },
};

/**
 * Mapping des permissions pour les éléments du sidebar Quality
 */
export const QUALITY_SIDEBAR_PERMISSIONS: Record<string, MenuItemPermission> = {
  'quality': {
    anyPermission: [
      'organization_view_content',
      'organization_approve_courses',
      'organization_view_courses',
    ],
  },
  'indicateurs': {
    anyPermission: [
      'organization_view_reports',
      'organization_view_courses',
    ],
  },
  'documents': {
    anyPermission: [
      'organization_view_content',
      'organization_create_content',
      'organization_edit_content',
    ],
  },
  'articles': {
    anyPermission: [
      'organization_view_content',
      'organization_create_content',
      'organization_edit_content',
    ],
  },
  'bpf': {
    permission: 'organization_view_reports',
  },
};

/**
 * Vérifie si un élément de menu doit être affiché selon les permissions
 */
export const shouldShowMenuItem = (
  itemId: string,
  permissions: Record<string, MenuItemPermission>,
  hasPermission: (permission: string) => boolean,
  hasAnyPermission: (permissions: string[]) => boolean,
  hasAllPermissions: (permissions: string[]) => boolean,
  isOrganizationAdmin: () => boolean
): boolean => {
  const itemPermission = permissions[itemId];
  
  // Si aucune permission n'est requise, afficher l'élément
  if (!itemPermission) {
    return true;
  }
  
  // Vérifier si Organization Admin est requis
  if (itemPermission.requireAdmin) {
    return isOrganizationAdmin();
  }
  
  // Vérifier une permission unique
  if (itemPermission.permission) {
    return hasPermission(itemPermission.permission);
  }
  
  // Vérifier au moins une permission
  if (itemPermission.anyPermission && itemPermission.anyPermission.length > 0) {
    return hasAnyPermission(itemPermission.anyPermission);
  }
  
  // Vérifier toutes les permissions
  if (itemPermission.allPermissions && itemPermission.allPermissions.length > 0) {
    return hasAllPermissions(itemPermission.allPermissions);
  }
  
  // Par défaut, afficher l'élément
  return true;
};

