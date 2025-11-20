/**
 * Gestionnaire global pour les erreurs de permission
 * Utilise un système d'événements pour déclencher le modal depuis n'importe où
 */

type PermissionErrorHandler = (message?: string) => void;

let permissionErrorHandler: PermissionErrorHandler | null = null;

/**
 * Enregistre le gestionnaire d'erreurs de permission
 * Appelé par le PermissionErrorProvider
 */
export const setPermissionErrorHandler = (handler: PermissionErrorHandler) => {
  permissionErrorHandler = handler;
};

/**
 * Déclenche l'affichage du modal d'erreur de permission
 * Peut être appelé depuis n'importe où (y compris le service API)
 */
export const showPermissionError = (message?: string) => {
  if (permissionErrorHandler) {
    permissionErrorHandler(message);
  } else {
    // Fallback: afficher dans la console si le handler n'est pas encore enregistré
    console.warn('Permission error:', message || 'You do not have permission to perform this action');
  }
};

/**
 * Vérifie si un message d'erreur est une erreur de permission
 */
export const isPermissionError = (message: string): boolean => {
  const permissionKeywords = [
    'do not have permission',
    'n\'avez pas la permission',
    'permission denied',
    'permission refusée',
    'insufficient permissions',
    'permissions insuffisantes',
    'unauthorized',
    'non autorisé',
    'access denied',
    'accès refusé',
  ];

  const lowerMessage = message.toLowerCase();
  return permissionKeywords.some(keyword => lowerMessage.includes(keyword));
};

