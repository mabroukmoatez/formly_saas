import React from 'react';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { MesArticles } from '../screens/Admin/MesArticles';

const MesArticlesPage = (): JSX.Element => {
  return (
    <DashboardLayout>
      <MesArticles />
    </DashboardLayout>
  );
};

export default MesArticlesPage;

