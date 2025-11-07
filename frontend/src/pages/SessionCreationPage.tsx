import React from 'react';
import { SessionCreation } from '../screens/SessionCreation';

interface SessionCreationPageProps {
  sessionUuid?: string;
}

export const SessionCreationPage: React.FC<SessionCreationPageProps> = ({ sessionUuid }) => {
  return <SessionCreation sessionUuid={sessionUuid} />;
};
