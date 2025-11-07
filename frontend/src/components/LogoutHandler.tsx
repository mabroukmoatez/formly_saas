import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/constants';

/**
 * LogoutHandler Component
 * Handles redirection after logout based on organization subdomain
 */
export const LogoutHandler: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) {
      return;
    }

    // Only redirect if user is not authenticated (logged out) and we haven't redirected yet
    if (!isAuthenticated && !hasRedirected.current) {
      // Get organization data to determine redirect URL
      const organizationData = localStorage.getItem(CONFIG.STORAGE_KEYS.ORGANIZATION_DATA);
      let customDomain = null;
      
      if (organizationData) {
        try {
          const org = JSON.parse(organizationData);
          customDomain = org.custom_domain;
        } catch (err) {
          console.warn('Failed to parse organization data during logout redirect');
        }
      }
      
      // Only redirect if we have organization data (meaning user was logged in before)
      if (customDomain) {
        hasRedirected.current = true;
        navigate(`/${customDomain}/login`, { replace: true });
      }
    }
    
    // Reset redirect flag when user becomes authenticated
    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, loading, navigate]);

  return null; // This component doesn't render anything
};

export default LogoutHandler;
