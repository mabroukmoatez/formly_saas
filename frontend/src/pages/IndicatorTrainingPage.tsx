import React from 'react';
import { IndicatorTraining } from '../screens/Quality/IndicatorTraining';
import { QualityLayout } from '../components/QualityDashboard';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const IndicatorTrainingPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager />
      <QualityLayout>
        <IndicatorTraining />
      </QualityLayout>
    </>
  );
};
