import React from 'react';
import { QualityLayout } from '../components/QualityDashboard/QualityLayout';
import { ActionsAndTasks } from '../screens/Quality/ActionsAndTasks';

export const ActionsAndTasksPage: React.FC = () => {
  return (
    <QualityLayout documentTitle="Les Actions & Tâches">
      <ActionsAndTasks />
    </QualityLayout>
  );
};

