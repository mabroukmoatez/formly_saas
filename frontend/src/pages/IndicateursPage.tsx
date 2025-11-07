import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { Indicateurs } from '../screens/Quality';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const IndicateursPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager title="Indicateurs Qualiopi" />
      <QualityLayout>
        <Indicateurs />
      </QualityLayout>
    </>
  );
};

