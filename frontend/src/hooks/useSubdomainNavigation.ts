import { useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';

/**
 * Hook for subdomain-aware navigation
 * Automatically handles routing based on organization subdomain
 */
export const useSubdomainNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization, subdomain } = useOrganization();

  const buildRoute = (route: string): string => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // List of known app routes (not subdomains)
    const appRoutes = [
      'login', 'forgot-password', 'white-label', 'gestion-commercial',
      'dashboard', 'course-creation', 'course-edit', 'course-view',
      'mes-factures', 'mes-devis', 'mes-articles', 'charges-depenses',
      'gestion-utilisateurs', 'gestion-roles', 'gestion-organisme',
      'messagerie', 'actualites', 'evenements', 'plannings',
      'rapports-statistiques', 'gestion-formations', 'quiz', 'session-creation',
      'support-tickets', 'profile', 'settings'
    ];
    
    // Check if the first segment is the current subdomain
    const isSubdomainRoute = pathSegments.length > 0 && 
      !appRoutes.includes(pathSegments[0]) &&
      pathSegments[0] === subdomain;
    
    if (isSubdomainRoute) {
      return `/${subdomain}${route}`;
    } else if (subdomain) {
      return `/${subdomain}${route}`;
    } else if (organization?.custom_domain) {
      return `/${organization.custom_domain}${route}`;
    } else {
      return route;
    }
  };

  const navigateToRoute = (route: string) => {
    navigate(buildRoute(route));
  };

  return { navigateToRoute, buildRoute };
};
