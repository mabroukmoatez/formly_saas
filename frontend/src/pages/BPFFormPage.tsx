import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { BPFFormPage as BPFFormPageComponent } from '../screens/Quality/BPFFormPage';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const BPFFormPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager title="BILAN PÉDAGOGIQUE ET FINANCIER" />
      <QualityLayout>
        <BPFFormPageComponent />
      </QualityLayout>
    </>
  );
};

