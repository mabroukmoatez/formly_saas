import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SessionCreation } from '../screens/SessionCreation';

interface SessionCreationPageProps {
  sessionUuid?: string;
}

export const SessionCreationPage: React.FC<SessionCreationPageProps> = ({ sessionUuid }) => {
  const [searchParams] = useSearchParams();
  const courseUuid = searchParams.get('courseUuid') || undefined;
  
  return <SessionCreation sessionUuid={sessionUuid} courseUuid={courseUuid} />;
};
