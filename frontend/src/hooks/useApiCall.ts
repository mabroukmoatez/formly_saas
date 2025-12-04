/**
 * useApiCall - Professional API call hook
 * 
 * Features:
 * - Automatic loading state management
 * - Centralized error handling
 * - Retry support
 * - Toast notifications
 * - TypeScript generics for type safety
 * - Cancellation support
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { parseApiError, withRetry, type ApiError } from '../utils/apiErrorHandler';
import { apiLogger } from '../utils/logger';
import { useToast } from '../components/ui/toast';

// ==================== TYPES ====================

interface UseApiCallOptions {
  /** Show toast on success */
  showSuccessToast?: boolean;
  /** Success message to show */
  successMessage?: string;
  /** Show toast on error */
  showErrorToast?: boolean;
  /** Custom error message (overrides API error message) */
  errorMessage?: string;
  /** Enable automatic retry on retryable errors */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Initial loading state */
  initialLoading?: boolean;
}

interface UseApiCallResult<TData, TParams extends unknown[]> {
  /** Execute the API call */
  execute: (...params: TParams) => Promise<TData | null>;
  /** Whether the call is in progress */
  isLoading: boolean;
  /** Last error that occurred */
  error: ApiError | null;
  /** Last successful data */
  data: TData | null;
  /** Clear the error */
  clearError: () => void;
  /** Reset all state */
  reset: () => void;
}

// ==================== HOOK ====================

export function useApiCall<TData, TParams extends unknown[] = []>(
  apiFunction: (...params: TParams) => Promise<TData>,
  options: UseApiCallOptions = {}
): UseApiCallResult<TData, TParams> {
  const {
    showSuccessToast = false,
    successMessage = 'Opération réussie',
    showErrorToast = true,
    errorMessage,
    enableRetry = false,
    maxRetries = 3,
    initialLoading = false,
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TData | null>(null);
  
  const { success: showSuccess, error: showError } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...params: TParams): Promise<TData | null> => {
      // Cancel any pending request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const endTimer = apiLogger.time('apiCall');

      try {
        let result: TData;

        if (enableRetry) {
          result = await withRetry(() => apiFunction(...params), { maxRetries });
        } else {
          result = await apiFunction(...params);
        }

        if (!isMountedRef.current) return null;

        setData(result);
        setIsLoading(false);
        
        if (showSuccessToast) {
          showSuccess(successMessage);
        }

        apiLogger.info('API call succeeded', { params });
        return result;

      } catch (err) {
        if (!isMountedRef.current) return null;

        const apiError = err instanceof Object && 'code' in err 
          ? err as ApiError 
          : parseApiError(err);
        
        setError(apiError);
        setIsLoading(false);

        if (showErrorToast) {
          showError(errorMessage || apiError.userMessage);
        }

        apiLogger.error('API call failed', apiError);
        return null;

      } finally {
        endTimer();
      }
    },
    [apiFunction, enableRetry, maxRetries, showSuccessToast, successMessage, showErrorToast, errorMessage, showSuccess, showError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    clearError,
    reset,
  };
}

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook for mutation operations (create, update, delete)
 */
export function useMutation<TData, TParams extends unknown[] = []>(
  mutationFn: (...params: TParams) => Promise<TData>,
  options: UseApiCallOptions = {}
): UseApiCallResult<TData, TParams> {
  return useApiCall(mutationFn, {
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });
}

/**
 * Hook for query operations (get, list)
 */
export function useQuery<TData, TParams extends unknown[] = []>(
  queryFn: (...params: TParams) => Promise<TData>,
  options: UseApiCallOptions = {}
): UseApiCallResult<TData, TParams> & { refetch: () => Promise<TData | null> } {
  const lastParamsRef = useRef<TParams | null>(null);
  
  const result = useApiCall(queryFn, {
    showSuccessToast: false,
    showErrorToast: true,
    ...options,
  });

  const execute = useCallback(
    async (...params: TParams) => {
      lastParamsRef.current = params;
      return result.execute(...params);
    },
    [result.execute]
  );

  const refetch = useCallback(async () => {
    if (lastParamsRef.current) {
      return result.execute(...lastParamsRef.current);
    }
    return null;
  }, [result.execute]);

  return {
    ...result,
    execute,
    refetch,
  };
}

// ==================== BATCH OPERATIONS ====================

interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: unknown; error: ApiError }>;
  hasErrors: boolean;
}

/**
 * Execute multiple API calls in parallel with error aggregation
 */
export async function executeBatch<TItem, TResult>(
  items: TItem[],
  operation: (item: TItem) => Promise<TResult>,
  options: { concurrency?: number; stopOnError?: boolean } = {}
): Promise<BatchResult<TResult>> {
  const { concurrency = 5, stopOnError = false } = options;
  
  const successful: TResult[] = [];
  const failed: Array<{ item: TItem; error: ApiError }> = [];

  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    
    const results = await Promise.allSettled(
      batch.map(item => operation(item))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const item = batch[j];

      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        const error = parseApiError(result.reason);
        failed.push({ item, error });
        
        if (stopOnError) {
          return { successful, failed, hasErrors: true };
        }
      }
    }
  }

  return {
    successful,
    failed,
    hasErrors: failed.length > 0,
  };
}

export default useApiCall;


