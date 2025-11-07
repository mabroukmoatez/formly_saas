// This file will import and render QuoteCreationContent
// The actual content will be in a separate file to avoid circular dependencies
import React from 'react';
import { QuoteCreationContent } from './QuoteCreationContent';

export const QuoteCreation: React.FC = () => {
  return <QuoteCreationContent />;
};

