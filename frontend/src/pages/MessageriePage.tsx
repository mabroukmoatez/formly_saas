import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { Messagerie } from '../screens/Admin';

const MessageriePage: React.FC = () => {
  return (
    <DashboardLayout>
      <Messagerie />
    </DashboardLayout>
  );
};

export default MessageriePage;

