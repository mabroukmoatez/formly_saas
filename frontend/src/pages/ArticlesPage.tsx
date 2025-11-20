import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { Articles } from '../screens/Quality/Articles';

export const ArticlesPage: React.FC = () => {
  return (
    <QualityLayout>
      <Articles />
    </QualityLayout>
  );
};
