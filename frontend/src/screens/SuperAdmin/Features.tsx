import React from 'react';
import { Flag } from 'lucide-react';
import { GenericManagementPage } from './GenericManagementPage';

export const Features: React.FC = () => {
  return (
    <GenericManagementPage
      title="Feature Flags"
      description="Enable or disable system features"
      icon={Flag}
      iconColor="text-purple-500"
      buttonText="Add Feature"
      searchPlaceholder="Search features..."
      filters={[
        { value: 'all', label: 'All Features' },
        { value: 'enabled', label: 'Enabled' },
        { value: 'disabled', label: 'Disabled' },
      ]}
    />
  );
};

