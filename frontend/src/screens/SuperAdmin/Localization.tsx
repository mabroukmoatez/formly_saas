import React from 'react';
import { Globe } from 'lucide-react';
import { GenericManagementPage } from './GenericManagementPage';

export const Localization: React.FC = () => {
  return (
    <GenericManagementPage
      title="Localization"
      description="Manage system languages and currencies"
      icon={Globe}
      iconColor="text-green-500"
      buttonText="Add Language"
      searchPlaceholder="Search languages..."
      filters={[
        { value: 'all', label: 'All Languages' },
        { value: 'enabled', label: 'Enabled' },
        { value: 'disabled', label: 'Disabled' },
      ]}
    />
  );
};

