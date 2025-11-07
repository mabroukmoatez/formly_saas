import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { BPF } from '../screens/Quality';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const BPFPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager title="Bilan Pédagogique et Financier" />
      <QualityLayout>
        <BPF />
      </QualityLayout>
    </>
  );
};

