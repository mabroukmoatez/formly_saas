/**
 * Centralized API Error Handler
 * 
 * Provides:
 * - Standardized error parsing
 * - User-friendly error messages
 * - Error categorization
 * - Retry logic support
 * - Toast notification integration
 */

import { apiLogger } from './logger';

// ==================== ERROR TYPES ====================

export type ApiErrorCode = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  userMessage: string;
  details?: Record<string, string[]>;
  status?: number;
  retryable: boolean;
  originalError?: unknown;
}

export interface ValidationErrors {
  [field: string]: string[];
}

// ==================== ERROR MESSAGES ====================

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  NETWORK_ERROR: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
  TIMEOUT: 'La requête a pris trop de temps. Veuillez réessayer.',
  UNAUTHORIZED: 'Votre session a expiré. Veuillez vous reconnecter.',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
  NOT_FOUND: 'La ressource demandée n\'existe pas ou a été supprimée.',
  VALIDATION_ERROR: 'Les données saisies sont incorrectes. Veuillez vérifier le formulaire.',
  CONFLICT: 'Cette action entre en conflit avec l\'état actuel des données.',
  RATE_LIMITED: 'Trop de requêtes. Veuillez patienter quelques instants.',
  SERVER_ERROR: 'Une erreur serveur s\'est produite. Veuillez réessayer plus tard.',
  UNKNOWN: 'Une erreur inattendue s\'est produite.',
};

// ==================== ERROR PARSER ====================

/**
 * Parse any error into a standardized ApiError
 */
export function parseApiError(error: unknown): ApiError {
  apiLogger.debug('Parsing error', error);

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createError('NETWORK_ERROR', error);
  }

  // Axios/fetch response errors
  if (isResponseError(error)) {
    return parseResponseError(error);
  }

  // Timeout errors
  if (isTimeoutError(error)) {
    return createError('TIMEOUT', error);
  }

  // Unknown errors
  return createError('UNKNOWN', error, getErrorMessage(error));
}

/**
 * Parse HTTP response errors
 */
function parseResponseError(error: ResponseError): ApiError {
  const status = error.response?.status || error.status;
  const data = error.response?.data || error.data;

  // Extract validation errors if present
  const validationErrors = data?.errors as ValidationErrors | undefined;
  const serverMessage = data?.message || getErrorMessage(error);

  switch (status) {
    case 400:
      return createError('VALIDATION_ERROR', error, serverMessage, validationErrors);
    case 401:
      return createError('UNAUTHORIZED', error);
    case 403:
      return createError('FORBIDDEN', error, serverMessage);
    case 404:
      return createError('NOT_FOUND', error, serverMessage);
    case 409:
      return createError('CONFLICT', error, serverMessage);
    case 422:
      return createError('VALIDATION_ERROR', error, serverMessage, validationErrors);
    case 429:
      return createError('RATE_LIMITED', error);
    case 500:
    case 502:
    case 503:
    case 504:
      return createError('SERVER_ERROR', error);
    default:
      return createError('UNKNOWN', error, serverMessage);
  }
}

// ==================== HELPER FUNCTIONS ====================

function createError(
  code: ApiErrorCode,
  originalError?: unknown,
  customMessage?: string,
  details?: ValidationErrors
): ApiError {
  const userMessage = customMessage || ERROR_MESSAGES[code];
  
  return {
    code,
    message: customMessage || ERROR_MESSAGES[code],
    userMessage,
    details,
    retryable: isRetryable(code),
    originalError,
  };
}

function isRetryable(code: ApiErrorCode): boolean {
  return ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR'].includes(code);
}

function isResponseError(error: unknown): error is ResponseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'status' in error)
  );
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('timeout');
  }
  return false;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur est survenue';
}

interface ResponseError {
  response?: {
    status: number;
    data?: {
      message?: string;
      errors?: ValidationErrors;
    };
  };
  status?: number;
  data?: {
    message?: string;
    errors?: ValidationErrors;
  };
}

// ==================== RETRY LOGIC ====================

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
}

/**
 * Execute an async function with automatic retry on retryable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  
  let lastError: ApiError | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = parseApiError(error);
      
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
      apiLogger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== VALIDATION ERROR HELPERS ====================

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors?: ValidationErrors): string {
  if (!errors) return '';
  
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

/**
 * Get first error for a specific field
 */
export function getFieldError(errors: ValidationErrors | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

/**
 * Check if there are any validation errors
 */
export function hasValidationErrors(errors?: ValidationErrors): boolean {
  return errors ? Object.keys(errors).length > 0 : false;
}

export default parseApiError;


