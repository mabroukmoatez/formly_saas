import React from 'react';
import { DollarSign } from 'lucide-react';
import { GenericManagementPage } from './GenericManagementPage';

export const Promotions: React.FC = () => {
  return (
    <GenericManagementPage
      title="Promotions"
      description="Manage promotional campaigns and discounts"
      icon={DollarSign}
      iconColor="text-lime-500"
      buttonText="Create Promotion"
      searchPlaceholder="Search promotions..."
      filters={[
        { value: 'all', label: 'All Promotions' },
        { value: 'active', label: 'Active' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'ended', label: 'Ended' },
      ]}
    />
  );
};

