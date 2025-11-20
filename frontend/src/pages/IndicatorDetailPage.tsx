import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QualityLayout } from '../components/QualityDashboard';
import { IndicatorDetail } from '../screens/Quality/IndicatorDetail';
import { DocumentTitleManager } from '../components/DocumentTitleManager';

export const IndicatorDetailPage: React.FC = () => {
  return (
    <>
      <DocumentTitleManager title="Détail Indicateur Qualiopi" />
      <QualityLayout>
        <IndicatorDetail />
      </QualityLayout>
    </>
  );
};

