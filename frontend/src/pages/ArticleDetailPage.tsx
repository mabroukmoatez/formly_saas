import React from 'react';
import { ArticleDetail } from '../screens/Quality/ArticleDetail';
import { QualityLayout } from '../components/QualityDashboard/QualityLayout';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const ArticleDetailPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager />
      <QualityLayout>
        <ArticleDetail />
      </QualityLayout>
    </>
  );
};

