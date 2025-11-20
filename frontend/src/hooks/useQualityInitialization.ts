import { useState, useEffect } from 'react';
import { checkQualityInitialization, initializeQualitySystem } from '../services/qualityManagement';

/**
 * Hook to check and manage quality system initialization
 * MUST be used before accessing any quality data
 */
export const useQualityInitialization = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      setLoading(true);
      const response: any = await checkQualityInitialization();
      
      console.log('✅ Initialization check response:', response);
      
      // Check if response is null or undefined
      if (!response) {
        console.error('❌ Response is null or undefined');
        setError('Réponse invalide du serveur');
        setLoading(false);
        return;
      }
      
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response keys:', Object.keys(response || {}));
      
      // PRIORITY: Check for ALREADY_INITIALIZED first (even if success is false)
      if (response && (response.error?.code === 'ALREADY_INITIALIZED' || response.code === 'ALREADY_INITIALIZED')) {
        console.log('✅ System already initialized (ALREADY_INITIALIZED detected), setting to true');
        setInitialized(true);
        setError(null);
        return;
      }
      
      // Handle different response formats
      // Format 1: {success: true, data: {initialized: true}}
      if (response && response.success && response.data && typeof response.data.initialized === 'boolean') {
        setInitialized(response.data.initialized);
        setError(null);
      } 
      // Format 2: {initialized: true}
      else if (response && typeof response.initialized === 'boolean') {
        console.log('✅ Direct initialized property found:', response.initialized);
        setInitialized(response.initialized);
        setError(null);
      }
      // Format 3: {success: true, initialized: true}
      else if (response && response.success && typeof response.initialized === 'boolean') {
        console.log('✅ Success with initialized property:', response.initialized);
        setInitialized(response.initialized);
        setError(null);
      }
      // Handle error response (but not ALREADY_INITIALIZED, already handled above)
      else if (response && response.error) {
        console.error('❌ Error in response:', response.error);
        setError(response.error.message || 'Échec de la vérification de l\'état d\'initialisation');
      }
      // Other errors
      else {
        console.error('❌ Unexpected response format:', response);
        setError('Échec de la vérification de l\'état d\'initialisation');
      }
    } catch (err: any) {
      console.error('❌ Failed to check initialization (catch):', err);
      
      // Check if the error response indicates it's already initialized
      const errorCode = err.details?.error?.code || 
                       err.error?.code || 
                       err.code;
      
      if (errorCode === 'ALREADY_INITIALIZED') {
        console.log('✅ System already initialized (from error), setting to true');
        setInitialized(true);
        setError(null);
      } else {
        setError(
          err.details?.error?.message || 
          err.error?.message ||
          err.message || 
          'Impossible de vérifier l\'état d\'initialisation'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const initialize = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response: any = await initializeQualitySystem();
      
      // Check if response is null or undefined
      if (!response) {
        console.error('❌ Response is null or undefined');
        setError('Réponse invalide du serveur');
        return false;
      }
      
      // Handle response from api.ts that returns success: false for 409
      if (response.success) {
        setInitialized(true);
        return true;
      } else {
        // Check if error is because it's already initialized
        const errorCode = response.error?.code;
        if (errorCode === 'ALREADY_INITIALIZED') {
          console.log('✅ System already initialized (from response), setting to true');
          setInitialized(true);
          setError(null);
          return true;
        } else {
          setError(response.error?.message || 'Échec de l\'initialisation du système qualité');
          return false;
        }
      }
    } catch (err: any) {
      console.error('Failed to initialize:', err);
      
      // Check if the error is because it's already initialized
      const errorCode = err.details?.error?.code || 
                       err.error?.code || 
                       err.code ||
                       (err.status === 409 ? 'ALREADY_INITIALIZED' : null);
      
      if (errorCode === 'ALREADY_INITIALIZED' || err.status === 409) {
        console.log('✅ System already initialized (409 Conflict), setting to true');
        setInitialized(true);
        setError(null);
        return true;
      } else {
        setError(
          err.details?.error?.message || 
          err.error?.message ||
          err.message || 
          'Impossible d\'initialiser le système qualité'
        );
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  return { 
    initialized, 
    loading, 
    error, 
    initialize, 
    refetch: checkInitialization 
  };
};

