import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/constants';

/**
 * LogoutHandler Component
 * Handles redirection after logout based on organization subdomain
 */
export const LogoutHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  
  // Use auth hook - it will throw if not in provider, which is expected
  // The component should only be rendered inside AuthProvider
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) {
      return;
    }

    // Check if we're on a public route without subdomain
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const publicRoutes = ['login', 'forgot-password', 'reset-password', 'setup-password'];
    const superAdminRoutes = ['superadmin'];
    // Check if it's a public route (either first segment or last segment for subdomain routes)
    const isPublicRoute = pathSegments.length > 0 && (
      publicRoutes.includes(pathSegments[0]) || 
      superAdminRoutes.includes(pathSegments[0]) ||
      (pathSegments.length === 2 && publicRoutes.includes(pathSegments[1])) ||
      location.pathname.includes('/setup-password')
    );
    const isPublicRouteWithoutSubdomain = isPublicRoute && pathSegments.length === 1;

    // Don't redirect if we're already on a public route without subdomain
    if (isPublicRouteWithoutSubdomain) {
      return;
    }
    
    // Don't redirect if we're on a public route with subdomain (e.g., /edufirma/setup-password)
    const pathParts = location.pathname.split('/').filter(part => part);
    const publicRoutesWithSubdomain = pathParts.length === 2 && 
      (pathParts[1] === 'login' || pathParts[1] === 'forgot-password' || pathParts[1] === 'setup-password');
    if (publicRoutesWithSubdomain || location.pathname.includes('/setup-password')) {
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
      // AND we're not already on a login page or setup-password page
      if (customDomain && !location.pathname.includes('/login') && !location.pathname.includes('/setup-password')) {
        hasRedirected.current = true;
        navigate(`/${customDomain}/login`, { replace: true });
      }
    }
    
    // Reset redirect flag when user becomes authenticated
    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  return null; // This component doesn't render anything
};

export default LogoutHandler;
