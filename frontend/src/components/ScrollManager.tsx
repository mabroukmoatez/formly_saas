import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollManager Component
 * Manages scroll behavior based on route type
 * Public routes (landing, signup, login) should be scrollable
 * Dashboard routes should not scroll (handled by their layouts)
 */
export const ScrollManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Public routes that should be scrollable
    const publicRoutes = ['', '/', '/signup', '/login', '/forgot-password', '/reset-password'];
    const isPublicRoute = publicRoutes.includes(pathname) || 
                         (pathSegments.length === 1 && ['login', 'signup', 'forgot-password', 'reset-password'].includes(pathSegments[0]));

    const body = document.body;
    const app = document.getElementById('app');

    if (isPublicRoute) {
      // Enable scrolling for public routes
      body.classList.add('public-route');
      if (app) {
        app.classList.add('public-route');
      }
    } else {
      // Disable scrolling for dashboard routes (they handle their own scroll)
      body.classList.remove('public-route');
      if (app) {
        app.classList.remove('public-route');
      }
    }

    // Cleanup on unmount
    return () => {
      body.classList.remove('public-route');
      if (app) {
        app.classList.remove('public-route');
      }
    };
  }, [location.pathname]);

  return null;
};

