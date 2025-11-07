import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { Documents } from '../screens/Quality';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const DocumentsPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager title="Documents Qualité" />
      <QualityLayout>
        <Documents />
      </QualityLayout>
    </>
  );
};

