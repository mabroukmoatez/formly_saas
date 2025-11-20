import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organization } from '../config/constants';
import { apiService } from '../services/api';
import { OrganizationUrlManager } from '../utils/organizationUrlManager';

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  subdomain: string | null;
  setOrganization: (org: Organization | null) => void;
  refreshOrganization: () => Promise<void>;
  clearOrganization: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  /**
   * Extract subdomain from current URL
   */
  const extractSubdomain = (): string | null => {
    // ('🔍 Extracting subdomain from:', window.location.hostname, window.location.pathname);
    
    // First try to get from URL
    const urlSubdomain = OrganizationUrlManager.extractSubdomainFromUrl();
    // ('📍 URL subdomain detected:', urlSubdomain);
    
    if (urlSubdomain) {
      return urlSubdomain;
    }
    
    // Check if we're on a public route without subdomain - don't use stored subdomain
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(part => part);
    const publicRoutes = ['login', 'forgot-password', 'reset-password', 'signup', 'setup-password'];
    const superAdminRoutes = ['superadmin'];
    // Check if it's a public route (either first segment or last segment for subdomain routes)
    const isPublicRoute = pathParts.length > 0 && (
      publicRoutes.includes(pathParts[0]) || 
      superAdminRoutes.includes(pathParts[0]) ||
      (pathParts.length === 2 && publicRoutes.includes(pathParts[1])) ||
      currentPath.includes('/setup-password')
    );
    
    // If we're on a public route without subdomain in URL, don't use stored subdomain
    if (isPublicRoute && pathParts.length === 1) {
      // ('🚫 Public route without subdomain, not using stored subdomain');
      return null;
    }
    
    // Then try to get from localStorage
    const storedSubdomain = OrganizationUrlManager.getStoredSubdomain();
    // ('💾 Stored subdomain:', storedSubdomain);
    
    if (storedSubdomain) {
      return storedSubdomain;
    }
    
    // Check URL parameters as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');
    // ('🔗 URL param subdomain:', subdomainParam);
    
    if (subdomainParam) {
      return subdomainParam;
    }
    
    // ('❌ No subdomain detected');
    return null;
  };

  /**
   * Fetch organization data by subdomain
   */
  const fetchOrganization = async (subdomain: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const orgData = await apiService.getOrganizationBySubdomain(subdomain);
      setOrganization(orgData);
      
      // Store organization data in localStorage for persistence
      localStorage.setItem('organization_data', JSON.stringify(orgData));
      OrganizationUrlManager.setStoredSubdomain(subdomain);
      
      // Ensure the URL includes the organization subdomain
      OrganizationUrlManager.ensureOrganizationInUrl(subdomain);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization';
      setError(errorMessage);
      // ('Error fetching organization:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh organization data
   */
  const refreshOrganization = async (): Promise<void> => {
    if (subdomain) {
      await fetchOrganization(subdomain);
    }
  };

  /**
   * Clear organization data
   */
  const clearOrganization = (): void => {
    setOrganization(null);
    setSubdomain(null);
    setError(null);
    OrganizationUrlManager.clearStoredSubdomain();
  };

  /**
   * Initialize organization context
   */
  useEffect(() => {
    const initializeOrganization = async () => {
      // Check if we're on a public route first
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const publicRoutes = ['login', 'forgot-password', 'reset-password', 'signup', 'setup-password'];
      const superAdminRoutes = ['superadmin'];
      // Check if it's a public route (either first segment or last segment for subdomain routes)
      const isPublicRoute = pathParts.length > 0 && (
        publicRoutes.includes(pathParts[0]) || 
        superAdminRoutes.includes(pathParts[0]) ||
        (pathParts.length === 2 && publicRoutes.includes(pathParts[1])) ||
        currentPath.includes('/setup-password')
      );
      const isPublicRouteWithoutSubdomain = isPublicRoute && pathParts.length === 1;
      
      // If we're on a public route without subdomain, don't load organization
      if (isPublicRouteWithoutSubdomain) {
        setLoading(false);
        setSubdomain(null);
        setOrganization(null);
        return;
      }
      
      // For public routes with subdomain (e.g., /edufirma/setup-password), allow loading organization
      // but don't force URL changes
      
      const detectedSubdomain = extractSubdomain();
      setSubdomain(detectedSubdomain);
      
      if (detectedSubdomain) {
        // Try to load from localStorage first for faster initial render
        const storedOrg = localStorage.getItem('organization_data');
        if (storedOrg) {
          try {
            const parsedOrg = JSON.parse(storedOrg);
            setOrganization(parsedOrg);
          } catch (err) {
            // ('Failed to parse stored organization data');
          }
        }
        
        // Only ensure URL includes subdomain if we're not on a public route
        if (!isPublicRoute) {
          // Ensure URL includes the organization subdomain
          OrganizationUrlManager.ensureOrganizationInUrl(detectedSubdomain);
        }
        
        // Fetch fresh data from API
        await fetchOrganization(detectedSubdomain);
      } else {
        // No subdomain detected, try to load organization from auth context
        // But only if we're not on a public route
        if (!isPublicRoute) {
          const storedOrg = localStorage.getItem('organization_data');
          if (storedOrg) {
            try {
              const parsedOrg = JSON.parse(storedOrg);
              setOrganization(parsedOrg);
              setLoading(false);
            } catch (err) {
              // ('Failed to parse stored organization data');
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };

    initializeOrganization();
  }, []);

  /**
   * Listen for URL changes to detect subdomain changes
   */
  useEffect(() => {
    let isProcessing = false; // Prevent infinite loops
    
    const handleUrlChange = () => {
      // Prevent infinite loops
      if (isProcessing) {
        return;
      }
      
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const publicRoutes = ['login', 'forgot-password', 'reset-password', 'signup', 'setup-password'];
      const superAdminRoutes = ['superadmin'];
      // Check if it's a public route (either first segment or last segment for subdomain routes)
      const isPublicRoute = pathParts.length > 0 && (
        publicRoutes.includes(pathParts[0]) || 
        superAdminRoutes.includes(pathParts[0]) ||
        (pathParts.length === 2 && publicRoutes.includes(pathParts[1])) ||
        currentPath.includes('/setup-password')
      );
      const isPublicRouteWithoutSubdomain = isPublicRoute && pathParts.length === 1;
      
      // CRITICAL: Don't process URL changes for public routes (with or without subdomain)
      // This prevents any redirection when on /login, /forgot-password, /setup-password, etc.
      if (isPublicRoute) {
        return;
      }
      
      isProcessing = true;
      
      try {
        const newSubdomain = extractSubdomain();
        if (newSubdomain !== subdomain) {
          setSubdomain(newSubdomain);
          if (newSubdomain) {
            // Store the new subdomain in localStorage
            OrganizationUrlManager.setStoredSubdomain(newSubdomain);
            
            // Only ensure URL includes subdomain if we're not on a public route
            if (!isPublicRoute) {
              OrganizationUrlManager.ensureOrganizationInUrl(newSubdomain);
            }
            
            fetchOrganization(newSubdomain);
          }
        }
      } finally {
        isProcessing = false;
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [subdomain]);

  const contextValue: OrganizationContextType = {
    organization,
    loading,
    error,
    subdomain,
    setOrganization,
    refreshOrganization,
    clearOrganization,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

/**
 * Hook to use organization context
 */
export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export default OrganizationContext;
