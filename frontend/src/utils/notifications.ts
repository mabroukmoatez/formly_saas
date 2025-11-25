/**
 * Notification utility functions
 * These functions provide a simple way to show success and error notifications
 * using the toast system. They can be used outside of React components.
 * 
 * Note: For React components, it's recommended to use the useToast hook directly
 * for better integration with the component lifecycle.
 */

// Global toast functions - will be set by the ToastProvider
let globalToastFunctions: {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
} | null = null;

/**
 * Initialize the global toast functions
 * This should be called by the ToastProvider
 */
export const setGlobalToastFunctions = (functions: {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}) => {
  globalToastFunctions = functions;
};

/**
 * Show a success notification
 */
export const showSuccess = (title: string, message?: string) => {
  if (globalToastFunctions) {
    globalToastFunctions.success(title, message);
  } else {
    // Fallback to console if toast system is not initialized
    console.log(`✅ ${title}${message ? `: ${message}` : ''}`);
  }
};

/**
 * Show an error notification
 */
export const showError = (title: string, message?: string) => {
  if (globalToastFunctions) {
    globalToastFunctions.error(title, message);
  } else {
    // Fallback to console if toast system is not initialized
    console.error(`❌ ${title}${message ? `: ${message}` : ''}`);
  }
};

/**
 * Show a warning notification
 */
export const showWarning = (title: string, message?: string) => {
  if (globalToastFunctions) {
    globalToastFunctions.warning(title, message);
  } else {
    // Fallback to console if toast system is not initialized
    console.warn(`⚠️ ${title}${message ? `: ${message}` : ''}`);
  }
};

/**
 * Show an info notification
 */
export const showInfo = (title: string, message?: string) => {
  if (globalToastFunctions) {
    globalToastFunctions.info(title, message);
  } else {
    // Fallback to console if toast system is not initialized
    console.info(`ℹ️ ${title}${message ? `: ${message}` : ''}`);
  }
};

