import { CONFIG } from '../config/constants';

/**
 * Organization URL Management Utilities
 */
export class OrganizationUrlManager {
  /**
   * Get the current organization subdomain from localStorage
   */
  static getStoredSubdomain(): string | null {
    return localStorage.getItem('organization_subdomain');
  }

  /**
   * Set the organization subdomain in localStorage
   */
  static setStoredSubdomain(subdomain: string): void {
    localStorage.setItem('organization_subdomain', subdomain);
  }

  /**
   * Clear the stored organization subdomain
   */
  static clearStoredSubdomain(): void {
    localStorage.removeItem('organization_subdomain');
    localStorage.removeItem('organization_data');
  }

  /**
   * Ensure the current URL includes the organization subdomain
   */
  static ensureOrganizationInUrl(subdomain: string): void {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(part => part);
    
    // Check if subdomain is already in the URL
    if (pathParts.length > 0 && pathParts[0] === subdomain) {
      return; // Already correct
    }
    
    // Remove any existing organization subdomain
    const commonRoutes = ['login', 'forgot-password', 'reset-password', 'dashboard', 'admin', 'instructor', 'student', 'manager'];
    const filteredParts = pathParts.filter(part => !commonRoutes.includes(part) && part !== 'form.fr');
    
    // Add the organization subdomain at the beginning
    const newPath = `/${subdomain}/${filteredParts.join('/')}`;
    
    // Update the URL without causing a page reload
    window.history.replaceState({}, '', newPath);
  }

  /**
   * Navigate to a route within the current organization
   */
  static navigateToOrganizationRoute(route: string, subdomain?: string): void {
    const orgSubdomain = subdomain || this.getStoredSubdomain();
    if (!orgSubdomain) {
      console.warn('No organization subdomain available for navigation');
      return;
    }
    
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    const newPath = `/${orgSubdomain}/${cleanRoute}`;
    
    window.location.href = newPath;
  }

  /**
   * Get the organization-aware URL for a given route
   */
  static getOrganizationUrl(route: string, subdomain?: string): string {
    const orgSubdomain = subdomain || this.getStoredSubdomain();
    if (!orgSubdomain) {
      return route;
    }
    
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    return `/${orgSubdomain}/${cleanRoute}`;
  }

  /**
   * Check if the current URL has an organization subdomain
   */
  static hasOrganizationInUrl(): boolean {
    const pathParts = window.location.pathname.split('/').filter(part => part);
    const commonRoutes = ['login', 'forgot-password', 'reset-password', 'dashboard', 'admin', 'instructor', 'student', 'manager'];
    
    return pathParts.length > 0 && !commonRoutes.includes(pathParts[0]) && pathParts[0] !== 'form.fr';
  }

  /**
   * Extract organization subdomain from current URL
   */
  static extractSubdomainFromUrl(): string | null {
    const pathParts = window.location.pathname.split('/').filter(part => part);
    const commonRoutes = ['login', 'forgot-password', 'reset-password', 'dashboard', 'admin', 'instructor', 'student', 'manager'];
    
    if (pathParts.length > 0 && !commonRoutes.includes(pathParts[0]) && pathParts[0] !== 'form.fr') {
      return pathParts[0];
    }
    
    return null;
  }
}
