import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { GestionUtilisateurs } from '../screens/Admin';

const GestionUtilisateursPage = () => {
  return (
    <DashboardLayout>
      <GestionUtilisateurs />
    </DashboardLayout>
  );
};

export default GestionUtilisateursPage;

