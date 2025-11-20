import React from 'react';
import { QualityLayout } from '../components/QualityDashboard';
import { IndicatorSettings } from '../screens/Quality/IndicatorSettings';

export const IndicatorSettingsPage: React.FC = () => {
  return (
    <QualityLayout>
      <IndicatorSettings />
    </QualityLayout>
  );
};

