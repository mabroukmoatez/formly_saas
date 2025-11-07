import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { GestionQualite } from '../screens/Quality';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const QualityPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager title="Gestion Qualité" />
      <QualityLayout>
        <GestionQualite />
      </QualityLayout>
    </>
  );
};

