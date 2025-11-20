import React from 'react';
import { SuperAdminLayout } from '../../components/SuperAdminDashboard/Layout';
import { SystemSettings } from '../../screens/SuperAdmin';

const SystemSettingsPage: React.FC = () => {
  return (
    <SuperAdminLayout>
      <SystemSettings />
    </SuperAdminLayout>
  );
};

export default SystemSettingsPage;
