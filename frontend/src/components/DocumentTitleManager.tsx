import React, { useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';

/**
 * Document Title Manager Component
 * Updates the browser window title based on organization name
 */
export const DocumentTitleManager: React.FC = () => {
  // Use organization hook - it will throw if not in provider, which is expected
  // The component should only be rendered inside OrganizationProvider
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization) {
      document.title = `${organization.organization_name} - LMS Platform`;
    } else {
      document.title = 'Formly - LMS Platform';
    }
  }, [organization]);

  return null; // This component doesn't render anything
};
